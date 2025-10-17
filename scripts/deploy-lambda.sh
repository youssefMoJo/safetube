#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAMBDA_DIR="$SCRIPT_DIR/../lambda"
TERRAFORM_DIR="$SCRIPT_DIR/../terraform"

# Check if folder name was provided
if [ -z "$1" ]; then
  echo "❌ Please provide the Lambda function folder name or 'all' to zip all functions."
  echo "Usage: ./deploy-lambda.sh <function-folder-name|all>"
  exit 1
fi

INPUT="$1"
VERBOSE="${2:-false}"  # optional second argument: verbose=true

# Determine folders to process
if [ "$INPUT" = "all" ]; then
  FOLDERS=("$LAMBDA_DIR"/*)
else
  FOLDERS=("$LAMBDA_DIR/$INPUT")
fi

echo "🔹 Starting Lambda zipping process..."

for folder_path in "${FOLDERS[@]}"; do
  # Skip if not a directory
  [ -d "$folder_path" ] || continue

  FUNCTION_FOLDER=$(basename "$folder_path")
  ZIP_FILE="${FUNCTION_FOLDER}.zip"

  echo "🔄 Zipping Lambda code for '${FUNCTION_FOLDER}'..."

  # Remove old zip if exists
  [ -f "$folder_path/$ZIP_FILE" ] && rm "$folder_path/$ZIP_FILE"

  # Zip contents into the same folder
  pushd "$folder_path" > /dev/null || { echo "Folder not found: $FUNCTION_FOLDER"; continue; }
  if [ "$VERBOSE" = "true" ]; then
    zip -r "$ZIP_FILE" .
  else
    zip -r "$ZIP_FILE" . > /dev/null
  fi
  popd > /dev/null

  echo "✅ Zipped: $ZIP_FILE"
done

echo "🚀 Applying Terraform to deploy updated Lambdas..."
cd "$TERRAFORM_DIR" || { echo "Terraform folder not found at $TERRAFORM_DIR!"; exit 1; }
terraform apply -auto-approve
cd ../

echo "✅ Deployment complete for all selected Lambdas!"