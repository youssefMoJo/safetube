resource "aws_lambda_function" "process_video" {
  function_name = "processVideo"
  role          = aws_iam_role.lambda_exec_role.arn

  handler = "index.handler"
  runtime = "nodejs20.x"

  # s3_bucket = "safetube-lambda-deployments"
  # s3_key    = "processVideo.zip"

  filename         = "${path.module}/lambda/processVideo/processVideo.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/processVideo/processVideo.zip")

  environment {
    variables = {
      RAPID_API_KEY = var.rapid_api_key
      SQS_QUEUE_URL   = aws_sqs_queue.video_processing_queue.id
    }
  }

  timeout     = 30
  memory_size = 128
}
