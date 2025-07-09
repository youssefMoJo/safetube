resource "aws_api_gateway_rest_api" "safetube_api" {
  name        = "safetube-api"
  description = "API for processing YouTube links"
}

resource "aws_api_gateway_resource" "process" {
  rest_api_id = aws_api_gateway_rest_api.safetube_api.id
  parent_id   = aws_api_gateway_rest_api.safetube_api.root_resource_id
  path_part   = "process"
}

resource "aws_api_gateway_method" "post_method" {
  rest_api_id   = aws_api_gateway_rest_api.safetube_api.id
  resource_id   = aws_api_gateway_resource.process.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_authorizer.id
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id = aws_api_gateway_rest_api.safetube_api.id
  resource_id = aws_api_gateway_resource.process.id
  http_method = aws_api_gateway_method.post_method.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.process_video.invoke_arn
}

resource "aws_lambda_permission" "allow_apigateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.process_video.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.safetube_api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "deployment" {
  depends_on  = [
  aws_api_gateway_integration.lambda_integration,
  aws_api_gateway_method.post_method,
  aws_api_gateway_authorizer.cognito_authorizer]
  rest_api_id = aws_api_gateway_rest_api.safetube_api.id
  triggers = {
    redeployment = timestamp()
  }
}

resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.deployment.id
  rest_api_id   = aws_api_gateway_rest_api.safetube_api.id
  stage_name    = "prod"
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_authorizer" "cognito_authorizer" {
  name            = "safetube-cognito-authorizer"
  rest_api_id     = aws_api_gateway_rest_api.safetube_api.id
  identity_source = "method.request.header.Authorization"
  type            = "COGNITO_USER_POOLS"
  provider_arns   = [aws_cognito_user_pool.safetube_user_pool.arn]
}