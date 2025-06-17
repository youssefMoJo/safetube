resource "aws_dynamodb_table" "safetube_videos" {
  name         = "safetube_videos"
  billing_mode = "PAY_PER_REQUEST" # On-demand pricing (no capacity planning)

  hash_key = "video_id"

  attribute {
    name = "video_id"
    type = "S" # String
  }

  tags = {
    Environment = "dev"
    Project     = "SafeTube"
  }
}