# 확장 일정: 오픈 30분 전부터 90분간 최소 200대
resource "google_compute_region_autoscaler" "api" {
  name   = "ticket-api"
  region = "asia-northeast3"
  target = google_compute_region_instance_group_manager.api.id

  autoscaling_policy {
    min_replicas    = 4
    max_replicas    = 400
    cooldown_period = 60

    cpu_utilization {
      target = 0.6
    }

    scaling_schedules {
      name                  = "ticket-open"
      min_required_replicas = 200
      schedule              = "30 19 20 11 *" # 11월 20일 19:30
      time_zone             = "Asia/Seoul"
      duration_sec          = 5400
    }
  }
}

# Cloud Armor: IP당 분당 200건 초과 시 10분 차단
resource "google_compute_security_policy" "edge" {
  name = "ticket-edge"

  rule {
    action   = "rate_based_ban"
    priority = 1000
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      conform_action   = "allow"
      exceed_action    = "deny(429)"
      enforce_on_key   = "IP"
      ban_duration_sec = 600
      rate_limit_threshold {
        count        = 200
        interval_sec = 60
      }
    }
  }

  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
  }
}

# 좌석 재고 카운터: Memorystore for Redis (원자 연산 DECR)
resource "google_redis_instance" "seats" {
  name           = "seats"
  region         = "asia-northeast3"
  tier           = "STANDARD_HA"
  memory_size_gb = 5
}
