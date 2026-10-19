# 시나리오 19 · 서비스 간 내부 통신 (GCP)
# 같은 VPC: 서비스 계정 기반 방화벽 / 다른 팀 VPC: 서비스 연결(생산자) ← PSC 엔드포인트(소비자)

variable "orders_network" {}
variable "orders_subnet" {}
variable "pay_network" {}
variable "pay_ilb_forwarding_rule" {}
variable "sa_order" {}
variable "sa_inventory" {}

locals {
  region = "asia-northeast3"
}

# --- 주문팀: 출처·대상을 서비스 계정으로
resource "google_compute_firewall" "order_to_inventory" {
  name                    = "allow-order-to-inventory"
  network                 = var.orders_network
  direction               = "INGRESS"
  source_service_accounts = [var.sa_order]
  target_service_accounts = [var.sa_inventory]
  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }
}

# --- 결제팀: PSC NAT 서브넷 + 서비스 연결 + 방화벽
resource "google_compute_subnetwork" "psc_nat" {
  name          = "psc-nat"
  region        = local.region
  network       = var.pay_network
  ip_cidr_range = "10.99.0.0/24"
  purpose       = "PRIVATE_SERVICE_CONNECT"
}

resource "google_compute_service_attachment" "payments" {
  name                  = "payments-api"
  region                = local.region
  target_service        = var.pay_ilb_forwarding_rule
  nat_subnets           = [google_compute_subnetwork.psc_nat.id]
  connection_preference = "ACCEPT_MANUAL"
  enable_proxy_protocol = false
  consumer_accept_lists {
    project_id_or_num = "orders-prod"
    connection_limit  = 4
  }
}

resource "google_compute_firewall" "from_psc_nat" {
  name          = "allow-psc-nat-to-payments"
  network       = var.pay_network
  direction     = "INGRESS"
  source_ranges = ["10.99.0.0/24"] # 소비자 대역이 아니라 PSC NAT 대역
  allow {
    protocol = "tcp"
    ports    = ["8443"]
  }
}

# --- 주문팀: PSC 엔드포인트
resource "google_compute_address" "payments_ep" {
  name         = "payments-ep"
  region       = local.region
  subnetwork   = var.orders_subnet
  address_type = "INTERNAL"
  address      = "10.20.30.5"
}

resource "google_compute_forwarding_rule" "payments_ep" {
  name                  = "payments-ep"
  region                = local.region
  network               = var.orders_network
  ip_address            = google_compute_address.payments_ep.id
  target                = google_compute_service_attachment.payments.id
  load_balancing_scheme = "" # PSC 엔드포인트는 빈 값
}
