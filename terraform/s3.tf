resource "aws_s3_bucket" "videos_bucket" {
  bucket = "my-safetube-videos"
  # Allow Terraform to delete non-empty bucket (for development only)
  force_destroy = true
}