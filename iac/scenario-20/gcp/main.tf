# 시나리오 20 · 관리형 서비스로 가는 비공개 경로 (GCP)
# 서브넷의 비공개 Google 액세스 하나로 Google API 전체, VPC 서비스 제어 경계로 반출 방지

variable "network_id" {}
variable "network_name" {}
variable "access_policy" {}         # Access Context Manager 정책 번호
variable "project_number" {}

resource "google_compute_subnetwork" "batch" {
  name                     = "subnet-batch"
  region                   = "asia-northeast3"
  network                  = var.network_id
  ip_cidr_range            = "10.30.0.0/20"
  private_ip_google_access = true # 서비스별 엔드포인트가 필요 없다
}
# Cloud NAT를 만들지 않으므로 일반 인터넷으로는 나가지 못함

# (선택) googleapis.com을 restricted VIP로: 경계가 지원하는 API로만
resource "google_dns_managed_zone" "googleapis" {
  name       = "googleapis"
  dns_name   = "googleapis.com."
  visibility = "private"
  private_visibility_config {
    networks {
      network_url = var.network_id
    }
  }
}

resource "google_dns_record_set" "restricted" {
  managed_zone = google_dns_managed_zone.googleapis.name
  name         = "restricted.googleapis.com."
  type         = "A"
  ttl          = 300
  rrdatas      = ["199.36.153.4", "199.36.153.5", "199.36.153.6", "199.36.153.7"]
}

resource "google_dns_record_set" "wildcard" {
  managed_zone = google_dns_managed_zone.googleapis.name
  name         = "*.googleapis.com."
  type         = "CNAME"
  ttl          = 300
  rrdatas      = ["restricted.googleapis.com."]
}

resource "google_access_context_manager_service_perimeter" "batch" {
  parent         = "accessPolicies/${var.access_policy}"
  name           = "accessPolicies/${var.access_policy}/servicePerimeters/batch"
  title          = "batch"
  perimeter_type = "PERIMETER_TYPE_REGULAR"
  use_explicit_dry_run_spec = true # 먼저 시험 실행
  spec {
    resources           = ["projects/${var.project_number}"]
    restricted_services = ["storage.googleapis.com", "secretmanager.googleapis.com", "artifactregistry.googleapis.com"]
  }
}
