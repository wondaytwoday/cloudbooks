resource "azurerm_servicebus_namespace" "orders" {
  name                = "shop-orders"
  location            = "koreacentral"
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "Standard" # 토픽·구독은 Standard 이상
}

resource "azurerm_servicebus_topic" "orders" {
  name                                    = "orders"
  namespace_id                            = azurerm_servicebus_namespace.orders.id
  requires_duplicate_detection            = true
  duplicate_detection_history_time_window = "PT10M"
}

resource "azurerm_servicebus_subscription" "payment" {
  name                                 = "payment"
  topic_id                             = azurerm_servicebus_topic.orders.id
  max_delivery_count                   = 5     # 넘기면 데드 레터 하위 큐로
  lock_duration                        = "PT2M" # 처리 시간보다 넉넉하게
  default_message_ttl                  = "P7D"
  dead_lettering_on_message_expiration = true
}

# 주문 생성 이벤트만 결제 구독으로
resource "azurerm_servicebus_subscription_rule" "order_created" {
  name            = "order-created"
  subscription_id = azurerm_servicebus_subscription.payment.id
  filter_type     = "CorrelationFilter"
  correlation_filter {
    label = "order.created"
  }
}

resource "azurerm_monitor_metric_alert" "payment_dead_letter" {
  name                = "payment-dead-letter"
  resource_group_name = azurerm_resource_group.rg.name
  scopes              = [azurerm_servicebus_namespace.orders.id]
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.ServiceBus/namespaces"
    metric_name      = "DeadletteredMessages"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 0
  }
}

# Cosmos DB 변경 피드 트리거 Function, Durable Functions 오케스트레이터는 코드로 구현(생략)
