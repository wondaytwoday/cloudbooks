resource "google_bigquery_dataset" "curated" {
  dataset_id = "curated"
  location   = "asia-northeast3"
}

# 날짜 파티션 + 클러스터링, 파티션 필터 없는 쿼리는 거부
resource "google_bigquery_table" "orders" {
  dataset_id               = google_bigquery_dataset.curated.dataset_id
  table_id                 = "orders"
  require_partition_filter = true
  clustering               = ["customer_id", "status"]

  time_partitioning {
    type          = "DAY"
    field         = "ordered_at"
    expiration_ms = 94608000000 # 3년
  }

  schema = jsonencode([
    { name = "order_id", type = "STRING", mode = "REQUIRED" },
    { name = "customer_id", type = "STRING" },
    { name = "status", type = "STRING" },
    { name = "ordered_at", type = "TIMESTAMP", mode = "REQUIRED" },
    {
      name        = "phone"
      type        = "STRING"
      policyTags  = { names = [google_data_catalog_policy_tag.pii.name] }
      description = "정책 태그로 열 수준 접근 제어"
    }
  ])
}

# 열 수준 보안: 개인정보 정책 태그
resource "google_data_catalog_taxonomy" "sensitivity" {
  region                 = "asia-northeast3"
  display_name           = "sensitivity"
  activated_policy_types = ["FINE_GRAINED_ACCESS_CONTROL"]
}

resource "google_data_catalog_policy_tag" "pii" {
  taxonomy     = google_data_catalog_taxonomy.sensitivity.id
  display_name = "pii"
}

# 웹 로그: Pub/Sub → BigQuery 구독으로 바로 적재
resource "google_pubsub_subscription" "weblogs_to_bq" {
  name  = "weblogs-to-bq"
  topic = "projects/shop-example/topics/weblogs"

  bigquery_config {
    table            = "shop-example.raw.weblogs"
    use_table_schema = true
  }

  dead_letter_policy {
    dead_letter_topic     = "projects/shop-example/topics/weblogs-dead-letter"
    max_delivery_attempts = 5
  }
}

# Datastream 스트림·연결 프로필, Dataform 저장소, 동적 마스킹 규칙은 생략
