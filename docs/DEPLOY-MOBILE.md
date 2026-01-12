# Deploying backpocket-mobile (Expo with EAS)

> **App Path:** `apps/backpocket-mobile/`  
> **Stack:** Expo 54, React Native, Expo Router, Clerk, NativeWind

This guide covers building and submitting the Backpocket mobile app to the Apple App Store and Google Play Store using Expo Application Services (EAS).

---

## Prerequisites

1. **Expo Account** — [expo.dev](https://expo.dev) (free tier works for builds)
2. **Apple Developer Account** — For iOS App Store ($99/year)
3. **Google Play Console Account** — For Android Play Store ($25 one-time)
4. **EAS CLI** — Installed globally

```bash
bun add -g eas-cli
eas login
```

---

## 1. Project Configuration

### app.json

Key configuration already set up:

```json
{
  "expo": {
    "name": "Backpocket",
    "slug": "backpocket-mobile",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "dev.backpocket.app",
      "supportsTablet": true
    },
    "android": {
      "package": "dev.backpocket.app"
    },
    "extra": {
      "eas": {
        "projectId": "e334de5b-16e9-42be-a029-196433399113"
      }
    }
  }
}
```

### eas.json

Build profiles are configured in `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "development-device": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "${APPLE_ID}",
        "ascAppId": "${ASC_APP_ID}",
        "appleTeamId": "${APPLE_TEAM_ID}"
      },
      "android": {
        "serviceAccountKeyPath": "./pc-api-key.json",
        "track": "internal"
      }
    }
  }
}
```

---

## 2. Build Profiles

### Development Build (Simulator)

For local development with Expo Dev Client:

```bash
cd apps/backpocket-mobile
eas build --profile development --platform ios
```

### Development Build (Device)

For testing on physical devices:

```bash
eas build --profile development-device --platform all
```

Install via QR code or direct download from EAS dashboard.

### Preview Build

For internal testing (TestFlight/Internal Testing):

```bash
eas build --profile preview --platform all
```

### Production Build

For app store submission:

```bash
# Build both platforms
eas build --profile production --platform all

# Or build individually
eas build --profile production --platform ios
eas build --profile production --platform android
```

---

## 3. Environment Variables

### Build-time Variables

Set in `eas.json` under each profile:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_...",
        "EXPO_PUBLIC_API_URL": "https://backpocket.my"
      }
    }
  }
}
```

### Secrets (Sensitive Data)

Use EAS Secrets for sensitive values:

```bash
# Set a secret
eas secret:create --name CLERK_SECRET_KEY --value "sk_live_..." --scope project

# List secrets
eas secret:list
```

---

## 4. iOS Deployment

### First-Time Setup

1. **Apple Developer Account**: Enroll at [developer.apple.com](https://developer.apple.com)

2. **App Store Connect App**: Create your app listing at [appstoreconnect.apple.com](https://appstoreconnect.apple.com)

3. **Get ASC App ID**: Found in App Store Connect → Your App → App Information → Apple ID

4. **Set Environment Variables**:

```bash
export APPLE_ID="your@email.com"
export ASC_APP_ID="1234567890"
export APPLE_TEAM_ID="UPPDT2XJQU"
```

Or add to your shell profile / CI secrets.

### Build for iOS

```bash
eas build --profile production --platform ios
```

EAS will:
- Generate/manage provisioning profiles
- Create distribution certificate (first time)
- Build and sign the IPA

### Submit to App Store

```bash
eas submit --platform ios
```

Or combine build and submit:

```bash
eas build --profile production --platform ios --auto-submit
```

### TestFlight

After submission, the build appears in TestFlight for testing before public release.

---

## 5. Android Deployment

### First-Time Setup

1. **Google Play Console**: Create developer account at [play.google.com/console](https://play.google.com/console)

2. **Create App Listing**: Set up your app in Play Console

3. **Service Account Key**:
   - Go to Play Console → Setup → API access
   - Create or link a Google Cloud project
   - Create a service account with "Release Manager" permissions
   - Download JSON key as `pc-api-key.json`
   - Place in `apps/backpocket-mobile/` (gitignored!)

### Build for Android

```bash
eas build --profile production --platform android
```

EAS will:
- Generate upload keystore (first time, stored securely by EAS)
- Build and sign the AAB

### Submit to Play Store

```bash
eas submit --platform android
```

### Release Tracks

Configure in `eas.json`:

```json
{
  "submit": {
    "production": {
      "android": {
        "track": "internal"  // or "alpha", "beta", "production"
      }
    }
  }
}
```

Progression: `internal` → `alpha` → `beta` → `production`

---

## 6. Automated Releases (CI/CD)

### GitHub Actions Workflow

Create `.eas/workflows/build-and-submit.yml`:

```yaml
name: Build and Submit
on:
  push:
    branches: ['main']

jobs:
  build_android:
    name: Build Android
    type: build
    params:
      platform: android
      profile: production

  build_ios:
    name: Build iOS
    type: build
    params:
      platform: ios
      profile: production

  submit_android:
    name: Submit Android
    type: submit
    needs: [build_android]
    params:
      build_id: ${{ needs.build_android.outputs.build_id }}

  submit_ios:
    name: Submit iOS
    type: submit
    needs: [build_ios]
    params:
      build_id: ${{ needs.build_ios.outputs.build_id }}
```

### Required Secrets

Set in EAS or GitHub:

- `EXPO_TOKEN` — For EAS authentication in CI
- `APPLE_ID`, `ASC_APP_ID`, `APPLE_TEAM_ID` — For iOS submission
- Service account JSON content — For Android submission

---

## 7. Version Management

### Automatic Version Increment

With `"autoIncrement": true` in production profile:

- **Build number** auto-increments each build
- **Version** (`1.0.0`) managed in `app.json`

### Manual Version Bump

```bash
# Update version in app.json
{
  "expo": {
    "version": "1.1.0"
  }
}
```

### Check Current Versions

```bash
eas build:version:get --platform ios
eas build:version:get --platform android
```

---

## 8. OTA Updates

### Expo Updates

For JavaScript-only changes (no native code):

```bash
# Publish update to production channel
eas update --branch production --message "Bug fixes"
```

Updates are downloaded automatically on next app launch.

### Update Channels

Configure channels per profile:

```json
{
  "build": {
    "production": {
      "channel": "production"
    },
    "preview": {
      "channel": "preview"
    }
  }
}
```

---

## 9. Troubleshooting

### Build Fails

```bash
# View detailed logs
eas build:view

# Check build status
eas build:list
```

### iOS Certificate Issues

```bash
# Regenerate credentials
eas credentials --platform ios
```

### Android Keystore Issues

```bash
# View/manage credentials
eas credentials --platform android
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "No bundle identifier" | Set `ios.bundleIdentifier` in app.json |
| "Provisioning profile" | Run `eas credentials` to fix |
| "Service account" | Re-download JSON key, verify permissions |
| "Build timeout" | Large apps may need paid EAS plan |

---

## Quick Reference

```bash
# Navigate to mobile app
cd apps/backpocket-mobile

# Development
bun start                                    # Start Expo dev server
eas build --profile development --platform ios  # Dev build for simulator

# Preview/Testing
eas build --profile preview --platform all   # Internal test builds

# Production
eas build --profile production --platform all  # Store builds
eas submit --platform all                      # Submit to stores

# Updates (OTA)
eas update --branch production               # Push JS-only update

# Utilities
eas build:list                               # View recent builds
eas credentials                              # Manage signing credentials
eas secret:list                              # View configured secrets
```
