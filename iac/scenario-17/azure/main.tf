# 시나리오 17 · 사내 전용 관리자 페이지 (Azure)
# VPN Gateway → 사설 프런트엔드 Application Gateway → admin → DB, NSG에 VNet 기본 허용 덮어쓰기
# 비공개 DNS 영역 + DNS Private Resolver 인바운드

variable "rg" {}
variable "vnet_id" {}
variable "vnet_name" {}
variable "db_subnet_id" {}
variable "dns_in_subnet_id" {}

locals {
  location  = "koreacentral"
  corp_cidr = "192.168.0.0/16"
}

# DB 서브넷: 앱만 허용하고, 사내 대역을 포함한 나머지 VirtualNetwork는 명시적으로 거부
resource "azurerm_network_security_group" "db" {
  name                = "nsg-db"
  location            = local.location
  resource_group_name = var.rg
  security_rule {
    name                       = "allow-mysql-from-app"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_address_prefix      = "10.20.10.0/24"
    source_port_range          = "*"
    destination_address_prefix = "*"
    destination_port_range     = "3306"
  }
  security_rule {
    name                       = "deny-other-vnet" # AllowVnetInBound(65000)에는 사내 대역도 들어 있다
    priority                   = 4000
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_address_prefix      = "VirtualNetwork"
    source_port_range          = "*"
    destination_address_prefix = "*"
    destination_port_range     = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "db" {
  subnet_id                 = var.db_subnet_id
  network_security_group_id = azurerm_network_security_group.db.id
}

resource "azurerm_private_dns_zone" "corp" {
  name                = "corp.example.com"
  resource_group_name = var.rg
}

resource "azurerm_private_dns_zone_virtual_network_link" "corp" {
  name                  = "link-vnet-prod"
  resource_group_name   = var.rg
  private_dns_zone_name = azurerm_private_dns_zone.corp.name
  virtual_network_id    = var.vnet_id
}

resource "azurerm_private_dns_a_record" "admin" {
  name                = "admin"
  zone_name           = azurerm_private_dns_zone.corp.name
  resource_group_name = var.rg
  ttl                 = 300
  records             = ["10.20.0.10"] # Application Gateway 사설 프런트엔드 IP
}

resource "azurerm_private_dns_resolver" "main" {
  name                = "dnspr-prod"
  location            = local.location
  resource_group_name = var.rg
  virtual_network_id  = var.vnet_id
}

resource "azurerm_private_dns_resolver_inbound_endpoint" "in" {
  name                    = "in"
  private_dns_resolver_id = azurerm_private_dns_resolver.main.id
  location                = local.location
  ip_configurations {
    subnet_id                    = var.dns_in_subnet_id # Microsoft.Network/dnsResolvers로 위임
    private_ip_allocation_method = "Static"
    private_ip_address           = "10.20.30.4"
  }
}

# Application Gateway: frontend_ip_configuration에 private_ip_address만 두고 공인 IP를 두지 않는다
# (시나리오 01의 azurerm_application_gateway와 같은 구조, 프런트엔드만 사설)
# VPN Gateway·로컬 네트워크 게이트웨이는 시나리오 06 참고
