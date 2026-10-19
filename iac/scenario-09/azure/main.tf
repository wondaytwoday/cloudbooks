# Key Vault: 일시 삭제 + 제거 보호 필수
resource "azurerm_key_vault" "bank" {
  name                          = "bank-kv-example"
  location                      = "koreacentral"
  resource_group_name           = azurerm_resource_group.rg.name
  tenant_id                     = var.tenant_id
  sku_name                      = "premium" # HSM 보호 키
  purge_protection_enabled      = true
  soft_delete_retention_days    = 90
  public_network_access_enabled = false
  enable_rbac_authorization     = true
}

variable "tenant_id" {
  type = string
}

resource "azurerm_key_vault_key" "data" {
  name         = "business-data"
  key_vault_id = azurerm_key_vault.bank.id
  key_type     = "RSA-HSM"
  key_size     = 3072
  key_opts     = ["wrapKey", "unwrapKey"]
}

# 업무 데이터 스토리지: 공용 네트워크 접근 차단 + 고객 관리 키
resource "azurerm_storage_account" "data" {
  name                            = "bankdataexample"
  resource_group_name             = azurerm_resource_group.rg.name
  location                        = "koreacentral"
  account_tier                    = "Standard"
  account_replication_type        = "ZRS"
  public_network_access_enabled   = false
  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = false # Entra ID 인증만

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.storage.id]
  }

  customer_managed_key {
    key_vault_key_id          = azurerm_key_vault_key.data.versionless_id
    user_assigned_identity_id = azurerm_user_assigned_identity.storage.id
  }
}

resource "azurerm_private_endpoint" "data_blob" {
  name                = "pe-bankdata-blob"
  location            = "koreacentral"
  resource_group_name = azurerm_resource_group.rg.name
  subnet_id           = azurerm_subnet.private_endpoints.id

  private_service_connection {
    name                           = "blob"
    private_connection_resource_id = azurerm_storage_account.data.id
    subresource_names              = ["blob"]
    is_manual_connection           = false
  }
}

# 관리자 접속: Azure Bastion (세션 녹화는 Premium SKU)
resource "azurerm_bastion_host" "admin" {
  name                      = "admin-bastion"
  location                  = "koreacentral"
  resource_group_name       = azurerm_resource_group.rg.name
  sku                       = "Premium"
  session_recording_enabled = true

  ip_configuration {
    name                 = "bastion"
    subnet_id            = azurerm_subnet.bastion.id
    public_ip_address_id = azurerm_public_ip.bastion.id
  }
}

# 감사 로그용 변경 불가 컨테이너 정책, Azure Firewall 애플리케이션 규칙은 생략
