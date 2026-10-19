data "aws_organizations_organization" "current" {}

# S3 게이트웨이 엔드포인트: 우리 조직 계정의 버킷에만 접근 허용
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.ap-northeast-2.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:*"
      Resource  = "*"
      Condition = { StringEquals = { "aws:ResourceOrgID" = data.aws_organizations_organization.current.id } }
    }]
  })
}

# 고객 관리형 키: 자동 교체, 삭제 대기 30일
resource "aws_kms_key" "data" {
  description             = "business-data"
  enable_key_rotation     = true
  deletion_window_in_days = 30
}

# 업무 데이터 버킷: 우리 VPC 엔드포인트를 거치지 않은 요청은 거부
resource "aws_s3_bucket" "data" {
  bucket = "bank-data-example"
}

resource "aws_s3_bucket_policy" "data" {
  bucket = aws_s3_bucket.data.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "OnlyViaVpce"
      Effect    = "Deny"
      Principal = "*"
      Action    = "s3:*"
      Resource  = [aws_s3_bucket.data.arn, "${aws_s3_bucket.data.arn}/*"]
      Condition = { StringNotEquals = { "aws:SourceVpce" = aws_vpc_endpoint.s3.id } }
    }]
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.data.arn
    }
    bucket_key_enabled = true
  }
}

# 감사 로그 버킷: 객체 잠금 규정 준수 모드 5년
resource "aws_s3_bucket" "audit" {
  bucket              = "bank-audit-example"
  object_lock_enabled = true
}

resource "aws_s3_bucket_object_lock_configuration" "audit" {
  bucket = aws_s3_bucket.audit.id
  rule {
    default_retention {
      mode  = "COMPLIANCE"
      years = 5
    }
  }
}

# Network Firewall 도메인 허용 목록, KMS·SSM 인터페이스 엔드포인트, Session Manager 로그 설정은 생략
