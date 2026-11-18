/**
 * FDR (Fixed Deposit Receipt) Interest & Reinvestment Calculation Engine
 */

export const MAX_FDR_DURATION_MONTHS = 600;

function clampNonNegative(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

function clampRate(value, max = 100) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.min(max, num);
}

function clampDuration(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.min(MAX_FDR_DURATION_MONTHS, num);
}

/**
 * Calculates simple net interest after deducting tax.
 *
 * @param {number} amount        Initial principal deposit
 * @param {number} totalDuration Total duration in months
 * @param {number} annualRate    Annual interest rate in % (e.g., 9 for 9%)
 * @param {number} taxRate       Tax rate on interest in % (e.g., 10 for 10%)
 */
export function calculateSimpleNetInterest(amount, totalDuration, annualRate, taxRate) {
  const safeAmount = clampNonNegative(amount);
  const safeDuration = clampDuration(totalDuration);
  const safeRate = clampNonNegative(annualRate);
  const safeTax = clampRate(taxRate, 100);

  if (safeAmount <= 0 || safeDuration <= 0 || safeRate <= 0) {
    return {
      grossInterest: 0,
      tax: 0,
      netInterest: 0,
      totalAmount: safeAmount,
      durationInYears: safeDuration / 12.0,
    };
  }

  const durationInYears = safeDuration / 12.0;
  const grossInterest = (safeAmount * safeRate * durationInYears) / 100.0;
  const tax = (grossInterest * safeTax) / 100.0;
  const netInterest = grossInterest - tax;
  const totalAmount = safeAmount + netInterest;

  return {
    grossInterest,
    tax,
    netInterest,
    totalAmount,
    durationInYears,
  };
}

/**
 * Simulates FDR reinvestment at fixed intervals.
 * At the end of each full interval, net interest (post-tax) is added to the principal.
 * Any remaining partial period before maturity accrues pro-rata simple net interest
 * on the latest balance so no deposit duration is silently dropped.
 *
 * @param {number} amount        Initial principal deposit
 * @param {number} totalDuration Total duration in months
 * @param {number} interval      FDR interval duration in months
 * @param {number} annualRate    Annual interest rate in %
 * @param {number} taxRate       Tax rate on interest in %
 */
export function calculateCompoundedFDR(amount, totalDuration, interval, annualRate, taxRate) {
  const safeAmount = clampNonNegative(amount);
  const safeDuration = clampDuration(totalDuration);
  const safeInterval = clampDuration(interval);
  const safeRate = clampNonNegative(annualRate);
  const safeTax = clampRate(taxRate, 100);

  if (safeAmount <= 0 || safeDuration <= 0 || safeInterval <= 0 || safeRate <= 0) {
    return {
      cycles: 0,
      hasPartialCycle: false,
      cyclesList: [],
      totalGrossInterest: 0,
      totalTax: 0,
      netInterest: 0,
      totalAmount: safeAmount,
      remainingMonths: 0,
      intervalInYears: safeInterval / 12.0,
    };
  }

  let currentPrincipal = safeAmount;
  const cycles = Math.floor(safeDuration / safeInterval);
  const remainingMonths = Number((safeDuration - cycles * safeInterval).toFixed(6));
  const intervalInYears = safeInterval / 12.0;

  const cyclesList = [];
  let totalGrossInterest = 0;
  let totalTax = 0;

  for (let i = 0; i < cycles; ++i) {
    const openingPrincipal = currentPrincipal;
    const cycleGrossInterest = (currentPrincipal * safeRate * intervalInYears) / 100.0;
    const cycleTax = (cycleGrossInterest * safeTax) / 100.0;
    const cycleNetInterest = cycleGrossInterest - cycleTax;

    currentPrincipal += cycleNetInterest;
    totalGrossInterest += cycleGrossInterest;
    totalTax += cycleTax;

    cyclesList.push({
      cycleIndex: i + 1,
      isPartial: false,
      durationMonths: safeInterval,
      startMonth: i * safeInterval,
      endMonth: (i + 1) * safeInterval,
      openingPrincipal,
      cycleGrossInterest,
      cycleTax,
      cycleNetInterest,
      closingPrincipal: currentPrincipal,
      cumulativeNetInterest: currentPrincipal - safeAmount,
    });
  }

  const hasPartialCycle = remainingMonths > 1e-6;
  if (hasPartialCycle) {
    const openingPrincipal = currentPrincipal;
    const partialYears = remainingMonths / 12.0;
    const partialGrossInterest = (currentPrincipal * safeRate * partialYears) / 100.0;
    const partialTax = (partialGrossInterest * safeTax) / 100.0;
    const partialNetInterest = partialGrossInterest - partialTax;

    currentPrincipal += partialNetInterest;
    totalGrossInterest += partialGrossInterest;
    totalTax += partialTax;

    cyclesList.push({
      cycleIndex: cycles + 1,
      isPartial: true,
      durationMonths: remainingMonths,
      startMonth: cycles * safeInterval,
      endMonth: safeDuration,
      openingPrincipal,
      cycleGrossInterest: partialGrossInterest,
      cycleTax: partialTax,
      cycleNetInterest: partialNetInterest,
      closingPrincipal: currentPrincipal,
      cumulativeNetInterest: currentPrincipal - safeAmount,
    });
  }

  const netInterest = currentPrincipal - safeAmount;
  const totalAmount = currentPrincipal;

  return {
    cycles,
    hasPartialCycle,
    remainingMonths: hasPartialCycle ? remainingMonths : 0,
    intervalInYears,
    cyclesList,
    totalGrossInterest,
    totalTax,
    netInterest,
    totalAmount,
  };
}

/**
 * Full comparative summary and reporting differences.
 */
export function calculateFDRComparison({
  amount = 100000,
  totalDuration = 12,
  interval = 3,
  annualRate = 9,
  taxRate = 15,
}) {
  const numAmount = clampNonNegative(amount);
  const numDuration = clampDuration(totalDuration);
  const rawInterval = interval === '' || interval === null || interval === undefined ? 0 : Number(interval);
  const numInterval = !Number.isFinite(rawInterval) || rawInterval < 0 ? 0 : Math.min(MAX_FDR_DURATION_MONTHS, rawInterval);
  const numRate = clampNonNegative(annualRate);
  const numTax = clampRate(taxRate, 100);

  const isFlat = numInterval === 0;
  const simple = calculateSimpleNetInterest(numAmount, numDuration, numRate, numTax);
  const compounded = isFlat
    ? {
        cycles: 0,
        hasPartialCycle: false,
        remainingMonths: 0,
        intervalInYears: numDuration / 12.0,
        cyclesList: [],
        totalGrossInterest: simple.grossInterest,
        totalTax: simple.tax,
        netInterest: simple.netInterest,
        totalAmount: simple.totalAmount,
      }
    : calculateCompoundedFDR(numAmount, numDuration, numInterval, numRate, numTax);

  const rawDiff = isFlat ? 0 : compounded.netInterest - simple.netInterest;
  const interestDifference = Math.abs(rawDiff) < 1e-9 ? 0 : rawDiff;
  const gainPercentage = !isFlat && simple.netInterest > 0
    ? (interestDifference / simple.netInterest) * 100
    : 0;

  const durationInYears = numDuration / 12.0;
  const targetAmount = isFlat ? simple.totalAmount : compounded.totalAmount;
  // Effective Annual Yield (net of tax)
  const netEffectiveApy = durationInYears > 0 && numAmount > 0
    ? (Math.pow(targetAmount / numAmount, 1 / durationInYears) - 1) * 100
    : 0;

  return {
    inputs: {
      amount: numAmount,
      totalDuration: numDuration,
      interval: numInterval,
      annualRate: numRate,
      taxRate: numTax,
      isFlat,
    },
    simple,
    compounded,
    difference: {
      interestDifference,
      gainPercentage,
      netEffectiveApy,
    },
  };
}

/**
 * Default FDR schemes for Multi-FDR comparison
 */
export const DEFAULT_COMPARED_SCHEMES = [
  {
    id: 'scheme-1',
    name: 'Bank A (Standard)',
    amount: 100000,
    totalDuration: 12,
    interval: 3,
    annualRate: 9.0,
    taxRate: 15,
    isCompounded: true,
  },
  {
    id: 'scheme-2',
    name: 'Bank B (High Yield)',
    amount: 100000,
    totalDuration: 12,
    interval: 3,
    annualRate: 9.75,
    taxRate: 15,
    isCompounded: true,
  },
  {
    id: 'scheme-3',
    name: 'Bank C (One-Time Flat)',
    amount: 100000,
    totalDuration: 12,
    interval: 0,
    annualRate: 9.5,
    taxRate: 15,
    isCompounded: false,
  },
];

/**
 * Pre-configured real-world comparison scenarios
 */
export const FDR_COMPARISON_PRESETS = [
  {
    id: 'bank-rates',
    title: 'Bank Interest Rates',
    description: 'Compare 3 different bank offers: 9.0% vs 9.75% vs 10.5%',
    badge: 'Popular',
    schemes: [
      { id: 'rate-1', name: 'Bank A (9.0%)', amount: 100000, totalDuration: 12, interval: 3, annualRate: 9.0, taxRate: 15, isCompounded: true },
      { id: 'rate-2', name: 'Bank B (9.75%)', amount: 100000, totalDuration: 12, interval: 3, annualRate: 9.75, taxRate: 15, isCompounded: true },
      { id: 'rate-3', name: 'Bank C (10.5%)', amount: 100000, totalDuration: 12, interval: 3, annualRate: 10.5, taxRate: 15, isCompounded: true },
    ],
  },
  {
    id: 'compounding-freq',
    title: 'Compounding Frequency',
    description: 'Same 9.5% rate: 1M Monthly vs 3M Quarterly vs 6M vs None (Flat)',
    badge: 'Insights',
    schemes: [
      { id: 'freq-1', name: 'Monthly Compounding (1M)', amount: 100000, totalDuration: 12, interval: 1, annualRate: 9.5, taxRate: 15 },
      { id: 'freq-2', name: 'Quarterly Compounding (3M)', amount: 100000, totalDuration: 12, interval: 3, annualRate: 9.5, taxRate: 15 },
      { id: 'freq-3', name: 'Semi-Annual (6M)', amount: 100000, totalDuration: 12, interval: 6, annualRate: 9.5, taxRate: 15 },
      { id: 'freq-4', name: 'One-Time Flat (None)', amount: 100000, totalDuration: 12, interval: 0, annualRate: 9.5, taxRate: 15 },
    ],
  },
  {
    id: 'tin-tax-impact',
    title: 'TIN Tax Impact (10% vs 15%)',
    description: 'See exact savings: With TIN (10% Tax) vs Without TIN (15% Tax)',
    badge: 'Tax Saving',
    schemes: [
      { id: 'tax-1', name: 'With TIN Certificate (10% Tax)', amount: 100000, totalDuration: 12, interval: 3, annualRate: 9.5, taxRate: 10, isCompounded: true },
      { id: 'tax-2', name: 'Without TIN (15% Tax)', amount: 100000, totalDuration: 12, interval: 3, annualRate: 9.5, taxRate: 15, isCompounded: true },
    ],
  },
  {
    id: 'tenure-horizon',
    title: 'Tenure Horizons (1Y vs 2Y vs 3Y)',
    description: 'Compare maturity growth across 1-year, 2-year, and 3-year commitments',
    badge: 'Tenure',
    schemes: [
      { id: 'tenure-1', name: '1 Year Plan (12M @ 9.0%)', amount: 100000, totalDuration: 12, interval: 3, annualRate: 9.0, taxRate: 15, isCompounded: true },
      { id: 'tenure-2', name: '2 Years Plan (24M @ 9.5%)', amount: 100000, totalDuration: 24, interval: 3, annualRate: 9.5, taxRate: 15, isCompounded: true },
      { id: 'tenure-3', name: '3 Years Plan (36M @ 10.0%)', amount: 100000, totalDuration: 36, interval: 3, annualRate: 10.0, taxRate: 15, isCompounded: true },
    ],
  },
];

const TIE_EPSILON = 0.005;

/**
 * Calculates and ranks multiple FDR schemes for comparative analysis
 */
export function calculateMultiFDRComparison(schemes = []) {
  if (!Array.isArray(schemes) || schemes.length === 0) {
    return {
      schemes: [],
      bestScheme: null,
      lowestScheme: null,
      winners: [],
      winnerCount: 0,
      isAllEqual: false,
      maxDifference: 0,
      maxDifferencePercent: 0,
    };
  }

  const evaluated = schemes.map((scheme, index) => {
    const amount = clampNonNegative(scheme.amount);
    const totalDuration = clampDuration(scheme.totalDuration);
    const rawInterval = scheme.interval !== undefined && scheme.interval !== null && scheme.interval !== '' ? Number(scheme.interval) : 3;
    // When interval is 0 or NaN, it calculates as a one-time flat FDR (no periodic renewal)
    const isCompounded = Number.isFinite(rawInterval) && rawInterval > 0 && scheme.isCompounded !== false;
    const calcInterval = isCompounded ? Math.min(MAX_FDR_DURATION_MONTHS, rawInterval) : 0;
    const annualRate = clampNonNegative(scheme.annualRate);
    const taxRate = clampRate(scheme.taxRate, 100);

    const baseComparison = calculateFDRComparison({
      amount,
      totalDuration,
      interval: calcInterval,
      annualRate,
      taxRate,
    });

    const activeResult = isCompounded ? baseComparison.compounded : baseComparison.simple;
    const grossInterest = isCompounded
      ? baseComparison.compounded.totalGrossInterest
      : baseComparison.simple.grossInterest;
    const tax = isCompounded
      ? baseComparison.compounded.totalTax
      : baseComparison.simple.tax;
    const netInterest = activeResult.netInterest;
    const totalAmount = activeResult.totalAmount;

    const durationInYears = totalDuration / 12.0;
    const netApy = durationInYears > 0 && amount > 0
      ? (Math.pow(totalAmount / amount, 1 / durationInYears) - 1) * 100
      : 0;

    return {
      ...scheme,
      index,
      amount,
      totalDuration,
      interval: calcInterval,
      annualRate,
      taxRate,
      isCompounded,
      grossInterest,
      tax,
      netInterest,
      totalAmount,
      netApy,
      cycles: isCompounded ? baseComparison.compounded.cycles : 1,
      simple: baseComparison.simple,
      compounded: baseComparison.compounded,
    };
  });

  // Sort by netInterest descending to determine rankings (ties share the same rank)
  const sorted = [...evaluated].sort((a, b) => b.netInterest - a.netInterest);
  const best = sorted[0];
  const lowest = sorted[sorted.length - 1];
  const maxDifference = best && lowest ? best.netInterest - lowest.netInterest : 0;
  const isAllEqual = sorted.length > 1 && maxDifference <= TIE_EPSILON;

  const enriched = evaluated.map((item) => {
    const diffVsBest = item.netInterest - (best ? best.netInterest : 0);
    const diffVsLowest = item.netInterest - (lowest ? lowest.netInterest : 0);
    const percentVsLowest = lowest && lowest.netInterest > 0
      ? (diffVsLowest / lowest.netInterest) * 100
      : 0;
    const rank = isAllEqual
      ? 1
      : 1 + sorted.filter((s) => s.netInterest - item.netInterest > TIE_EPSILON).length;

    return {
      ...item,
      diffVsBest,
      diffVsLowest,
      percentVsLowest,
      rank,
      isWinner: !isAllEqual && Boolean(best && Math.abs(best.netInterest - item.netInterest) <= TIE_EPSILON),
      isLowest: !isAllEqual && Boolean(lowest && Math.abs(item.netInterest - lowest.netInterest) <= TIE_EPSILON && sorted.length > 1),
    };
  });

  const winners = enriched.filter((s) => s.isWinner);
  const bestEnriched = winners[0] || enriched[0] || null;
  const lowestEnriched = enriched.find((s) => s.isLowest) || enriched[enriched.length - 1] || null;
  const maxDifferencePercent = best && lowest && lowest.netInterest > 0
    ? (maxDifference / lowest.netInterest) * 100
    : 0;

  return {
    schemes: enriched,
    bestScheme: bestEnriched,
    lowestScheme: lowestEnriched,
    winners,
    winnerCount: winners.length,
    isAllEqual,
    maxDifference,
    maxDifferencePercent,
  };
}

const UNIT_PRINCIPAL_PROBE = 1_000_000;

/**
 * Reverse / Goal FDR solver.
 * Solves for the starting deposit required to hit a target monthly net income,
 * final maturity balance, or total net profit over a chosen duration.
 *
 * @param {object} params
 * @param {'monthly_income'|'maturity'|'net_profit'} params.goalType
 * @param {number} params.targetAmount  Desired monthly income, maturity total, or net profit
 * @param {number} params.totalDuration Horizon in months (1-600)
 * @param {number} params.interval      Reinvestment interval in months (0 for flat)
 * @param {number} params.annualRate    Gross annual interest rate (%)
 * @param {number} params.taxRate       Tax rate on interest (%)
 */
export function calculateReverseFDRGoal({
  goalType = 'monthly_income',
  targetAmount = 10000,
  totalDuration = 36,
  interval = 3,
  annualRate = 9.5,
  taxRate = 15,
} = {}) {
  const safeGoalType =
    goalType === 'maturity' || goalType === 'net_profit' ? goalType : 'monthly_income';
  const safeTarget = clampNonNegative(targetAmount);
  const rawDuration = clampDuration(totalDuration);
  const safeDuration = rawDuration > 0 ? rawDuration : 12;
  const rawInterval =
    interval === '' || interval === null || interval === undefined ? 0 : Number(interval);
  const safeInterval =
    !Number.isFinite(rawInterval) || rawInterval < 0
      ? 0
      : Math.min(MAX_FDR_DURATION_MONTHS, rawInterval);
  const safeRate = clampNonNegative(annualRate);
  const safeTax = clampRate(taxRate, 100);

  const unitComparison = calculateFDRComparison({
    amount: UNIT_PRINCIPAL_PROBE,
    totalDuration: safeDuration,
    interval: safeInterval,
    annualRate: safeRate,
    taxRate: safeTax,
  });

  const simpleNetFactor = unitComparison.simple.netInterest / UNIT_PRINCIPAL_PROBE;
  const simpleMaturityFactor = unitComparison.simple.totalAmount / UNIT_PRINCIPAL_PROBE;
  const isFlat = safeInterval === 0;
  const compNetFactor =
    (isFlat ? unitComparison.simple.netInterest : unitComparison.compounded.netInterest) /
    UNIT_PRINCIPAL_PROBE;
  const compMaturityFactor =
    (isFlat ? unitComparison.simple.totalAmount : unitComparison.compounded.totalAmount) /
    UNIT_PRINCIPAL_PROBE;

  const netAnnualRatePercent = safeRate * (1 - safeTax / 100);
  const monthlySimpleNetFactor = (netAnnualRatePercent / 100) / 12;
  const hasPositiveYield = safeRate > 0 && safeTax < 100;

  let simpleRequiredPrincipal = null;
  let compoundedRequiredPrincipal = null;
  let isAchievable = true;

  if (safeGoalType === 'monthly_income') {
    isAchievable = safeTarget === 0 || (hasPositiveYield && monthlySimpleNetFactor > 0);
    if (safeTarget === 0) {
      simpleRequiredPrincipal = 0;
      compoundedRequiredPrincipal = 0;
    } else if (isAchievable) {
      simpleRequiredPrincipal = safeTarget / monthlySimpleNetFactor;
      const totalNetNeeded = safeTarget * safeDuration;
      compoundedRequiredPrincipal = compNetFactor > 0 ? totalNetNeeded / compNetFactor : null;
    }
  } else if (safeGoalType === 'net_profit') {
    isAchievable = safeTarget === 0 || (hasPositiveYield && simpleNetFactor > 0);
    if (safeTarget === 0) {
      simpleRequiredPrincipal = 0;
      compoundedRequiredPrincipal = 0;
    } else if (isAchievable) {
      simpleRequiredPrincipal = simpleNetFactor > 0 ? safeTarget / simpleNetFactor : null;
      compoundedRequiredPrincipal = compNetFactor > 0 ? safeTarget / compNetFactor : null;
    }
  } else {
    // 'maturity' target: always achievable even at 0% net interest (principal = target)
    isAchievable = true;
    simpleRequiredPrincipal = simpleMaturityFactor > 0 ? safeTarget / simpleMaturityFactor : safeTarget;
    compoundedRequiredPrincipal = compMaturityFactor > 0 ? safeTarget / compMaturityFactor : safeTarget;
  }

  const principalSaved =
    simpleRequiredPrincipal !== null && compoundedRequiredPrincipal !== null
      ? Math.max(0, simpleRequiredPrincipal - compoundedRequiredPrincipal)
      : 0;

  const simpleVerification =
    simpleRequiredPrincipal !== null
      ? calculateFDRComparison({
          amount: simpleRequiredPrincipal,
          totalDuration: safeDuration,
          interval: safeInterval,
          annualRate: safeRate,
          taxRate: safeTax,
        })
      : null;

  const compoundedVerification =
    compoundedRequiredPrincipal !== null
      ? calculateFDRComparison({
          amount: compoundedRequiredPrincipal,
          totalDuration: safeDuration,
          interval: safeInterval,
          annualRate: safeRate,
          taxRate: safeTax,
        })
      : null;

  return {
    inputs: {
      goalType: safeGoalType,
      targetAmount: safeTarget,
      totalDuration: safeDuration,
      interval: safeInterval,
      annualRate: safeRate,
      taxRate: safeTax,
      isFlat,
    },
    isAchievable,
    hasPositiveYield,
    netAnnualRatePercent,
    simpleRequiredPrincipal,
    compoundedRequiredPrincipal,
    principalSaved,
    simpleVerification,
    compoundedVerification,
  };
}


