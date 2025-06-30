variable "rapid_api_key" {
  description = "API key for RapidAPI"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  description = "aws_region for the resources"
  type        = string
}

variable "ecr_image_url" {
  description = "The full ECR image URL for the video processor"
  type        = string
}

variable "sqs_queue_url" {
  description = "URL of the SQS queue"
  type        = string
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket to upload videos"
  type        = string
}
