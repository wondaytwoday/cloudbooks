# 시나리오 15 · 개발 서버: 나가는 통신만 열기 (Azure)
# 인터넷 경로는 시스템 경로 → 서브넷 → NSG(Bastion만 22) → NAT Gateway 연결 → 서비스 엔드포인트 → Bastion

locals {
  location = "koreacentral"
}

resource "azurerm_resource_group" "net" {
  name     = "rg-dev-network"
  location = local.location
}

resource "azurerm_virtual_network" "dev" {
  name                = "vnet-dev"
  location            = local.location
  resource_group_name = azurerm_resource_group.net.name
  address_space       = ["10.10.0.0/16"]
}

resource "azurerm_subnet" "dev" {
  name                            = "snet-dev"
  resource_group_name             = azurerm_resource_group.net.name
  virtual_network_name            = azurerm_virtual_network.dev.name
  address_prefixes                = ["10.10.10.0/24"]
  default_outbound_access_enabled = false # 출구는 NAT Gateway로 명시
  service_endpoints               = ["Microsoft.Storage"]
}

resource "azurerm_subnet" "bastion" {
  name                 = "AzureBastionSubnet" # 이름 고정
  resource_group_name  = azurerm_resource_group.net.name
  virtual_network_name = azurerm_virtual_network.dev.name
  address_prefixes     = ["10.10.250.0/26"]
}

# 기본 규칙(DenyAllInBound, AllowInternetOutBound) 위에 Bastion → 22만 추가
resource "azurerm_network_security_group" "dev" {
  name                = "nsg-dev"
  location            = local.location
  resource_group_name = azurerm_resource_group.net.name
  security_rule {
    name                       = "allow-ssh-from-bastion"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_address_prefix      = "10.10.250.0/26"
    source_port_range          = "*"
    destination_address_prefix = "*"
    destination_port_range     = "22"
  }
}

resource "azurerm_subnet_network_security_group_association" "dev" {
  subnet_id                 = azurerm_subnet.dev.id
  network_security_group_id = azurerm_network_security_group.dev.id
}

resource "azurerm_public_ip" "nat" {
  name                = "pip-nat-dev"
  location            = local.location
  resource_group_name = azurerm_resource_group.net.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_nat_gateway" "dev" {
  name                = "natgw-dev"
  location            = local.location
  resource_group_name = azurerm_resource_group.net.name
}

resource "azurerm_nat_gateway_public_ip_association" "dev" {
  nat_gateway_id       = azurerm_nat_gateway.dev.id
  public_ip_address_id = azurerm_public_ip.nat.id
}

resource "azurerm_subnet_nat_gateway_association" "dev" {
  subnet_id      = azurerm_subnet.dev.id
  nat_gateway_id = azurerm_nat_gateway.dev.id
}

resource "azurerm_public_ip" "bastion" {
  name                = "pip-bastion-dev"
  location            = local.location
  resource_group_name = azurerm_resource_group.net.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_bastion_host" "dev" {
  name                = "bas-dev"
  location            = local.location
  resource_group_name = azurerm_resource_group.net.name
  sku                 = "Standard"
  tunneling_enabled   = true # az network bastion ssh
  ip_configuration {
    name                 = "ipcfg"
    subnet_id            = azurerm_subnet.bastion.id
    public_ip_address_id = azurerm_public_ip.bastion.id
  }
}

# 스토리지는 snet-dev에서만 (서비스 엔드포인트)
resource "azurerm_storage_account" "artifacts" {
  name                            = "stdevartifacts"
  location                        = local.location
  resource_group_name             = azurerm_resource_group.net.name
  account_tier                    = "Standard"
  account_replication_type        = "LRS"
  shared_access_key_enabled       = false
  allow_nested_items_to_be_public = false
  network_rules {
    default_action             = "Deny"
    virtual_network_subnet_ids = [azurerm_subnet.dev.id]
  }
}
# VM(공인 IP 없음, 관리 ID)은 생략
