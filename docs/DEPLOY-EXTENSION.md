# Deploying backpocket-browser-extension (WXT)

> **App Path:** `apps/backpocket-browser-extension/`  
> **Stack:** WXT 0.20, React, Clerk Chrome Extension SDK

This guide covers building and publishing the Backpocket browser extension to the Chrome Web Store, Firefox Add-ons, and Edge Add-ons.

---

## Prerequisites

1. **Chrome Web Store Developer Account** — [$5 one-time fee](https://chrome.google.com/webstore/devconsole/)
2. **Firefox Add-ons Developer Account** — [Free](https://addons.mozilla.org/developers/)
3. **Edge Add-ons Developer Account** — [Free](https://partner.microsoft.com/dashboard/microsoftedge/)

---

## 1. Build the Extension

### Development Build

```bash
cd apps/backpocket-browser-extension

# Chrome (default)
bun dev

# Firefox
bun dev:firefox
```

### Production Build

```bash
# Chrome/Edge (Manifest V3)
bun run build

# Firefox (Manifest V2/V3)
bun run build:firefox
```

Output directories:
- Chrome: `.output/chrome-mv3/`
- Firefox: `.output/firefox-mv3/` (or `firefox-mv2/`)

### Create ZIP Archives

```bash
# Chrome ZIP (also works for Edge)
bun run zip

# Firefox ZIP
bun run zip:firefox
```

Output files:
- `.output/backpocket-browser-extension-{version}-chrome.zip`
- `.output/backpocket-browser-extension-{version}-firefox.zip`

---

## 2. Manual Publishing

### First-Time Setup

For first-time publishing, you must manually create listings on each store. WXT's `submit` command only updates existing listings.

### Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. Click **New Item**
3. Upload `.output/backpocket-browser-extension-{version}-chrome.zip`
4. Fill in store listing:
   - Description
   - Screenshots (1280×800 or 640×400)
   - Icons (128×128)
   - Category: Productivity
5. Submit for review

### Firefox Add-ons

1. Go to [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)
2. Click **Submit a New Add-on**
3. Upload `.output/backpocket-browser-extension-{version}-firefox.zip`
4. **Source code**: Upload sources ZIP if requested (for review)
5. Fill in listing details
6. Submit for review

### Edge Add-ons

1. Go to [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/)
2. Click **Create new extension**
3. Upload the Chrome ZIP (Edge accepts Chrome extensions)
4. Fill in store listing
5. Submit for review

---

## 3. Automated Publishing

### Set Up API Credentials

#### Chrome Web Store

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable **Chrome Web Store API**
4. Create OAuth 2.0 credentials (Desktop app)
5. Get refresh token using the OAuth flow:

```bash
# Use the chrome-webstore-upload-cli or similar tool
npx chrome-webstore-upload-cli init
```

Required secrets:
- `CHROME_EXTENSION_ID` — Your extension ID (from store URL)
- `CHROME_CLIENT_ID` — OAuth client ID
- `CHROME_CLIENT_SECRET` — OAuth client secret
- `CHROME_REFRESH_TOKEN` — OAuth refresh token

#### Firefox Add-ons

1. Go to [Firefox Add-on API Keys](https://addons.mozilla.org/developers/addon/api/key/)
2. Generate API credentials

Required secrets:
- `FIREFOX_EXTENSION_ID` — Your add-on ID (e.g., `backpocket@backpocket.my`)
- `FIREFOX_JWT_ISSUER` — API key (starts with `user:`)
- `FIREFOX_JWT_SECRET` — API secret

#### Edge Add-ons

1. Go to [Partner Center API Settings](https://partner.microsoft.com/dashboard/microsoftedge/publishapi)
2. Create API credentials

Required secrets:
- `EDGE_PRODUCT_ID` — Product ID from Partner Center
- `EDGE_CLIENT_ID` — Azure AD app client ID
- `EDGE_CLIENT_SECRET` — Azure AD app client secret
- `EDGE_ACCESS_TOKEN_URL` — Token endpoint URL

### WXT Submit Command

Test with dry run first:

```bash
bunx wxt submit --dry-run \
  --chrome-zip .output/backpocket-browser-extension-*-chrome.zip \
  --firefox-zip .output/backpocket-browser-extension-*-firefox.zip \
  --firefox-sources-zip .output/backpocket-browser-extension-*-sources.zip
```

Submit for real:

```bash
bunx wxt submit \
  --chrome-zip .output/backpocket-browser-extension-*-chrome.zip \
  --firefox-zip .output/backpocket-browser-extension-*-firefox.zip \
  --firefox-sources-zip .output/backpocket-browser-extension-*-sources.zip \
  --edge-zip .output/backpocket-browser-extension-*-chrome.zip
```

---

## 4. CI/CD Workflow

### GitHub Actions

Create `.github/workflows/extension-release.yml`:

```yaml
name: Release Extension

on:
  workflow_dispatch:
  push:
    tags:
      - 'extension-v*'

jobs:
  submit:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/backpocket-browser-extension

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2

      - name: Install dependencies
        run: bun install

      - name: Build and zip extensions
        run: |
          bun run zip
          bun run zip:firefox

      - name: Submit to stores
        run: |
          bunx wxt submit \
            --chrome-zip .output/*-chrome.zip \
            --firefox-zip .output/*-firefox.zip \
            --firefox-sources-zip .output/*-sources.zip \
            --edge-zip .output/*-chrome.zip
        env:
          CHROME_EXTENSION_ID: ${{ secrets.CHROME_EXTENSION_ID }}
          CHROME_CLIENT_ID: ${{ secrets.CHROME_CLIENT_ID }}
          CHROME_CLIENT_SECRET: ${{ secrets.CHROME_CLIENT_SECRET }}
          CHROME_REFRESH_TOKEN: ${{ secrets.CHROME_REFRESH_TOKEN }}
          FIREFOX_EXTENSION_ID: ${{ secrets.FIREFOX_EXTENSION_ID }}
          FIREFOX_JWT_ISSUER: ${{ secrets.FIREFOX_JWT_ISSUER }}
          FIREFOX_JWT_SECRET: ${{ secrets.FIREFOX_JWT_SECRET }}
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `CHROME_EXTENSION_ID` | Extension ID from Chrome Web Store |
| `CHROME_CLIENT_ID` | Google OAuth client ID |
| `CHROME_CLIENT_SECRET` | Google OAuth client secret |
| `CHROME_REFRESH_TOKEN` | Google OAuth refresh token |
| `FIREFOX_EXTENSION_ID` | Add-on ID (e.g., `backpocket@example.com`) |
| `FIREFOX_JWT_ISSUER` | Firefox API key |
| `FIREFOX_JWT_SECRET` | Firefox API secret |

---

## 5. Version Management

### Updating Version

Update version in `package.json`:

```json
{
  "version": "0.2.0"
}
```

WXT automatically uses this for the manifest version.

### Manifest Configuration

The manifest is configured in `wxt.config.ts`:

```typescript
export default defineConfig({
  manifest: {
    name: "Backpocket",
    description: "Save links to your Backpocket",
    permissions: ["activeTab", "storage", "tabs"],
    host_permissions: ["https://backpocket.my/*"],
  },
});
```

---

## 6. Store Assets

### Required Assets

| Asset | Chrome | Firefox | Edge |
|-------|--------|---------|------|
| Icon 16×16 | ✅ | ✅ | ✅ |
| Icon 32×32 | ✅ | ✅ | ✅ |
| Icon 48×48 | ✅ | ✅ | ✅ |
| Icon 128×128 | ✅ | ✅ | ✅ |
| Screenshot | 1280×800 | Any | 1280×800 |
| Promo tile | 440×280 | — | 440×280 |

Icons are in `public/icon/`:
- `16.png`, `32.png`, `48.png`, `96.png`, `128.png`

### Screenshots

Recommended dimensions:
- Chrome/Edge: 1280×800 or 640×400
- Firefox: Flexible, but similar sizes work

---

## 7. Review Guidelines

### Chrome Web Store

- **Review time**: 1-3 days (can be longer)
- **Common rejections**:
  - Missing privacy policy
  - Excessive permissions
  - Unclear purpose

### Firefox Add-ons

- **Review time**: Usually < 24 hours
- **Source code**: May be requested for complex extensions
- **Common rejections**:
  - Minified code without sources
  - Remote code execution

### Edge Add-ons

- **Review time**: 1-7 days
- **Based on Chrome**: Usually passes if Chrome version approved

---

## 8. Troubleshooting

### Build Issues

```bash
# Clean and rebuild
rm -rf .output .wxt
bun run build
```

### Submission Fails

```bash
# Test credentials with dry run
bunx wxt submit --dry-run --chrome-zip .output/*-chrome.zip

# Check environment variables
echo $CHROME_EXTENSION_ID
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "Extension not found" | Verify extension ID matches store |
| "Invalid refresh token" | Re-generate OAuth credentials |
| "Permission denied" | Check API is enabled in Cloud Console |
| "Source required" | Upload source ZIP for Firefox |

---

## Quick Reference

```bash
# Navigate to extension
cd apps/backpocket-browser-extension

# Development
bun dev                    # Chrome dev mode
bun dev:firefox            # Firefox dev mode

# Build
bun run build              # Production Chrome build
bun run build:firefox      # Production Firefox build

# Package
bun run zip                # Create Chrome ZIP
bun run zip:firefox        # Create Firefox ZIP

# Submit (after setting env vars)
bunx wxt submit --dry-run \
  --chrome-zip .output/*-chrome.zip \
  --firefox-zip .output/*-firefox.zip

# Actual submission
bunx wxt submit \
  --chrome-zip .output/*-chrome.zip \
  --firefox-zip .output/*-firefox.zip \
  --edge-zip .output/*-chrome.zip
```
