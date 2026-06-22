# RetailOS Architecture Plan

## Product Scope

RetailOS is a multi-tenant customer retention operating system for local retail businesses. The system is built around four pillars: customer database, invoice system, Google review collection, and campaign management.

Phase 1 delivers CRM, customers, invoices, printing, WhatsApp sharing, review links, branding, and PWA support. The database and application boundaries are designed for all phases: campaigns, segmentation, reports, WhatsApp API, automations, loyalty, analytics, and AI insights.

## Technology Stack

- React + Vite + TypeScript for the web client.
- TailwindCSS and shadcn/ui-style primitives for the interface system.
- Supabase Auth, Postgres, Storage, and Row Level Security.
- jsPDF for PDF invoices.
- Browser print CSS for 58mm thermal, 80mm thermal, and A4 output.
- PWA manifest and service worker for installable offline shell support.
- Cloudflare Pages as the target hosting platform.

## Tenancy Model

RetailOS uses true multi-tenancy with a shared database and strict tenant isolation.

- Each tenant is a `business`.
- Every business-owned record includes `business_id`.
- Users are linked to businesses through `business_memberships`.
- Roles are tenant-scoped: `owner` and `staff`.
- Owners have full access to their business data.
- Staff can manage customers and invoices, but not business settings, memberships, campaigns, or audit configuration.
- All business tables have RLS policies that check the authenticated user membership for the target `business_id`.

## Application Layers

- `app`: routing, shell, providers, and authenticated layout.
- `components`: reusable UI primitives and domain components.
- `features`: feature-specific screens, hooks, and operations.
- `lib`: Supabase client, tenant helpers, formatting, PDF, print, and sharing utilities.
- `types`: database and domain model types.
- `supabase`: migrations, seed-free schema, RLS policies, functions, and storage policies.

## Security Model

- Supabase Auth manages identity.
- `public.users` mirrors authenticated users for profile metadata.
- RLS is enabled on every business table.
- Tenant access is checked through stable SQL helper functions.
- Audit logs are append-only from the client perspective.
- Sensitive write operations are restricted by role.
- No placeholder records or mock data are shipped.

## Print And Document Model

Invoices are rendered from persisted invoice, customer, business, and settings data.

- PDF invoices are generated client-side with jsPDF.
- Thermal print output uses dedicated `@media print` CSS for 58mm and 80mm widths.
- A4 print output uses a separate print layout.
- WhatsApp sharing creates a text message containing invoice summary and review link.
- Review QR codes encode the business Google review link.

## PWA Model

- The app is installable through `manifest.webmanifest`.
- A service worker caches the application shell.
- Business data remains Supabase-backed; no fake offline business data is used.
- Offline mode shows the shell and clear empty/error states until network-backed data is available.

## Phase Strategy

Phase 1 builds the tenant foundation and the complete customer/invoice/review/branding workflow. Campaigns and reports are represented in the schema from day one and can be activated without changing tenancy, RLS, or folder boundaries.
