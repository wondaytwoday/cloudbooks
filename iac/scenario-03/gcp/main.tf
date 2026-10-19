variable "org_id" {
  type = string
}

resource "google_folder" "workloads" {
  display_name = "workloads"
  parent       = "organizations/${var.org_id}"
}

resource "google_folder" "commerce" {
  display_name = "commerce"
  parent       = google_folder.workloads.name
}

resource "google_project" "commerce_dev" {
  name            = "commerce-dev"
  project_id      = "commerce-dev-example"
  folder_id       = google_folder.commerce.name
  billing_account = "000000-000000-000000"
  labels = {
    team = "commerce"
    env  = "dev"
  }
}

# 가드레일: 워크로드 폴더 전체에서 VM 외부 IP 금지, 서울 리전만 허용
resource "google_org_policy_policy" "no_external_ip" {
  name   = "${google_folder.workloads.name}/policies/compute.vmExternalIpAccess"
  parent = google_folder.workloads.name
  spec {
    rules {
      deny_all = "TRUE"
    }
  }
}

resource "google_org_policy_policy" "seoul_only" {
  name   = "${google_folder.workloads.name}/policies/gcp.resourceLocations"
  parent = google_folder.workloads.name
  spec {
    rules {
      values {
        allowed_values = ["in:asia-northeast3-locations"]
      }
    }
  }
}

# 조직 전체 감사 로그 → 로그 프로젝트의 로그 버킷 (버킷 보존 잠금은 로그 프로젝트에서 설정)
resource "google_logging_organization_sink" "audit" {
  name             = "org-audit"
  org_id           = var.org_id
  include_children = true
  destination      = "logging.googleapis.com/projects/org-logs-example/locations/asia-northeast3/buckets/audit"
  filter           = "logName:\"cloudaudit.googleapis.com\""
}
