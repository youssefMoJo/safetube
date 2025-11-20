#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COOKIE_FILE="$SCRIPT_DIR/all_cookies.txt"
VENV_DIR="$SCRIPT_DIR/venv"
S3_BUCKET="safetube-cookies"  
S3_KEY="all_cookies.txt"

# Create venv if missing
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

# Upgrade pip and install browser_cookie3 if missing
"$VENV_DIR/bin/pip" install --upgrade pip
"$VENV_DIR/bin/pip" install --upgrade browser_cookie3

# Refresh cookies
"$VENV_DIR/bin/python" <<END
import browser_cookie3
from http.cookiejar import MozillaCookieJar

cj = browser_cookie3.chrome()
netscape_cj = MozillaCookieJar("$COOKIE_FILE")
for cookie in cj:
    netscape_cj.set_cookie(cookie)
netscape_cj.save(ignore_discard=True, ignore_expires=True)
print(f"✅ Cookies refreshed and saved to: $COOKIE_FILE")
END

# Upload to S3
echo "Uploading cookies to s3://$S3_BUCKET/$S3_KEY..."
aws s3 cp "$COOKIE_FILE" "s3://$S3_BUCKET/$S3_KEY" --acl private
echo "✅ Uploaded to S3 successfully!"

# Delete local cookies file after upload
rm -f "$COOKIE_FILE"
echo "✅ Local cookies file deleted."