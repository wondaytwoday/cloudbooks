resource "aws_s3_bucket" "lake" {
  bucket = "shop-lake-example"
}

# 오래된 원본은 싼 저장 계층으로, 3년 뒤 삭제
resource "aws_s3_bucket_lifecycle_configuration" "lake" {
  bucket = aws_s3_bucket.lake.id

  rule {
    id     = "raw-tiering"
    status = "Enabled"
    filter {
      prefix = "raw/"
    }
    transition {
      days          = 90
      storage_class = "GLACIER_IR"
    }
    expiration {
      days = 1095
    }
  }
}

resource "aws_glue_catalog_database" "curated" {
  name = "curated"
}

# 분석가 역할: 고객 테이블에서 전화번호·주소 열을 제외하고 SELECT
resource "aws_lakeformation_permissions" "analyst_customers" {
  principal   = aws_iam_role.analyst.arn
  permissions = ["SELECT"]

  table_with_columns {
    database_name         = aws_glue_catalog_database.curated.name
    name                  = "customers"
    excluded_column_names = ["phone", "address"]
  }
}

# 쿼리당 스캔 한도 1TB, 작업 그룹 설정 강제
resource "aws_athena_workgroup" "analysts" {
  name = "analysts"

  configuration {
    enforce_workgroup_configuration    = true
    bytes_scanned_cutoff_per_query     = 1099511627776
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://shop-athena-results-example/"
    }
  }
}

# DMS 복제 인스턴스·작업, Firehose 전송 스트림, Glue 잡, Iceberg 테이블 정의는 생략
