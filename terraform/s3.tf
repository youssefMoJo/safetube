
resource "aws_s3_bucket" "safetube_bucket" {
  bucket        = "safetube-${random_id.bucket_id.hex}"
  # Allow Terraform to delete non-empty bucket (for development only)
  force_destroy = true 
}

resource "random_id" "bucket_id" {
  byte_length = 4
}