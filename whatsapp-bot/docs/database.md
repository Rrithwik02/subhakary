# Database Mapping

This WhatsApp V1 reuses the existing Subhakary schema and adds only the minimum WhatsApp-specific tables needed for conversation state and request tracking.

## Reused tables

- `service_categories`
- `service_providers`
- `additional_services`
- `service_provider_availability`
- `profiles`
- `bookings`
- `service_requests`
- `inquiry_conversations`
- `inquiry_messages`
- `support_tickets`
- `support_ticket_messages`
- `contact_submissions`
- `public_service_providers`

## WhatsApp-specific tables

- `whatsapp_customers`
- `whatsapp_conversations`
- `whatsapp_messages`
- `whatsapp_requests`
- `whatsapp_request_providers`
- `whatsapp_events`

## Why `whatsapp_requests` exists

The existing `service_requests` table is provider-centric and only carries a single `provider_id`.

WhatsApp V1 needs:

- one customer request
- multiple selected providers
- recommendation mode
- structured answers
- conversation-safe request code generation

`whatsapp_requests` stores that lead object in the same database, while `whatsapp_request_providers` keeps the many-to-many relation to providers.

## Status model

`whatsapp_requests.status` stores the customer journey state using the Subhakary request statuses expected by the spec:

- `NEW`
- `CONTACTED`
- `FOLLOW_UP`
- `CUSTOMER_INTERESTED`
- `PROVIDER_CONTACTED`
- `BOOKED`
- `COMPLETED`
- `CANCELLED`
- `NEEDS_MANUAL_MATCHING`

## Notes

- `whatsapp_customers.normalized_phone` is the identity key
- `whatsapp_conversations.state_payload` holds the current flow state and draft answers
- `whatsapp_messages.whatsapp_message_id` deduplicates webhook retries
- `whatsapp_events` is used for analytics and operational auditing

