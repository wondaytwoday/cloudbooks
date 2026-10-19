data "azurerm_client_config" "current" {}

# 관리 그룹 계층: 루트 아래 플랫폼 / 랜딩 존 / 샌드박스
resource "azurerm_management_group" "landing_zones" {
  display_name = "landing-zones"
}

resource "azurerm_management_group" "corp" {
  display_name               = "corp"
  parent_management_group_id = azurerm_management_group.landing_zones.id
  subscription_ids           = [var.commerce_dev_subscription_id]
}

variable "commerce_dev_subscription_id" {
  type = string
}

# 가드레일: 허용 위치를 Korea Central로 제한 (기본 제공 정책 "Allowed locations")
resource "azurerm_management_group_policy_assignment" "seoul_only" {
  name                 = "seoul-only"
  management_group_id  = azurerm_management_group.landing_zones.id
  policy_definition_id = "/providers/Microsoft.Authorization/policyDefinitions/e56962a6-4747-49cd-b67b-bf8b01975c4c"
  parameters = jsonencode({
    listOfAllowedLocations = { value = ["koreacentral"] }
  })
}

# 워크로드 팀에는 Owner 대신 Contributor (Owner는 정책 예외를 만들 수 있음)
resource "azurerm_role_assignment" "commerce_devs" {
  scope                = "/subscriptions/${var.commerce_dev_subscription_id}"
  role_definition_name = "Contributor"
  principal_id         = var.commerce_dev_group_object_id
}

variable "commerce_dev_group_object_id" {
  type = string
}

# 구독 활동 로그 → 로그 구독의 Log Analytics 작업 영역
resource "azurerm_monitor_diagnostic_setting" "activity" {
  name                       = "to-central-logs"
  target_resource_id         = "/subscriptions/${var.commerce_dev_subscription_id}"
  log_analytics_workspace_id = var.central_workspace_id

  enabled_log {
    category = "Administrative"
  }
  enabled_log {
    category = "Security"
  }
  enabled_log {
    category = "Policy"
  }
}

variable "central_workspace_id" {
  type = string
}
