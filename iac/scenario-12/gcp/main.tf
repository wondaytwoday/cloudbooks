# 벡터 색인: 스트리밍 갱신, 부서 제한(restricts)은 데이터 포인트에 넣어 검색 시 필터
resource "google_vertex_ai_index" "docs" {
  display_name        = "internal-docs"
  region              = "asia-northeast3"
  index_update_method = "STREAM_UPDATE"

  metadata {
    contents_delta_uri = "gs://shop-rag-example/embeddings/"
    config {
      dimensions                  = 768
      approximate_neighbors_count = 50
      distance_measure_type       = "DOT_PRODUCT_DISTANCE"
      algorithm_config {
        tree_ah_config {
          leaf_node_embedding_count = 1000
        }
      }
    }
  }
}

# 비공개 엔드포인트: Private Service Connect로만 조회
resource "google_vertex_ai_index_endpoint" "docs" {
  display_name = "internal-docs"
  region       = "asia-northeast3"

  private_service_connect_config {
    enable_private_service_connect = true
    project_allowlist              = ["shop-example"]
  }
}

# 문서 버킷
resource "google_storage_bucket" "docs" {
  name                        = "shop-rag-example"
  location                    = "ASIA-NORTHEAST3"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
}

# 질의 API 서비스 계정에는 Vertex AI 사용자 역할만
resource "google_project_iam_member" "qa_api_vertex" {
  project = "shop-example"
  role    = "roles/aiplatform.user"
  member  = "serviceAccount:qa-api@shop-example.iam.gserviceaccount.com"
}

# 색인 배포(deployed_index), RAG Engine 코퍼스, Model Armor 템플릿은 SDK·콘솔로 구성
