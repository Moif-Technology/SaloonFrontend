# SalonPOS Update System Documentation

Complete update notification system for SalonPOS frontend. Shows update availability with persistent banner + toast notifications.

## Features

✅ **Backend Endpoint** — `/api/salon-pos/app/version` (public, no auth required)
✅ **Auto-check on App Load** — Checks for updates when app starts
✅ **Manual Update Check** — "More" button → Settings → Check Now
✅ **Persistent Banner** — Shows at top of app when update available (8s auto-dismiss)
✅ **Toast Notifications** — Alert user of new available versions
✅ **Smart Caching** — Only checks every 60 minutes (localStorage based)
✅ **Dismiss System** — User can dismiss notifications (stored in localStorage)
✅ **Download Link** — Direct action to download/install new version

---

## Architecture

### Backend (`api/src/pos/salon/`)

**File:** `controllers/auth.controller.js`
- **Function:** `checkAppVersion(req, res)`
- **Route:** `GET /api/salon-pos/app/version`
- **Auth:** None (public endpoint)
- **Response:**
```json
{
  "ok": true,
  "data": {
    "currentVersion": "0.1.0",
    "latestVersion": "0.2.0",
    "updateAvailable": true,
    "description": "...",
    "releaseNotes": "...",
    "downloadUrl": "https://...",
    "isRequired": false,
    "releasedAt": "2024-01-15T...",
    "platform": "web"
  }
}
```

**Route Setup:** `salon.routes.js` (line 61)
```javascript
salonPosRouter.get('/app/version', authController.checkAppVersion);
```

---

### Frontend

#### 1. API Wrapper (`src/api/updates.ts`)
- `checkAppUpdate(platform)` — HTTP call to backend
- `isUpdateNeeded(current, latest)` — Semver comparison
- `AppVersionInfo` interface — TypeScript types

#### 2. Custom Hook (`src/hooks/useCheckUpdates.ts`)
- `useCheckUpdates()` — Manages update state & localStorage
- Auto-checks on mount (60-min interval)
- Methods: `check()`, `dismiss()`, `undismiss()`, `reset()`
- Persists: dismiss state, last check time

#### 3. Components

**UpdateBanner** (`src/components/UpdateBanner.tsx`)
- Sticky banner at top of app
- Auto-shows when update available
- Auto-hides after 8 seconds
- Actions: Download, Manual Check, Dismiss
- Triggers toast notification for new updates

**AppSettingsDialog** (`src/components/pos/AppSettingsDialog.tsx`)
- Modal opened via "More" button in POS header
- Shows: Current version, Latest version, Release notes
- Actions: Manual check, Download update, Close
- Status indicator (up-to-date / available)

#### 4. Integration

**App.tsx** — Renders UpdateBanner at root (shows in all routes)
```jsx
<UpdateBanner />
<SessionGate>
  <PosPage />
</SessionGate>
```

**PosPage.tsx** — Opens AppSettingsDialog from "More" menu
```jsx
onMore={() => setAppSettingsOpen(true)}
```

---

## LocalStorage Keys

| Key | Value | Purpose |
|-----|-------|---------|
| `pos_update_dismissed` | `"true"` \| `"false"` | Whether banner dismissed |
| `pos_update_last_check` | Timestamp (ms) | Last update check time |

---

## Configuration

### Backend (api/src/pos/salon/controllers/auth.controller.js)

Update the version info in `checkAppVersion()`:

```javascript
const versionInfo = {
  currentVersion: '0.1.0',        // Your current version
  latestVersion: '0.2.0',         // Available version
  updateAvailable: true,          // Show banner?
  description: '...',             // Brief description
  releaseNotes: '...',            // Full notes
  downloadUrl: 'https://...',     // Where to download
  isRequired: false,              // Force update?
  releasedAt: new Date('...'),    // Release date
};
```

### Frontend

**Check Interval:** 60 minutes (src/hooks/useCheckUpdates.ts line 23)
```typescript
const CHECK_INTERVAL_MINUTES = 60
```

**Auto-hide Duration:** 8 seconds (src/components/UpdateBanner.tsx line 31)
```typescript
setTimeout(() => { setShowBanner(false) }, 8000)
```

---

## User Flow

### First Visit (Auto-check)
1. App loads → UpdateBanner mounts
2. `useCheckUpdates()` hook → auto-checks version
3. If update available → Banner slides down with toast
4. User sees: "v0.2.0 available" + release notes + Download button
5. Auto-hides in 8 seconds OR user dismisses
6. Dismissed state stored in localStorage

### Manual Check
1. User taps "More" button (top-right of POS header)
2. AppSettingsDialog opens
3. Shows current version & status
4. User clicks "Check Now"
5. Fetches latest version info
6. Displays results with Download option if available

### Download Action
1. User clicks "Download" button (banner or dialog)
2. Opens download URL in new tab (`window.open()`)
3. Dialog/banner auto-closes

---

## Testing

### Backend
```bash
curl http://localhost:5010/api/salon-pos/app/version
```

Expected response: Version info JSON with `ok: true`

### Frontend
1. Open browser DevTools
2. Check LocalStorage:
   - `pos_update_dismissed`
   - `pos_update_last_check`
3. Check Network tab:
   - Request to `/api/salon-pos/app/version`
   - Response 200 with version data
4. Manually clear localStorage to reset state:
   ```javascript
   localStorage.removeItem('pos_update_dismissed')
   localStorage.removeItem('pos_update_last_check')
   ```

---

## Future Enhancements

- [ ] Server-side version management (read from config/DB instead of hardcode)
- [ ] Automatic scheduled checks via service worker
- [ ] Progressive Web App (PWA) native update prompts
- [ ] Email notifications for required updates
- [ ] Rollback history tracking
- [ ] Platform-specific versions (web vs mobile)
- [ ] Force-update mechanism (isRequired = true)
- [ ] Update progress tracking (download %)

---

## Files Modified/Created

### Backend
- ✏️ `api/src/pos/salon/controllers/auth.controller.js` — Added `checkAppVersion()`
- ✏️ `api/src/pos/salon/salon.routes.js` — Added `/app/version` route

### Frontend
- ✨ `src/api/updates.ts` — New API wrapper
- ✨ `src/hooks/useCheckUpdates.ts` — New custom hook
- ✨ `src/components/UpdateBanner.tsx` — New banner component
- ✨ `src/components/pos/AppSettingsDialog.tsx` — New settings dialog
- ✏️ `src/App.tsx` — Added UpdateBanner import & JSX
- ✏️ `src/pages/PosPage.tsx` — Added AppSettingsDialog import & integration

---

## Error Handling

- Network errors → User sees error message in dialog
- Timeout (8s) → Treated as failed check, error displayed
- Malformed response → Caught and shown to user
- localStorage unavailable → System still works, no dismiss persistence

---

## Version Format

Uses simple semantic versioning: `MAJOR.MINOR.PATCH`
- `0.1.0` vs `0.2.0` → Update needed ✓
- `0.2.0` vs `0.2.0` → Up to date
- `0.2.1` vs `0.2.0` → No update (newer installed)

---

## Performance Notes

- Lightweight: ~4KB minified (API wrapper + hook + components)
- Network: Single HTTP call on app load (no polling by default)
- localStorage: <100 bytes (two simple keys)
- No external dependencies added
- Mobile-friendly: Responsive UI, touch-safe buttons

---

**Last Updated:** 2024
**Status:** Production Ready
