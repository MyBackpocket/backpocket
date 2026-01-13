# Roadmap

Planned features and improvements for Backpocket.

---

---

## Planned Features

### User Experience

- [ ] Avatar / public space picture upload
- [ ] Collection auto-visibility: default public/private for saves added
- [ ] Hidden collections: hide from main list/search for sensitive content
- [ ] Bulk operations for collections

### Content Moderation

- [ ] Moderation system for user-generated content

### App Icon & Branding

- [ ] Finalize app icons for all platforms
  - See: [Stack Overflow reference](https://stackoverflow.com/a/76992849)

---

## Platform Integrations (Domain-Specific Extractors)

These platforms don't work well with Mozilla Readability and need custom parsing.

**Pattern:** `lib/snapshots/domains/<platform>.ts` → register in `lib/snapshots/domains/index.ts`

### Currently Implemented

| Platform  | Status  | Method                          |
| --------- | ------- | ------------------------------- |
| Twitter/X | ✅ Done | oEmbed API + FxTwitter fallback |
| Reddit    | ✅ Done | old.reddit.com scraping         |

### Social Media / Microblogging

| Platform              | Priority | Notes                            |
| --------------------- | -------- | -------------------------------- |
| Threads (threads.net) | Medium   | No public API, may need scraping |
| Bluesky (bsky.app)    | Medium   | Public API (AT Protocol)         |
| Mastodon              | Low      | Has oEmbed, federated instances  |
| LinkedIn posts        | Low      | Requires auth, limited           |

### Video Platforms

| Platform     | Priority | Notes                                   |
| ------------ | -------- | --------------------------------------- |
| YouTube      | High     | Has oEmbed; transcript via captions API |
| Vimeo        | Medium   | Has oEmbed support                      |
| TikTok       | Medium   | Has oEmbed via oembed.tiktok.com        |
| Twitch clips | Low      | Has oEmbed for clips                    |
| Dailymotion  | Low      | Has oEmbed                              |

### Discussion / Forums

| Platform         | Priority | Notes                            |
| ---------------- | -------- | -------------------------------- |
| Hacker News      | High     | Simple HTML, easy to parse       |
| Stack Overflow   | Medium   | Structured data, relatively easy |
| Discourse forums | Low      | Varies by instance               |

### Image Sharing

| Platform  | Priority | Notes                                               |
| --------- | -------- | --------------------------------------------------- |
| Instagram | Low      | No public API, very locked down; bibliogram proxies |
| Pinterest | Low      | Has oEmbed (limited)                                |
| Imgur     | Medium   | Has API                                             |
| Flickr    | Low      | Has oEmbed                                          |

### Code / Developer Platforms

| Platform | Priority | Notes                                               |
| -------- | -------- | --------------------------------------------------- |
| GitHub   | High     | Repos, gists, issues, PRs; has API; README previews |
| GitLab   | Medium   | Similar to GitHub                                   |
| CodePen  | Low      | Has oEmbed                                          |
| JSFiddle | Low      | Has oEmbed                                          |
| Gist     | Medium   | Has oEmbed                                          |

### Long-form / Newsletters

| Platform                | Priority | Notes                                      |
| ----------------------- | -------- | ------------------------------------------ |
| Substack                | Medium   | Generally works, may need paywall handling |
| Medium                  | Medium   | Paywall bypass via scribe.rip / freedium   |
| Notion public pages     | Low      | Dynamic rendering, special handling        |
| Google Docs (published) | Low      | Export as HTML                             |

### Audio / Podcasts

| Platform       | Priority | Notes                                    |
| -------------- | -------- | ---------------------------------------- |
| Spotify        | Medium   | Has oEmbed for tracks/episodes/playlists |
| SoundCloud     | Medium   | Has oEmbed                               |
| Apple Podcasts | Low      | No oEmbed, would need scraping           |

### Other

| Platform        | Priority | Notes                               |
| --------------- | -------- | ----------------------------------- |
| Google Maps     | Low      | Has embed URLs, extract place info  |
| Amazon products | Low      | Scrape product details, images      |
| Goodreads       | Low      | Book info extraction                |
| Wikipedia       | Low      | Already works, enhance with infobox |

### Suggested Priority Order

1. **YouTube** — Very common, has oEmbed
2. ~~**Reddit**~~ ✅ Done
3. **GitHub** — Common for devs, has API
4. **Hacker News** — Common, easy to parse
5. **Instagram** — Common but difficult
6. **TikTok** — Growing, has oEmbed

---

## Technical Improvements

### Performance

- [ ] Response caching optimization
- [ ] Image optimization pipeline
- [ ] Lazy loading improvements

### Mobile

- [ ] Offline queue for mutations
- [ ] Background sync
- [ ] Push notification setup

### Extension

- [x] **One-click save redesign** ✅ 2026-01-13
  - Auto-saves on popup open (save first, organize later)
  - Post-save quick actions: tags, collections, visibility, note
  - Status-based flow: loading → saving → success/duplicate/error
- [x] Collection picker in popup ✅ 2026-01-13
- [x] Badge showing duplicate status ✅ 2026-01-13
- [x] Context menu integration ✅ 2026-01-13
- [x] Keyboard shortcuts (⌘+Shift+S) ✅ 2026-01-13
- [x] Respect user's default visibility ✅ 2026-01-13

---

## Completed

### 2026-01-13

- ✅ **Extension one-click save redesign** (Browser Extension)
  - Auto-save on popup open: "Save first, organize later" pattern
  - Status-based UI: Clean centered states (saving → success → duplicate/error)
  - Post-save quick actions: Tags, collections, visibility, note
  - Horizontal tag chips with inline add new tag
  - Collapsible note input with auto-save on blur
  - Removed tab navigation for streamlined one-click UX
- ✅ **Extension feature parity** (Browser Extension)
  - Collection picker: Multi-select dropdown in popup
  - Duplicate detection UI: Warning banner with link to existing save
  - Visibility toggle: Uses user's default save visibility setting
  - Context menu: Right-click "Save to Backpocket" on pages/links
  - Keyboard shortcuts: ⌘+Shift+S (Mac) / Ctrl+Shift+S to save
  - Badge notifications: Visual feedback for success/pending states
  - Improved types: Now uses shared `@backpocket/types` package
- ✅ **WYSIWYG note editor** (Web)
  - Added Novel-based rich text editor for note editing on save detail and creation pages
  - Simple/rich mode toggle persisted in localStorage
  - Full-screen mode for focused writing with Escape to exit
  - Floating toolbar on text selection (bold, italic, strikethrough, code)
  - Slash commands for quick formatting (`/heading`, `/list`, `/quote`, `/code`)
  - Auto-save with debounce (1000ms delay) and save status indicator
  - Markdown import/export: stores as markdown, edits as rich text
- ✅ **Save notes feature** (Web + Mobile)
  - Added `note` field to saves for personal thoughts, annotations, or commentary
  - Notes support full markdown formatting with GFM (tables, strikethrough, etc.)
  - Notes inherit visibility from parent save (public saves show notes publicly)
  - Markdown rendered with syntax highlighting for code blocks
  - Searchable: notes are included in save text search
- ✅ **Refresh save feature** (Web + Mobile)
  - **Web:** Added "Refresh" dropdown on save detail page with options:
    - Refresh metadata (title, description, thumbnail)
    - Refresh content (reader mode snapshot)
    - Refresh all
  - **Mobile:** Added "Refresh" quick action on save detail screen
  - Enhanced `/api/unfurl` endpoint with Twitter oEmbed and Reddit JSON API support
  - Smart timestamps (relative for recent, absolute for older)
- ✅ **Improved X/Twitter link handling**
  - Added `@backpocket/utils` Twitter URL parsing utilities
  - Better fallback titles in Quick Add: "X post by @user · Jan 12"
  - Fixed metadata refresh for Twitter links via oEmbed API
- ✅ **Improved Reddit link handling**
  - Reddit JSON API integration for metadata refresh
  - Proper title extraction: "r/subreddit · 2d ago: Post title"
  - Support for posts, comments, subreddits, and user profiles

### 2026-01-12

- ✅ **Supabase to Convex migration**
  - Migrated database from Supabase/PostgreSQL to Convex
  - Replaced tRPC routers with Convex queries/mutations/actions
  - Replaced QStash + Redis with Convex scheduled functions
  - Replaced Supabase Storage with Convex File Storage
  - All clients (web, mobile, extension) now use Convex directly
  - Real-time updates now built-in for all queries

### 2026-01-06

- ✅ Twitter/X snapshot extraction
- ✅ Reddit snapshot extraction
- ✅ Public space filtering (search, tags, collections)
- ✅ Orphan tag cleanup

### 2026-01-05

- ✅ Simplified visibility (removed "unlisted")
- ✅ Duplicate detection and checking
- ✅ URL normalization
