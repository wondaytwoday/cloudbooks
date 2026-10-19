# 시나리오 15 · 개발 서버: 나가는 통신만 열기 (AWS)
# 인터넷 출입구(IGW) → 퍼블릭 라우팅 → NAT → 개발 라우팅 → 보안 그룹(인바운드 없음) → S3 게이트웨이 엔드포인트

variable "ami_id" {}

resource "aws_vpc" "dev" {
  cidr_block           = "10.10.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
}

resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.dev.id
  availability_zone = "ap-northeast-2a"
  cidr_block        = "10.10.0.0/24"
}

resource "aws_subnet" "dev" {
  vpc_id                  = aws_vpc.dev.id
  availability_zone       = "ap-northeast-2a"
  cidr_block              = "10.10.10.0/24"
  map_public_ip_on_launch = false # 공인 IP를 주지 않는 것이 첫 번째 방어선
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.dev.id
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.dev.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# 개발 환경이라 NAT는 하나 (AZ 장애 시 개발 서버 외부 통신 중단을 감수)
resource "aws_eip" "nat" {
  domain = "vpc"
}

resource "aws_nat_gateway" "nat" {
  subnet_id     = aws_subnet.public.id
  allocation_id = aws_eip.nat.id
}

resource "aws_route_table" "dev" {
  vpc_id = aws_vpc.dev.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }
}

resource "aws_route_table_association" "dev" {
  subnet_id      = aws_subnet.dev.id
  route_table_id = aws_route_table.dev.id
}

# S3는 NAT를 거치지 않게: rt-dev에 접두사 목록 경로가 자동으로 들어간다
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.dev.id
  service_name      = "com.amazonaws.ap-northeast-2.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.dev.id]
}

# 인바운드 규칙 없음 = 들어오는 연결 전부 거부 (응답은 상태 저장으로 허용)
resource "aws_security_group" "dev" {
  name   = "sg-dev"
  vpc_id = aws_vpc.dev.id
}

resource "aws_vpc_security_group_egress_rule" "https" {
  security_group_id = aws_security_group.dev.id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_egress_rule" "http" {
  security_group_id = aws_security_group.dev.id
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
}

# Session Manager: 22번 포트 없이 접속
resource "aws_iam_role" "dev" {
  name = "dev-instance"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = "sts:AssumeRole", Principal = { Service = "ec2.amazonaws.com" } }]
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.dev.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "dev" {
  name = "dev-instance"
  role = aws_iam_role.dev.name
}

resource "aws_instance" "dev" {
  count                       = 2
  ami                         = var.ami_id
  instance_type               = "t4g.large"
  subnet_id                   = aws_subnet.dev.id
  vpc_security_group_ids      = [aws_security_group.dev.id]
  iam_instance_profile        = aws_iam_instance_profile.dev.name
  associate_public_ip_address = false
  metadata_options {
    http_tokens = "required"
  }
}
