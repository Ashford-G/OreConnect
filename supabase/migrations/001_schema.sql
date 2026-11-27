-- OreConnect core schema. Run in Supabase → SQL Editor (or `supabase db push`).
create type app_role as enum ('admin','seller','buyer','transporter','lab','job_seeker');
create type category as enum ('minerals','equipment','supplies','logistics','services','rentals','jobs');
create type currency as enum ('USD','ZiG');
create type order_status as enum ('quoted','offered','accepted','paid','shipped','delivered','completed','cancelled','disputed');

create table profiles (id uuid primary key references auth.users on delete cascade, full_name text, phone text, business_name text, created_at timestamptz default now());
create table user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, role app_role not null, unique(user_id, role));
create table verifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, kind text check (kind in ('identity','business','licence','lab')), document_path text not null, status text default 'pending' check (status in ('pending','approved','rejected')), reviewed_by uuid, created_at timestamptz default now());
create table commission_rules (category category primary key, rate_percent numeric, cap_amount numeric, flat_fee numeric, currency currency default 'USD');
create table listings (id uuid primary key default gen_random_uuid(), seller_id uuid not null references auth.users on delete cascade, category category not null, title text not null, description text, price numeric, currency currency default 'USD', location text, permit_number text, mineral text check (mineral is null or lower(mineral) <> 'gold'), status text default 'draft', created_at timestamptz default now());
create table orders (id uuid primary key default gen_random_uuid(), listing_id uuid references listings, buyer_id uuid not null references auth.users, seller_id uuid not null references auth.users, amount numeric not null, currency currency default 'USD', commission numeric, status order_status default 'quoted', created_at timestamptz default now());
create table order_events (id bigserial primary key, order_id uuid references orders on delete cascade, status order_status, note text, created_at timestamptz default now());
create table messages (id bigserial primary key, order_id uuid references orders on delete cascade, sender_id uuid references auth.users, body text not null, created_at timestamptz default now());
create table payments (id uuid primary key default gen_random_uuid(), order_id uuid references orders, pesepay_reference text, amount numeric, currency currency, commission numeric, status text default 'pending', created_at timestamptz default now());
create table reviews (id uuid primary key default gen_random_uuid(), order_id uuid unique references orders, reviewer_id uuid references auth.users, rating int check (rating between 1 and 5), comment text, created_at timestamptz default now());
create table audit_log (id bigserial primary key, actor_id uuid, action text, target text, created_at timestamptz default now());

insert into commission_rules values ('minerals',2,50000,null),('equipment',4,null,null),('supplies',4,null,null),('logistics',7,null,null),('services',10,null,null),('rentals',7,null,null),('jobs',null,null,10);

create function has_role(_uid uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from user_roles where user_id=_uid and role=_role) $$;
create function only_completed_reviews() returns trigger language plpgsql as $$ begin if not exists(select 1 from orders where id=new.order_id and status='completed' and buyer_id=new.reviewer_id) then raise exception 'Reviews only after a completed deal'; end if; return new; end $$;
create trigger review_check before insert on reviews for each row execute function only_completed_reviews();

-- Grants
grant select on listings, commission_rules to anon;
grant select, insert, update, delete on profiles, verifications, listings, orders, order_events, messages, reviews to authenticated;
grant select on user_roles, payments, commission_rules to authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated;

-- Row-level security: each business sees only its own data
alter table profiles enable row level security; alter table user_roles enable row level security; alter table verifications enable row level security;
alter table commission_rules enable row level security; alter table listings enable row level security; alter table orders enable row level security;
alter table order_events enable row level security; alter table messages enable row level security; alter table payments enable row level security;
alter table reviews enable row level security; alter table audit_log enable row level security;

create policy "own profile" on profiles for all to authenticated using (id=auth.uid() or has_role(auth.uid(),'admin')) with check (id=auth.uid());
create policy "own roles" on user_roles for select to authenticated using (user_id=auth.uid() or has_role(auth.uid(),'admin'));
create policy "own docs" on verifications for select to authenticated using (user_id=auth.uid() or has_role(auth.uid(),'admin'));
create policy "upload docs" on verifications for insert to authenticated with check (user_id=auth.uid() and status='pending');
create policy "admin review" on verifications for update to authenticated using (has_role(auth.uid(),'admin'));
create policy "read rules" on commission_rules for select using (true);
create policy "public listings" on listings for select using (status='published' or seller_id=auth.uid());
create policy "seller writes" on listings for insert to authenticated with check (seller_id=auth.uid());
create policy "seller edits" on listings for update to authenticated using (seller_id=auth.uid());
create policy "parties see orders" on orders for select to authenticated using (auth.uid() in (buyer_id,seller_id) or has_role(auth.uid(),'admin'));
create policy "buyer creates" on orders for insert to authenticated with check (buyer_id=auth.uid());
create policy "parties update" on orders for update to authenticated using (auth.uid() in (buyer_id,seller_id));
create policy "parties events" on order_events for all to authenticated using (exists(select 1 from orders o where o.id=order_id and auth.uid() in (o.buyer_id,o.seller_id)));
create policy "parties chat" on messages for all to authenticated using (exists(select 1 from orders o where o.id=order_id and auth.uid() in (o.buyer_id,o.seller_id))) with check (sender_id=auth.uid());
create policy "parties payments" on payments for select to authenticated using (exists(select 1 from orders o where o.id=order_id and auth.uid() in (o.buyer_id,o.seller_id)));
create policy "read reviews" on reviews for select using (true);
create policy "write review" on reviews for insert to authenticated with check (reviewer_id=auth.uid());
create policy "admin audit" on audit_log for select to authenticated using (has_role(auth.uid(),'admin'));

-- Private document storage
insert into storage.buckets (id, name, public) values ('documents','documents',false);
create policy "own folder upload" on storage.objects for insert to authenticated with check (bucket_id='documents' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "own folder read" on storage.objects for select to authenticated using (bucket_id='documents' and ((storage.foldername(name))[1]=auth.uid()::text or has_role(auth.uid(),'admin')));
