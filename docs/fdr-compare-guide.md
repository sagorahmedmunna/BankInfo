# Compare Multiple FDRs — User Guide & Functionality Reference

The **Compare Multiple FDRs** calculator (`MultiFdrComparison`) provides an editable **1-FDR-per-row comparison table** for evaluating **2 to 5 bank offers** side by side with optional **column sync locks**, **custom renewal intervals**, **visual bars**, and **full export/inspection tools**.

---

## 1. How It Works (Core Concept)

- Every row represents one independent FDR scheme calculated through the exact same simple/compounded engine as **Single Plan**.
- The tool automatically ranks all rows by **Net Profit (`netInterest`) descending** (handling ties within `0.005` cleanly via `🏆 Tied #1` or `Equal Return`), identifies the **Rank #1 Winner**, calculates each plan's **Net APY (%)**, and measures the exact currency and percentage gain over the lowest-yielding scheme.
- By combining **per-row editing** with **header-aligned Column Sync Locks**, you can either compare completely different bank packages (mixed amounts, tenures, and compounding rules) or lock shared variables to isolate one factor (such as interest rate, renewal interval, or TIN tax impact).

---

## 2. Inputs, Presets & Column Controls

Default setup includes 3 schemes (`Bank A (Standard)` at `9.0%`, `Bank B (High Yield)` at `9.75%`, and `Bank C (One-Time Flat)` at `9.5%`). Minimum rows: **`2`**; maximum rows: **`5`**.

### 1-Click Comparison Presets (`FDR_COMPARISON_PRESETS`)
| Preset | Included Rows | What It Demonstrates |
| --- | --- | --- |
| **Bank Interest Rates** | 3 rows (`9.0%`, `9.75%`, `10.5%`, 100k, 12M @ 3M) | How rate spreads compound over 1 year |
| **Compounding Frequency** | 4 rows (`1M`, `3M`, `6M`, `One-Time Flat` at 9.5%) | Extra profit gained solely from more frequent renewals |
| **TIN Tax Impact (10% vs 15%)** | 2 rows (`10% Tax` vs `15% Tax`, 12M @ 3M, 9.5%) | Net post-tax savings from TIN filer status |
| **Tenure Horizons (1Y vs 2Y vs 3Y)** | 3 rows (`12M @ 9.0%`, `24M @ 9.5%`, `36M @ 10.0%`) | Multi-year maturity scaling |

### Editable Table Columns (Per Row)
| Column | Allowed Values & Validation | Row Shortcuts & Indicators |
| --- | --- | --- |
| **Bank / Scheme Name** | Custom text label | Rank pill above input (`🏆 Best Winner`, `🏆 Tied #1`, `Equal Return`, `#N Performer`) |
| **Deposit** | Whole digits (`>= 0`, fallback `100000` on empty blur) | Quick chips: `50k`, `1 Lakh / 100k`, `2 Lakh / 200k`, `5 Lakh / 500k`, `10 Lakh / 1M` |
| **Tenure (Duration)** | `1`–`600` months (`floor`, fallback `12` on empty blur) | Quick chips: `3M`, `6M`, `1Y` (`12`), `2Y` (`24`), `3Y` (`36`) |
| **Renewal Interval** | Preset selector + `0`–`600` mo custom box | Options: `None (One-Time Flat)`, `1 Mo`, `3 Mo`, `6 Mo`, `12 Mo`, `Custom (Months)...`. Live badge shows `⏹️ One-Time Flat`, `ℹ️ Single term (NM)`, or `🔄 Reinvests (intervalM + pro-rata)`. |
| **Annual Rate** | `0%`–`100%` decimal input (fallback `9.0` on blur) | `-0.25%` / `+0.25%` stepper buttons (stepper clamps `0.1%`–`30%`) |
| **Tax Rate** | `0%`–`100%` decimal input (fallback `15` on blur) | Quick presets: `0%`, `10% TIN`, `15% No` |

---

## 3. Sync Column Values (Fair Apples-to-Apples Mode)

Directly above the column headers sits the **`Sync Column Values`** bar with individual `ON/OFF` locks for all 5 parameter columns:
- **Deposit**, **Tenure (Duration)**, **Renewal Interval**, **Annual Rate**, and **Tax Rate**
- **Turning `Sync ON`:** Copies the top visible row's value in that column across all other rows immediately. While `ON`, editing that field (or clicking its quick chips / steppers / blur normalization) in any row updates every row together; newly added rows also inherit locked values.
- **Turning `Sync OFF` / `Unsync All (N)`:** Re-enables independent per-row values without discarding current numbers.

---

## 4. Outputs, Actions & Export Functionality

### Hero Winner Banner & Computed Columns
- **Hero Summary Banner:** Highlights the top-ranked offer (or tied winners / equal status), showing highest **Maturity Payout**, take-home **Net Profit**, **Net Effective APY (%)**, and **Profit Advantage vs Lowest** (`+currency` and `+% higher return`).
- **Computed Columns per Row:**
  - **Net Profit:** Take-home profit, plus `Gross` earned and `Tax` deducted underneath.
  - **Maturity Total:** Principal plus Net Profit.
  - **Net APY:** Effective annualized post-tax yield (`((Maturity / Principal)^(1 / durationYears) - 1) × 100`).
  - **vs Minimum:** Shows `Minimum Base` / `Equal Return` on the lowest-return row, and `🏆 Winner` / `🏆 Tied #1` plus exact `+diff` and `+% more` on higher-return rows.

### Visual Comparison Bars & Row Actions
- **Visual Comparison Chart:** Color-coded (`Emerald`, `Sky`, `Indigo`, `Amber`, `Rose`) stacked horizontal bars comparing each scheme's **Principal** and **Net Profit** scaled to the highest maturity total.
- **Per-Row Actions:**
  - **Duplicate (`Copy`):** Clones that row (up to 5 total).
  - **Remove (`Trash`):** Deletes a row (disabled when 2 rows remain).
  - **Inspect (`ExternalLink`):** Sends that row's exact deposit, duration, interval, rate, and tax directly into **Single Plan** so you can inspect its cycle-by-cycle growth ledger and chart.

### Exports, Sharing, Print & Storage
- **Export CSV:** Downloads `Multi_FDR_Comparison_<CODE>.csv` containing 13 columns (`Rank`, `Bank / Scheme Name`, `Deposit`, `Duration (Months)`, `Renewal Interval (Months)`, `Annual Rate (%)`, `Tax Rate (%)`, `Gross Interest`, `Tax Deducted`, `Net Profit`, `Maturity Total`, `Net APY (%)`, `Advantage vs Minimum`).
- **Statement Modal:** Generates a formatted plain-text **Multi-FDR Comparison Summary** (`Copy` or `Save .txt` as `Multi_FDR_Comparison_Statement_<CODE>.txt`).
- **Share Link:** Encodes all schemes (Base64URL `plans`), currency, and active `sync` columns into `#fdr-compare?plans=...&currency=...&sync=...`.
- **Print / PDF:** Full-width horizontal table printing via `.print-table-wrap`.
- **Persistence:** Saved in `localStorage` under `bankinfo_multi_fdr_schemes_v1` and `bankinfo_multi_fdr_sync_v1`.

