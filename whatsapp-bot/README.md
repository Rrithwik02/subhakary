# Subhakary WhatsApp Bot V1

Production-ready foundation for the Subhakary customer WhatsApp experience.

## What lives here

- `config/` environment mapping and fallback message text
- `flows/` reusable message builders for each stage of the WhatsApp journey
- `services/` Supabase access, provider matching, request creation, and WhatsApp routing helpers
- `types/` local TypeScript types for webhook payloads and bot records
- `utils/` validation, formatting, and logging helpers
- `docs/` architecture, schema mapping, WhatsApp setup, webhook setup, and deployment notes

## Existing Supabase data reused

- `service_categories` for category menus
- `service_providers` and `public_service_providers` for provider discovery
- `service_provider_availability` for availability-aware ranking
- `profiles` when a WhatsApp customer also has an existing Subhakary account
- `bookings`, `service_requests`, `inquiry_conversations`, and `inquiry_messages` as the existing customer lifecycle model
- `portfolio_images`, `logo_url`, and Storage-backed assets for portfolio previews

## WhatsApp-specific tables added by this V1

- `whatsapp_customers`
- `whatsapp_conversations`
- `whatsapp_messages`
- `whatsapp_requests`
- `whatsapp_request_providers`
- `whatsapp_events`
- `whatsapp_services`
- `whatsapp_service_questions`
- `whatsapp_service_requirements`

These tables stay inside the same Supabase project, so the database remains the single source of truth.

## Build philosophy

- Deterministic first
- Buttons and lists before free text
- Services, questions, and requirements are seeded and edited in Supabase
- Provider selection is capped at 3
- Matching and pagination are server-side
- No secrets in the browser or repository

## Local work

The Deno Edge Functions live under `supabase/functions/` and import the shared logic from this folder.

For the current implementation, the most important files are:

- `config/bot-config.ts`
- `config/messages.ts`
- `services/provider-matching/index.ts`
- `services/request-management/index.ts`
- `supabase/functions/whatsapp-webhook/index.ts`
