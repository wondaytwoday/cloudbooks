# 시나리오 18 · 파트너가 고정 IP를 요구할 때 (AWS)
# AZ마다 EIP + NAT 게이트웨이, AZ별 앱 라우팅, ALB 보안 그룹으로 웹훅 출처 제한

variable "vpc_id" {}
variable "public_subnet_ids" { type = map(string) } # { a = "...", c = "..." }
variable "app_route_table_ids" { type = map(string) }

locals {
  partner_cidr = "203.0.113.0/28"
}

# 파트너에 등록하는 IP: NAT와 분리된 리소스로 두고 삭제를 막는다
resource "aws_eip" "nat" {
  for_each = var.public_subnet_ids
  domain   = "vpc"
  tags     = { Name = "nat-${each.key}", RegisteredWith = "payment-partner" }
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_nat_gateway" "nat" {
  for_each      = var.public_subnet_ids
  subnet_id     = each.value
  allocation_id = aws_eip.nat[each.key].id
}

resource "aws_route" "app_default" {
  for_each               = var.app_route_table_ids
  route_table_id         = each.value
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat[each.key].id # 같은 AZ의 NAT
}

resource "aws_security_group" "alb" {
  name   = "sg-webhook-alb"
  vpc_id = var.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "partner" {
  security_group_id = aws_security_group.alb.id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = local.partner_cidr
}

output "register_with_partner" {
  value = [for e in aws_eip.nat : e.public_ip]
}
