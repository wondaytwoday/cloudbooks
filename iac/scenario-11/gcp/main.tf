# Vertex AI 엔드포인트 (모델 배포·트래픽 분할은 SDK나 gcloud로 수행)
#   gcloud ai endpoints deploy-model ENDPOINT --model=v13 \
#     --traffic-split=0=90,v13=10 --machine-type=g2-standard-8 --accelerator=type=nvidia-l4,count=1
resource "google_vertex_ai_endpoint" "rec" {
  name         = "recommender"
  display_name = "recommender"
  location     = "asia-northeast3"
}

# 직접 서빙하는 경우: GKE GPU 노드 풀(스팟), 0대까지 축소
resource "google_container_node_pool" "gpu_spot" {
  name     = "gpu-spot"
  cluster  = google_container_cluster.ml.id
  location = "asia-northeast3"

  autoscaling {
    total_min_node_count = 0
    total_max_node_count = 8
  }

  node_config {
    machine_type = "g2-standard-8"
    spot         = true

    guest_accelerator {
      type  = "nvidia-l4"
      count = 1
      gpu_driver_installation_config {
        gpu_driver_version = "LATEST"
      }
    }

    taint {
      key    = "nvidia.com/gpu"
      value  = "present"
      effect = "NO_SCHEDULE"
    }
  }
}

# 학습 데이터·체크포인트 버킷
resource "google_storage_bucket" "ml" {
  name                        = "shop-ml-example"
  location                    = "ASIA-NORTHEAST3"
  uniform_bucket_level_access = true

  lifecycle_rule {
    condition {
      age            = 30
      matches_prefix = ["checkpoints/"]
    }
    action {
      type = "Delete"
    }
  }
}

# Vertex AI Pipelines 정의(KFP), 맞춤 학습 작업의 스팟 설정은 파이프라인 코드에서 지정
