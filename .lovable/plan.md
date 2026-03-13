

# Fix White Screen Issue in Mobile App

## Problem
Multiple pages crash with a white screen on the Subhakary mobile app because they violate **React's Rules of Hooks**. React requires that hooks (useState, useEffect, useQuery, etc.) are called in the exact same order on every render. Currently, 10 pages have an early `return` for mobile before their hooks, which means when `isMobile` changes from `true` to `false` (or vice versa), React sees a different number of hooks and crashes.

## Solution
Apply the same pattern already used in `Checkout.tsx` and `BookingDetails.tsx`: extract the desktop code into a separate `Desktop___` component, so the main component only has the `useMobileLayout()` hook and a simple conditional return. This way hooks are never called conditionally.

## Pages to Fix (10 files)

Each file will be restructured from:
```text
const PageName = () => {
  const isMobile = useMobileLayout();
  // maybe some hooks here...
  if (isMobile) return <MobileVersion />;
  // more hooks here (VIOLATION!)
  return <DesktopJSX />;
};
```

To:
```text
const PageName = () => {
  const isMobile = useMobileLayout();
  if (isMobile) return <MobileVersion />;
  return <DesktopPageName />;
};

const DesktopPageName = () => {
  // ALL hooks and desktop logic here
  return <DesktopJSX />;
};
```

### Files affected:
1. `src/pages/Providers.tsx` -- extract `DesktopProviders`
2. `src/pages/Favorites.tsx` -- extract `DesktopFavorites`
3. `src/pages/Chat.tsx` -- extract `DesktopChat`
4. `src/pages/MyBookings.tsx` -- extract `DesktopMyBookings`
5. `src/pages/ProviderProfile.tsx` -- extract `DesktopProviderProfile`
6. `src/pages/ProviderDashboard.tsx` -- extract `DesktopProviderDashboard`
7. `src/pages/Profile.tsx` -- extract `DesktopProfile`
8. `src/pages/ProviderSettings.tsx` -- extract `DesktopProviderSettings`
9. `src/pages/AdminDashboard.tsx` -- extract `DesktopAdminDashboard`
10. `src/pages/Notifications.tsx` -- extract `DesktopNotifications`

## What stays the same
- No visual changes at all
- No database changes
- Mobile components remain untouched
- Two pages already using this pattern (`Checkout.tsx`, `BookingDetails.tsx`) need no changes
- `PaymentHistory.tsx` already has hooks before the early return, so it is fine

## Technical Details

For each file, the refactor involves:
- Wrapping everything after the `if (isMobile)` check into a new `Desktop___` component within the same file
- Moving all `useState`, `useEffect`, `useQuery`, `useNavigate`, `useAuth`, `useToast`, etc. calls into the new desktop component
- The parent component keeps only `useMobileLayout()` and the conditional return
- The `export default` stays on the original component name so routes are unaffected

