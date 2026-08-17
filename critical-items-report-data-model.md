# Critical items report — data model notes

## Two entry points, not one

The report has two separate entry points depending on the scenario:

- **Items with sales activity** — transaction records are the primary source. Receipt date tells you whether supply kept up with demand. Margin data tells you if the price held.
- **Zero-sales items** — receipt records are the only way you even know the item exists. Without them, those items are completely invisible.

Receipt records are the foundation the report has to be built on. You index from "what was received" and join transactions where they exist, rather than starting from transactions and looking backward.

## The silent failure problem

Transaction data from registers only covers items that actually sold. Items that were received, stocked, and never scanned won't appear anywhere in the transaction feed — they produce no signal at all in sales-based reporting.

The items with no transaction match — received but never sold in the period — are the most actionable finding, because that's inventory sitting on a shelf that nobody flagged.

## Diagnostic split

Receipt date is the primary diagnostic signal. It separates every flagged item into two completely different problems before any other analysis runs:

**No recent receipt → the item probably isn't on the shelf.**
Zero or declining sales in this case is a stocking problem, not a demand problem. The action is operational — check receiving, follow up with the vendor, confirm whether the order was placed.

**Recent receipt but still not selling → the item is available and nobody's buying it.**
That's a real demand signal. Now you look at price vs. last year, margin trends, seasonal shifts, and competitive changes.

These two scenarios look identical in sales data alone. Receipt date is what splits them.

## Evidence line structure

The diagnostic split should be the first branch in the plain-language evidence shown per item:

> "Last received 38 days ago — likely out of stock. Sold 47 units same week last year."

vs.

> "Received 5 days ago — in stock. Sales down 34% vs. same week last year with cost unchanged."

Both items show declining sales. The receipt date makes them two different findings with two different owners.

## Open question

Does receipt data include quantity received? If so, the evidence can go further:

> "Received 24 units June 30, sold 3 before sales stopped — 21 units likely still on shelf or in back stock."

That changes the finding from a trend observation to an inventory discrepancy with a specific number attached.
