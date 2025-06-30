#!/bin/bash

set -e

REPO="safetube-processor"
KEEP=2  # Number of images to always keep (latest + 1 additional recent)

echo "🔎 Fetching digest for image tagged 'latest'..."
LATEST_DIGEST=$(aws ecr describe-images --repository-name "$REPO" \
  --query "imageDetails[?contains(imageTags || \`[]\`, 'latest')].imageDigest" \
  --output text)

if [ -z "$LATEST_DIGEST" ]; then
  echo "❌ No image with the 'latest' tag found in repository. Aborting cleanup."
  exit 1
fi

echo "📌 Digest for 'latest' tag: $LATEST_DIGEST"

echo "🔎 Fetching all image digests sorted by push time (oldest → newest)..."
aws ecr describe-images --repository-name "$REPO" \
  --query 'sort_by(imageDetails, &imagePushedAt)[*].imageDigest' \
  --output text | tr '\t' '\n' > all_digests.txt

TOTAL_IMAGES=$(wc -l < all_digests.txt)
echo "📦 Total images in repository: $TOTAL_IMAGES"

if [ "$TOTAL_IMAGES" -le "$KEEP" ]; then
  echo "✅ Repository has $TOTAL_IMAGES images (<= $KEEP). Nothing to delete."
  rm -f all_digests.txt
  exit 0
fi

# Build list of digests to keep
> keep_digests.txt

# Always keep the 'latest' digest
echo "$LATEST_DIGEST" >> keep_digests.txt

# Keep the most recent image digest that is NOT 'latest'
grep -v -Fx "$LATEST_DIGEST" all_digests.txt | tail -n 1 >> keep_digests.txt

echo "✅ Digests to keep:"
cat keep_digests.txt

# Determine which digests to delete
grep -v -Ff keep_digests.txt all_digests.txt > to_delete.txt

if [ ! -s to_delete.txt ]; then
  echo "✅ No old images to delete."
else
  echo "🗑 Deleting the following digests:"
  cat to_delete.txt

  # Build delete command
  image_ids=""
  while read -r digest; do
    image_ids="$image_ids imageDigest=$digest"
  done < to_delete.txt

  echo "🔁 Running batch-delete..."
  aws ecr batch-delete-image --repository-name "$REPO" --image-ids $image_ids
  echo "✅ Old images deleted successfully!"
fi

# Cleanup temp files
rm -f all_digests.txt keep_digests.txt to_delete.txt
echo "✅ Cleanup complete!"