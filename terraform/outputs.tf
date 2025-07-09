output "safetube_videos_table_arn" {
  value = aws_dynamodb_table.safetube_videos.arn
}

output "api_invoke_url" {
  value = "https://${aws_api_gateway_rest_api.safetube_api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.prod.stage_name}"
}

output "video_processing_queue_url" {
  value = aws_sqs_queue.video_processing_queue.id
}

output "video_processing_queue_arn" {
  value = aws_sqs_queue.video_processing_queue.arn
}

output "safetube_user_pool_id" {
  value = aws_cognito_user_pool.safetube_user_pool.id
}

output "safetube_user_pool_arn" {
  value = aws_cognito_user_pool.safetube_user_pool.arn
}

output "safetube_user_pool_client_id" {
  value = aws_cognito_user_pool_client.safetube_user_pool_client.id
}