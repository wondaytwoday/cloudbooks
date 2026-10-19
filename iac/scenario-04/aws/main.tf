resource "aws_eks_cluster" "main" {
  name     = "shop"
  role_arn = aws_iam_role.cluster.arn
  version  = "1.33"

  vpc_config {
    subnet_ids              = aws_subnet.private[*].id # 여러 AZ의 비공개 서브넷
    endpoint_private_access = true
    endpoint_public_access  = false
  }

  access_config {
    authentication_mode = "API" # aws-auth ConfigMap 대신 액세스 항목 사용
  }
}

# 기본 노드 그룹: 시스템 파드와 Karpenter 자신을 올릴 최소 노드
resource "aws_eks_node_group" "system" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "system"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = aws_subnet.private[*].id
  instance_types  = ["m7g.large"]
  ami_type        = "AL2023_ARM_64_STANDARD"

  scaling_config {
    min_size     = 2
    desired_size = 2
    max_size     = 3
  }
}

# 파드 권한: 쿠버네티스 서비스 계정 → IAM 역할
resource "aws_eks_addon" "pod_identity" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "eks-pod-identity-agent"
}

resource "aws_eks_pod_identity_association" "orders" {
  cluster_name    = aws_eks_cluster.main.name
  namespace       = "orders"
  service_account = "orders-api"
  role_arn        = aws_iam_role.orders_api.arn
}

resource "aws_ecr_repository" "orders" {
  name                 = "orders-api"
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
}

# Karpenter(Helm)와 NodePool, AWS Load Balancer Controller, VPC CNI 접두사 위임 설정은 생략
