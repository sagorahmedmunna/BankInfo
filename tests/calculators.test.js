import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_FDR_DURATION_MONTHS,
  calculateSimpleNetInterest,
  calculateCompoundedFDR,
  calculateFDRComparison,
  calculateMultiFDRComparison,
  calculateReverseFDRGoal,
} from '../src/utils/fdrCalculator.js';
import {
  MAX_LOAN_MONTHS,
  calculateMerchantApr,
  calculateMerchantEmiTable,
  calculateEmiFdrOpportunityCost,
  calculateStandardLoanEmi,
  summarizeScheduleByYear,
} from '../src/utils/emiCalculator.js';
import {
  parseLocationScenario,
  buildShareUrl,
} from '../src/utils/shareLink.js';
import {
  formatCurrency,
  formatNumber,
  formatQuickAmount,
} from '../src/utils/formatters.js';
import {
  escapeCsvCell,
  buildCsvContent,
} from '../src/utils/csvExport.js';
import {
  FDR_GUIDES,
  FDR_GUIDE_ORDER,
} from '../src/data/fdrGuides.js';

test('Simple & Compounded FDR match standard expectations for divisible duration', () => {
  const res = calculateFDRComparison({
    amount: 100000,
    totalDuration: 12,
    interval: 3,
    annualRate: 9,
    taxRate: 15,
  });

  // Simple: 100,000 * 9% = 9,000 gross; 15% tax = 1,350; net = 7,650
  assert.equal(res.simple.grossInterest, 9000);
  assert.equal(res.simple.tax, 1350);
  assert.equal(res.simple.netInterest, 7650);
  assert.equal(res.simple.totalAmount, 107650);

  // Compounded: 4 cycles at quarterly net rate (9% * 0.85 / 4 = 1.9125%)
  assert.equal(res.compounded.cycles, 4);
  assert.equal(res.compounded.hasPartialCycle, false);
  assert.equal(res.compounded.remainingMonths, 0);
  assert.equal(res.compounded.cyclesList.length, 4);
  assert.ok(res.compounded.netInterest > res.simple.netInterest);
  assert.ok(res.difference.interestDifference > 0);
});

test('Compounded FDR accrues pro-rata interest for remaining months before maturity', () => {
  const res = calculateFDRComparison({
    amount: 100000,
    totalDuration: 14,
    interval: 3,
    annualRate: 9,
    taxRate: 15,
  });

  assert.equal(res.compounded.cycles, 4);
  assert.equal(res.compounded.remainingMonths, 2);
  assert.equal(res.compounded.hasPartialCycle, true);
  assert.equal(res.compounded.cyclesList.length, 5);
  assert.equal(res.compounded.cyclesList[4].isPartial, true);
  assert.equal(res.compounded.cyclesList[4].startMonth, 12);
  assert.equal(res.compounded.cyclesList[4].endMonth, 14);
  assert.ok(res.compounded.netInterest > res.simple.netInterest);
  assert.ok(res.difference.interestDifference > 0);
});

test('Interval >= totalDuration settles flat with zero negative reinvestment difference', () => {
  const shortTerm = calculateFDRComparison({
    amount: 100000,
    totalDuration: 2,
    interval: 3,
    annualRate: 9,
    taxRate: 15,
  });

  assert.equal(shortTerm.compounded.cycles, 0);
  assert.equal(shortTerm.compounded.remainingMonths, 2);
  assert.equal(shortTerm.compounded.hasPartialCycle, true);
  assert.ok(Math.abs(shortTerm.compounded.netInterest - shortTerm.simple.netInterest) < 1e-9);
  assert.equal(shortTerm.difference.interestDifference, 0);

  const exactSingleTerm = calculateFDRComparison({
    amount: 100000,
    totalDuration: 12,
    interval: 12,
    annualRate: 9,
    taxRate: 15,
  });
  assert.equal(exactSingleTerm.compounded.cycles, 1);
  assert.equal(exactSingleTerm.difference.interestDifference, 0);
});

test('FDR engine safely clamps extreme, negative, and zero inputs', () => {
  const clampedDuration = calculateCompoundedFDR(100000, 1000000, 1, 9, 15);
  assert.equal(clampedDuration.cycles, MAX_FDR_DURATION_MONTHS);
  assert.equal(clampedDuration.cyclesList.length, MAX_FDR_DURATION_MONTHS);

  const clampedTax = calculateSimpleNetInterest(100000, 12, 10, 150);
  assert.equal(clampedTax.tax, 10000);
  assert.equal(clampedTax.netInterest, 0);

  const negRate = calculateSimpleNetInterest(100000, 12, -5, -10);
  assert.equal(negRate.grossInterest, 0);
  assert.equal(negRate.totalAmount, 100000);
});

test('Multi-FDR comparison handles top ties and all-equal plans accurately', () => {
  const topTie = calculateMultiFDRComparison([
    { id: 'a', name: 'Bank A', amount: 100000, totalDuration: 12, interval: 3, annualRate: 10, taxRate: 15 },
    { id: 'b', name: 'Bank B', amount: 100000, totalDuration: 12, interval: 3, annualRate: 10, taxRate: 15 },
    { id: 'c', name: 'Bank C', amount: 100000, totalDuration: 12, interval: 3, annualRate: 8, taxRate: 15 },
  ]);

  assert.equal(topTie.isAllEqual, false);
  assert.equal(topTie.winnerCount, 2);
  assert.equal(topTie.schemes[0].rank, 1);
  assert.equal(topTie.schemes[1].rank, 1);
  assert.equal(topTie.schemes[0].isWinner, true);
  assert.equal(topTie.schemes[1].isWinner, true);
  assert.equal(topTie.schemes[2].rank, 3);
  assert.equal(topTie.schemes[2].isLowest, true);

  const allEqual = calculateMultiFDRComparison([
    { id: 'x', name: 'Plan X', amount: 100000, totalDuration: 12, interval: 3, annualRate: 9, taxRate: 15 },
    { id: 'y', name: 'Plan Y', amount: 100000, totalDuration: 12, interval: 3, annualRate: 9, taxRate: 15 },
  ]);

  assert.equal(allEqual.isAllEqual, true);
  assert.equal(allEqual.winnerCount, 0);
  assert.equal(allEqual.maxDifference, 0);
  assert.equal(allEqual.schemes[0].rank, 1);
  assert.equal(allEqual.schemes[1].rank, 1);
});

test('Merchant EMI & Standard Loan EMI compute schedules and clamp bounds', () => {
  const merchant = calculateMerchantEmiTable(10000, [{ months: 10, rate: 5 }], false);
  assert.equal(merchant[0].charge, 500);
  assert.equal(merchant[0].effectiveCost, 10500);
  assert.equal(merchant[0].emi, 1050);

  const zeroMerchant = calculateMerchantEmiTable(10000, [{ months: 10, rate: 5 }], true);
  assert.equal(zeroMerchant[0].charge, 0);
  assert.equal(zeroMerchant[0].emi, 1000);

  const zeroRateLoan = calculateStandardLoanEmi(12000, 0, 12);
  assert.equal(zeroRateLoan.monthlyEmi, 1000);
  assert.equal(zeroRateLoan.totalInterest, 0);
  assert.equal(zeroRateLoan.schedule.length, 12);
  assert.equal(zeroRateLoan.schedule[11].remainingBalance, 0);

  const standardLoan = calculateStandardLoanEmi(100000, 12, 24);
  assert.equal(standardLoan.schedule.length, 24);
  assert.equal(standardLoan.schedule[23].remainingBalance, 0);
  const yearly = summarizeScheduleByYear(standardLoan.schedule);
  assert.equal(yearly.length, 2);
  assert.ok(Math.abs(yearly[0].principalPaid + yearly[1].principalPaid - 100000) < 1e-6);

  const clampedLoan = calculateStandardLoanEmi(100000, 10, 99999);
  assert.equal(clampedLoan.schedule.length, MAX_LOAN_MONTHS);
});

test('Formatters and CSV exporter handle negatives, NaN, currencies, and escaping', () => {
  assert.equal(formatCurrency(-1234.5, '৳'), '-৳ 1,234.50');
  assert.equal(formatCurrency(NaN, '৳', 0), '৳ 0');
  assert.equal(formatNumber(-0, 2), '0.00');
  assert.equal(formatQuickAmount(100000, 'BDT'), '1 Lakh');
  assert.equal(formatQuickAmount(1000000, 'USD'), '1M');
  assert.equal(formatQuickAmount(100000, 'USD'), '100k');

  assert.equal(escapeCsvCell('Bank, "A"\nTest'), '"Bank, ""A""\nTest"');
  const csv = buildCsvContent(['Name', 'Value'], [['Bank, A', '100.00']]);
  assert.ok(csv.startsWith('\uFEFFName,Value\r\n"Bank, A",100.00'));
});

test('Multi-FDR supports custom numeric renewal intervals (e.g. 4M over 14M)', () => {
  const result = calculateMultiFDRComparison([
    {
      id: 'custom-4m',
      name: '4M Custom Cycle Bank',
      amount: 100_000,
      totalDuration: 14,
      interval: 4,
      annualRate: 9.0,
      taxRate: 15,
      isCompounded: true,
    },
    {
      id: 'flat',
      name: 'Flat Bank',
      amount: 100_000,
      totalDuration: 14,
      interval: 0,
      annualRate: 9.0,
      taxRate: 15,
      isCompounded: false,
    },
  ]);

  const customPlan = result.schemes.find((r) => r.id === 'custom-4m');
  const flatPlan = result.schemes.find((r) => r.id === 'flat');
  // 14M / 4M => 3 full cycles + 2M pro-rata cycle = 4 schedule steps
  assert.equal(customPlan.compounded.cycles, 3);
  assert.equal(customPlan.compounded.remainingMonths, 2);
  assert.equal(customPlan.compounded.cyclesList.length, 4);
  assert.equal(customPlan.compounded.cyclesList[3].isPartial, true);
  assert.equal(customPlan.compounded.cyclesList[3].durationMonths, 2);
  assert.ok(customPlan.netInterest > flatPlan.netInterest);
});

test('calculateReverseFDRGoal solves monthly income, maturity, and net profit targets accurately', () => {
  // 1. Target 10,000/month net passive yield over 36 months at 9.5% gross, 15% tax, 3M renewal
  const monthlyGoal = calculateReverseFDRGoal({
    goalType: 'monthly_income',
    targetAmount: 10_000,
    totalDuration: 36,
    interval: 3,
    annualRate: 9.5,
    taxRate: 15,
  });

  assert.equal(monthlyGoal.isAchievable, true);
  assert.ok(monthlyGoal.simpleRequiredPrincipal > monthlyGoal.compoundedRequiredPrincipal);
  assert.ok(
    Math.abs(
      monthlyGoal.principalSaved -
        (monthlyGoal.simpleRequiredPrincipal - monthlyGoal.compoundedRequiredPrincipal)
    ) < 1e-6
  );
  // Forward verification must reconstruct the target income / cumulative net interest
  assert.ok(
    Math.abs(monthlyGoal.simpleVerification.simple.netInterest / 36 - 10_000) < 1e-4
  );
  assert.ok(
    Math.abs(monthlyGoal.compoundedVerification.compounded.netInterest - 360_000) < 1e-4
  );

  // 2. Target 500,000 maturity in 36 months
  const maturityGoal = calculateReverseFDRGoal({
    goalType: 'maturity',
    targetAmount: 500_000,
    totalDuration: 36,
    interval: 3,
    annualRate: 9.5,
    taxRate: 15,
  });
  assert.equal(maturityGoal.isAchievable, true);
  assert.ok(
    Math.abs(maturityGoal.compoundedVerification.compounded.totalAmount - 500_000) < 1e-4
  );

  // 0% rate maturity equals principal == target
  const zeroMaturityGoal = calculateReverseFDRGoal({
    goalType: 'maturity',
    targetAmount: 500_000,
    totalDuration: 24,
    interval: 3,
    annualRate: 0,
    taxRate: 15,
  });
  assert.equal(zeroMaturityGoal.simpleRequiredPrincipal, 500_000);
  assert.equal(zeroMaturityGoal.compoundedRequiredPrincipal, 500_000);

  // 3. Target net profit
  const profitGoal = calculateReverseFDRGoal({
    goalType: 'net_profit',
    targetAmount: 100_000,
    totalDuration: 24,
    interval: 6,
    annualRate: 9.0,
    taxRate: 10,
  });
  assert.ok(Math.abs(profitGoal.simpleVerification.simple.netInterest - 100_000) < 1e-4);
  assert.ok(Math.abs(profitGoal.compoundedVerification.compounded.netInterest - 100_000) < 1e-4);

  // 4. Unachievable income target at 0% interest or 100% tax
  const impossibleRate = calculateReverseFDRGoal({
    goalType: 'monthly_income',
    targetAmount: 10_000,
    totalDuration: 12,
    interval: 3,
    annualRate: 0,
    taxRate: 15,
  });
  assert.equal(impossibleRate.isAchievable, false);
  assert.equal(impossibleRate.simpleRequiredPrincipal, null);
});

test('calculateMerchantApr and calculateEmiFdrOpportunityCost compute true APR and cash verdicts', () => {
  // 9% flat fee over 12M reducing-balance EMIs is ~16.20% nominal APR
  const apr12 = calculateMerchantApr(100_000, 12, 9);
  assert.equal(apr12.charge, 9_000);
  assert.ok(Math.abs(apr12.nominalApr - 16.202) < 0.05);
  assert.ok(apr12.effectiveAnnualRate > apr12.nominalApr);

  // Verify present value of 12 EMIs discounted at monthlyRate recovers principal 100,000
  let pv = 0;
  for (let m = 1; m <= 12; m++) {
    pv += apr12.emi / Math.pow(1 + apr12.monthlyRate, m);
  }
  assert.ok(Math.abs(pv - 100_000) < 1e-3);

  // 0% fee yields 0% APR
  const aprZero = calculateMerchantApr(50_000, 12, 0);
  assert.equal(aprZero.nominalApr, 0);
  assert.equal(aprZero.effectiveAnnualRate, 0);

  // Merchant table exposes nominalApr and effectiveAnnualRate
  const merchantRows = calculateMerchantEmiTable(50_000);
  const row12 = merchantRows.find((r) => r.months === 12);
  assert.ok(Math.abs(row12.nominalApr - 16.202) < 0.05);
  assert.ok(row12.effectiveAnnualRate > row12.nominalApr);

  // Opportunity cost: 9% fee over 12M vs 9% gross / 15% tax FDR (7.65% net < 16.20% APR) -> Cash wins
  const cashWins = calculateEmiFdrOpportunityCost({
    amount: 50_000,
    months: 12,
    feeRate: 9,
    fdrAnnualRate: 9,
    fdrTaxRate: 15,
    fdrInterval: 3,
  });
  assert.equal(cashWins.verdict, 'cash_wins');
  assert.ok(cashWins.drawdownNetGain < 0);
  assert.ok(Math.abs(cashWins.breakEvenGrossFdrRate - cashWins.nominalApr / 0.85) < 1e-6);

  // Opportunity cost: low fee (3% over 12M ~5.49% APR) vs 12% net FDR -> EMI wins
  const emiWins = calculateEmiFdrOpportunityCost({
    amount: 100_000,
    months: 12,
    feeRate: 3,
    fdrAnnualRate: 12,
    fdrTaxRate: 0,
    fdrInterval: 3,
  });
  assert.equal(emiWins.verdict, 'emi_wins');
  assert.ok(emiWins.drawdownNetGain > 0);
  assert.ok(emiWins.lockedNetAdvantage > emiWins.drawdownNetGain);
});

test('shareLink buildShareUrl and parseLocationScenario round-trip all calculator modes', () => {
  const baseUrl = 'https://bankinfo.example/app';

  // Single FDR round-trip
  const singleUrl = buildShareUrl({
    baseUrl,
    page: 'fdr',
    fdrMode: 'single',
    currencyCode: 'USD',
    fdrInputs: {
      amount: 250_000,
      totalDuration: 24,
      interval: 6,
      annualRate: 8.75,
      taxRate: 10,
    },
  });
  const parsedSingle = parseLocationScenario(singleUrl.slice(singleUrl.indexOf('#')));
  assert.equal(parsedSingle.page, 'fdr');
  assert.equal(parsedSingle.mode, 'single');
  assert.equal(parsedSingle.currencyCode, 'USD');
  assert.deepEqual(parsedSingle.fdrInputs, {
    amount: 250_000,
    totalDuration: 24,
    interval: 6,
    annualRate: 8.75,
    taxRate: 10,
  });

  // Multi-FDR Compare with custom renewal interval, UTF-8 bank name, and sync locks
  const compareUrl = buildShareUrl({
    baseUrl,
    page: 'fdr',
    fdrMode: 'compare',
    currencyCode: 'BDT',
    multiSchemes: [
      {
        id: '1',
        name: 'ব্র্যাক Bank (4M)',
        amount: 200_000,
        totalDuration: 18,
        interval: 4,
        annualRate: 10.25,
        taxRate: 10,
        isCompounded: true,
      },
      {
        id: '2',
        name: 'Flat Offer',
        amount: 200_000,
        totalDuration: 18,
        interval: 0,
        annualRate: 10.5,
        taxRate: 15,
        isCompounded: false,
      },
    ],
    multiSyncFields: {
      amount: true,
      totalDuration: true,
      interval: false,
      annualRate: false,
      taxRate: false,
    },
  });
  const parsedCompare = parseLocationScenario(compareUrl.slice(compareUrl.indexOf('#')));
  assert.equal(parsedCompare.page, 'fdr');
  assert.equal(parsedCompare.mode, 'compare');
  assert.equal(parsedCompare.multiSchemes.length, 2);
  assert.equal(parsedCompare.multiSchemes[0].name, 'ব্র্যাক Bank (4M)');
  assert.equal(parsedCompare.multiSchemes[0].interval, 4);
  assert.equal(parsedCompare.multiSchemes[0].isCompounded, true);
  assert.equal(parsedCompare.multiSchemes[1].interval, 0);
  assert.equal(parsedCompare.multiSchemes[1].isCompounded, false);
  assert.equal(parsedCompare.multiSyncFields.amount, true);
  assert.equal(parsedCompare.multiSyncFields.interval, false);

  // Goal FDR round-trip
  const goalUrl = buildShareUrl({
    baseUrl,
    page: 'fdr',
    fdrMode: 'goal',
    currencyCode: 'BDT',
    goalInputs: {
      goalType: 'maturity',
      targetAmount: 500_000,
      totalDuration: 36,
      interval: 3,
      annualRate: 9.5,
      taxRate: 15,
    },
  });
  const parsedGoal = parseLocationScenario(goalUrl.slice(goalUrl.indexOf('#')));
  assert.equal(parsedGoal.page, 'fdr');
  assert.equal(parsedGoal.mode, 'goal');
  assert.deepEqual(parsedGoal.goalInputs, {
    goalType: 'maturity',
    targetAmount: 500_000,
    totalDuration: 36,
    interval: 3,
    annualRate: 9.5,
    taxRate: 15,
  });

  // EMI (Merchant + FDR opportunity cost) round-trip
  const emiUrl = buildShareUrl({
    baseUrl,
    page: 'emi',
    currencyCode: 'EUR',
    emiState: {
      calculatorType: 'merchant',
      amount: 75_000,
      isZeroInterest: false,
      isSinglePlanMode: true,
      selectedPlanIndex: 2,
      singlePlanMonths: 15,
      singlePlanRate: 10.5,
      fdrOpportunityRate: 10.0,
      fdrOpportunityTax: 10,
      fdrOpportunityInterval: 6,
      rates: { 3: 3, 6: 5, 9: 7.5, 12: 8.5, 18: 13.5, 24: 16.5, 36: 22 },
    },
  });
  const parsedEmi = parseLocationScenario(emiUrl.slice(emiUrl.indexOf('#')));
  assert.equal(parsedEmi.page, 'emi');
  assert.equal(parsedEmi.currencyCode, 'EUR');
  assert.equal(parsedEmi.emiState.calculatorType, 'merchant');
  assert.equal(parsedEmi.emiState.amount, 75_000);
  assert.equal(parsedEmi.emiState.isSinglePlanMode, true);
  assert.equal(parsedEmi.emiState.singlePlanMonths, 15);
  assert.equal(parsedEmi.emiState.singlePlanRate, 10.5);
  assert.equal(parsedEmi.emiState.fdrOpportunityRate, 10.0);
  assert.equal(parsedEmi.emiState.fdrOpportunityTax, 10);
  assert.equal(parsedEmi.emiState.fdrOpportunityInterval, 6);
  assert.equal(parsedEmi.emiState.rates[12], 8.5);
});

test('FDR_GUIDES defines dedicated structured guides for single, compare, and goal modes', () => {
  assert.deepEqual(FDR_GUIDE_ORDER, ['single', 'compare', 'goal']);
  for (const mode of FDR_GUIDE_ORDER) {
    const g = FDR_GUIDES[mode];
    assert.ok(g, `Missing guide for ${mode}`);
    assert.equal(g.id, mode);
    assert.ok(g.title && g.overviewText && g.tip);
    assert.equal(g.concepts.length, 2);
    assert.equal(g.steps.length, 3);
    assert.equal(g.features.length, 4);
  }
});

