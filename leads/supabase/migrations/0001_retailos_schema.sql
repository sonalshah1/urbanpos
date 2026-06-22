create extension if not exists "pgcrypto";

create type public.user_role as enum ('owner', 'staff');
create type public.customer_status as enum ('new', 'regular', 'vip', 'inactive');
create type public.invoice_status as enum ('draft', 'issued', 'cancelled');
create type public.print_size as enum ('thermal-58', 'thermal-80', 'a4');
create type public.campaign_audience as enum ('all', 'vip', 'repeat', 'inactive', 'custom');
create type public.campaign_status as enum ('draft', 'ready', 'sent', 'archived');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  address text,
  phone text,
  logo_url text,
  brand_color text not null default '#0f766e',
  review_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  invoice_footer text,
  default_print_size public.print_size not null default 'a4',
  whatsapp_template text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  status public.customer_status not null default 'new',
  lifetime_value numeric(12,2) not null default 0,
  visit_count integer not null default 0,
  last_purchase_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, phone)
);

create table public.customer_tags (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  color text not null default '#0f766e',
  created_at timestamptz not null default now()
);

create table public.customer_tag_assignments (
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  tag_id uuid not null references public.customer_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, tag_id)
);

create table public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  body text not null,
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  invoice_number text not null,
  status public.invoice_status not null default 'issued',
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null check (total >= 0),
  print_size public.print_size not null default 'a4',
  review_link text,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, invoice_number)
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  audience public.campaign_audience not null,
  message text not null,
  status public.campaign_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  phone text not null,
  generated_at timestamptz not null default now(),
  unique (campaign_id, customer_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  actor_id uuid references public.users(id) on delete set null default auth.uid(),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index customers_business_search_idx on public.customers (business_id, status, name);
create unique index customer_tags_business_lower_name_idx on public.customer_tags (business_id, lower(name));
create index invoices_business_issued_idx on public.invoices (business_id, issued_at desc);
create index invoice_items_invoice_idx on public.invoice_items (invoice_id);
create index notes_customer_idx on public.customer_notes (customer_id, created_at desc);
create index campaigns_business_idx on public.campaigns (business_id, created_at desc);
create index audit_logs_business_idx on public.audit_logs (business_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_touch_updated_at before update on public.users for each row execute function public.touch_updated_at();
create trigger businesses_touch_updated_at before update on public.businesses for each row execute function public.touch_updated_at();
create trigger settings_touch_updated_at before update on public.settings for each row execute function public.touch_updated_at();
create trigger customers_touch_updated_at before update on public.customers for each row execute function public.touch_updated_at();
create trigger invoices_touch_updated_at before update on public.invoices for each row execute function public.touch_updated_at();
create trigger campaigns_touch_updated_at before update on public.campaigns for each row execute function public.touch_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, coalesce(new.email, ''), new.raw_user_meta_data->>'full_name')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.business_memberships
    where business_id = target_business_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.has_business_role(target_business_id uuid, allowed_roles public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.business_memberships
    where business_id = target_business_id
      and user_id = auth.uid()
      and role = any(allowed_roles)
  );
$$;

create or replace function public.create_business_workspace(
  business_name text,
  business_address text default null,
  business_phone text default null,
  business_review_link text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_business_id uuid;
  current_user_id uuid := auth.uid();
  current_email text;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select email into current_email from auth.users where id = current_user_id;

  insert into public.users (id, email)
  values (current_user_id, coalesce(current_email, ''))
  on conflict (id) do update set email = excluded.email;

  insert into public.businesses (name, address, phone, review_link)
  values (business_name, business_address, business_phone, business_review_link)
  returning id into new_business_id;

  insert into public.business_memberships (business_id, user_id, role)
  values (new_business_id, current_user_id, 'owner');

  insert into public.settings (business_id)
  values (new_business_id);

  return new_business_id;
end;
$$;

revoke all on function public.create_business_workspace(text, text, text, text) from public;
grant execute on function public.create_business_workspace(text, text, text, text) to authenticated;

alter table public.users enable row level security;
alter table public.businesses enable row level security;
alter table public.business_memberships enable row level security;
alter table public.settings enable row level security;
alter table public.customers enable row level security;
alter table public.customer_tags enable row level security;
alter table public.customer_tag_assignments enable row level security;
alter table public.customer_notes enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_recipients enable row level security;
alter table public.audit_logs enable row level security;

create policy "users read self" on public.users for select using (id = auth.uid());
create policy "users update self" on public.users for update using (id = auth.uid()) with check (id = auth.uid());

create policy "business select members" on public.businesses for select using (public.is_business_member(id));
create policy "business update owners" on public.businesses for update using (public.has_business_role(id, array['owner']::public.user_role[])) with check (public.has_business_role(id, array['owner']::public.user_role[]));

create policy "memberships select members" on public.business_memberships for select using (public.is_business_member(business_id));
create policy "memberships manage owners" on public.business_memberships
for all using (public.has_business_role(business_id, array['owner']::public.user_role[]))
with check (public.has_business_role(business_id, array['owner']::public.user_role[]));

create policy "settings select members" on public.settings for select using (public.is_business_member(business_id));
create policy "settings insert owners" on public.settings for insert with check (public.has_business_role(business_id, array['owner']::public.user_role[]));
create policy "settings update owners" on public.settings for update using (public.has_business_role(business_id, array['owner']::public.user_role[])) with check (public.has_business_role(business_id, array['owner']::public.user_role[]));

create policy "customers select staff owners" on public.customers for select using (public.is_business_member(business_id));
create policy "customers insert staff owners" on public.customers for insert with check (public.has_business_role(business_id, array['owner','staff']::public.user_role[]));
create policy "customers update staff owners" on public.customers for update using (public.has_business_role(business_id, array['owner','staff']::public.user_role[])) with check (public.has_business_role(business_id, array['owner','staff']::public.user_role[]));

create policy "tags select members" on public.customer_tags for select using (public.is_business_member(business_id));
create policy "tags write staff owners" on public.customer_tags for all using (public.has_business_role(business_id, array['owner','staff']::public.user_role[])) with check (public.has_business_role(business_id, array['owner','staff']::public.user_role[]));

create policy "tag assignments select members" on public.customer_tag_assignments for select using (public.is_business_member(business_id));
create policy "tag assignments write staff owners" on public.customer_tag_assignments for all using (public.has_business_role(business_id, array['owner','staff']::public.user_role[])) with check (public.has_business_role(business_id, array['owner','staff']::public.user_role[]));

create policy "notes select members" on public.customer_notes for select using (public.is_business_member(business_id));
create policy "notes insert staff owners" on public.customer_notes for insert with check (public.has_business_role(business_id, array['owner','staff']::public.user_role[]));
create policy "notes update owners" on public.customer_notes for update using (public.has_business_role(business_id, array['owner']::public.user_role[])) with check (public.has_business_role(business_id, array['owner']::public.user_role[]));

create policy "invoices select members" on public.invoices for select using (public.is_business_member(business_id));
create policy "invoices insert staff owners" on public.invoices for insert with check (public.has_business_role(business_id, array['owner','staff']::public.user_role[]));
create policy "invoices update staff owners" on public.invoices for update using (public.has_business_role(business_id, array['owner','staff']::public.user_role[])) with check (public.has_business_role(business_id, array['owner','staff']::public.user_role[]));

create policy "invoice items select members" on public.invoice_items for select using (public.is_business_member(business_id));
create policy "invoice items write staff owners" on public.invoice_items for all using (public.has_business_role(business_id, array['owner','staff']::public.user_role[])) with check (public.has_business_role(business_id, array['owner','staff']::public.user_role[]));

create policy "campaigns select members" on public.campaigns for select using (public.is_business_member(business_id));
create policy "campaigns write owners" on public.campaigns for all using (public.has_business_role(business_id, array['owner']::public.user_role[])) with check (public.has_business_role(business_id, array['owner']::public.user_role[]));

create policy "campaign recipients select members" on public.campaign_recipients for select using (public.is_business_member(business_id));
create policy "campaign recipients write owners" on public.campaign_recipients for all using (public.has_business_role(business_id, array['owner']::public.user_role[])) with check (public.has_business_role(business_id, array['owner']::public.user_role[]));

create policy "audit select owners" on public.audit_logs for select using (public.has_business_role(business_id, array['owner']::public.user_role[]));
create policy "audit insert members" on public.audit_logs for insert with check (public.is_business_member(business_id));
