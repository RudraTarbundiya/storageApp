# Google Drive Integration Guide

This guide explains how to use the Google Drive integration feature to import files from your Google Drive into the storage app.

## Features

- **OAuth 2.0 Authorization**: Securely connect your Google Drive account
- **Browse Google Drive**: Navigate through your Google Drive folders and files
- **Selective Import**: Choose specific files to import into your storage
- **Read-Only Access**: The app only requests read-only access to your Google Drive

## How to Use

### 1. Connect Google Drive

1. Click the **"Connect Google Drive"** button in the dashboard toolbar
2. You'll be redirected to Google's authorization page in a popup window
3. Sign in with your Google account and grant read-only access
4. The popup will close automatically after authorization

### 2. Browse Your Google Drive

1. Once connected, click **"Import from Google Drive"** 
2. A modal will open showing your Google Drive contents
3. Navigate through folders by clicking on them
4. Use breadcrumbs at the top to go back to parent folders

### 3. Select and Import Files

1. Click on files to select them (folders cannot be imported)
2. Selected files will be highlighted with a checkmark
3. Click **"Import Selected"** to import the files to your storage
4. Files will be downloaded from Google Drive and saved to your current folder

## Backend Endpoints

### `GET /google-drive/auth-url`
Returns the Google OAuth authorization URL.

### `POST /google-drive/authorize`
Exchanges the authorization code for access tokens.

**Body:**
```json
{
  "code": "authorization_code_from_google"
}
```

### `GET /google-drive/check-auth`
Check if the user has authorized Google Drive access.

**Response:**
```json
{
  "authorized": true
}
```

### `GET /google-drive/files?folderId=xxx`
Lists files and folders in a specific Google Drive folder.

**Query Parameters:**
- `folderId` (optional): The folder ID to list. Defaults to 'root'.

**Response:**
```json
{
  "files": [
    {
      "id": "file_id",
      "name": "filename.pdf",
      "mimeType": "application/pdf",
      "modifiedTime": "2024-01-01T00:00:00.000Z",
      "size": "12345"
    }
  ]
}
```

### `POST /google-drive/import`
Imports a file from Google Drive to your storage.

**Body:**
```json
{
  "fileId": "google_drive_file_id",
  "fileName": "filename.pdf",
  "mimeType": "application/pdf",
  "targetFolderId": "optional_folder_id"
}
```

## Security Notes

- The app only requests **read-only** access to your Google Drive
- Access tokens are securely stored in the database
- Each user's tokens are isolated and encrypted
- You can revoke access at any time from your Google Account settings

## Technical Details

### Frontend Components

- `DashboardPage.jsx`: Main dashboard with Google Drive integration
- `GoogleDriveCallback.jsx`: Handles OAuth callback

### Backend Components

- `googleDriveRoutes.js`: Route definitions
- `googleDriveController.js`: Business logic for Google Drive operations
- `tokenModel.js`: Database model for storing OAuth tokens

### Database Schema

The `Token` model stores:
- `userId`: Reference to the user
- `accessToken`: Google Drive access token
- `refreshToken`: Google Drive refresh token (for long-term access)
- `expiryDate`: Token expiration timestamp

## Troubleshooting

**Problem: "Google Drive not authorized" error**
- Solution: Click "Connect Google Drive" again to reauthorize

**Problem: Files not appearing after import**
- Solution: Refresh the page or navigate to a different folder and back

**Problem: Authorization popup is blocked**
- Solution: Allow popups for your app's domain in browser settings

## Future Enhancements

- Support for importing entire folders
- Progress indicator for large file imports
- Automatic token refresh when expired
- Support for Google Docs/Sheets export formats
