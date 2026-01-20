# Sharing Feature — Current Implementation Summary

Date: 2026-01-20

## Overview
- Feature: Share files and folders with specific users, assigning per-item permissions (`view` or `edit`).
- Roles: Users have global roles (`user`, `manager`, `admin`, `owner`). Role checks gate privileged actions elsewhere; sharing endpoints require authentication and enforce per-item permissions when accessing shared content.
- Scope covered: Backend APIs, models, middleware enforcement, and frontend UI/flows for "Shared with me" and "Shared by me" including search, preview, and removal where applicable.

## Backend
- Routes: see backend/routes/sharedRoutes.js
  - `POST /shared/search` → Search users by email for sharing.
  - `POST /shared/file/:fileId` → Share a file with a user `{ shareUserId, permission }`.
  - `POST /shared/dir/:dirId` → Share a directory recursively (subfolders and files) `{ shareUserId, permission }`.
  - `DELETE /shared/file/:fileId/:userId` → Remove a user's access from a file.
  - `DELETE /shared/dir/:dirId/:userId` → Remove a user's access from a directory and all its contents.
  - `GET /shared/by-me` → List items shared by current user (top-level only, filters nested).
  - `GET /shared/with-me` → List items shared to current user (top-level only, filters nested).
  - `GET /shared/file/:id` → Access shared file content (auth + share check).
  - `GET /shared/dir/:id` → Access shared directory data (auth + share check).

- Controllers: see backend/controller/sharedController.js
  - `searchUserByEmail` → Case-insensitive partial match, excludes current user, returns `name/email/picture`.
  - `shareFile` → Adds `{ user: shareUserId, permission }` to `file.sharedWith` if not present.
  - `shareDirectory` → Adds share to target dir, then recursively to subdirs and files.
  - `getSharedWithMe` → Returns standalone files and top-level shared directories (filters nested duplicates).
  - `removeShare` → Removes a user from `sharedWith` for file or directory; recursive for directory (subdirs and files).
  - `getMySharedItems` → Returns top-level items the current user shared (filters nested).

- Middleware: see backend/middleware/checkShare.js
  - `checkFileShare` / `checkDirectoryShare` → Verifies the resource is shared with the requester or owned; sets `req.sharePermission` to `view|edit|owner`.
  - `checkFileEditPermission` / `checkDirectoryEditPermission` → Requires `edit` permission (or owner) to proceed.
  - Auth: backend/middleware/authMiddlwWare.js attaches `req.user` and blocks soft-deleted users; includes role guards (`checkAdmin`, `checkManager`, `checkOwner`).

- Public controller used for streaming: backend/controller/publicController.js provides `sendPublicFile` and `getPublicDirData` used by shared routes after share permission checks.

## Data Models
- File: backend/models/fileModel.js
  - `sharedWith`: array of `{ user: ObjectId<User>, permission: 'view'|'edit' }`.
  - `userId`: owner; `parentDirId`; `isPublic` optional.
- Directory: backend/models/directoryModel.js
  - `sharedWith`: same structure as files; `userId`; `parentDirId`; `isPublic`.
- User: backend/models/userModel.js
  - `role`: one of `user|manager|admin|owner`; `isDelete` for soft delete; `rootDirId`.

## Frontend
- API client: frontend/src/lib/api.js
  - `sharingAPI.searchUsers(email)`
  - `sharingAPI.shareFile(fileId, shareUserId, permission)`
  - `sharingAPI.shareDirectory(dirId, shareUserId, permission)`
  - `sharingAPI.removeFileShare(fileId, userId)` / `removeDirectoryShare(dirId, userId)`
  - `sharingAPI.getSharedWithMe()` / `getSharedByMe()`
  - `sharingAPI.getSharedFile(id)` / `getSharedDirectory(id)`

- Shared by Me page: frontend/src/pages/SharedByMePage.jsx
  - Shows files/folders you shared, grid/list views, search.
  - For each item, displays who has access and their permissions.
  - "Remove access" invokes a confirmation dialog and updates local state after API success.

- Shared with Me page: frontend/src/pages/SharedWithMePage.jsx
  - Breadcrumb navigation into shared folders; grid/list views; search.
  - File cards: preview and download; permission badge; owner avatar/name.
  - Folder cards: open folder; permission badge; owner avatar/name.
  - "Remove access" is intentionally not exposed here.

- UI components:
  - Confirm dialog: frontend/src/components/ConfirmDialog.jsx (reusable, destructive variant supported).
  - Preview modal: frontend/src/components/FilePreviewModal.jsx supports image/video/audio/pdf and graceful fallback.
  - Cards: frontend/src/components/FileCard.jsx, frontend/src/components/FolderCard.jsx used in main file manager; shared pages mirror their style.

## Permissions & Roles
- Item-level permission: `view` or `edit` set per share entry; enforced by `checkShare` middleware and the `*EditPermission` checks.
- Global roles: `manager`, `admin`, `owner` are available via role middleware for privileged endpoints; sharing endpoints currently rely on `checkAuth` and per-item checks.

## Current Status
- Working: share/unshare file and folder, recursive propagation for directories, top-level listing filters, preview/download flows, confirmation dialogs where removal is allowed.
- Recent UI: clearer "Remove access" buttons (Shared by Me), responsive action rows, removed removal from Shared with Me.

## Follow-ups / TODOs
- Endpoint to update a share's permission (switch `view` ↔ `edit`).
- Audit/logging of share changes; email notifications.
- Bulk operations (multi-user share, multi-item unshare).
- Owner-only or role-based constraints on who can share to whom (policy decision).

## Quick API Examples

Share a file with edit permission:
```bash
curl -X POST http://localhost:4000/shared/file/<FILE_ID> \
  -H "Content-Type: application/json" \
  --cookie "sid=<SESSION_ID>" \
  -d '{"shareUserId":"<USER_ID>","permission":"edit"}'
```

Remove a user's access from a directory:
```bash
curl -X DELETE http://localhost:4000/shared/dir/<DIR_ID>/<USER_ID> \
  --cookie "sid=<SESSION_ID>"
```

List items shared with me:
```bash
curl http://localhost:4000/shared/with-me --cookie "sid=<SESSION_ID>"
```

Access a shared file (stream/download):
```bash
curl -OJ http://localhost:4000/shared/file/<FILE_ID> --cookie "sid=<SESSION_ID>"
```

---

This document summarizes the current sharing feature implementation and the files involved, suitable for commit documentation.