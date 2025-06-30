# deploy-processor.sh
#!/bin/bash

source .env

aws ecr get-login-password --region ca-central-1 | docker login --username AWS --password-stdin $ECR_REPO_URL

docker buildx create --use
docker buildx build --platform linux/amd64 -t safetube-processor . --load

docker tag safetube-processor:latest $ECR_REPO_URL
docker push $ECR_REPO_URL