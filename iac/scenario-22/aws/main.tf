# 시나리오 22 · 전용선 이중화와 장애 전환 (AWS)
# 위치가 다른 전용 연결 2개 → 전송 VIF 2개 → DX 게이트웨이 → TGW, VPN 연결은 최종 백업
# 경로 우선순위는 사내 라우터 정책(local-pref, 커뮤니티 7224:7300/7100)으로 정한다.

variable "connection_ids" { type = map(string) } # { a = "dxcon-...", b = "dxcon-..." }
variable "transit_gateway_id" {}

resource "aws_dx_gateway" "main" {
  name            = "dxgw-corp"
  amazon_side_asn = "64512"
}

resource "aws_dx_transit_virtual_interface" "vif" {
  for_each       = var.connection_ids
  connection_id  = each.value
  dx_gateway_id  = aws_dx_gateway.main.id
  name           = "tvif-${each.key}"
  vlan           = each.key == "a" ? 101 : 102
  address_family = "ipv4"
  bgp_asn        = 65010 # 사내 ASN
  mtu            = 8500
  # BFD는 사내 라우터에서 켜면 비동기 BFD로 동작한다
}

resource "aws_dx_gateway_association" "tgw" {
  dx_gateway_id         = aws_dx_gateway.main.id
  associated_gateway_id = var.transit_gateway_id
  allowed_prefixes      = ["10.20.0.0/16"] # 사내에 광고할 대역
}

resource "aws_customer_gateway" "corp" {
  bgp_asn    = 65010
  ip_address = "203.0.113.10"
  type       = "ipsec.1"
}

# 같은 접두사면 TGW는 DXGW 경로를 VPN 경로보다 먼저 쓴다
resource "aws_vpn_connection" "backup" {
  customer_gateway_id = aws_customer_gateway.corp.id
  transit_gateway_id  = var.transit_gateway_id
  type                = "ipsec.1"
}
