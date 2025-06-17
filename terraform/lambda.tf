resource "aws_lambda_function" "process_video" {
  function_name = "processVideo"
  role          = aws_iam_role.lambda_exec_role.arn

  handler = "index.handler"
  runtime = "nodejs20.x"

  s3_bucket = "safetube-lambda-deployments"
  s3_key    = "processVideo.zip"

  environment {
    variables = {
      RAPID_API_KEY = var.rapid_api_key
    }
  }

  timeout     = 30
  memory_size = 128
}
