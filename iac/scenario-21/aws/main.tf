# 시나리오 21 · 사내 방화벽으로 인터넷 출구 통합 (AWS)
# 사내가 DX로 0/0 광고 → DXGW → TGW 테이블에 전파 → VPC 라우팅 0/0 → TGW. IGW·NAT 없음.

variable "vpc_id" {}
variable "app_route_table_id" {}
variable "subnet_ids" { type = list(string) }
variable "transit_gateway_id" {}
variable "tgw_route_table_id" {}
variable "dx_gateway_attachment_id" {} # TGW의 DXGW 연결
variable "endpoint_sg_id" {}

# TGW 테이블: DXGW 연결에서 BGP로 받은 경로(0/0 포함)를 전파
resource "aws_ec2_transit_gateway_route_table_propagation" "from_dx" {
  transit_gateway_route_table_id = var.tgw_route_table_id
  transit_gateway_attachment_id  = var.dx_gateway_attachment_id
}

# VPC 라우팅 테이블에는 BGP 경로가 들어오지 않는다. 직접 넣는다
resource "aws_route" "default_to_tgw" {
  route_table_id         = var.app_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  transit_gateway_id     = var.transit_gateway_id
}

# 관리형 서비스는 사내를 거치지 않게
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.ap-northeast-2.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [var.app_route_table_id] # 접두사 목록이 0/0보다 구체적
}

resource "aws_vpc_endpoint" "interface" {
  for_each            = toset(["ssm", "ssmmessages", "ec2messages", "logs", "sts"])
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.ap-northeast-2.${each.value}"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.subnet_ids
  security_group_ids  = [var.endpoint_sg_id]
  private_dns_enabled = true
}
# 사내 라우터: DX 전송 VIF와 VPN 모두에서 0.0.0.0/0 광고 (사내 장비 설정)
