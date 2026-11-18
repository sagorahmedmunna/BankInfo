/**
 * Structured in-app documentation for each FDR calculator mode.
 * Used by HowItWorksModal (tabbed manual) and FdrModeGuide (per-mode inline guide).
 */

export const FDR_GUIDE_ORDER = ['single', 'compare', 'goal'];

export const FDR_GUIDES = {
  single: {
    id: 'single',
    title: 'FDR Single Plan',
    modalSubtitle: 'One-Time Flat vs. Periodic Compounding Reinvestment',
    ctaLabel: 'Open Single Plan',
    badge: 'Core Simulator',
    overviewTitle: 'What Single Plan Does',
    overviewText:
      'Simulates a single Fixed Deposit Receipt (FDR) and compares holding a One-Time Flat deposit against automatically reinvesting net post-tax interest every cycle.',
    concepts: [
      {
        title: '1. One-Time Flat FDR (Simple)',
        description:
          'Set interval to None (Flat / 0). Interest is calculated once on your initial principal for the full tenure, tax is deducted at maturity, and profit is paid as a lump sum.',
        highlight: false,
      },
      {
        title: '2. Reinvested FDR (Compounded)',
        description:
          'Choose a renewal interval (1M, 3M, 6M, 12M, or custom months). After each cycle, tax is deducted and net profit rolls into principal—so subsequent cycles earn interest on a larger balance.',
        highlight: true,
      },
    ],
    steps: [
      {
        title: 'Pick a Scenario or Enter Deposit Amount',
        description:
          'Start with any Quick Scenario (Standard 1Y @ 3M, Growth 3Y @ 3M, Semi-Annual 2Y @ 6M, or Monthly DPS-style) or enter your principal using the box and quick currency chips.',
      },
      {
        title: 'Set Total Duration & Reinvestment Interval',
        description:
          'Adjust duration (1–120 months on slider, up to 600 months typed) and renewal frequency (0 for Flat, 1M/3M/6M/12M presets, or any custom month count). Non-divisible remainders accrue pro-rata at maturity.',
      },
      {
        title: 'Configure Annual Interest Rate & Tax Bracket',
        description:
          'Set the bank rate (e.g. 9% p.a.; 7.5%–12% chips) and withholding tax rate (0% Exempt, 5% Rebate, 10% TIN/Filer, 15% Non-Filer, 20% Corporate, or custom 0%–100%).',
      },
    ],
    features: [
      {
        title: 'Hero Advantage Banner & Net APY',
        description:
          'Shows extra net profit earned from compounding, percentage return boost, and post-tax Net Effective APY (or a 3-month compounding preview button when Flat is active).',
      },
      {
        title: 'Side-by-Side Breakdown Cards',
        description:
          'Compares Simple vs. Reinvested FDR side by side across Initial Principal, Gross Interest, Tax Deducted, Net Interest Earned, and Final Maturity Payout.',
      },
      {
        title: 'Interactive Visual Progression',
        description:
          'Displays stacked Principal vs. Net Profit bars and interactive cycle-step tiles you can hover, click, or keyboard-focus to inspect opening and closing balances.',
      },
      {
        title: 'Cycle Ledger, CSV, Statement & Share',
        description:
          'Inspect every cycle (including pro-rata stub periods) in the collapsible schedule table, export to CSV, copy/save a .txt Statement, Print/PDF, or share a parameterized URL.',
      },
    ],
    tip:
      'If your reinvestment interval meets or exceeds your total duration, no mid-term renewal happens and the deposit settles as a single pro-rata term matching Flat maturity payout.',
  },

  compare: {
    id: 'compare',
    title: 'Compare Multiple FDRs',
    modalSubtitle: 'Side-by-Side Ranking for 2 to 5 Bank Offers',
    ctaLabel: 'Open Compare Tool',
    badge: '2–5 Schemes',
    overviewTitle: 'What Compare Multiple Does',
    overviewText:
      'Lets you evaluate 2 to 5 FDR offers in an editable 1-plan-per-row spreadsheet, rank every scheme automatically by Net Profit, and quantify exact cash differences.',
    concepts: [
      {
        title: '1. Independent Per-Row Offers',
        description:
          'Customize each row independently—bank name, deposit amount, tenure (months), renewal interval (including Custom months), annual rate (+/- 0.25% steppers), and tax bracket (0%, 10% TIN, 15% No, or custom).',
        highlight: false,
      },
      {
        title: '2. Table-Header Column Sync Locks',
        description:
          'Toggle Sync ON in any parameter column (Deposit, Tenure, Interval, Rate, or Tax) to lock all rows to the same value automatically when isolating how one variable affects returns.',
        highlight: true,
      },
    ],
    steps: [
      {
        title: 'Load a 1-Click Preset or Add Rows (2–5)',
        description:
          'Choose presets like Bank Interest Rates, Compounding Frequency, TIN Tax Impact (10% vs 15%), or Tenure Horizons, or use Add FDR Row / Duplicate Row to build up to 5 schemes.',
      },
      {
        title: 'Optionally Lock Shared Columns with Sync',
        description:
          'Turn Sync ON for columns you want held equal across banks (for example Deposit and Tenure) while leaving Interest Rate or Compounding Interval unlocked to compare fairly.',
      },
      {
        title: 'Review Rankings, Gaps & Full Cycle Inspection',
        description:
          'Check Rank #1 Winner (or Tied #1 / Equal Return badges), Net APY, and vs Minimum cash advantage. Click the Inspect icon on any row to load it directly into Single Plan.',
      },
    ],
    features: [
      {
        title: 'Custom Intervals & Remainder Awareness',
        description:
          'Supports Flat (None), 1M, 3M, 6M, 12M, or Custom (Months)... (e.g., 4M or 9M) with live badges indicating One-Time Flat, Single Term, or Reinvests (+ pro-rata).',
      },
      {
        title: 'Winner Highlight Banner & Rank Badges',
        description:
          'Automatically crowns the top Net Profit performer (handling ties accurately) and computes exact currency and percentage gains over the lowest-yielding scheme.',
      },
      {
        title: 'Visual Stacked Comparison Bars',
        description:
          'Color-codes every row (Emerald, Sky, Indigo, Amber, Rose) so Principal vs. Net Profit differences stand out visually at a glance.',
      },
      {
        title: '13-Column CSV, Statement & Compact Share URL',
        description:
          'Export the complete ranked grid to CSV, generate a Multi-FDR text Statement, Print/PDF full width, or copy a compact Base64URL share link preserving all rows and active Sync locks.',
      },
    ],
    tip:
      'Use the Inspect button in the Actions column on any row to transfer that offer into Single Plan and view its cycle-by-cycle compounding ledger.',
  },

  goal: {
    id: 'goal',
    title: 'Goal / Reverse FDR Planner',
    modalSubtitle: 'Calculate the Exact Deposit Needed for Your Target',
    ctaLabel: 'Open Goal Planner',
    badge: 'Reverse Solver',
    overviewTitle: 'What Goal Planner Does',
    overviewText:
      'Works backwards from your financial target—desired Monthly Passive Income, Final Maturity Balance, or Total Net Profit—to compute the exact initial FDR deposit required.',
    concepts: [
      {
        title: '1. Monthly Income & Flat Payout Path',
        description:
          'For Monthly Income goals, Regular Monthly Payout solves the principal needed to generate your target post-tax profit every month immediately without touching principal.',
        highlight: false,
      },
      {
        title: '2. Compounded Maturity & Profit Path',
        description:
          'For Maturity Targets and Net Profit Goals (or multi-year reinvested averages), Reinvested FDR calculates how much less upfront deposit is required thanks to periodic compounding.',
        highlight: true,
      },
    ],
    steps: [
      {
        title: 'Select Your Goal Type & Target Amount',
        description:
          'Pick Monthly Income (default 10,000/mo), Maturity Target (default 500,000), or Net Profit Goal (default 100,000), then enter your target or click a quick-target chip.',
      },
      {
        title: 'Set Timeframe, Compounding Interval & Tax',
        description:
          'Choose horizon duration (6M–10Y chips, 1–120 slider, up to 600 months), reinvestment frequency (Flat 0, 1M, 3M, 6M, 12M, or custom), gross interest rate, and tax rate.',
      },
      {
        title: 'Verify Both Strategies & Inspect Cycles',
        description:
          'Review the Hero Required Deposit, Capital Saved vs Flat FDR, forward-verified Interest/Tax cards, and click Open & Inspect Cycle Schedule to verify cycles in Single Plan.',
      },
    ],
    features: [
      {
        title: 'Unit-Principal Solver + Forward Verification',
        description:
          'Probes exact compounded/pro-rata yield factors (including stub months) and immediately runs a forward FDR check so every Gross, Tax, Net, and Maturity figure reconciles.',
      },
      {
        title: 'Upfront Capital Saved Callout',
        description:
          'When compounding reduces the required starting deposit compared to a Flat FDR, the Hero Banner quantifies the exact upfront capital saved.',
      },
      {
        title: 'Positive Yield Guardrail',
        description:
          'Monthly Income and Net Profit goals check that Annual Rate > 0% and Tax < 100% (displaying a clear alert if unachievable), while Maturity Target gracefully falls back to Principal = Target at 0% net return.',
      },
      {
        title: 'Transfer to Single Plan, Statement & Share Link',
        description:
          'One-click transfer loads the solved deposit into Single Plan, while Statement (.txt), Print/PDF, and #fdr-goal share links preserve your exact target and tax settings.',
      },
    ],
    tip:
      'In Monthly Income mode, "Regular Monthly Payout" shows the principal needed to withdraw income every month, whereas "Reinvested Avg" shows the lower deposit if profit stays inside to compound across the full horizon.',
  },
};

