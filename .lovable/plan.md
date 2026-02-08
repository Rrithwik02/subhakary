
# Fix Plan: Chat Error and Mobile UI Consistency

## Issues to Address

### Issue 1: "Cannot send message - Recipient profile not found" Error

**Root Cause**: After recent security hardening, the `profiles` table is now restricted so users can only view their own profile. The `MobileChat.tsx` component (and `ChatWindow.tsx`) tries to directly query the `profiles` table to get the receiver's profile ID when sending a message, which fails due to RLS restrictions.

**Solution**: Replace direct profile queries with the existing `get_booking_participant_profile_ids` RPC function that was created specifically for this purpose.

### Issue 2: Booking Details Page Shows Website UI on Mobile

**Root Cause**: The `BookingDetails.tsx` page doesn't have mobile layout detection or a mobile-specific component. It always renders with `Navbar` and `Footer` regardless of device.

**Solution**: Create a new `MobileBookingDetails.tsx` component with native app styling (using MobileLayout wrapper, mobile-style header with back button, and payment button for pending payments).

### Issue 3: Checkout Page Shows Website UI on Mobile

**Root Cause**: Similar to BookingDetails, the `Checkout.tsx` page lacks mobile layout detection.

**Solution**: Create a `MobileCheckout.tsx` component with native app styling.

---

## Implementation Plan

### Step 1: Fix Chat Profile Lookup Error

**Files to modify:**
- `src/components/mobile/MobileChat.tsx`
- `src/components/ChatWindow.tsx`

**Changes:**
- Replace direct `profiles` table queries with `get_booking_participant_profile_ids` RPC call
- Use the returned profile IDs for sender/receiver identification

### Step 2: Create Mobile Booking Details Component

**Files to create:**
- `src/components/mobile/MobileBookingDetails.tsx`

**Files to modify:**
- `src/pages/BookingDetails.tsx` (add mobile layout detection)

**Features:**
- MobileLayout wrapper with native header
- Back button navigation to My Bookings
- Provider info card with logo, name, category
- Status badge (pending, accepted, completed, etc.)
- Booking details (date, time, location)
- Chat button for accepted bookings
- **Payment button** for bookings with pending payment requests
- Completion verification button when provider confirms completion
- Review button for completed bookings

### Step 3: Create Mobile Checkout Component

**Files to create:**
- `src/components/mobile/MobileCheckout.tsx`

**Files to modify:**
- `src/pages/Checkout.tsx` (add mobile layout detection)

**Features:**
- MobileLayout wrapper with native header
- Provider and booking summary
- Payment amount display
- Secure payment via Razorpay
- Success state with navigation back to bookings

### Step 4: Verify Other Pages (Lower Priority)

Pages that may need mobile versions added in future iterations:
- Compare.tsx
- Blog.tsx / BlogPost.tsx
- About.tsx, Contact.tsx, Services.tsx

These are lower priority as they are primarily informational pages.

---

## Technical Details

### Database Function Used
The `get_booking_participant_profile_ids(p_booking_id)` function returns both `customer_profile_id` and `provider_profile_id` for a given booking, with proper authorization checks.

```text
Flow for sending message:
1. User types message and clicks send
2. Call get_booking_participant_profile_ids(booking_id)
3. Determine sender_id (current user's profile ID) and receiver_id (the other participant)
4. Insert message with correct sender_id and receiver_id
```

### Mobile Components Pattern
All mobile components follow the established pattern:
- Use `MobileLayout` component as wrapper
- Native-style header with back button
- Bottom padding to account for bottom navigation bar
- Pull-to-refresh where appropriate
- Touch-optimized button sizes and spacing

### Payment Button in Mobile Booking Details
The mobile booking details will query for pending payments linked to the booking (matching the pattern in `MobileMyBookings.tsx`) and show a prominent "Pay Now" button that navigates to `/checkout/{paymentId}`.
