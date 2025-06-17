output "safetube_videos_table_arn" {
  value = aws_dynamodb_table.safetube_videos.arn
}

output "api_invoke_url" {
  value = "https://${aws_api_gateway_rest_api.safetube_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.prod.stage_name}"
}