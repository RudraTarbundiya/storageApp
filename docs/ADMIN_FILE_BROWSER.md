# Admin File Browser Feature

The Admin File Browser allows administrators and owners to browse, preview, and download files belonging to any user in the system.

## Access

- **Required Role**: Admin or Owner
- **Entry Point**: Users Page → Click "Files" button on any user card
- **Route**: `/admin/files/:userId`

## Features

### 1. User File Browsing
Navigate through a user's file system with a familiar folder structure:
- View folders with item count and total size
- View files with extension badges and file sizes
- Breadcrumb navigation for easy backtracking

### 2. File Preview
Preview supported file types directly in the browser:
- **Images**: jpg, jpeg, png, gif, webp, svg, bmp, ico
- **Videos**: mp4, webm, ogg, mov, avi, mkv
- **Audio**: mp3, wav, ogg, aac, flac, m4a
- **PDF**: Full document preview

### 3. File Download
Download any file from a user's storage with a single click.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/user/:userId/root` | Get user's root directory ID |
| GET | `/admin/directory/:id` | Get directory contents |
| GET | `/admin/file/:id` | Get/download file |

## UI Components

### UsersPage Buttons
All action buttons now include descriptive labels:
- **Logout** - Log out the user
- **Files** - Browse user's files (new)
- **Delete** - Delete the user
- **Recover** - Recover deleted user (owner only)

### AdminFileBrowserPage
- User info header with avatar
- Breadcrumb navigation bar
- Grid layout for files and folders
- Folder cards with "Open Folder" button
- File cards with "Preview" and "Download" buttons

## Security

- Requires authentication (login)
- Requires admin or owner role
- Files are fetched via authenticated API calls
- Preview uses blob URLs to handle auth cookies
