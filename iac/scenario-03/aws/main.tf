# 관리 계정에서 실행. 워크로드는 관리 계정에 두지 않는다.
resource "aws_organizations_organization" "org" {
  feature_set                   = "ALL"
  aws_service_access_principals = ["cloudtrail.amazonaws.com", "sso.amazonaws.com"]
  enabled_policy_types          = ["SERVICE_CONTROL_POLICY"]
}

locals {
  root_id = aws_organizations_organization.org.roots[0].id
}

resource "aws_organizations_organizational_unit" "security" {
  name      = "Security"
  parent_id = local.root_id
}

resource "aws_organizations_organizational_unit" "workloads" {
  name      = "Workloads"
  parent_id = local.root_id
}

resource "aws_organizations_account" "commerce_dev" {
  name      = "commerce-dev"
  email     = "aws+commerce-dev@example.com"
  parent_id = aws_organizations_organizational_unit.workloads.id
}

# 가드레일: 감사 추적 중지·삭제 금지, 서울 외 리전 사용 금지
resource "aws_organizations_policy" "guardrails" {
  name = "workload-guardrails"
  type = "SERVICE_CONTROL_POLICY"
  content = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ProtectCloudTrail"
        Effect   = "Deny"
        Action   = ["cloudtrail:StopLogging", "cloudtrail:DeleteTrail", "cloudtrail:UpdateTrail"]
        Resource = "*"
      },
      {
        Sid       = "SeoulOnly"
        Effect    = "Deny"
        NotAction = ["iam:*", "organizations:*", "sts:*", "support:*", "cloudfront:*", "route53:*"]
        Resource  = "*"
        Condition = { StringNotEquals = { "aws:RequestedRegion" = ["ap-northeast-2"] } }
      }
    ]
  })
}

resource "aws_organizations_policy_attachment" "workloads" {
  policy_id = aws_organizations_policy.guardrails.id
  target_id = aws_organizations_organizational_unit.workloads.id
}

# 조직 전체 CloudTrail → 로그 보관 계정의 버킷 (버킷 정책·객체 잠금은 로그 계정에서 설정)
resource "aws_cloudtrail" "org" {
  name                          = "org-trail"
  s3_bucket_name                = "org-audit-logs-example"
  is_organization_trail         = true
  is_multi_region_trail         = true
  include_global_service_events = true
  enable_log_file_validation    = true
}
