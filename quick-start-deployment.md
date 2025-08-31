# 🚀 Quick Start: Auto-Deploy Your IB Study Hub

## ⚡ Get Auto-Deployment Running in 5 Minutes!

### **Step 1: Generate Firebase Token (2 minutes)**
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Generate CI token (copy this token!)
firebase login:ci
```

### **Step 2: Add Token to GitHub (1 minute)**
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. New repository secret:
   - **Name**: `FIREBASE_TOKEN`
   - **Value**: Paste the token from step 1
4. Click "Add secret"

### **Step 3: Push Code (2 minutes)**
```bash
git add .
git commit -m "Add auto-deployment to Firebase"
git push origin main
```

## 🎯 **What Happens Next:**

1. **GitHub Actions automatically:**
   - Builds your app
   - Deploys to Firebase
   - Updates your live site

2. **Your IB Study Hub goes live at:**
   **https://ib-study-hub-fa610.web.app**

3. **Every future push = Instant deployment!**

## 🔥 **Benefits You Get:**

- ✅ **Zero manual deployment** needed
- ✅ **Instant updates** when you push code
- ✅ **Professional CI/CD pipeline**
- ✅ **Always up-to-date** live site

## 🚨 **If Something Goes Wrong:**

- Check the "Actions" tab in GitHub
- Look for error messages
- Make sure the `FIREBASE_TOKEN` secret is correct
- Verify you're logged into Firebase locally

## 🎉 **After Setup:**

Your IB Study Hub will automatically deploy every time you:
- Fix a bug
- Add a new feature
- Update the UI
- Change any code

**No more manual steps - just push and it's live!** 🚀
