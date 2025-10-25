resource "aws_sqs_queue" "video_dlq" {
  name = "video_dlq"
}

resource "aws_sqs_queue" "video_processing_queue" {
  name                       = "SafeTube-VideoProcessingQueue"
  visibility_timeout_seconds = 300      # 5 minutes — enough time to process a video
  message_retention_seconds  = 86400    # 1 day retention, adjust as needed
  delay_seconds              = 0        # No delay before messages become visible
  receive_wait_time_seconds  = 20       # Enable long polling (reduces empty receives)

  tags = {
    Project = "SafeTube"
    Environment = "prod"
  }

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.video_dlq.arn
    maxReceiveCount     = 3
  })
}

