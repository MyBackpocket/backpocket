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
| Create save | ✅ | ✅ | ✅ | Extension auto-saves on popup open |
| List saves | ✅ | ✅ | ❌ | Removed from extension for one-click UX |
| View save detail | ✅ | ✅ | ❌ | Link to web app provided after save |
| Edit save (post-save) | ✅ | ✅ | ✅ | Extension: tags, collections, visibility, note |
| Delete save | ✅ | ✅ | ❌ | |
| Bulk delete | ✅ | ✅ | ❌ | |
| Toggle favorite | ✅ | ✅ | ❌ | |
| Toggle archive | ✅ | ✅ | ❌ | |
| Save notes (markdown) | ✅ | ✅ | ✅ | Extension: collapsible note input, auto-saves on blur |
| Duplicate detection | ✅ | ✅ | ✅ | Pre-save warning with link to existing |
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
| List collections | ✅ | ✅ | ✅ | For dropdown selector |
| Create collection | ✅ | ✅ | ❌ | |
| Edit collection | ✅ | ✅ | ❌ | |
| Delete collection | ✅ | ✅ | ❌ | |
| Add save to collection | ✅ | ✅ | ✅ | Multi-select dropdown |

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
| Default save visibility | ✅ | ✅ | ✅ | Uses user's default |
| Theme preference | ✅ | ✅ | ✅ | Follows system preference |
| Sign out | ✅ | ✅ | ✅ | |

---

## Platform-Specific Features

| Feature | Web | Mobile | Extension | Notes |
|---------|-----|--------|-----------|-------|
| **Web-Only** |
| Full dashboard | ✅ | ✅ | ❌ | |
| Quick add modal | ✅ | N/A | N/A | |
| Keyboard shortcuts | ✅ | N/A | ✅ | ⌘+Shift+S to save |
| **Mobile-Only** |
| Share sheet integration | N/A | ✅ | N/A | iOS & Android |
| Haptic feedback | N/A | ✅ | N/A | |
| Pull-to-refresh | N/A | ✅ | N/A | |
| Swipe actions | N/A | ✅ | N/A | |
| Deep linking | N/A | ✅ | N/A | `backpocket://` |
| Offline-first boot | N/A | ✅ | N/A | App loads without network |
| Offline storage | N/A | ✅ | N/A | SQLite + file cache |
| Auto-sync | N/A | ✅ | N/A | WiFi-only option |
| Cached auth | N/A | ✅ | N/A | Uses cached user when offline |
| **Extension-Only** |
| One-click save | N/A | N/A | ✅ | Auto-saves on popup open |
| Post-save quick actions | N/A | N/A | ✅ | Tags, collections, visibility, note |
| Popup interface | N/A | N/A | ✅ | Status-based flow (saving → success) |
| Context menu | N/A | N/A | ✅ | Right-click to save |
| Badge notifications | N/A | N/A | ✅ | Success/pending indicators |

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
| `space.createSave` | ✅ | Auto-save on popup open |
| `space.updateSave` | ✅ | Post-save quick actions |
| `space.checkDuplicate` | ✅ | Pre-save duplicate check |
| `space.listTags` | ✅ | Tag suggestions |
| `space.listCollections` | ✅ | Collection picker |
| `space.getMySpace` | ✅ | Default visibility |
| `space.ensureSpace` | ✅ | Create space if needed |

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
