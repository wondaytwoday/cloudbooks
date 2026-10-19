# 시나리오 17 · 사내 전용 관리자 페이지 (AWS)
# VPN(TGW) → 내부 ALB(사내 대역만) → admin 앱 → DB(앱만), 비공개 호스팅 영역 + Resolver 인바운드

variable "vpc_id" {}
variable "private_subnet_ids" { type = list(string) }
variable "app_route_table_id" {}
variable "transit_gateway_id" {}
variable "certificate_arn" {}

locals {
  corp_cidr = "192.168.0.0/16"
}

resource "aws_customer_gateway" "corp" {
  bgp_asn    = 65010
  ip_address = "203.0.113.10"
  type       = "ipsec.1"
}

resource "aws_vpn_connection" "corp" {
  customer_gateway_id = aws_customer_gateway.corp.id
  transit_gateway_id  = var.transit_gateway_id
  type                = "ipsec.1"
  # 터널 2개가 자동 생성됨. 사내 장비에 둘 다 설정
}

# 응답이 사내로 돌아가는 경로
resource "aws_route" "to_corp" {
  route_table_id         = var.app_route_table_id
  destination_cidr_block = local.corp_cidr
  transit_gateway_id     = var.transit_gateway_id
}

resource "aws_security_group" "alb" {
  name   = "sg-admin-alb"
  vpc_id = var.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "alb_from_corp" {
  security_group_id = aws_security_group.alb.id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = local.corp_cidr
}

resource "aws_lb" "admin" {
  name               = "admin-internal"
  internal           = true # 사설 IP만
  load_balancer_type = "application"
  subnets            = var.private_subnet_ids
  security_groups    = [aws_security_group.alb.id]
}

resource "aws_lb_listener" "admin" {
  load_balancer_arn = aws_lb.admin.arn
  port              = 443
  protocol          = "HTTPS"
  certificate_arn   = var.certificate_arn # 사내 도메인용 인증서 (ACM 사설 CA 또는 공인)
  default_action {
    type             = "forward"
    target_group_arn = "arn:aws:elasticloadbalancing:...:targetgroup/admin" # 대상 그룹 생략
  }
}

# 비공개 호스팅 영역: VPC에서만 보임
resource "aws_route53_zone" "corp" {
  name = "corp.example.com"
  vpc {
    vpc_id = var.vpc_id
  }
}

resource "aws_route53_record" "admin" {
  zone_id = aws_route53_zone.corp.zone_id
  name    = "admin.corp.example.com"
  type    = "A"
  alias {
    name                   = aws_lb.admin.dns_name
    zone_id                = aws_lb.admin.zone_id
    evaluate_target_health = true
  }
}

# 사내 DNS가 조건부 전달할 입구
resource "aws_security_group" "resolver" {
  name   = "sg-resolver-inbound"
  vpc_id = var.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "dns" {
  for_each          = toset(["tcp", "udp"])
  security_group_id = aws_security_group.resolver.id
  ip_protocol       = each.value
  from_port         = 53
  to_port           = 53
  cidr_ipv4         = local.corp_cidr
}

resource "aws_route53_resolver_endpoint" "inbound" {
  name               = "corp-inbound"
  direction          = "INBOUND"
  security_group_ids = [aws_security_group.resolver.id]
  ip_address {
    subnet_id = var.private_subnet_ids[0]
    ip        = "10.20.0.10"
  }
  ip_address {
    subnet_id = var.private_subnet_ids[1]
    ip        = "10.20.1.10"
  }
}
