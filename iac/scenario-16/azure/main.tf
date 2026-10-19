# 시나리오 16 · 개발·운영 분리와 공용 서비스 (Azure)
# 허브 VNet + Azure Firewall, 스포크 dev·prod 피어링, 스포크 UDR(0/0, 10/8 → 방화벽), 스포크 간 규칙 없음

variable "rg" {}
variable "vnet" { type = map(object({ id = string, name = string })) } # hub, dev, prod
variable "spoke_subnet_ids" { type = map(list(string)) }
variable "firewall_policy_id" {}

locals {
  location    = "koreacentral"
  firewall_ip = "10.0.0.4"
}

resource "azurerm_virtual_network_peering" "hub_to_spoke" {
  for_each                  = toset(["dev", "prod"])
  name                      = "hub-to-${each.key}"
  resource_group_name       = var.rg
  virtual_network_name      = var.vnet["hub"].name
  remote_virtual_network_id = var.vnet[each.key].id
  allow_forwarded_traffic   = true
}

resource "azurerm_virtual_network_peering" "spoke_to_hub" {
  for_each                  = toset(["dev", "prod"])
  name                      = "${each.key}-to-hub"
  resource_group_name       = var.rg
  virtual_network_name      = var.vnet[each.key].name
  remote_virtual_network_id = var.vnet["hub"].id
  allow_forwarded_traffic   = true
}

resource "azurerm_route_table" "spoke" {
  for_each            = toset(["dev", "prod"])
  name                = "rt-${each.key}"
  location            = local.location
  resource_group_name = var.rg
  route {
    name                   = "internet-via-fw"
    address_prefix         = "0.0.0.0/0"
    next_hop_type          = "VirtualAppliance"
    next_hop_in_ip_address = local.firewall_ip
  }
  route {
    name                   = "private-via-fw" # 10.0.0.0/8 → 다음 홉 없음 시스템 경로를 덮어씀
    address_prefix         = "10.0.0.0/8"
    next_hop_type          = "VirtualAppliance"
    next_hop_in_ip_address = local.firewall_ip
  }
}

resource "azurerm_subnet_route_table_association" "spoke" {
  for_each       = { for p in flatten([for env, ids in var.spoke_subnet_ids : [for id in ids : { k = "${env}-${id}", env = env, id = id }]]) : p.k => p }
  subnet_id      = each.value.id
  route_table_id = azurerm_route_table.spoke[each.value.env].id
}

# 허용 규칙: 스포크 → 인터넷 443만. 스포크 ↔ 스포크 규칙은 만들지 않음 (기본 거부)
resource "azurerm_firewall_policy_rule_collection_group" "envs" {
  name               = "envs"
  firewall_policy_id = var.firewall_policy_id
  priority           = 200
  application_rule_collection {
    name     = "spokes-to-internet"
    priority = 200
    action   = "Allow"
    rule {
      name              = "https"
      source_addresses  = ["10.10.0.0/16", "10.20.0.0/16"]
      destination_fqdns = ["*"]
      protocols {
        type = "Https"
        port = 443
      }
    }
  }
}
