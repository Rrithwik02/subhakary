

# Update PWA Home Screen Icon to Colored Logo

## Problem
The PWA app icon displayed on the mobile home screen still uses the old icon (`pwa-icon-192.png` / `pwa-icon-512.png`). You want it to use the colored flame logo instead.

## Changes Required

### 1. Replace PWA icon files
- Copy `public/favicon.png` (the colored logo) to replace:
  - `public/pwa-icon-192.png`
  - `public/pwa-icon-512.png`
  - `public/pwa-icon-maskable-192.png`
  - `public/pwa-icon-maskable-512.png`

All four files will use the same colored logo image. The browser handles scaling to the appropriate size. The `manifest.json` already references these filenames, so no manifest changes are needed.

### 2. No other changes needed
- `manifest.json` already points to these file paths
- `index.html` apple-touch-icon already references `pwa-icon-192.png`
- After replacing the files, users who reinstall or update the PWA will see the new colored icon on their home screen

## Note
Existing installed PWAs may cache the old icon. Users may need to remove and re-add the app to their home screen to see the updated icon.
