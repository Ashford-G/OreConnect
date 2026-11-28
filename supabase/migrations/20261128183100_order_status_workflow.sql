-- OreConnect: secure order status workflow
-- This SQL has already been applied to the connected Supabase project.
-- Keep this file in the repository as migration history; do not re-run it
-- against the same database unless you first verify the functions are absent.

create or replace function private.update_order_status(
  p_order_id uuid,
  p_new_status text,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_order public.orders%rowtype;
  v_is_buyer boolean;
  v_is_supplier boolean;
  v_note text;
  v_allowed boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_new_status not in (
    'awaiting_confirmation','confirmed','in_progress',
    'ready_for_dispatch','dispatched','delivered',
    'completed','cancelled','disputed'
  ) then
    raise exception 'Invalid order status';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  v_is_buyer := private.can_manage_company(v_order.buyer_company_id);
  v_is_supplier := private.can_manage_company(v_order.supplier_company_id);

  if not v_is_buyer and not v_is_supplier then
    raise exception 'Only an authorised buyer or supplier company manager can update this order';
  end if;

  if p_new_status = 'disputed' then
    v_allowed := v_order.status not in ('completed','cancelled','disputed');
  elsif v_is_supplier and not v_is_buyer then
    v_allowed := (
      (v_order.status = 'awaiting_confirmation' and p_new_status = 'confirmed')
      or (v_order.status = 'confirmed' and p_new_status = 'in_progress')
      or (v_order.status = 'in_progress' and p_new_status = 'ready_for_dispatch')
      or (v_order.status = 'ready_for_dispatch' and p_new_status = 'dispatched')
    );
  elsif v_is_buyer and not v_is_supplier then
    v_allowed := (
      (v_order.status in ('awaiting_confirmation','confirmed') and p_new_status = 'cancelled')
      or (v_order.status = 'dispatched' and p_new_status = 'delivered')
      or (v_order.status = 'delivered' and p_new_status = 'completed')
    );
  else
    raise exception 'Choose the buyer or supplier company context before updating this order';
  end if;

  if not v_allowed then
    raise exception 'This status change is not permitted for your company role or the current order status';
  end if;

  v_note := nullif(left(trim(coalesce(p_note, '')), 1000), '');

  update public.orders
  set status = p_new_status,
      updated_at = now()
  where id = p_order_id;

  insert into public.order_events(order_id, actor_id, event_type, note)
  values (
    p_order_id,
    auth.uid(),
    p_new_status,
    coalesce(v_note, 'Order status changed to ' || replace(p_new_status, '_', ' '))
  );

  return p_order_id;
end;
$function$;

revoke all on function private.update_order_status(uuid,text,text) from public;
grant execute on function private.update_order_status(uuid,text,text) to authenticated;

create or replace function public.update_order_status(
  p_order_id uuid,
  p_new_status text,
  p_note text default null
)
returns uuid
language sql
security invoker
set search_path = ''
as $function$
  select private.update_order_status(p_order_id, p_new_status, p_note);
$function$;

revoke all on function public.update_order_status(uuid,text,text) from public;
revoke all on function public.update_order_status(uuid,text,text) from anon;
grant execute on function public.update_order_status(uuid,text,text) to authenticated;
