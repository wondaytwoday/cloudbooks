# 월 예산 경보: 80% 예측, 100% 실제
resource "aws_budgets_budget" "monthly" {
  name         = "shop-monthly"
  budget_type  = "COST"
  limit_amount = "20000"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = ["finops@example.com"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = ["finops@example.com"]
  }
}

# 서비스별 비용 이상 탐지
resource "aws_ce_anomaly_monitor" "services" {
  name              = "by-service"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
}

# S3 트래픽을 NAT 대신 게이트웨이 엔드포인트로 (엔드포인트 추가 요금 없음)
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.ap-northeast-2.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id
}

# 30일 지난 객체는 Intelligent-Tiering으로
resource "aws_s3_bucket_lifecycle_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    id     = "to-intelligent-tiering"
    status = "Enabled"
    filter {}
    transition {
      days          = 30
      storage_class = "INTELLIGENT_TIERING"
    }
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# dev 오토스케일 그룹: 평일 09~20시만 가동
resource "aws_autoscaling_schedule" "dev_stop" {
  scheduled_action_name  = "dev-stop"
  autoscaling_group_name = "dev-app"
  recurrence             = "0 20 * * MON-FRI"
  time_zone              = "Asia/Seoul"
  min_size               = 0
  max_size               = 0
  desired_capacity       = 0
}

resource "aws_autoscaling_schedule" "dev_start" {
  scheduled_action_name  = "dev-start"
  autoscaling_group_name = "dev-app"
  recurrence             = "0 9 * * MON-FRI"
  time_zone              = "Asia/Seoul"
  min_size               = 2
  max_size               = 4
  desired_capacity       = 2
}
