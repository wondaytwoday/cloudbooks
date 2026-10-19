provider "aws" {
  alias  = "seoul"
  region = "ap-northeast-2"
}

provider "aws" {
  alias  = "tokyo"
  region = "ap-northeast-1"
}

# Aurora Global Database: 서울 주 클러스터 + 도쿄 보조 클러스터
resource "aws_rds_global_cluster" "shop" {
  provider                  = aws.seoul
  global_cluster_identifier = "shop-global"
  engine                    = "aurora-mysql"
  engine_version            = "8.0.mysql_aurora.3.08.0"
}

resource "aws_rds_cluster" "seoul" {
  provider                  = aws.seoul
  cluster_identifier        = "shop-seoul"
  global_cluster_identifier = aws_rds_global_cluster.shop.id
  engine                    = aws_rds_global_cluster.shop.engine
  engine_version            = aws_rds_global_cluster.shop.engine_version
  master_username           = "admin"
  manage_master_user_password = true
}

resource "aws_rds_cluster" "tokyo" {
  provider                  = aws.tokyo
  cluster_identifier        = "shop-tokyo"
  global_cluster_identifier = aws_rds_global_cluster.shop.id
  engine                    = aws_rds_global_cluster.shop.engine
  engine_version            = aws_rds_global_cluster.shop.engine_version
  depends_on                = [aws_rds_cluster.seoul]
}

# Route 53 장애조치 레코드: 서울 상태 확인 실패 시 도쿄
resource "aws_route53_health_check" "seoul" {
  fqdn              = "seoul-origin.shop.example.com"
  type              = "HTTPS"
  resource_path     = "/healthz"
  failure_threshold = 3
  request_interval  = 10
}

resource "aws_route53_record" "primary" {
  zone_id         = aws_route53_zone.shop.zone_id
  name            = "api.shop.example.com"
  type            = "CNAME"
  ttl             = 60
  records         = ["seoul-origin.shop.example.com"]
  set_identifier  = "seoul"
  health_check_id = aws_route53_health_check.seoul.id

  failover_routing_policy {
    type = "PRIMARY"
  }
}

resource "aws_route53_record" "secondary" {
  zone_id        = aws_route53_zone.shop.zone_id
  name           = "api.shop.example.com"
  type           = "CNAME"
  ttl            = 60
  records        = ["tokyo-origin.shop.example.com"]
  set_identifier = "tokyo"

  failover_routing_policy {
    type = "SECONDARY"
  }
}

# 인스턴스·서브넷 그룹, S3 교차 리전 복제(aws_s3_bucket_replication_configuration)는 생략
