# 월 예산 경보
resource "google_billing_budget" "monthly" {
  billing_account = "000000-000000-000000"
  display_name    = "shop-monthly"

  budget_filter {
    projects = ["projects/123456789"]
  }

  amount {
    specified_amount {
      currency_code = "KRW"
      units         = "25000000"
    }
  }

  threshold_rules {
    threshold_percent = 0.8
    spend_basis       = "FORECASTED_SPEND"
  }
  threshold_rules {
    threshold_percent = 1.0
  }
}

# 접근 패턴에 따라 저장 계층을 자동으로 옮기는 버킷
resource "google_storage_bucket" "assets" {
  name                        = "shop-assets-example"
  location                    = "ASIA-NORTHEAST3"
  uniform_bucket_level_access = true

  autoclass {
    enabled                = true
    terminal_storage_class = "ARCHIVE"
  }
}

# Google API 트래픽이 Cloud NAT를 거치지 않도록 서브넷에 비공개 Google 액세스
resource "google_compute_subnetwork" "app" {
  name                     = "app"
  region                   = "asia-northeast3"
  network                  = google_compute_network.main.id
  ip_cidr_range            = "10.0.10.0/24"
  private_ip_google_access = true
}

# dev VM 일정: 평일 09시 시작, 20시 중지
resource "google_compute_resource_policy" "dev_hours" {
  name   = "dev-hours"
  region = "asia-northeast3"

  instance_schedule_policy {
    time_zone = "Asia/Seoul"
    vm_start_schedule {
      schedule = "0 9 * * 1-5"
    }
    vm_stop_schedule {
      schedule = "0 20 * * 1-5"
    }
  }
}

# 확약 사용 할인(CUD)은 Recommender 권장 확인 후 콘솔·google_compute_region_commitment로 구매
