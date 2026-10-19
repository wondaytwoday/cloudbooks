resource "azurerm_machine_learning_workspace" "ml" {
  name                    = "shop-ml"
  location                = "koreacentral"
  resource_group_name     = azurerm_resource_group.ml.name
  application_insights_id = azurerm_application_insights.ml.id
  key_vault_id            = azurerm_key_vault.ml.id
  storage_account_id      = azurerm_storage_account.ml.id

  identity {
    type = "SystemAssigned"
  }
}

# 학습용 GPU 클러스터: 저우선순위 VM, 쓰지 않으면 0대
resource "azurerm_machine_learning_compute_cluster" "train" {
  name                          = "gpu-train"
  location                      = "koreacentral"
  machine_learning_workspace_id = azurerm_machine_learning_workspace.ml.id
  vm_size                       = "Standard_NC24ads_A100_v4"
  vm_priority                   = "LowPriority"

  scale_settings {
    min_node_count                       = 0
    max_node_count                       = 2
    scale_down_nodes_after_idle_duration = "PT15M"
  }

  identity {
    type = "SystemAssigned"
  }
}

# 관리형 온라인 엔드포인트와 블루·그린 배포는 azapi 공급자나 CLI로 관리:
#   az ml online-endpoint create -n recommender
#   az ml online-deployment create -n green --endpoint recommender -f green.yml
#   az ml online-endpoint update -n recommender --traffic "blue=90 green=10"
