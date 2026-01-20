# Google Drive Import Implementation - Complete Backend & Frontend Flow

## Overview
Implemented a complete end-to-end flow to import files from Google Drive directly into your storage app.

## Backend Implementation

### 1. **gdController.js** - Import Handler
Added the `importFromGoogleDrive` function that:

```javascript
export const importFromGoogleDrive = async (req, res, next) => {
  // 1. Validates Google Drive authorization (via signed cookie)
  // 2. Gets authenticated user from session middleware
  // 3. Validates target directory exists and user has access
  // 4. Gets Google Drive API client with user's tokens
  // 5. Fetches file metadata from Google Drive
  // 6. Creates file record in MongoDB database
  // 7. Downloads file from Google Drive as stream
  // 8. Saves file to local storage (/storage folder)
  // 9. Returns success with file details
  // 10. Handles all errors with cleanup (deletes DB record & file if failed)
}
```

#### Key Features:
- **Dual Authentication**: Uses both Google Drive user ID and storage app user ID
- **Stream Processing**: Pipes Google Drive file directly to storage (memory efficient)
- **Error Handling**: Automatic cleanup of partial uploads if any step fails
- **Validation**: 
  - Prevents importing folders
  - Validates parent directory ownership
  - Preserves original file extension

### 2. **gdRoutes.js** - Import Endpoint
Added route:
```javascript
POST /gd/import
```
Requires:
- `credentials: 'include'` for both Google Drive and user session cookies
- JSON body with:
  - `fileId`: Google Drive file ID
  - `fileName`: Original file name
  - `parentDirId`: Target directory (optional, defaults to root)

### 3. **Backend Flow Diagram**
```
Frontend Request
    ↓
/gd/import (POST)
    ↓
gdController.importFromGoogleDrive()
    ↓
Validate Google Drive Auth (sub cookie)
    ↓
Validate User Session (sid cookie via authMiddleware)
    ↓
Check Parent Directory Access
    ↓
Get Google Drive API Client
    ↓
Fetch File Metadata
    ↓
Create File Record in DB
    ↓
Download from Google Drive (Stream)
    ↓
Pipe to Local Storage
    ↓
Return Success Response
```

## Frontend Implementation

### 1. **DashboardPage.jsx** - Import Function
Added `handleImportFromGoogleDrive`:

```javascript
const handleImportFromGoogleDrive = async (file) => {
  // 1. Validates file is not a folder
  // 2. Sets loading state
  // 3. Sends POST request to /gd/import
  // 4. Includes file ID and target folder
  // 5. Shows success/error alert
  // 6. Refreshes current folder contents
}
```

#### States Added:
- `showGoogleDriveSection` - Toggle Google Drive section visibility
- `googleDriveFiles` - List of files from Google Drive
- `googleDriveBreadcrumbs` - Navigation history
- `currentGoogleDriveFolder` - Current folder being viewed
- `loadingGoogleDrive` - Loading state for API calls

#### Functions Added:
- `fetchGoogleDriveFiles()` - Fetches files from Google Drive API
- `handleOpenGoogleDriveFolder()` - Navigate into folders
- `handleNavigateGoogleDriveBreadcrumb()` - Breadcrumb navigation
- `handleImportFromGoogleDrive()` - Import a file to storage

### 2. **Google Drive Section UI**
Enhanced with import buttons on each file card:

```jsx
{file.mimeType !== 'application/vnd.google-apps.folder' && (
  <button
    onClick={() => handleImportFromGoogleDrive(file)}
    disabled={loadingGoogleDrive}
    className="mt-3 w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg..."
  >
    {loadingGoogleDrive ? 'Importing...' : 'Import to Storage'}
  </button>
)}
```

Features:
- ✅ Import button only shows for files (not folders)
- ✅ Disabled during import with loading text
- ✅ Green color to distinguish from regular storage actions
- ✅ Success/error alerts for user feedback

### 3. **User Flow**
1. User clicks "Connect Google Drive"
2. Authenticates with Google OAuth
3. Google Drive section appears with files/folders
4. User navigates through folders (breadcrumb navigation)
5. User clicks "Import to Storage" on a file
6. File downloads from Google Drive
7. File saves to user's storage
8. Success message shows
9. Storage contents auto-refresh to show new file

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│                                                              │
│ User clicks Import Button                                  │
│         ↓                                                    │
│ handleImportFromGoogleDrive(file)                          │
│         ↓                                                    │
│ POST /gd/import {fileId, fileName, parentDirId}           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              BACKEND ROUTE & MIDDLEWARE                      │
│                                                              │
│ POST /gd/import (checkAuth middleware)                      │
│         ↓                                                    │
│ Verify sid cookie → Get User from MongoDB                  │
│         ↓                                                    │
│ gdController.importFromGoogleDrive()                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│           BUSINESS LOGIC (gdController.js)                  │
│                                                              │
│ 1. Get sub cookie (Google Drive User ID)                   │
│ 2. Get req.user (Storage App User)                         │
│ 3. Validate Directory Access (parentDirId)                 │
│ 4. getDriveClient(googleUserId)                            │
│ 5. drive.files.get(fileId) - Get metadata                  │
│ 6. File.create() - Save in MongoDB                         │
│ 7. drive.files.get(fileId, alt: 'media') - Download       │
│ 8. WriteStream to /storage folder                          │
│ 9. Return Success Response                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              GOOGLE DRIVE API                               │
│                                                              │
│ google.drive.files.get(fileId)                             │
│ - Validates user still has access                          │
│ - Downloads file as stream                                 │
└─────────────────────────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│            LOCAL STORAGE & DATABASE                         │
│                                                              │
│ /storage/{fileId}.{extension}  ← File saved                │
│ MongoDB File Document           ← Metadata saved            │
└─────────────────────────────────────────────────────────────┘
```

## Security Features

1. **Dual Authentication**
   - Google Drive API requires valid access token in cookie
   - Storage app requires valid session cookie
   - Both must be present to import

2. **Authorization**
   - Parent directory ownership verified
   - User cannot import to other users' folders
   - Google Drive token refresh handled automatically

3. **Error Cleanup**
   - If import fails, partial files are deleted
   - Database records are rolled back
   - No orphaned files in storage

4. **Request Validation**
   - Folder imports are blocked
   - File IDs are validated by Google Drive API
   - Directory IDs are validated against user's data

## API Endpoints

### POST /gd/import
**Authentication Required**: Yes (both session & Google Drive)

**Request Body**:
```json
{
  "fileId": "google_drive_file_id",
  "fileName": "filename.pdf",
  "parentDirId": "mongodb_directory_id_or_null"
}
```

**Success Response (201)**:
```json
{
  "message": "File imported successfully from Google Drive",
  "file": {
    "_id": "mongo_file_id",
    "name": "filename.pdf",
    "extension": ".pdf"
  }
}
```

**Error Responses**:
- `400`: Cannot import folders
- `401`: Google Drive not authorized
- `404`: Parent directory not found
- `500`: Server error with cleanup

## File Storage Structure

After successful import:
- **Database**: MongoDB File document with name, extension, parentDirId, userId
- **Storage**: Physical file at `/storage/{fileId}.{extension}`
- **Linked**: File can be viewed, renamed, deleted like regular uploads

## Testing the Implementation

1. **Connect Google Drive**
   - Click "Connect Google Drive" button
   - Authorize with Google account
   - Google Drive section appears

2. **Import a File**
   - Navigate folders with breadcrumbs
   - Click "Import to Storage" on any file
   - Wait for success message
   - New file appears in current storage folder

3. **Verify Import**
   - File has original name and extension
   - File is in correct folder
   - File can be renamed/deleted like regular files

## Error Handling

- **Google Drive Not Authorized**: User must reconnect
- **Network Error**: Alert shown, cleanup performed
- **Folder Import Attempt**: Validation prevents this
- **Permission Issues**: Google Drive API handles securely
- **Disk Space**: System errors will be caught and cleaned up
