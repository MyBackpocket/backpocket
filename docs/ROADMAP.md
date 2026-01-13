# Roadmap

Planned features and improvements for Backpocket.

---

---

## Planned Features

### User Experience

- [ ] Avatar / public space picture upload
- [ ] Custom user notes for saves
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

- [ ] Collection picker in popup
- [ ] Badge showing duplicate status
- [ ] Context menu integration

---

## Completed

### 2026-01-13

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
