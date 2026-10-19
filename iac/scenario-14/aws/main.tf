# AWS 쪽: 상대 클라우드의 VPN 게이트웨이를 고객 게이트웨이로 등록하고 BGP로 연결
resource "aws_customer_gateway" "other_cloud" {
  bgp_asn    = 65020
  ip_address = var.other_cloud_vpn_ip
  type       = "ipsec.1"
}

variable "other_cloud_vpn_ip" {
  type = string
}

resource "aws_vpn_connection" "other_cloud" {
  customer_gateway_id = aws_customer_gateway.other_cloud.id
  transit_gateway_id  = aws_ec2_transit_gateway.hub.id
  type                = "ipsec.1"
  static_routes_only  = false
}

# 논리 복제를 위한 Aurora PostgreSQL 파라미터 (rds.logical_replication)
resource "aws_rds_cluster_parameter_group" "logical" {
  name   = "orders-logical-replication"
  family = "aurora-postgresql16"

  parameter {
    name         = "rds.logical_replication"
    value        = "1"
    apply_method = "pending-reboot"
  }
}

# 같은 컨테이너 정의를 두 클라우드에 배포: 공통 모듈 + 클라우드별 클러스터 입력
module "orders_app" {
  source       = "../../modules/orders-k8s" # Helm 차트·쿠버네티스 매니페스트
  cluster_name = "shop-eks"
  image        = "registry.example.com/orders:1.42.0" # 두 클라우드가 함께 읽는 레지스트리
}
