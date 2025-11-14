resource "aws_cognito_user_pool" "safetube_user_pool" {
  name = "safetube-user-pool"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = false
  }

  auto_verified_attributes = ["email"]

  tags = {
    Environment = "dev"
    Project     = "SafeTube"
  }
}

resource "aws_cognito_user_pool_client" "safetube_user_pool_client" {
  name         = "safetube-user-pool-client"
  user_pool_id = aws_cognito_user_pool.safetube_user_pool.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]

  prevent_user_existence_errors = "ENABLED"
}
