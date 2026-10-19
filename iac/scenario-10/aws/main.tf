# 오픈 30분 전 예약 확장: 최소 대수를 피크 용량으로
resource "aws_autoscaling_schedule" "open_prewarm" {
  scheduled_action_name  = "ticket-open-prewarm"
  autoscaling_group_name = aws_autoscaling_group.api.name
  start_time             = "2026-11-20T10:30:00Z" # 한국 시각 19:30
  min_size               = 200
  max_size               = 400
  desired_capacity       = 200
}

resource "aws_autoscaling_schedule" "open_cooldown" {
  scheduled_action_name  = "ticket-open-cooldown"
  autoscaling_group_name = aws_autoscaling_group.api.name
  start_time             = "2026-11-20T12:00:00Z"
  min_size               = 4
  max_size               = 400
  desired_capacity       = 4
}

# 부팅 시간을 줄이는 웜 풀 (중지 상태로 대기)
resource "aws_autoscaling_group" "api" {
  name                = "ticket-api"
  min_size            = 4
  max_size            = 400
  vpc_zone_identifier = aws_subnet.private[*].id

  launch_template {
    id      = aws_launch_template.api.id
    version = "$Latest"
  }

  warm_pool {
    pool_state                  = "Stopped"
    min_size                    = 50
    max_group_prepared_capacity = 200
  }
}

# WAF: IP당 5분 1,000건 초과 차단 + Bot Control
resource "aws_wafv2_web_acl" "edge" {
  name  = "ticket-edge"
  scope = "CLOUDFRONT" # us-east-1 공급자로 생성

  default_action {
    allow {}
  }

  rule {
    name     = "rate-per-ip"
    priority = 1
    action {
      block {}
    }
    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "rate-per-ip"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "bot-control"
    priority = 2
    override_action {
      none {}
    }
    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesBotControlRuleSet"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "bot-control"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "ticket-edge"
    sampled_requests_enabled   = true
  }
}
