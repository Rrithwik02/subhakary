-- Expand the core planning record so it can store multiple event types.
-- Keep the existing table name for compatibility with current app code and data.

alter table public.weddings
  alter column bride_name drop not null,
  alter column groom_name drop not null,
  alter column wedding_type drop not null;

alter table public.weddings
  drop constraint if exists weddings_wedding_type_check;

alter table public.weddings
  add constraint weddings_wedding_type_check
  check (
    wedding_type = any (
      array[
        'traditional'::text,
        'destination'::text,
        'simple'::text,
        'grand'::text,
        'wedding'::text,
        'engagement'::text,
        'housewarming'::text,
        'baby-shower'::text,
        'naming-ceremony'::text,
        'upanayanam'::text,
        'birthday'::text,
        'anniversary'::text,
        'religious-function'::text,
        'corporate-event'::text,
        'other-celebration'::text
      ]
    )
  );

alter table public.wedding_members
  drop constraint if exists wedding_members_role_check;

alter table public.wedding_members
  add constraint wedding_members_role_check
  check (
    role = any (
      array[
        'owner'::text,
        'host'::text,
        'co_host'::text,
        'family'::text,
        'planner'::text,
        'bride'::text,
        'groom'::text,
        'parent'::text,
        'sibling'::text
      ]
    )
  );
