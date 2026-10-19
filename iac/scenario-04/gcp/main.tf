resource "google_container_cluster" "main" {
  name     = "shop"
  location = "asia-northeast3" # 리전 클러스터: 컨트롤 플레인이 여러 영역에 복제

  network    = google_compute_network.main.id
  subnetwork = google_compute_subnetwork.gke.id

  # VPC 네이티브: 파드·서비스는 서브넷의 보조 대역을 사용
  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }

  release_channel {
    channel = "REGULAR"
  }

  workload_identity_config {
    workload_pool = "shop-example.svc.id.goog"
  }

  gateway_api_config {
    channel = "CHANNEL_STANDARD"
  }

  private_cluster_config {
    enable_private_nodes = true
  }

  remove_default_node_pool = true
  initial_node_count       = 1
}

resource "google_container_node_pool" "apps" {
  name           = "apps"
  cluster        = google_container_cluster.main.id
  node_locations = ["asia-northeast3-a", "asia-northeast3-b", "asia-northeast3-c"]

  autoscaling {
    total_min_node_count = 3
    total_max_node_count = 60
  }

  node_config {
    machine_type = "e2-standard-4"
    workload_metadata_config {
      mode = "GKE_METADATA" # 파드는 노드 서비스 계정이 아닌 Workload Identity 사용
    }
  }

  max_pods_per_node = 32 # 노드당 /26 블록 → 보조 대역 소비 감소
}

resource "google_artifact_registry_repository" "apps" {
  repository_id = "apps"
  location      = "asia-northeast3"
  format        = "DOCKER"
}

# 쿠버네티스 서비스 계정에 Google API 권한 부여 (Workload Identity 주체)
resource "google_project_iam_member" "orders_secret" {
  project = "shop-example"
  role    = "roles/secretmanager.secretAccessor"
  member  = "principal://iam.googleapis.com/projects/123456789/locations/global/workloadIdentityPools/shop-example.svc.id.goog/subject/ns/orders/sa/orders-api"
}
