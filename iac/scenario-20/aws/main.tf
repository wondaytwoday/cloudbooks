# 시나리오 20 · 관리형 서비스로 가는 비공개 경로 (AWS)
# 인터넷 출구 없는 VPC: S3 게이트웨이(정책으로 반출 방지) + 인터페이스 엔드포인트(비공개 DNS)

variable "vpc_id" {}
variable "subnet_ids" { type = list(string) }
variable "route_table_ids" { type = list(string) }
variable "worker_sg_id" {}
data "aws_caller_identity" "me" {}

locals {
  region = "ap-northeast-2"
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = var.vpc_id
  service_name      = "com.amazonaws.${local.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = var.route_table_ids
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { # 우리 계정 버킷만
        Effect    = "Allow", Principal = "*", Action = "s3:*", Resource = "*"
        Condition = { StringEquals = { "aws:ResourceAccount" = data.aws_caller_identity.me.account_id } }
      },
      { # ECR 이미지 레이어
        Effect = "Allow", Principal = "*", Action = "s3:GetObject"
        Resource = "arn:aws:s3:::prod-${local.region}-starport-layer-bucket/*"
      }
    ]
  })
}

resource "aws_security_group" "endpoints" {
  name   = "sg-endpoints"
  vpc_id = var.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "https_from_workers" {
  security_group_id            = aws_security_group.endpoints.id
  ip_protocol                  = "tcp"
  from_port                    = 443
  to_port                      = 443
  referenced_security_group_id = var.worker_sg_id
}

resource "aws_vpc_endpoint" "interface" {
  for_each            = toset(["secretsmanager", "ecr.api", "ecr.dkr", "logs", "sts"])
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${local.region}.${each.value}"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.subnet_ids
  security_group_ids  = [aws_security_group.endpoints.id]
  private_dns_enabled = true # 기본 서비스 이름이 엔드포인트 IP로 풀림
}

# 버킷 쪽 조건: 이 엔드포인트를 거친 요청만
resource "aws_s3_bucket_policy" "data" {
  bucket = "batch-data-${data.aws_caller_identity.me.account_id}"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Deny", Principal = "*", Action = "s3:*"
      Resource  = ["arn:aws:s3:::batch-data-${data.aws_caller_identity.me.account_id}", "arn:aws:s3:::batch-data-${data.aws_caller_identity.me.account_id}/*"]
      Condition = { StringNotEquals = { "aws:SourceVpce" = aws_vpc_endpoint.s3.id } }
    }]
  })
}
