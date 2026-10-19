# 시나리오 26 · 전용선 구간 암호화 (AWS)
# ① MACsec: 전용 연결 포트에 키 연결  ② 전송 VIF 위 TGW 사설 IP VPN

variable "connection_id" {}       # MACsec 지원 전용 연결
variable "secret_arn_cak" {}      # CKN/CAK를 담은 Secrets Manager 시크릿
variable "transit_gateway_id" {}
variable "dx_gateway_attachment_id" {}

resource "aws_dx_macsec_key_association" "main" {
  connection_id = var.connection_id
  secret_arn    = var.secret_arn_cak
}
# 연결의 encryption_mode = "must_encrypt" 로 평문 전송을 막는다 (aws_dx_connection)

resource "aws_customer_gateway" "corp_private" {
  bgp_asn    = 65010
  ip_address = "192.168.255.10" # 사내 라우터의 사설 주소
  type       = "ipsec.1"
}

resource "aws_vpn_connection" "over_dx" {
  customer_gateway_id                     = aws_customer_gateway.corp_private.id
  transit_gateway_id                      = var.transit_gateway_id
  type                                    = "ipsec.1"
  outside_ip_address_type                 = "PrivateIpv4"
  transport_transit_gateway_attachment_id = var.dx_gateway_attachment_id # 전송 VIF 경로 위로
}
