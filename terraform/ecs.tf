resource "aws_ecs_cluster" "safetube_cluster" {
  name = "safetube-cluster"
}

resource "aws_ecs_task_definition" "safetube_task" {
  family                   = "safetube-processor"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  network_mode             = "awsvpc"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = "safetube-processor"
      image     = var.ecr_image_url
      essential = true
      environment = [
        {
          name  = "SQS_QUEUE_URL"
          value = var.sqs_queue_url
        },
        {
          name  = "S3_BUCKET_NAME"
          value = aws_s3_bucket.videos_bucket.bucket
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "VIDEO_DLQ_URL"
          value = aws_sqs_queue.video_dlq.id
        },
        {
          name  = "RAPIDAPI_KEY"
          value = var.RAPIDAPI_KEY
        },
        { name = "TRANSCRIBE_OUTPUT_BUCKET", value = aws_s3_bucket.transcribe_output_bucket.bucket },
        { name = "COOKIES_BUCKET", value = aws_s3_bucket.cookies_bucket.bucket },
        { name = "COOKIES_KEY", value = "cookies.txt" }

      ],
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          awslogs-group         = "/ecs/safetube"
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}