# 가드레일: 프롬프트 공격 필터 + 개인정보 마스킹
resource "aws_bedrock_guardrail" "qa" {
  name                      = "internal-qa"
  blocked_input_messaging   = "요청을 처리할 수 없습니다."
  blocked_outputs_messaging = "답변을 표시할 수 없습니다."

  content_policy_config {
    filters_config {
      type            = "PROMPT_ATTACK"
      input_strength  = "HIGH"
      output_strength = "NONE"
    }
  }

  sensitive_information_policy_config {
    pii_entities_config {
      type   = "PHONE"
      action = "ANONYMIZE"
    }
    pii_entities_config {
      type   = "EMAIL"
      action = "ANONYMIZE"
    }
  }
}

variable "embedding_model_arn" {
  type = string
}

# 지식 기반: S3 문서 → 임베딩 → OpenSearch Serverless 벡터 색인
resource "aws_bedrockagent_knowledge_base" "docs" {
  name     = "internal-docs"
  role_arn = aws_iam_role.kb.arn

  knowledge_base_configuration {
    type = "VECTOR"
    vector_knowledge_base_configuration {
      embedding_model_arn = var.embedding_model_arn # 서울 리전에서 제공되는 임베딩 모델
    }
  }

  storage_configuration {
    type = "OPENSEARCH_SERVERLESS"
    opensearch_serverless_configuration {
      collection_arn    = aws_opensearchserverless_collection.vectors.arn
      vector_index_name = "docs"
      field_mapping {
        vector_field   = "embedding"
        text_field     = "chunk"
        metadata_field = "metadata" # 부서·등급 메타데이터로 검색 필터
      }
    }
  }
}

resource "aws_bedrockagent_data_source" "s3" {
  knowledge_base_id = aws_bedrockagent_knowledge_base.docs.id
  name              = "s3-docs"

  data_source_configuration {
    type = "S3"
    s3_configuration {
      bucket_arn = aws_s3_bucket.docs.arn
    }
  }
}

# 모델 호출을 VPC 안에서: bedrock-runtime 인터페이스 엔드포인트
resource "aws_vpc_endpoint" "bedrock_runtime" {
  vpc_id              = aws_vpc.main.id
  service_name        = "com.amazonaws.ap-northeast-2.bedrock-runtime"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.endpoints.id]
  private_dns_enabled = true
}

# 서울 리전에서 쓸 수 있는 모델과 교차 리전 추론 프로필 여부는 콘솔에서 확인
