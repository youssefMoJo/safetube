# deploy-processor.sh
#!/bin/bash

SCRIPT_DIR="$(dirname "$0")"
ENV_PATH="$SCRIPT_DIR/../fargate-processor/.env"

if [ -f "$ENV_PATH" ]; then
  source "$ENV_PATH"
else
  echo ".env file not found at $ENV_PATH"
  exit 1
fi

aws ecr get-login-password --region ca-central-1 | docker login --username AWS --password-stdin $ECR_REPO_URL

docker buildx create --use
docker buildx build --platform linux/amd64 -f "$SCRIPT_DIR/../fargate-processor/Dockerfile" -t safetube-processor "$SCRIPT_DIR/../fargate-processor" --load

docker tag safetube-processor:latest $ECR_REPO_URL
docker push $ECR_REPO_URL