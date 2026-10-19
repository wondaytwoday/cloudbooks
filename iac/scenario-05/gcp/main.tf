resource "google_pubsub_topic" "orders" {
  name = "orders"
}

resource "google_pubsub_topic" "payment_dead_letter" {
  name = "payment-dead-letter"
}

# 데드 레터 토픽에도 구독이 있어야 메시지가 남는다
resource "google_pubsub_subscription" "payment_dead_letter" {
  name                       = "payment-dead-letter"
  topic                      = google_pubsub_topic.payment_dead_letter.id
  message_retention_duration = "604800s" # 7일
}

resource "google_pubsub_subscription" "payment" {
  name                       = "payment"
  topic                      = google_pubsub_topic.orders.id
  ack_deadline_seconds       = 120 # 처리 시간보다 넉넉하게
  message_retention_duration = "604800s"
  filter                     = "attributes.type = \"order.created\""

  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.payment_dead_letter.id
    max_delivery_attempts = 5
  }
}

# Pub/Sub 서비스 에이전트가 데드 레터 토픽에 게시할 수 있어야 함
resource "google_pubsub_topic_iam_member" "dlq_publisher" {
  topic  = google_pubsub_topic.payment_dead_letter.id
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:service-123456789@gcp-sa-pubsub.iam.gserviceaccount.com"
}

resource "google_pubsub_subscription_iam_member" "dlq_subscriber" {
  subscription = google_pubsub_subscription.payment.id
  role         = "roles/pubsub.subscriber"
  member       = "serviceAccount:service-123456789@gcp-sa-pubsub.iam.gserviceaccount.com"
}

# Firestore 문서 생성 → Cloud Run 발행기 (Eventarc 트리거)
resource "google_eventarc_trigger" "order_created" {
  name     = "order-created"
  location = "asia-northeast3"

  matching_criteria {
    attribute = "type"
    value     = "google.cloud.firestore.document.v1.created"
  }
  matching_criteria {
    attribute = "database"
    value     = "(default)"
  }

  destination {
    cloud_run_service {
      service = "order-publisher"
      region  = "asia-northeast3"
    }
  }

  event_data_content_type = "application/protobuf"
  service_account         = google_service_account.eventarc.email
}
