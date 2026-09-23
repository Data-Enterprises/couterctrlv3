# Saved exports — backend handoff

Three endpoints so a Sales Export configuration can be named, kept, and loaded again
later. Storage is a JSON file per user in S3 — no table, no migration.

Written 2026-09-23. The frontend is built and merged (`a8120df2`); it calls these three
paths and does nothing useful until they answer.

---

## What a saved export is

A configuration, not a query and not a file. The page already knows how to turn its
state into a payload and back again; all three endpoints do is keep that payload
somewhere it survives the tab.

Deliberately **not** in the payload: the date range. A saved export is a question — the
shrink report, the vendor rollup — and the range is whichever one is open when someone
loads it. Pinning September into it would make it useless in October. The backend does
not need to know this, but it explains why there is no date validation to write.

---

## Storage

Bucket `mto2-html-pages` (us-east-1), the same one the help pages use, under a new
prefix:

```
s3://mto2-html-pages/sales-export-queries/{userid}.json
```

**The bucket policy grants public read to `dev/*` and `prod/*` only** — verified from
outside AWS with no credentials, see `html-s3-handoff.md`. So this prefix is private by
default and must stay that way: these files hold store ids, vendor lists and product
codes, and userids are small integers anyone could enumerate. Do not widen the policy;
the endpoints read and write with the API's own credentials and the browser never
touches these keys.

### The file

```json
{
  "version": 1,
  "userid": 36,
  "updated": "2026-09-23T20:14:02Z",
  "exports": [
    {
      "id": "8f14e45fceea167a5a36dedd4bea2543",
      "name": "Shrink by vendor",
      "created": "2026-09-23T20:14:02Z",
      "updated": "2026-09-23T20:14:02Z",
      "payload": { "v": 1, "mode": "summary", "...": "opaque" }
    }
  ]
}
```

**One file per user, not one per saved export.** Listing is the common operation and this
makes it a single GET. One object per export would mean a `ListObjectsV2` plus an N-way
fan-out of GETs just to show names, or names smuggled into keys, which is worse. The
cost is that saving is a read-modify-write — see the conditional write below.

### `payload` is opaque

Store it and hand it back. Do not validate its interior, do not normalise it, do not
reach inside it. It is the page's shape and it will change; if the endpoint knows what is
in it, every UI change becomes a backend release. `"v": 1` inside it is the frontend's
own version marker for its own migrations.

Bound it rather than inspecting it:

| Limit | Value | On breach |
| --- | --- | --- |
| Saved exports per user | 200 | 400, "You have 200 saved exports; delete one first" |
| `name` length | 80 characters, trimmed | 400 |
| `payload` serialised | 64 KB | 400 |
| Whole file | naturally under 13 MB at those limits | — |

---

## Rules that apply to all three

**The userid comes from the token, never from the body.** A saved export is one user's;
nothing in the request should be able to name a different one. Same dependency the other
sales endpoints use for the caller's identity.

**A missing file is an empty list, not an error.** A user who has never saved anything
has no object. `NoSuchKey` means `{"exports": []}` and the save path creates the file.

**Response envelope matches the rest of the router:** `error: 0, success: true` on the
way out, `HTTPException` with a plain-English detail on the way in. The frontend reads
`j.error !== 0` as failure.

**Ids and timestamps are the server's.** Id is a uuid4 hex string, assigned once and
never reused. `created` is set on first write, `updated` on every write. Both ISO-8601
UTC with a trailing `Z`. The frontend sends `id: null` for a new one and an existing id
to replace in place; it never invents an id.

**Order the list newest-updated first.** The page renders them in the order it receives
them and does not sort.

---

## 1. `POST sales/export_configs` — list

Everything this user has saved. Called once per session, when the Saved window is first
opened.

**Request:** `{}` — the body is empty on purpose. Scope is the token.

**Response:**

```json
{ "error": 0, "success": true, "configs": [ { "id": "...", "name": "...",
  "payload": {...}, "created": "...", "updated": "..." } ] }
```

**What it does:** GET the object, parse it, return `exports` sorted by `updated`
descending. On `NoSuchKey` return `configs: []` with `error: 0` — an empty shelf is a
normal state, not a failure.

**The one failure worth handling separately:** a corrupt or unparseable file. Do not
return 500 and do not silently overwrite it. Return an empty list with a message the
page can show, and leave the file alone so it can be recovered by hand. Losing someone's
twelve saved reports to a stray byte is not a recoverable mistake.

---

## 2. `POST sales/export_config_save` — save or replace

Both operations, because the client cannot know whether an id still exists and a separate
create and update would be two round trips to find out.

**Request:**

```json
{ "id": null, "name": "Shrink by vendor", "payload": { "v": 1, "...": "..." } }
```

- `id: null` — a new saved export
- `id: "<existing>"` — replace that one, keeping its `created`

**Response:** the saved item, exactly as it now sits in the file.

```json
{ "error": 0, "success": true, "config": { "id": "...", "name": "...",
  "payload": {...}, "created": "...", "updated": "..." } }
```

The frontend puts this straight into its list, so it must be the stored version, not the
request echoed back — the id and timestamps are the point.

**Steps:**

1. Validate `name` (present, trimmed, ≤80) and `payload` (a JSON object, ≤64 KB).
2. GET the file with its ETag, or start from `{"version": 1, "userid": N, "exports": []}`.
3. If `id` is given and present, replace that entry and keep its `created`. If `id` is
   given and **absent**, treat it as new rather than 404 — someone deleted it in another
   tab, and the useful outcome is that their save still lands.
4. If new: check the 200 limit, assign a uuid4 id, set `created` and `updated`.
5. Set the file's `updated`, PUT it back.

**The conditional write.** PUT with `If-Match: <the ETag from step 2>`, or
`If-None-Match: *` when the file did not exist. On 412 — someone else wrote between the
GET and the PUT — re-read and reapply once, then 409 if it happens again. Two tabs open
on the same account is an ordinary Tuesday, and without this the second save silently
erases the first.

**Duplicate names are allowed.** Identity is the id. Two reports called "Monthly" is a
naming problem for the person who made them, not an error worth blocking a save over.

---

## 3. `POST sales/export_config_delete` — remove

**Request:** `{ "id": "8f14e45f..." }`

**Response:** `{ "error": 0, "success": true }`

**Steps:** GET with ETag, drop the entry, PUT conditionally as above. Deleting an id that
is not there is a **success, not a 404** — the caller wanted it gone and it is gone.
Anything else makes two tabs produce an error message about a thing that already happened.

Leave the file in place when the last export is deleted, holding an empty list. An empty
file is cheaper than the `NoSuchKey` path having to be right twice.

---

## Order of work

1. The S3 helpers: read-with-etag, conditional write, the "no file yet" case. Everything
   else is a thin layer over these two functions.
2. `export_configs`. It is the read path and it makes the Saved window show something.
3. `export_config_save`. Conditional write, limits, the new-versus-replace branch.
4. `export_config_delete`. Twenty lines once 1–3 exist.

The frontend is already merged and calling all three, so each one lights up as it lands —
there is nothing to coordinate and no flag to flip.

---

## Worth testing

- No file yet → list returns `[]`, then a save creates the file.
- Save, list, load: the payload that comes back is byte-identical to the one sent.
- Replace by id keeps `created` and moves `updated`.
- Save with an id that was deleted elsewhere → lands as a new one, not a 404.
- Delete something already gone → success.
- Two concurrent saves → both survive, neither silently erases the other.
- A user cannot read or write another user's file by any body they can send.
- 201st save → 400 with a message, not a truncated file.
- Anonymous GET of `sales-export-queries/36.json` → 403.

---

## What this sets up

Once a configuration lives server-side, **scheduled exports** stop being a feature and
become a small job: a saved export id, a schedule, and a date range worked out at run
time — "run this one every Monday and email the link". That is the reason the payload is
opaque and the dates are absent; a runner needs to hand the payload to `/sales/export`
with dates of its own and nothing else.

Two other things on the same page are waiting on this repo, tracked in the task log:

- `productDescriptions` on `/sales/export` — ILIKE ANY over `product_description`, each
  term wrapped in `%`. The frontend already sends it, so until it lands the preview
  narrows and the file does not.
- Whether `aggregates` should accept arithmetic between measures. Real client queries do
  `sum(qty) * (max(price) / nullif(max(price_split), 0))`; the query window computes it,
  the export cannot express it, and the page tells the user which columns it had to drop.
