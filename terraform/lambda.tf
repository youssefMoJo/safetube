resource "aws_lambda_function" "process_video" {
  function_name = "processVideo"
  role          = aws_iam_role.lambda_exec_role.arn

  handler = "index.handler"
  runtime = "nodejs20.x"

  filename         = "${path.module}/../lambda/processVideo/processVideo.zip"
  source_code_hash = filebase64sha256("${path.module}/../lambda/processVideo/processVideo.zip")

  environment {
    variables = {
      RAPID_API_KEY = var.rapid_api_key
      SQS_QUEUE_URL   = aws_sqs_queue.video_processing_queue.id
      DYNAMO_VIDEOS_TABLE = aws_dynamodb_table.safetube_videos.name
    }
  }

  timeout     = 30
  memory_size = 128
}

resource "aws_lambda_function" "trigger_ecs" {
  function_name = "triggerECSTaskFromSQS"
  role          = aws_iam_role.lambda_exec_role.arn

  handler = "index.handler"
  runtime = "nodejs20.x"

  filename         = "${path.module}/../lambda/triggerECS/triggerECS.zip"
  source_code_hash = filebase64sha256("${path.module}/../lambda/triggerECS/triggerECS.zip")

  timeout     = 60
  memory_size = 256

  environment {
    variables = {
      ECS_CLUSTER       = aws_ecs_cluster.safetube_cluster.name
      ECS_TASK_DEFINITION = aws_ecs_task_definition.safetube_task.arn
      SUBNETS           = join(",", var.subnet_ids)
      SECURITY_GROUP    = var.security_group_id
    }
  }
}

resource "aws_lambda_event_source_mapping" "sqs_to_trigger_ecs" {
  event_source_arn  = aws_sqs_queue.video_processing_queue.arn
  function_name     = aws_lambda_function.trigger_ecs.arn
  batch_size        = 1
  enabled           = true
}