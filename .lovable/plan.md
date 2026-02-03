
# Add "Become a Service Provider" Button to Mobile Home

## Overview
Add a prominent call-to-action button on the mobile home page that appears only for logged-in users who are not yet service providers. This makes it easy for customers to discover the provider registration opportunity while browsing.

## Design Approach

The button will be a visually appealing promotional card placed after the Featured Banner section. It will:
- Only appear for logged-in users who haven't applied to become providers
- Use the existing gradient styling consistent with the app design
- Include an engaging message and clear CTA

### Visual Design (Compact Card Style)

```text
+---------------------------------------+
|  [Briefcase Icon]                     |
|  Want to offer your services?         |
|  Join 500+ verified providers         |
|  [Become a Provider →]                |
+---------------------------------------+
```

## Implementation Details

### File to Modify
**src/components/mobile/MobileHome.tsx**

### Changes

1. **Add required imports**
   - Import `useAuth` hook for login state
   - Import `useQuery` and `supabase` for provider status check
   - Import `Briefcase` icon from lucide-react
   - Import `motion` from framer-motion
   - Import `useNavigate` from react-router-dom

2. **Add provider status check**
   - Query the `service_providers` table to check if user has applied
   - Only show the CTA if user is logged in AND has no provider profile

3. **Create the promotional card component**
   - A gradient card with icon, text, and button
   - Placed between Featured Banner and Service Grid sections
   - Animated entrance for visual polish

### Conditional Logic
```
- If NOT logged in → Don't show the button
- If logged in AND has provider profile (any status) → Don't show
- If logged in AND no provider profile → Show the CTA
```

## Technical Notes

- Follows the existing pattern from `MobileProfile.tsx` for checking provider status
- Uses the same gradient styling as `MobileFeaturedBanner` for consistency
- The button navigates to `/become-provider` route (already exists)
- No database changes required
