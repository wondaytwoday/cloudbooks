# 정적 파일: Storage 정적 웹사이트
resource "azurerm_storage_account" "site" {
  name                     = "shopwebexample"
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = "koreacentral"
  account_tier             = "Standard"
  account_replication_type = "ZRS"
}

resource "azurerm_storage_account_static_website" "site" {
  storage_account_id = azurerm_storage_account.site.id
  index_document     = "index.html"
  error_404_document = "index.html" # SPA 경로 새로고침 대응
}

# API: Flex Consumption Function App
resource "azurerm_function_app_flex_consumption" "api" {
  name                   = "shop-api"
  resource_group_name    = azurerm_resource_group.rg.name
  location               = "koreacentral"
  service_plan_id        = azurerm_service_plan.flex.id # sku_name = "FC1"
  runtime_name           = "node"
  runtime_version        = "22"
  instance_memory_in_mb  = 2048
  maximum_instance_count = 50

  # 배포 저장소 연결, always_ready, site_config 는 생략
}

# Front Door: /api/* 경로는 API 원본 그룹으로, 캐시 없음
resource "azurerm_cdn_frontdoor_route" "api" {
  name                          = "api"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.web.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.api.id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.api.id]
  patterns_to_match             = ["/api/*"]
  supported_protocols           = ["Https"]
  forwarding_protocol           = "HttpsOnly"
  # cache 블록을 두지 않으면 이 경로는 캐시하지 않음
}

resource "azurerm_cdn_frontdoor_route" "site" {
  name                          = "site"
  cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.web.id
  cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.site.id
  cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.site.id]
  patterns_to_match             = ["/*"]
  supported_protocols           = ["Https"]
  forwarding_protocol           = "HttpsOnly"

  cache {
    query_string_caching_behavior = "IgnoreQueryString"
    compression_enabled           = true
    content_types_to_compress     = ["text/html", "text/css", "application/javascript"]
  }
}

# API Management(Consumption) + validate-jwt 정책, Cosmos DB, WAF 정책은 생략
