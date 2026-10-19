resource "google_sql_database_instance" "seoul" {
  name             = "shop-seoul"
  region           = "asia-northeast3"
  database_version = "MYSQL_8_0"

  settings {
    tier              = "db-custom-4-16384"
    availability_type = "REGIONAL" # 리전 안 영역 장애 대비
    backup_configuration {
      enabled            = true
      binary_log_enabled = true # 복제본 생성에 필요
    }
  }
}

# 도쿄 교차 리전 읽기 복제본 (리전 장애 시 승격)
resource "google_sql_database_instance" "tokyo" {
  name                 = "shop-tokyo"
  region               = "asia-northeast1"
  database_version     = "MYSQL_8_0"
  master_instance_name = google_sql_database_instance.seoul.name

  settings {
    tier              = "db-custom-4-16384"
    availability_type = "ZONAL"
  }
}

# 전역 백엔드 서비스: 서울·도쿄 인스턴스 그룹을 함께 두고 상태 확인으로 전환
resource "google_compute_backend_service" "app" {
  name                  = "shop-app"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  health_checks         = [google_compute_health_check.app.id]

  backend {
    group           = google_compute_region_instance_group_manager.seoul.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1
  }

  backend {
    group           = google_compute_region_instance_group_manager.tokyo.instance_group
    balancing_mode  = "UTILIZATION"
    capacity_scaler = 1
  }
}

resource "google_compute_health_check" "app" {
  name                = "shop-app"
  check_interval_sec  = 5
  unhealthy_threshold = 3

  https_health_check {
    request_path = "/healthz"
  }
}

# 두 리전의 관리형 인스턴스 그룹, URL 맵·프록시·전달 규칙, 버킷 위치 설정은 생략
