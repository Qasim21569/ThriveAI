# GitHub Pages Deployment Steps

## Step 1: Add deployment files to Git

Copy and paste these commands one by one into your terminal:

```
git add .github/workflows/github-pages.yml
git add next.config.js
git add package.json
git add public/.nojekyll
git add DEPLOYMENT_INSTRUCTIONS.md
git add DEPLOYMENT_STEPS.md
```

## Step 2: Commit the changes

```
git commit -m "Update GitHub Pages deployment configuration with latest actions"
```

## Step 3: Push to GitHub

```
git push
```

## Step 4: Monitor deployment

Go to your GitHub repository's Actions tab:
https://github.com/Qasim21569/PBL-AI-Life-Coach/actions

Note: We've updated the GitHub Actions to use the latest versions:

- Updated `actions/upload-pages-artifact` from v2 to v3
- Updated `actions/deploy-pages` from v2 to v4

This fixes the deprecation error previously encountered.

## Step 5: Setup GitHub Pages (one-time only)

1. Go to your repository settings
2. Scroll down to the "GitHub Pages" section
3. Under "Source", select "GitHub Actions"

## Step 6: Add repository secrets

Add the following secrets to your GitHub repository:

1. Go to your repository settings
2. Click on "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Add each secret with its value from your `.env.local` file:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `HUGGINGFACE_API_KEY`

## Step 7: Access your deployed site

Once the workflow completes successfully, your site will be available at:
https://qasim21569.github.io/PBL-AI-Life-Coach/
