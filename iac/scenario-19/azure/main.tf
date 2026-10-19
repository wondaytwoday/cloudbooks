# 시나리오 19 · 서비스 간 내부 통신 (Azure)
# 같은 VNet: ASG + NSG(허용 아래 VirtualNetwork 거부) / 다른 팀 VNet: Private Link 서비스 ← Private Endpoint

variable "rg" {}
variable "orders_subnet_id" {}
variable "pls_subnet_id" {} # private_link_service_network_policies_enabled = false 인 서브넷
variable "pay_lb_frontend_ip_config_id" {}

locals {
  location = "koreacentral"
}

resource "azurerm_application_security_group" "order" {
  name                = "asg-order"
  location            = local.location
  resource_group_name = var.rg
}

resource "azurerm_application_security_group" "inventory" {
  name                = "asg-inventory"
  location            = local.location
  resource_group_name = var.rg
}

resource "azurerm_network_security_group" "apps" {
  name                = "nsg-apps"
  location            = local.location
  resource_group_name = var.rg
  security_rule {
    name                                       = "order-to-inventory"
    priority                                   = 100
    direction                                  = "Inbound"
    access                                     = "Allow"
    protocol                                   = "Tcp"
    source_application_security_group_ids      = [azurerm_application_security_group.order.id]
    destination_application_security_group_ids = [azurerm_application_security_group.inventory.id]
    source_port_range                          = "*"
    destination_port_range                     = "8080"
  }
  security_rule {
    name                       = "deny-other-vnet" # 기본 AllowVnetInBound를 덮는다
    priority                   = 4000
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_address_prefix      = "VirtualNetwork"
    source_port_range          = "*"
    destination_address_prefix = "VirtualNetwork"
    destination_port_range     = "*"
  }
}

# --- 결제팀: 내부 LB 앞에 Private Link 서비스
resource "azurerm_private_link_service" "payments" {
  name                                        = "pls-payments"
  location                                    = local.location
  resource_group_name                         = var.rg
  load_balancer_frontend_ip_configuration_ids = [var.pay_lb_frontend_ip_config_id]
  auto_approval_subscription_ids              = ["00000000-0000-0000-0000-000000000000"] # 주문팀 구독
  visibility_subscription_ids                 = ["00000000-0000-0000-0000-000000000000"]
  nat_ip_configuration {
    name      = "nat"
    primary   = true
    subnet_id = var.pls_subnet_id
  }
}

# --- 주문팀: Private Endpoint (대역이 겹쳐도 됨)
resource "azurerm_private_endpoint" "payments" {
  name                = "pe-payments"
  location            = local.location
  resource_group_name = var.rg
  subnet_id           = var.orders_subnet_id
  private_service_connection {
    name                           = "payments"
    private_connection_resource_id = azurerm_private_link_service.payments.id
    is_manual_connection           = false
  }
}
