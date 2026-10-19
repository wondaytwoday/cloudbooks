# 시나리오 01 · 3티어 웹서비스 (Azure)
# 구축 순서대로: 리소스 그룹 → VNet → 서브넷 3개 → (인터넷 경로는 시스템 경로) → NSG 3개·연결
#              → NAT Gateway·연결 → 비공개 DNS·MySQL Flexible → VM Scale Set → Application Gateway
# 라우팅 테이블 리소스가 없고, 대신 서브넷 연결(association) 리소스가 많다는 점을 비교해 보자.

variable "ssh_public_key" {}

locals {
  location = "koreacentral"
}

# 1. 리소스 그룹
resource "azurerm_resource_group" "net" {
  name     = "rg-shop-network"
  location = local.location
}

resource "azurerm_resource_group" "app" {
  name     = "rg-shop-app"
  location = local.location
}

# 2. VNet
resource "azurerm_virtual_network" "main" {
  name                = "vnet-shop"
  location            = local.location
  resource_group_name = azurerm_resource_group.net.name
  address_space       = ["10.0.0.0/16"]
}
# 0.0.0.0/0 → Internet 시스템 경로는 모든 서브넷에 자동으로 있다

# 3. 서브넷: 영역 없음, 용도별로 나눔
resource "azurerm_subnet" "agw" {
  name                 = "snet-agw" # Application Gateway 전용
  resource_group_name  = azurerm_resource_group.net.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.0.0/24"]
}

resource "azurerm_subnet" "app" {
  name                            = "snet-app"
  resource_group_name             = azurerm_resource_group.net.name
  virtual_network_name            = azurerm_virtual_network.main.name
  address_prefixes                = ["10.0.10.0/24"]
  default_outbound_access_enabled = false # 출구는 NAT Gateway로 명시
}

resource "azurerm_subnet" "db" {
  name                 = "snet-db"
  resource_group_name  = azurerm_resource_group.net.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.20.0/24"]
  delegation {
    name = "mysql"
    service_delegation {
      name = "Microsoft.DBforMySQL/flexibleServers"
    }
  }
}

# 4. NSG: 만들어서 서브넷에 연결한다 (NIC에도 붙일 수 있음)
resource "azurerm_network_security_group" "agw" {
  name                = "nsg-agw"
  location            = local.location
  resource_group_name = azurerm_resource_group.net.name
  security_rule {
    name                       = "allow-gateway-manager" # v2 필수
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
    name                       = "allow-https"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_address_prefix      = "Internet"
    source_port_range          = "*"
    destination_address_prefix = "*"
    destination_port_range     = "443"
  }
}

resource "azurerm_network_security_group" "app" {
  name                = "nsg-app"
  location            = local.location
  resource_group_name = azurerm_resource_group.net.name
  security_rule {
    name                       = "allow-from-agw"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_address_prefix      = "10.0.0.0/24"
    source_port_range          = "*"
    destination_address_prefix = "*"
    destination_port_range     = "8080"
  }
}

resource "azurerm_network_security_group" "db" {
  name                = "nsg-db"
  location            = local.location
  resource_group_name = azurerm_resource_group.net.name
  security_rule {
    name                       = "allow-mysql-from-app"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_address_prefix      = "10.0.10.0/24"
    source_port_range          = "*"
    destination_address_prefix = "*"
    destination_port_range     = "3306"
  }
}

resource "azurerm_subnet_network_security_group_association" "agw" {
  subnet_id                 = azurerm_subnet.agw.id
  network_security_group_id = azurerm_network_security_group.agw.id
}

resource "azurerm_subnet_network_security_group_association" "app" {
  subnet_id                 = azurerm_subnet.app.id
  network_security_group_id = azurerm_network_security_group.app.id
}

resource "azurerm_subnet_network_security_group_association" "db" {
  subnet_id                 = azurerm_subnet.db.id
  network_security_group_id = azurerm_network_security_group.db.id
}

# 5. NAT Gateway: 서브넷에 연결하면 경로 없이도 아웃바운드가 NAT로 나간다
resource "azurerm_public_ip" "nat" {
  name                = "pip-nat"
  location            = local.location
  resource_group_name = azurerm_resource_group.net.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_nat_gateway" "app" {
  name                = "natgw-app"
  location            = local.location
  resource_group_name = azurerm_resource_group.net.name
  sku_name            = "Standard"
}

resource "azurerm_nat_gateway_public_ip_association" "app" {
  nat_gateway_id       = azurerm_nat_gateway.app.id
  public_ip_address_id = azurerm_public_ip.nat.id
}

resource "azurerm_subnet_nat_gateway_association" "app" {
  subnet_id      = azurerm_subnet.app.id
  nat_gateway_id = azurerm_nat_gateway.app.id
}

# 6. 비공개 DNS 영역 + MySQL Flexible Server (VNet 통합은 생성 후 변경 불가)
resource "azurerm_private_dns_zone" "mysql" {
  name                = "shop.private.mysql.database.azure.com"
  resource_group_name = azurerm_resource_group.net.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "mysql" {
  name                  = "link-vnet-shop"
  resource_group_name   = azurerm_resource_group.net.name
  private_dns_zone_name = azurerm_private_dns_zone.mysql.name
  virtual_network_id    = azurerm_virtual_network.main.id
}

resource "azurerm_mysql_flexible_server" "main" {
  name                   = "shop-db"
  location               = local.location
  resource_group_name    = azurerm_resource_group.app.name
  sku_name               = "GP_Standard_D2ds_v4"
  delegated_subnet_id    = azurerm_subnet.db.id
  private_dns_zone_id    = azurerm_private_dns_zone.mysql.id
  zone                   = "1"
  backup_retention_days  = 7
  administrator_login    = "shopadmin"
  administrator_password = "change-me" # 실제로는 Key Vault에서 가져온다
  high_availability {
    mode                      = "ZoneRedundant" # 다른 영역에 대기 서버
    standby_availability_zone = "2"
  }
  depends_on = [azurerm_private_dns_zone_virtual_network_link.mysql]
}

# 7. VM Scale Set: 영역 분산은 여기서 지정
resource "azurerm_orchestrated_virtual_machine_scale_set" "app" {
  name                        = "vmss-app"
  location                    = local.location
  resource_group_name         = azurerm_resource_group.app.name
  platform_fault_domain_count = 1
  sku_name                    = "Standard_D2s_v5"
  instances                   = 3
  zones                       = ["1", "2", "3"]
  identity {
    type = "SystemAssigned" # 관리 ID로 Key Vault 읽기 (역할 할당 생략)
  }
  os_profile {
    linux_configuration {
      admin_username = "azureuser"
      admin_ssh_key {
        username   = "azureuser"
        public_key = var.ssh_public_key
      }
    }
  }
  network_interface {
    name    = "nic"
    primary = true
    ip_configuration {
      name      = "ipcfg"
      primary   = true
      subnet_id = azurerm_subnet.app.id
      # NSG는 서브넷에 연결했으므로 NIC에는 두지 않는다
      # application_gateway_backend_address_pool_ids = [...]  (AppGW 백엔드 풀 연결)
    }
  }
  # 이미지, OS 디스크, 자동 크기 조정(azurerm_monitor_autoscale_setting)은 생략
}

# 8. Application Gateway v2: 수신기·백엔드·규칙을 한 리소스 안에 정의
resource "azurerm_public_ip" "agw" {
  name                = "pip-agw"
  location            = local.location
  resource_group_name = azurerm_resource_group.net.name
  allocation_method   = "Static"
  sku                 = "Standard"
  zones               = ["1", "2", "3"]
}

resource "azurerm_application_gateway" "web" {
  name                = "agw-shop"
  location            = local.location
  resource_group_name = azurerm_resource_group.app.name
  zones               = ["1", "2", "3"]
  sku {
    name = "WAF_v2"
    tier = "WAF_v2"
  }
  autoscale_configuration {
    min_capacity = 2
    max_capacity = 10
  }
  gateway_ip_configuration {
    name      = "gwip"
    subnet_id = azurerm_subnet.agw.id
  }
  frontend_ip_configuration {
    name                 = "fe-public"
    public_ip_address_id = azurerm_public_ip.agw.id
  }
  frontend_port {
    name = "https"
    port = 443
  }
  backend_address_pool {
    name = "be-app"
  }
  backend_http_settings {
    name                  = "bs-app"
    port                  = 8080
    protocol              = "Http"
    cookie_based_affinity = "Disabled"
    probe_name            = "healthz"
  }
  probe {
    name                                      = "healthz"
    protocol                                  = "Http"
    path                                      = "/healthz"
    interval                                  = 30
    timeout                                   = 30
    unhealthy_threshold                       = 3
    pick_host_name_from_backend_http_settings = true
  }
  http_listener {
    name                           = "ln-https"
    frontend_ip_configuration_name = "fe-public"
    frontend_port_name             = "https"
    protocol                       = "Https"
    ssl_certificate_name           = "cert-web" # Key Vault 인증서 (ssl_certificate 블록 생략)
  }
  request_routing_rule {
    name                       = "rule-app"
    priority                   = 100
    rule_type                  = "Basic"
    http_listener_name         = "ln-https"
    backend_address_pool_name  = "be-app"
    backend_http_settings_name = "bs-app"
  }
}
