# Google Drive Import - Setup & Testing Guide

## Prerequisites

Ensure you have:
1. Both frontend and backend running
2. MongoDB connected
3. Google OAuth credentials configured
4. `/storage` folder exists in backend

## How It Works

### Complete Import Flow

```
1. User Authorization
   ├─ User clicks "Connect Google Drive"
   ├─ Google OAuth popup opens
   ├─ User grants read-only access to Google Drive
   └─ Authorization code sent to backend

2. Token Management
   ├─ Backend exchanges code for Google tokens
   ├─ Tokens stored in MongoDB (GoogleToken collection)
   ├─ Cookie set with Google User ID (sub)
   └─ Ready for file operations

3. Browse Google Drive
   ├─ Click "Connect Google Drive" button to show section
   ├─ Google Drive files/folders load from root
   ├─ Click folders to navigate deeper
   ├─ Breadcrumbs show current location
   └─ Click folder in breadcrumb to go back

4. Import a File
   ├─ Click "Import to Storage" button on any file
   ├─ Request sent to POST /gd/import
   ├─ Backend validates authorization
   ├─ File downloaded from Google Drive via API
   ├─ File saved to local /storage folder
   ├─ Database record created
   └─ Success message shown

5. File Available
   ├─ New file appears in current storage folder
   ├─ Can be renamed like other files
   ├─ Can be downloaded
   └─ Can be deleted
```

## Step-by-Step Testing

### Step 1: Start Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 2: Connect Google Drive
1. Login to your storage app
2. Go to Dashboard
3. Click **"Connect Google Drive"** button (green button with Drive icon)
4. Google popup opens
5. Sign in with your Google account
6. Grant read-only access to Google Drive
7. Popup closes automatically
8. "My Google Drive" section appears with files

### Step 3: Browse Files
1. Look at your Google Drive files in the section
2. Click on a folder to open it
3. Breadcrumbs at top show: My Drive / FolderName
4. Click "My Drive" in breadcrumb to go back to root
5. Navigate through multiple folders

### Step 4: Import a File
1. Find a file you want to import
2. Click the **"Import to Storage"** button (green button on file card)
3. Button changes to "Importing..." with loading state
4. Wait for success message: `"filename.pdf" imported successfully!`
5. Your storage folder auto-refreshes

### Step 5: Verify Import
1. Your new file appears in the storage section below
2. File has original name from Google Drive
3. File extension is preserved
4. You can download, rename, or delete it
5. File appears in breadcrumb's current location

## Backend Endpoints

### GET /gd/list-files
Lists files from Google Drive

**Headers**: Needs valid `sub` cookie (Google User ID)

**Response**:
```json
{
  "files": [
    {
      "id": "google_drive_file_id",
      "name": "Document.pdf",
      "mimeType": "application/pdf",
      "modifiedTime": "2024-01-12T10:30:00.000Z"
    },
    {
      "id": "google_drive_folder_id",
      "name": "My Folder",
      "mimeType": "application/vnd.google-apps.folder"
    }
  ]
}
```

### POST /gd/import
Imports a file from Google Drive to storage

**Headers**: 
- `Cookie`: Must have both `sub` (Google) and `sid` (session) cookies
- `Content-Type`: application/json

**Body**:
```json
{
  "fileId": "google_drive_file_id",
  "fileName": "Document.pdf",
  "parentDirId": null
}
```

**Response (201 Created)**:
```json
{
  "message": "File imported successfully from Google Drive",
  "file": {
    "_id": "mongo_file_id",
    "name": "Document.pdf",
    "extension": ".pdf"
  }
}
```

## File Structure After Import

### In Database (MongoDB)
```
File Document:
{
  _id: ObjectId("..."),
  name: "Document.pdf",
  extension: ".pdf",
  parentDirId: ObjectId("..."),
  userId: ObjectId("..."),
  __v: 0
}
```

### In Storage (File System)
```
/backend/storage/
  └── {mongo_file_id}.pdf  ← Actual file content
```

## Troubleshooting

### "Google Drive not authorized" error
**Problem**: Tried to import but Google Drive not connected
**Solution**: 
1. Click "Connect Google Drive" again
2. Complete the authorization flow
3. Try importing again

### Google Drive section not showing
**Problem**: Clicked "Connect Google Drive" but section didn't appear
**Solution**:
1. Check browser console for errors
2. Verify Google OAuth credentials are correct
3. Check backend logs for token exchange errors
4. Try reconnecting

### File import hangs
**Problem**: Clicked import but it stays "Importing..."
**Solution**:
1. Check backend logs for errors
2. Verify file exists in Google Drive
3. Check disk space on server
4. Verify `/storage` folder has write permissions
5. Refresh page and try again

### File appears but can't download
**Problem**: File imported but can't be downloaded/viewed
**Solution**:
1. Check `/storage` folder has the file with correct ID
2. Verify file permissions are correct
3. Restart backend server
4. Try re-importing the file

### Permission denied error
**Problem**: "You do not have access to this file"
**Solution**:
1. This is a Google Drive permission issue
2. Ensure the Google account has access to the file
3. File might be shared with another account
4. Try with a different file

## Network & Performance

### File Size Limits
- No explicit limit in code
- Limited by:
  - Disk space on server
  - RAM available (streaming helps with this)
  - Google Drive API limits

### Large File Import (>100MB)
- Stream processing handles this efficiently
- No full file loaded into memory
- Direct pipe from Google Drive to storage
- Monitor backend logs during import

### Slow Connection
- Import might take time depending on file size
- Keep page open until success message
- Don't close browser during import
- Backend will continue in background if needed

## Security Notes

1. **Google Drive Access**
   - Read-only access only
   - User can revoke access anytime from Google account
   - Token refresh handled automatically

2. **File Ownership**
   - Files are tied to your user account
   - Other users cannot access imported files
   - Delete files from storage to remove completely

3. **Data Encryption**
   - Tokens stored securely in MongoDB
   - HTTP only cookies prevent JS access
   - Files stored locally are as secure as your server

## Debug Mode

To see detailed logs, check:

**Backend Console**:
```
UserId in listFiles: xyz...
Import error: ...
```

**Browser Console** (F12):
```
POST /gd/import
Response: { message: ... }
```

Enable more logging by adding `console.log` statements in:
- `gdController.js` - importFromGoogleDrive function
- `DashboardPage.jsx` - handleImportFromGoogleDrive function

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Cannot import folders" | Tried to import folder | Only files can be imported, not folders |
| 401 Unauthorized | Google Drive not connected | Click "Connect Google Drive" first |
| File import fails silently | Network error | Check console for error details |
| File appears twice | Double click on import | It's just UI caching, refresh page |
| Extension lost | File has no extension | Check original Google Drive file |
| Wrong folder | parentDirId mismatch | Make sure correct folder is selected |
| Slow import | Large file | Patience, it will complete, check backend logs |

## Next Steps

After successful import:
1. ✅ File appears in storage
2. ✅ Can rename the file
3. ✅ Can download the file
4. ✅ Can delete the file
5. ✅ Can move to other folders (if implemented)

## Advanced Usage

### Import Multiple Files
1. Import first file
2. Wait for success
3. Import second file
4. Repeat as needed

### Bulk Import
To import multiple files at once, you would need to:
1. Add a checkbox selection system
2. Add "Import Selected" button
3. Loop through selected files
4. Make multiple API calls
5. Show progress for each file

This is not currently implemented but could be added in future updates.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs: `npm run dev` output
3. Check browser console: Press F12
4. Verify MongoDB is running and connected
5. Ensure Google OAuth credentials are valid
