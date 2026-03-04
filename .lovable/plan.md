

# Add Forgot Password Flow

## What to build

1. **"Forgot Password?" link on login page** (`src/pages/Auth.tsx`)
   - Add a text link below the password field (only visible in sign-in mode)
   - Clicking it shows an inline "enter your email" form or navigates to a simple forgot-password view
   - Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
   - Shows a toast confirming the reset email was sent

2. **New `/reset-password` page** (`src/pages/ResetPassword.tsx`)
   - Public route (no auth required)
   - On mount, checks for `type=recovery` in the URL hash (Supabase appends this)
   - Shows a "Set New Password" form with password + confirm password fields
   - Calls `supabase.auth.updateUser({ password })` to save the new password
   - On success, redirects to `/auth` with a success toast

3. **Route registration** (`src/App.tsx`)
   - Add `<Route path="/reset-password" element={<ResetPassword />} />`

## Files changed
- `src/pages/Auth.tsx` -- add forgot password link + inline reset email logic
- `src/pages/ResetPassword.tsx` -- new file for setting new password
- `src/App.tsx` -- add route

