resource "aws_cloudwatch_log_group" "ecs_safetube_log_group" {
  name              = "/ecs/safetube"
  retention_in_days = 7
}

