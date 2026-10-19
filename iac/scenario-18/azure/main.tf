# 시나리오 18 · 파트너가 고정 IP를 요구할 때 (Azure)
# 공인 IP 접두사 /31 + NAT Gateway를 앱 서브넷에 연결, Application Gateway 서브넷 NSG로 웹훅 출처 제한

variable "rg" {}
variable "app_subnet_id" {}
variable "agw_subnet_id" {}

locals {
  location     = "koreacentral"
  partner_cidr = "203.0.113.0/28"
}

resource "azurerm_public_ip_prefix" "nat" {
  name                = "pipp-nat-partner"
  location            = local.location
  resource_group_name = var.rg
  prefix_length       = 31 # 연속 IP 2개 → 파트너에 CIDR 하나로 등록
  lifecycle {
    prevent_destroy = true
  }
}

resource "azurerm_nat_gateway" "app" {
  name                = "natgw-app"
  location            = local.location
  resource_group_name = var.rg
}

resource "azurerm_nat_gateway_public_ip_prefix_association" "app" {
  nat_gateway_id      = azurerm_nat_gateway.app.id
  public_ip_prefix_id = azurerm_public_ip_prefix.nat.id
}

# 연결된 서브넷은 VM에 공인 IP가 있어도 아웃바운드를 NAT Gateway가 맡는다
resource "azurerm_subnet_nat_gateway_association" "app" {
  subnet_id      = var.app_subnet_id
  nat_gateway_id = azurerm_nat_gateway.app.id
}

resource "azurerm_network_security_group" "agw" {
  name                = "nsg-agw"
  location            = local.location
  resource_group_name = var.rg
  security_rule {
    name                       = "allow-gateway-manager" # v2 필수, 지우지 않는다
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_address_prefix      = "GatewayManager"
    source_port_range          = "*"
    destination_address_prefix = "*"
    destination_port_range     = "65200-65535"
  }
  security_rule {
    name                       = "allow-partner-https"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_address_prefix      = local.partner_cidr
    source_port_range          = "*"
    destination_address_prefix = "*"
    destination_port_range     = "443"
  }
  security_rule {
    name                       = "deny-other-internet"
    priority                   = 4000
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_address_prefix      = "Internet"
    source_port_range          = "*"
    destination_address_prefix = "*"
    destination_port_range     = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "agw" {
  subnet_id                 = var.agw_subnet_id
  network_security_group_id = azurerm_network_security_group.agw.id
}
