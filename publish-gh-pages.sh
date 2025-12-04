#!/usr/bin/env bash
# Publish to GitHub Pages
# This script builds the Angular app and deploys it to the gh-pages branch

set -e  # Exit on error

echo "🚀 Publishing to GitHub Pages..."

# Get the git remote URL
REMOTE_URL=$(git remote get-url origin)
if [ -z "$REMOTE_URL" ]; then
    echo "❌ Error: No git remote 'origin' found"
    exit 1
fi

echo "📡 Remote URL: $REMOTE_URL"

# Extract repo name from URL for base href
# Handle both HTTPS and SSH URLs
if [[ $REMOTE_URL =~ github\.com[:/]([^/]+)/([^/.]+) ]]; then
    OWNER="${BASH_REMATCH[1]}"
    REPO="${BASH_REMATCH[2]}"
    BASE_HREF="https://$OWNER.github.io/$REPO/"
    echo "📦 Repository: $OWNER/$REPO"
    echo "🔗 Base HREF: $BASE_HREF"
else
    echo "❌ Error: Could not parse GitHub repository from remote URL"
    exit 1
fi

# Build the Angular app with correct base href
echo ""
echo "🔨 Building Angular app..."
npm run build -- --base-href="$BASE_HREF"

DIST_PATH="dist/time-widget/browser"
if [ ! -d "$DIST_PATH" ]; then
    echo "❌ Error: Build output not found at $DIST_PATH"
    exit 1
fi

echo "✅ Build successful"

# Navigate to dist folder
cd "$DIST_PATH"

echo ""
echo "📤 Deploying to gh-pages branch..."

# Initialize git repo in dist folder
git init
git checkout -b gh-pages
git remote add origin "$REMOTE_URL"

# Add all files and commit
git add .
git commit -m "publish"

# Force push to gh-pages
git push --force origin gh-pages

echo ""
echo "✅ Successfully published to GitHub Pages!"
echo "🌐 Your app will be available at: https://$OWNER.github.io/$REPO/"
