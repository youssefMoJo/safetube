resource "aws_s3_bucket" "videos_bucket" {
  bucket = "my-safetube-audios"
  # Allow Terraform to delete non-empty bucket (for development only)
  force_destroy = true
}

resource "aws_s3_bucket" "transcribe_output_bucket" {
  bucket        = "safetube-transcripts"
  force_destroy = true
}

resource "aws_s3_bucket" "cookies_bucket" {
  bucket        = "safetube-cookies"
  force_destroy = true
}

resource "aws_s3_bucket" "processor_code_bucket" {
  bucket        = "safetube-processor-code"
  force_destroy = true
}