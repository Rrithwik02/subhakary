

# Investigation: Provider Application Not Showing for Admin

## Findings

After thorough investigation of the database, triggers, RLS policies, and application code, here are the potential issues:

### Issue 1: Resubmission blocked by trigger (most likely)
The `validate_provider_update` trigger blocks non-admin users from changing the `status` and `reviewed_at` fields. When a user with a **previously rejected** application tries to resubmit, the code attempts to UPDATE these fields (`status: "pending"`, `reviewed_at: null`). The trigger silently rejects this, causing the update to fail with an error.

Even if the user believes this is a "brand new application," there could be an old rejected/approved entry for the same `user_id` in the database. Because `user_id` has a **UNIQUE constraint**, a new INSERT would also fail if an old record exists.

### Issue 2: Unique constraint on user_id
The `service_providers` table has `UNIQUE(user_id)`, meaning each user can only have one provider record. If the user previously had any application (even deleted/rejected), attempting a fresh INSERT will fail.

### Root Cause Summary
The resubmission path tries to change `status` (blocked by trigger) and the fresh insert path fails if any prior record exists (blocked by unique constraint). The error gets caught and shown as a toast, but might be missed.

## Proposed Fix

### 1. Update the `validate_provider_update` trigger
Allow providers to change `status` back to `"pending"` specifically when the current status is `"rejected"` — this enables resubmission without admin intervention.

```sql
-- In validate_provider_update():
-- Allow resubmission: user can set status from 'rejected' to 'pending'
IF OLD.status IS DISTINCT FROM NEW.status THEN
  IF NOT (OLD.status = 'rejected' AND NEW.status = 'pending') THEN
    RAISE EXCEPTION 'Cannot modify status field';
  END IF;
END IF;

-- Similarly allow clearing reviewed_at during resubmission
IF OLD.reviewed_at IS DISTINCT FROM NEW.reviewed_at THEN
  IF NOT (OLD.status = 'rejected' AND NEW.status = 'pending') THEN
    RAISE EXCEPTION 'Cannot modify reviewed_at field';
  END IF;
END IF;
```

### 2. No frontend changes needed
The existing BecomeProvider.tsx code already handles the resubmission flow correctly — it detects existing applications and uses UPDATE. The trigger fix is all that's needed.

### Files changed
- **New migration**: Update `validate_provider_update()` to allow rejected→pending resubmission

