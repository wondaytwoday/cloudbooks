# 시나리오 22 · 전용선 이중화와 장애 전환 (Azure)
# ExpressRoute 회선 2개(다른 피어링 위치)를 같은 ER 게이트웨이에 연결, 라우팅 가중치로 주·예비, VPN 공존

variable "rg" {}
variable "gateway_subnet_id" {}
variable "circuit_ids" { type = map(string) } # { seoul = "...", busan = "..." }
variable "local_gateway_id" {}

locals {
  location = "koreacentral"
}

resource "azurerm_public_ip" "ergw" {
  name                = "pip-ergw"
  location            = local.location
  resource_group_name = var.rg
  allocation_method   = "Static"
  sku                 = "Standard"
  zones               = ["1", "2", "3"]
}

resource "azurerm_virtual_network_gateway" "er" {
  name                = "ergw-hub"
  location            = local.location
  resource_group_name = var.rg
  type                = "ExpressRoute"
  sku                 = "ErGw2AZ"
  ip_configuration {
    name                 = "ipcfg"
    subnet_id            = var.gateway_subnet_id
    public_ip_address_id = azurerm_public_ip.ergw.id
  }
}

# 가중치가 높을수록 Azure → 사내 방향에서 선호
resource "azurerm_virtual_network_gateway_connection" "er" {
  for_each                   = var.circuit_ids
  name                       = "conn-${each.key}"
  location                   = local.location
  resource_group_name        = var.rg
  type                       = "ExpressRoute"
  virtual_network_gateway_id = azurerm_virtual_network_gateway.er.id
  express_route_circuit_id   = each.value
  routing_weight             = each.key == "seoul" ? 100 : 0
}

# 같은 GatewaySubnet에 VPN Gateway (액티브-액티브, BGP) — 같은 접두사면 ER이 우선
resource "azurerm_virtual_network_gateway_connection" "vpn" {
  name                       = "conn-vpn"
  location                   = local.location
  resource_group_name        = var.rg
  type                       = "IPsec"
  virtual_network_gateway_id = "/subscriptions/.../virtualNetworkGateways/vpngw-hub" # VPN Gateway (생략)
  local_network_gateway_id   = var.local_gateway_id
  enable_bgp                 = true
  shared_key                 = "change-me"
}
