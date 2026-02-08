
# Payment Page Fixes Plan

## Issues Identified

### 1. Branding Issue: "Saathi" should be "Subhakary"
**Location**: `src/pages/Checkout.tsx`, line 143
**Current**: `name: "Saathi"` is displayed in the Razorpay payment modal
**Fix**: Change to `name: "Subhakary"`

### 2. Payment Button Not Persisting After Customer Navigates Away
**Root Cause**: The query correctly fetches pending payments, but the mobile `MobileMyBookings.tsx` lacks a realtime subscription to refresh when payments are added/modified by providers.

**Technical Details**:
- Desktop `MyBookings.tsx` has a realtime subscription on the `bookings` table (lines 156-179), which triggers `refetch()` when bookings change
- However, neither desktop nor mobile subscribes to changes on the `payments` table
- When a provider edits the payment amount or the customer navigates away without paying, the UI doesn't refresh to show the current payment state

**Fix**: 
- Add realtime subscription to the `payments` table in both `MyBookings.tsx` and `MobileMyBookings.tsx`
- This ensures the "Pay Now" button reflects the latest payment data

### 3. Updated Amount Not Reflected on Customer's Payment Page
**Root Cause**: When a provider edits a payment using `EditPaymentDialog.tsx`, the amount is updated in the database. However, the `Checkout.tsx` page uses React Query with a fixed query key based on `paymentId`.

**Current Behavior**: 
- The checkout page fetches payment details once
- If the provider updates the amount while the customer is viewing, it won't auto-refresh
- If customer navigates back to My Bookings and returns to Checkout, they see the updated amount (query cache invalidated)

**Fix**:
- Add realtime subscription in `Checkout.tsx` to listen for payment updates
- When the payment record changes, refetch the payment data to display the updated amount

## Implementation Changes

| File | Change |
|------|--------|
| `src/pages/Checkout.tsx` | 1. Change "Saathi" to "Subhakary" (line 143) <br> 2. Add realtime subscription to refetch on payment updates |
| `src/pages/MyBookings.tsx` | Add realtime subscription for `payments` table to refresh when provider creates/edits payment requests |
| `src/components/mobile/MobileMyBookings.tsx` | Add realtime subscription for `payments` table (currently has no subscriptions at all) |

## Technical Implementation

### Checkout.tsx - Realtime Payment Updates
```typescript
// Subscribe to payment updates
useEffect(() => {
  if (!paymentId) return;

  const channel = supabase
    .channel(`checkout-payment-${paymentId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "payments",
        filter: `id=eq.${paymentId}`,
      },
      () => {
        // Refetch payment to get updated amount
        refetch();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [paymentId, refetch]);
```

### MyBookings.tsx - Add Payments Subscription
```typescript
// Add to existing useEffect or create new one
const paymentsChannel = supabase
  .channel("my-bookings-payments")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "payments",
    },
    () => {
      refetch();
    }
  )
  .subscribe();
```

### MobileMyBookings.tsx - Add Realtime Subscriptions
```typescript
// Add new useEffect for realtime
useEffect(() => {
  if (!user) return;

  const bookingsChannel = supabase
    .channel("mobile-my-bookings")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "bookings",
        filter: `user_id=eq.${user.id}`,
      },
      () => {
        refetch();
      }
    )
    .subscribe();

  const paymentsChannel = supabase
    .channel("mobile-my-bookings-payments")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "payments",
      },
      () => {
        refetch();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(bookingsChannel);
    supabase.removeChannel(paymentsChannel);
  };
}, [user, refetch]);
```

## Summary
1. Brand name fix: "Saathi" to "Subhakary" in Razorpay modal
2. Mobile My Bookings: Add realtime subscriptions for bookings and payments tables
3. Desktop My Bookings: Add realtime subscription for payments table
4. Checkout page: Add realtime subscription to reflect provider's amount changes instantly
