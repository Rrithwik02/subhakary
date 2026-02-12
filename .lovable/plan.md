

# Use Different Logos for Navbar and Footer

## Overview
Use the brown logo (Logo-Brown.png) in the top navigation bar and the white logo (Logo-_white.png) in the bottom footer. Other pages (Auth, BecomeProvider, MobileHeader) will continue using the current colored logo.

## Changes Required

### 1. Add new logo assets
- Copy `user-uploads://Logo-Brown.png` to `src/assets/logo-brown.png`
- Copy `user-uploads://Logo-_white.png` to `src/assets/logo-white.png`

### 2. Update Navbar.tsx
- Change the import from `import logo from "@/assets/logo.png"` to `import logo from "@/assets/logo-brown.png"`
- No other changes needed -- existing `h-10 w-auto` class handles scaling

### 3. Update Footer.tsx
- Change the import from `import logo from "@/assets/logo.png"` to `import logo from "@/assets/logo-white.png"`
- No other changes needed -- existing `h-14 w-auto` class handles scaling, and the white logo will look great on the dark footer background

### 4. No changes to other files
- `MobileHeader.tsx`, `Auth.tsx`, and `BecomeProvider.tsx` will continue using the current `@/assets/logo.png` (colored version)

