resource "google_compute_network" "main" {
  name                    = "shop-vpc"
  auto_create_subnetworks = false   # VPC 자체는 글로벌
}

# 서브넷은 리전 단위: 하나가 모든 영역에 걸침
resource "google_compute_subnetwork" "app" {
  name          = "app"
  region        = "asia-northeast3"
  network       = google_compute_network.main.id
  ip_cidr_range = "10.0.10.0/24"
}

# NAT는 리전 관리형 서비스 하나로 끝
resource "google_compute_router_nat" "nat" {
  name                               = "shop-nat"
  router                             = google_compute_router.main.name
  region                             = "asia-northeast3"
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
}

resource "google_sql_database_instance" "main" {
  name             = "shop-db"
  database_version = "MYSQL_8_0"
  region           = "asia-northeast3"
  settings {
    tier              = "db-custom-2-7680"
    availability_type = "REGIONAL"   # 다른 영역에 대기 인스턴스
    ip_configuration {
      ipv4_enabled    = false        # 공인 IP 없음
      private_network = google_compute_network.main.id
    }
  }
  # 비공개 서비스 연결(google_service_networking_connection)은 생략
}
