# Architecture

The WhatsApp bot is implemented as a thin server-side layer on top of the existing Subhakary Supabase project.

## Goals

- Reuse the current service catalog, provider profiles, availability, and portfolio assets
- Keep WhatsApp conversation state inside the same Supabase database
- Avoid a second customer database or duplicated provider records
- Keep secrets on the server side only

## Components

- Meta WhatsApp Cloud API receives and delivers messages
- `supabase/functions/whatsapp-webhook` receives webhook callbacks and routes the conversation
- Shared logic in `whatsapp-bot/` handles config, matching, formatting, and request creation
- Existing Supabase tables provide the source of truth for services, providers, and customer requests

## State model

Each customer gets a WhatsApp customer row, a conversation row, and one or more request rows.

- `whatsapp_customers` maps a phone number to a WhatsApp identity
- `whatsapp_conversations` stores the active flow state and draft answers
- `whatsapp_messages` stores inbound and outbound message history
- `whatsapp_requests` stores the lead/request summary
- `whatsapp_request_providers` stores the selected provider relationship

## Flow model

1. Welcome
2. Main menu
3. Choose service category
4. Multi-select requirements
5. Answer service-specific questions
6. Enter or confirm name
7. See ranked providers
8. View more or request a recommendation
9. Review the request
10. Submit and receive request ID

## Matching model

Provider ranking is intentionally deterministic:

- service/category match
- location match
- availability match
- verification and rating
- premium ranking when present

The score is configurable and can evolve without changing the customer journey.

