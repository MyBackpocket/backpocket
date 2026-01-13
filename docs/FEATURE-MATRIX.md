# Feature Matrix

Feature parity tracker across Backpocket platforms.

**Legend:**

- ✅ Implemented
- 🚧 In Progress
- ❌ Not Available
- 📋 Planned
- N/A Not Applicable

---

## Core Features

| Feature | Web | Mobile | Extension | Notes |
|---------|-----|--------|-----------|-------|
| **Saves** |
| Create save | ✅ | ✅ | ✅ | |
| List saves | ✅ | ✅ | ❌ | Extension is quick-save only |
| View save detail | ✅ | ✅ | ❌ | |
| Edit save | ✅ | ✅ | ❌ | |
| Delete save | ✅ | ✅ | ❌ | |
| Bulk delete | ✅ | ✅ | ❌ | |
| Toggle favorite | ✅ | ✅ | ❌ | |
| Toggle archive | ✅ | ✅ | ❌ | |
| Save notes (markdown) | ✅ | ✅ | ❌ | Personal notes inherit visibility; Web has WYSIWYG editor |
| Duplicate detection | ✅ | ✅ | ✅ | |
| **Search & Filter** |
| Text search | ✅ | ✅ | ❌ | |
| Filter by visibility | ✅ | ✅ | ❌ | |
| Filter by favorite | ✅ | ✅ | ❌ | |
| Filter by archived | ✅ | ✅ | ❌ | |
| Filter by tag | ✅ | ✅ | ❌ | |
| Filter by collection | ✅ | ✅ | ❌ | |
| **Tags** |
| List tags | ✅ | ✅ | ✅ | For autocomplete |
| Create tag (inline) | ✅ | ✅ | ✅ | Via save creation |
| Rename tag | ✅ | ✅ | ❌ | |
| Delete tag | ✅ | ✅ | ❌ | |
| Tag autocomplete | ✅ | ✅ | ✅ | |
| **Collections** |
| List collections | ✅ | ✅ | 📋 | |
| Create collection | ✅ | ✅ | ❌ | |
| Edit collection | ✅ | ✅ | ❌ | |
| Delete collection | ✅ | ✅ | ❌ | |
| Add save to collection | ✅ | ✅ | 📋 | |

---

## Reader Mode & Snapshots

| Feature | Web | Mobile | Extension | Notes |
|---------|-----|--------|-----------|-------|
| View reader mode | ✅ | ✅ | ❌ | |
| Adjustable font size | ✅ | ✅ | N/A | |
| Theme (light/dark/sepia) | ✅ | ✅ | N/A | |
| Refresh save | ✅ | ✅ | ❌ | Re-fetch metadata and re-snapshot |

---

## Public Space

| Feature | Web | Mobile | Extension | Notes |
|---------|-----|--------|-----------|-------|
| **Viewing** |
| View public space | ✅ | ✅ | N/A | Via browser |
| Browse public saves | ✅ | ✅ | N/A | |
| Filter public saves | ✅ | ✅ | N/A | |
| View public tags | ✅ | ✅ | N/A | |
| View public collections | ✅ | ✅ | N/A | |
| **Settings** |
| Toggle visibility | ✅ | ✅ | ❌ | |
| Edit display name | ✅ | ✅ | ❌ | |
| Edit bio | ✅ | ✅ | ❌ | |
| Change layout | ✅ | ✅ | ❌ | |
| Edit subdomain/slug | ✅ | ✅ | ❌ | |
| View public link | ✅ | ✅ | ❌ | |
| Copy public link | ✅ | ✅ | ❌ | |
| **Custom Domains** |
| View domains | ✅ | ✅ | ❌ | |
| Add domain | ✅ | ❌ | ❌ | DNS config needed |
| Verify domain | ✅ | ❌ | ❌ | |
| Remove domain | ✅ | ✅ | ❌ | |

---

## User Settings

| Feature | Web | Mobile | Extension | Notes |
|---------|-----|--------|-----------|-------|
| View profile | ✅ | ✅ | ❌ | |
| Default save visibility | ✅ | ✅ | ❌ | |
| Theme preference | ✅ | ✅ | ❌ | |
| Sign out | ✅ | ✅ | ✅ | |

---

## Platform-Specific Features

| Feature | Web | Mobile | Extension | Notes |
|---------|-----|--------|-----------|-------|
| **Web-Only** |
| Full dashboard | ✅ | ✅ | ❌ | |
| Quick add modal | ✅ | N/A | N/A | |
| Keyboard shortcuts | ✅ | N/A | N/A | |
| **Mobile-Only** |
| Share sheet integration | N/A | ✅ | N/A | iOS & Android |
| Haptic feedback | N/A | ✅ | N/A | |
| Pull-to-refresh | N/A | ✅ | N/A | |
| Swipe actions | N/A | ✅ | N/A | |
| Deep linking | N/A | ✅ | N/A | `backpocket://` |
| **Extension-Only** |
| Quick save current tab | N/A | N/A | ✅ | |
| Popup interface | N/A | N/A | ✅ | |

---

## Authentication

| Feature | Web | Mobile | Extension | Notes |
|---------|-----|--------|-----------|-------|
| Email/password sign in | ✅ | ✅ | ✅ | |
| OAuth (Google) | ✅ | ✅ | ✅ | |
| OAuth (Apple) | ✅ | ✅ | 📋 | |
| Session persistence | ✅ | ✅ | ✅ | |
| Secure token storage | ✅ | ✅ | ✅ | |

---

## API Coverage by Platform

### Extension Priority Endpoints

| Endpoint | Status | Notes |
|----------|--------|-------|
| `space.createSave` | ✅ | Primary functionality |
| `space.checkDuplicate` | ✅ | Pre-save check |
| `space.listTags` | ✅ | For autocomplete |
| `space.listCollections` | 📋 | Optional |

### Mobile Priority Endpoints

All endpoints are available on mobile. Key ones:

| Endpoint | Status | Notes |
|----------|--------|-------|
| `space.createSave` | ✅ | Share sheet |
| `space.checkDuplicate` | ✅ | Instant feedback |
| `space.listSaves` | ✅ | Main list |
| `space.getDashboardData` | ✅ | Home screen |
| `space.getSaveSnapshot` | ✅ | Reader mode |
| `space.getMySpace` | ✅ | Settings |
| `space.updateSettings` | ✅ | Settings |

---

## Upcoming Features

See [ROADMAP.md](./ROADMAP.md) for planned features and their target platforms.
