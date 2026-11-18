/**
 * EMI (Equated Monthly Installment) Calculator Engine
 * Supports Merchant/Card Multi-Tenure Plans, Effective APR / FDR Opportunity Cost,
 * and Standard Reducing Balance Loans.
 */

import { calculateFDRComparison } from './fdrCalculator.js';

// Standard Credit Card / Merchant EMI rates (typical bank benchmarks)
export const DEFAULT_MERCHANT_PLANS = [
  { months: 3, label: '3 Months', defaultRate: 3.0 },
  { months: 6, label: '6 Months', defaultRate: 5.0 },
  { months: 9, label: '9 Months', defaultRate: 7.5 },
  { months: 12, label: '12 Months', defaultRate: 9.0 },
  { months: 18, label: '18 Months', defaultRate: 13.5 },
  { months: 24, label: '24 Months', defaultRate: 16.5 },
  { months: 36, label: '36 Months', defaultRate: 22.0 },
];

export const MAX_LOAN_MONTHS = 600;

/**
 * Computes the effective annualized reducing-balance APR (nominal 12 * monthly IRR)
 * and compounded effective annual rate (EAR) implied by a flat merchant fee across n months.
 *
 * @param {number} amount  Purchase principal
 * @param {number} months  Tenure in months (>= 1)
 * @param {number} feeRate Total flat processing/EMI fee percentage (e.g. 9 for 9%)
 */
export function calculateMerchantApr(amount, months, feeRate) {
  const numAmount = Math.max(0, Number(amount) || 0);
  const n = Math.min(MAX_LOAN_MONTHS, Math.floor(Number(months) || 0));
  const rawRate = Number(feeRate);
  const rate = Number.isFinite(rawRate) && rawRate > 0 ? Math.min(200, rawRate) : 0;

  const charge = (numAmount * rate) / 100.0;
  const emi = n > 0 ? (numAmount + charge) / n : 0;

  if (n <= 0 || rate <= 0) {
    return {
      monthlyRate: 0,
      nominalApr: 0,
      effectiveAnnualRate: 0,
      charge,
      emi,
    };
  }

  let monthlyRate = 0;
  if (n === 1) {
    monthlyRate = rate / 100.0;
  } else {
    // Solve k * (1 - (1 + r)^(-n)) / r = 1, where k = (1 + rate/100) / n
    const k = (1 + rate / 100.0) / n;
    const pvRatio = (r) => (r <= 1e-12 ? n : (1 - Math.pow(1 + r, -n)) / r);

    let low = 0;
    let high = Math.max(rate / 100.0, k * 2, 0.05);
    while (k * pvRatio(high) > 1 && high < 10) {
      high *= 2;
    }

    for (let iter = 0; iter < 80; iter++) {
      const mid = (low + high) / 2;
      if (k * pvRatio(mid) > 1) {
        low = mid;
      } else {
        high = mid;
      }
    }
    monthlyRate = (low + high) / 2;
  }

  return {
    monthlyRate,
    nominalApr: monthlyRate * 12 * 100,
    effectiveAnnualRate: (Math.pow(1 + monthlyRate, 12) - 1) * 100,
    charge,
    emi,
  };
}

/**
 * Calculates Merchant / Credit Card EMI table across multiple monthly plans.
 *
 * @param {number} amount Total purchase amount
 * @param {Array} plans Custom or default tenure rates
 * @param {boolean} isZeroInterest If true, charge is 0%
 */
export function calculateMerchantEmiTable(amount, plans = DEFAULT_MERCHANT_PLANS, isZeroInterest = false) {
  const numAmount = Math.max(0, Number(amount) || 0);

  return plans.map((plan) => {
    const rawRate = Number(plan.rate !== undefined ? plan.rate : plan.defaultRate);
    const rate = isZeroInterest ? 0 : (Number.isFinite(rawRate) && rawRate > 0 ? rawRate : 0);
    const charge = (numAmount * rate) / 100.0;
    const effectiveCost = numAmount + charge;
    const emi = plan.months > 0 ? effectiveCost / plan.months : 0;
    const apr = calculateMerchantApr(numAmount, plan.months, rate);

    return {
      months: plan.months,
      label: plan.label || `${plan.months} Months`,
      rate,
      charge,
      effectiveCost,
      emi,
      nominalApr: apr.nominalApr,
      effectiveAnnualRate: apr.effectiveAnnualRate,
    };
  });
}

/**
 * Calculates Standard Reducing Balance Loan EMI
 *
 * @param {number} principal Principal loan amount
 * @param {number} annualRate Annual interest rate in %
 * @param {number} months Total duration in months
 */
export function calculateStandardLoanEmi(principal, annualRate, months) {
  const rawP = Number(principal);
  const p = Number.isFinite(rawP) && rawP > 0 ? rawP : 0;
  const rawR = Number(annualRate);
  const rAnnual = Number.isFinite(rawR) && rawR > 0 ? rawR : 0;
  const rawM = Math.floor(Number(months));
  const n = Number.isFinite(rawM) && rawM > 0 ? Math.min(MAX_LOAN_MONTHS, rawM) : 1;

  if (p === 0) {
    return {
      monthlyEmi: 0,
      totalInterest: 0,
      totalPayment: 0,
      schedule: [],
    };
  }

  const monthlyRate = (rAnnual / 12) / 100;

  let monthlyEmi = 0;
  if (monthlyRate === 0) {
    monthlyEmi = p / n;
  } else {
    monthlyEmi = (p * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  }

  const totalPayment = monthlyEmi * n;
  const totalInterest = totalPayment - p;

  // Month-by-month amortization schedule
  let balance = p;
  let cumulativePrincipal = 0;
  let cumulativeInterest = 0;
  const schedule = [];

  for (let i = 1; i <= n; i++) {
    const openingBalance = balance;
    const interestPayment = balance * monthlyRate;
    const principalPayment = monthlyEmi - interestPayment;
    const rawRemaining = balance - principalPayment;
    balance = i === n || Math.abs(rawRemaining) < 1e-6 ? 0 : Math.max(0, rawRemaining);
    cumulativePrincipal += principalPayment;
    cumulativeInterest += interestPayment;

    schedule.push({
      month: i,
      openingBalance,
      emi: monthlyEmi,
      principalPaid: principalPayment,
      interestPaid: interestPayment,
      remainingBalance: balance,
      cumulativePrincipal,
      cumulativeInterest,
    });
  }

  return {
    monthlyEmi,
    totalInterest,
    totalPayment,
    schedule,
  };
}

/**
 * Groups a monthly loan amortization schedule into yearly summaries.
 *
 * @param {Array} schedule Monthly schedule from calculateStandardLoanEmi
 */
export function summarizeScheduleByYear(schedule = []) {
  if (!Array.isArray(schedule) || schedule.length === 0) return [];
  const years = [];
  for (let i = 0; i < schedule.length; i += 12) {
    const chunk = schedule.slice(i, i + 12);
    const first = chunk[0];
    const last = chunk[chunk.length - 1];
    years.push({
      year: Math.floor(i / 12) + 1,
      startMonth: first.month,
      endMonth: last.month,
      openingBalance: first.openingBalance,
      totalEmi: chunk.reduce((sum, r) => sum + r.emi, 0),
      principalPaid: chunk.reduce((sum, r) => sum + r.principalPaid, 0),
      interestPaid: chunk.reduce((sum, r) => sum + r.interestPaid, 0),
      remainingBalance: last.remainingBalance,
    });
  }
  return years;
}

/**
 * Compares taking a merchant/card EMI vs. paying cash upfront and keeping funds in an FDR.
 * Provides both:
 *  1. True Cash-Flow Drawdown Model: keep full principal earning net monthly FDR yield,
 *     withdrawing each monthly EMI until maturity. Break-even net yield == nominal APR.
 *  2. Locked Full-Principal FDR Reference: keep full principal locked in a term FDR across the tenure
 *     (reusing calculateFDRComparison) while paying EMIs from regular income.
 */
export function calculateEmiFdrOpportunityCost({
  amount = 50000,
  months = 12,
  feeRate = 9,
  emi,
  fdrAnnualRate = 9,
  fdrTaxRate = 15,
  fdrInterval = 3,
} = {}) {
  const principal = Math.max(0, Number(amount) || 0);
  const n = Math.min(MAX_LOAN_MONTHS, Math.max(1, Math.floor(Number(months) || 1)));
  const rawFee = Number(feeRate);
  const safeFeeRate = Number.isFinite(rawFee) && rawFee > 0 ? Math.min(200, rawFee) : 0;

  const apr = calculateMerchantApr(principal, n, safeFeeRate);
  const charge = apr.charge;
  const monthlyEmi = Number(emi) > 0 ? Number(emi) : apr.emi;

  const rawFdrRate = Number(fdrAnnualRate);
  const safeFdrRate = Number.isFinite(rawFdrRate) && rawFdrRate > 0 ? Math.min(100, rawFdrRate) : 0;
  const rawFdrTax = Number(fdrTaxRate);
  const safeFdrTax = Number.isFinite(rawFdrTax) && rawFdrTax > 0 ? Math.min(100, rawFdrTax) : 0;
  const rawFdrInt = Number(fdrInterval);
  const safeFdrInterval =
    Number.isFinite(rawFdrInt) && rawFdrInt >= 0 ? Math.min(MAX_LOAN_MONTHS, rawFdrInt) : 3;

  const netFdrAnnualRate = safeFdrRate * (1 - safeFdrTax / 100);
  const fdrMonthlyNetRate = (netFdrAnnualRate / 100) / 12;

  // 1. Sinking-fund / drawdown opportunity cost (fair self-funded cashflow comparison)
  let balance = principal;
  let drawdownInterestEarned = 0;
  for (let m = 1; m <= n; m++) {
    const monthInterest = balance > 0 ? balance * fdrMonthlyNetRate : 0;
    drawdownInterestEarned += monthInterest;
    balance = balance + monthInterest - monthlyEmi;
  }
  const drawdownNetGain = drawdownInterestEarned - charge;

  // Break-even gross FDR rate needed (at current tax bracket) so self-funded EMI beats paying cash
  const breakEvenNetApr = apr.nominalApr;
  const breakEvenGrossFdrRate =
    safeFdrTax < 100 ? breakEvenNetApr / (1 - safeFdrTax / 100) : Infinity;

  // 2. Locked full-principal FDR reference (reusing single-plan FDR engine)
  const lockedFdr = calculateFDRComparison({
    amount: principal,
    totalDuration: n,
    interval: safeFdrInterval,
    annualRate: safeFdrRate,
    taxRate: safeFdrTax,
  });
  const lockedFdrNetProfit =
    safeFdrInterval > 0 ? lockedFdr.compounded.netInterest : lockedFdr.simple.netInterest;
  const lockedNetAdvantage = lockedFdrNetProfit - charge;

  let verdict = 'breakeven';
  if (drawdownNetGain > 0.01) {
    verdict = 'emi_wins';
  } else if (drawdownNetGain < -0.01) {
    verdict = 'cash_wins';
  }

  return {
    principal,
    months: n,
    feeRate: safeFeeRate,
    charge,
    monthlyEmi,
    nominalApr: apr.nominalApr,
    effectiveAnnualRate: apr.effectiveAnnualRate,
    fdrAnnualRate: safeFdrRate,
    fdrTaxRate: safeFdrTax,
    fdrInterval: safeFdrInterval,
    netFdrAnnualRate,
    drawdownInterestEarned,
    drawdownNetGain,
    breakEvenNetApr,
    breakEvenGrossFdrRate,
    lockedFdrNetProfit,
    lockedNetAdvantage,
    verdict,
  };
}

