# RetailOS Database Schema

## Core Tables

- `businesses`: tenant record and public business profile.
- `users`: authenticated profile mirror linked to `auth.users`.
- `business_memberships`: user-to-business role mapping.
- `customers`: customer CRM records with tags, lifetime value, visit count, and notes support.
- `customer_tags`: normalized tenant-specific tags.
- `customer_tag_assignments`: customer/tag join table.
- `customer_notes`: timestamped customer notes.
- `invoices`: invoice header, numbering, totals, print size, share state, and review link.
- `invoice_items`: invoice line items.
- `campaigns`: campaign metadata and audience rules.
- `campaign_recipients`: generated broadcast list records.
- `settings`: tenant branding, invoice footer, review link, and print defaults.
- `audit_logs`: append-only tenant audit trail.

## RLS Principle

All business tables enable RLS and check access with:

- `is_business_member(business_id)`
- `has_business_role(business_id, roles[])`

Owner policies grant full tenant administration. Staff policies grant customer and invoice operations only.

## Migration

The complete SQL lives in `supabase/migrations/0001_retailos_schema.sql`.
