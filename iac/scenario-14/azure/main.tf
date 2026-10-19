# Azure 쪽: 상대 클라우드 VPN을 로컬 네트워크 게이트웨이로 등록
resource "azurerm_local_network_gateway" "other_cloud" {
  name                = "other-cloud"
  location            = "koreacentral"
  resource_group_name = azurerm_resource_group.hub.name
  gateway_address     = var.other_cloud_vpn_ip

  bgp_settings {
    asn                 = 65020
    bgp_peering_address = "169.254.21.1"
  }
}

variable "other_cloud_vpn_ip" {
  type = string
}

resource "azurerm_virtual_network_gateway_connection" "other_cloud" {
  name                       = "to-other-cloud"
  location                   = "koreacentral"
  resource_group_name        = azurerm_resource_group.hub.name
  type                       = "IPsec"
  virtual_network_gateway_id = azurerm_virtual_network_gateway.vpn.id
  local_network_gateway_id   = azurerm_local_network_gateway.other_cloud.id
  bgp_enabled                = true
  shared_key                 = var.vpn_psk
}

variable "vpn_psk" {
  type      = string
  sensitive = true
}

# 논리 복제를 위한 PostgreSQL Flexible Server 설정
resource "azurerm_postgresql_flexible_server_configuration" "wal_level" {
  name      = "wal_level"
  server_id = azurerm_postgresql_flexible_server.orders.id
  value     = "logical"
}

# 다른 클라우드의 쿠버네티스를 Azure Arc에 연결해 정책·모니터링을 한곳에서 (az connectedk8s connect)
module "orders_app" {
  source       = "../../modules/orders-k8s"
  cluster_name = "shop-aks"
  image        = "registry.example.com/orders:1.42.0"
}
