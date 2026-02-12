

# Update Logos: Favicon and Website/App Logo

## Overview
Replace the current logos with the two new uploaded images across the entire project.

## Image Assignment
- **Image 1 (Logo.png - colored flame)**: Used as the browser favicon and for Google search appearance
- **Image 2 (Logo-B-W.png - black & white flame)**: Used as the website and app logo everywhere

## Changes Required

### 1. Copy uploaded files into the project
- Copy `user-uploads://Logo.png` to `public/favicon.png` (replacing current favicon)
- Copy `user-uploads://Logo-B-W.png` to `src/assets/logo.png` (replacing the current website logo)

### 2. Update `index.html` favicon references
- Change `<link rel="icon" href="/pwa-icon-192.png">` to `<link rel="icon" href="/favicon.png">`
- Update the JSON-LD `"logo"` field from `"https://subhakary.com/favicon.png"` -- this will now correctly point to the new favicon

No other code changes needed since all 5 files that use the website logo already import from `@/assets/logo.png`:
- `src/components/Navbar.tsx`
- `src/components/Footer.tsx`
- `src/components/mobile/MobileHeader.tsx`
- `src/pages/Auth.tsx`
- `src/pages/BecomeProvider.tsx`

### Technical Notes
- The favicon in `index.html` line 60 currently points to `/pwa-icon-192.png` -- will be updated to `/favicon.png`
- The apple-touch-icon references will remain as `/pwa-icon-192.png` and `/pwa-icon-512.png` since those are PWA-specific icons
- The logo import path `@/assets/logo.png` stays the same; only the file contents change
- Logo sizing in components (e.g., `h-10`, `h-8`) will scale the new image automatically

