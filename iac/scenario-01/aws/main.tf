locals {
  azs = ["ap-northeast-2a", "ap-northeast-2c"]
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
}

# 서브넷은 AZ 단위: AZ마다 public, app, db를 하나씩
resource "aws_subnet" "app" {
  count             = length(local.azs)
  vpc_id            = aws_vpc.main.id
  availability_zone = local.azs[count.index]
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 8, 10 + count.index)
}

# NAT GW도 AZ마다 하나 (public 서브넷에 배치)
resource "aws_nat_gateway" "nat" {
  count         = length(local.azs)
  subnet_id     = aws_subnet.public[count.index].id
  allocation_id = aws_eip.nat[count.index].id
}

resource "aws_db_instance" "main" {
  engine               = "mysql"
  instance_class       = "db.t4g.medium"
  allocated_storage    = 50
  multi_az             = true   # 다른 AZ에 대기 인스턴스
  publicly_accessible  = false
  db_subnet_group_name = aws_db_subnet_group.db.name
  # 계정 정보는 Secrets Manager 연동으로 관리 (생략)
}
