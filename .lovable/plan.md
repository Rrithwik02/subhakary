

# Separate Website and App Layouts

## Problem
The `useMobileLayout` hook currently returns `true` for three scenarios:
1. Capacitor native apps
2. Installed PWAs (standalone mode)
3. **Mobile browser windows** (width below 1024px)

This means visiting the website on a phone shows the app-style UI (bottom nav, mobile header, etc.) instead of the regular website layout (Navbar, Footer, etc.).

## Solution
Modify `useMobileLayout` so it only returns `true` for native apps and installed PWAs -- not for mobile browsers. The website will then always render the desktop/responsive layout regardless of screen size.

## Changes Required

### 1. Update `src/hooks/useMobileLayout.tsx`
- Remove the screen-width check from the final return
- Change from: `return isNativeApp || isPWA || isMobile`
- Change to: `return isNativeApp || isPWA`
- The `isMobile` state and resize listener can remain for use by other hooks if needed, but won't drive layout switching

### 2. Verify desktop components are responsive
The existing desktop layout (Navbar, HeroSection, Footer, etc.) already uses Tailwind responsive classes, so they should work on smaller screens. However, some components may have `lg:hidden` or `hidden lg:block` classes that were added assuming mobile browser users would never see them. A quick audit of key pages will be done during implementation to ensure nothing breaks.

## What This Means
- **Website in any browser** (desktop, tablet, phone): Shows the standard website with Navbar, Footer, and AIChatbot -- the same layout on all screen sizes
- **Capacitor native app**: Continues showing MobileLayout with bottom nav, mobile header, etc.
- **Installed PWA**: Continues showing MobileLayout with bottom nav, mobile header, etc.

## Technical Details

Only one file needs to change:

**`src/hooks/useMobileLayout.tsx`** -- Update the return statement to: `return isNativeApp || isPWA`

All 16 page files that consume `useMobileLayout()` will automatically get the correct behavior without any changes, since the hook itself drives the decision.
