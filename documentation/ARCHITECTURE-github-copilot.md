# GoogleDrive Backend Architecture

This document describes the backend architecture and API contracts for the GoogleDrive-like storage app. It is designed as a precise prompt for building the frontend. All endpoints, request/response shapes, authentication, and data models are documented below.

## Overview
- Backend: Node.js (ESM) + Express + Mongoose (MongoDB)
- Auth: Signed, HTTP-only cookie (`sid`)
- Storage: Files saved on disk under `backend/storage` named by `file._id + extension`
- CORS: `http://localhost:5173` with credentials enabled
- Port: `4000`
- Global error format: `{ error: string }` with appropriate HTTP status codes

## Running the Backend
- Requires local MongoDB with user `rudra` (password `rudra`) and DB `storageApp`.
- Environment variable: `RESEND_API_KEY` for sending OTP emails.
- Start: `npm run start` within `backend/` (runs `node --watch server.js`).

## Authentication & Sessions
- Login sets a signed, HTTP-only cookie `sid` (1-week maxAge in cookie). Backend sessions auto-expire after 1 hour via TTL.
- `checkAuth` middleware guards `/directory` and `/file` routes.
- If a user accumulates too many sessions (>=3), one is pruned to keep concurrent sessions limited.
- Frontend must send credentials on all protected requests: `fetch(url, { credentials: 'include' })`.

## Data Models (MongoDB via Mongoose)

### User
```
User {
  _id: ObjectId,
  name: string (min 3),
  email: string (unique, valid pattern),
  password: string (bcrypt hashed on save),
  rootDirId: ObjectId (ref Directory)
}
```

### Directory
```
Directory {
  _id: ObjectId,
  name: string,
  userId: ObjectId,
  parentDirId: ObjectId | null (ref Directory)
}
```

### File
```
File {
  _id: ObjectId,
  name: string,
  extension: string,
  parentDirId: ObjectId (ref Directory),
  userId: ObjectId (ref User)
}
```

### Session
```
Session {
  _id: ObjectId,
  userId: ObjectId (ref User),
  createdAt: Date (TTL 3600s → auto-expire 1 hour)
}
```

### OTP
```
OTP {
  _id: ObjectId,
  email: string,
  otp: number,
  createdAt: Date (TTL 300s → auto-expire 5 minutes)
}
```

## Middleware
- `checkAuth`: Ensures `sid` cookie exists, validates session, loads `req.user`. Prunes sessions if too many.
- `idCheckMiddleware`: Validates `ObjectId` format for `:id` route params; responds `400` if invalid.
- Global error handler: catches thrown errors and returns `{ error }` with `status` or `500`.

## API Contracts
Base URL: `http://localhost:4000`
All protected routes require `credentials: 'include'`.

### User Routes (`/user`)

- POST `/user/send-otp`
  - Body: `{ email: string }`
  - Sends a 4-digit OTP email using Resend; stores OTP with 5-minute TTL.
  - Success: `201 { success: true, message: string }`

- POST `/user/register`
  - Body: `{ name: string, otp: string|number, email: string, password: string }`
  - Creates user and a root directory in a transaction.
  - Success: `201 { message: 'User registered successfully' }`
  - Errors: `400 { error: 'Invalid OTP..' }`, validation errors, duplicate email.

- POST `/user/login`
  - Body: `{ email: string, password: string }`
  - On success: sets signed, HTTP-only `sid` cookie; returns `200 { message: 'Login successful' }`.
  - Errors: `401 { error: 'not registered!!' }`, `401 { error: 'Invalid email or password !' }`.

- GET `/user` (protected)
  - Returns current user profile.
  - Success: `200 { name: string, email: string }`

- POST `/user/logout`
  - Clears `sid` cookie and deletes the current session.
  - Success: `204 { message: 'Logout successful' }`

- POST `/user/logoutall` (protected)
  - Clears cookie and deletes all sessions for the user.
  - Success: `204 { message: 'Logout from all devices successful' }`

### Directory Routes (`/directory`) (protected)

- GET `/directory` or `/directory/:id`
  - If no `:id` provided, returns root directory (`req.user.rootDirId`).
  - Response: `200` with directory fields plus `files[]` and `directories[]`.
  - Shape:
    ```json
    {
      "_id": "<dirId>",
      "name": "<dir name>",
      "userId": "<userId>",
      "parentDirId": null | "<dirId>",
      "files": [
        { "id": "<fileId>", "_id": "<fileId>", "name": "<name>", "extension": ".txt", "parentDirId": "<dirId>", "userId": "<userId>" }
      ],
      "directories": [
        { "id": "<dirId>", "_id": "<dirId>", "name": "<name>", "userId": "<userId>", "parentDirId": "<dirId>" }
      ]
    }
    ```

- POST `/directory` or `/directory/:parentId`
  - Creates a directory under the given parent or root.
  - Header: `dirname: <string>` (defaults to `"new folder"`).
  - Success: `201 { message: 'Directory created' }`

- PATCH `/directory/:id`
  - Body: `{ newDirName: string }`
  - Success: `200 { message: 'Directory renamed' }`

- DELETE `/directory/:id`
  - Recursively deletes directory and its contents (files on disk and documents).
  - Success: `200 { message: 'Directory and all its contents deleted' }`

### File Routes (`/file`) (protected)

- GET `/file/:id`
  - Query: `?action=download` to trigger a download with original filename; otherwise streams/serves the file inline.
  - Errors: `404 { error: 'File not found and or you do not have access to it!' }`

- PATCH `/file/:id`
  - Body: `{ newFileName: string }`
  - Success: `200 { message: 'File renamed', newName: string }`

- DELETE `/file/:id`
  - Deletes file document and removes file from disk.
  - Success: `200 { message: 'File deleted successfully' }`

- POST `/file` or `/file/:parentDirId`
  - Uploads a file to root or specified directory.
  - Header: `filename: <string>` (required to set extension; defaults to `"untitled"`).
  - Body: raw binary stream (frontend should `fetch` with the file Blob or ReadableStream).
  - Success: `201 { message: 'File uploaded successfully' }`
  - Failure cleanup: backend rolls back files/doc on stream error.

## Storage Details
- Files saved under `backend/storage/` using filename: `<file._id><extension>`.
- Download: `GET /file/:id?action=download` to prompt download using stored `name`.

## Frontend Integration Requirements
- Always send `credentials: 'include'` on requests to keep cookies.
- Handle session TTL (1 hour). If `401 { error: 'Not logged!' }`, redirect to login.
- OTP flow:
  1. Call `POST /user/send-otp` with email.
  2. Submit `POST /user/register` with name, email, password, and received `otp`.
- Login flow: `POST /user/login` then navigate to app; cookie is set by server.
- Directory browsing UI:
  - Fetch root via `GET /directory`.
  - Navigate using `GET /directory/:id`.
  - Create folder via `POST /directory` or `/directory/:parentId` with `dirname` header.
  - Rename via `PATCH /directory/:id` with `{ newDirName }`.
  - Delete via `DELETE /directory/:id` with confirmation.
- File UI:
  - Upload: `POST /file` or `/file/:parentDirId` with `filename` header and binary body.
  - Rename: `PATCH /file/:id` with `{ newFileName }`.
  - Delete: `DELETE /file/:id`.
  - Preview/Download: `GET /file/:id` or `GET /file/:id?action=download`.

## Example Frontend Calls

```ts
// Use base URL and always include credentials
const BASE = 'http://localhost:4000';

// Send OTP
await fetch(`${BASE}/user/send-otp`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email })
});

// Register
await fetch(`${BASE}/user/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ name, email, password, otp })
});

// Login
await fetch(`${BASE}/user/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ email, password })
});

// Profile (protected)
const profile = await fetch(`${BASE}/user`, { credentials: 'include' }).then(r => r.json());

// List directory (root)
const root = await fetch(`${BASE}/directory`, { credentials: 'include' }).then(r => r.json());

// Create directory under parent
await fetch(`${BASE}/directory/${parentId}`, {
  method: 'POST',
  headers: { dirname: 'My Folder' },
  credentials: 'include'
});

// Rename directory
await fetch(`${BASE}/directory/${dirId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ newDirName: 'Renamed' })
});

// Upload file (Blob)
await fetch(`${BASE}/file/${parentId}`, {
  method: 'POST',
  headers: { filename: 'example.png' },
  credentials: 'include',
  body: fileBlob
});

// Download file
window.location.href = `${BASE}/file/${fileId}?action=download`;
```

## Error Handling Patterns
- Invalid ObjectId params → `400 { error: 'Invalid file ID format' }`
- Unauthorized (no/invalid session) → `401 { error: 'Not logged!' }`
- Not found or no access → `404 { error: '...not found...' }`
- Validation errors → `400 { error: '...' }`
- Server errors → `500 { error: 'Internal Server Error' }`

## Assumptions & Notes
- MongoDB connection string is hardcoded in `config/db.js`; adjust for production.
- OTP email HTML mentions 10 minutes, but TTL is 5 minutes in DB.
- Files are served directly from disk; large-file streaming is supported by piping the upload request.
- All write operations rely on server-side `req.user` and ownership checks.