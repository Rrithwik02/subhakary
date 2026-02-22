

# SEO-Friendly Provider URLs + Anonymous Provider Browsing

## Overview
Two issues to fix:
1. Provider profile URLs currently use UUIDs (e.g., `/provider/abc-123-def`). They should use the business name as a slug (e.g., `/provider/sharma-pooja-services`) for better SEO and sharing.
2. Non-logged-in users cannot see providers because the database blocks anonymous access. They should be able to browse and view providers freely, but booking should require login.

---

## Changes

### 1. Add `url_slug` column to `service_providers` table

- Add a new `url_slug` text column (unique, not null with a default derived from the id)
- Create a trigger that auto-generates the slug from `business_name` on INSERT/UPDATE
- Backfill existing providers with slugs generated from their business names
- Add the `url_slug` column to the `public_service_providers` view

### 2. Fix anonymous access to the `public_service_providers` view

The view currently inherits the base table's RLS, which requires authentication. To fix this:
- Drop and recreate the `public_service_providers` view using `SECURITY INVOKER = false` (effectively `SECURITY DEFINER` behavior for views) so it runs with the view owner's permissions
- Alternatively, create an RPC function with `SECURITY DEFINER` that returns public provider data, accessible to the `anon` role
- The preferred approach: grant SELECT on the view to the `anon` role and ensure the view bypasses RLS by making it owned by a privileged role

### 3. Update route configuration

- Add a new route: `/provider/:slug` (keep the UUID route as a fallback for backward compatibility)
- Update `ProviderProfile.tsx` and `MobileProviderProfile.tsx` to detect whether the param is a UUID or slug and query accordingly
- If a UUID URL is accessed, redirect to the slug-based URL for SEO

### 4. Update all provider links across the app

Update every place that generates a `/provider/...` link to use the slug instead of UUID:
- `src/pages/Providers.tsx` (desktop provider cards)
- `src/components/mobile/MobileProviders.tsx` (mobile provider cards)
- `src/pages/Favorites.tsx` and `src/components/mobile/MobileFavorites.tsx`
- `src/pages/Compare.tsx`
- `src/pages/ServiceLocation.tsx`
- `src/components/mobile/MobileBookingDetails.tsx` (review link)
- Share URL generation in `ProviderProfile.tsx` and `MobileProviderProfile.tsx`

### 5. Update provider queries to include slug

- All queries fetching provider lists need to include `url_slug` in the select
- Provider profile queries need to support lookup by slug

---

## Technical Details

### Database Migration SQL (summary)

```text
1. ALTER TABLE service_providers ADD COLUMN url_slug text UNIQUE;
2. CREATE FUNCTION generate_provider_slug(name text, provider_id uuid) 
   -- generates "business-name" from "Business Name", appends short id suffix if duplicate
3. CREATE TRIGGER auto_generate_slug BEFORE INSERT OR UPDATE ON service_providers
4. UPDATE existing providers with generated slugs
5. ALTER TABLE service_providers ALTER COLUMN url_slug SET NOT NULL
6. Recreate public_service_providers view to include url_slug
7. Grant anon access: CREATE OR REPLACE VIEW with SECURITY DEFINER ownership
```

### Route Changes

```text
Current:  /provider/:id  (UUID only)
New:      /provider/:slug (slug-based, with UUID fallback + redirect)
```

### Provider Profile Query Logic

```text
- If param matches UUID format -> query by id, then redirect to slug URL
- If param is a slug -> query by url_slug
- This ensures old shared links still work while new links are SEO-friendly
```

### Anonymous Access Strategy

The `public_service_providers` view will be recreated so anonymous (non-logged-in) users can query it. Booking, favoriting, and chat actions will continue to require authentication -- those checks already exist in the UI code (redirecting to `/auth` when no user).

