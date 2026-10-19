# Azure SQL: Korea Central 주 서버 + Korea South 보조 서버, 장애 조치 그룹
resource "azurerm_mssql_server" "central" {
  name                = "shop-sql-central"
  resource_group_name = azurerm_resource_group.central.name
  location            = "koreacentral"
  version             = "12.0"

  azuread_administrator {
    login_username              = "sql-admins"
    object_id                   = var.sql_admin_group_id
    azuread_authentication_only = true
  }
}

resource "azurerm_mssql_server" "south" {
  name                = "shop-sql-south"
  resource_group_name = azurerm_resource_group.south.name
  location            = "koreasouth"
  version             = "12.0"

  azuread_administrator {
    login_username              = "sql-admins"
    object_id                   = var.sql_admin_group_id
    azuread_authentication_only = true
  }
}

variable "sql_admin_group_id" {
  type = string
}

resource "azurerm_mssql_failover_group" "shop" {
  name      = "shop-fog"
  server_id = azurerm_mssql_server.central.id
  databases = [azurerm_mssql_database.shop.id]

  partner_server {
    id = azurerm_mssql_server.south.id
  }

  # 고객이 직접 장애조치를 시작 (자동 전환으로 인한 데이터 손실 위험 회피)
  read_write_endpoint_failover_policy {
    mode = "Manual"
  }
}

# Front Door: 우선순위 1 Korea Central, 2 Korea South
resource "azurerm_cdn_frontdoor_origin_group" "app" {
  name                     = "app"
  cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.shop.id

  load_balancing {
    sample_size                 = 4
    successful_samples_required = 3
  }

  health_probe {
    protocol            = "Https"
    path                = "/healthz"
    request_type        = "GET"
    interval_in_seconds = 30
  }
}

resource "azurerm_cdn_frontdoor_origin" "central" {
  name                           = "central"
  cdn_frontdoor_origin_group_id  = azurerm_cdn_frontdoor_origin_group.app.id
  host_name                      = "central.shop.example.com"
  priority                       = 1
  certificate_name_check_enabled = true
}

resource "azurerm_cdn_frontdoor_origin" "south" {
  name                           = "south"
  cdn_frontdoor_origin_group_id  = azurerm_cdn_frontdoor_origin_group.app.id
  host_name                      = "south.shop.example.com"
  priority                       = 2
  certificate_name_check_enabled = true
}

# 데이터베이스, 두 지역의 VM Scale Set, GRS 스토리지 계정은 생략
