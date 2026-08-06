# Salon POS — Build APK Guide

## Sunmi D3 Mini & Fullscreen Setup

### Prerequisites
- Node.js v18+
- Android SDK (API 31+)
- JDK 21

### Build Steps

#### 1. Install dependencies
```bash
npm install
```

#### 2. Build web assets
```bash
npm run build
```

#### 3. Update Capacitor
```bash
npx cap sync android
```

#### 4. Build APK (Debug)
```bash
cd android
./gradlew assembleDebug
```

The debug APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

#### 5. Build APK (Release)
```bash
cd android
./gradlew assembleRelease
```

The release APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### APK Features

#### Sunmi Printer Support
- ✅ Auto-detects Sunmi D3 mini device
- ✅ Direct thermal printer access (bypasses browser print dialog)
- ✅ Automatic fallback to browser print if Sunmi SDK fails
- ✅ Receipt HTML → direct printer output

#### Fullscreen Mode
- ✅ Hides status bar + navigation bar
- ✅ Immersive sticky fullscreen (Android 4.4+)
- ✅ Screen stays on (no sleep during transactions)
- ✅ Portrait orientation locked

### Installation on Device

#### USB Install
```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

#### Or: Drag & Drop
1. Connect Sunmi D3 via USB
2. Copy `app-release.apk` to device storage
3. Open file manager on device → tap APK → install

### Troubleshooting

#### Printer Not Working
- Verify Sunmi permission granted: Settings → Apps → Salon POS → Permissions
- Check printer is powered on
- Restart app
- Try browser print fallback (long-press print button)

#### Screen Not Fullscreen
- App may be in demo/kiosk mode — check Sunmi system settings
- Force fullscreen via: Settings → Display → Immersive mode

#### APK Won't Install
- Ensure `salon-pos-key.jks` exists in project root
- Check signing config in `android/app/build.gradle`
- Verify JDK 21 installed: `java -version`

### API Endpoints

Production: `https://api.moifone.com`

Change in `capacitor.config.ts` if needed.

### Gradle Dependencies

Key libraries:
- `@capacitor/core` — React Native bridge
- `com.sunmi:sunmiui` — Sunmi printer SDK
- `androidx.appcompat` — Android UI

### Notes

- APK built with **release signing** for production deployment
- Database scoped to `branch_id` (Sunmi device = POS station)
- All print receipts formatted for 80mm thermal printer
- Biometric attendance integration via separate HTTPS bridge
