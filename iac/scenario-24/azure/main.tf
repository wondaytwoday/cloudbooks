# 시나리오 24 · 클라우드 대역이 사내와 겹칠 때 (Azure)
# 겹치는 스포크는 원격 게이트웨이 없이 피어링(광고 안 됨), 허브 Azure Firewall이 항상 SNAT

variable "rg" {}
variable "hub_vnet" { type = object({ id = string, name = string }) }
variable "acq_vnet" { type = object({ id = string, name = string }) }
variable "acq_subnet_id" {}

resource "azurerm_virtual_network_peering" "acq_to_hub" {
  name                      = "acq-to-hub"
  resource_group_name       = var.rg
  virtual_network_name      = var.acq_vnet.name
  remote_virtual_network_id = var.hub_vnet.id
  use_remote_gateways       = false # 이 VNet 대역이 ER로 광고되지 않게
  allow_forwarded_traffic   = true
}

resource "azurerm_virtual_network_peering" "hub_to_acq" {
  name                      = "hub-to-acq"
  resource_group_name       = var.rg
  virtual_network_name      = var.hub_vnet.name
  remote_virtual_network_id = var.acq_vnet.id
  allow_gateway_transit     = false
  allow_forwarded_traffic   = true
}

resource "azurerm_firewall_policy" "hub" {
  name                = "fwp-hub"
  location            = "koreacentral"
  resource_group_name = var.rg
  private_ip_ranges   = ["255.255.255.255/32"] # 사설 목적지도 항상 SNAT
}

resource "azurerm_route_table" "acq" {
  name                = "rt-acq"
  location            = "koreacentral"
  resource_group_name = var.rg
  route {
    name                   = "corp-via-fw"
    address_prefix         = "172.16.0.0/12"
    next_hop_type          = "VirtualAppliance"
    next_hop_in_ip_address = "100.64.30.4"
  }
}

resource "azurerm_subnet_route_table_association" "acq" {
  subnet_id      = var.acq_subnet_id
  route_table_id = azurerm_route_table.acq.id
}
# 들어오는 통신: 스포크 내부 LB 앞 Private Link 서비스 + 허브 Private Endpoint (시나리오 19 참고)
