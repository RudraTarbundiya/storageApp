**Redis Session Storage (session model removal)**

This document explains the change to store sessions in Redis instead of a MongoDB `sessions` collection. It describes the data layout, how to create the RediSearch index (`userIdIdx`), and migration/verification steps.

**Why**:
- Redis provides fast, in-memory session storage with TTL support.
- RediSearch lets us query sessions by `userId` using a tag index.
- We removed the MongoDB `sessions` model and now store session data as JSON in Redis.

**Session key / value format**
- Key pattern: `session:<uuid>`
- Value (JSON): { "userId": "<userId>" }
- TTL: set to session lifetime (example: 7 days)

Example created in code (already used in controllers):

```js
const ssnKey = `session:${crypto.randomUUID()}`;
await redisClient.json.set(ssnKey, '$', { userId: user._id.toString() });
await redisClient.expire(ssnKey, 60 * 60 * 24 * 7); // 1 week
```

**RediSearch index for fast userId lookups**
Create a RediSearch index on JSON documents so we can search sessions by `userId`.

redis-cli example:

```bash
FT.CREATE userIdIdx ON JSON PREFIX 1 "session:" SCHEMA $.userId AS userId TAG
```

- `ON JSON` — index JSON values (we store session value as JSON).
- `PREFIX 1 "session:"` — only index keys starting with `session:`.
- `SCHEMA $.userId AS userId TAG` — index the `userId` field as a TAG for exact-match queries.

Node Redis client (example using redis v4 with RediSearch module):

```js
// pseudocode - adapt to your redis client wrapper
await redisClient.ft.create('userIdIdx', {
  '$.userId': { type: 'TAG', AS: 'userId' }
}, { ON: 'JSON', PREFIX: ['session:'] });
```

**Querying sessions by userId**
- Example search used in controllers:

```js
const res = await redisClient.ft.search('userIdIdx', `@userId:{${userId}}`, { RETURN: [] });
// res.total gives number of sessions for that user
```

**Migration steps**
1. Ensure Redis with RediSearch is running and `userIdIdx` index is created.
2. Update running app code (controllers, utils) to use Redis sessions (already in `authController.js` and updated `usersController.js`).
3. Optionally migrate existing MongoDB sessions to Redis (if applicable):
   - Export documents from `sessions` collection.
   - For each entry, create `session:<uuid>` in Redis with JSON value `{ userId }` and set TTL.
   - Then create index and verify queries return expected counts.
4. Remove or deprecate `models/sesssionModel.js` and any code that used MongoDB sessions.
5. Run app tests and verify endpoints that used sessions behave the same.

**Verification**
- Use `FT.SEARCH` to check sessions exist for a user:

```bash
FT.SEARCH userIdIdx "@userId:{<userId>}" RETURN 0
```

- Check keys:

```bash
redis-cli KEYS "session:*"
```

- Check TTL:

```bash
redis-cli TTL session:<uuid>
```

**Rollback / fallback**
- Keep a database backup before deleting the `sessions` collection.
- If Redis is unavailable, the app should detect and fail gracefully; consider falling back to a short-lived in-memory behavior or reject logins until Redis is restored.

**Notes & gotchas**
- Tag indexing requires exact matching. UserId must be stored as string exactly matching queries.
- Ensure your Redis client supports JSON and RediSearch (modules `ReJSON` and `RediSearch`) or use appropriate commands.
- When creating the index, if the index already exists, `FT.CREATE` will fail — use `FT.INFO` to check.

**Files changed in this commit**
- Removed `models/sesssionModel.js` (delete from repo)
- Updated controllers to use Redis session storage: `authController.js`, `usersController.js`, and any utilities that managed sessions now use `utils/deleteSessions.js` with Redis operations.

**Useful commands**

```bash
# Create index
redis-cli FT.CREATE userIdIdx ON JSON PREFIX 1 "session:" SCHEMA $.userId AS userId TAG

# Search sessions for user
redis-cli FT.SEARCH userIdIdx "@userId:{<userId>}" RETURN 0

# Set a session (example via redis-cli using JSON.SET if ReJSON is available)
redis-cli JSON.SET session:abc123 $ '{"userId":"<userId>"}'
redis-cli EXPIRE session:abc123 604800
```

---

If you want, I can also:
- Add an automated migration script to convert existing MongoDB sessions to Redis.
- Remove `models/sesssionModel.js` from the repo and update tests.

