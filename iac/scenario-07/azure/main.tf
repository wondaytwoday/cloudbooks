# ADLS Gen2 = 계층형 네임스페이스를 켠 스토리지 계정
resource "azurerm_storage_account" "lake" {
  name                     = "shoplakeexample"
  resource_group_name      = azurerm_resource_group.data.name
  location                 = "koreacentral"
  account_tier             = "Standard"
  account_replication_type = "ZRS"
  is_hns_enabled           = true
}

resource "azurerm_storage_data_lake_gen2_filesystem" "raw" {
  name               = "raw"
  storage_account_id = azurerm_storage_account.lake.id
}

resource "azurerm_storage_data_lake_gen2_filesystem" "curated" {
  name               = "curated"
  storage_account_id = azurerm_storage_account.lake.id
}

# 오래된 원본은 쿨·아카이브 계층으로
resource "azurerm_storage_management_policy" "lake" {
  storage_account_id = azurerm_storage_account.lake.id

  rule {
    name    = "raw-tiering"
    enabled = true
    filters {
      prefix_match = ["raw/"]
      blob_types   = ["blockBlob"]
    }
    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 30
        tier_to_archive_after_days_since_modification_greater_than = 180
        delete_after_days_since_modification_greater_than          = 1095
      }
    }
  }
}

# 웹 로그: Event Hubs Capture로 원본 영역에 파일 적재
resource "azurerm_eventhub" "weblogs" {
  name              = "weblogs"
  namespace_id      = azurerm_eventhub_namespace.main.id
  partition_count   = 4
  message_retention = 1

  capture_description {
    enabled             = true
    encoding            = "Avro"
    interval_in_seconds = 300
    destination {
      name                = "EventHubArchive.AzureBlockBlob"
      archive_name_format = "{Namespace}/{EventHub}/{PartitionId}/{Year}/{Month}/{Day}/{Hour}/{Minute}/{Second}"
      blob_container_name = azurerm_storage_data_lake_gen2_filesystem.raw.name
      storage_account_id  = azurerm_storage_account.lake.id
    }
  }
}

# Synapse 작업 영역, Data Factory 파이프라인·CDC, Purview 계정은 생략
