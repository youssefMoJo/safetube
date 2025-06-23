# deploy-processor.sh
#!/bin/bash

source .env

docker build -t safetube-processor .

docker tag safetube-processor:latest $ECR_REPO_URL
docker push $ECR_REPO_URL