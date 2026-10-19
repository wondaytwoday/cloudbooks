# 시나리오 21 · 사내 방화벽으로 인터넷 출구 통합 (GCP)
# 사내가 Interconnect로 0/0 광고 → 동적 경로. 기본 인터넷 경로는 삭제(콘솔·gcloud로), Google API만 예외 경로

variable "network_id" {}

# 기본 경로 삭제는 Terraform 리소스가 아니라 생성 시 옵션으로:
resource "google_compute_network" "app" {
  name                            = "vpc-app"
  auto_create_subnetworks         = false
  delete_default_routes_on_create = true # 0/0 → default-internet-gateway를 만들지 않음
  routing_mode                    = "GLOBAL"
}

# Google API(private.googleapis.com)만 기본 인터넷 게이트웨이로
resource "google_compute_route" "private_googleapis" {
  name             = "private-googleapis"
  network          = google_compute_network.app.id
  dest_range       = "199.36.153.8/30"
  next_hop_gateway = "default-internet-gateway"
  priority         = 100
}

resource "google_dns_managed_zone" "googleapis" {
  name       = "googleapis"
  dns_name   = "googleapis.com."
  visibility = "private"
  private_visibility_config {
    networks {
      network_url = google_compute_network.app.id
    }
  }
}

resource "google_dns_record_set" "private_a" {
  managed_zone = google_dns_managed_zone.googleapis.name
  name         = "private.googleapis.com."
  type         = "A"
  ttl          = 300
  rrdatas      = ["199.36.153.8", "199.36.153.9", "199.36.153.10", "199.36.153.11"]
}

resource "google_dns_record_set" "wildcard" {
  managed_zone = google_dns_managed_zone.googleapis.name
  name         = "*.googleapis.com."
  type         = "CNAME"
  ttl          = 300
  rrdatas      = ["private.googleapis.com."]
}

resource "google_compute_subnetwork" "app" {
  name                     = "subnet-app"
  region                   = "asia-northeast3"
  network                  = google_compute_network.app.id
  ip_cidr_range            = "10.20.10.0/24"
  private_ip_google_access = true
}
# Cloud Router BGP 피어는 사내에서 0/0을 받는다 (시나리오 22의 Cloud Router 구성 참고)
