#!/bin/bash

echo "🔄 Zipping Lambda code..."
cd ./lambda/processVideo
zip -r "./processVideo.zip" .
cd ../../

echo "🚀 Applying Terraform to deploy updated Lambda..."
cd terraform 
terraform apply -auto-approve

echo "✅ Deployment complete!"