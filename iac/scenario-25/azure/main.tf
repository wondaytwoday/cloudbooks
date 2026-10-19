# 시나리오 25 · 전용선 하나로 여러 리전·여러 VPC 연결 (Azure)
# Seoul 피어링 위치 회선 하나를 Korea Central·Japan East 게이트웨이에 연결 (Japan East는 Premium 필요), 허브 간 전역 피어링

variable "rg" {}
variable "gateway_ids" { type = map(string) } # { koreacentral = "...", japaneast = "..." }
variable "hub_vnets" { type = map(object({ id = string, name = string })) }

resource "azurerm_express_route_circuit" "corp" {
  name                  = "erc-corp"
  location              = "koreacentral"
  resource_group_name   = var.rg
  service_provider_name = "Equinix"
  peering_location      = "Seoul"
  bandwidth_in_mbps     = 1000
  sku {
    tier   = "Premium" # 다른 지정학 지역(Japan East) 연결
    family = "MeteredData"
  }
}

resource "azurerm_virtual_network_gateway_connection" "er" {
  for_each                   = var.gateway_ids
  name                       = "conn-${each.key}"
  location                   = each.key
  resource_group_name        = var.rg
  type                       = "ExpressRoute"
  virtual_network_gateway_id = each.value
  express_route_circuit_id   = azurerm_express_route_circuit.corp.id
}

resource "azurerm_virtual_network_peering" "kc_to_je" {
  name                      = "hub-kc-to-je"
  resource_group_name       = var.rg
  virtual_network_name      = var.hub_vnets["koreacentral"].name
  remote_virtual_network_id = var.hub_vnets["japaneast"].id
  allow_forwarded_traffic   = true
}
# 반대 방향 피어링은 생략
