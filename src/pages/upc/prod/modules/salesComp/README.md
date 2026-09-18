# Sales Comp Tab

## What it does

Sales Comp shows daily net sales broken down by day of week for each UPC across a selected date range. The goal is pattern discovery — understanding which day(s) each item peaks, whether items are trending up or down, and how items compare to each other in terms of volume.

It is the default tab and the only tab that loads on initial search. All other tabs lazy load on first visit.

---

## Data source

- **API:** `getSalesComp`
- **Call:** Single call on Run (TY only — no LY)
- **Response shape:** Array of `UpcSalesComp` rows, one per UPC per week, with Monday–Sunday daily sales as individual fields
- **Pagination:** Handled upstream — do not modify the fetch call

---

## The view

### Heatmap table

Each row represents one UPC. Columns are Mon–Sun showing the **average daily sales** across all weeks in the selected range (not a single week's value). This normalizes across date ranges of different lengths.

The color intensity is computed against a 6-band scale:

| Band | Ratio to max | Color |
|------|-------------|-------|
| 0 | value = 0 | transparent |
| 1 | < 15% | lightest blue |
| 2 | 15–35% | light blue |
| 3 | 35–55% | medium blue |
| 4 | 55–75% | strong blue |
| 5 | > 75% | darkest blue |

**Heat scale modes (Global / Per item toggle):**

- **Global** — the darkest cell across the entire table is the single highest day-avg value from any UPC. All other cells are colored relative to that ceiling. Use this when you want to compare volume across UPCs — low-volume items will look pale, high-volume items will pop.
- **Per item** — each row's own peak day is the ceiling for that row. Every UPC's pattern is fully visible regardless of its volume. Use this when you want to understand the day-of-week behavior of each item independently.

### Peak day badge

Each UPC row shows a small blue badge (e.g. `Sat`) indicating that item's personal peak day. This is derived from the day-avg values — the column with the highest average.

### Trend sparkline

A mini bar chart showing weekly totals oldest→newest. Bars grow slightly darker left to right. Gives a quick visual of whether the item has been consistent, growing, or declining over the period.

### WoW column

Compares the **most recent week's total** against the **period average** (all weeks / week count). This is more stable than last-vs-prior-week because a single bad week doesn't distort the signal.

- Green badge (▲) = most recent week is more than 1% above the period average
- Red badge (▼) = more than 1% below
- "flat" = within ±1%
- "—" = only one week of data (no comparison possible)

### Expandable rows

Click any row to expand it into per-week sub-rows showing the actual daily sales for each week. The summary row stays visible above the expanded rows.

### Day totals footer

Sticky to the bottom of the table. Shows the sum of all UPC day-avgs per column — the aggregate daily profile of the selection. Not included in the heatmap color scale.

---

## KPI strip

Five tiles displayed above the tab bar, updated whenever the selection changes:

| Tile | What it shows |
|------|--------------|
| **UPCs** | Count of selected UPCs + week count as sub-label |
| **Total net sales** | Period aggregate across all selected UPCs (formatted as $k/$M) |
| **Peak day** | The day of week that is most commonly the peak day across individual UPCs, shown as e.g. `Sat · 5 of 8 UPCs` (mode, not sum) |
| **Avg daily / UPC** | Total ÷ active days ÷ UPC count — normalized per-item daily performance |
| **WoW trend** | Count of UPCs trending above vs below their period average, e.g. `3 ↑ / 2 ↓`. Sub-label reads "vs period avg" |

---

## Selection behavior

The right panel (all tabs) gates on `selectedUpcs`. If nothing is selected, the tab content is replaced with a prompt to select items from the left panel. The KPI strip and heatmap both filter to the active selection.

---

## Export

The export modal is opened via the download icon in the right panel header. It exports the **currently active tab's data** as a CSV file.

### Sales Comp presets

| Preset | What is exported |
|--------|-----------------|
| **All UPCs** | Every row in `salesComp` regardless of selection |
| **Selected UPCs** | Only rows whose `product_code` is in `selectedUpcs`. Falls back to all if nothing is selected. |

**CSV columns:** `UPC, Description, Week, Mon, Tue, Wed, Thu, Fri, Sat, Sun, Total`

Each row is one UPC × one week. The Total column is the sum of the seven day values.

### Custom export (planned)

Custom export would allow the user to configure the output before downloading. Planned options:

| Option | Description |
|--------|-------------|
| **Column selection** | Choose which day columns to include (e.g. weekdays only, or weekend only) |
| **Aggregation** | Raw per-week rows (current) vs a single aggregated row per UPC showing period totals and day-avgs |
| **UPC filter** | All / Selected / Trending up only / Trending down only |
| **Include peak day column** | Appends a `Peak Day` column derived from the day-avg computation |
| **Include WoW column** | Appends a `WoW %` column (most recent week vs period avg) per UPC |

Custom export config would be surfaced as a second section in the export modal below the preset list, collapsed by default and expanded when "Custom" is selected as the export type.
