# GitHub Pages Deployment Instructions

Follow these steps to deploy your AI Life Coach app to GitHub Pages:

## 1. Run the deployment script

Simply run the `deploy.bat` file by double-clicking on it or running it from the command prompt:

```
.\deploy.bat
```

This will:

- Add the necessary configuration files to Git
- Commit them with a descriptive message
- Push the changes to GitHub

## 2. Check deployment status

Visit your GitHub repository's Actions tab to monitor the deployment:
https://github.com/Qasim21569/PBL-AI-Life-Coach/actions

The GitHub Pages workflow will:

1. Set up a Node.js environment
2. Install dependencies
3. Build your Next.js application for static export
4. Upload the build artifacts
5. Deploy to GitHub Pages

## 3. Access your deployed site

Once the workflow completes successfully, your site will be available at:
https://qasim21569.github.io/PBL-AI-Life-Coach/

## 4. Setting up GitHub Pages (one-time setup)

If this is your first deployment, you may need to enable GitHub Pages in your repository settings:

1. Go to your repository settings
2. Scroll down to the "GitHub Pages" section
3. Under "Source", select "GitHub Actions"

## 5. Setting up repository secrets

For the deployment to work correctly, make sure the following secrets are set in your GitHub repository:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `HUGGINGFACE_API_KEY`

To add these secrets:

1. Go to your repository settings
2. Click on "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Add each secret with its value from your `.env.local` file
