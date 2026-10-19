# 시나리오 24 · 클라우드 대역이 사내와 겹칠 때 (AWS)
# 보조 CIDR(출입문) + 사설 NAT 게이트웨이, DXGW 허용 접두사는 출입문 대역만

variable "vpc_id" {}
variable "work_route_table_id" {}
variable "door_route_table_id" {}
variable "transit_gateway_id" {}
variable "dx_gateway_id" {}

resource "aws_vpc_ipv4_cidr_block_association" "door" {
  vpc_id     = var.vpc_id
  cidr_block = "100.64.10.0/24" # 사내 어디와도 겹치지 않는 대역
}

resource "aws_subnet" "door" {
  for_each          = { a = "100.64.10.0/25", c = "100.64.10.128/25" }
  vpc_id            = var.vpc_id
  availability_zone = "ap-northeast-2${each.key}"
  cidr_block        = each.value
  depends_on        = [aws_vpc_ipv4_cidr_block_association.door]
}

resource "aws_nat_gateway" "private" {
  connectivity_type = "private" # EIP 없음
  subnet_id         = aws_subnet.door["a"].id
}

resource "aws_route" "work_to_corp" {
  route_table_id         = var.work_route_table_id
  destination_cidr_block = "172.16.0.0/12"
  nat_gateway_id         = aws_nat_gateway.private.id
}

resource "aws_route" "door_to_corp" {
  route_table_id         = var.door_route_table_id
  destination_cidr_block = "172.16.0.0/12"
  transit_gateway_id     = var.transit_gateway_id
}

# TGW 연결은 출입문 서브넷에만 → TGW에 전파되는 VPC 대역도 확인
resource "aws_ec2_transit_gateway_vpc_attachment" "acq" {
  transit_gateway_id = var.transit_gateway_id
  vpc_id             = var.vpc_id
  subnet_ids         = [for s in aws_subnet.door : s.id]
}
# 주의: VPC 연결은 VPC의 모든 CIDR을 전파한다. 10.10.0.0/16이 TGW 테이블에 들어가지 않도록
# 전파 대신 정적 경로(100.64.10.0/24 → 이 연결)를 쓰고, DXGW 허용 접두사도 출입문 대역만 둔다.
resource "aws_dx_gateway_association" "acq" {
  dx_gateway_id         = var.dx_gateway_id
  associated_gateway_id = var.transit_gateway_id
  allowed_prefixes      = ["100.64.10.0/24"]
}
