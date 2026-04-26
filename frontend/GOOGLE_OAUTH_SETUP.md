# Google OAuth Setup Guide

This guide will help you configure Google OAuth for the Storix application.

## Prerequisites

- Google Cloud Platform account
- Access to Google Cloud Console

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown (top-left)
3. Click "New Project"
4. Enter project name (e.g., "Storix App")
5. Click "Create"

### 2. Enable Required APIs

1. In the Google Cloud Console, select your project
2. Go to "APIs & Services" > "Library"
3. Search for and enable the following APIs:
   - **Google Drive API**
   - **Google+ API** (for user profile information)
4. Click "Enable" for each API

### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select user type:
   - **Internal** (if using Google Workspace)
   - **External** (for public users)
3. Click "Create"
4. Fill in the required information:
   - **App name**: Storix App
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click "Save and Continue"
6. Add scopes (click "Add or Remove Scopes"):
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
7. Click "Update" and "Save and Continue"
8. Add test users (if External):
   - Click "Add Users"
   - Enter email addresses of test users
9. Click "Save and Continue"
10. Review and click "Back to Dashboard"

### 4. Create OAuth 2.0 Client ID

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Select application type: **Web application**
4. Enter a name (e.g., "Storix Web Client")
5. Add **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   ```
   For production, also add:
   ```
   https://yourdomain.com
   ```
6. Add **Authorized redirect URIs**:
   ```
   http://localhost:5173
   ```
   For production, also add:
   ```
   https://yourdomain.com
   ```
7. Click "Create"
8. **Copy the Client ID** (you'll need this in the next step)

### 5. Configure Frontend Environment

1. In the `frontend` folder, create a `.env` file (or copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and paste your Google OAuth Client ID:
   ```env
   VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
   VITE_API_BASE_URL=http://localhost:4000
   ```

3. Replace `YOUR_CLIENT_ID_HERE.apps.googleusercontent.com` with your actual Client ID

### 6. Configure Backend (if needed)

If your backend also needs Google OAuth configuration, create a `.env` file in the `backend` folder:

```env
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_REDIRECT_URI=http://localhost:4000/auth/google/callback
```

You can find the **Client Secret** in the same credentials page where you got the Client ID.

## Testing the Setup

1. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to http://localhost:5173/login

3. Click "Sign in with Google" button

4. You should see the Google OAuth consent screen

5. Grant the requested permissions

6. You should be redirected back to the application

## Troubleshooting

### "redirect_uri_mismatch" Error

**Problem**: The redirect URI in the OAuth request doesn't match the authorized redirect URIs.

**Solution**:
- Ensure the redirect URI in Google Cloud Console matches exactly
- For development: `http://localhost:5173`
- Check for trailing slashes - they must match exactly

### "invalid_client" Error

**Problem**: The Client ID is incorrect or not found.

**Solution**:
- Verify the Client ID in your `.env` file
- Ensure there are no extra spaces or line breaks
- Re-copy the Client ID from Google Cloud Console

### "access_denied" Error

**Problem**: The OAuth consent screen is not published or user denied access.

**Solution**:
- If using External user type, publish the OAuth consent screen
- Ensure the user is added as a test user (for External apps in testing)
- Check that all required scopes are configured

### Google Drive API Not Working

**Problem**: Cannot access Google Drive files after authentication.

**Solution**:
- Verify Google Drive API is enabled in Google Cloud Console
- Check that the correct scopes are requested in `frontend/src/lib/googleAuth.js`
- Ensure the backend is properly exchanging the authorization code for tokens

## Security Best Practices

1. **Never commit `.env` files** - They're already in `.gitignore`
2. **Use environment-specific Client IDs** - Different IDs for development and production
3. **Restrict redirect URIs** - Only add URIs you control
4. **Regularly rotate secrets** - Update Client Secrets periodically
5. **Monitor API usage** - Check Google Cloud Console for unusual activity

## Production Deployment

When deploying to production:

1. Create a new OAuth 2.0 Client ID for production (recommended)
2. Add production domain to Authorized JavaScript origins
3. Add production domain to Authorized redirect URIs
4. Update environment variables in your hosting platform
5. Ensure HTTPS is enabled (required for production)

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API Documentation](https://developers.google.com/drive/api/guides/about-sdk)
- [@react-oauth/google Library](https://github.com/MomenSherif/react-oauth)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify all setup steps were completed
3. Review the troubleshooting section above
4. Check Google Cloud Console logs for API errors