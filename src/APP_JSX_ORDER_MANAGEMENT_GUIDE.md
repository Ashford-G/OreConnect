# OreConnect — Order Management update

## What is already done in the connected Supabase project

The secure RPC functions `private.update_order_status(...)` and `public.update_order_status(...)` have been created. The public RPC is executable by authenticated users only. No tables were added and no existing records were changed.

The function:
- Requires an authenticated user.
- Requires the user to be an active owner/admin/manager of the buyer or supplier company.
- Enforces role-specific status transitions.
- Updates `orders.status` and `orders.updated_at`.
- Writes an `order_events` row for every successful status change.
- Does not process payments or escrow.

**Important:** The SQL migration is included for repository history. It has already been applied to the live Supabase project. Do not run it a second time unless you first check whether these functions exist.

## Status workflow

Supplier:
`awaiting_confirmation → confirmed → in_progress → ready_for_dispatch → dispatched`

Buyer:
- Can cancel while `awaiting_confirmation` or `confirmed`.
- Can mark a dispatched order as delivered.
- Can mark a delivered order completed.

Buyer or supplier:
- Can raise a dispute before the order reaches a terminal state.

Only company owners, admins and managers can make these changes.

## App source changes still required

The GitHub integration returned HTTP 403 (`Resource not accessible by integration`) when I tried to write `src/App.jsx`. Therefore the UI changes have **not** been committed to GitHub and Vercel has not deployed them. The database function is ready; apply the following App.jsx changes in the repository to expose the workflow.

### 1. Add state

Find:
```jsx
const [orders, setOrders] = useState([]);
```

Add directly below:
```jsx
const [orderEvents, setOrderEvents] = useState([]);
```

### 2. Load event history

In `loadWorkspace`, find the existing line:
```jsx
if (!orderResult.error) setOrders(orderResult.data || []);
```

Replace it with:
```jsx
if (!orderResult.error) {
  const nextOrders = orderResult.data || [];
  setOrders(nextOrders);

  if (nextOrders.length) {
    const eventResult = await supabase.from("order_events")
      .select("id,order_id,actor_id,event_type,note,created_at")
      .in("order_id", nextOrders.map((order) => order.id))
      .order("created_at", { ascending: true });

    if (!eventResult.error) setOrderEvents(eventResult.data || []);
  } else {
    setOrderEvents([]);
  }
}
```

In the `if (!companyIds.length)` block, also add:
```jsx
setOrderEvents([]);
```

### 3. Add the update handler

Add this function immediately before `const markNotificationRead = async (id) => {`:
```jsx
const updateOrderStatus = async (orderId, newStatus) => {
  const actionLabel = newStatus.replaceAll("_", " ");
  if (!window.confirm(`Update this order to "${actionLabel}"?`)) return;

  setBusy(true);
  try {
    const { error } = await supabase.rpc("update_order_status", {
      p_order_id: orderId,
      p_new_status: newStatus,
      p_note: null,
    });

    if (error) throw error;

    flash(`Order updated: ${actionLabel}.`);
    await loadWorkspace();
  } catch (error) {
    flash(messageOf(error), "error");
  } finally {
    setBusy(false);
  }
};
```

### 4. Pass the new props to Workspace

In the `<Workspace ... />` call, add:
```jsx
orderEvents={orderEvents}
onUpdateOrder={updateOrderStatus}
```

### 5. Update the Workspace signature and add action rules

Replace the current function signature:
```jsx
function Workspace({ session, profile, companies, activeCompany, quotes, orders, onAddCompany, onAcceptQuote, busy }) {
```

With:
```jsx
function Workspace({ session, profile, companies, activeCompany, quotes, orders, orderEvents, onAddCompany, onAcceptQuote, onUpdateOrder, busy }) {
```

Immediately after `const companyIds = companies.map((c) => c.id);`, add:
```jsx
const orderActions = (order) => {
  const isBuyer = activeCompany?.id === order.buyer_company_id;
  const isSupplier = activeCompany?.id === order.supplier_company_id;
  const actions = [];

  if (isBuyer) {
    if (["awaiting_confirmation", "confirmed"].includes(order.status)) actions.push(["cancelled", "Cancel order"]);
    if (order.status === "dispatched") actions.push(["delivered", "Mark delivered"]);
    if (order.status === "delivered") actions.push(["completed", "Complete order"]);
  }

  if (isSupplier) {
    if (order.status === "awaiting_confirmation") actions.push(["confirmed", "Confirm order"]);
    if (order.status === "confirmed") actions.push(["in_progress", "Start work"]);
    if (order.status === "in_progress") actions.push(["ready_for_dispatch", "Ready for dispatch"]);
    if (order.status === "ready_for_dispatch") actions.push(["dispatched", "Mark dispatched"]);
  }

  if ((isBuyer || isSupplier) && !["completed", "cancelled", "disputed"].includes(order.status)) {
    actions.push(["disputed", "Raise dispute"]);
  }

  return actions;
};
```

### 6. Add the order history and action columns

In the orders table header, add after the `Created` header:
```jsx
<th>Order history</th>
<th>Action</th>
```

In each order row, replace:
```jsx
<td>{niceDate(order.created_at)}</td>
```

With:
```jsx
<td>{niceDate(order.created_at)}</td>
<td>
  <div className="order-event-list">
    {orderEvents.filter((event) => event.order_id === order.id).length === 0 ? (
      <small className="muted">No updates recorded</small>
    ) : orderEvents.filter((event) => event.order_id === order.id).map((event) => (
      <div className="order-event" key={event.id}>
        <strong>{statusLabel(event.event_type)}</strong>
        <small>{event.actor_id === session.user.id ? "You" : "Company team"} · {new Date(event.created_at).toLocaleString()}</small>
        {event.note && <small>{event.note}</small>}
      </div>
    ))}
  </div>
</td>
<td>
  <div className="order-actions">
    {orderActions(order).length === 0 ? (
      <small className="muted">No action available</small>
    ) : orderActions(order).map(([status, label]) => (
      <button
        key={status}
        className="btn btn-small btn-secondary"
        onClick={() => onUpdateOrder(order.id, status)}
        disabled={busy}
      >
        {label}
      </button>
    ))}
  </div>
</td>
```

## After applying the UI changes

1. Commit `src/App.jsx` to the `main` branch.
2. Vercel should start a deployment automatically.
3. Sign in with a buyer account and a separate supplier account.
4. Test a real RFQ and quotation through order creation and each permitted status transition.
5. Confirm the history records appear for both companies.

Do not test by inserting fake orders into the production database.
