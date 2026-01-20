# File Preview Feature

This document describes the centralized file preview system used across the application.

## Overview

The file preview system provides a unified, context-based approach to previewing various file types. It supports images, videos, audio, PDFs, code files, and office documents.

## Supported File Types

| Type | Extensions | Preview Method |
|------|------------|----------------|
| **Image** | jpg, jpeg, png, gif, webp, svg, bmp, ico | Native `<img>` tag |
| **Video** | mp4, webm, ogg, mov, avi, mkv | Streaming via `<video>` |
| **Audio** | mp3, wav, ogg, aac, flac, m4a | Streaming via `<audio>` |
| **PDF** | pdf | Embedded `<iframe>` |
| **Code** | js, jsx, ts, tsx, html, css, py, java, json, md, txt, sql, etc. | Text content in `<pre>` block |
| **Document** | doc, docx, xls, xlsx, ppt, pptx | Google Docs Viewer is not worked because it demands public files but files in server is protected |
| **Other** | * | "View as Text" fallback |

## Architecture

### Core Components

1. **`fileUtils.js`** (`frontend/src/lib/fileUtils.js`)
   - `getFileType(extension)` - Categorizes files
   - `getFileIcon(extension)` - Returns Lucide icon component
   - `getGradient(extension)` - Returns gradient class for file cards
   - `formatFileSize(bytes)` - Human-readable file size

2. **`PreviewContext.jsx`** (`frontend/src/context/PreviewContext.jsx`)
   - Manages global preview state
   - Provides `handlePreview(file, fetchConfig)` function
   - Handles cleanup and request abortion

3. **`FilePreviewModal.jsx`** (`frontend/src/components/FilePreviewModal.jsx`)
   - Renders preview UI based on context state
   - Supports all file types with appropriate viewers

### State Management

```javascript
const {
  previewOpen,      // boolean - modal visibility
  previewFile,      // object - current file being previewed
  previewUrl,       // string - blob or stream URL
  previewText,      // string - text content for code files
  previewLoading,   // boolean - loading indicator
  handlePreview,    // function - trigger preview
  closePreview      // function - close and cleanup
} = usePreview();
```

## Usage

### In Page Components

```jsx
import { usePreview } from '@/context';
import FilePreviewModal from '@/components/FilePreviewModal';
import { fileAPI } from '@/lib/api';

function MyPage() {
  const { handlePreview } = usePreview();

  const onPreviewClick = (file) => {
    handlePreview(file, {
      fetcher: (id, signal) => fileAPI.get(id, { signal, responseType: 'blob' }),
      streamUrl: `http://localhost:4000/file/${file._id}`
    });
  };

  return (
    <>
      {/* Your file list UI */}
      <FilePreviewModal onDownload={handleDownload} />
    </>
  );
}
```

### Fetch Config Options

| Property | Type | Description |
|----------|------|-------------|
| `fetcher` | `(id, signal) => Promise` | API function for blob download |
| `streamUrl` | `string` | Direct URL for video/audio streaming |

## Performance Optimizations

### Video/Audio Streaming
- Uses direct URLs instead of blob downloads
- Browser handles HTTP Range requests automatically
- Allows immediate playback and seeking

### Request Cancellation
- Uses `AbortController` to cancel pending fetches
- Prevents memory leaks when quickly switching previews

### URL Cleanup
- `URL.revokeObjectURL()` called on modal close
- Streaming URLs are not revoked (not blob URLs)

## Pages Using This Feature

- `DashboardPage.jsx` - Main file browser
- `SharedWithMePage.jsx` - Files shared with current user
- `AdminFileBrowserPage.jsx` - Admin user file viewer
- `PublicSharePage.jsx` - Public shared file/folder view
