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

resource "aws_dynamodb_table" "safetube_parents" {
  name         = "safetube_parents"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "parent_id"

  attribute {
    name = "parent_id"
    type = "S"
  }

  tags = {
    Environment = "dev"
    Project     = "SafeTube"
  }
}

resource "aws_dynamodb_table" "safetube_children" {
  name         = "safetube_children"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "child_id"

  attribute {
    name = "child_id"
    type = "S"
  }

  tags = {
    Environment = "dev"
    Project     = "SafeTube"
  }
}