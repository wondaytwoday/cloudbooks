# 전용선: ExpressRoute 회선 (주·보조 연결이 기본 포함)
resource "azurerm_express_route_circuit" "corp" {
  name                  = "corp-er"
  resource_group_name   = azurerm_resource_group.hub.name
  location              = "koreacentral"
  service_provider_name = "Example Telecom"
  peering_location      = "Seoul"
  bandwidth_in_mbps     = 2000

  sku {
    tier   = "Standard"
    family = "MeteredData"
  }
}

# 허브 VNet의 GatewaySubnet에 ExpressRoute 게이트웨이와 VPN 게이트웨이를 공존 구성
resource "azurerm_virtual_network_gateway" "er" {
  name                = "hub-er-gw"
  location            = "koreacentral"
  resource_group_name = azurerm_resource_group.hub.name
  type                = "ExpressRoute"
  sku                 = "ErGw1AZ" # 영역 중복 SKU

  ip_configuration {
    subnet_id            = azurerm_subnet.gateway.id
    public_ip_address_id = azurerm_public_ip.er_gw.id
  }
}

resource "azurerm_virtual_network_gateway" "vpn" {
  name                = "hub-vpn-gw"
  location            = "koreacentral"
  resource_group_name = azurerm_resource_group.hub.name
  type                = "Vpn"
  vpn_type            = "RouteBased"
  sku                 = "VpnGw2AZ" # 처리량은 SKU로 결정
  active_active       = true
  bgp_enabled         = true

  ip_configuration {
    name                 = "ip1"
    subnet_id            = azurerm_subnet.gateway.id
    public_ip_address_id = azurerm_public_ip.vpn_gw_1.id
  }
  ip_configuration {
    name                 = "ip2"
    subnet_id            = azurerm_subnet.gateway.id
    public_ip_address_id = azurerm_public_ip.vpn_gw_2.id
  }
}

# DNS: 사내 도메인 전달 (DNS Private Resolver 아웃바운드 + 규칙 집합)
resource "azurerm_private_dns_resolver_dns_forwarding_ruleset" "corp" {
  name                                       = "corp-rules"
  resource_group_name                        = azurerm_resource_group.hub.name
  location                                   = "koreacentral"
  private_dns_resolver_outbound_endpoint_ids = [azurerm_private_dns_resolver_outbound_endpoint.hub.id]
}

resource "azurerm_private_dns_resolver_forwarding_rule" "corp" {
  name                      = "corp-example-local"
  dns_forwarding_ruleset_id = azurerm_private_dns_resolver_dns_forwarding_ruleset.corp.id
  domain_name               = "corp.example.local."
  enabled                   = true

  target_dns_servers {
    ip_address = "10.0.0.53"
    port       = 53
  }
}

# 회선 연결(azurerm_virtual_network_gateway_connection), 로컬 네트워크 게이트웨이,
# Private Resolver 본체·인바운드 엔드포인트는 생략
