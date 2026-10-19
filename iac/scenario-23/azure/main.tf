# 시나리오 23 · 사내 서버가 전용선으로 관리형 서비스 쓰기 (Azure)
# DNS Private Resolver 인바운드 + Private Endpoint(privatelink 영역은 Azure에만), 사내는 공용 영역만 조건부 전달

variable "rg" {}
variable "vnet_id" {}
variable "dns_in_subnet_id" {}

resource "azurerm_private_dns_resolver" "hub" {
  name                = "dnspr-hub"
  location            = "koreacentral"
  resource_group_name = var.rg
  virtual_network_id  = var.vnet_id
}

resource "azurerm_private_dns_resolver_inbound_endpoint" "in" {
  name                    = "in"
  private_dns_resolver_id = azurerm_private_dns_resolver.hub.id
  location                = "koreacentral"
  ip_configurations {
    subnet_id                    = var.dns_in_subnet_id
    private_ip_allocation_method = "Static"
    private_ip_address           = "10.0.30.4"
  }
}
# Private Endpoint와 privatelink 영역은 시나리오 20의 구성을 허브 VNet에 둔다.
# 사내 DNS 조건부 전달 (privatelink.* 가 아니라 공용 영역):
#   blob.core.windows.net, vault.azure.net, postgres.database.azure.com → 10.0.30.4
