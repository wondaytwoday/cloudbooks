# 시나리오 26 · 전용선 구간 암호화 (Azure)
# ① ExpressRoute Direct 포트 MACsec(Key Vault 키)  ② 사설 IP VPN Gateway로 ER 위 IPsec

variable "rg" {}
variable "gateway_subnet_id" {}
variable "macsec_ckn_secret_id" {}
variable "macsec_cak_secret_id" {}
variable "identity_id" {} # Key Vault를 읽을 사용자 할당 관리 ID

resource "azurerm_express_route_port" "direct" {
  name                = "erport-seoul"
  location            = "koreacentral"
  resource_group_name = var.rg
  peering_location    = "Seoul"
  bandwidth_in_gbps   = 10
  encapsulation       = "Dot1Q"
  identity {
    type         = "UserAssigned"
    identity_ids = [var.identity_id]
  }
  link1 {
    macsec_cipher                 = "GcmAes256"
    macsec_ckn_keyvault_secret_id = var.macsec_ckn_secret_id
    macsec_cak_keyvault_secret_id = var.macsec_cak_secret_id
  }
  link2 {
    macsec_cipher                 = "GcmAes256"
    macsec_ckn_keyvault_secret_id = var.macsec_ckn_secret_id
    macsec_cak_keyvault_secret_id = var.macsec_cak_secret_id
  }
}

resource "azurerm_virtual_network_gateway" "vpn_private" {
  name                       = "vpngw-over-er"
  location                   = "koreacentral"
  resource_group_name        = var.rg
  type                       = "Vpn"
  vpn_type                   = "RouteBased"
  sku                        = "VpnGw2AZ"
  private_ip_address_enabled = true # ER 프라이빗 피어링 위 터널
  ip_configuration {
    name      = "ipcfg"
    subnet_id = var.gateway_subnet_id
    public_ip_address_id = "/subscriptions/.../publicIPAddresses/pip-vpngw" # 관리용 공인 IP는 여전히 필요
  }
}
