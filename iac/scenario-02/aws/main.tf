# 정적 파일: 비공개 버킷 + CloudFront 원본 액세스 제어(OAC)
resource "aws_s3_bucket" "site" {
  bucket = "shop-web-example"
}

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "shop-web-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "web" {
  enabled             = true
  default_root_object = "index.html"

  origin {
    origin_id                = "site"
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  origin {
    origin_id   = "api"
    domain_name = replace(aws_apigatewayv2_api.api.api_endpoint, "https://", "")
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # /api/* 는 캐시하지 않음 (관리형 CachingDisabled 정책)
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "api"
    viewer_protocol_policy = "https-only"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
  }

  # default_cache_behavior, custom_error_response(SPA 404 → index.html),
  # restrictions, viewer_certificate, web_acl_id 는 생략
}

# API: HTTP API + Cognito JWT 권한 부여자 + Lambda
resource "aws_apigatewayv2_api" "api" {
  name          = "shop-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id           = aws_apigatewayv2_api.api.id
  name             = "cognito"
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  jwt_configuration {
    audience = [aws_cognito_user_pool_client.web.id]
    issuer   = "https://${aws_cognito_user_pool.users.endpoint}"
  }
}

resource "aws_lambda_function" "api" {
  function_name = "shop-api"
  runtime       = "nodejs22.x"
  handler       = "index.handler"
  role          = aws_iam_role.api.arn
  filename      = "build/api.zip"
  memory_size   = 512
  timeout       = 10 # HTTP API 통합 제한 시간(최대 30초)보다 짧게
}

resource "aws_dynamodb_table" "orders" {
  name         = "orders"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  attribute {
    name = "pk"
    type = "S"
  }
  attribute {
    name = "sk"
    type = "S"
  }
}
