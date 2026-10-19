# Google Cloud 쪽: 상대 클라우드 VPN을 외부 VPN 게이트웨이로 등록
# AWS와 HA VPN을 잇는 경우 AWS 쪽 터널 4개에 맞춰 인터페이스 4개 구성
resource "google_compute_external_vpn_gateway" "other_cloud" {
  name            = "other-cloud"
  redundancy_type = "FOUR_IPS_REDUNDANCY"

  interface {
    id         = 0
    ip_address = "198.51.100.10"
  }
  interface {
    id         = 1
    ip_address = "198.51.100.11"
  }
  interface {
    id         = 2
    ip_address = "198.51.100.12"
  }
  interface {
    id         = 3
    ip_address = "198.51.100.13"
  }
}

# 대역폭이 크면 Cross-Cloud Interconnect (물리 연결은 콘솔에서 주문 후 VLAN 연결 생성)
resource "google_compute_interconnect_attachment" "to_other_cloud" {
  name         = "to-other-cloud"
  region       = "asia-northeast3"
  type         = "DEDICATED"
  router       = google_compute_router.cross_cloud.id
  interconnect = "https://www.googleapis.com/compute/v1/projects/shop-net/global/interconnects/cci-seoul-1"
}

# 논리 복제를 위한 Cloud SQL 플래그
resource "google_sql_database_instance" "orders" {
  name             = "orders"
  region           = "asia-northeast3"
  database_version = "POSTGRES_16"

  settings {
    tier = "db-custom-4-16384"
    database_flags {
      name  = "cloudsql.logical_decoding"
      value = "on"
    }
  }
}

module "orders_app" {
  source       = "../../modules/orders-k8s"
  cluster_name = "shop-gke"
  image        = "registry.example.com/orders:1.42.0"
}
