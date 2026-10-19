# 시나리오 25 · 전용선 하나로 여러 리전·여러 VPC 연결 (AWS)
# 전역 DX 게이트웨이에 서울·도쿄 TGW를 연결, 리전 간은 TGW 피어링

variable "tgw_seoul_id" {}
variable "tgw_tokyo_id" {}
variable "tokyo_account_id" {}

resource "aws_dx_gateway" "corp" {
  name            = "dxgw-corp"
  amazon_side_asn = "64512"
}

resource "aws_dx_gateway_association" "seoul" {
  dx_gateway_id         = aws_dx_gateway.corp.id
  associated_gateway_id = var.tgw_seoul_id
  allowed_prefixes      = ["10.20.0.0/16"]
}

resource "aws_dx_gateway_association" "tokyo" {
  dx_gateway_id         = aws_dx_gateway.corp.id
  associated_gateway_id = var.tgw_tokyo_id
  allowed_prefixes      = ["10.40.0.0/16"]
}

# DXGW는 TGW 사이 트래픽을 전달하지 않는다 → 리전 간은 TGW 피어링
resource "aws_ec2_transit_gateway_peering_attachment" "seoul_tokyo" {
  transit_gateway_id      = var.tgw_seoul_id
  peer_transit_gateway_id = var.tgw_tokyo_id
  peer_region             = "ap-northeast-1"
  peer_account_id         = var.tokyo_account_id
}
# 도쿄 쪽 aws_ec2_transit_gateway_peering_attachment_accepter와 양쪽 정적 경로(aws_ec2_transit_gateway_route)는 생략
