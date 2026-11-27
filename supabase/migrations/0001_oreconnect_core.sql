-- OreConnect core schema. Test in a new Supabase project before production.
create extension if not exists pgcrypto;
create type public.company_status as enum ('pending','active','suspended','rejected');
create type public.verification_status as enum ('pending','approved','rejected','expired');
create type public.listing_status as enum ('draft','pending_review','active','paused','rejected','sold','archived');
create table public.profiles(id uuid primary key references auth.users(id) on delete cascade,full_name text not null default '',avatar_path text,preferred_language text not null default 'en',created_at timestamptz default now());
create table public.subscription_plans(id uuid primary key default gen_random_uuid(),name text not null,business_category text not null,monthly_price numeric(18,2) not null default 0 check(monthly_price>=0),currency char(3) not null default 'USD',features jsonb not null default '{}',is_active boolean not null default true);
create table public.companies(id uuid primary key default gen_random_uuid(),legal_name text not null,trading_name text not null,normalized_name text generated always as(lower(regexp_replace(trim(trading_name),'\\s+',' ','g'))) stored,business_category text not null,registration_number text,country_code char(2) not null default 'ZW',city text,province text,address_public text,description text,website text,logo_path text,status public.company_status not null default 'pending',verified_at timestamptz,subscription_plan_id uuid references public.subscription_plans(id),subscription_status text not null default 'pending',created_by uuid not null references auth.users(id),created_at timestamptz default now(),unique(normalized_name,country_code));
-- Private phone/email are separated from public company profile data.
create table public.company_private_contacts(company_id uuid primary key references public.companies(id) on delete cascade,contact_email text,contact_phone text,billing_email text,updated_at timestamptz default now());
-- The person who registers a company automatically becomes its first owner.
create or replace function public.add_company_creator_as_owner() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 insert into public.company_memberships(company_id,user_id,member_role,accepted_at)
 values(new.id,new.created_by,'owner',now());
 return new;
end $$;

create table public.company_memberships(id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,member_role text not null check(member_role in('owner','manager','sales','finance','viewer')),invited_by uuid references auth.users(id),accepted_at timestamptz,unique(company_id,user_id));
create trigger company_creator_owner after insert on public.companies for each row execute function public.add_company_creator_as_owner();\ncreate table public.verification_documents(id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id) on delete cascade,document_type text not null,storage_path text not null,status public.verification_status not null default 'pending',reviewer_id uuid references auth.users(id),review_reason text,expires_at date,reviewed_at timestamptz,created_at timestamptz default now());
create table public.compliance_rules(id uuid primary key default gen_random_uuid(),category text not null,country_code char(2) not null default 'ZW',enabled_for_listing boolean not null default false,required_documents text[] not null default '{}',domestic_only boolean not null default false,admin_note text,effective_from date,effective_to date,updated_at timestamptz default now());
insert into public.compliance_rules(category,enabled_for_listing,required_documents,admin_note) values
('gold',false,'{}','Gold sale listings, buyer matching and gold-sale escrow prohibited. Gold Delivery tracking only.'),
('lithium',false,array['mining licence','applicable permits'],'Disabled pending legal clearance.'),
('diamonds',false,array['mining licence','applicable permits'],'Disabled pending legal clearance.'),
('chrome',false,array['mining licence','applicable permits'],'Admin must enable only after current legal and permit review.'),
('copper',false,array['mining licence','applicable permits'],'Admin must enable only after current legal and permit review.');
create table public.listings(id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id),listing_type text not null check(listing_type in('equipment','supply','ppe','consumable','service','rental','mineral')),category text not null,title text not null,description text,attributes jsonb not null default '{}',price_amount numeric(18,2),price_currency char(3),price_type text not null default 'quote' check(price_type in('fixed','negotiable','quote')),quantity numeric(18,3),quantity_unit text,location_city text,status public.listing_status not null default 'draft',created_at timestamptz default now());
create or replace function public.enforce_listing_compliance() returns trigger language plpgsql as $$
declare r public.compliance_rules%rowtype;
begin
 if new.listing_type='mineral' then
  if lower(new.category)='gold' then raise exception 'Gold sale listings are not supported on OreConnect.'; end if;
  select * into r from public.compliance_rules where lower(category)=lower(new.category) and country_code='ZW' and (effective_from is null or effective_from<=current_date) and (effective_to is null or effective_to>=current_date) order by updated_at desc limit 1;
  if not found or not r.enabled_for_listing then raise exception 'This mineral category is disabled pending compliance approval.'; end if;
 end if; return new;
end $$;
create trigger listing_compliance_guard before insert or update on public.listings for each row execute function public.enforce_listing_compliance();
create table public.purchase_requests(id uuid primary key default gen_random_uuid(),buyer_company_id uuid not null references public.companies(id),category text not null,title text not null,specifications jsonb not null default '{}',quantity numeric(18,3),quantity_unit text,delivery_city text,deadline date,status text not null default 'open',created_at timestamptz default now());
create table public.quotes(id uuid primary key default gen_random_uuid(),request_id uuid references public.purchase_requests(id),listing_id uuid references public.listings(id),seller_company_id uuid not null references public.companies(id),buyer_company_id uuid not null references public.companies(id),amount numeric(18,2) not null,currency char(3) not null default 'USD',message text,status text not null default 'submitted',expires_at timestamptz,created_at timestamptz default now());
create table public.orders(id uuid primary key default gen_random_uuid(),order_number text not null unique default('OC-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),buyer_company_id uuid not null references public.companies(id),seller_company_id uuid not null references public.companies(id),quote_id uuid references public.quotes(id),subtotal numeric(18,2) not null,platform_fee numeric(18,2) not null default 0,total numeric(18,2) not null,currency char(3) not null default 'USD',status text not null default 'draft',created_at timestamptz default now());
create table public.commission_rules(id uuid primary key default gen_random_uuid(),category text not null,percent_rate numeric(7,4) not null default 0 check(percent_rate between 0 and 100),flat_fee numeric(18,2) not null default 0,cap_amount numeric(18,2),currency char(3) not null default 'USD',active_from timestamptz default now(),active_to timestamptz,is_active boolean not null default true);
create table public.commission_entries(id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),commission_rule_id uuid references public.commission_rules(id),gross_amount numeric(18,2) not null,rate_used numeric(7,4) not null,fee_amount numeric(18,2) not null,currency char(3) not null,status text not null default 'pending',created_at timestamptz default now());
create table public.subscriptions(id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id),plan_id uuid not null references public.subscription_plans(id),provider text,provider_subscription_ref text,status text not null default 'pending',current_period_start timestamptz,current_period_end timestamptz,created_at timestamptz default now());
create table public.messages(id uuid primary key default gen_random_uuid(),conversation_key text not null,company_id uuid not null references public.companies(id),sender_user_id uuid not null references auth.users(id),body text not null,created_at timestamptz default now());
create table public.contact_releases(id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id),requesting_company_id uuid not null references public.companies(id),order_id uuid references public.orders(id),release_reason text not null,released_by uuid references auth.users(id),released_at timestamptz,created_at timestamptz default now());
create table public.jobs(id uuid primary key default gen_random_uuid(),company_id uuid not null references public.companies(id),title text not null,description text not null,job_category text,location_city text,employment_type text,salary_min numeric(18,2),salary_max numeric(18,2),currency char(3) default 'USD',required_certifications jsonb not null default '[]',closes_at date,status text not null default 'draft',created_at timestamptz default now());
create table public.gold_deliveries(id uuid primary key default gen_random_uuid(),miner_company_id uuid not null references public.companies(id),delivery_date date not null,recorded_weight numeric(18,3),weight_unit text not null default 'g',fidelity_reference text,payment_status text not null default 'unknown',notes text,created_by uuid not null references auth.users(id),created_at timestamptz default now());
create table public.audit_logs(id uuid primary key default gen_random_uuid(),actor_user_id uuid references auth.users(id),action text not null,entity_type text not null,entity_id uuid,metadata jsonb not null default '{}',created_at timestamptz default now());
create or replace function public.is_company_member(target_company uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.company_memberships m where m.company_id=target_company and m.user_id=auth.uid() and m.accepted_at is not null); $$;
do $$ declare t text; begin
 foreach t in array array['profiles','subscription_plans','companies','company_private_contacts','company_memberships','verification_documents','compliance_rules','listings','purchase_requests','quotes','orders','commission_rules','commission_entries','subscriptions','messages','contact_releases','jobs','gold_deliveries','audit_logs'] loop execute format('alter table public.%I enable row level security',t); end loop;
end $$;
create policy "profile owner select" on public.profiles for select to authenticated using(id=auth.uid());
create policy "profile owner update" on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy "public active plans" on public.subscription_plans for select to anon,authenticated using(is_active);
create policy "public company directory" on public.companies for select to anon,authenticated using(status='active');
create policy "creator inserts company" on public.companies for insert to authenticated with check(created_by=auth.uid());
create policy "members update company" on public.companies for update to authenticated using(public.is_company_member(id)) with check(public.is_company_member(id));
create policy "members read private contacts" on public.company_private_contacts for select to authenticated using(public.is_company_member(company_id));
create policy "company owners manage contacts" on public.company_private_contacts for all to authenticated using(exists(select 1 from public.company_memberships m where m.company_id=company_private_contacts.company_id and m.user_id=auth.uid() and m.member_role='owner' and m.accepted_at is not null)) with check(exists(select 1 from public.company_memberships m where m.company_id=company_private_contacts.company_id and m.user_id=auth.uid() and m.member_role='owner' and m.accepted_at is not null));
create policy "members read memberships" on public.company_memberships for select to authenticated using(public.is_company_member(company_id) or user_id=auth.uid());
create policy "members read own verification" on public.verification_documents for select to authenticated using(public.is_company_member(company_id));
create policy "members submit verification" on public.verification_documents for insert to authenticated with check(public.is_company_member(company_id));
create policy "compliance rules readable" on public.compliance_rules for select to anon,authenticated using(true);
create policy "active listings public" on public.listings for select to anon,authenticated using(status='active');
create policy "company members manage listings" on public.listings for all to authenticated using(public.is_company_member(company_id)) with check(public.is_company_member(company_id));
create policy "open RFQs public" on public.purchase_requests for select to anon,authenticated using(status='open');
create policy "buyer members create RFQ" on public.purchase_requests for insert to authenticated with check(public.is_company_member(buyer_company_id));
create policy "quote parties read" on public.quotes for select to authenticated using(public.is_company_member(seller_company_id) or public.is_company_member(buyer_company_id));
create policy "seller members quote" on public.quotes for insert to authenticated with check(public.is_company_member(seller_company_id));
create policy "order parties read" on public.orders for select to authenticated using(public.is_company_member(buyer_company_id) or public.is_company_member(seller_company_id));
create policy "active commission rules read" on public.commission_rules for select to authenticated using(is_active);
create policy "members read own subscriptions" on public.subscriptions for select to authenticated using(public.is_company_member(company_id));
create policy "members read messages" on public.messages for select to authenticated using(public.is_company_member(company_id));
create policy "members send messages" on public.messages for insert to authenticated with check(public.is_company_member(company_id) and sender_user_id=auth.uid());
create policy "parties read contact release" on public.contact_releases for select to authenticated using(public.is_company_member(company_id) or public.is_company_member(requesting_company_id));
create policy "active jobs public" on public.jobs for select to anon,authenticated using(status='active');
create policy "company members manage jobs" on public.jobs for all to authenticated using(public.is_company_member(company_id)) with check(public.is_company_member(company_id));
create policy "miner members read gold delivery" on public.gold_deliveries for select to authenticated using(public.is_company_member(miner_company_id));
create policy "miner members create gold delivery" on public.gold_deliveries for insert to authenticated with check(public.is_company_member(miner_company_id) and created_by=auth.uid());
create policy "actor reads own audit" on public.audit_logs for select to authenticated using(actor_user_id=auth.uid());
-- Do not grant browser access to admin functions, payment settlement, or contact-release operations.
