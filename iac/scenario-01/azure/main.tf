resource "azurerm_virtual_network" "main" {
  name                = "shop-vnet"
  location            = "koreacentral"
  resource_group_name = azurerm_resource_group.rg.name
  address_space       = ["10.0.0.0/16"]
}

# 서브넷에는 영역 개념이 없음
resource "azurerm_subnet" "app" {
  name                 = "app"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.10.0/24"]
}

# 영역 분산은 Scale Set에서 지정
resource "azurerm_linux_virtual_machine_scale_set" "app" {
  name                = "shop-app"
  location            = "koreacentral"
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "Standard_D2s_v5"
  instances           = 4
  zones               = ["1", "2"]
  # 이미지, 네트워크 인터페이스, 인증 설정은 생략
}

resource "azurerm_mysql_flexible_server" "main" {
  name                = "shop-db"
  location            = "koreacentral"
  resource_group_name = azurerm_resource_group.rg.name
  sku_name            = "GP_Standard_D2ds_v4"
  delegated_subnet_id = azurerm_subnet.db.id
  zone                = "1"
  high_availability {
    mode                      = "ZoneRedundant"   # 다른 영역에 대기 서버
    standby_availability_zone = "2"
  }
  # 비공개 DNS 영역, 관리자 계정은 생략
}
