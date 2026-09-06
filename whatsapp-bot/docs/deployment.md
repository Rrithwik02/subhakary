# WhatsApp Bot Deployment Checklist

This deploys the bot to the project configured in `supabase/config.toml`.

The Meta-provided test phone number is not a customer recipient. Use an actual WhatsApp number that Meta has authorized as a test recipient in WhatsApp > API Setup.

## 1. Supabase

From the repository root:

```powershell
npx supabase login
npx supabase link --project-ref wgpfhqmhmtfjvyghbxbl
npx supabase db push
```

Confirm these tables exist in Supabase Table Editor:

- `whatsapp_services`
- `whatsapp_service_questions`
- `whatsapp_service_requirements`
- `whatsapp_customers`
- `whatsapp_conversations`
- `whatsapp_messages`
- `whatsapp_requests`
- `whatsapp_request_providers`
- `whatsapp_events`

The seed is idempotent. Edit catalog rows in Supabase to change menu labels, question options, ordering, or active state without redeploying code.

## 2. Secrets

Use Supabase Project Settings > API for the service-role key, and the Meta values from the next section:

```powershell
npx supabase secrets set `
  SUPABASE_URL="https://wgpfhqmhmtfjvyghbxbl.supabase.co" `
  SUPABASE_SECRET_KEY="<supabase-secret-key>" `
  WHATSAPP_VERIFY_TOKEN="<long-random-verification-token>" `
  WHATSAPP_ACCESS_TOKEN="<meta-cloud-api-token>" `
  WHATSAPP_PHONE_NUMBER_ID="1315672724957946" `
  WHATSAPP_BUSINESS_ACCOUNT_ID="4077582609205589" `
  WHATSAPP_APP_SECRET="<meta-app-secret>"
```

Never expose `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_ACCESS_TOKEN`, or `WHATSAPP_APP_SECRET` in frontend code.

## 3. Deploy functions

```powershell
npx supabase functions deploy whatsapp-webhook --project-ref wgpfhqmhmtfjvyghbxbl
npx supabase functions deploy provider-search --project-ref wgpfhqmhmtfjvyghbxbl
npx supabase functions deploy provider-details --project-ref wgpfhqmhmtfjvyghbxbl
npx supabase functions deploy create-request --project-ref wgpfhqmhmtfjvyghbxbl
npx supabase functions deploy customer --project-ref wgpfhqmhmtfjvyghbxbl
npx supabase functions deploy my-requests --project-ref wgpfhqmhmtfjvyghbxbl
npx supabase functions deploy send-message --project-ref wgpfhqmhmtfjvyghbxbl
```

JWT verification is disabled only for these routes because Meta cannot provide a Supabase JWT. The webhook validates Meta's HMAC signature.

## 4. Configure Meta

In Meta for Developers:

1. Open the Subhakary app and add or open the WhatsApp product.
2. Open WhatsApp > API Setup and confirm Phone number ID `1315672724957946`; create a permanent system-user token with permission to send WhatsApp messages.
3. Confirm the WhatsApp Business Account ID is `4077582609205589`.
4. Open WhatsApp > Configuration > Edit callback URL.
5. Set the callback URL to `https://wgpfhqmhmtfjvyghbxbl.supabase.co/functions/v1/whatsapp-webhook`.
6. Set the Verify Token to the exact `WHATSAPP_VERIFY_TOKEN` value.
7. Complete verification and subscribe the `messages` webhook field.
8. Add test recipient `+1 555 664 5231` in API Setup, or complete business verification before production messaging.

Meta sends `X-Hub-Signature-256`; the function validates it with `WHATSAPP_APP_SECRET`. Do not require `x-whatsapp-bot-secret` on the Meta callback.

## 5. Smoke test

```powershell
$verifyToken = "<long-random-verification-token>"
$url = "https://wgpfhqmhmtfjvyghbxbl.supabase.co/functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=$verifyToken&hub.challenge=deployment-check"
Invoke-WebRequest -Uri $url -Method Get
```

From a test WhatsApp number, send `Hi` and verify that the bot shows buttons, categories and requirements as lists, provider selection as stable interactive rows, selectable questions as lists, and review actions as `Submit request`, `Change details`, and `Cancel` buttons. A submitted request should appear in `whatsapp_requests` with an `SBK-xxxxx` code.

## 6. Logs and rollback

```powershell
npx supabase functions logs whatsapp-webhook --project-ref wgpfhqmhmtfjvyghbxbl
```

To roll back, redeploy the previous function version. If a token is exposed, rotate it in Meta and update the Supabase secret immediately.
