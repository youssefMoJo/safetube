#!/bin/bash

echo "🔄 Zipping Lambda code..."
cd ./lambda/processVideo
zip -r "./processVideo.zip" .
cd ../../

echo "🚀 Applying Terraform to deploy updated Lambda..."
terraform apply -auto-approve
