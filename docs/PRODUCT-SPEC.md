# Backpocket Product Specification

> **Version:** 1.0.0  
> **Last Updated:** 2026-01-12

Complete specification for Backpocket — a personal bookmarking and reading app with optional public sharing.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Authentication](#3-authentication)
4. [API Reference](#4-api-reference)
5. [Type Definitions](#5-type-definitions)
6. [Core Features](#6-core-features)
7. [Platform Implementation](#7-platform-implementation)
8. [UI/UX Guidelines](#8-uiux-guidelines)
9. [Changelog](#9-changelog)

---

## 1. Overview

### Product Vision

Backpocket is a personal content library for saving, organizing, and optionally sharing links. Unlike social bookmarking tools, Backpocket focuses on **personal utility** over engagement.

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Privacy by default** | All saves are private unless explicitly made public |
| **No social features** | No followers, likes, comments, or algorithmic feeds |
| **Calm and focused** | Clean, minimal UI with no distractions |
| **Offline-first** | Core functionality works without network |
| **Content ownership** | Snapshots preserve content you control |

### Core Capabilities

- **Save** — Capture any URL with metadata auto-extraction
- **Organize** — Tags and collections for flexible organization
- **Read** — Distraction-free reader mode with snapshots
- **Share** — Optional public space at your own URL

### Base URLs

```
Production:          https://backpocket.my
Public Spaces:       https://{slug}.backpocket.my
Convex URL:          https://your-project.convex.cloud
```

---

## 2. Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Web App** | Next.js 16, React 19, Tailwind CSS | Primary web interface |
| **Mobile App** | Expo 54, React Native, NativeWind | iOS & Android |
| **Extension** | WXT, React | Browser extension |
| **Backend** | Convex | Real-time database, queries, mutations, actions |
| **Auth** | Clerk + Convex JWT | Authentication |
| **Hosting** | Vercel | Web app hosting |
| **Storage** | Convex File Storage | Snapshot content |

### Monorepo Structure

```
backpocket/
├── apps/
│   ├── backpocket-web/           # Next.js web application
│   ├── backpocket-mobile/        # Expo React Native app
│   └── backpocket-browser-extension/  # WXT browser extension
├── convex/                       # Convex backend functions
│   ├── schema.ts                 # Database schema
│   ├── saves.ts                  # Save queries/mutations
│   ├── tags.ts                   # Tag queries/mutations
│   ├── collections.ts            # Collection queries/mutations
│   ├── spaces.ts                 # Space queries/mutations
│   ├── public.ts                 # Public (unauthenticated) queries
│   ├── snapshots.ts              # Snapshot processing
│   └── lib/                      # Auth helpers, validators
├── packages/
│   ├── types/                    # @backpocket/types - Shared types
│   ├── utils/                    # @backpocket/utils - Shared utilities
│   └── tsconfig/                 # Shared TypeScript configs
├── docs/                         # This documentation
└── package.json
```

### Convex Backend

Convex provides a real-time, TypeScript-first backend with:

- **Queries** — Read-only functions that subscribe to changes
- **Mutations** — Write operations that update the database
- **Actions** — Side-effect functions for external APIs
- **Scheduled Functions** — Background job processing

```typescript
// Example: Using Convex hooks in React
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

function SavesList() {
  const saves = useQuery(api.saves.list, { limit: 20 });
  const createSave = useMutation(api.saves.create);
  
  // saves updates in real-time when data changes
  return <SavesGrid items={saves?.items ?? []} />;
}
```

### Shared Packages

#### `@backpocket/types`

Single source of truth for all TypeScript types:

```typescript
import type { Save, Tag, Collection, Space } from "@backpocket/types";
```

#### `@backpocket/utils`

Shared utility functions:

```typescript
import { normalizeUrl, formatRelativeTime } from "@backpocket/utils";
```

---

## 3. Authentication

Backpocket uses [Clerk](https://clerk.com) for authentication across all platforms.

### Token Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│    Clerk    │────▶│  Backpocket │
│ (Web/Mobile)│     │   (Auth)    │     │    API      │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                    │
      │ 1. Sign in         │                    │
      │───────────────────▶│                    │
      │                    │                    │
      │ 2. Session token   │                    │
      │◀───────────────────│                    │
      │                    │                    │
      │ 3. API call with Bearer token           │
      │────────────────────────────────────────▶│
      │                    │                    │
      │ 4. Verify token    │                    │
      │                    │◀───────────────────│
      │                    │                    │
      │ 5. Response        │                    │
      │◀────────────────────────────────────────│
```

### Getting Auth Token

#### Web (React)

```typescript
import { useAuth } from "@clerk/nextjs";

const { getToken } = useAuth();
const token = await getToken();
```

#### Mobile (Expo)

```typescript
import { useAuth } from "@clerk/clerk-expo";

const { getToken } = useAuth();
const token = await getToken();
```

#### Browser Extension

```typescript
import { useAuth } from "@clerk/chrome-extension";

const { getToken } = useAuth();
const token = await getToken();
```

### Request Headers

All authenticated API requests must include:

```http
Authorization: Bearer <clerk_session_token>
Content-Type: application/json
```

### Token Storage (Mobile)

Use secure storage for token caching:

```typescript
// lib/auth/token-cache.ts
import * as SecureStore from "expo-secure-store";
import type { TokenCache } from "@clerk/clerk-expo";

export const tokenCache: TokenCache = {
  async getToken(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string) {
    await SecureStore.setItemAsync(key, value);
  },
};
```

---

## 4. API Reference

### Overview

Backpocket uses [Convex](https://convex.dev) for its API layer. All functions are defined in the `convex/` directory and are accessed via Convex's client libraries.

### Function Namespaces

| Module | Auth Required | Description |
|--------|---------------|-------------|
| `saves.*` | ✅ Yes | Save management operations |
| `tags.*` | ✅ Yes | Tag management operations |
| `collections.*` | ✅ Yes | Collection management operations |
| `spaces.*` | ✅ Yes | Space settings operations |
| `snapshots.*` | ✅ Yes | Snapshot operations |
| `public.*` | ❌ No | Public read-only operations |

### Client Usage

#### React (Web/Mobile)

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

// Query (auto-subscribes to real-time updates)
const saves = useQuery(api.saves.listSaves, { limit: 20 });

// Mutation
const createSave = useMutation(api.saves.createSave);
await createSave({ url: "https://example.com" });
```

#### Server/Action

```typescript
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { api } from "../../convex/_generated/api";

const saves = await fetchQuery(api.saves.listSaves, { limit: 20 });
```

#### HTTP Client (Extension)

```typescript
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

const client = new ConvexHttpClient(CONVEX_URL);
client.setAuth(getToken);
const saves = await client.query(api.saves.listSaves, { limit: 20 });
```

---

### 4.1 Saves

#### Create Save

**Endpoint:** `POST /api/trpc/space.createSave`

The primary endpoint for saving links. Used by all platforms.

**Request:**

```json
{
  "json": {
    "url": "https://example.com/article",
    "title": "Optional custom title",
    "visibility": "private",
    "tagNames": ["reading", "tech"],
    "collectionIds": ["uuid-1", "uuid-2"],
    "note": "Optional description/note"
  }
}
```

**Input Schema:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `url` | `string` | ✅ Yes | - | Valid URL to save |
| `title` | `string` | ❌ No | null | Custom title (auto-fetched if not provided) |
| `visibility` | `"private" \| "public"` | ❌ No | `"private"` | Save visibility |
| `tagNames` | `string[]` | ❌ No | `[]` | Tag names (auto-created if new) |
| `collectionIds` | `string[]` | ❌ No | `[]` | Collection IDs to add to |
| `note` | `string` | ❌ No | null | Description/notes |

**Response:**

```json
{
  "result": {
    "data": {
      "id": "uuid",
      "spaceId": "uuid",
      "url": "https://example.com/article",
      "title": "Article Title",
      "description": null,
      "siteName": "Example",
      "imageUrl": "https://...",
      "contentType": null,
      "visibility": "private",
      "isArchived": false,
      "isFavorite": false,
      "createdBy": "user_xxx",
      "savedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "tags": [{ "id": "uuid", "name": "reading" }],
      "collections": []
    }
  }
}
```

**Behavior Notes:**

- Tags are automatically created if they don't exist
- Tag names are normalized (lowercase, trimmed)
- User's space is auto-created on first save
- Snapshots are automatically queued for processing
- URLs are normalized for duplicate detection

**Duplicate Detection:**

If the normalized URL already exists, returns HTTP 409:

```json
{
  "error": {
    "message": "You already have this link saved",
    "code": -32600,
    "data": {
      "code": "CONFLICT",
      "httpStatus": 409,
      "path": "space.createSave",
      "cause": {
        "type": "DUPLICATE_SAVE",
        "existingSave": {
          "id": "uuid",
          "url": "https://example.com/article",
          "title": "Article Title",
          "imageUrl": "https://...",
          "siteName": "Example",
          "savedAt": "2024-01-01T00:00:00.000Z"
        }
      }
    }
  }
}
```

---

#### Check Duplicate

**Endpoint:** `POST /api/trpc/space.checkDuplicate`

Pre-check if a URL exists before saving. Useful for instant UX feedback.

**Request:**

```json
{
  "json": {
    "url": "https://example.com/article?utm_source=twitter"
  }
}
```

**Response (No Duplicate):**

```json
{
  "result": {
    "data": null
  }
}
```

**Response (Duplicate Found):**

```json
{
  "result": {
    "data": {
      "id": "uuid",
      "url": "https://example.com/article",
      "title": "Article Title",
      "imageUrl": "https://...",
      "siteName": "Example",
      "savedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

#### List Saves

**Endpoint:** `POST /api/trpc/space.listSaves`

**Request:**

```json
{
  "json": {
    "query": "search term",
    "visibility": "private",
    "isArchived": false,
    "isFavorite": true,
    "collectionId": "uuid",
    "tagId": "uuid",
    "cursor": "2024-01-01T00:00:00.000Z",
    "limit": 20
  }
}
```

**Input Schema:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `query` | `string` | ❌ No | - | Search in title/description/url |
| `visibility` | `"private" \| "public"` | ❌ No | - | Filter by visibility |
| `isArchived` | `boolean` | ❌ No | - | Filter archived saves |
| `isFavorite` | `boolean` | ❌ No | - | Filter favorites |
| `collectionId` | `string` | ❌ No | - | Filter by collection |
| `tagId` | `string` | ❌ No | - | Filter by tag |
| `cursor` | `string` | ❌ No | - | Pagination cursor (ISO date) |
| `limit` | `number` | ❌ No | 20 | Results per page (1-50) |

**Response:**

```json
{
  "result": {
    "data": {
      "items": [/* Save objects */],
      "nextCursor": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

#### Get Save

**Endpoint:** `POST /api/trpc/space.getSave`

```json
{
  "json": {
    "saveId": "uuid"
  }
}
```

---

#### Update Save

**Endpoint:** `POST /api/trpc/space.updateSave`

```json
{
  "json": {
    "id": "uuid",
    "title": "New title",
    "description": "New description",
    "visibility": "public",
    "tagNames": ["new", "tags"],
    "collectionIds": ["uuid-1"]
  }
}
```

All fields except `id` are optional.

**Note:** Orphaned tags (no longer associated with any saves) are automatically deleted.

---

#### Toggle Favorite

**Endpoint:** `POST /api/trpc/space.toggleFavorite`

```json
{
  "json": {
    "saveId": "uuid",
    "value": true
  }
}
```

`value` is optional — omit to toggle current state.

---

#### Toggle Archive

**Endpoint:** `POST /api/trpc/space.toggleArchive`

```json
{
  "json": {
    "saveId": "uuid",
    "value": true
  }
}
```

---

#### Delete Save

**Endpoint:** `POST /api/trpc/space.deleteSave`

```json
{
  "json": {
    "saveId": "uuid"
  }
}
```

**Note:** Orphaned tags are automatically deleted.

---

#### Bulk Delete Saves

**Endpoint:** `POST /api/trpc/space.bulkDeleteSaves`

```json
{
  "json": {
    "saveIds": ["uuid-1", "uuid-2", "uuid-3"]
  }
}
```

Max 100 saves per request.

---

### 4.2 Tags

#### List Tags

**Endpoint:** `POST /api/trpc/space.listTags`

```json
{
  "json": {}
}
```

**Response:**

```json
{
  "result": {
    "data": [
      {
        "id": "uuid",
        "spaceId": "uuid",
        "name": "reading",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "_count": { "saves": 5 }
      }
    ]
  }
}
```

---

#### Create Tag

**Endpoint:** `POST /api/trpc/space.createTag`

```json
{
  "json": {
    "name": "new-tag"
  }
}
```

**Note:** Tags are automatically created via `createSave` when using `tagNames`.

---

#### Update Tag

**Endpoint:** `POST /api/trpc/space.updateTag`

```json
{
  "json": {
    "id": "uuid",
    "name": "renamed-tag"
  }
}
```

---

#### Delete Tag

**Endpoint:** `POST /api/trpc/space.deleteTag`

```json
{
  "json": {
    "tagId": "uuid"
  }
}
```

---

### 4.3 Collections

#### List Collections

**Endpoint:** `POST /api/trpc/space.listCollections`

```json
{
  "json": {}
}
```

**Response:**

```json
{
  "result": {
    "data": [
      {
        "id": "uuid",
        "spaceId": "uuid",
        "name": "Reading List",
        "visibility": "private",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "_count": { "saves": 10 }
      }
    ]
  }
}
```

---

#### Create Collection

**Endpoint:** `POST /api/trpc/space.createCollection`

```json
{
  "json": {
    "name": "My Collection",
    "visibility": "private"
  }
}
```

---

#### Update Collection

**Endpoint:** `POST /api/trpc/space.updateCollection`

```json
{
  "json": {
    "id": "uuid",
    "name": "Renamed Collection",
    "visibility": "public"
  }
}
```

---

#### Delete Collection

**Endpoint:** `POST /api/trpc/space.deleteCollection`

```json
{
  "json": {
    "collectionId": "uuid"
  }
}
```

---

### 4.4 Settings & Space

#### Get My Space

**Endpoint:** `POST /api/trpc/space.getMySpace`

```json
{
  "json": {}
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "id": "uuid",
      "type": "personal",
      "slug": "mario",
      "name": "Mario's Links",
      "bio": "A collection of interesting reads",
      "avatarUrl": "https://...",
      "visibility": "public",
      "publicLayout": "grid",
      "defaultSaveVisibility": "private",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

#### Update Settings

**Endpoint:** `POST /api/trpc/space.updateSettings`

```json
{
  "json": {
    "name": "Mario's Links",
    "bio": "A collection of interesting reads",
    "avatarUrl": "https://...",
    "visibility": "public",
    "publicLayout": "grid",
    "defaultSaveVisibility": "private"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Display name for public space |
| `bio` | `string` | Short description |
| `avatarUrl` | `string` | Avatar image URL |
| `visibility` | `"public" \| "private"` | Space visibility |
| `publicLayout` | `"list" \| "grid"` | How saves are displayed publicly |
| `defaultSaveVisibility` | `"private" \| "public"` | Default visibility for new saves |

---

#### Update Slug

**Endpoint:** `POST /api/trpc/space.updateSlug`

```json
{
  "json": {
    "slug": "mario"
  }
}
```

**Validation Rules:**

- 3-32 characters
- Lowercase letters, numbers, and hyphens only
- Cannot start or end with a hyphen
- Cannot use reserved slugs

**Reserved Slugs:**

```
www, app, api, admin, dashboard, settings, login, logout, register,
signup, signin, signout, auth, oauth, help, support, docs, blog,
about, contact, terms, privacy, public, static, assets, images,
css, js, fonts, media, uploads, files, download, downloads, rss,
feed, sitemap, robots, favicon, manifest, sw, service-worker,
null, undefined, true, false, test, demo, example, sample, backpocket
```

---

#### Check Slug Availability

**Endpoint:** `POST /api/trpc/space.checkSlugAvailability`

```json
{
  "json": {
    "slug": "mario"
  }
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "available": true,
      "reason": null
    }
  }
}
```

**Reason values when unavailable:**

- `"reserved"` — Slug is in reserved list
- `"taken"` — Already used by another user
- `"too_short"` — Less than 3 characters
- `"too_long"` — More than 32 characters
- `"invalid_format"` — Doesn't match allowed pattern

---

### 4.5 Domains

⚠️ **Note:** Domain management is recommended for web-only due to DNS configuration complexity.

#### List Domains

**Endpoint:** `POST /api/trpc/space.listDomains`

```json
{
  "json": {}
}
```

---

#### Get Domain Status

**Endpoint:** `POST /api/trpc/space.getDomainStatus`

```json
{
  "json": {
    "domainId": "uuid"
  }
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "id": "uuid",
      "domain": "links.mario.dev",
      "status": "pending_verification",
      "verified": false,
      "misconfigured": false,
      "verification": [
        {
          "type": "TXT",
          "domain": "_vercel.links.mario.dev",
          "value": "vc-domain-verify=abc123..."
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

#### Add Domain (Web Only)

**Endpoint:** `POST /api/trpc/space.addDomain`

```json
{
  "json": {
    "domain": "links.mario.dev"
  }
}
```

---

#### Verify Domain

**Endpoint:** `POST /api/trpc/space.verifyDomain`

```json
{
  "json": {
    "domainId": "uuid"
  }
}
```

---

#### Remove Domain

**Endpoint:** `POST /api/trpc/space.removeDomain`

```json
{
  "json": {
    "domainId": "uuid"
  }
}
```

---

### 4.6 Stats

#### Get Stats

**Endpoint:** `POST /api/trpc/space.getStats`

```json
{
  "json": {}
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "totalSaves": 150,
      "publicSaves": 45,
      "privateSaves": 105,
      "favorites": 20,
      "archived": 10,
      "collections": 5,
      "tags": 25,
      "visitCount": 1234
    }
  }
}
```

---

#### Get Dashboard Data

**Endpoint:** `POST /api/trpc/space.getDashboardData`

Combined endpoint returning space settings, stats, and recent saves.

```json
{
  "json": {}
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "space": { /* Space object */ },
      "stats": { /* Stats object */ },
      "recentSaves": [ /* Last 5 saves */ ]
    }
  }
}
```

---

### 4.7 Snapshots

Snapshots capture readable content from saved URLs for offline reading.

#### Domain-Specific Extraction

Some domains have specialized extractors:

| Domain | Method | Notes |
|--------|--------|-------|
| `twitter.com`, `x.com` | Twitter oEmbed API | Tweet text; FxTwitter fallback |
| `reddit.com` | old.reddit.com scrape | Posts, comments, subreddits, profiles |

**Twitter/X:**

- Tweets via oEmbed API with FxTwitter fallback
- X Articles return placeholder (require auth)
- Dates extracted from Snowflake IDs
- `byline` contains HTML with author link

**Reddit:**

- All variants normalized to old.reddit.com
- Supports posts, comments, subreddits, user profiles
- Handles deleted/removed content gracefully

---

#### Get Save Snapshot

**Endpoint:** `POST /api/trpc/space.getSaveSnapshot`

```json
{
  "json": {
    "saveId": "uuid",
    "includeContent": true
  }
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "snapshot": {
        "saveId": "uuid",
        "status": "ready",
        "fetchedAt": "2024-01-01T00:00:00.000Z",
        "title": "Article Title",
        "byline": "Author Name",
        "excerpt": "Article excerpt...",
        "wordCount": 1500,
        "language": "en"
      },
      "content": {
        "content": "<article>...</article>",
        "textContent": "Plain text version..."
      }
    }
  }
}
```

**Snapshot Status Values:**

- `"pending"` — Waiting to be processed
- `"processing"` — Currently being fetched
- `"ready"` — Content available
- `"failed"` — Fetch failed
- `"blocked"` — Site blocks scraping

---

#### Request Save Snapshot

**Endpoint:** `POST /api/trpc/space.requestSaveSnapshot`

```json
{
  "json": {
    "saveId": "uuid",
    "force": false
  }
}
```

Set `force: true` to re-snapshot an existing save.

---

#### Get Snapshot Quota

**Endpoint:** `POST /api/trpc/space.getSnapshotQuota`

```json
{
  "json": {}
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "enabled": true,
      "used": 45,
      "remaining": 55,
      "limit": 100
    }
  }
}
```

---

### 4.8 Public Endpoints

These endpoints don't require authentication and are used for public space pages.

#### Resolve Space by Slug

**Endpoint:** `POST /api/trpc/public.resolveSpaceBySlug`

```json
{
  "json": {
    "slug": "mario"
  }
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "id": "uuid",
      "slug": "mario",
      "name": "Mario's Links",
      "bio": "...",
      "avatarUrl": "https://...",
      "publicLayout": "grid",
      "visitCount": 1234
    }
  }
}
```

---

#### Resolve Space by Host

**Endpoint:** `POST /api/trpc/public.resolveSpaceByHost`

```json
{
  "json": {
    "host": "mario.backpocket.my"
  }
}
```

---

#### List Public Saves

**Endpoint:** `POST /api/trpc/public.listPublicSaves`

```json
{
  "json": {
    "spaceId": "uuid",
    "query": "search term",
    "tagName": "reading",
    "collectionId": "uuid",
    "cursor": "2024-01-01T00:00:00.000Z",
    "limit": 20
  }
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `spaceId` | `string` | ✅ Yes | - | Space ID |
| `query` | `string` | ❌ No | - | Search in title, description, URL |
| `tagName` | `string` | ❌ No | - | Filter by tag name (case-insensitive) |
| `collectionId` | `string` | ❌ No | - | Filter by collection ID |
| `cursor` | `string` | ❌ No | - | Pagination cursor |
| `limit` | `number` | ❌ No | 20 | Results per page (1-50) |

---

#### List Public Tags

**Endpoint:** `POST /api/trpc/public.listPublicTags`

Returns tags with at least one public save, sorted by count.

```json
{
  "json": {
    "spaceId": "uuid"
  }
}
```

**Response:**

```json
{
  "result": {
    "data": [
      { "name": "reading", "count": 15 },
      { "name": "tech", "count": 8 }
    ]
  }
}
```

---

#### List Public Collections

**Endpoint:** `POST /api/trpc/public.listPublicCollections`

Returns collections with at least one public save, sorted by count.

```json
{
  "json": {
    "spaceId": "uuid"
  }
}
```

---

#### Get Public Save

**Endpoint:** `POST /api/trpc/public.getPublicSave`

```json
{
  "json": {
    "spaceId": "uuid",
    "saveId": "uuid"
  }
}
```

---

#### Get Public Save Snapshot

**Endpoint:** `POST /api/trpc/public.getPublicSaveSnapshot`

```json
{
  "json": {
    "spaceId": "uuid",
    "saveId": "uuid",
    "includeContent": true
  }
}
```

---

#### Register Visit

**Endpoint:** `POST /api/trpc/public.registerVisit`

```json
{
  "json": {
    "spaceId": "uuid"
  }
}
```

---

#### Get Visit Count

**Endpoint:** `POST /api/trpc/public.getVisitCount`

```json
{
  "json": {
    "spaceId": "uuid"
  }
}
```

---

### 4.9 Error Codes

| tRPC Code | HTTP Status | Description |
|-----------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `NOT_FOUND` | 404 | Resource not found |
| `BAD_REQUEST` | 400 | Invalid input |
| `CONFLICT` | 409 | Resource conflict (duplicate, slug taken) |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `PRECONDITION_FAILED` | 412 | Feature disabled |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

---

### 4.10 Endpoint Quick Reference

#### Saves (Authenticated)

| Action | Endpoint | Method |
|--------|----------|--------|
| Create save | `space.createSave` | POST |
| Check duplicate | `space.checkDuplicate` | POST |
| List saves | `space.listSaves` | POST |
| Get save | `space.getSave` | POST |
| Update save | `space.updateSave` | POST |
| Toggle favorite | `space.toggleFavorite` | POST |
| Toggle archive | `space.toggleArchive` | POST |
| Delete save | `space.deleteSave` | POST |
| Bulk delete | `space.bulkDeleteSaves` | POST |

#### Tags (Authenticated)

| Action | Endpoint | Method |
|--------|----------|--------|
| List tags | `space.listTags` | POST |
| Create tag | `space.createTag` | POST |
| Update tag | `space.updateTag` | POST |
| Delete tag | `space.deleteTag` | POST |

#### Collections (Authenticated)

| Action | Endpoint | Method |
|--------|----------|--------|
| List collections | `space.listCollections` | POST |
| Create collection | `space.createCollection` | POST |
| Update collection | `space.updateCollection` | POST |
| Delete collection | `space.deleteCollection` | POST |

#### Settings (Authenticated)

| Action | Endpoint | Method |
|--------|----------|--------|
| Get my space | `space.getMySpace` | POST |
| Update settings | `space.updateSettings` | POST |
| Update slug | `space.updateSlug` | POST |
| Check slug | `space.checkSlugAvailability` | POST |

#### Domains (Authenticated)

| Action | Endpoint | Method | Platform |
|--------|----------|--------|----------|
| List domains | `space.listDomains` | POST | All |
| Add domain | `space.addDomain` | POST | ⚠️ Web only |
| Verify domain | `space.verifyDomain` | POST | ⚠️ Web only |
| Get status | `space.getDomainStatus` | POST | All |
| Remove domain | `space.removeDomain` | POST | All |

#### Stats (Authenticated)

| Action | Endpoint | Method |
|--------|----------|--------|
| Get stats | `space.getStats` | POST |
| Get dashboard | `space.getDashboardData` | POST |

#### Snapshots (Authenticated)

| Action | Endpoint | Method |
|--------|----------|--------|
| Get snapshot | `space.getSaveSnapshot` | POST |
| Request snapshot | `space.requestSaveSnapshot` | POST |
| Get quota | `space.getSnapshotQuota` | POST |

#### Public (No Auth)

| Action | Endpoint | Method |
|--------|----------|--------|
| Resolve by host | `public.resolveSpaceByHost` | POST |
| Resolve by slug | `public.resolveSpaceBySlug` | POST |
| List saves | `public.listPublicSaves` | POST |
| Get save | `public.getPublicSave` | POST |
| List tags | `public.listPublicTags` | POST |
| List collections | `public.listPublicCollections` | POST |
| Get snapshot | `public.getPublicSaveSnapshot` | POST |
| Register visit | `public.registerVisit` | POST |
| Get visit count | `public.getVisitCount` | POST |

---

## 5. Type Definitions

These types are the source of truth, defined in `@backpocket/types`.

### Enums

```typescript
// Save visibility
type SaveVisibility = "private" | "public";

// Space visibility
type SpaceVisibility = "public" | "private";

// Collection visibility
type CollectionVisibility = "private" | "public";

// Public layout preference
type PublicLayout = "list" | "grid";

// Snapshot processing status
type SnapshotStatus = "pending" | "processing" | "ready" | "failed" | "blocked";

// Snapshot blocked reason
type SnapshotBlockedReason =
  | "noarchive"
  | "forbidden"
  | "not_html"
  | "too_large"
  | "invalid_url"
  | "timeout"
  | "parse_failed"
  | "ssrf_blocked"
  | "fetch_error";

// Domain verification status
type DomainStatus =
  | "pending_verification"
  | "verified"
  | "active"
  | "error"
  | "disabled";

// Slug unavailable reason
type SlugUnavailableReason =
  | "reserved"
  | "taken"
  | "too_short"
  | "too_long"
  | "invalid_format";

// Space type
type SpaceType = "personal" | "org";

// Membership role
type MembershipRole = "owner" | "admin" | "writer" | "viewer";

// Membership status
type MembershipStatus = "active" | "invited" | "removed";
```

### Core Models

#### Save

```typescript
interface Save {
  id: string;
  spaceId: string;
  url: string;
  title: string | null;
  description: string | null;
  siteName: string | null;
  imageUrl: string | null;
  contentType: string | null;
  visibility: SaveVisibility;
  isArchived: boolean;
  isFavorite: boolean;
  createdBy: string;
  savedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  tags?: Tag[];
  collections?: Collection[];
}
```

#### Tag

```typescript
interface Tag {
  id: string;
  spaceId: string;
  name: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: { saves: number };
}
```

#### Collection

```typescript
interface Collection {
  id: string;
  spaceId: string;
  name: string;
  visibility: CollectionVisibility;
  createdAt: Date | string;
  updatedAt: Date | string;
  saves?: Save[];
  defaultTags?: Tag[];
  _count?: { saves: number };
}
```

#### Space

```typescript
interface Space {
  id: string;
  type: SpaceType;
  slug: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  visibility: SpaceVisibility;
  publicLayout: PublicLayout;
  defaultSaveVisibility: SaveVisibility;
  createdAt: Date | string;
  updatedAt: Date | string;
}
```

#### Public Space

```typescript
interface PublicSpace {
  id: string;
  slug: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  publicLayout: PublicLayout;
  visitCount: number;
}
```

#### Save Snapshot

```typescript
interface SaveSnapshot {
  saveId: string;
  spaceId: string;
  status: SnapshotStatus;
  blockedReason: SnapshotBlockedReason | null;
  attempts: number;
  nextAttemptAt: Date | string | null;
  fetchedAt: Date | string | null;
  storagePath: string | null;
  canonicalUrl: string | null;
  title: string | null;
  byline: string | null;
  excerpt: string | null;
  wordCount: number | null;
  language: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}
```

#### Snapshot Content

```typescript
interface SnapshotContent {
  title: string;
  byline: string | null;     // May contain HTML (e.g., author link)
  content: string;           // Sanitized HTML
  textContent: string;       // Plain text version
  excerpt: string;
  siteName: string | null;
  length: number;
  language: string | null;
}
```

#### Domain Mapping

```typescript
interface DomainMapping {
  id: string;
  domain: string;
  spaceId: string;
  status: DomainStatus;
  verificationToken: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}
```

#### Slug Availability

```typescript
interface SlugAvailability {
  available: boolean;
  reason: SlugUnavailableReason | null;
}
```

### API Input Types

```typescript
// Create save
interface CreateSaveInput {
  url: string;
  title?: string;
  visibility?: SaveVisibility;
  collectionIds?: string[];
  tagNames?: string[];
  note?: string;
}

// Update save
interface UpdateSaveInput {
  id: string;
  title?: string;
  description?: string;
  visibility?: SaveVisibility;
  collectionIds?: string[];
  tagNames?: string[];
}

// List saves
interface ListSavesInput {
  query?: string;
  visibility?: SaveVisibility;
  isArchived?: boolean;
  isFavorite?: boolean;
  collectionId?: string;
  tagId?: string;
  cursor?: string;
  limit?: number;
}

// Check duplicate
interface CheckDuplicateInput {
  url: string;
}

// Space settings
interface SpaceSettingsInput {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  visibility?: SpaceVisibility;
  publicLayout?: PublicLayout;
  defaultSaveVisibility?: SaveVisibility;
}

// Create collection
interface CreateCollectionInput {
  name: string;
  visibility?: CollectionVisibility;
  defaultTags?: string[];
}

// Update collection
interface UpdateCollectionInput {
  id: string;
  name?: string;
  visibility?: CollectionVisibility;
  defaultTags?: string[];
}

// Create tag
interface CreateTagInput {
  name: string;
}

// Update tag
interface UpdateTagInput {
  id: string;
  name: string;
}

// Get snapshot
interface GetSaveSnapshotInput {
  saveId: string;
  includeContent?: boolean;
}
```

### API Response Types

```typescript
// List saves response
interface ListSavesResponse {
  items: Save[];
  nextCursor: string | null;
}

// Stats response
interface StatsResponse {
  totalSaves: number;
  favoriteSaves: number;
  publicSaves: number;
  archivedSaves: number;
  totalTags: number;
  totalCollections: number;
}

// Dashboard data
interface DashboardData {
  stats: StatsResponse;
  recentSaves: Save[];
  space: Space;
}

// Duplicate check response
type CheckDuplicateResponse = DuplicateSaveInfo | null;

interface DuplicateSaveInfo {
  id: string;
  url: string;
  title: string | null;
  imageUrl: string | null;
  siteName: string | null;
  savedAt: string;
}

// Snapshot response
interface GetSaveSnapshotResponse {
  snapshot: SaveSnapshot | null;
  content: SnapshotContent | null;
}

// Domain status response
interface DomainStatusResponse {
  id: string;
  domain: string;
  status: DomainStatus;
  verified: boolean;
  misconfigured: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
  }>;
  createdAt: string;
}
```

---

## 6. Core Features

### 6.1 Saves

The core entity of Backpocket. A save represents a bookmarked URL with metadata.

**Metadata Auto-Fetching:**

- Title, description, image extracted from Open Graph / meta tags
- Site name and favicon detected
- Content type determined

**Visibility:**

- `private` — Only you can see (default)
- `public` — Visible on your public space

**States:**

- `isFavorite` — Mark important saves
- `isArchived` — Hide from main view

### 6.2 Tags

Lightweight, flat organization. Tags are:

- Auto-created when used in saves
- Auto-deleted when orphaned (no saves)
- Case-insensitive (normalized to lowercase)
- Unique per space

### 6.3 Collections

Named groups for organizing saves:

- Manual organization
- Can have visibility (affects contained saves display)
- Support default tags for auto-tagging

### 6.4 Snapshots / Reader Mode

Content preservation and distraction-free reading:

- Automatic content extraction via Mozilla Readability
- Domain-specific extractors for Twitter/X, Reddit
- Sanitized HTML for safe rendering
- Plain text version available
- Stored in Supabase Storage

### 6.5 Public Spaces

Optional public profile:

- Accessible at `https://{slug}.backpocket.my`
- Or custom domain
- Shows only public saves
- Configurable layout (list/grid)
- Visit counter

### 6.6 URL Normalization

URLs are normalized for duplicate detection:

| Transformation | Example |
|---------------|---------|
| Strip tracking params | `?utm_source=twitter` → removed |
| Remove `www.` | `www.example.com` → `example.com` |
| Lowercase hostname | `Example.COM` → `example.com` |
| Remove default ports | `:443` (https), `:80` (http) → removed |
| Sort query params | `?b=2&a=1` → `?a=1&b=2` |
| Remove trailing slash | `/path/` → `/path` |
| Remove hash fragments | `#section` → removed |

**Tracking Parameters Stripped:**

- UTM: `utm_source`, `utm_medium`, `utm_campaign`, etc.
- Facebook: `fbclid`, `fb_action_ids`, `fb_source`
- Google: `gclid`, `gclsrc`, `dclid`, `gbraid`, `wbraid`
- Twitter/X: `twclid`
- Microsoft: `msclkid`
- Common: `ref`, `ref_src`, `source`, `src`, `affiliate`
- Email: `mc_cid`, `mc_eid`, `mkt_tok`, `_hsenc`, `_hsmi`
- Analytics: `_ga`, `_gl`, `s_kwcid`

**Content Parameters Preserved:**

- YouTube: `v`, `t`, `list`
- Search: `q`, `query`, `search`
- Pagination: `page`, `p`, `offset`, `limit`
- Filtering: `sort`, `order`, `filter`, `category`, `tag`
- Content IDs: `id`, `article`, `post`, `tab`, `section`

---

## 7. Platform Implementation

### 7.1 Web App (Next.js)

**Location:** `apps/backpocket-web/`

**Stack:**

- Next.js 15 with App Router
- React 19 with Server Components
- Tailwind CSS + shadcn/ui
- tRPC for type-safe API
- Supabase for database

**Key Routes:**

```
/                    # Landing page
/sign-in             # Sign in
/sign-up             # Sign up
/app                 # Dashboard
/app/saves           # Saves list
/app/saves/[id]      # Save detail
/app/collections     # Collections
/app/tags            # Tags
/app/settings        # Settings
/public/[slug]       # Public space
```

**Environment Variables:**

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
NEXT_PUBLIC_ROOT_DOMAIN=backpocket.my
```

---

### 7.2 Mobile App (Expo)

**Location:** `apps/backpocket-mobile/`

**Stack:**

- Expo with Expo Router
- React Native
- NativeWind (Tailwind for RN)
- TanStack Query
- Clerk Expo SDK

**Key Screens:**

```
(auth)/sign-in        # Sign in
(auth)/sign-up        # Sign up
(tabs)/index          # Dashboard
(tabs)/saves          # Saves list
(tabs)/collections    # Collections
(tabs)/settings       # Settings
save/[id]             # Save detail
save/new              # Add save
collection/[id]       # Collection detail
share                 # Share sheet target
```

**Native Features:**

- Share sheet integration (iOS & Android)
- Haptic feedback
- Secure token storage
- Deep linking (`backpocket://`)
- Pull-to-refresh

**Share Sheet Integration:**

iOS: Share Extension target
Android: Intent filter in `app.json`:

```json
{
  "android": {
    "intentFilters": [
      {
        "action": "android.intent.action.SEND",
        "category": ["android.intent.category.DEFAULT"],
        "data": [{ "mimeType": "text/plain" }]
      }
    ]
  }
}
```

---

### 7.3 Browser Extension (WXT)

**Location:** `apps/backpocket-browser-extension/`

**Stack:**

- WXT framework
- React
- Clerk Chrome Extension SDK

**Components:**

- Popup UI for saving current page
- Background service worker
- Content script (if needed)

**Manifest Permissions:**

- `activeTab` — Get current tab URL
- `storage` — Store user preferences
- Host permission for `backpocket.my`

**Quick Save Flow:**

```typescript
// 1. Get current tab
const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

// 2. Get auth token
const token = await getToken();

// 3. Save to API
await fetch("https://backpocket.my/api/trpc/space.createSave", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  },
  body: JSON.stringify({
    json: {
      url: tab.url,
      title: tab.title,
      tagNames: ["from-extension"],
    },
  }),
});
```

---

## 8. UI/UX Guidelines

### Design System Colors

```typescript
const colors = {
  // Brand
  denim: {
    DEFAULT: "#3B5998",
    deep: "#2C4373",
    faded: "#6B8BC4",
  },
  rust: {
    DEFAULT: "#C4533A",
    deep: "#9E3F2C",
  },
  mint: "#4ECDC4",
  teal: "#1ABC9C",
  amber: "#F7B731",

  // Semantic
  background: { light: "#FFFFFF", dark: "#0A0A0A" },
  foreground: { light: "#171717", dark: "#EDEDED" },
  muted: { light: "#F5F5F5", dark: "#262626" },
  border: { light: "#E5E5E5", dark: "#262626" },
};
```

### Spacing

4px grid system:

- `space-1`: 4px
- `space-2`: 8px
- `space-3`: 12px
- `space-4`: 16px
- `space-6`: 24px
- `space-8`: 32px

### Mobile Gestures

| Gesture | Context | Action |
|---------|---------|--------|
| Swipe left | Save list item | Archive |
| Swipe right | Save list item | Favorite |
| Long press | Save list item | Enter selection mode |
| Pull down | Any list | Refresh |

### Loading States

- Skeleton screens for initial loads
- Subtle spinners for actions
- Optimistic updates for toggles

### Empty States

Each list should have meaningful empty states with:

- Relevant icon
- Clear title
- Helpful description
- Primary action (if applicable)

---

## 9. Changelog

### 2026-01-06

#### Added

- **Reddit Snapshot Extraction:** Custom extraction for Reddit posts, comments, subreddits, and user profiles
- **Twitter/X Snapshot Extraction:** oEmbed API integration with FxTwitter fallback
- **Public Space Filtering:** `listPublicSaves` supports `query`, `tagName`, `collectionId`
- **New Endpoints:** `public.listPublicTags`, `public.listPublicCollections`
- **Orphan Tag Cleanup:** Tags auto-deleted when no longer associated with saves

### 2026-01-05

#### Changed

- **Simplified Visibility:** Removed `"unlisted"` option. Saves are now `"private"` or `"public"` only.

#### Added

- **Duplicate Detection:** `createSave` returns `CONFLICT` error with existing save details
- **New Endpoint:** `space.checkDuplicate` for pre-save duplicate checking
- **URL Normalization:** Automatic cleaning of URLs for duplicate detection

---

## Resources

- [tRPC Documentation](https://trpc.io/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Expo Documentation](https://docs.expo.dev/)
- [WXT Framework](https://wxt.dev/)
- [Supabase Documentation](https://supabase.com/docs)

---

## Support

For questions or issues, open an issue in the Backpocket repository.
