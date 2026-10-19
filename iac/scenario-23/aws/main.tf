# 시나리오 23 · 사내 서버가 전용선으로 관리형 서비스 쓰기 (AWS)
# 사내용 S3 인터페이스 엔드포인트(게이트웨이 엔드포인트는 사내에서 못 씀) + Resolver 인바운드

variable "vpc_id" {}
variable "subnet_ids" { type = list(string) }
variable "endpoint_sg_id" {} # 443 ← 192.168.30.0/24
variable "resolver_sg_id" {} # 53 ← 192.168.0.0/16

resource "aws_vpc_endpoint" "s3_interface" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.ap-northeast-2.s3"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.subnet_ids
  security_group_ids  = [var.endpoint_sg_id]
  private_dns_enabled = true
  dns_options {
    # VPC 안은 게이트웨이 엔드포인트를 계속 쓰고, Resolver 인바운드로 들어온 사내 질의만 인터페이스 IP로
    private_dns_only_for_inbound_resolver_endpoint = true
  }
}

resource "aws_vpc_endpoint" "secrets" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.ap-northeast-2.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.subnet_ids
  security_group_ids  = [var.endpoint_sg_id]
  private_dns_enabled = true
}

resource "aws_route53_resolver_endpoint" "inbound" {
  name               = "corp-inbound"
  direction          = "INBOUND"
  security_group_ids = [var.resolver_sg_id]
  ip_address {
    subnet_id = var.subnet_ids[0]
  }
  ip_address {
    subnet_id = var.subnet_ids[1]
  }
}
# 사내 DNS: s3.ap-northeast-2.amazonaws.com, secretsmanager..., *.rds.amazonaws.com → 인바운드 IP로 조건부 전달
