# 시나리오 16 · 개발·운영 분리와 공용 서비스 (AWS)
# shared 계정의 Transit Gateway, 연결마다 다른 TGW 라우팅 테이블로 dev ↔ prod 차단
# 각 VPC·서브넷은 다른 계정에 있다고 가정하고 ID를 변수로 받는다.

variable "vpc_ids" { type = map(string) }          # { shared = "...", dev = "...", prod = "..." }
variable "tgw_subnet_ids" { type = map(list(string)) } # VPC마다 AZ별 연결 서브넷
variable "route_table_ids" { type = map(string) }

resource "aws_ec2_transit_gateway" "hub" {
  description                     = "env hub"
  default_route_table_association = "disable" # 연결마다 테이블을 직접 지정
  default_route_table_propagation = "disable" # 켜 두면 모든 VPC가 서로를 알게 됨
}

resource "aws_ram_resource_share" "tgw" {
  name                      = "tgw-share"
  allow_external_principals = false
}

resource "aws_ram_resource_association" "tgw" {
  resource_arn       = aws_ec2_transit_gateway.hub.arn
  resource_share_arn = aws_ram_resource_share.tgw.arn
}

resource "aws_ec2_transit_gateway_vpc_attachment" "this" {
  for_each                                        = var.vpc_ids
  transit_gateway_id                              = aws_ec2_transit_gateway.hub.id
  vpc_id                                          = each.value
  subnet_ids                                      = var.tgw_subnet_ids[each.key]
  transit_gateway_default_route_table_association = false
  transit_gateway_default_route_table_propagation = false
}

resource "aws_ec2_transit_gateway_route_table" "this" {
  for_each           = var.vpc_ids # tgw-rt-shared, tgw-rt-dev, tgw-rt-prod
  transit_gateway_id = aws_ec2_transit_gateway.hub.id
}

resource "aws_ec2_transit_gateway_route_table_association" "this" {
  for_each                       = var.vpc_ids
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.this[each.key].id
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.this[each.key].id
}

# 전파 정책이 곧 분리 정책: dev·prod 테이블에는 shared만, shared 테이블에는 dev·prod
locals {
  propagations = {
    "dev-shared"  = { table = "dev", from = "shared" }
    "prod-shared" = { table = "prod", from = "shared" }
    "shared-dev"  = { table = "shared", from = "dev" }
    "shared-prod" = { table = "shared", from = "prod" }
  }
}

resource "aws_ec2_transit_gateway_route_table_propagation" "this" {
  for_each                       = local.propagations
  transit_gateway_route_table_id = aws_ec2_transit_gateway_route_table.this[each.value.table].id
  transit_gateway_attachment_id  = aws_ec2_transit_gateway_vpc_attachment.this[each.value.from].id
}

# VPC 쪽 라우팅: dev·prod는 사설 대역 전체를 TGW로, shared는 dev·prod 대역을 TGW로
resource "aws_route" "dev_to_tgw" {
  route_table_id         = var.route_table_ids["dev"]
  destination_cidr_block = "10.0.0.0/8"
  transit_gateway_id     = aws_ec2_transit_gateway.hub.id
}

resource "aws_route" "prod_to_tgw" {
  route_table_id         = var.route_table_ids["prod"]
  destination_cidr_block = "10.0.0.0/8"
  transit_gateway_id     = aws_ec2_transit_gateway.hub.id
}

resource "aws_route" "shared_to_env" {
  for_each               = { dev = "10.10.0.0/16", prod = "10.20.0.0/16" }
  route_table_id         = var.route_table_ids["shared"]
  destination_cidr_block = each.value
  transit_gateway_id     = aws_ec2_transit_gateway.hub.id
}

# 운영 앱은 CI 서브넷에서 오는 22·443만 (다른 VPC는 CIDR로 지정)
resource "aws_security_group" "prod_app" {
  name   = "sg-prod-app"
  vpc_id = var.vpc_ids["prod"]
}

resource "aws_vpc_security_group_ingress_rule" "prod_from_ci" {
  for_each          = toset(["22", "443"])
  security_group_id = aws_security_group.prod_app.id
  ip_protocol       = "tcp"
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
  cidr_ipv4         = "10.0.1.0/24"
}
