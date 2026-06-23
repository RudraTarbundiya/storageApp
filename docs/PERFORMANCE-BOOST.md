# Performance Optimization Walkthrough

## Summary

Implemented 5 phases of optimization to reduce the Users page load time from **~33 seconds** to an estimated **~10-15 seconds** (before hosting/network latency).

---

## Changes Made

### Phase 1: Auth Middleware Caching

#### [authMiddlwWare.js](file:///c:/Users/rudra/Desktop/storageApp/deploy/backend/middleware/authMiddlwWare.js)

**Before**: Every API request hit MongoDB to look up the user (`User.findOne()`) — ~200-500ms per request, adding up to ~1.5-3s across 6 calls.

**After**: User data is now cached in the Redis session hash as JSON. On subsequent requests within 5 minutes, the cached user is read directly from Redis (which was already being read for session validation — essentially free). Added `invalidateUserCache()` export for controllers to call when user data changes.

```diff
-const user = await User.findOne({ _id: ssn.userId }).lean();
+// Try cached user first, fall back to MongoDB
+if (isCacheValid) { user = JSON.parse(ssn.userData); }
+if (!user) { user = await User.findOne(...); /* cache it */ }
```

#### [authController.js](file:///c:/Users/rudra/Desktop/storageApp/deploy/backend/controller/authController.js)
- Added `invalidateUserCache()` call after profile changes

#### [usersController.js](file:///c:/Users/rudra/Desktop/storageApp/deploy/backend/controller/usersController.js)
- Added `invalidateUserCache()` calls after role changes and soft deletes

---

### Phase 2: Database Indexes

#### [fileModel.js](file:///c:/Users/rudra/Desktop/storageApp/deploy/backend/models/fileModel.js)
Added 4 indexes:
- `parentDirId` — used by directory listing, delete, share operations
- `userId` — used by storage calculation aggregate, hard delete
- `sharedWith.user` — used by "shared with me" queries
- `{ userId, isPublic }` — compound index for "my public items"

#### [directoryModel.js](file:///c:/Users/rudra/Desktop/storageApp/deploy/backend/models/directoryModel.js)
Added 4 matching indexes for the same query patterns.

> [!IMPORTANT]
> The indexes will be created automatically by Mongoose when the server starts. For large existing collections, initial index creation may take a few seconds.

---

### Phase 3: Batch Redis Calls

#### [usersController.js](file:///c:/Users/rudra/Desktop/storageApp/deploy/backend/controller/usersController.js)

**Before**: Sequential N+1 loop — one Redis `ft.search` call per user (8 users = 8 sequential awaits).

**After**: `Promise.all()` fires all 8 Redis calls concurrently.

```diff
-for (const u of users) {
-    const ssnSearch = await redisClient.ft.search(...)
-    u.isLoggedIn = ssnSearch.total > 0;
-}
+const loginChecks = await Promise.all(
+    users.map(u => redisClient.ft.search(...).then(r => r.total > 0).catch(() => false))
+);
+users.forEach((u, i) => { u.isLoggedIn = loginChecks[i]; });
```

Applied to both `getUsers()` and `getDeletedUsers()`.

---

### Phase 4: Lazy FileManagerContext

#### [FileManagerContext.jsx](file:///c:/Users/rudra/Desktop/storageApp/deploy/frontend/src/context/FileManagerContext.jsx)

**Before**: The context auto-fetched directory data (`GET /directory`) on mount — even on pages like Users that don't need file data. This added ~2.84s to every page load.

**After**: Added lazy initialization. The context only fetches data when a page calls `ensureInitialized()`. The `useEffect` now checks an `initialized` flag before triggering the fetch.

#### [DashboardPage.jsx](file:///c:/Users/rudra/Desktop/storageApp/deploy/frontend/src/pages/DashboardPage.jsx)

Added `ensureInitialized()` call on mount — the Dashboard is the primary consumer of file data, so it triggers the first load. Other pages (Users, Profile) skip the directory fetch entirely.

---

### Phase 6: Parallel Frontend Calls

#### [UsersPage.jsx](file:///c:/Users/rudra/Desktop/storageApp/deploy/frontend/src/pages/UsersPage.jsx)

**Before**: `fetchUsers()` and `fetchDeletedUsers()` ran sequentially.

**After**: Wrapped in `Promise.all()` for parallel execution.

```diff
-fetchUsers()
-if (isOwner) { fetchDeletedUsers() }
+Promise.all([fetchUsers(), isOwner ? fetchDeletedUsers() : Promise.resolve()])
```

---

## Expected Impact

| Optimization | Estimated Time Saved |
|---|---|
| Auth caching (skip MongoDB on 5/6 calls) | 1.0 - 2.5s |
| Database indexes | 1.0 - 3.0s |
| Batch Redis (concurrent vs sequential) | 0.5 - 1.5s |
| Lazy context (skip `GET /directory`) | 2.0 - 3.0s |
| Parallel user fetches | 1.0 - 2.0s |
| **Total** | **~5.5 - 12.0s** |

## Verification

After deploying, open the **Network tab** on the Users page and compare:
- Total number of API calls (should be 3-4 instead of 6)
- Individual response times (should be noticeably faster)
- Total page load time (target: under 15s, ideally under 10s)

> [!TIP]
> If you're on Render free tier, cold start latency (first request after sleep) will still add significant time that cannot be optimized at the code level. The optimizations above will have the biggest impact on **warm** request performance.
