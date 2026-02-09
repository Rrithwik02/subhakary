

# Remove AI Chat Bubble from Mobile, Keep on Desktop

## What Changes

### 1. Remove `<AIChatbot />` from `MobileHome.tsx`
The mobile home screen already has the AI-powered search bar (`MobileAISearch`) which provides the same AI functionality inline. The floating chat bubble is redundant on mobile and takes up screen space.

- **File**: `src/components/mobile/MobileHome.tsx`
- Remove the `<AIChatbot />` component and its import (lines 7 and 97)

### 2. No changes to Desktop
The desktop `Index.tsx` already renders `<AIChatbot />` separately, so the floating bubble will continue to appear on desktop as expected.

### 3. No changes to `AIChatbot.tsx` itself
The component can remain as-is since it will simply no longer be rendered on mobile.

## Summary
- 1 file modified: `src/components/mobile/MobileHome.tsx`
- No new files
- No backend changes

