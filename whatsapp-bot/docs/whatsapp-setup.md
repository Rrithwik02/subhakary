# WhatsApp Setup

## Required credentials

- Meta WhatsApp Cloud API access token
- WhatsApp phone number ID
- Meta App Secret for webhook signature validation
- WhatsApp webhook verify token

## Recommended configuration

- Use a dedicated WhatsApp business number for Subhakary
- Keep `WHATSAPP_WEBHOOK_SECRET` private and only send it from internal bot calls
- Keep `WHATSAPP_ACCESS_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY` server-side only

## Conversation design

The bot should prioritize:

- buttons
- lists
- structured questions
- deterministic provider ranking

Free text should be treated as a fallback, not the primary path.

## Message limits

- Show roughly 5 providers at a time
- Allow a maximum of 3 selected providers
- Keep portfolio previews short and image-light

