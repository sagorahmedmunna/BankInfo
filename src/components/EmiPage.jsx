import React, { useState, useMemo, useEffect } from 'react';
import {
  CreditCard,
  ArrowLeft,
  Percent,
  Download,
  Check,
  RotateCcw,
  Sliders,
  Calendar,
  List,
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  BarChart3,
  TrendingUp,
  Scale,
  Link2
} from 'lucide-react';
import {
  DEFAULT_MERCHANT_PLANS,
  calculateMerchantEmiTable,
  calculateMerchantApr,
  calculateEmiFdrOpportunityCost,
  calculateStandardLoanEmi,
  summarizeScheduleByYear,
  MAX_LOAN_MONTHS
} from '../utils/emiCalculator';
import { MAX_FDR_DURATION_MONTHS } from '../utils/fdrCalculator';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { exportToCsv } from '../utils/csvExport';

export const EMI_STORAGE_KEY = 'bankinfo_emi_state_v1';

export const DEFAULT_RATES = (() => {
  const initial = {};
  DEFAULT_MERCHANT_PLANS.forEach((p) => {
    initial[p.months] = p.defaultRate;
  });
  return initial;
})();

export const DEFAULT_EMI_STATE = {
  amount: 50000,
  calculatorType: 'merchant',
  isZeroInterest: false,
  selectedPlanIndex: 3,
  rates: DEFAULT_RATES,
  annualRate: 9.5,
  loanDuration: 12,
  isSinglePlanMode: false,
  singlePlanMonths: 12,
  singlePlanRate: 9.0,
  fdrOpportunityRate: 9.0,
  fdrOpportunityTax: 15,
  fdrOpportunityInterval: 3,
};

export function sanitizeEmiState(parsed = {}) {
  const loadedRates = { ...DEFAULT_RATES };
  if (parsed.rates && typeof parsed.rates === 'object') {
    DEFAULT_MERCHANT_PLANS.forEach((p) => {
      const val = parsed.rates[p.months];
      if (val !== undefined && val !== null && !isNaN(Number(val))) {
        loadedRates[p.months] = Math.min(100, Math.max(0, Number(val)));
      }
    });
  }

  return {
    amount:
      typeof parsed.amount === 'number' && !isNaN(parsed.amount)
        ? Math.max(0, parsed.amount)
        : DEFAULT_EMI_STATE.amount,
    calculatorType: parsed.calculatorType === 'standard' ? 'standard' : 'merchant',
    isZeroInterest: Boolean(parsed.isZeroInterest),
    selectedPlanIndex:
      typeof parsed.selectedPlanIndex === 'number' &&
      parsed.selectedPlanIndex >= 0 &&
      parsed.selectedPlanIndex < DEFAULT_MERCHANT_PLANS.length
        ? parsed.selectedPlanIndex
        : DEFAULT_EMI_STATE.selectedPlanIndex,
    rates: loadedRates,
    annualRate:
      typeof parsed.annualRate === 'number' && !isNaN(parsed.annualRate)
        ? Math.min(100, Math.max(0, parsed.annualRate))
        : DEFAULT_EMI_STATE.annualRate,
    loanDuration:
      typeof parsed.loanDuration === 'number' && !isNaN(parsed.loanDuration)
        ? Math.min(MAX_LOAN_MONTHS, Math.max(1, Math.floor(parsed.loanDuration)))
        : DEFAULT_EMI_STATE.loanDuration,
    isSinglePlanMode: Boolean(parsed.isSinglePlanMode),
    singlePlanMonths:
      typeof parsed.singlePlanMonths === 'number' && parsed.singlePlanMonths > 0
        ? Math.min(120, Math.floor(parsed.singlePlanMonths))
        : DEFAULT_EMI_STATE.singlePlanMonths,
    singlePlanRate:
      typeof parsed.singlePlanRate === 'number' && !isNaN(parsed.singlePlanRate)
        ? Math.min(100, Math.max(0, parsed.singlePlanRate))
        : DEFAULT_EMI_STATE.singlePlanRate,
    fdrOpportunityRate:
      typeof parsed.fdrOpportunityRate === 'number' && !isNaN(parsed.fdrOpportunityRate)
        ? Math.min(100, Math.max(0, parsed.fdrOpportunityRate))
        : DEFAULT_EMI_STATE.fdrOpportunityRate,
    fdrOpportunityTax:
      typeof parsed.fdrOpportunityTax === 'number' && !isNaN(parsed.fdrOpportunityTax)
        ? Math.min(100, Math.max(0, parsed.fdrOpportunityTax))
        : DEFAULT_EMI_STATE.fdrOpportunityTax,
    fdrOpportunityInterval:
      typeof parsed.fdrOpportunityInterval === 'number' && !isNaN(parsed.fdrOpportunityInterval)
        ? Math.min(MAX_FDR_DURATION_MONTHS, Math.max(0, Math.floor(parsed.fdrOpportunityInterval)))
        : DEFAULT_EMI_STATE.fdrOpportunityInterval,
  };
}

export const loadSavedEmiState = () => {
  if (typeof window === 'undefined') return DEFAULT_EMI_STATE;
  try {
    const saved = localStorage.getItem(EMI_STORAGE_KEY);
    if (!saved) return DEFAULT_EMI_STATE;
    return sanitizeEmiState(JSON.parse(saved));
  } catch {
    return DEFAULT_EMI_STATE;
  }
};

export default function EmiPage({
  currency,
  onNavigateHome,
  emiState: controlledEmiState,
  setEmiState: setControlledEmiState,
  onCopyShareLink,
  shareCopied = false,
}) {
  const [localEmiState, setLocalEmiState] = useState(() => loadSavedEmiState());
  const isControlled = Boolean(controlledEmiState && setControlledEmiState);
  const emiState = isControlled ? controlledEmiState : localEmiState;
  const updateState = isControlled ? setControlledEmiState : setLocalEmiState;

  const {
    amount,
    calculatorType,
    isZeroInterest,
    selectedPlanIndex,
    rates,
    annualRate,
    loanDuration,
    isSinglePlanMode,
    singlePlanMonths,
    singlePlanRate,
    fdrOpportunityRate = 9.0,
    fdrOpportunityTax = 15,
    fdrOpportunityInterval = 3,
  } = emiState;

  const setAmount = (updater) =>
    updateState((prev) => ({
      ...prev,
      amount: typeof updater === 'function' ? updater(prev.amount) : updater,
    }));
  const setCalculatorType = (val) => updateState((prev) => ({ ...prev, calculatorType: val }));
  const setIsZeroInterest = (val) => updateState((prev) => ({ ...prev, isZeroInterest: val }));
  const setSelectedPlanIndex = (val) => updateState((prev) => ({ ...prev, selectedPlanIndex: val }));
  const setRates = (updater) =>
    updateState((prev) => ({
      ...prev,
      rates: typeof updater === 'function' ? updater(prev.rates) : updater,
    }));
  const setAnnualRate = (updater) =>
    updateState((prev) => ({
      ...prev,
      annualRate: typeof updater === 'function' ? updater(prev.annualRate) : updater,
    }));
  const setLoanDuration = (updater) =>
    updateState((prev) => ({
      ...prev,
      loanDuration: typeof updater === 'function' ? updater(prev.loanDuration) : updater,
    }));
  const setIsSinglePlanMode = (val) => updateState((prev) => ({ ...prev, isSinglePlanMode: val }));
  const setSinglePlanMonths = (updater) =>
    updateState((prev) => ({
      ...prev,
      singlePlanMonths: typeof updater === 'function' ? updater(prev.singlePlanMonths) : updater,
    }));
  const setSinglePlanRate = (updater) =>
    updateState((prev) => ({
      ...prev,
      singlePlanRate: typeof updater === 'function' ? updater(prev.singlePlanRate) : updater,
    }));
  const setFdrOpportunityRate = (updater) =>
    updateState((prev) => ({
      ...prev,
      fdrOpportunityRate:
        typeof updater === 'function' ? updater(prev.fdrOpportunityRate) : updater,
    }));
  const setFdrOpportunityTax = (updater) =>
    updateState((prev) => ({
      ...prev,
      fdrOpportunityTax:
        typeof updater === 'function' ? updater(prev.fdrOpportunityTax) : updater,
    }));
  const setFdrOpportunityInterval = (val) =>
    updateState((prev) => ({ ...prev, fdrOpportunityInterval: val }));

  const [copied, setCopied] = useState(false);

  // Bank loan amortization schedule UI state
  const [loanScheduleView, setLoanScheduleView] = useState('yearly');
  const [isLoanScheduleExpanded, setIsLoanScheduleExpanded] = useState(true);
  const [loanCsvCopied, setLoanCsvCopied] = useState(false);

  // Persist locally only when running uncontrolled (standalone)
  useEffect(() => {
    if (isControlled) return;
    try {
      const stateToSave = {
        ...emiState,
        amount: amount === '' ? 0 : Number(amount),
        annualRate: annualRate === '' ? 9.5 : Number(annualRate),
        loanDuration: loanDuration === '' ? 12 : Number(loanDuration),
        singlePlanMonths: singlePlanMonths === '' ? 12 : Number(singlePlanMonths),
        singlePlanRate: singlePlanRate === '' ? 0 : Number(singlePlanRate),
        fdrOpportunityRate: fdrOpportunityRate === '' ? 0 : Number(fdrOpportunityRate),
        fdrOpportunityTax: fdrOpportunityTax === '' ? 0 : Number(fdrOpportunityTax),
      };
      localStorage.setItem(EMI_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // ignore storage quota errors
    }
  }, [
    isControlled,
    emiState,
    amount,
    annualRate,
    loanDuration,
    singlePlanMonths,
    singlePlanRate,
    fdrOpportunityRate,
    fdrOpportunityTax,
  ]);

  const isRatesModified = useMemo(() => {
    return DEFAULT_MERCHANT_PLANS.some((p) => {
      const current = rates[p.months];
      return current !== '' && Number(current) !== p.defaultRate;
    });
  }, [rates]);

  const handleRateChange = (months, val) => {
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      if (val === '' || val === '.') {
        setRates((prev) => ({ ...prev, [months]: val }));
        return;
      }
      const num = parseFloat(val);
      if (num >= 0 && num <= 100) {
        setRates((prev) => ({
          ...prev,
          [months]: val,
        }));
      }
    }
  };

  const handleRateBlur = (months) => {
    setRates((prev) => {
      const val = prev[months];
      if (val === '' || isNaN(Number(val))) {
        return { ...prev, [months]: 0 };
      }
      return { ...prev, [months]: Number(val) };
    });
  };

  const handleResetRates = () => {
    setRates(DEFAULT_RATES);
  };

  // Merchant table results
  const merchantTable = useMemo(() => {
    const plansWithCustomRates = DEFAULT_MERCHANT_PLANS.map((plan) => {
      const userRate = rates[plan.months];
      const parsedRate = userRate === '' || isNaN(Number(userRate)) ? 0 : Math.max(0, Number(userRate));
      return {
        ...plan,
        rate: parsedRate,
      };
    });
    return calculateMerchantEmiTable(Number(amount) || 0, plansWithCustomRates, isZeroInterest);
  }, [amount, rates, isZeroInterest]);

  // Standard loan results
  const standardLoan = useMemo(() => {
    return calculateStandardLoanEmi(
      Number(amount) || 0,
      Number(annualRate) || 0,
      Number(loanDuration) || 1
    );
  }, [amount, annualRate, loanDuration]);

  const yearlyLoanSchedule = useMemo(() => {
    return summarizeScheduleByYear(standardLoan.schedule);
  }, [standardLoan.schedule]);

  // Single custom plan results
  const singlePlanData = useMemo(() => {
    const numAmount = Number(amount) || 0;
    const months = Number(singlePlanMonths) > 0 ? Number(singlePlanMonths) : 1;
    const rate = isZeroInterest ? 0 : (Number(singlePlanRate) || 0);
    const charge = (numAmount * rate) / 100.0;
    const effectiveCost = numAmount + charge;
    const emi = months > 0 ? effectiveCost / months : 0;
    const apr = calculateMerchantApr(numAmount, months, rate);

    return {
      label: `${months} Months (Custom Plan)`,
      months,
      rate,
      charge,
      effectiveCost,
      emi,
      nominalApr: apr.nominalApr,
      effectiveAnnualRate: apr.effectiveAnnualRate,
    };
  }, [amount, singlePlanMonths, singlePlanRate, isZeroInterest]);

  const selectedPlan = isSinglePlanMode
    ? singlePlanData
    : (merchantTable[selectedPlanIndex] || merchantTable[0]);

  const opportunityCost = useMemo(() => {
    if (!selectedPlan) return null;
    return calculateEmiFdrOpportunityCost({
      amount: Number(amount) || 0,
      months: selectedPlan.months,
      feeRate: selectedPlan.rate,
      emi: selectedPlan.emi,
      fdrAnnualRate: Number(fdrOpportunityRate) || 0,
      fdrTaxRate: Number(fdrOpportunityTax) || 0,
      fdrInterval: Number(fdrOpportunityInterval) || 0,
    });
  }, [amount, selectedPlan, fdrOpportunityRate, fdrOpportunityTax, fdrOpportunityInterval]);

  const handleAmountChange = (val) => {
    if (val === '' || /^\d*$/.test(val)) {
      setAmount(val);
    }
  };

  const handleAmountBlur = () => {
    setAmount((prev) => {
      if (prev === '' || isNaN(Number(prev))) return 0;
      return Number(prev);
    });
  };

  const handleAnnualRateChange = (val) => {
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setAnnualRate(val);
    }
  };

  const handleAnnualRateBlur = () => {
    setAnnualRate((prev) => {
      if (prev === '' || isNaN(Number(prev))) return 9.5;
      return Math.min(100, Math.max(0, Number(prev)));
    });
  };

  const handleLoanDurationChange = (val) => {
    if (val === '' || /^\d*$/.test(val)) {
      setLoanDuration(val);
    }
  };

  const handleLoanDurationBlur = () => {
    setLoanDuration((prev) => {
      if (prev === '' || isNaN(Number(prev)) || Number(prev) <= 0) return 12;
      return Math.min(MAX_LOAN_MONTHS, Math.max(1, Math.floor(Number(prev))));
    });
  };

  const handleSinglePlanMonthsChange = (val) => {
    if (val === '' || /^\d*$/.test(val)) {
      setSinglePlanMonths(val);
    }
  };

  const handleSinglePlanMonthsBlur = () => {
    setSinglePlanMonths((prev) => {
      if (prev === '' || isNaN(Number(prev)) || Number(prev) <= 0) return 12;
      return Math.min(120, Math.max(1, Math.floor(Number(prev))));
    });
  };

  const handleBoundedPercentChange = (setter, val) => {
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      if (val === '' || val === '.') {
        setter(val);
        return;
      }
      const num = parseFloat(val);
      if (num >= 0 && num <= 100) {
        setter(val);
      }
    }
  };

  const handlePercentBlur = (setter, fallback = 0) => {
    setter((prev) => {
      if (prev === '' || isNaN(Number(prev))) return fallback;
      return Math.min(100, Math.max(0, Number(prev)));
    });
  };

  const handleSinglePlanRateChange = (val) => handleBoundedPercentChange(setSinglePlanRate, val);
  const handleSinglePlanRateBlur = () => handlePercentBlur(setSinglePlanRate, 0);

  const handleReset = () => {
    updateState((prev) => ({
      ...DEFAULT_EMI_STATE,
      calculatorType: prev.calculatorType,
    }));
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Plan (Monthly)', 'Rate (%)', 'Effective APR (%)', 'Monthly EMI', 'Bank Charge (Interest)', 'Effective Total Cost'];
    const rows = isSinglePlanMode
      ? [
          [
            singlePlanData.label,
            `${singlePlanData.rate}%`,
            `${singlePlanData.nominalApr.toFixed(2)}%`,
            singlePlanData.emi.toFixed(2),
            singlePlanData.charge.toFixed(2),
            singlePlanData.effectiveCost.toFixed(2),
          ]
        ]
      : merchantTable.map((p) => [
          p.label,
          `${p.rate}%`,
          `${p.nominalApr.toFixed(2)}%`,
          p.emi.toFixed(2),
          p.charge.toFixed(2),
          p.effectiveCost.toFixed(2),
        ]);

    exportToCsv(`EMI_Plan_${amount}_${currency.code}.csv`, headers, rows);

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportLoanScheduleCSV = () => {
    if (loanScheduleView === 'yearly') {
      const headers = ['Year', 'Months', 'Opening Balance', 'Total Paid', 'Principal Paid', 'Interest Paid', 'Remaining Balance'];
      const rows = yearlyLoanSchedule.map((y) => [
        `Year ${y.year}`,
        `${y.startMonth}-${y.endMonth}`,
        y.openingBalance.toFixed(2),
        y.totalEmi.toFixed(2),
        y.principalPaid.toFixed(2),
        y.interestPaid.toFixed(2),
        y.remainingBalance.toFixed(2),
      ]);
      exportToCsv(`Loan_Amortization_Yearly_${amount}_${currency.code}.csv`, headers, rows);
    } else {
      const headers = ['Month', 'Opening Balance', 'EMI', 'Principal Paid', 'Interest Paid', 'Remaining Balance'];
      const rows = standardLoan.schedule.map((r) => [
        r.month,
        r.openingBalance.toFixed(2),
        r.emi.toFixed(2),
        r.principalPaid.toFixed(2),
        r.interestPaid.toFixed(2),
        r.remainingBalance.toFixed(2),
      ]);
      exportToCsv(`Loan_Amortization_Monthly_${amount}_${currency.code}.csv`, headers, rows);
    }
    setLoanCsvCopied(true);
    setTimeout(() => setLoanCsvCopied(false), 2000);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">

      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between pb-2 no-print">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 py-1.5 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition cursor-pointer shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </button>

        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">
          BankInfo &gt; Calculators &gt; EMI Planner
        </span>
      </div>

      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-2">
            <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Installment & Loan Planner</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            EMI Calculator
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {calculatorType === 'merchant'
              ? 'Calculate credit card installments, true annualized APR, and FDR opportunity cost.'
              : 'Calculate reducing balance bank loans (personal, auto, or home loans) with monthly EMI & amortization.'}
          </p>
        </div>

        {/* Mode Switcher & Share Link */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto no-print">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCalculatorType('merchant')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${calculatorType === 'merchant'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
            >
              Credit Card Plans
            </button>
            <button
              onClick={() => setCalculatorType('standard')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${calculatorType === 'standard'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
            >
              Bank Loan EMI
            </button>
          </div>

          {onCopyShareLink && (
            <button
              type="button"
              onClick={onCopyShareLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-sm"
              title="Copy shareable link for this EMI scenario"
            >
              {shareCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Copy Share Link</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Calculator Body */}
      {calculatorType === 'merchant' ? (
        <div className="space-y-6">

          {/* Main Input Card (Matches user image: Enter Amount) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm transition">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <label htmlFor="merchant-amount" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white block">
                  Enter Amount
                </label>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Total price of product or credit card purchase
                </span>
              </div>

              {/* Zero Interest Switch */}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 pl-1">
                  0% Zero-Interest EMI:
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isZeroInterest}
                  aria-label="Toggle 0% Zero-Interest EMI"
                  onClick={() => setIsZeroInterest(!isZeroInterest)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${isZeroInterest ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isZeroInterest ? 'translate-x-5' : 'translate-x-0'
                      }`}
                  />
                </button>
              </div>
            </div>

            {/* Input Box */}
            <div className="relative mb-3">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-lg sm:text-xl font-bold font-mono">
                {currency.symbol}
              </span>
              <input
                id="merchant-amount"
                type="text"
                inputMode="numeric"
                value={amount ?? ''}
                onChange={(e) => handleAmountChange(e.target.value)}
                onBlur={handleAmountBlur}
                placeholder="50000"
                className="w-full pl-12 pr-6 py-3.5 sm:py-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white font-mono text-xl sm:text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition shadow-inner"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 mr-1 font-medium">Quick amounts:</span>
              {[10000, 25000, 50000, 100000, 200000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className={`text-xs px-3 py-1 rounded-xl border transition cursor-pointer font-medium ${Number(amount) === amt
                      ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  {currency.symbol} {formatNumber(amt, 0)}
                </button>
              ))}
            </div>

          </div>

          {/* Selected Plan Highlight Card */}
          {selectedPlan && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-emerald-100 uppercase tracking-wider font-semibold block mb-1">
                  Selected Plan: {selectedPlan.label}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black font-mono">
                    {formatCurrency(selectedPlan.emi, currency.symbol)}
                  </span>
                  <span className="text-xs sm:text-sm text-emerald-100 font-medium">/ month</span>
                </div>
                <p className="text-xs text-emerald-100 mt-1">
                  Pay across {selectedPlan.months} equal monthly installments
                </p>
              </div>

              <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-wrap items-center gap-5 sm:gap-6">
                <div>
                  <span className="text-[11px] text-emerald-100 uppercase block font-medium">
                    Total Charge
                  </span>
                  <span className="text-base sm:text-lg font-mono font-bold">
                    {formatCurrency(selectedPlan.charge, currency.symbol)}
                  </span>
                  <span className="text-[10px] text-emerald-200 block">
                    ({selectedPlan.rate}% {isZeroInterest ? 'waived' : 'flat fee'})
                  </span>
                </div>

                <div className="h-10 w-px bg-white/20 hidden sm:block" />

                <div>
                  <span className="text-[11px] text-emerald-100 uppercase block font-medium">
                    True Reducing APR
                  </span>
                  <span className="text-base sm:text-lg font-mono font-bold text-amber-200">
                    {formatNumber(selectedPlan.nominalApr, 2)}%
                  </span>
                  <span className="text-[10px] text-emerald-200 block">
                    per annum annualized
                  </span>
                </div>

                <div className="h-10 w-px bg-white/20 hidden sm:block" />

                <div>
                  <span className="text-[11px] text-emerald-100 uppercase block font-medium">
                    Effective Total Cost
                  </span>
                  <span className="text-base sm:text-lg font-mono font-bold text-white">
                    {formatCurrency(selectedPlan.effectiveCost, currency.symbol)}
                  </span>
                  <span className="text-[10px] text-emerald-200 block">
                    {selectedPlan.months} months total
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* EMI Plans Table or Custom Single Plan */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {isSinglePlanMode ? 'Custom Single Plan' : 'Available EMI Tenures'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isSinglePlanMode
                    ? 'Enter custom months and rate to calculate installment and total costing'
                    : 'Edit rates directly for any tenure, or click a row to view schedule'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                {/* Single Plan Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsSinglePlanMode(!isSinglePlanMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer shadow-sm ${
                    isSinglePlanMode
                      ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                  }`}
                  title={isSinglePlanMode ? 'Switch back to all available EMI tenures' : 'Calculate for only one custom tenure and rate'}
                >
                  {isSinglePlanMode ? (
                    <>
                      <List className="w-3.5 h-3.5" />
                      <span>Show All Available Plans</span>
                    </>
                  ) : (
                    <>
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Single Plan Mode</span>
                    </>
                  )}
                </button>

                {!isSinglePlanMode && (
                  <button
                    onClick={handleResetRates}
                    disabled={!isRatesModified}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      isRatesModified
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 cursor-pointer shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
                    }`}
                    title={isRatesModified ? 'Reset all rates to standard bank defaults' : 'Rates are at default benchmarks'}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Rates</span>
                  </button>
                )}

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Exported</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {isSinglePlanMode ? (
              /* Mode B: Custom Single Plan Input & Costing */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80">
                  {/* 1. Months Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Plan Duration (Months)
                      </label>
                      <span className="font-mono text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {singlePlanData.months} Months
                      </span>
                    </div>
                    <div className="relative mb-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={singlePlanMonths ?? ''}
                        onChange={(e) => handleSinglePlanMonthsChange(e.target.value)}
                        onBlur={handleSinglePlanMonthsBlur}
                        placeholder="12"
                        className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                        mo
                      </span>
                    </div>
                    {/* Quick Tenure Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {[3, 6, 9, 12, 18, 24, 36].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setSinglePlanMonths(m)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer font-medium ${
                            Number(singlePlanMonths) === m
                              ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {m}M
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Rate Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Interest / Processing Rate (%)
                      </label>
                      <span className="font-mono text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {isZeroInterest ? '0% (Waived)' : `${singlePlanData.rate}%`}
                      </span>
                    </div>
                    <div className="relative mb-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        disabled={isZeroInterest}
                        value={isZeroInterest ? '0' : (singlePlanRate ?? '')}
                        onChange={(e) => handleSinglePlanRateChange(e.target.value)}
                        onBlur={handleSinglePlanRateBlur}
                        placeholder="9.0"
                        title={isZeroInterest ? '0% Zero-Interest EMI is enabled (rates waived)' : 'Enter rate'}
                        className={`w-full pl-3 pr-8 py-2.5 rounded-xl font-mono text-base font-bold border transition shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          isZeroInterest
                            ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                            : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                        %
                      </span>
                    </div>
                    {/* Quick Rate Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {[0, 3, 5, 7.5, 9, 12, 15].map((r) => (
                        <button
                          key={r}
                          type="button"
                          disabled={isZeroInterest}
                          onClick={() => setSinglePlanRate(r)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer font-medium ${
                            isZeroInterest
                              ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200'
                              : Number(singlePlanRate) === r
                              ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {r}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Real-time Costing Result Table for Single Plan */}
                <div className="overflow-x-auto print-table-wrap rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4 sm:px-6">Plan (Monthly)</th>
                        <th className="py-3.5 px-4 sm:px-6">Flat Fee</th>
                        <th className="py-3.5 px-4 sm:px-6">Eff. APR</th>
                        <th className="py-3.5 px-4 sm:px-6">EMI</th>
                        <th className="py-3.5 px-4 sm:px-6">Charge</th>
                        <th className="py-3.5 px-4 sm:px-6 text-right">Effective Cost</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      <tr className="bg-emerald-50/70 dark:bg-emerald-950/40 font-semibold">
                        <td className="py-4 px-4 sm:px-6 font-sans">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="font-bold text-slate-900 dark:text-white">
                              {singlePlanData.label}
                            </span>
                            <span className="text-[10px] font-sans font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded">
                              Active
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4 sm:px-6 font-sans">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {singlePlanData.rate}%
                          </span>
                        </td>

                        <td className="py-4 px-4 sm:px-6">
                          <span className={`font-bold ${singlePlanData.nominalApr === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {formatNumber(singlePlanData.nominalApr, 2)}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans block">
                            EAR: {formatNumber(singlePlanData.effectiveAnnualRate, 1)}%
                          </span>
                        </td>

                        <td className="py-4 px-4 sm:px-6 font-bold text-slate-900 dark:text-white">
                          <span className="text-emerald-700 dark:text-emerald-400">
                            {formatCurrency(singlePlanData.emi, currency.symbol)}
                          </span>
                          <span className="text-[11px] text-slate-400 font-sans block sm:inline sm:ml-1">
                            / mo
                          </span>
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-slate-600 dark:text-slate-300">
                          {singlePlanData.charge === 0 ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-xs">
                              0% Fee (Free)
                            </span>
                          ) : (
                            <div>
                              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                +{formatCurrency(singlePlanData.charge, currency.symbol)}
                              </span>
                              <span className="text-[11px] text-slate-400 block">
                                ({singlePlanData.rate}%)
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-right font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                          {formatCurrency(singlePlanData.effectiveCost, currency.symbol)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3-Pillar Costing Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-[11px] text-slate-400 font-medium block mb-1 uppercase tracking-wider">
                      Monthly Installment
                    </span>
                    <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(singlePlanData.emi, currency.symbol)}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                      Fixed for {singlePlanData.months} months
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-[11px] text-slate-400 font-medium block mb-1 uppercase tracking-wider">
                      Total Bank Charge
                    </span>
                    <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                      +{formatCurrency(singlePlanData.charge, currency.symbol)}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                      {isZeroInterest
                        ? 'Waived (0.00% APR)'
                        : `${singlePlanData.rate}% flat ≈ ${formatNumber(singlePlanData.nominalApr, 2)}% APR`}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-[11px] text-slate-400 font-medium block mb-1 uppercase tracking-wider">
                      Effective Total Cost
                    </span>
                    <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                      {formatCurrency(singlePlanData.effectiveCost, currency.symbol)}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                      {formatCurrency(Number(amount) || 0, currency.symbol)} principal + fee
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Mode A: All Available Tenures Table */
              <div className="overflow-x-auto print-table-wrap rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Plan (Monthly)</th>
                      <th className="py-3.5 px-4 sm:px-6">Flat Fee</th>
                      <th className="py-3.5 px-4 sm:px-6">Eff. APR</th>
                      <th className="py-3.5 px-4 sm:px-6">EMI</th>
                      <th className="py-3.5 px-4 sm:px-6">Charge</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Effective Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {merchantTable.map((plan, idx) => {
                      const isSelected = selectedPlanIndex === idx;
                      return (
                        <tr
                          key={plan.months}
                          tabIndex={0}
                          aria-selected={isSelected}
                          onClick={() => setSelectedPlanIndex(idx)}
                          onKeyDown={(e) => {
                            if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              setSelectedPlanIndex(idx);
                            }
                          }}
                          className={`transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 ${isSelected
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 font-semibold'
                              : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                            }`}
                        >
                          {/* 1. Plan (Monthly) */}
                          <td className="py-4 px-4 sm:px-6 font-sans">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-transparent'}`} />
                              <span className="font-bold text-slate-900 dark:text-white">
                                {plan.label}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] font-sans font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded">
                                  Selected
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 2. Rate (Editable) */}
                          <td className="py-3 px-4 sm:px-6 font-sans">
                            <div className="relative inline-flex items-center w-20 sm:w-24">
                              <input
                                type="text"
                                inputMode="decimal"
                                disabled={isZeroInterest}
                                aria-label={`Flat fee rate for ${plan.label}`}
                                value={isZeroInterest ? '0' : (rates[plan.months] !== undefined ? rates[plan.months] : plan.rate)}
                                onChange={(e) => handleRateChange(plan.months, e.target.value)}
                                onBlur={() => handleRateBlur(plan.months)}
                                onFocus={() => setSelectedPlanIndex(idx)}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPlanIndex(idx);
                                }}
                                placeholder="0"
                                title={isZeroInterest ? '0% Zero-Interest EMI is enabled (rates waived)' : 'Click to edit rate'}
                                className={`w-full py-1.5 pl-2.5 pr-6 font-mono text-xs sm:text-sm font-bold rounded-xl border transition shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                                  isZeroInterest
                                    ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                                    : isSelected
                                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-emerald-400 dark:border-emerald-500 ring-1 ring-emerald-400/30'
                                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                              />
                              <span className="absolute right-2 text-xs font-semibold text-slate-400 dark:text-slate-500 pointer-events-none select-none">
                                %
                              </span>
                            </div>
                          </td>

                          {/* 3. Effective Annualized APR */}
                          <td className="py-4 px-4 sm:px-6">
                            <span
                              className={`text-xs sm:text-sm font-bold ${
                                plan.nominalApr === 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {formatNumber(plan.nominalApr, 2)}%
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans block">
                              EAR: {formatNumber(plan.effectiveAnnualRate, 1)}%
                            </span>
                          </td>

                          {/* 4. EMI */}
                          <td className="py-4 px-4 sm:px-6 font-bold text-slate-900 dark:text-white">
                            <span className="text-emerald-700 dark:text-emerald-400">
                              {formatCurrency(plan.emi, currency.symbol)}
                            </span>
                            <span className="text-[11px] text-slate-400 font-sans block sm:inline sm:ml-1">
                              / mo
                            </span>
                          </td>

                          {/* 5. Charge */}
                          <td className="py-4 px-4 sm:px-6 text-slate-600 dark:text-slate-300">
                            {plan.charge === 0 ? (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 text-xs">
                                0% Fee (Free)
                              </span>
                            ) : (
                              <div>
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                  +{formatCurrency(plan.charge, currency.symbol)}
                                </span>
                                <span className="text-[11px] text-slate-400 block">
                                  ({plan.rate}%)
                                </span>
                              </div>
                            )}
                          </td>

                          {/* 6. Effective Cost */}
                          <td className="py-4 px-4 sm:px-6 text-right font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                            {formatCurrency(plan.effectiveCost, currency.symbol)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>

          {/* Credit Card EMI vs. Cash Upfront & FDR Opportunity Cost */}
          {selectedPlan && opportunityCost && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5 print-avoid-break">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Credit Card EMI vs. Cash Upfront (FDR Opportunity Cost)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Should you pay {formatCurrency(Number(amount) || 0, currency.symbol)} cash upfront or take {selectedPlan.label} and earn FDR yield?
                    </p>
                  </div>
                </div>

                {/* Verdict Pill */}
                <div
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-extrabold border self-start lg:self-auto ${
                    opportunityCost.verdict === 'emi_wins'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : opportunityCost.verdict === 'cash_wins'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span>
                    {opportunityCost.verdict === 'emi_wins'
                      ? `EMI + FDR Wins by +${formatCurrency(opportunityCost.drawdownNetGain, currency.symbol)}`
                      : opportunityCost.verdict === 'cash_wins'
                      ? `Pay Cash Upfront (Saves +${formatCurrency(Math.abs(opportunityCost.drawdownNetGain), currency.symbol)})`
                      : 'Cash & Self-Funded EMI Break Even'}
                  </span>
                </div>
              </div>

              {/* Opportunity Cost FDR Assumptions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="opp-fdr-rate" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Alternative FDR Rate (%)
                    </label>
                    <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {fdrOpportunityRate}% p.a.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <input
                      id="opp-fdr-rate"
                      type="text"
                      inputMode="decimal"
                      value={fdrOpportunityRate ?? ''}
                      onChange={(e) => handleBoundedPercentChange(setFdrOpportunityRate, e.target.value)}
                      onBlur={() => handlePercentBlur(setFdrOpportunityRate, 9.0)}
                      className="w-20 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs font-bold text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex flex-wrap gap-1">
                      {[6, 8, 9, 10, 12].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFdrOpportunityRate(r)}
                          className={`text-[10px] px-2 py-1 rounded-md border transition cursor-pointer font-semibold ${
                            Number(fdrOpportunityRate) === r
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {r}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="opp-fdr-tax" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      FDR Tax Rate (%)
                    </label>
                    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                      {fdrOpportunityTax}% ({formatNumber(opportunityCost.netFdrAnnualRate, 2)}% net)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <input
                      id="opp-fdr-tax"
                      type="text"
                      inputMode="decimal"
                      value={fdrOpportunityTax ?? ''}
                      onChange={(e) => handleBoundedPercentChange(setFdrOpportunityTax, e.target.value)}
                      onBlur={() => handlePercentBlur(setFdrOpportunityTax, 15)}
                      className="w-20 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs font-bold text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: '0%', val: 0 },
                        { label: '10% TIN', val: 10 },
                        { label: '15% No', val: 15 },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setFdrOpportunityTax(opt.val)}
                          className={`text-[10px] px-2 py-1 rounded-md border transition cursor-pointer font-semibold ${
                            Number(fdrOpportunityTax) === opt.val
                              ? 'bg-amber-500 text-white border-amber-600'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Locked FDR Cycle
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                      {Number(fdrOpportunityInterval) > 0 ? `${fdrOpportunityInterval}M Compound` : 'Flat'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Flat', val: 0 },
                      { label: '1M', val: 1 },
                      { label: '3M', val: 3 },
                      { label: '6M', val: 6 },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setFdrOpportunityInterval(opt.val)}
                        className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition cursor-pointer font-semibold ${
                          Number(fdrOpportunityInterval) === opt.val
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3-Card Opportunity Cost Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: True Reducing-Balance APR */}
                <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                    True Reducing-Balance APR
                  </span>
                  <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                    {formatNumber(opportunityCost.nominalApr, 2)}%{' '}
                    <span className="text-xs font-sans font-semibold text-slate-400">p.a.</span>
                  </div>
                  <div className="space-y-1 text-xs pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Quoted Flat Fee:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {selectedPlan.rate}% ({formatCurrency(opportunityCost.charge, currency.symbol)})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Break-Even FDR Gross:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {Number.isFinite(opportunityCost.breakEvenGrossFdrRate)
                          ? `${formatNumber(opportunityCost.breakEvenGrossFdrRate, 2)}%`
                          : 'Unachievable'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Self-Funded Cashflow Drawdown (Strict TVM) */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/60 dark:border-emerald-500/40 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Self-Funded Cashflow
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                      Apples-to-Apples
                    </span>
                  </div>
                  <div
                    className={`text-2xl font-black font-mono ${
                      opportunityCost.drawdownNetGain >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {opportunityCost.drawdownNetGain >= 0 ? '+' : ''}
                    {formatCurrency(opportunityCost.drawdownNetGain, currency.symbol)}
                  </div>
                  <div className="space-y-1 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Interest Earned (Declining):</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(opportunityCost.drawdownInterestEarned, currency.symbol)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Less Merchant EMI Fee:</span>
                      <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                        -{formatCurrency(opportunityCost.charge, currency.symbol)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Full-Principal Locked FDR (Salary-Funded EMIs) */}
                <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Locked Full-Principal FDR
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {opportunityCost.months}M term
                    </span>
                  </div>
                  <div
                    className={`text-2xl font-black font-mono ${
                      opportunityCost.lockedNetAdvantage >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {opportunityCost.lockedNetAdvantage >= 0 ? '+' : ''}
                    {formatCurrency(opportunityCost.lockedNetAdvantage, currency.symbol)}
                  </div>
                  <div className="space-y-1 text-xs pt-1 border-t border-slate-200/70 dark:border-slate-700/70">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Locked FDR Net Profit:</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(opportunityCost.lockedFdrNetProfit, currency.symbol)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Less Merchant EMI Fee:</span>
                      <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                        -{formatCurrency(opportunityCost.charge, currency.symbol)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                <strong>Why does {selectedPlan.rate}% flat ≈ {formatNumber(opportunityCost.nominalApr, 2)}% APR?</strong> You repay the purchase in {selectedPlan.months} monthly installments, so your average borrowed balance is roughly half the purchase price. Under self-funded cashflow (paying each EMI from your invested funds), an EMI plan only beats paying cash upfront when your net post-tax return exceeds {formatNumber(opportunityCost.nominalApr, 2)}% APR.
              </p>
            </div>
          )}

        </div>
      ) : (
        /* Mode 2: Standard Bank Loan EMI (Personal / Auto / Home loan) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left: Inputs */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Loan Details
              </h3>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                title="Reset to default loan parameters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Principal */}
            <div>
              <label htmlFor="loan-amount" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 block mb-1">
                Loan Amount
              </label>
              <div className="relative mb-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">
                  {currency.symbol}
                </span>
                <input
                  id="loan-amount"
                  type="text"
                  inputMode="numeric"
                  value={amount ?? ''}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  onBlur={handleAmountBlur}
                  placeholder="50000"
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 mr-0.5 font-medium">Quick amounts:</span>
                {[50000, 100000, 200000, 500000, 1000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmount(amt)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer font-medium ${
                      Number(amount) === amt
                        ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {currency.symbol} {formatNumber(amt, 0)}
                  </button>
                ))}
              </div>
            </div>

            {/* Interest Rate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="loan-rate" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Annual Interest Rate (%)
                </label>
                <span className="font-mono text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {annualRate}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  aria-label="Loan Interest Rate Slider"
                  min="0"
                  max="25"
                  step="0.25"
                  value={Math.min(25, Math.max(0, Number(annualRate) || 0))}
                  onChange={(e) => handleAnnualRateChange(e.target.value)}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="relative">
                  <input
                    id="loan-rate"
                    type="text"
                    inputMode="decimal"
                    value={annualRate ?? ''}
                    onChange={(e) => handleAnnualRateChange(e.target.value)}
                    onBlur={handleAnnualRateBlur}
                    placeholder="9.5"
                    className="w-20 pl-2 pr-5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none font-bold">
                    %
                  </span>
                </div>
              </div>

              {/* Quick Rate Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {[0, 7.5, 8.5, 9, 9.5, 10, 11, 12, 14].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setAnnualRate(r)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-lg border transition cursor-pointer font-medium ${
                      Number(annualRate) === r
                        ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="loan-duration" className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Loan Duration (Tenure)
                </label>
                <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {loanDuration} Months {Number(loanDuration) >= 12 ? `(${(Number(loanDuration) / 12).toFixed(1)} Yrs)` : ''}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  aria-label="Loan Duration Slider"
                  min="1"
                  max="360"
                  step="1"
                  value={Math.min(360, Math.max(1, Number(loanDuration) || 1))}
                  onChange={(e) => handleLoanDurationChange(e.target.value)}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="relative">
                  <input
                    id="loan-duration"
                    type="text"
                    inputMode="numeric"
                    value={loanDuration ?? ''}
                    onChange={(e) => handleLoanDurationChange(e.target.value)}
                    onBlur={handleLoanDurationBlur}
                    placeholder="12"
                    className="w-20 pl-2 pr-6 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none font-medium">
                    mo
                  </span>
                </div>
              </div>

              {/* Quick Tenure Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {[
                  { label: '6M', val: 6 },
                  { label: '1Y (12M)', val: 12 },
                  { label: '2Y (24M)', val: 24 },
                  { label: '3Y (36M)', val: 36 },
                  { label: '5Y (60M)', val: 60 },
                  { label: '10Y (120M)', val: 120 },
                  { label: '15Y (180M)', val: 180 },
                  { label: '20Y (240M)', val: 240 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setLoanDuration(item.val)}
                    className={`text-[11px] px-2.5 py-0.5 rounded-lg border transition cursor-pointer font-medium ${
                      Number(loanDuration) === item.val
                        ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Results, Breakdown & Amortization Schedule */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 print-avoid-break">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">
                  Monthly Installment (EMI)
                </span>
                <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(standardLoan.monthlyEmi, currency.symbol)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Principal Amount:</span>
                  <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(Number(amount) || 0, currency.symbol)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Total Interest:</span>
                  <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400">
                    +{formatCurrency(standardLoan.totalInterest, currency.symbol)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Total Payment:</span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrency(standardLoan.totalPayment, currency.symbol)}
                  </span>
                </div>
              </div>

              {/* Principal vs Interest Visual Breakdown Bar */}
              {standardLoan.totalPayment > 0 && (() => {
                const loanPrincipal = Number(amount) || 0;
                const principalShare = (loanPrincipal / standardLoan.totalPayment) * 100;
                const interestShare = (standardLoan.totalInterest / standardLoan.totalPayment) * 100;
                return (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                        Principal vs. Interest Breakdown
                      </span>
                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Principal {formatNumber(principalShare, 1)}%
                        </span>
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          Interest {formatNumber(interestShare, 1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-5 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex">
                      {principalShare > 0 && (
                        <div
                          style={{ width: `${principalShare}%` }}
                          className="h-full bg-emerald-500 transition-all duration-500 flex items-center pl-2 text-[10px] font-mono font-bold text-white truncate"
                          title={`Principal: ${formatCurrency(loanPrincipal, currency.symbol)}`}
                        >
                          {principalShare >= 22 ? formatCurrency(loanPrincipal, currency.symbol) : ''}
                        </div>
                      )}
                      {interestShare > 0 && (
                        <div
                          style={{ width: `${interestShare}%` }}
                          className="h-full bg-amber-500 transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-mono font-bold text-white truncate"
                          title={`Interest: ${formatCurrency(standardLoan.totalInterest, currency.symbol)}`}
                        >
                          {interestShare >= 18 ? formatCurrency(standardLoan.totalInterest, currency.symbol) : ''}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Amortization Schedule Card */}
            {standardLoan.schedule.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      <TableIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                        Loan Amortization Schedule
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Principal vs. interest payoff across {standardLoan.schedule.length} {standardLoan.schedule.length === 1 ? 'month' : 'months'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 no-print">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => setLoanScheduleView('yearly')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                          loanScheduleView === 'yearly'
                            ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        Yearly
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoanScheduleView('monthly')}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                          loanScheduleView === 'monthly'
                            ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        Monthly
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportLoanScheduleCSV}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                      title="Export amortization schedule to CSV"
                    >
                      {loanCsvCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Exported</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>CSV</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsLoanScheduleExpanded((prev) => !prev)}
                      aria-expanded={isLoanScheduleExpanded}
                      aria-label="Toggle Loan Schedule Visibility"
                      className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      {isLoanScheduleExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isLoanScheduleExpanded && (
                  <div className="mt-4 overflow-x-auto max-h-96 print-expand print-table-wrap rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">{loanScheduleView === 'yearly' ? 'Year' : 'Month'}</th>
                          <th className="py-2.5 px-3">Opening</th>
                          <th className="py-2.5 px-3">{loanScheduleView === 'yearly' ? 'Total Paid' : 'EMI'}</th>
                          <th className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400">Principal</th>
                          <th className="py-2.5 px-3 text-amber-600 dark:text-amber-400">Interest</th>
                          <th className="py-2.5 px-3 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                        {loanScheduleView === 'yearly'
                          ? yearlyLoanSchedule.map((row) => (
                              <tr key={row.year} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                <td className="py-2.5 px-3 font-sans font-bold text-slate-800 dark:text-slate-200">
                                  Yr {row.year}{' '}
                                  <span className="text-[10px] font-normal text-slate-400">
                                    (M{row.startMonth}–{row.endMonth})
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                  {formatCurrency(row.openingBalance, currency.symbol)}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                  {formatCurrency(row.totalEmi, currency.symbol)}
                                </td>
                                <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                                  {formatCurrency(row.principalPaid, currency.symbol)}
                                </td>
                                <td className="py-2.5 px-3 text-amber-600 dark:text-amber-400">
                                  {formatCurrency(row.interestPaid, currency.symbol)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                                  {formatCurrency(row.remainingBalance, currency.symbol)}
                                </td>
                              </tr>
                            ))
                          : standardLoan.schedule.map((row) => (
                              <tr key={row.month} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">
                                  #{row.month}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                  {formatCurrency(row.openingBalance, currency.symbol)}
                                </td>
                                <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                  {formatCurrency(row.emi, currency.symbol)}
                                </td>
                                <td className="py-2.5 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                                  {formatCurrency(row.principalPaid, currency.symbol)}
                                </td>
                                <td className="py-2.5 px-3 text-amber-600 dark:text-amber-400">
                                  {formatCurrency(row.interestPaid, currency.symbol)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                                  {formatCurrency(row.remainingBalance, currency.symbol)}
                                </td>
                              </tr>
                            ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Educational Note */}
      <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
        {calculatorType === 'merchant' ? (
          <>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Understanding Credit Card EMI Charges:
            </h4>
            <p className="leading-relaxed">
              <strong>Plan (Monthly)</strong> indicates the total repayment tenure in months. <strong>Rate (%)</strong> is the customizable bank convenience or interest rate for each tenure. <strong>EMI</strong> is the fixed amount you pay each month on your card bill. <strong>Charge</strong> is the bank’s calculated fee. <strong>Effective Cost</strong> is the total amount you will have paid after finishing all installments.
            </p>
          </>
        ) : (
          <>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Understanding Bank Loan EMI & Reducing Balance:
            </h4>
            <p className="leading-relaxed">
              <strong>Loan Amount</strong> is the total principal borrowed from the bank. <strong>Annual Interest Rate (%)</strong> is calculated using the reducing balance method, where monthly interest decreases as your outstanding loan balance goes down. <strong>Tenure</strong> is your chosen repayment period in months or years. <strong>Monthly EMI</strong> is your fixed monthly installment covering both principal repayment and interest. <strong>Total Payment</strong> is the overall amount you repay across the tenure (Principal + Total Interest).
            </p>
          </>
        )}
      </div>

    </div>
  );
}

