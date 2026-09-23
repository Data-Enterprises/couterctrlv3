# Named and computed measures — backend handoff

Three additions to `/sales/export` so a client's own query can become a file: a
**name** for a measure, a **measure worked out from other measures**, and a
**sort of its own**.

Written 2026-09-23. The frontend is built and merged; it sends both today and
the endpoint ignores one and cannot express the other.

---

## Where this came from

A real client query, run in the page's query window:

```sql
SELECT store_number, vendor_id, sub_department, product_code, product_description, terminal,
SUM(qty) AS TotalUnits,
SUM(total_sales) AS TotalDollars,
SUM(qty)*(MAX(price)/NULLIF(MAX(price_split),0)) AS atReg,
MAX(price)/NULLIF(MAX(price_split),0) AS RegUnitPrice,
(SUM(qty)*(MAX(price)/NULLIF(MAX(price_split),0)))-SUM(total_sales) AS lossGain,
SUM(package_discount) AS PACKAGEDISC
WHERE sale_type = 'Sale'
GROUP BY store_number, vendor_id, sub_department, product_code, product_description, terminal
ORDER BY vendor_id, sub_department
```

Three of those six columns are the point of the query — what it should have rung
at, against what it did — and none of them survive into an export today. The
measure is `{column, fn}`: no name of its own, no arithmetic.

---

## 1. `alias` on a measure

```python
class SalesExportAggregate(BaseModel):
    column: str
    fn: str
    alias: Optional[str] = None      # new
```

**Validation.** Trim it, then require `^[A-Za-z_][A-Za-z0-9_]{0,62}$` — an
identifier, at most 63 characters, which is Postgres's own limit. Reject anything
else with a 400 that names the alias. The frontend applies the same rule before
it sends, and drops a name it knows will not pass rather than letting the export
fail an hour in, so anything arriving here is already clean; this is the check
that keeps it that way for other callers.

**Uniqueness.** Fold it into the existing `seen_aliases` set, which already holds
the group keys and the derived names. Two measures landing on one output column
is a file with a column written twice, and the endpoint already refuses that.

**Rendering.** `AS {_quote_ident(alias)}` in place of the derived
`{column}_{fn}`. Because it is quoted, the case survives — `AS "TotalUnits"`
means the CSV header says `TotalUnits`, which is what whoever typed it expected.
Leave the derived name exactly as it is when `alias` is absent; every existing
caller keeps its file.

That is the whole change. It is worth doing on its own, before the second half.

---

## 2. `computed` — measures with arithmetic

```python
class SalesExportComputed(BaseModel):
    alias: str
    expr: dict          # a tree, validated below

class SalesExportRequest(BaseModel):
    ...
    computed: Optional[List[SalesExportComputed]] = None
```

`computed` rides with `groupBy` and `aggregates`: same aggregated export, extra
select items. It is refused alongside `columns` for the same reason they are, and
`groupBy` is still required. `aggregates` may be empty when `computed` is not —
a summary whose only measure is a worked-out one is a normal thing to ask for.

### The expression is a tree, never SQL text

This is the decision the rest of it hangs on. The client sends JSON; the endpoint
walks it and renders the statement itself. Nothing the caller typed reaches the
query as text, which keeps the injection surface exactly where it is today:
identifiers verified against `information_schema` and quoted, values bound.

`max(price) / nullif(max(price_split), 0)` arrives as:

```json
{ "kind": "binary", "op": "/",
  "left":  { "kind": "agg", "fn": "max", "column": "price" },
  "right": { "kind": "call", "name": "nullif",
             "args": [ { "kind": "agg", "fn": "max", "column": "price_split" },
                       { "kind": "literal", "value": 0 } ] } }
```

Six node kinds, and no others:

| `kind` | Fields | Renders as |
| --- | --- | --- |
| `agg` | `fn`, `column` | `sum("qty")`, `count(*)` when column is `*` |
| `column` | `name` | `"storeid"` — only legal if it is in `groupBy` |
| `literal` | `value` — number, string, bool or null | a bound parameter, never inlined |
| `binary` | `op` in `+ - * /`, `left`, `right` | `(left op right)` |
| `neg` | `expr` | `(-expr)` |
| `call` | `name`, `args` | one of the six below |

`call.name` is one of `nullif`, `coalesce`, `round`, `abs`, `greatest`, `least` —
a key into a dict, the same way `fn` is a key into `_AGGREGATE_FNS`. Anything
else is a 400 that lists what is allowed.

### Validating the walk

Each rule exists because of a specific way this goes wrong:

1. **Unknown `kind`** → 400. Do not skip a node you do not recognise; a tree with
   a node silently dropped computes something the client did not ask for.
2. **`agg.column`** → `_check_known` against the catalog, then `_quote_ident`.
   `*` stays legal for `count` only, as it already is.
3. **`agg.fn`** → key into `_AGGREGATE_FNS`, and the existing numeric check still
   applies: `sum`/`avg` on one of the seven varchar-that-looks-numeric columns is
   a 400, not a failure inside `query_export_to_s3` after RDS has begun writing.
4. **`column`** → must be in `groupBy`. A bare column beside an aggregate is the
   error Postgres would raise anyway; raising it here costs nothing and says
   something useful.
5. **`binary.op`** → one of four, matched from a dict. Never interpolate the
   operator from the payload.
6. **`literal`** → bind it. A string literal in an expression is rare but legal
   (`coalesce(vendor_name, 'unknown')`) and must not be inlined.
7. **Depth ≤ 8, nodes ≤ 40** → 400. The client query above is four deep with
   eleven nodes. This is the cap that keeps a hand-written payload from becoming
   a stack overflow in the walker.
8. **`alias`** → the same identifier rule and the same `seen_aliases` set as §1.

### Do not be clever about division

Postgres raises on divide-by-zero, which is exactly why the client's query wraps
its denominator in `NULLIF`. **Do not auto-wrap denominators.** Silently turning
`a / b` into `a / nullif(b, 0)` changes someone's arithmetic without telling
them — a row that should have failed loudly becomes a null they will read as a
zero. If a caller leaves the guard out, the export fails, and that is correct.

### What it renders

With `groupBy: ["storeid"]`, one aggregate and one computed measure:

```sql
SELECT "storeid",
       sum("qty") AS "TotalUnits",
       ((sum("qty") * (max("price") / nullif(max("price_split"), 0)))
        - sum("total_sales")) AS "lossGain"
FROM public.sales_partitioned
WHERE ...
GROUP BY 1
```

Brackets around every binary node rather than a precedence table. More brackets
than SQL needs, and no wrong ones.

`ordered` still sorts by the group keys. A computed measure is not a key and
cannot be one.

---

## 3. `orderBy` — the file's own sort

The last thing a client query carries that an export cannot. `ordered` is a
boolean: the line key for a plain export, the group keys for a summary. A query
that says `ORDER BY vendor_id, sub_department` means those two, in that order.

```python
class SalesExportSort(BaseModel):
    key: str
    desc: bool = False

class SalesExportRequest(BaseModel):
    ...
    orderBy: Optional[List[SalesExportSort]] = None
```

**`key` is a column of the output, not of the table.** For a summary that is a
group key or a measure's name — the alias where there is one, the derived
`total_sales_sum` where there is not. For a plain export it is one of `columns`.
Validate against the list the select clause was just built from, which is
already in hand at that point, and 400 anything else. That check is the whole
security story here: an output name, matched against a list the endpoint built
itself, then `_quote_ident`. Nothing from the payload is interpolated.

**`desc`** is a boolean, so there is no direction string to sanitise. Render
`ORDER BY {ident} DESC` or plain; nulls take Postgres's default, which puts them
last ascending — the same place the page's preview puts them.

**Precedence.** A non-empty `orderBy` is the sort, whatever `ordered` says: an
explicit answer beats a default, and a caller who sent one has already decided.
Empty or absent leaves `ordered` doing exactly what it does today, so no
existing caller's file changes.

Sorting a large export costs what it has always cost. It is the caller's choice,
the page labels it, and nothing here needs to guard it.

## Order of work

1. `alias` on `SalesExportAggregate`. Small, independent, and it removes half of
   what the page currently reports as dropped.
2. `orderBy`. Also small, and independent of the tree work — the validation is a
   membership test against a list the endpoint already has.
3. The tree walker — one function, `_render_expr(node, types, depth)`, returning
   the SQL fragment and appending any bound values. Everything else in §2 is ten
   lines around it.
4. `computed` in the request model and in `_resolve_export_aggregation`, next to
   the loop that already builds the select list.

---

## Worth testing

- `alias` renders and the case survives into the CSV header.
- An alias colliding with a group key, or with another measure's derived name → 400.
- `sum(qty) * (max(price) / nullif(max(price_split), 0)) - sum(total_sales)` →
  the SQL above, and a file whose numbers match the same query run by hand.
- `{"kind": "call", "name": "pg_sleep"}` → 400. `{"kind": "binary", "op": ";--"}`
  → 400. `{"kind": "agg", "column": "storeid; drop table users --"}` → 400, from
  the catalog check that already exists.
- A tree 9 deep → 400 rather than a recursion error.
- `sum` on `member_level` inside an expression → the same 400 the plain measure
  gets.
- `computed` with `columns` → 400, as `groupBy` with `columns` already is.
- `computed` alone, with `aggregates` empty → works.
- `orderBy` by a group key, by a measure alias, and by a derived measure name.
- `orderBy` naming a column that is not in the output → 400.
- `orderBy` sent beside `ordered: true` → the explicit keys win.
- Nothing sent: every existing caller's file is byte-identical to before.

---

## What the page already does

Merged and live on the dev tree, so each half lights up as it lands:

- Measures carry an editable **Called in the file** name; blank means the
  endpoint's derived one.
- Computed measures appear in the Measures section with the expression written
  out and a name of their own, removable there.
- **Apply to configuration** in the query window carries both — aliases and the
  arithmetic — instead of listing them as dropped.
- The Summary preview computes them over the sample rows with the same evaluator
  the query window uses, so what is on screen is the shape of what the file will
  hold.
- Saved exports carry them, and drop a computed measure whose columns are not in
  the table the saved export is loaded against.
- **Sort by** under Output lists the file's own columns; clicking one goes
  ascending, descending, gone. Apply carries a query's ORDER BY into it, by name
  or by position, and the preview is sorted the same way.

Until the endpoint takes them, a file built with a computed measure comes back
without that column, and an alias comes back as the derived name.
