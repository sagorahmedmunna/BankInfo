# BankInfo Calculate — Financial & Banking Calculator Suite

A modern, responsive, 100% client-side financial planning web application built with **React 19**, **Vite 6**, and **Tailwind CSS v4**. Designed to simulate Fixed Deposit Receipt (FDR) reinvestment earnings, compare multiple bank FDR schemes side by side, and calculate Credit Card & Bank Loan EMIs directly in the browser with complete privacy and offline support.

No backend server or external API is required — all calculations, visualizations, exports, and preferences run and persist locally in your browser.

---

## Key Features

### 1. Landing Dashboard & Per-Mode Guides (`HomePage`, `HowItWorksModal`, `FdrModeGuide`)
- Unified launchpad for **FDR Reinvestment Calculator**, **Compare Multiple FDRs**, **Goal / Reverse FDR Planner**, and **Credit Card & Loan EMI Calculator**.
- Dedicated **How It Works** guide tabs and in-page **Works & Functionality** cards tailored separately for **FDR Single Plan**, **Compare Multiple FDRs**, and **Goal / Reverse FDR Planner** (auto-selecting the active mode's guide, dismissible via close button, backdrop click, or `Escape`).

Detailed per-mode Markdown guides are also available in `docs/`:
- [FDR Single Plan Guide](docs/fdr-single-plan-guide.md)
- [Compare Multiple FDRs Guide](docs/fdr-compare-guide.md)
- [Goal / Reverse FDR Planner Guide](docs/fdr-goal-planner-guide.md)

### 2. Single-Plan FDR Reinvestment Calculator
- **One-Time Flat vs. Periodic Compounding**:
  - Select **`None (Flat)`** (`0`-month interval) for single-maturity calculation, paired with an automatic 3-month compounding preview card.
  - Or choose **`1M` (Monthly)**, **`3M` (Quarterly)**, **`6M` (Half-Yearly)**, **`12M` (Annual)**, or a custom renewal interval to simulate compounding reinvestment cycles.
- **Interactive Controls (`InputPanel`)**:
  - Sliders and decimal-safe numeric inputs with currency-aware quick chips (`Lakh` for BDT/INR, `k`/`M` for international currencies) for Deposit Amount, Duration (`1M`–`5Y` chips, `1`–`120` slider, up to `600` months input), Renewal Interval, Annual Interest Rate (`7.5%`–`12%`), and Tax Rate at source (`0%` Exempt, `5%` Rebate, `10%` TIN/Filer, `15%` Non-Filer, `20%` Corporate).
  - 4 quick preset scenarios (`Standard 1Y @ 3M`, `Growth 3Y @ 3M`, `Semi-Annual 2Y @ 6M`, `Monthly 1Y`), plus one-click **Share** link generation.
- **Analytics, Schedules & Exports**:
  - **Comparison Cards (`ComparisonCards`)**: Reinvestment advantage highlight banner (`+net extra`, percentage boost, Net APY) alongside detailed breakdowns of Principal, Gross Interest, Tax Deducted, Net Profit, and Final Maturity Payout.
  - **Visual Charts (`VisualChart`)**: Stacked payout bars and interactive hover/tap/keyboard-enabled cycle progression chart.
  - **Cycle Schedule Table (`CycleScheduleTable`)**: Collapsible cycle-by-cycle ledger (`Opening Principal`, `Gross Interest`, `Tax Deducted`, `Net Added`, `Closing Principal`, including any final pro-rata stub period) with one-click **CSV Export**.
  - **Summary Statement (`SummaryExportModal`)**: Formatted plain-text investment statement supporting **Single Plan**, **Multi-FDR Comparison**, and **Goal / Reverse FDR** modes with **Copy**, **Save `.txt`**, and **Share Link** buttons, plus dedicated `.print-only` print/PDF styling (`Ctrl+P` / `Cmd+P`) with automatic light-mode enforcement.

### 3. Multi-FDR Comparison Table (`MultiFdrComparison`)
- **1-FDR-per-Row Editable Grid**: Compare **2 to 5 FDR offers** simultaneously in a clear horizontal table (`Add`, `Duplicate`, `Remove`, `Export CSV`, `Statement`, `Share Link`, or `Inspect` any row's full cycle schedule in the single-plan view).
- **Flexible & Custom Renewal Intervals + Tax Modes**: Supports `None (One-Time Flat)`, `1 Mo (Monthly)`, `3 Mo (Quarterly)`, `6 Mo (Semi-Annual)`, `12 Mo (Annual)`, and **`Custom (Months)...`** numeric intervals (`0`–`600` months, e.g., `4M` or `9M`), plus editable custom tax rates (`0%`–`100%`) and quick `0%`, `10% TIN`, `15% No` presets per row.
- **Unified Table-Header Column Sync**:
  - Dedicated **Sync Column Values** row embedded inside `<thead>` directly aligned with the column headers (`Deposit`, `Tenure (Duration)`, `Renewal Interval`, `Annual Rate`, `Tax Rate`).
  - Toggle any parameter column `ON` to lock and propagate edits across all rows simultaneously (with `Unsync All` quick clear).
- **Positive Comparison & Visual Insights**:
  - **Net Profit** column displays net return alongside `Gross` earned and `Tax` deducted; **Maturity Total** displays total final payout cleanly.
  - **vs Minimum** column highlights the **🏆 Winner** / **🏆 Tied #1** / **Equal Return** badges and shows each better-performing plan's positive advantage (`+amount` and `% more`) above the minimum plan.
  - **1-Click Presets**: `Bank Interest Rates`, `Compounding Frequency`, `TIN Tax Impact (10% vs 15%)`, and `Tenure Horizons (1Y vs 2Y vs 3Y)`.
  - **Top Performing Banner** and **Principal vs. Net Profit** stacked comparison bars, plus full-width print expansion via `.print-table-wrap`.

### 4. Goal / Reverse FDR Planner (`GoalFdrPanel`)
- **3 Reverse Target Modes**: Solve backwards for the exact starting deposit required to:
  1. Earn a **Monthly Net Income** target (e.g., ৳10,000/mo passive income).
  2. Reach a **Final Maturity Total** goal (e.g., ৳500,000 in 3 years).
  3. Generate a **Target Total Net Profit** over your chosen tenure.
- **Side-by-Side Principal Comparison**: Shows both **Regular Payout (Simple)** vs **Reinvested (Compounded)** required capital and highlights capital saved from compounding, with forward verification metrics and one-click **`Open & Inspect Cycle Schedule`** transfer to Single-Plan FDR mode.

### 5. Credit Card & Bank Loan EMI Calculator (`EmiPage`)
- **Credit Card Plans Mode**:
  - Compares standard merchant installment tenures (`3M`, `6M`, `9M`, `12M`, `18M`, `24M`, `36M`) with inline customizable fee/rate inputs per tenure, **Effective Annualized APR (`Eff. APR`) & EAR** columns, and benchmark rate reset.
  - **`0% Zero-Interest EMI`** switch to waive processing fees across plans.
  - **`Single Plan Mode`** toggle to hide the multi-tenure grid and compute a single custom duration and processing rate (`Plan Duration`, `Rate`, `Monthly Installment`, `Total Bank Charge`, `Eff. APR`, `Effective Total Cost`).
  - **Credit Card EMI vs. Cash Upfront (FDR Opportunity Cost)**: Compares taking the merchant EMI vs. paying cash upfront and keeping funds in an FDR (showing the true reducing-balance nominal APR/EAR, self-funded sinking-fund drawdown net gain/loss, break-even gross/net FDR rate, and locked full-principal FDR reference).
  - Clickable & keyboard-accessible table row selection, quick amount presets, **Share Link**, and **CSV Export** (including APR columns).
- **Bank Loan EMI Mode**:
  - Reducing-balance loan calculator for personal, auto, and home loans.
  - Quick amount buttons (`50k` to `1M`), interest rate slider & quick rate chips (`0%`–`14%`), and tenure slider (`1M`–`360M`) & quick duration chips (`6M`–`20Y`), outputting **Monthly EMI**, **Principal**, **Total Interest**, **Total Payment**, a **Principal vs. Interest breakdown bar** (with amounts & percentages), **Share Link**, and a collapsible **Yearly / Monthly Amortization Schedule** with **CSV Export** and unclipped print/PDF output.

### 6. Global Experience, Shareable URLs & Browser Persistence
- **10 Supported Currencies (`CURRENCIES`)**: `BDT (৳)`, `USD ($)`, `EUR (€)`, `GBP (£)`, `INR (₹)`, `JPY (¥)`, `CAD (C$)`, `AUD (A$)`, `AED`, and `SAR`.
- **Light & Dark Mode**: Instant theme switching with zero-flash initial script in `index.html`.
- **100% Client-Side Shareable Scenario Links (`shareLink.js`)**: Copy complete URLs preserving view, currency, and inputs via hash parameters (`#fdr?...`, `#fdr-compare?plans=...`, `#fdr-goal?...`, `#emi?...`).
- **Automatic Local Persistence**: Saves active view, currency, theme, FDR inputs, Goal inputs, Multi-FDR table rows & column sync locks, schedule expand state, and EMI configuration in `localStorage`.

---

## Tech Stack

- **Framework**: React `^19.0.0` (`react`, `react-dom`)
- **Build Tool**: Vite `^6.2.0` (`@vitejs/plugin-react`)
- **Styling**: Tailwind CSS `^4.0.9` (`@tailwindcss/vite`, `clsx`, `tailwind-merge`)
- **Icons**: Lucide React `^1.16.0`

---

## Project Structure

```text
BankInfo/
├── index.html                          # Entry HTML, Google Fonts & flash-free theme initializer
├── package.json                        # Scripts and dependencies
├── vite.config.js                      # Vite + React + Tailwind v4 configuration
├── docs/
│   ├── fdr-single-plan-guide.md        # User guide & functionality reference for FDR Single Plan
│   ├── fdr-compare-guide.md            # User guide & functionality reference for Compare Multiple FDRs
│   └── fdr-goal-planner-guide.md       # User guide & functionality reference for Goal / Reverse FDR Planner
└── src/
    ├── main.jsx                        # React root mount
    ├── index.css                       # Global Tailwind import & custom animations/print utilities
    ├── App.jsx                         # Root router/state manager (Home, FDR Single/Compare/Goal, EMI)
    ├── data/
    │   └── fdrGuides.js                # Structured per-mode guide content (Single, Compare, Goal)
    ├── components/
    │   ├── Header.jsx                  # Sticky top navigation, currency selector, statement, share, print & theme toggle
    │   ├── HomePage.jsx                # Dashboard overview & calculator launch cards
    │   ├── InputPanel.jsx              # Single-plan FDR sliders, numeric inputs, presets, share & tax chips
    │   ├── ComparisonCards.jsx         # Single-plan hero banners & Simple vs. Reinvested FDR cards
    │   ├── VisualChart.jsx             # Stacked comparison bars & interactive cycle growth chart
    │   ├── CycleScheduleTable.jsx      # Compounding cycle table & CSV export
    │   ├── MultiFdrComparison.jsx      # Editable 1-FDR-per-row table (with custom intervals), column sync header, presets & chart
    │   ├── GoalFdrPanel.jsx            # Reverse / Goal FDR planner for income, maturity & profit targets
    │   ├── EmiPage.jsx                 # Credit Card EMI (+ Effective APR & FDR Opportunity Cost) & Bank Loan EMI page
    │   ├── FdrModeGuide.jsx            # Contextual per-mode inline guide & functionality overview
    │   ├── HowItWorksModal.jsx         # Tabbed per-mode interactive guide modal (Single Plan, Compare, Goal)
    │   └── SummaryExportModal.jsx      # Copyable / downloadable text investment summary & share modal
    └── utils/
        ├── csvExport.js                # Shared RFC-4180 CSV escaping & Blob download utility
        ├── fdrCalculator.js            # Simple, Compounded, Multi-FDR ranking & Reverse Goal engine
        ├── emiCalculator.js            # Merchant EMI, Effective APR, FDR opportunity cost & Loan amortization engine
        ├── shareLink.js                # Client-side URL hash/query codec & clipboard helper
        └── formatters.js               # Currency metadata & locale number/currency formatters
tests/
└── calculators.test.js                 # Node built-in unit tests for math, formatters & CSV export
```

---

## Getting Started

### Prerequisites
- **Node.js** v18 or higher
- **npm**

### Install & Run Development Server
```bash
npm install
npm run dev
```
Open the local URL printed by Vite (typically `http://localhost:5173`).

### Run Unit Tests
```bash
npm test
```

### Production Build & Preview
```bash
npm run build
npm run preview
```
Production static assets are emitted to `dist/` and can be deployed to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, etc.).

---

## Browser Storage Keys

The app stores state locally under the following `localStorage` keys:
- `bankinfo_theme` — `'light'` or `'dark'` theme preference
- `bankinfo_currency` — selected currency code (e.g., `'BDT'`, `'USD'`)
- `bankinfo_active_page` / `bankinfo_fdr_mode` — last visited page (`'home'`, `'fdr'`, `'emi'`) and FDR mode (`'single'`, `'compare'`, `'goal'`)
- `bankinfo_fdr_inputs_v2` — Single-plan FDR inputs
- `bankinfo_fdr_schedule_expanded` — Cycle schedule collapse state
- `bankinfo_multi_fdr_schemes_v1` — Multi-FDR table rows
- `bankinfo_multi_fdr_sync_v1` — Column sync locks (`amount`, `totalDuration`, `interval`, `annualRate`, `taxRate`)
- `bankinfo_fdr_goal_v1` — Goal / Reverse FDR planner inputs
- `bankinfo_emi_state_v1` — EMI calculator mode, rates, custom plan, FDR opportunity cost settings, and loan inputs

---

## Mathematical Formulations

### 1. Simple / One-Time Flat FDR
$$\text{durationInYears} = \frac{\text{totalDuration}}{12}$$
$$\text{grossInterest} = \frac{\text{amount} \times \text{annualRate} \times \text{durationInYears}}{100}$$
$$\text{tax} = \frac{\text{grossInterest} \times \text{taxRate}}{100}$$
$$\text{netInterest} = \text{grossInterest} - \text{tax}, \qquad \text{totalAmount} = \text{amount} + \text{netInterest}$$

### 2. Compounded Reinvestment FDR
When $\text{interval} > 0$:
$$\text{cycles} = \left\lfloor \frac{\text{totalDuration}}{\text{interval}} \right\rfloor, \qquad \text{remainingMonths} = \text{totalDuration} - (\text{cycles} \times \text{interval}), \qquad \text{intervalInYears} = \frac{\text{interval}}{12}$$

For each renewal cycle $i = 1, \dots, \text{cycles}$:
$$\text{cycleGross} = \frac{P \times \text{annualRate} \times \text{intervalInYears}}{100}$$
$$\text{cycleTax} = \frac{\text{cycleGross} \times \text{taxRate}}{100}$$
$$P \leftarrow P + (\text{cycleGross} - \text{cycleTax})$$

If $\text{remainingMonths} > 0$, a final pro-rata settlement is accrued for $\text{remainingMonths}/12$ years on $P$ at maturity.

Effective Net APY (used across Single & Multi-FDR rankings):
$$\text{Net APY} = \left(\left(\frac{\text{totalAmount}}{\text{amount}}\right)^{\frac{1}{\text{durationInYears}}} - 1\right) \times 100$$

### 3. Reverse / Goal FDR Principal Solver
Using unit-principal growth factors ($g_{\text{net}}$ for net profit per unit principal, $m = 1 + g_{\text{net}}$ for maturity per unit principal over `totalDuration`):
$$\text{Principal}_{\text{maturity}} = \frac{\text{Target}}{m}, \qquad \text{Principal}_{\text{profit}} = \frac{\text{TargetProfit}}{g_{\text{net}}}$$
$$\text{Principal}_{\text{monthly income (simple)}} = \frac{\text{TargetMonthly}}{\frac{\text{netAnnualRate}}{1200}}, \qquad \text{Principal}_{\text{monthly income (compounded)}} = \frac{\text{TargetMonthly} \times \text{totalDuration}}{g_{\text{net, comp}}}$$

### 4. Credit Card Installments, Effective APR & Reducing-Balance Bank Loan EMI
**Credit Card / Merchant Plan** (for tenure $n$ months and flat fee percentage $r$):
$$\text{charge} = \frac{\text{amount} \times r}{100}, \qquad \text{effectiveCost} = \text{amount} + \text{charge}, \qquad \text{EMI} = \frac{\text{effectiveCost}}{n}$$
Effective reducing-balance monthly rate $i_{\text{eff}}$ solves $\text{amount} = \sum_{t=1}^{n} \frac{\text{EMI}}{(1 + i_{\text{eff}})^t}$ via 80-step bisection, giving:
$$\text{Nominal APR} = 12 \cdot i_{\text{eff}} \times 100, \qquad \text{EAR} = \left((1 + i_{\text{eff}})^{12} - 1\right) \times 100$$

**Standard Reducing-Balance Bank Loan** (for principal $P$, annual rate $R\%$, tenure $n$ months):
$$i = \frac{R}{12 \times 100}, \qquad \text{EMI} = \begin{cases} \dfrac{P}{n}, & i = 0 \\ \dfrac{P \cdot i (1 + i)^n}{(1 + i)^n - 1}, & i > 0 \end{cases}$$
$$\text{totalPayment} = \text{EMI} \times n, \qquad \text{totalInterest} = \text{totalPayment} - P$$
