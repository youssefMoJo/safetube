#!/bin/bash

set -e

REPO="safetube-processor"
KEEP=2

echo "Fetching all image digests from ECR, sorted by push time..."
aws ecr describe-images --repository-name $REPO \
  --query 'sort_by(imageDetails,&imagePushedAt)[*].imageDigest' \
  --output text | tr '\t' '\n' > all_digests.txt

echo "Keeping latest $KEEP images (skipping deletion for those)..."
tail -n $KEEP all_digests.txt | sort > keep_digests.txt

comm -23 all_digests.txt keep_digests.txt > to_delete.txt

if [ ! -s to_delete.txt ]; then
  echo "✅ No old images to delete."
  rm -f all_digests.txt keep_digests.txt to_delete.txt
  exit 0
fi

echo "Deleting the following digests:"
cat to_delete.txt

image_ids=""
for digest in $(cat to_delete.txt); do
  image_ids="$image_ids imageDigest=$digest"
done

echo "Running batch-delete..."
aws ecr batch-delete-image --repository-name $REPO --image-ids $image_ids

echo "✅ Old images deleted successfully!"

rm -f all_digests.txt keep_digests.txt to_delete.txt

echo "✅ Cleanup complete!"