# Kitchen Operations Domain Design

This document defines the first persistence boundary for the internal commercial-kitchen
admin panel. It intentionally describes the domain before database models are introduced.

## Company delivery address selection

Employees may choose their own delivery address only from the active delivery
addresses configured for their company. Employees cannot provide arbitrary
addresses at order time. Orders store a delivery-address snapshot so later
company address edits do not rewrite historical orders.

## Entity list

### User

An authenticated staff account for the admin panel.

Important fields:

- `id`
- `email` (unique)
- `name`
- `role`: `Admin`, `Kitchen`, `Dispatch`, or `Driver`
- `isActive`
- audit timestamps

Ownership and relationships:

- A `User` owns staff access and authorization only.
- A `User` does not represent a customer, employee, or company.
- A `User` may be associated with operational actions later, but action/audit records are
  intentionally outside this first model.

### Company

An organization whose employees place or receive kitchen orders.

Important fields:

- `id`
- `name`
- optional external/business identifier
- `isActive`
- audit timestamps

Ownership and relationships:

- A `Company` owns its `Employee` records.
- A `Company` has many `Employee` records.
- A `Company` has many `Order` records through its employees.

### Employee

A customer contact who belongs to a company and is the customer represented on an order.

Important fields:

- `id`
- `companyId`
- name
- email and/or other contact details needed for delivery
- `isActive`
- audit timestamps

Ownership and relationships:

- Every `Employee` belongs to exactly one `Company`.
- One `Company` has many `Employee` records.
- One `Employee` has many `Order` records.
- An `Employee` cannot be reassigned to another company without an explicit migration
  policy; for the first version, company ownership is treated as stable.

### Dish

A catalogue item that can be selected for an order.

Important fields:

- `id`
- current name and description
- current exact-decimal unit price
- dietary/allergen metadata as required by catalogue operations
- `isActive` (deactivation replaces hard deletion)
- audit timestamps

Ownership and relationships:

- A `Dish` is a live catalogue reference.
- A `Dish` may appear on many `OrderLine` records.
- A dish that has appeared on an order must remain addressable for historical reporting,
  even after it is deactivated.

### Option

An optional catalogue choice that modifies a dish or order line, such as a size,
ingredient choice, or preparation preference.

Important fields:

- `id`
- current name
- current exact-decimal price adjustment, which may be zero
- `isActive`
- audit timestamps

Ownership and relationships:

- An `Option` is a live catalogue reference.
- A `Dish` may have many `Option` records, and an `Option` may be available for many
  `Dish` records: this is many-to-many and requires an explicit join representation when
  Prisma models are later written.
- An `Option` may be selected on many `OrderLine` records.
- Options are deactivated rather than hard deleted once used historically.

### Order

A submitted or operationally managed request for food for one employee.

Important fields:

- `id`
- `employeeId`
- `companyId`
- order status
- requested service/delivery date and operational delivery details
- totals represented with exact decimal values
- immutable order placement timestamp
- audit timestamps

Ownership and relationships:

- Every `Order` belongs to exactly one `Employee` and exactly one `Company`.
- The `companyId` is retained directly as an order ownership snapshot/reference so the
  order remains attributable to the company even if application lookup rules evolve.
- One `Employee` has many `Order` records.
- One `Company` has many `Order` records.
- One `Order` has many `OrderLine` records.

### OrderLine

One purchased dish entry within an order, including the selections and prices that were
effective when the order was placed.

Important fields:

- `id`
- `orderId`
- live `dishId` reference where the catalogue record still exists
- dish name snapshot
- quantity
- unit price snapshot
- line total snapshot or a deterministically reproducible exact-decimal amount
- selected option data, including option identifiers where available, option name snapshots,
  and price-adjustment snapshots
- line-level notes required to fulfill the order

Ownership and relationships:

- An `OrderLine` is owned by exactly one `Order`.
- One `Order` has many `OrderLine` records.
- An `OrderLine` references one `Dish` for catalogue traceability.
- An `OrderLine` may contain many selected `Option` values. This is conceptually
  many-to-many between order lines and options and will require an explicit join
  representation when models are introduced.

## Relationship diagram

```text
User
  └── staff access only

Company 1 ────────< Employee 1 ────────< Order 1 ────────< OrderLine >──────── 1 Dish
   │                    │                   │                    │
   └────────────────────┴───────────────────┘                    └──< selected Options

Dish >────────< Option
```

Cardinality:

- `Company 1:N Employee`
- `Company 1:N Order`
- `Employee 1:N Order`
- `Order 1:N OrderLine`
- `Dish 1:N OrderLine` as a catalogue reference
- `Dish M:N Option`
- `OrderLine M:N Option` for selected options
- No first-version one-to-one relationship is required.

## Snapshots versus live references

Catalogue and master data are live references for current operations:

- `OrderLine.dishId` points to the catalogue dish when available.
- Dish and option active state controls whether they can be selected for new orders.
- Current dish/option names and prices may change for future orders.

Order history uses snapshots:

- The order line stores the dish name and exact-decimal price used at purchase time.
- Each selected option stores its name and exact-decimal price adjustment used at purchase
  time.
- Quantity, notes, line totals, order totals, service date, delivery details, employee
  identity, and company identity used for fulfillment must remain stable for the historical
  order view.
- Live references are useful for traceability and current catalogue navigation, but they
  must never be used to recalculate or rewrite historical financial or fulfillment data.

All monetary values must use an exact decimal representation at the database and
application boundaries. Floating-point numbers must not be used for prices, adjustments,
line totals, or order totals.

## Important invariants

1. A `User` has exactly one staff role from `Admin`, `Kitchen`, `Dispatch`, or `Driver`.
2. Staff users and customer employees are separate concepts.
3. Every `Employee` belongs to exactly one `Company`.
4. Every `Order` belongs to exactly one `Employee` and exactly one `Company`.
5. The employee and company on an order must be consistent at order creation.
6. Every `Order` contains at least one `OrderLine` once submitted.
7. Every order line has a positive quantity and exact-decimal monetary values.
8. A deactivated `Dish` or `Option` cannot be selected for a new order.
9. A deactivated catalogue record remains available for historical order display and
   reporting; it is not hard deleted.
10. Historical totals are derived from order-time snapshots, never from current catalogue
    prices.
11. Order-line and order financial values use a consistent currency and exact decimal
    scale policy.
12. Order history must remain readable even if an employee changes contact details or a
    catalogue item is renamed, repriced, or deactivated.

## Information that must never change for historical orders

After an order is submitted, the following order-time facts must not be rewritten:

- employee name and delivery/contact details used for fulfillment
- company name/identity used for attribution
- dish name, selected option names, and other customer-facing item descriptions
- quantities
- unit prices and option price adjustments
- line totals and order total
- currency
- requested service/delivery date and delivery instructions
- the order's placement time and submitted state history as represented by the order

Operational status may progress as the kitchen fulfills the order, but status transitions
must not mutate the original purchase facts.

## Intentionally not modeled yet

- **Authentication sessions, passwords, and permissions tables:** `User` only establishes
  the staff-account boundary; the authentication provider and detailed authorization model
  are implementation decisions for a later slice.
- **Audit log and status-history entities:** operational accountability matters, but these
  are additional persistent entities and are outside the requested first database version.
- **Menus, categories, recipes, ingredients, inventory, allergens, and suppliers:** these
  describe catalogue and kitchen supply complexity that is not required to establish the
  seven core entities.
- **Delivery routes, addresses, vehicles, and dispatch runs:** `Order` can hold the
  initial fulfillment details without introducing a separate logistics model.
- **Payments, invoices, refunds, taxes, discounts, and currencies beyond one configured
  currency:** financial workflows need separate domain decisions.
- **Recurring orders, subscriptions, and order amendments:** the first version models a
  single submitted order with stable snapshots.
- **Soft-delete/audit columns beyond `isActive` and timestamps:** deactivation semantics are
  defined for catalogue records, while broader retention policies remain to be decided.
- **Dedicated snapshot entities:** snapshots belong on the order/order-line boundary for
  this first version; separate versioned catalogue tables would add complexity before it
  is needed.
