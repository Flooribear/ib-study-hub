# 🚀 Firebase Hosting Deployment Guide

## Prerequisites
- Node.js and npm installed
- Firebase project created (you already have: `ib-study-hub-fa610`)

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Install Firebase CLI
```bash
npm install -g firebase-tools
```

## Step 3: Login to Firebase
```bash
firebase login
```
This will open a browser window for Google authentication.

## Step 4: Initialize Firebase (if not already done)
```bash
firebase init hosting
```
- Select your project: `ib-study-hub-fa610`
- Public directory: `dist` (this is where Vite builds to)
- Configure as single-page app: `Yes`
- Don't overwrite index.html: `No`

## Step 5: Build Your App
```bash
npm run build
```
This creates a `dist` folder with your production-ready files.

## Step 6: Deploy to Firebase
```bash
npm run deploy
```
Or just the hosting:
```bash
npm run deploy:hosting
```

## Step 7: View Your App
Your app will be available at: https://ib-study-hub-fa610.web.app

## 🔄 Continuous Deployment

### Option 1: Manual Deployment
```bash
npm run build && firebase deploy
```

### Option 2: Deploy Only Hosting
```bash
npm run build && firebase deploy --only hosting
```

### Option 3: Deploy Everything
```bash
firebase deploy
```

## 📁 Project Structure
```
your-project/
├── src/                 # Source code
├── dist/                # Build output (created by npm run build)
├── firebase.json        # Firebase configuration
├── .firebaserc         # Firebase project settings
├── package.json         # Dependencies and scripts
└── DEPLOYMENT.md        # This file
```

## 🚨 Troubleshooting

### Build Errors
- Make sure all dependencies are installed: `npm install`
- Check for syntax errors: `npm run lint`
- Verify Vite configuration: `vite.config.js`

### Deployment Errors
- Ensure you're logged in: `firebase login`
- Check project ID: `firebase projects:list`
- Verify build output exists: `ls dist/`

### App Not Loading
- Check Firebase console for deployment status
- Verify domain configuration
- Check browser console for errors

## 🔧 Environment Variables
If you need environment variables for production, create a `.env.production` file:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=ib-study-hub-fa610
```

## 📱 Performance Tips
- Images are automatically optimized by Vite
- CSS and JS are minified and bundled
- Static assets are cached with long expiration
- Single-page app routing is configured

## 🆘 Need Help?
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [Vite Build Docs](https://vitejs.dev/guide/build.html)
- [Firebase Console](https://console.firebase.google.com/project/ib-study-hub-fa610)
