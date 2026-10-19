# 시나리오 21 · 사내 방화벽으로 인터넷 출구 통합 (Azure)
# 사내가 ER로 0/0 광고 → 모든 서브넷에 자동 적용. 서비스 서브넷만 예외 UDR.

variable "rg" {}
variable "agw_subnet_id" {}

locals {
  location = "koreacentral"
}

# Application Gateway 서브넷: BGP 경로 전파를 끄고 인터넷 직접
resource "azurerm_route_table" "agw" {
  name                          = "rt-agw-internet"
  location                      = local.location
  resource_group_name           = var.rg
  bgp_route_propagation_enabled = false
  route {
    name           = "internet"
    address_prefix = "0.0.0.0/0"
    next_hop_type  = "Internet"
  }
}

resource "azurerm_subnet_route_table_association" "agw" {
  subnet_id      = var.agw_subnet_id
  route_table_id = azurerm_route_table.agw.id
}

# 연결이 끊기면 시스템 경로(0/0 → Internet)로 돌아간다.
# "끊기면 닫힘"을 원하면 앱 서브넷에 0/0 → None UDR을 두고 BGP 전파는 켠 상태로 둔다:
# BGP 0/0이 있을 때는 같은 접두사에서 UDR이 우선하므로, 이 경우에는
# 0/0 대신 0.0.0.0/1 + 128.0.0.0/1을 사내에서 광고하는 방식이 쓰인다.
