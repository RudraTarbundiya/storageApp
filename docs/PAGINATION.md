# Pagination — Developer Reference

This document explains how offset-based pagination is implemented for two API endpoints in this application:
https://chatgpt.com/c/6a5c3a01-c088-83e8-8c59-83474addb366

1. **Directory Contents** — `GET /directory` / `GET /directory/:id`
2. **Users List** — `GET /users`

---

## 1. How It Works (Shared Pattern)

Both endpoints use the same **offset / page-number** style:

| Query param | Default | Max | Description |
|---|---|---|---|
| `page` | `1` | — | Which page to return (1-indexed) |
| `limit` | `10` | `50` (dirs) / `100` (users) | Items per page |

Every response includes a `pagination` object so the frontend knows whether more data exists:

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "hasMore": true,
    "total": 42
  }
}
```

The frontend reads `hasMore` and shows a **"Load More"** button. Clicking it fetches the next page and **appends** the results to the existing list.

---

## 2. Directory Contents (`getDirectoryById`)

### Why it is more complex

A directory contains two heterogeneous collections — **folders** and **files** — and the UI always shows folders before files. A single `skip`/`limit` across both requires computing which items from each collection belong to the current page window.

### Algorithm

```
globalStart = (page - 1) * limit   <- 0-indexed first item of this page

if globalStart >= totalFolders:
    # page is entirely inside the files range
    folderSkip = 0,  folderTake = 0
    fileSkip   = globalStart - totalFolders
    fileTake   = limit
else:
    # page starts inside the folders range
    folderSkip = globalStart
    folderTake = min(limit, totalFolders - globalStart)
    fileSkip   = 0
    fileTake   = limit - folderTake   <- leftover slots filled by files
```

### Example (limit = 10, 7 folders, 15 files)

| Page | Folders fetched | Files fetched |
|---|---|---|
| 1 | 0-6 (7 items) | 0-2 (3 items) |
| 2 | — (0) | 3-12 (10 items) |
| 3 | — (0) | 13-14 (2 items), hasMore = false |

### Backend — `directoryController.js` → `getDirectoryById`

1. Two `countDocuments` calls (cheap index scans).
2. Compute `folderSkip / folderTake / fileSkip / fileTake` from the algorithm above.
3. Two paginated Mongoose queries with `.skip().limit()`.
4. Child-count aggregation runs only on the **paginated folder slice** (not all folders).
5. Response:
   ```json
   {
     "...directoryData",
     "directories": [...],
     "files": [...],
     "pagination": { "page", "limit", "totalFolders", "totalFiles", "hasMore" }
   }
   ```

### Frontend

- **`api.js`** — `directoryAPI.getRoot(page)` / `directoryAPI.getById(id, page)` pass `?page=N`.
- **`FileManagerContext.jsx`** — `fetchDirectory({ page, append })`:
  - `append: false` (default) — replaces state (navigating, post-mutation refresh).
  - `append: true` — concatenates (Load More).
  - A `useEffect` resets `page → 1` whenever `currentFolder` changes.
- **`DashboardPage.jsx`** — renders a **Load More** button when `hasMore` is true.

---

## 3. Users List (`getUsers`)

### Algorithm

Single collection — simpler. `$skip` and `$limit` are inserted into the aggregation pipeline **before** the `$lookup` that joins files for storage calculation. This means the expensive lookup only runs on the current page's users.

```js
User.aggregate([
  { $match: { isDelete: false } },
  { $skip: (page - 1) * limit },
  { $limit: limit },
  { $lookup: { from: 'files', ... } },  // only for this page's users
  { $project: { ...storageUsed } }
])
```

The Redis login-check batch also runs only on the paginated slice (O(limit) instead of O(total)).

### Response

```json
{
  "users": [...],
  "pagination": { "page", "limit", "total", "hasMore" }
}
```

### Frontend

- **`api.js`** — `adminAPI.getUsers(page)` passes `?page=N`.
- **`UsersPage.jsx`**:
  - `fetchUsers({ page, append })` — same append pattern.
  - `loadMoreUsers()` — increments page and appends.
  - Mutations (logout, delete, recover) call `fetchUsers({ page: 1 })` to reset.
  - Soft-delete decrements `usersTotal` locally without a round-trip.
  - The **Active Users (N)** badge shows `usersTotal` (server total) not `users.length` (loaded slice).

---

## 4. Caveats

| Concern | Notes |
|---|---|
| **Ordering stability** | Default sort is MongoDB natural order (insertion). Inserts during pagination may cause duplicates or gaps. Add `.sort()` if deterministic order is needed. |
| **Client-side search** | The search bar filters loaded items only. Server-side search needs a separate `?q=` endpoint. |
| **Deleted users tab** | Fetched in full — no pagination — because it is owner-only and expected to be small. |
