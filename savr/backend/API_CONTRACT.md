# MyBookMark — API Contract (Phase 1 Specification)

This document specifies the exact REST API contract for **MyBookMark**, consumed by the Android application and React frontend in Phase 2.

---

## 1. Base Configuration

- **Default Port**: `3000`
- **Default Host**: `0.0.0.0`
- **Local Dev URL (Browser)**: `http://localhost:3000`
- **Android Emulator**: `http://10.0.2.2:3000`
- **Physical Android Phone (Wi-Fi LAN)**: `http://<FEDORA_LAN_IP>:3000`

### CORS Allowed Origins
- `http://localhost:5173`
- `capacitor://localhost`
- `http://localhost`
- Local LAN IP addresses (`http://192.168.*`, `http://10.*`)

---

## 2. Standard Response Wrapper

All API responses follow a uniform JSON structure:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human-readable confirmation message",
  "is_duplicate": false
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description message",
  "data": [ ...optional validation issues... ]
}
```

### HTTP Status Codes
- `200 OK`: Successful read, update, delete, or duplicate bookmark handled
- `201 Created`: Resource successfully created
- `400 Bad Request`: Validation failure or malformed payload
- `401 Unauthorized`: Missing, invalid, or expired Bearer token
- `404 Not Found`: Resource not found or owned by another user
- `500 Internal Server Error`: Unhandled server exception

---

## 3. Authentication Format

All protected endpoints require the standard HTTP header:
```http
Authorization: Bearer <JWT_TOKEN>
```
The token is a signed JWT (`HS256`) containing `sub` (User UUID) and `username`, valid for 30 days.

---

## 4. Endpoints

### 4.1 Health Check

#### `GET /health`
Public liveness probe.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "app": "MyBookMark",
    "timestamp": "2026-10-31T20:09:51.891Z"
  },
  "message": "MyBookMark API is healthy"
}
```

---

### 4.2 Authentication Endpoints

#### `POST /api/auth/register`
Creates a new user account.

**Request Body:**
```json
{
  "username": "pruthvi",
  "password": "secure_password_123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "e5b8d65c-6625-4c01-bf5c-d08b3e8a1562",
      "username": "pruthvi",
      "created_at": "2026-10-31T20:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

#### `POST /api/auth/login`
Authenticates existing credentials.

**Request Body:**
```json
{
  "username": "pruthvi",
  "password": "secure_password_123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "e5b8d65c-6625-4c01-bf5c-d08b3e8a1562",
      "username": "pruthvi",
      "created_at": "2026-10-31T20:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

#### `GET /api/auth/me`
Fetches authenticated user identity. Requires `Authorization: Bearer <token>`.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "e5b8d65c-6625-4c01-bf5c-d08b3e8a1562",
      "username": "pruthvi",
      "created_at": "2026-10-31T20:00:00.000Z"
    }
  }
}
```

#### `POST /api/auth/logout`
Client session invalidation confirmation.

**Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Logged out successfully"
}
```

---

### 4.3 Bookmark Endpoints

All bookmark endpoints require `Authorization: Bearer <token>`.

#### `POST /api/bookmarks`
Main entry point for saving bookmarks (used by Android native Share Receiver and UI).

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "sharedText": "Check this out! https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": null,
  "notes": null
}
```
*Note*: `url` or `sharedText` (from which a URL will be extracted automatically) is accepted.

**Response (201 Created - New Bookmark):**
```json
{
  "success": true,
  "data": {
    "id": "b90dc02c-3add-48dc-9a65-2c16047ad09b",
    "user_id": "e5b8d65c-6625-4c01-bf5c-d08b3e8a1562",
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "normalized_url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "platform": "youtube",
    "title": null,
    "description": null,
    "thumbnail_url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    "author_name": null,
    "shared_text": "Check this out!",
    "extracted_text": null,
    "summary": null,
    "category": null,
    "tags": [],
    "content_type": null,
    "ai_status": "pending",
    "ai_confidence": null,
    "ai_error": null,
    "notes": null,
    "created_at": "2026-10-31T20:10:00.000Z",
    "updated_at": "2026-10-31T20:10:00.000Z"
  },
  "message": "Bookmark created successfully"
}
```

**Response (200 OK - Duplicate Submission):**
If the normalized URL is already saved by the user, the existing record is returned immediately without creating a duplicate.
```json
{
  "success": true,
  "is_duplicate": true,
  "data": {
    "id": "b90dc02c-3add-48dc-9a65-2c16047ad09b",
    ...
  },
  "message": "Bookmark already saved"
}
```

---

#### `GET /api/bookmarks`
Lists bookmarks with pagination and filtering.

**Query Parameters:**
- `page` (integer, default: `1`)
- `limit` (integer, default: `20`, max: `100`)
- `platform` (string, e.g. `instagram`, `x`, `youtube`, `reddit`, `tiktok`, `website`)
- `category` (string, e.g. `Knowledge`, `Technology`, `Entertainment`)
- `tag` (string, e.g. `Physics`)
- `content_type` (string, e.g. `educational`)
- `ai_status` (string, `pending`, `processing`, `completed`, `failed`, `insufficient_content`)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "bookmarks": [ ... ],
    "total": 42,
    "page": 1,
    "limit": 20
  }
}
```

---

#### `GET /api/bookmarks/search?q=:query`
Full-text search across Title, Description, Summary, Tags, Shared Text, Extracted Text, and Notes.

**Query Parameters:**
- `q`: search string (case-insensitive substring match)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 3
  }
}
```

---

#### `GET /api/bookmarks/:id`
Retrieves single bookmark details by ID. Enforces user ownership.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "b90dc02c-3add-48dc-9a65-2c16047ad09b",
    "user_id": "...",
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "normalized_url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "platform": "youtube",
    "title": "Rick Astley - Never Gonna Give You Up (Official Music Video)",
    "description": "The official video for Never Gonna Give You Up by Rick Astley...",
    "thumbnail_url": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    "author_name": "Rick Astley",
    "summary": "Classic pop music video by Rick Astley.",
    "category": "Entertainment",
    "tags": ["Music", "Pop", "80s", "Classic"],
    "content_type": "music_video",
    "ai_status": "completed",
    "ai_confidence": 0.95,
    "ai_error": null,
    "notes": "My favorite throwback track",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

---

#### `PATCH /api/bookmarks/:id`
Updates user-editable fields.

**Request Body (Partial):**
```json
{
  "title": "Custom Title",
  "notes": "Updated note",
  "category": "Inspiration",
  "tags": ["Tag1", "Tag2"],
  "thumbnail_url": "https://..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ...updated bookmark... },
  "message": "Bookmark updated successfully"
}
```

---

#### `DELETE /api/bookmarks/:id`
Deletes a bookmark permanently.

**Response (200 OK):**
```json
{
  "success": true,
  "data": null,
  "message": "Bookmark deleted successfully"
}
```

---

#### `POST /api/bookmarks/:id/reprocess`
Queues a bookmark for background re-extraction and AI re-classification.

**Response (200 OK):**
```json
{
  "success": true,
  "data": { ...bookmark with ai_status: 'pending'... },
  "message": "Reprocessing queued"
}
```

---

### 4.4 Aggregation Endpoints

#### `GET /api/categories`
Lists all categories used by the authenticated user with bookmark counts.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "category": "Technology", "count": 14 },
    { "category": "Knowledge", "count": 8 },
    { "category": "Entertainment", "count": 5 }
  ]
}
```

#### `GET /api/tags`
Lists all tags used by the authenticated user with usage counts.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "tag": "Rust", "count": 6 },
    { "tag": "React", "count": 4 },
    { "tag": "Physics", "count": 3 }
  ]
}
```

---

## 5. Bookmark AI Lifecycle States

| State | Description |
|---|---|
| `pending` | Bookmark record saved in SQLite; queued for metadata extraction and Groq classification. |
| `processing` | Metadata is being extracted or Groq classification is actively in flight. |
| `completed` | Category, tags, summary, and confidence successfully generated by Groq. |
| `insufficient_content` | The link/shared text did not provide enough context for AI to classify accurately without hallucinating. The bookmark remains safe and viewable. |
| `failed` | Groq API or network request failed. Error reason is preserved in `ai_error`. The bookmark is never deleted or lost. |
