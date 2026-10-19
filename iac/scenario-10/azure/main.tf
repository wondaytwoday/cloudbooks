# 자동 확장: 평시 프로필 + 오픈 시간 고정 일정 프로필
resource "azurerm_monitor_autoscale_setting" "api" {
  name                = "ticket-api"
  resource_group_name = azurerm_resource_group.rg.name
  location            = "koreacentral"
  target_resource_id  = azurerm_linux_virtual_machine_scale_set.api.id

  profile {
    name = "default"
    capacity {
      default = 4
      minimum = 4
      maximum = 400
    }
    rule {
      metric_trigger {
        metric_name        = "Percentage CPU"
        metric_resource_id = azurerm_linux_virtual_machine_scale_set.api.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "GreaterThan"
        threshold          = 60
      }
      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "20"
        cooldown  = "PT3M"
      }
    }
  }

  profile {
    name = "ticket-open"
    capacity {
      default = 200
      minimum = 200
      maximum = 400
    }
    fixed_date {
      timezone = "Korea Standard Time"
      start    = "2026-11-20T19:30:00"
      end      = "2026-11-20T21:00:00"
    }
  }
}

# Front Door WAF: IP당 1분 1,000건 초과 차단 + 봇 관리자 규칙
resource "azurerm_cdn_frontdoor_firewall_policy" "edge" {
  name                = "ticketedge"
  resource_group_name = azurerm_resource_group.rg.name
  sku_name            = "Premium_AzureFrontDoor" # 관리형 규칙은 Premium
  mode                = "Prevention"

  custom_rule {
    name                           = "ratePerIp"
    type                           = "RateLimitRule"
    priority                       = 1
    action                         = "Block"
    rate_limit_duration_in_minutes = 1
    rate_limit_threshold           = 1000

    match_condition {
      match_variable = "RemoteAddr"
      operator       = "IPMatch"
      match_values   = ["0.0.0.0/0", "::/0"]
    }
  }

  managed_rule {
    type    = "Microsoft_BotManagerRuleSet"
    version = "1.1"
    action  = "Block"
  }
}
