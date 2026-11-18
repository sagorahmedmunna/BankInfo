# Goal / Reverse FDR Planner — User Guide & Functionality Reference

The **Goal / Reverse FDR Planner** (`GoalFdrPanel`) works backwards from your financial target—**Monthly Income**, **Maturity Target**, or **Net Profit Goal**—to solve the exact initial deposit required, compare Flat vs. Reinvested capital requirements, and verify every figure forward.

---

## 1. How It Works (3 Reverse Target Modes)

Default values on first load: **`Monthly Income` (`10,000`/mo) · `36` months · `3`-month interval · `9.5%` annual rate · `15%` tax**.

When switching between goal types, if your target still matches the previous type's default, it updates automatically (`10,000` Monthly Income ↔ `500,000` Maturity Target ↔ `100,000` Net Profit Goal); custom amounts you typed are preserved.

1. **`Monthly Income` (`monthly_income`) — Earn target net profit every month**
   - **Regular Monthly Payout (Simple):** Computes the principal needed so your net monthly interest equals your target immediately every month after tax without spending your principal.
   - **Reinvested Avg (Compounded):** Computes the smaller deposit required if all interest stays inside the FDR and compounds across the full reference horizon so the total average net return equals your monthly target × duration.
2. **`Maturity Target` (`maturity`) — Reach target final balance**
   - Finds the initial deposit that grows to your target maturity corpus (`Principal + Net Interest = Target`) over your chosen timeframe.
   - Remains achievable even at `0%` net return (where required principal equals the target amount).
3. **`Net Profit Goal` (`net_profit`) — Earn target total net interest**
   - Finds the starting deposit needed solely to generate your desired after-tax profit total over the timeframe.

---

## 2. Inputs & Parameter Controls

| Control | Range / Validation | Quick Chips / Shortcuts | Notes |
| --- | --- | --- | --- |
| **Goal Type** | `monthly_income`, `maturity`, `net_profit` | 3 selector cards | Auto-adjusts untouched default targets cleanly |
| **Target Amount** | Whole digits (`>= 0`) | Income: `5k`, `10k`, `25k`, `50k`<br>Maturity: `2L/200k`, `5L/500k`, `10L/1M`, `25L/2.5M`<br>Net Profit: `50k`, `1L/100k`, `2.5L/250k`, `5L/500k` | Represents monthly net income, final balance, or total net profit |
| **Horizon / Timeframe (Months)** | Slider: `1`–`120` mo; input: `1`–`600` mo | `6M`, `1Y`, `2Y`, `3Y`, `5Y`, `10Y` | Labeled `Reference Horizon` for Monthly Income and `Target Timeframe` otherwise |
| **Reinvestment Interval (Months)** | `0`–`600` mo | `Flat (0)`, `1M`, `3M`, `6M`, `12M` + custom box | Shows live cycle count (`Nc + Rm`) or `Flat (None)` |
| **Annual Interest Rate (%)** | Slider: `1%`–`20%` (`0.25%` step); input: `0%`–`100%` | — | Gross annual bank rate |
| **Tax Rate on Interest (%)** | `0%`–`100%` decimal input | `0%`, `10% TIN`, `15% Standard`, `20%` | Applied at source to compute net annual yield (`annualRate × (1 - taxRate / 100)`) |

---

## 3. Solver Math & Verification Engine

1. **Unit-Principal Yield Probing:** Runs `calculateFDRComparison` on a `1,000,000` probe principal over your exact `totalDuration`, `interval`, `annualRate`, and `taxRate`. This guarantees exact compounding steps **and exact pro-rata remainder accrual** when `totalDuration` is not divisible by `interval`.
2. **Closed-Form Inverse Solution:**
   - **Maturity Target:** `Principal = Target / maturityFactor` (for Simple and Compounded factors respectively).
   - **Net Profit Goal:** `Principal = TargetProfit / netProfitFactor`.
   - **Monthly Income:**
     - Regular Monthly Payout: `Principal = TargetMonthly / ((annualRate × (1 - taxRate / 100)) / 1200)`.
     - Reinvested Avg: `Principal = (TargetMonthly × totalDuration) / compoundedNetProfitFactor`.
3. **Positive Net Yield Guardrail (`isAchievable`):**
   - For `monthly_income` and `net_profit` (when `targetAmount > 0`), `annualRate > 0%` and `taxRate < 100%` are required; otherwise an amber warning (**`Positive Net Return Required`**) is shown instead of dividing by zero.
4. **Forward Verification:**
   - Both solved principals (`simpleRequiredPrincipal` and `compoundedRequiredPrincipal`) are fed back into `calculateFDRComparison` (`simpleVerification` and `compoundedVerification`) so the Gross Interest, Tax Deducted, Net Profit, and Exact Monthly Income / Final Maturity values displayed in Cards A & B reconcile directly.

---

## 4. Results, Actions & Export Functionality

- **Hero Answer Banner:**
  - Shows primary Required Principal rounded cleanly (`simpleRequiredPrincipal` for Monthly Income, `compoundedRequiredPrincipal` when compounded for Maturity / Net Profit, `simpleRequiredPrincipal` when Flat).
  - When compounding reduces capital needed (`principalSaved > 1 && !isFlat`), displays a **Capital Saved vs Flat FDR** callout showing how much less upfront deposit is required.
- **Dual Strategy Comparison Cards:**
  - **Card A (`Regular Monthly Payout` / `Flat (Simple Interest) FDR`):** Required initial deposit + verified Gross Interest, Tax Deducted, Net Profit Earned, and **Exact Monthly Net Income** or **Final Maturity Total**.
  - **Card B (`Reinvested Avg` / `Reinvested FDR`):** Required initial deposit + verified Gross Interest, Tax Deducted, Total Net Profit Earned, and **Final Maturity Value**.
- **Cross-Tool Cycle Transfer (`Open & Inspect Cycle Schedule`):**
  - Sends the rounded required deposit and parameters directly into **Single Plan** so you can view its chart and cycle-by-cycle schedule ledger.
- **Share Link, Statement, Print & Persistence:**
  - **Copy Share Link:** Encodes `#fdr-goal?goalType=...&target=...&duration=...&interval=...&rate=...&tax=...&currency=...`.
  - **Statement Modal (`SummaryExportModal`):** Outputs a formatted **Reverse / Goal FDR Summary** (`Copy` or `Save .txt` as `FDR_Goal_Statement_<CODE>.txt`).
  - **Reset:** Restores `DEFAULT_GOAL_INPUTS` (`monthly_income`, `10,000`, `36M`, `3M`, `9.5%`, `15%`).
  - **Persistence:** Saved in `localStorage` under `bankinfo_fdr_goal_v1`.

