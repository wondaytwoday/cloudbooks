# 구독 월 예산 경보
resource "azurerm_consumption_budget_subscription" "monthly" {
  name            = "shop-monthly"
  subscription_id = "/subscriptions/${var.subscription_id}"
  amount          = 20000
  time_grain      = "Monthly"

  time_period {
    start_date = "2026-11-01T00:00:00Z"
  }

  notification {
    operator       = "GreaterThan"
    threshold      = 80
    threshold_type = "Forecasted"
    contact_emails = ["finops@example.com"]
  }

  notification {
    operator       = "GreaterThan"
    threshold      = 100
    threshold_type = "Actual"
    contact_emails = ["finops@example.com"]
  }
}

variable "subscription_id" {
  type = string
}

# 마지막 접근 시간 기준 계층 이동 (스토리지 계정에 접근 시간 추적을 켜야 함)
resource "azurerm_storage_management_policy" "assets" {
  storage_account_id = azurerm_storage_account.assets.id

  rule {
    name    = "by-last-access"
    enabled = true
    filters {
      blob_types = ["blockBlob"]
    }
    actions {
      base_blob {
        tier_to_cool_after_days_since_last_access_time_greater_than    = 30
        tier_to_archive_after_days_since_last_access_time_greater_than = 180
      }
    }
  }
}

# dev VM 자동 종료 (매일 20시)
resource "azurerm_dev_test_global_vm_shutdown_schedule" "dev" {
  virtual_machine_id    = azurerm_linux_virtual_machine.dev.id
  location              = "koreacentral"
  enabled               = true
  daily_recurrence_time = "2000"
  timezone              = "Korea Standard Time"

  notification_settings {
    enabled         = true
    time_in_minutes = 30
    email           = "dev-team@example.com"
  }
}

# 예약·Azure 절감 플랜은 Advisor 권장 확인 후 포털에서 구매
