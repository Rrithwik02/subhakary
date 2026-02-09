
# Enhanced AI Search -- Category-Based Provider Matching

## What Changes

The current search fails because it queries `service_type` which is always empty in the database. All providers are actually categorized by `category_id`. This fix makes the search work correctly by:

1. Matching service keywords (like "poojari", "photographer", "catering") to the correct database category
2. Normalizing location aliases (like "vizag" to "Visakhapatnam")
3. Also searching provider `description` and `subcategory` fields for additional keyword matches
4. Keeping the AI suggestion for logged-in users to provide helpful context

## How Search Will Work

Example: User types **"poojari for ganesh pooja in vizag"**

1. Extract service keyword: "poojari" -- maps to category ID `7feb9e4f-...` (Poojari / Priest)
2. Extract location: "vizag" -- normalized to "Visakhapatnam"
3. Extract extra keywords: "ganesh", "pooja" -- used to search `description` field
4. Query database: filter by `category_id` + `city` matching "Visakhapatnam"
5. Show matching providers sorted by rating

## Files Changed

### 1. `src/components/mobile/MobileAISearch.tsx`
- Add category ID mapping (service keyword to UUID)
- Add location alias map (vizag to Visakhapatnam, etc.)
- Replace `service_type` query with `category_id` filter
- Add `description`/`subcategory` keyword matching
- Extract remaining keywords from query for fuzzy matching

### 2. `src/components/AISearch.tsx` (desktop)
- Same category ID mapping and location alias improvements
- Same database query fix using `category_id` instead of `service_type`

### 3. No backend changes needed
The edge function and database are fine as-is. The problem is purely in how the frontend queries the database.

## Technical Details

### Service Keyword to Category ID Map
```text
poojari/priest/pandit/pujari  -> 7feb9e4f-372c-4430-94b4-7576c3508372
photography/photographer      -> aa827d7d-aaca-45ba-9420-44453f5a7f58
videography/videographer       -> 4e209cfa-ab2a-4f10-b0b5-9533fb63621a
makeup                         -> a68ebe7c-1a7f-4e26-aceb-d1dfff0de5bf
mehandi/mehndi/henna           -> aea07102-32ce-4a40-ae32-116acd5b1dfd
decoration/decorator           -> f3ea05d0-c8a7-40bc-8b61-b3bbdc86d5b4
catering/caterer               -> 564b322b-7d44-422c-a9fd-bdcc11f9dc14
function hall/venue/hall       -> 912180c4-037c-4741-999c-d97744f5811b
event manager/wedding planner  -> 65131497-ef92-4971-94a5-ce747ec42fe2
mangala vadyam/nadaswaram      -> 69eed3d0-bdc4-4822-a3d8-18298ee27beb
```

### Location Alias Map
```text
vizag          -> Visakhapatnam
hyd            -> Hyderabad
blr/bengaluru  -> Bangalore
```

### Updated Query Logic
```text
Old (broken):  .or(`service_type.ilike.%poojari%`)  -- service_type is always NULL
New (correct): .eq('category_id', '7feb9e4f-...')    -- matches the actual category

Plus optional: .or(`description.ilike.%ganesh%,subcategory.ilike.%ganesh%`)
```
