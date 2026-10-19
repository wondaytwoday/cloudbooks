resource "azurerm_kubernetes_cluster" "main" {
  name                = "shop"
  location            = "koreacentral"
  resource_group_name = azurerm_resource_group.rg.name
  dns_prefix          = "shop"
  sku_tier            = "Standard" # 컨트롤 플레인 가동 시간 SLA

  default_node_pool {
    name           = "system"
    vm_size        = "Standard_D4ds_v5"
    zones          = ["1", "2", "3"] # 생성 후 변경 불가
    vnet_subnet_id = azurerm_subnet.aks_nodes.id
    node_count     = 3
    only_critical_addons_enabled = true
  }

  network_profile {
    network_plugin      = "azure"
    network_plugin_mode = "overlay" # 파드는 VNet 밖 대역 사용
    pod_cidr            = "192.168.0.0/16"
  }

  identity {
    type = "SystemAssigned"
  }

  oidc_issuer_enabled       = true
  workload_identity_enabled = true
}

resource "azurerm_kubernetes_cluster_node_pool" "apps" {
  name                  = "apps"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = "Standard_D4ds_v5"
  zones                 = ["1", "2", "3"]
  vnet_subnet_id        = azurerm_subnet.aks_nodes.id
  auto_scaling_enabled  = true
  min_count             = 3
  max_count             = 60
}

# 파드 권한: 관리 ID ↔ 쿠버네티스 서비스 계정 페더레이션
resource "azurerm_user_assigned_identity" "orders" {
  name                = "orders-api"
  location            = "koreacentral"
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_federated_identity_credential" "orders" {
  name                = "orders-api"
  resource_group_name = azurerm_resource_group.rg.name
  parent_id           = azurerm_user_assigned_identity.orders.id
  issuer              = azurerm_kubernetes_cluster.main.oidc_issuer_url
  subject             = "system:serviceaccount:orders:orders-api"
  audience            = ["api://AzureADTokenExchange"]
}

# ACR 연결(AcrPull 역할), Application Gateway for Containers, Key Vault CSI 애드온은 생략
