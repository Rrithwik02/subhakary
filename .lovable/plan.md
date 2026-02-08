

# Payment System Fixes and Enhancements

## Problem Summary

You're seeing an RLS (Row-Level Security) error when requesting payment from a customer because the database lacks permission policies for providers to create payment records. Additionally, mobile customers can't see the "Pay Now" button, and there's no payment history view.

## Implementation Plan

### 1. Fix RLS Error - Database Migration

**Issue**: The `payments` table only has SELECT policies. Providers cannot INSERT new payment requests.

**Solution**: Add RLS policies for:
- Providers can INSERT payment records for their bookings
- Providers can UPDATE their payment requests (for editing)
- Providers can DELETE their pending payment requests (for canceling)
- Users can UPDATE payments (for status changes during checkout)

### 2. Add Payment History Section

**For Providers (Desktop & Mobile):**
- Add a "Payments" tab in the provider dashboard
- Show all payments for their bookings with status (pending, completed, failed)
- Include amount, customer name, date, and payment type

**For Customers (Desktop & Mobile):**
- Show payment history in booking details
- Add a summary on the My Bookings page showing payment status per booking

### 3. Add Mobile "Pay Now" Button

**File**: `src/components/mobile/MobileMyBookings.tsx`

**Changes**:
- Fetch pending payments in the query (same as desktop version)
- Add "Pay Now" button that navigates to `/checkout/:paymentId`
- Include CreditCard icon and animated styling

### 4. Allow Providers to Edit/Cancel Payment Requests

**Provider Dashboard Updates**:
- When payment is already requested but not paid, show "Edit" and "Cancel" buttons instead of "Payment Requested" badge
- Add edit dialog to modify amount and description
- Add cancel confirmation dialog
- Update existing payment record or delete it

## Technical Details

### Database Migration SQL

```sql
-- Allow providers to INSERT payment requests for their bookings
CREATE POLICY "Providers can create payments for their bookings"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN service_providers sp ON b.provider_id = sp.id
    WHERE b.id = payments.booking_id 
    AND sp.user_id = auth.uid()
  )
);

-- Allow providers to UPDATE their pending payment requests
CREATE POLICY "Providers can update their pending payments"
ON public.payments FOR UPDATE
TO authenticated
USING (
  status = 'pending' AND
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN service_providers sp ON b.provider_id = sp.id
    WHERE b.id = payments.booking_id 
    AND sp.user_id = auth.uid()
  )
);

-- Allow providers to DELETE pending payment requests
CREATE POLICY "Providers can delete pending payments"
ON public.payments FOR DELETE
TO authenticated
USING (
  status = 'pending' AND
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN service_providers sp ON b.provider_id = sp.id
    WHERE b.id = payments.booking_id 
    AND sp.user_id = auth.uid()
  )
);
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/mobile/MobileMyBookings.tsx` | Add pending payment query, Pay Now button |
| `src/pages/ProviderDashboard.tsx` | Add payment history tab, edit/cancel dialogs |
| `src/components/mobile/MobileProviderDashboard.tsx` | Add payment history tab, edit/cancel UI |
| `src/pages/MyBookings.tsx` | Minor cleanup (already has Pay Now) |

### UI Flow After Implementation

**Provider requesting payment:**
1. Provider clicks "Request Payment" on an active booking
2. Enters amount and description in dialog
3. Payment record created in database (now allowed by RLS)
4. Customer sees "Pay Now" button on both desktop and mobile

**Provider editing/canceling:**
1. If payment already requested and still pending, show "Edit" and "Cancel" buttons
2. Edit opens dialog to modify amount/description
3. Cancel shows confirmation, then deletes the payment request

**Payment History:**
- New tab in provider dashboard showing all payments
- Customers see payment status within booking details

## Summary of Deliverables

1. Database migration to fix RLS policies (critical fix)
2. Mobile Pay Now button for customers
3. Payment history section for both providers and customers
4. Edit/Cancel payment request functionality for providers

