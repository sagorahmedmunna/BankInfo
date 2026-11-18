import React from 'react';
import {
  Target,
  RotateCcw,
  DollarSign,
  Calendar,
  Repeat,
  Percent,
  Receipt,
  TrendingUp,
  Coins,
  ArrowUpRight,
  ExternalLink,
  Link2,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';
import { MAX_FDR_DURATION_MONTHS } from '../utils/fdrCalculator';
import { formatCurrency, formatNumber, formatQuickAmount } from '../utils/formatters';

export const GOAL_DEFAULT_TARGETS = {
  monthly_income: 10000,
  maturity: 500000,
  net_profit: 100000,
};

const GOAL_TYPES = [
  {
    id: 'monthly_income',
    label: 'Monthly Income',
    hint: 'Earn target net profit every month',
    quickTargets: [5000, 10000, 25000, 50000],
  },
  {
    id: 'maturity',
    label: 'Maturity Target',
    hint: 'Reach target final balance',
    quickTargets: [200000, 500000, 1000000, 2500000],
  },
  {
    id: 'net_profit',
    label: 'Net Profit Goal',
    hint: 'Earn target total net interest',
    quickTargets: [50000, 100000, 250000, 500000],
  },
];

export default function GoalFdrPanel({
  goalInputs,
  setGoalInputs,
  goalResults,
  currency,
  onReset,
  onApplyToSingle,
  onCopyShareLink,
  shareCopied = false,
}) {
  const { goalType, targetAmount, totalDuration, interval, annualRate, taxRate } = goalInputs;
  const activeGoalMeta = GOAL_TYPES.find((g) => g.id === goalType) || GOAL_TYPES[0];

  const handleGoalTypeChange = (nextType) => {
    setGoalInputs((prev) => {
      const wasDefaultTarget =
        Number(prev.targetAmount) === GOAL_DEFAULT_TARGETS[prev.goalType];
      return {
        ...prev,
        goalType: nextType,
        targetAmount: wasDefaultTarget
          ? GOAL_DEFAULT_TARGETS[nextType]
          : prev.targetAmount,
      };
    });
  };

  const handleNumericChange = (field, value) => {
    if (value === '' || /^\d*$/.test(value)) {
      setGoalInputs((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleDecimalChange = (field, value) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setGoalInputs((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleBlur = (field) => {
    setGoalInputs((prev) => {
      const val = prev[field];
      const num = Number(val);
      if (val === '' || isNaN(num)) {
        return {
          ...prev,
          [field]: field === 'totalDuration' ? 12 : 0,
        };
      }
      if (field === 'totalDuration') {
        return {
          ...prev,
          totalDuration: Math.min(MAX_FDR_DURATION_MONTHS, Math.max(1, Math.floor(num))),
        };
      }
      if (field === 'interval') {
        return {
          ...prev,
          interval: Math.min(MAX_FDR_DURATION_MONTHS, Math.max(0, Math.floor(num))),
        };
      }
      if (field === 'annualRate' || field === 'taxRate') {
        return {
          ...prev,
          [field]: Math.min(100, Math.max(0, num)),
        };
      }
      return {
        ...prev,
        [field]: Math.max(0, num),
      };
    });
  };

  const {
    inputs: solvedInputs,
    isAchievable,
    netAnnualRatePercent,
    simpleRequiredPrincipal,
    compoundedRequiredPrincipal,
    principalSaved,
    simpleVerification,
    compoundedVerification,
  } = goalResults;

  const isMonthlyGoal = solvedInputs.goalType === 'monthly_income';
  const isFlat = solvedInputs.isFlat;
  const primaryRequired = isMonthlyGoal
    ? simpleRequiredPrincipal
    : isFlat
      ? simpleRequiredPrincipal
      : compoundedRequiredPrincipal;

  const numDuration = Number(totalDuration) || 0;
  const parsedInterval = interval === '' || interval === null || interval === undefined ? 0 : Number(interval);
  const numInterval = isNaN(parsedInterval) || parsedInterval < 0 ? 0 : parsedInterval;
  const cycles = !isFlat && numInterval > 0 ? Math.floor(solvedInputs.totalDuration / numInterval) : 0;
  const remainingMonths = !isFlat && numInterval > 0 ? solvedInputs.totalDuration % numInterval : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
      {/* Left Column: Goal Parameters */}
      <div className="lg:col-span-5 w-full lg:sticky lg:top-20">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm transition-colors space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Target className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                Goal Parameters
              </h3>
            </div>
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Reset goal planner"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* 1. Goal Type Selector */}
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block uppercase tracking-wider">
              What is your goal?
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {GOAL_TYPES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => handleGoalTypeChange(g.id)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${goalType === g.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                    }`}
                >
                  <div className="text-xs font-bold leading-snug">{g.label}</div>
                  <div className="text-[10px] opacity-75 leading-tight mt-0.5">{g.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Target Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="goal-target"
                className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <DollarSign className="w-4 h-4 text-emerald-500" />
                {goalType === 'monthly_income'
                  ? 'Target Monthly Net Income'
                  : goalType === 'net_profit'
                    ? 'Target Total Net Profit'
                    : 'Target Maturity Balance'}
              </label>
              <span className="font-mono text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                {formatCurrency(Number(targetAmount) || 0, currency.symbol, 0)}
              </span>
            </div>
            <div className="relative mb-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium">
                {currency.symbol}
              </span>
              <input
                id="goal-target"
                type="text"
                inputMode="numeric"
                value={targetAmount ?? ''}
                onChange={(e) => handleNumericChange('targetAmount', e.target.value)}
                onBlur={() => handleBlur('targetAmount')}
                className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                placeholder={String(GOAL_DEFAULT_TARGETS[goalType] || 10000)}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeGoalMeta.quickTargets.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setGoalInputs((prev) => ({ ...prev, targetAmount: amt }))}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition cursor-pointer ${Number(targetAmount) === amt
                      ? 'bg-emerald-500 text-white border-emerald-600 font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  {formatQuickAmount(amt, currency.code)}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Horizon / Duration */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="goal-duration"
                className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4 text-sky-500" />
                {goalType === 'monthly_income' ? 'Reference Horizon (Months)' : 'Target Timeframe (Months)'}
              </label>
              <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                {totalDuration} mo {numDuration >= 12 ? `(${(numDuration / 12).toFixed(1)} yr)` : ''}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                aria-label="Goal Duration Slider"
                min="1"
                max="120"
                step="1"
                value={Math.min(120, Math.max(1, Number(totalDuration) || 1))}
                onChange={(e) => handleNumericChange('totalDuration', e.target.value)}
                className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <input
                id="goal-duration"
                type="text"
                inputMode="numeric"
                value={totalDuration ?? ''}
                onChange={(e) => handleNumericChange('totalDuration', e.target.value)}
                onBlur={() => handleBlur('totalDuration')}
                className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-white font-mono text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[6, 12, 24, 36, 60, 120].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setGoalInputs((prev) => ({ ...prev, totalDuration: m }))}
                  className={`text-[11px] px-2 py-0.5 rounded-md border transition cursor-pointer ${Number(totalDuration) === m
                      ? 'bg-sky-500 text-white border-sky-600 font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  {m < 12 ? `${m}M` : `${m / 12}Y`}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Reinvestment Interval */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="goal-interval"
                className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <Repeat className="w-4 h-4 text-teal-500" />
                Reinvestment Interval (Months)
              </label>
              <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                {isFlat ? 'Flat (None)' : `${cycles}c${remainingMonths > 0 ? ` + ${remainingMonths}m` : ''}`}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: 'Flat (0)', val: 0 },
                { label: '1M', val: 1 },
                { label: '3M', val: 3 },
                { label: '6M', val: 6 },
                { label: '12M', val: 12 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setGoalInputs((prev) => ({ ...prev, interval: opt.val }))}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition cursor-pointer ${interval !== '' && Number(interval) === opt.val
                      ? 'bg-teal-500 text-white border-teal-600 font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
              <input
                id="goal-interval"
                type="text"
                inputMode="numeric"
                aria-label="Custom goal reinvestment interval in months"
                value={interval ?? ''}
                onChange={(e) => handleNumericChange('interval', e.target.value)}
                onBlur={() => handleBlur('interval')}
                className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-white font-mono text-xs text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* 5. Annual Interest Rate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="goal-rate"
                className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <Percent className="w-4 h-4 text-emerald-500" />
                Annual Interest Rate (%)
              </label>
              <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {annualRate}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                aria-label="Goal Annual Rate Slider"
                min="1"
                max="20"
                step="0.25"
                value={Math.min(20, Math.max(1, Number(annualRate) || 1))}
                onChange={(e) => handleDecimalChange('annualRate', e.target.value)}
                className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="relative">
                <input
                  id="goal-rate"
                  type="text"
                  inputMode="decimal"
                  value={annualRate ?? ''}
                  onChange={(e) => handleDecimalChange('annualRate', e.target.value)}
                  onBlur={() => handleBlur('annualRate')}
                  className="w-20 pl-2 pr-5 py-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-white font-mono text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* 6. Tax Rate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="goal-tax"
                className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
              >
                <Receipt className="w-4 h-4 text-amber-500" />
                Tax Rate on Interest (%)
              </label>
              <span className="font-mono text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400">
                {taxRate}%
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: '0%', val: 0 },
                { label: '10% TIN', val: 10 },
                { label: '15% Standard', val: 15 },
                { label: '20%', val: 20 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setGoalInputs((prev) => ({ ...prev, taxRate: opt.val }))}
                  className={`text-[11px] px-2 py-1 rounded-md border transition cursor-pointer ${Number(taxRate) === opt.val
                      ? 'bg-amber-500 text-white border-amber-600 font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
              <input
                id="goal-tax"
                type="text"
                inputMode="decimal"
                value={taxRate ?? ''}
                onChange={(e) => handleDecimalChange('taxRate', e.target.value)}
                onBlur={() => handleBlur('taxRate')}
                className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-white font-mono text-xs text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Solved Principal & Verification */}
      <div className="lg:col-span-7 w-full space-y-6">
        {!isAchievable ? (
          <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <div className="font-bold">Positive Net Return Required</div>
              <p className="text-xs opacity-90">
                To earn recurring income or profit, set an Annual Interest Rate above 0% and a Tax Rate below 100%.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Hero Answer Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-5 sm:p-6 shadow-lg shadow-emerald-900/10 print-avoid-break">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">
                    <Target className="w-3.5 h-3.5 text-amber-300" />
                    <span>
                      {isMonthlyGoal
                        ? 'Required Principal (Monthly Income)'
                        : solvedInputs.goalType === 'net_profit'
                          ? 'Required Principal (Net Profit Goal)'
                          : 'Required Principal (Maturity Target)'}
                    </span>
                  </div>

                  <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight">
                    {formatCurrency(primaryRequired ?? 0, currency.symbol, 0)}
                  </div>

                  <p className="text-xs text-emerald-100 max-w-xl leading-relaxed">
                    {isMonthlyGoal ? (
                      <>
                        Deposit{' '}
                        <strong className="text-white font-mono">
                          {formatCurrency(simpleRequiredPrincipal ?? 0, currency.symbol, 0)}
                        </strong>{' '}
                        at {formatNumber(solvedInputs.annualRate, 2)}% p.a. ({formatNumber(netAnnualRatePercent, 2)}% net after {solvedInputs.taxRate}% tax) to generate{' '}
                        <strong className="text-white font-mono">
                          {formatCurrency(solvedInputs.targetAmount, currency.symbol)}/month
                        </strong>{' '}
                        in net interest without touching your principal.
                      </>
                    ) : solvedInputs.goalType === 'net_profit' ? (
                      <>
                        Deposit{' '}
                        <strong className="text-white font-mono">
                          {formatCurrency(primaryRequired ?? 0, currency.symbol, 0)}
                        </strong>{' '}
                        for {solvedInputs.totalDuration} months
                        {!isFlat ? ` (${solvedInputs.interval}M reinvestment)` : ' (flat FDR)'} to earn{' '}
                        <strong className="text-white font-mono">
                          +{formatCurrency(solvedInputs.targetAmount, currency.symbol)}
                        </strong>{' '}
                        net profit after tax.
                      </>
                    ) : (
                      <>
                        Start with{' '}
                        <strong className="text-white font-mono">
                          {formatCurrency(primaryRequired ?? 0, currency.symbol, 0)}
                        </strong>{' '}
                        to reach{' '}
                        <strong className="text-white font-mono">
                          {formatCurrency(solvedInputs.targetAmount, currency.symbol)}
                        </strong>{' '}
                        at maturity in {solvedInputs.totalDuration} months ({(solvedInputs.totalDuration / 12).toFixed(1)} yrs).
                      </>
                    )}
                  </p>
                </div>

                {principalSaved > 1 && !isFlat && (
                  <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-xl p-3.5 text-right shrink-0 space-y-0.5">
                    <span className="text-[10px] text-emerald-100 uppercase tracking-wider block font-semibold">
                      Capital Saved vs Flat FDR
                    </span>
                    <div className="text-xl font-black font-mono text-white">
                      {formatCurrency(principalSaved, currency.symbol, 0)}
                    </div>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-100">
                      <ArrowUpRight className="w-3 h-3" />
                      Less upfront deposit needed
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center gap-2 no-print">
                <button
                  type="button"
                  onClick={() =>
                    onApplyToSingle &&
                    onApplyToSingle({
                      amount: Math.round(primaryRequired || 0),
                      totalDuration: solvedInputs.totalDuration,
                      interval: solvedInputs.interval,
                      annualRate: solvedInputs.annualRate,
                      taxRate: solvedInputs.taxRate,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open & Inspect Cycle Schedule</span>
                </button>

                {onCopyShareLink && (
                  <button
                    type="button"
                    onClick={onCopyShareLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 text-xs font-semibold transition cursor-pointer"
                  >
                    {shareCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-amber-300" />
                        <span>Goal Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Copy Share Link</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Dual Strategy Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card A: Simple / Regular Income Path */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3 print-avoid-break">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <Coins className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {isMonthlyGoal ? 'Regular Monthly Payout' : 'Flat (Simple Interest) FDR'}
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {isMonthlyGoal ? 'Withdraw net profit monthly' : 'No intermediate reinvestment'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Required Initial Deposit
                  </span>
                  <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                    {formatCurrency(simpleRequiredPrincipal ?? 0, currency.symbol)}
                  </span>
                </div>

                {simpleVerification && (
                  <div className="space-y-1.5 text-xs pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gross Interest ({solvedInputs.totalDuration}m)</span>
                      <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                        +{formatCurrency(simpleVerification.simple.grossInterest, currency.symbol)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tax Deducted ({solvedInputs.taxRate}%)</span>
                      <span className="font-mono text-amber-600 dark:text-amber-400">
                        -{formatCurrency(simpleVerification.simple.tax, currency.symbol)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Net Profit Earned</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(simpleVerification.simple.netInterest, currency.symbol)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 font-bold">
                      <span className="text-slate-700 dark:text-slate-200">
                        {isMonthlyGoal ? 'Exact Monthly Net Income' : 'Final Maturity Total'}
                      </span>
                      <span className="font-mono text-slate-900 dark:text-white">
                        {isMonthlyGoal
                          ? `${formatCurrency(simpleVerification.simple.netInterest / solvedInputs.totalDuration, currency.symbol)}/mo`
                          : formatCurrency(simpleVerification.simple.totalAmount, currency.symbol)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Card B: Reinvested (Compounded) Path */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/70 dark:border-emerald-500/50 p-5 shadow-sm space-y-3 print-avoid-break">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {isMonthlyGoal
                          ? `Reinvested Avg (${solvedInputs.interval || 0}M)`
                          : `Reinvested FDR (${solvedInputs.interval || 0}M)`}
                      </h4>
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        {isFlat
                          ? 'Set interval > 0 to unlock compounding savings'
                          : isMonthlyGoal
                            ? `Averages ${formatCurrency(solvedInputs.targetAmount, currency.symbol)}/mo over ${solvedInputs.totalDuration}m`
                            : `Auto-compounded over ${solvedInputs.totalDuration} months`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block font-medium">
                    Required Initial Deposit
                  </span>
                  <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(compoundedRequiredPrincipal ?? 0, currency.symbol)}
                  </span>
                </div>

                {compoundedVerification && (
                  <div className="space-y-1.5 text-xs pt-1">
                    {(() => {
                      const activeComp = isFlat
                        ? compoundedVerification.simple
                        : compoundedVerification.compounded;
                      const grossVal = isFlat
                        ? activeComp.grossInterest
                        : activeComp.totalGrossInterest;
                      const taxVal = isFlat ? activeComp.tax : activeComp.totalTax;
                      return (
                        <>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Gross Interest ({solvedInputs.totalDuration}m)</span>
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                              +{formatCurrency(grossVal, currency.symbol)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Tax Deducted ({solvedInputs.taxRate}%)</span>
                            <span className="font-mono text-amber-600 dark:text-amber-400">
                              -{formatCurrency(taxVal, currency.symbol)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Total Net Profit Earned</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              +{formatCurrency(activeComp.netInterest, currency.symbol)}
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800 font-bold">
                            <span className="text-slate-700 dark:text-slate-200">
                              Final Maturity Value
                            </span>
                            <span className="font-mono text-emerald-700 dark:text-emerald-300">
                              {formatCurrency(activeComp.totalAmount, currency.symbol)}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Educational clarity note */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {isMonthlyGoal
                  ? 'Regular Monthly Payout calculates the principal needed to generate your target net income every month immediately after tax without reinvesting profits. Reinvested Avg shows the smaller deposit needed if all profit compounds inside the FDR and you measure the average monthly return at maturity.'
                  : 'Reinvestment reduces the initial capital required to hit your target maturity balance because after-tax interest compounds on each renewal cycle.'}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

