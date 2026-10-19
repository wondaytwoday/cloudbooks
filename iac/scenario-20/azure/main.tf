# 시나리오 20 · 관리형 서비스로 가는 비공개 경로 (Azure)
# 리소스마다 Private Endpoint + privatelink DNS 영역, 각 리소스의 공용 네트워크 접근 끔

variable "rg" {}
variable "vnet_id" {}
variable "pe_subnet_id" {}
variable "targets" {
  # { blob = { id = 스토리지 계정 ID, subresource = "blob", zone = "privatelink.blob.core.windows.net" }, ... }
  type = map(object({ id = string, subresource = string, zone = string }))
  default = {}
}

locals {
  location = "koreacentral"
  zones = toset([
    "privatelink.blob.core.windows.net",
    "privatelink.vaultcore.azure.net",
    "privatelink.azurecr.io",
  ])
}

resource "azurerm_private_dns_zone" "pl" {
  for_each            = local.zones
  name                = each.value
  resource_group_name = var.rg
}

resource "azurerm_private_dns_zone_virtual_network_link" "pl" {
  for_each              = local.zones
  name                  = "link-batch"
  resource_group_name   = var.rg
  private_dns_zone_name = azurerm_private_dns_zone.pl[each.value].name
  virtual_network_id    = var.vnet_id
}

# 스토리지(blob), Key Vault(vault), ACR(registry) 각각에 하나씩
resource "azurerm_private_endpoint" "pe" {
  for_each            = var.targets
  name                = "pe-${each.key}"
  location            = local.location
  resource_group_name = var.rg
  subnet_id           = var.pe_subnet_id
  private_service_connection {
    name                           = each.key
    private_connection_resource_id = each.value.id
    subresource_names              = [each.value.subresource]
    is_manual_connection           = false
  }
  private_dns_zone_group {
    name                 = "default"
    private_dns_zone_ids = [azurerm_private_dns_zone.pl[each.value.zone].id]
  }
}
# 각 리소스(azurerm_storage_account, azurerm_key_vault, azurerm_container_registry)에
# public_network_access_enabled = false 를 설정한다. ACR은 Premium SKU가 필요하다.
