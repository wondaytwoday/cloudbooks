# 시나리오 01 · 3티어 웹서비스 (AWS)
# 구축 순서대로: VPC → 서브넷 6개 → IGW → 퍼블릭 라우팅 → NAT ×2 → 앱 라우팅 AZ별
#              → 보안 그룹 3개 → RDS → 시작 템플릿·ASG → ALB
# 이미지, 인증서, 도메인처럼 환경마다 다른 값은 변수로 뺐고 일부 필수 인자는 생략했다.

variable "ami_id" {}
variable "certificate_arn" {}

locals {
  azs = ["ap-northeast-2a", "ap-northeast-2c"]
}

# 1. VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
}

# 2. 서브넷: AZ 하나에 하나씩 묶이므로 AZ 수 × 계층 수
resource "aws_subnet" "public" {
  count                   = length(local.azs)
  vpc_id                  = aws_vpc.main.id
  availability_zone       = local.azs[count.index]
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 8, 1 + count.index) # 10.0.1.0/24, 10.0.2.0/24
  map_public_ip_on_launch = false
}

resource "aws_subnet" "app" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  availability_zone = local.azs[count.index]
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, 11 + count.index) # 10.0.11.0/24, 10.0.12.0/24
}

resource "aws_subnet" "db" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  availability_zone = local.azs[count.index]
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, 21 + count.index) # 10.0.21.0/24, 10.0.22.0/24
}

# 3. 인터넷 게이트웨이: 직접 만들고 VPC에 연결해야 인터넷 경로가 생긴다
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
}

# 4. 퍼블릭 라우팅 테이블: 0.0.0.0/0 → IGW, 퍼블릭 서브넷에 연결
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}

resource "aws_route_table_association" "public" {
  count          = length(local.azs)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# 5. NAT 게이트웨이: AZ 리소스이므로 AZ마다 하나
resource "aws_eip" "nat" {
  count  = length(local.azs)
  domain = "vpc"
}

resource "aws_nat_gateway" "nat" {
  count         = length(local.azs)
  subnet_id     = aws_subnet.public[count.index].id
  allocation_id = aws_eip.nat[count.index].id
  depends_on    = [aws_internet_gateway.igw]
}

# 6. 앱 라우팅 테이블: AZ마다 따로 만들어 같은 AZ의 NAT를 가리킨다
resource "aws_route_table" "app" {
  count  = length(local.azs)
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat[count.index].id
  }
}

resource "aws_route_table_association" "app" {
  count          = length(local.azs)
  subnet_id      = aws_subnet.app[count.index].id
  route_table_id = aws_route_table.app[count.index].id
}
# DB 서브넷은 기본 라우팅 테이블(local 경로만)을 그대로 쓴다

# 7. 보안 그룹: ENI에 붙는다. 출처로 다른 보안 그룹을 참조
resource "aws_security_group" "alb" {
  name   = "sg-alb"
  vpc_id = aws_vpc.main.id
}

resource "aws_security_group" "app" {
  name   = "sg-app"
  vpc_id = aws_vpc.main.id
}

resource "aws_security_group" "db" {
  name   = "sg-db"
  vpc_id = aws_vpc.main.id
}

resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  security_group_id = aws_security_group.alb.id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_ingress_rule" "app_from_alb" {
  security_group_id            = aws_security_group.app.id
  ip_protocol                  = "tcp"
  from_port                    = 8080
  to_port                      = 8080
  referenced_security_group_id = aws_security_group.alb.id
}

resource "aws_vpc_security_group_ingress_rule" "db_from_app" {
  security_group_id            = aws_security_group.db.id
  ip_protocol                  = "tcp"
  from_port                    = 3306
  to_port                      = 3306
  referenced_security_group_id = aws_security_group.app.id
}
# 아웃바운드 규칙(aws_vpc_security_group_egress_rule)은 생략

# 8. RDS Multi-AZ
resource "aws_db_subnet_group" "db" {
  name       = "shop-db"
  subnet_ids = aws_subnet.db[*].id
}

resource "aws_db_instance" "main" {
  identifier                  = "shop-db"
  engine                      = "mysql"
  instance_class              = "db.t4g.medium"
  allocated_storage           = 50
  multi_az                    = true # 다른 AZ에 대기 인스턴스
  publicly_accessible         = false
  db_subnet_group_name        = aws_db_subnet_group.db.name
  vpc_security_group_ids      = [aws_security_group.db.id]
  username                    = "admin"
  manage_master_user_password = true # 암호는 Secrets Manager가 관리
  backup_retention_period     = 7
  deletion_protection         = true
}

# 9. 시작 템플릿 + Auto Scaling 그룹
resource "aws_launch_template" "app" {
  name_prefix            = "shop-app-"
  image_id               = var.ami_id
  instance_type          = "m7g.large"
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile {
    name = "shop-app" # SSM·Secrets Manager 읽기 권한이 있는 역할 (생략)
  }
  metadata_options {
    http_tokens = "required" # IMDSv2
  }
}

resource "aws_autoscaling_group" "app" {
  name                      = "shop-app"
  min_size                  = 2
  desired_capacity          = 4
  max_size                  = 20
  vpc_zone_identifier       = aws_subnet.app[*].id # 앱 서브넷 a·c
  health_check_type         = "ELB"
  health_check_grace_period = 300
  target_group_arns         = [aws_lb_target_group.app.arn]
  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }
}

# 10. ALB: 퍼블릭 서브넷 2개 이상
resource "aws_lb" "web" {
  name               = "shop-alb"
  load_balancer_type = "application"
  subnets            = aws_subnet.public[*].id
  security_groups    = [aws_security_group.alb.id]
}

resource "aws_lb_target_group" "app" {
  name     = "shop-app"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  health_check {
    path = "/healthz" # DB까지 확인하지 않는 경로
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.web.arn
  port              = 443
  protocol          = "HTTPS"
  certificate_arn   = var.certificate_arn
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
