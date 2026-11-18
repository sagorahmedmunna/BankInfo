# FDR Single Plan — User Guide & Functionality Reference

The **FDR Single Plan** calculator simulates a single Fixed Deposit Receipt (FDR) and compares holding a **One-Time Flat** deposit against **Periodic Reinvestment (Compounding)** across customizable renewal cycles, tax brackets, and tenures.

---

## 1. How It Works (Core Concept)

When opening an FDR, interest behaves differently depending on whether profit compounds mid-term or settles once at maturity:

1. **One-Time Flat FDR (`interval = 0` / `None (Flat)`)**
   - Interest is calculated once on your initial principal for the full tenure (`durationInYears = totalDuration / 12`).
   - Government tax at source (`taxRate%`) is deducted from total gross interest, leaving a single lump-sum net payout at maturity.
2. **Reinvested FDR (`interval > 0`)**
   - At the end of each renewal cycle (`interval` months), gross interest for that cycle is calculated, withholding tax is deducted, and the **after-tax net profit** is automatically rolled into the principal.
   - The next cycle earns interest on that larger principal balance, increasing total return and **Net Effective APY**.
   - **Pro-rata remainder handling:** If `totalDuration` is not evenly divisible by `interval` (e.g., `14` months with `3`-month cycles), the calculator executes full cycles first (`4 × 3M = 12M`) and then settles the remaining stub period (`2M`) pro-rata on the latest balance at maturity so no months are dropped.
   - **Interval `>=` Duration:** If `interval >= totalDuration`, no mid-term renewal occurs and the deposit settles as one flat pro-rata term matching the Flat FDR maturity payout.

---

## 2. Inputs & Interactive Controls (`InputPanel`)

Default values on first load: **`100,000` deposit · `12` months · `3`-month interval · `9%` annual rate · `15%` tax**.

| Control | Range / Validation | Quick Chips / Shortcuts | Notes |
| --- | --- | --- | --- |
| **Quick Scenarios** | 4 presets | `Standard (1Y @ 3M)`, `Growth (3Y @ 3M)`, `Semi-Annual (2Y @ 6M)`, `Monthly DPS-style (1Y @ 1M)` | Populates all 5 parameters in one click |
| **Initial Deposit Amount** | Non-negative whole digits (`>= 0`) | `50k`, `1 Lakh / 100k`, `5 Lakh / 500k`, `10 Lakh / 1M` | Quick chips adapt automatically (`Lakh` for `BDT`/`INR`, `k`/`M` otherwise) |
| **Total Duration (Months)** | Slider: `1`–`120` mo; input box: `1`–`600` mo (`MAX_FDR_DURATION_MONTHS`) | `1M`, `3M`, `6M`, `1Y`, `2Y`, `3Y`, `5Y` | Clicking a duration chip automatically caps `interval` if `interval > totalDuration` |
| **Reinvestment Interval (Months)** | Slider: `0` to `min(duration, 24)`; input box: `0`–`600` mo | `None (Flat)` (`0`), `1M`, `3M`, `6M`, `12M` | `0` enables One-Time Flat mode; any custom month value can be typed directly |
| **Annual Interest Rate (%)** | Slider: `1%`–`25%` (`0.25%` step); input box: `0%`–`100%` | `7.5%`, `8%`, `8.5%`, `9%`, `9.5%`, `10%`, `10.5%`, `11%`, `12%` | Supports decimal percentages |
| **Tax Rate on Interest (%)** | Slider: `0%`–`50%` (`1%` step); input box: `0%`–`100%` | `0% (Exempt)`, `5% (Rebate)`, `10% (TIN/Filer)`, `15% (Non-Filer)`, `20% (Corporate)` | Deducted at source from each cycle's gross interest |

Panel header actions:
- **Share:** Copies a direct URL (`#fdr?amount=...&duration=...&interval=...&rate=...&tax=...&currency=...`) encoding the full scenario.
- **Reset:** Restores default inputs (`100,000`, `12M`, `3M`, `9%`, `15%`).

---

## 3. Results, Charts & Schedule Functionality

### Hero Highlight Banner & Comparison Cards (`ComparisonCards`)
- **When `interval = 0` (`One-Time Flat FDR`):**
  - Displays maturity payout, post-tax net profit, and post-tax **Net APY**.
  - Card 1 (`Selected Plan`) highlights Traditional Simple Interest details.
  - Card 2 displays a live **"With 3-Month Compounding"** preview (when `totalDuration >= 3` and compounding adds gain) with a one-click **`Enable 3-Month Reinvestment`** button.
- **When `interval > 0` (`Reinvested FDR`):**
  - Displays the **Reinvestment Advantage** banner (`+Net Gain Bonus` and `% higher return`), or **Single-Period Settlement** when `interval >= totalDuration`.
  - Side-by-side breakdown cards compare **One-time FDR** vs. **Reinvested FDR** across Initial Principal, Gross Interest, Tax Deducted, Net Interest Earned, Final Maturity Total, and **Net Effective APY**.

### Growth & Payout Visualization (`VisualChart`)
- **Comparative Stacked Bars:** Visualizes `Principal`, `Simple Profit`, `Reinvested Profit`, and the `Extra Reinvestment Gain (★)` segment proportionally.
- **Compounding Progression Grid:** Interactive step cards (`Start` + every cycle / `Pro-rata` final step). Hovering, clicking, or pressing `Enter`/`Space` on a cycle reveals a detail strip with **Opening Balance**, **Cycle Net Interest**, **Tax Deducted**, and **Closing Balance**.

### Reinvestment Cycle Schedule (`CycleScheduleTable`)
- Collapsible cycle-by-cycle ledger (collapse preference persists under `bankinfo_fdr_schedule_expanded`).
- Columns: **Cycle (`#` + `Pro-rata` badge)**, **Period (`Mo start - end`)**, **Opening Principal**, **Gross Return**, **Tax Paid**, **Net Added**, and **Closing Balance**, plus a **Total Maturity Sum** footer.
- **Export CSV:** Downloads `FDR_Reinvestment_Schedule_<amount>_<interval>M.csv` with 10 columns including **Cumulative Net Interest**.

### Statement, Cross-Mode Switching, Currency & Persistence
- **Statement Modal (`SummaryExportModal`):** Opens a formatted plain-text **Investment Summary Statement** with **Copy Statement**, **Save `.txt`** (`FDR_Investment_Statement_<CODE>.txt`), and **Share Link**.
- **Switch Banner:** One-click links to jump to **Goal Planner** or **Compare Multiple FDRs**.
- **Print / PDF:** Header print button or browser `Ctrl+P` / `Cmd+P` applies dedicated print styling and light-mode formatting.
- **Local Persistence:** Automatically saves inputs in `localStorage` under `bankinfo_fdr_inputs_v2`.

---

## 4. Mathematical Formulations

- **Simple / One-Time Flat FDR:**
  - `durationInYears = totalDuration / 12`
  - `grossInterest = (amount × annualRate × durationInYears) / 100`
  - `tax = (grossInterest × taxRate) / 100`
  - `netInterest = grossInterest - tax`, `totalAmount = amount + netInterest`
- **Compounded Reinvestment FDR (`interval > 0`):**
  - `cycles = floor(totalDuration / interval)`, `remainingMonths = totalDuration - cycles × interval`
  - For each cycle: `cycleGross = (P × annualRate × (interval / 12)) / 100`, `cycleTax = (cycleGross × taxRate) / 100`, `P = P + (cycleGross - cycleTax)`
  - If `remainingMonths > 0`, a final pro-rata simple step accrues on the latest `P` for `remainingMonths / 12` years.
- **Net Effective APY:**
  - `netEffectiveApy = ((totalAmount / amount) ^ (1 / durationInYears) - 1) × 100`

