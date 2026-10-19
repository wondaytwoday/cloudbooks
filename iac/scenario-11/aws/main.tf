resource "aws_sagemaker_model" "rec_v13" {
  name               = "recommender-v13"
  execution_role_arn = aws_iam_role.sagemaker.arn

  primary_container {
    image          = "123456789012.dkr.ecr.ap-northeast-2.amazonaws.com/recommender-serving:2.1"
    model_data_url = "s3://shop-models-example/recommender/v13/model.tar.gz"
  }
}

resource "aws_sagemaker_endpoint_configuration" "rec_v13" {
  name = "recommender-v13"

  production_variants {
    variant_name           = "main"
    model_name             = aws_sagemaker_model.rec_v13.name
    instance_type          = "ml.g5.xlarge"
    initial_instance_count = 2
  }
}

# 블루/그린 배포: 10% 카나리 → 10분 관찰 → 전체, 경보가 울리면 자동 롤백
resource "aws_sagemaker_endpoint" "rec" {
  name                 = "recommender"
  endpoint_config_name = aws_sagemaker_endpoint_configuration.rec_v13.name

  deployment_config {
    blue_green_update_policy {
      termination_wait_in_seconds = 300
      traffic_routing_configuration {
        type                     = "CANARY"
        wait_interval_in_seconds = 600
        canary_size {
          type  = "CAPACITY_PERCENT"
          value = 10
        }
      }
    }

    auto_rollback_configuration {
      alarms {
        alarm_name = aws_cloudwatch_metric_alarm.rec_errors.alarm_name
      }
      alarms {
        alarm_name = "recommender-ctr-drop" # 비즈니스 지표 경보
      }
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "rec_errors" {
  alarm_name          = "recommender-5xx"
  namespace           = "AWS/SageMaker"
  metric_name         = "Invocation5XXErrors"
  dimensions          = { EndpointName = "recommender", VariantName = "main" }
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 3
  threshold           = 5
  comparison_operator = "GreaterThanThreshold"
}

# 엔드포인트 오토스케일(aws_appautoscaling_*), 학습 파이프라인 정의는 생략
# 관리형 스팟 학습은 학습 작업 설정의 EnableManagedSpotTraining=true, CheckpointConfig.S3Uri로 켭니다
