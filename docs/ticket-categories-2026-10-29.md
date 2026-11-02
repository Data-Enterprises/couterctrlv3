# Ticket categories, 29 Oct 2026

Decided: one category per family of pages in the nav, so a ticket filed from
any page arrives with its category already set. Chat and Teams mean nothing to
the help desk and go; Tickets goes too (a ticket about the help desk is
"Other"). Users & Access is its own category.

The frontend side is `PAGE_CATEGORY` in `src/pages/tickets/dev/ticketOrigin.ts`.
It matches by **name**, and a name the server doesn't hold leaves the category
blank, so **run the SQL below before the frontend change publishes**. Until
then the renamed pages (Receivers) file with no category rather than a wrong
one.

## The thirteen (fourteen since 2 Nov)

| Category | Pages |
|---|---|
| Sales | Sales, Sales Tracker |
| Export | Data Export (added 2 Nov, see below) |
| Margins | Sub Dept Margins, Categories, Vendors |
| Coupons | Coupon Sales, Coupons |
| Loss Prevention | Loss Prevention, LP Actions |
| Cashiers | Cashiers |
| Item Lookup | Item Lookup, Item Actions |
| UPC List | UPC List, UPC Scanner |
| Forecasting | Forecasting |
| Orders & Receiving | Orders, Receivers, AWG Invoices |
| Price Optimization | Price Opt Sub Dept, Price Opt Vendor |
| Users & Access | User Management, Groups, Admin, Settings, signing in |
| Analyses | Quicksight |
| Other | picked by hand; Home and the help desk set none |

## SQL

Rename where the meaning holds, so tickets already filed keep their category.
Retire with `is_active = false`, never delete: old tickets still point at the
rows, and the lookups endpoint already leaves inactive ones out of the form.
Every statement is safe to run twice.

I've only seen `id`, `name` and `is_active` on the table; if it has another
NOT NULL column, the insert needs it too.

```sql
begin;

-- Same thing, new name: Receivers covers all of receiving now.
update ticket_categories set name = 'Orders & Receiving'
 where name = 'Receivers'
   and not exists (select 1 from ticket_categories where name = 'Orders & Receiving');

-- Gone.
update ticket_categories set is_active = false
 where name in ('Chat', 'Teams', 'Tickets');

-- New.
insert into ticket_categories (name, is_active)
select v.name, true
  from (values ('Coupons'), ('Cashiers'), ('Orders & Receiving'),
               ('Price Optimization'), ('Users & Access'), ('Other')) as v(name)
 where not exists (select 1 from ticket_categories c where c.name = v.name);

-- Kept, and active.
update ticket_categories set is_active = true
 where name in ('Sales', 'Margins', 'Coupons', 'Loss Prevention', 'Cashiers',
                'Item Lookup', 'UPC List', 'Forecasting', 'Orders & Receiving',
                'Price Optimization', 'Users & Access', 'Analyses', 'Other');

-- Check: exactly the thirteen should be active.
select id, name, is_active from ticket_categories order by is_active desc, name;

commit;
```

The table holds two categories the frontend never referred to, and I haven't
seen their names. The final `select` lists them: retire them unless they're
one of the thirteen under another spelling, in which case rename them instead
of keeping the inserted row.

## Added 2 Nov 2026: Export

Sales Export became Data Export, which reads orders, invoices and markdowns as
well as sales, so it files under a category of its own rather than Sales.
Until this row exists, a ticket filed from Data Export arrives with no
category. Safe to run twice, and independent of the block above.

```sql
insert into ticket_categories (name, is_active)
select 'Export', true
 where not exists (select 1 from ticket_categories where name = 'Export');

update ticket_categories set is_active = true where name = 'Export';
```
