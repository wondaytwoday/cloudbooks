# VPC 서비스 제어: 업무 프로젝트를 경계로 묶고 Storage·KMS·BigQuery API를 제한
resource "google_access_context_manager_service_perimeter" "bank" {
  parent = "accessPolicies/${var.access_policy_id}"
  name   = "accessPolicies/${var.access_policy_id}/servicePerimeters/bank"
  title  = "bank"

  # 먼저 시험 모드(spec + use_explicit_dry_run_spec)로 위반 로그를 확인한 뒤 status로 옮긴다
  use_explicit_dry_run_spec = true
  spec {
    resources           = ["projects/${var.business_project_number}"]
    restricted_services = ["storage.googleapis.com", "cloudkms.googleapis.com", "bigquery.googleapis.com"]
  }
}

variable "access_policy_id" {
  type = string
}

variable "business_project_number" {
  type = string
}

# 고객 관리 키(CMEK): HSM 보호, 90일 자동 교체
resource "google_kms_key_ring" "bank" {
  name     = "bank"
  location = "asia-northeast3"
}

resource "google_kms_crypto_key" "data" {
  name                       = "business-data"
  key_ring                   = google_kms_key_ring.bank.id
  rotation_period            = "7776000s"
  destroy_scheduled_duration = "2592000s" # 폐기 예약 30일

  version_template {
    algorithm        = "GOOGLE_SYMMETRIC_ENCRYPTION"
    protection_level = "HSM"
  }
}

resource "google_storage_bucket" "data" {
  name                        = "bank-data-example"
  location                    = "ASIA-NORTHEAST3"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  encryption {
    default_kms_key_name = google_kms_crypto_key.data.id
  }
}

# 감사 로그 보관 버킷: 5년 보존 정책을 잠금(잠근 뒤에는 줄이거나 지울 수 없음)
resource "google_storage_bucket" "audit" {
  name                        = "bank-audit-example"
  location                    = "ASIA-NORTHEAST3"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  retention_policy {
    retention_period = 157680000
    is_locked        = true
  }
}

# Cloud Storage 서비스 에이전트의 키 사용 권한, IAP 방화벽 규칙, Secure Web Proxy는 생략
