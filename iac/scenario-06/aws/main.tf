# 전용선: Direct Connect 게이트웨이를 Transit Gateway에 연결
resource "aws_dx_gateway" "main" {
  name            = "corp-dxgw"
  amazon_side_asn = "64512"
}

resource "aws_dx_gateway_association" "tgw" {
  dx_gateway_id         = aws_dx_gateway.main.id
  associated_gateway_id = aws_ec2_transit_gateway.hub.id
  allowed_prefixes      = ["10.32.0.0/12"] # 사내로 광고할 클라우드 대역만
}

# 백업: Transit Gateway에 붙는 Site-to-Site VPN (터널 2개, BGP)
resource "aws_customer_gateway" "corp" {
  bgp_asn    = 65010
  ip_address = "203.0.113.10"
  type       = "ipsec.1"
}

resource "aws_vpn_connection" "backup" {
  customer_gateway_id = aws_customer_gateway.corp.id
  transit_gateway_id  = aws_ec2_transit_gateway.hub.id
  type                = "ipsec.1"
  static_routes_only  = false
}

resource "aws_ec2_transit_gateway" "hub" {
  amazon_side_asn                 = 64513
  vpn_ecmp_support                = "enable" # 여러 VPN 터널에 부하 분산
  default_route_table_association = "disable"
  default_route_table_propagation = "disable"
}

# DNS: 클라우드 → 사내 도메인 전달
resource "aws_route53_resolver_endpoint" "outbound" {
  name               = "to-corp"
  direction          = "OUTBOUND"
  security_group_ids = [aws_security_group.resolver.id]

  ip_address {
    subnet_id = aws_subnet.private[0].id
  }
  ip_address {
    subnet_id = aws_subnet.private[1].id
  }
}

resource "aws_route53_resolver_rule" "corp" {
  domain_name          = "corp.example.local"
  rule_type            = "FORWARD"
  resolver_endpoint_id = aws_route53_resolver_endpoint.outbound.id

  target_ip {
    ip = "10.0.0.53"
  }
}

# 인바운드 엔드포인트(사내 → VPC 비공개 영역), DX 전용 연결·가상 인터페이스, BFD 설정은 생략
