# 정적 파일: Cloud Storage 버킷을 LB 백엔드 버킷으로 연결하고 Cloud CDN 사용
resource "google_storage_bucket" "site" {
  name                        = "shop-web-example"
  location                    = "ASIA-NORTHEAST3"
  uniform_bucket_level_access = true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html" # SPA 경로 새로고침 대응
  }
}

resource "google_compute_backend_bucket" "site" {
  name        = "shop-web"
  bucket_name = google_storage_bucket.site.name
  enable_cdn  = true
}

# API: Cloud Run + 서버리스 NEG
resource "google_cloud_run_v2_service" "api" {
  name     = "shop-api"
  location = "asia-northeast3"
  ingress  = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER" # LB를 거친 요청만 받음

  template {
    max_instance_request_concurrency = 80
    scaling {
      min_instance_count = 1 # 콜드 스타트 완화
      max_instance_count = 50
    }
    containers {
      image = "asia-northeast3-docker.pkg.dev/shop/api/api:1.0"
    }
  }
}

resource "google_compute_region_network_endpoint_group" "api" {
  name                  = "shop-api-neg"
  region                = "asia-northeast3"
  network_endpoint_type = "SERVERLESS"
  cloud_run {
    service = google_cloud_run_v2_service.api.name
  }
}

resource "google_compute_backend_service" "api" {
  name                  = "shop-api"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  enable_cdn            = false # API 응답은 캐시하지 않음
  backend {
    group = google_compute_region_network_endpoint_group.api.id
  }
}

# 경로 라우팅: /* 는 버킷, /api/* 는 Cloud Run
resource "google_compute_url_map" "web" {
  name            = "shop-web"
  default_service = google_compute_backend_bucket.site.id

  host_rule {
    hosts        = ["*"]
    path_matcher = "main"
  }

  path_matcher {
    name            = "main"
    default_service = google_compute_backend_bucket.site.id
    path_rule {
      paths   = ["/api/*"]
      service = google_compute_backend_service.api.id
    }
  }
}

# 대상 HTTPS 프록시, 관리형 인증서, 전역 전달 규칙, Cloud Armor 정책은 생략
