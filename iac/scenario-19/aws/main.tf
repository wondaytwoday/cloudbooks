# 시나리오 19 · 서비스 간 내부 통신 (AWS)
# 같은 VPC: 보안 그룹 참조 / 다른 팀 VPC: NLB + 엔드포인트 서비스 ← 인터페이스 엔드포인트

variable "orders_vpc_id" {}
variable "orders_subnet_ids" { type = list(string) }
variable "payments_nlb_arn" {}
variable "orders_account_id" {}

# --- 주문팀: 서비스마다 보안 그룹, 출처를 보안 그룹으로 지정
resource "aws_security_group" "order" {
  name   = "sg-order"
  vpc_id = var.orders_vpc_id
}

resource "aws_security_group" "inventory" {
  name   = "sg-inventory"
  vpc_id = var.orders_vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "inventory_from_order" {
  security_group_id            = aws_security_group.inventory.id
  ip_protocol                  = "tcp"
  from_port                    = 8080
  to_port                      = 8080
  referenced_security_group_id = aws_security_group.order.id
}

# --- 결제팀: NLB 뒤 서비스를 엔드포인트 서비스로 게시
resource "aws_vpc_endpoint_service" "payments" {
  network_load_balancer_arns = [var.payments_nlb_arn]
  acceptance_required        = true
  allowed_principals         = ["arn:aws:iam::${var.orders_account_id}:root"]
}

# --- 주문팀: 자기 VPC 안에 인터페이스 엔드포인트 (대역이 겹쳐도 됨)
resource "aws_security_group" "vpce" {
  name   = "sg-payments-endpoint"
  vpc_id = var.orders_vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "vpce_from_order" {
  security_group_id            = aws_security_group.vpce.id
  ip_protocol                  = "tcp"
  from_port                    = 443
  to_port                      = 443
  referenced_security_group_id = aws_security_group.order.id
}

resource "aws_vpc_endpoint" "payments" {
  vpc_id             = var.orders_vpc_id
  service_name       = aws_vpc_endpoint_service.payments.service_name
  vpc_endpoint_type  = "Interface"
  subnet_ids         = var.orders_subnet_ids
  security_group_ids = [aws_security_group.vpce.id]
}
