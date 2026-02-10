
# Fix: Desktop AI Chatbot 401 Authentication Error

## Problem
The desktop AI chatbot (`AIChatbot.tsx`) sends the static **anon key** as the Bearer token when calling the `ai-chat` edge function. The edge function requires a valid **user JWT token**, so it returns a 401 "Invalid or expired authentication token" error.

This is the same bug that was previously fixed in `AISearch.tsx` and `MobileAISearch.tsx` but was missed in the chatbot component.

## Solution

Update `src/components/AIChatbot.tsx` to:

1. Import `supabase` client and retrieve the user's session token via `supabase.auth.getSession()`
2. Use the actual `access_token` in the Authorization header instead of the anon key
3. If the user is not logged in, show a message asking them to sign in instead of making the API call

## Technical Details

**File: `src/components/AIChatbot.tsx`**

- Add import: `import { supabase } from "@/integrations/supabase/client"`
- In `sendMessage()`, before the fetch call, get the session token:
  ```typescript
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    // Show "please sign in" message
    return;
  }
  ```
- Replace the Authorization header from `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` to `Bearer ${accessToken}`
