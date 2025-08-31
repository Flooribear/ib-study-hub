# 🚀 GitHub Actions + Firebase Auto-Deployment (Simple Method)

## What This Gives You:
- ✅ **Automatic deployment** every time you push code
- ✅ **No manual steps** needed
- ✅ **Professional CI/CD pipeline**
- ✅ **Instant updates** to your live IB Study Hub

## Step 1: Generate Firebase CI Token

### 1.1 Install Firebase CLI Locally (if not already done)
```bash
npm install -g firebase-tools
```

### 1.2 Login to Firebase
```bash
firebase login
```

### 1.3 Generate CI Token
```bash
firebase login:ci
```
- This will open a browser window
- Complete the authentication
- **Copy the token** that appears in the terminal

## Step 2: Add Token to GitHub Repository

### 2.1 Go to Your GitHub Repository
- Go to your repository on GitHub
- Click "Settings" tab
- Click "Secrets and variables" → "Actions"

### 2.2 Add Firebase Token Secret
- Click "New repository secret"
- **Name**: `FIREBASE_TOKEN`
- **Value**: Paste the token you copied from step 1.3
- Click "Add secret"

## Step 3: Push Code to GitHub

### 3.1 Commit and Push
```bash
git add .
git commit -m "Add GitHub Actions auto-deployment"
git push origin main
```

### 3.2 Watch the Magic Happen!
- Go to your GitHub repository
- Click "Actions" tab
- You'll see the deployment workflow running
- When it completes, your app will be live at: https://ib-study-hub-fa610.web.app

## How It Works:

1. **You push code** to GitHub
2. **GitHub Actions automatically:**
   - Installs dependencies
   - Builds your app
   - Deploys to Firebase hosting
3. **Your IB Study Hub updates instantly!**

## What Happens After Setup:

- ✅ **Every push** = Automatic deployment
- ✅ **No manual steps** needed
- ✅ **Instant updates** to live site
- ✅ **Professional workflow**

## Troubleshooting:

### If deployment fails:
1. Check the "Actions" tab in GitHub
2. Look for error messages
3. Verify the `FIREBASE_TOKEN` secret is correct
4. Make sure you're logged into Firebase locally

### Common issues:
- **Firebase token** expired or incorrect
- **Not logged into Firebase** locally
- **Firebase project** not initialized

## Your Live App:
After successful setup, your IB Study Hub will be available at:
**https://ib-study-hub-fa610.web.app**

And it will **automatically update** every time you push code changes! 🎉

## Alternative Setup:
If you prefer the more secure service account method, check `setup-github-actions.md` instead.
