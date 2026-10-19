resource "aws_dynamodb_table" "orders" {
  name             = "orders"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "orderId"
  stream_enabled   = true
  stream_view_type = "NEW_IMAGE" # 변경 = 이벤트의 원천

  attribute {
    name = "orderId"
    type = "S"
  }
}

resource "aws_cloudwatch_event_bus" "orders" {
  name = "orders"
}

# DynamoDB Streams → 이벤트 버스 (발행 코드 없음)
resource "aws_pipes_pipe" "orders" {
  name     = "orders-to-bus"
  role_arn = aws_iam_role.pipe.arn
  source   = aws_dynamodb_table.orders.stream_arn
  target   = aws_cloudwatch_event_bus.orders.arn

  source_parameters {
    dynamodb_stream_parameters {
      starting_position = "LATEST"
      batch_size        = 10
    }
  }
}

# 결제 큐 + DLQ
resource "aws_sqs_queue" "payment_dlq" {
  name                      = "payment-dlq"
  message_retention_seconds = 1209600 # 14일
}

resource "aws_sqs_queue" "payment" {
  name                       = "payment"
  visibility_timeout_seconds = 120    # 처리 시간보다 넉넉하게
  message_retention_seconds  = 345600 # 4일
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.payment_dlq.arn
    maxReceiveCount     = 5
  })
}

# 주문 생성 이벤트만 결제 큐로
resource "aws_cloudwatch_event_rule" "order_created" {
  name           = "order-created"
  event_bus_name = aws_cloudwatch_event_bus.orders.name
  event_pattern = jsonencode({
    detail = { eventName = ["INSERT"] }
  })
}

resource "aws_cloudwatch_event_target" "payment" {
  rule           = aws_cloudwatch_event_rule.order_created.name
  event_bus_name = aws_cloudwatch_event_bus.orders.name
  arn            = aws_sqs_queue.payment.arn
}

resource "aws_cloudwatch_metric_alarm" "payment_age" {
  alarm_name          = "payment-queue-stuck"
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateAgeOfOldestMessage"
  dimensions          = { QueueName = aws_sqs_queue.payment.name }
  statistic           = "Maximum"
  period              = 60
  evaluation_periods  = 5
  threshold           = 300
  comparison_operator = "GreaterThanThreshold"
}

# 큐 정책(이벤트 버스의 SendMessage 허용), Step Functions 상태 머신은 생략
