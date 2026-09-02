# Webhook Setup

## Meta webhook endpoints

- `GET /functions/v1/whatsapp-webhook` for verification
- `POST /functions/v1/whatsapp-webhook` for incoming events

## Verification flow

The GET handler accepts the standard `hub.challenge` and `hub.verify_token` parameters.

## Security

- Validate `x-hub-signature-256` when `WHATSAPP_APP_SECRET` is configured
- Do not require `x-whatsapp-bot-secret` from Meta; Meta does not send that header
- Deduplicate webhook messages by `whatsapp_message_id`

## Operational notes

- Webhook handling should be idempotent
- Keep the conversation state in Supabase
- Never store Meta credentials in frontend code
