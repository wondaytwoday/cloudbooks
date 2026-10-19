# Azure OpenAI: 공용 네트워크 차단, 키 대신 Entra ID 인증
resource "azurerm_cognitive_account" "openai" {
  name                          = "shop-openai"
  location                      = "koreacentral"
  resource_group_name           = azurerm_resource_group.ai.name
  kind                          = "OpenAI"
  sku_name                      = "S0"
  custom_subdomain_name         = "shop-openai"
  public_network_access_enabled = false
  local_auth_enabled            = false
}

# 배포 유형이 처리 위치를 정함: Standard(지역) / DataZoneStandard / GlobalStandard
resource "azurerm_cognitive_deployment" "chat" {
  name                 = "chat"
  cognitive_account_id = azurerm_cognitive_account.openai.id

  model {
    format  = "OpenAI"
    name    = var.chat_model_name    # 서울 지역에서 제공되는 모델을 가용성 표에서 선택
    version = var.chat_model_version
  }

  sku {
    name     = "Standard"
    capacity = 50
  }
}

variable "chat_model_name" {
  type = string
}

variable "chat_model_version" {
  type = string
}

# AI Search: 하이브리드 검색 + 시맨틱 재순위, 공용 네트워크 차단
resource "azurerm_search_service" "docs" {
  name                          = "shop-docs-search"
  resource_group_name           = azurerm_resource_group.ai.name
  location                      = "koreacentral"
  sku                           = "standard"
  semantic_search_sku           = "standard"
  public_network_access_enabled = false
  local_authentication_enabled  = false

  identity {
    type = "SystemAssigned"
  }
}

resource "azurerm_private_endpoint" "openai" {
  name                = "pe-shop-openai"
  location            = "koreacentral"
  resource_group_name = azurerm_resource_group.ai.name
  subnet_id           = azurerm_subnet.private_endpoints.id

  private_service_connection {
    name                           = "openai"
    private_connection_resource_id = azurerm_cognitive_account.openai.id
    subresource_names              = ["account"]
    is_manual_connection           = false
  }
}

# 인덱스·인덱서·스킬셋(통합 벡터화)과 보안 필터 필드는 REST API나 SDK로 정의
# 서울 지역에서 쓸 수 있는 모델·배포 유형은 모델 가용성 표에서 확인
