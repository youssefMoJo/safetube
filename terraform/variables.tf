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

variable "subnet_ids" {
  description = "List of subnet IDs for ECS tasks"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for ECS tasks"
}

variable "RAPIDAPI_KEY_1" {
  description = "RapidAPI Key 1"
  type        = string
}

variable "RAPIDAPI_KEY_2" {
  description = "RapidAPI Key 2"
  type        = string
}

variable "RAPIDAPI_KEY_3" {
  description = "RapidAPI Key 3"
  type        = string
}

variable "RAPIDAPI_KEY_4" {
  description = "RapidAPI Key 4"
  type        = string
}