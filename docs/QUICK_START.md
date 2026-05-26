# Quick Start Guide

## 🚀 Get Running in 5 Minutes

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Set Up Google OAuth (Required)

**Quick Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing
3. Enable **Google Drive API**
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add authorized origin: `http://localhost:5175`
6. Copy the **Client ID**

### 3. Configure Environment

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` and paste your Client ID:
```env
VITE_GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
VITE_API_BASE_URL=http://localhost:4000
```

### 4. Start Development Server
```bash
npm run dev
```

Open http://localhost:5175

---

## 📋 Where to Set Google OAuth Client ID

### Location 1: Frontend Environment Variable (Main)
**File**: `frontend/.env`
```env
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

This is read by:
- `frontend/src/main.jsx` - GoogleOAuthProvider wrapper
- `frontend/src/lib/googleAuth.js` - OAuth configuration

### Location 2: Backend Configuration (If Applicable)
**File**: `backend/.env`
```env
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

Used for:
- Server-side token exchange
- Verifying OAuth tokens
- Google Drive API calls

---

## 🎯 Quick Reference

### Google Cloud Console URLs
- **Main Console**: https://console.cloud.google.com/
- **APIs & Services**: https://console.cloud.google.com/apis/dashboard
- **Credentials**: https://console.cloud.google.com/apis/credentials
- **OAuth Consent**: https://console.cloud.google.com/apis/credentials/consent

### Important URLs to Configure

**Authorized JavaScript origins:**
```
http://localhost:5175        (Development)
https://yourdomain.com       (Production)
```

**Authorized redirect URIs:**
```
http://localhost:5175/auth/callback        (Development)  
https://yourdomain.com       (Production)
```

---

## 🔑 Using Google OAuth in the App

### For User Authentication (Login)
```jsx
// LoginPage.jsx
import { useGoogleLogin } from '@react-oauth/google'

const googleLogin = useGoogleLogin({
  onSuccess: async (codeResponse) => {
    // Send code to backend
    await authAPI.googleLogin(codeResponse.code)
  }
})
```

### For Google Drive Access
```jsx
// GoogleDrivePage.jsx
import { useGoogleLogin } from '@react-oauth/google'
import { googleLoginConfig } from '@/lib/googleAuth'

const googleLogin = useGoogleLogin({
  ...googleLoginConfig,
  onSuccess: async (codeResponse) => {
    // Authorize Drive access
    await googleDriveAPI.authorize(codeResponse.code)
  }
})
```

---

## ⚠️ Common Issues

**Issue**: "Google OAuth not configured"
- **Fix**: Add `VITE_GOOGLE_CLIENT_ID` to `.env` file

**Issue**: "redirect_uri_mismatch"
- **Fix**: Ensure `http://localhost:5175/auth/callback` is in authorized redirect URIs

**Issue**: "invalid_client"
- **Fix**: Verify Client ID is correct and has no extra spaces

**Issue**: "access_denied"
- **Fix**: Publish OAuth consent screen or add yourself as test user

---

## 📖 Need More Help?

See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for detailed instructions.