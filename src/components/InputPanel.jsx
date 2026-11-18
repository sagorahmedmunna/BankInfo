import React from 'react';
import { 
  RotateCcw, 
  Sliders, 
  DollarSign, 
  Calendar, 
  Repeat, 
  Percent, 
  Receipt,
  Info,
  Link2,
  Check
} from 'lucide-react';
import { formatNumber, formatQuickAmount } from '../utils/formatters';
import { MAX_FDR_DURATION_MONTHS } from '../utils/fdrCalculator';

const PRESETS = [
  {
    name: '1 Year @ 3 Months (Standard)',
    badge: 'Popular',
    values: { amount: 100000, totalDuration: 12, interval: 3, annualRate: 9, taxRate: 15 }
  },
  {
    name: '3 Years @ 3 Months (Growth)',
    badge: 'High Yield',
    values: { amount: 200000, totalDuration: 36, interval: 3, annualRate: 9.5, taxRate: 15 }
  },
  {
    name: '2 Years @ 6 Months (Semi-Annual)',
    badge: 'Balanced',
    values: { amount: 300000, totalDuration: 24, interval: 6, annualRate: 8.5, taxRate: 15 }
  },
  {
    name: '1 Year @ Monthly (DPS style)',
    badge: 'Fast Compound',
    values: { amount: 50000, totalDuration: 12, interval: 1, annualRate: 8, taxRate: 15 }
  }
];

export default function InputPanel({
  inputs,
  setInputs,
  currency,
  onReset,
  onCopyShareLink,
  shareCopied = false
}) {
  const { amount, totalDuration, interval, annualRate, taxRate } = inputs;

  const handleNumericChange = (field, value) => {
    // Only allow whole number digits
    if (value === '' || /^\d*$/.test(value)) {
      setInputs(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleDecimalChange = (field, value) => {
    // Allow digits and at most one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputs(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleBlur = (field) => {
    setInputs(prev => {
      const val = prev[field];
      const num = Number(val);
      if (val === '' || isNaN(num)) {
        return {
          ...prev,
          [field]: field === 'totalDuration' ? 1 : 0
        };
      }
      if (field === 'totalDuration') {
        return {
          ...prev,
          totalDuration: Math.min(MAX_FDR_DURATION_MONTHS, Math.max(1, Math.floor(num)))
        };
      }
      if (field === 'interval') {
        return {
          ...prev,
          interval: Math.min(MAX_FDR_DURATION_MONTHS, Math.max(0, Math.floor(num)))
        };
      }
      if (field === 'annualRate' || field === 'taxRate') {
        return {
          ...prev,
          [field]: Math.min(100, Math.max(0, num))
        };
      }
      return {
        ...prev,
        [field]: Math.max(0, num)
      };
    });
  };

  const applyPreset = (presetValues) => {
    setInputs(presetValues);
  };

  const numTotalDuration = Number(totalDuration) || 0;
  const parsedInterval = interval === '' || interval === null || interval === undefined ? 0 : Number(interval);
  const numInterval = isNaN(parsedInterval) || parsedInterval < 0 ? 0 : parsedInterval;
  const isFlat = numInterval === 0;
  const cycles = !isFlat && numInterval > 0 ? Math.floor(numTotalDuration / numInterval) : 0;
  const remainingMonths = !isFlat && numInterval > 0 ? numTotalDuration % numInterval : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm shadow-slate-100 dark:shadow-none transition-colors">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Sliders className="w-4 h-4" />
          </div>
          <h2 className="font-semibold text-slate-900 dark:text-white text-base">
            Investment Parameters
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          {onCopyShareLink && (
            <button
              type="button"
              onClick={onCopyShareLink}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400 transition py-1 px-2 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer"
              title="Copy shareable link for this FDR scenario"
            >
              {shareCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Link Copied</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Reset to default values"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Quick Preset Buttons */}
      <div className="mb-6">
        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block uppercase tracking-wider">
          Quick Scenarios
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => applyPreset(p.values)}
              className="text-left p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/80 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {p.badge}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-1">
                {p.name.split('(')[0]}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Input Fields */}
      <div className="space-y-5">
        
        {/* 1. Deposit Amount */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="fdr-amount" className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Initial Deposit Amount
            </label>
            <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              {currency.symbol} {formatNumber(amount, 0)}
            </span>
          </div>

          <div className="relative mb-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium">
              {currency.symbol}
            </span>
            <input
              id="fdr-amount"
              type="text"
              inputMode="numeric"
              value={amount ?? ''}
              onChange={(e) => handleNumericChange('amount', e.target.value)}
              onBlur={() => handleBlur('amount')}
              className="w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              placeholder="100000"
            />
          </div>

          {/* Quick Amount Adders */}
          <div className="flex flex-wrap gap-1.5">
            {[50000, 100000, 500000, 1000000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setInputs(prev => ({ ...prev, amount: amt }))}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                  Number(amount) === amt
                    ? 'bg-emerald-500 text-white border-emerald-600 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {formatQuickAmount(amt, currency.code)}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Total Duration (months) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="fdr-duration" className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-500" />
              Total Duration (Months)
            </label>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
              {totalDuration} mo {Number(totalDuration) >= 12 ? `(${(Number(totalDuration) / 12).toFixed(1)} yr)` : ''}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              aria-label="Total Duration Slider"
              min="1"
              max="120"
              step="1"
              value={Math.min(120, Math.max(1, Number(totalDuration) || 1))}
              onChange={(e) => handleNumericChange('totalDuration', e.target.value)}
              className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <input
              id="fdr-duration"
              type="text"
              inputMode="numeric"
              value={totalDuration ?? ''}
              onChange={(e) => handleNumericChange('totalDuration', e.target.value)}
              onBlur={() => handleBlur('totalDuration')}
              className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-white font-mono text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Quick Duration Buttons */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[1, 3, 6, 12, 24, 36, 60].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setInputs(prev => ({
                    ...prev,
                    totalDuration: m,
                    interval: Number(prev.interval) > 0 && Number(prev.interval) > m ? m : prev.interval
                  }));
                }}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                  Number(totalDuration) === m
                    ? 'bg-sky-500 text-white border-sky-600 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {m < 12 ? `${m}M` : `${m / 12}Y`}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Reinvestment Interval (months) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="fdr-interval" className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Repeat className="w-4 h-4 text-teal-500" />
              Reinvestment Interval (Months)
            </label>
            <span className="text-xs sm:text-sm font-bold text-teal-600 dark:text-teal-400">
              {isFlat ? 'None (Flat)' : `${cycles} ${cycles === 1 ? 'cycle' : 'cycles'}${remainingMonths > 0 ? ` + ${remainingMonths}m` : ''}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              aria-label="Reinvestment Interval Slider"
              min="0"
              max={Math.max(1, Math.min(numTotalDuration || 12, 24))}
              step="1"
              value={isFlat ? 0 : Math.min(numInterval, Math.max(1, Math.min(numTotalDuration || 12, 24)))}
              onChange={(e) => handleNumericChange('interval', e.target.value)}
              className="w-full accent-teal-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <input
              id="fdr-interval"
              type="text"
              inputMode="numeric"
              value={interval ?? ''}
              onChange={(e) => handleNumericChange('interval', e.target.value)}
              onBlur={() => handleBlur('interval')}
              className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-white font-mono text-xs text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Quick Interval Chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              { label: 'None (Flat)', val: 0 },
              { label: '1M (Monthly)', val: 1 },
              { label: '3M (Quarterly)', val: 3 },
              { label: '6M (Half-Yearly)', val: 6 },
              { label: '12M (Annual)', val: 12 },
            ].map((item) => (
              <button
                key={item.val}
                type="button"
                onClick={() => setInputs(prev => ({ ...prev, interval: item.val }))}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                  interval !== '' && Number(interval) === item.val
                    ? 'bg-teal-500 text-white border-teal-600 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {isFlat && (
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 bg-slate-100 dark:bg-slate-800/70 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
              One-Time Flat FDR selected (No periodic compounding). Interest is calculated once on your initial principal at maturity.
            </p>
          )}

          {!isFlat && numTotalDuration > 0 && numInterval >= numTotalDuration && (
            <p className="text-[11px] text-sky-700 dark:text-sky-300 mt-2 bg-sky-50 dark:bg-sky-950/40 p-2 rounded-lg border border-sky-200 dark:border-sky-800/50 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Interval ({numInterval}m) meets or exceeds total duration ({numTotalDuration}m). It settles as a single {numTotalDuration}-month pro-rata term at maturity.
            </p>
          )}

          {!isFlat && numTotalDuration > 0 && numInterval < numTotalDuration && remainingMonths > 0 && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800/50">
              Note: {cycles} full compounding {cycles === 1 ? 'cycle' : 'cycles'} plus {remainingMonths} final pro-rata {remainingMonths === 1 ? 'month' : 'months'} settled at maturity.
            </p>
          )}
        </div>

        {/* 4. Annual Interest Rate (%) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="fdr-rate" className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
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
              aria-label="Annual Interest Rate Slider"
              min="1"
              max="25"
              step="0.25"
              value={Math.min(25, Math.max(1, Number(annualRate) || 1))}
              onChange={(e) => handleDecimalChange('annualRate', e.target.value)}
              className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="relative">
              <input
                id="fdr-rate"
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

          {/* Quick Rate Buttons */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setInputs(prev => ({ ...prev, annualRate: r }))}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition cursor-pointer ${
                  Number(annualRate) === r
                    ? 'bg-emerald-500 text-white border-emerald-600 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {r}%
              </button>
            ))}
          </div>
        </div>

        {/* 5. Tax Rate on Interest (%) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="fdr-tax" className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-amber-500" />
              Tax Rate on Interest (%)
            </label>
            <span className="font-mono text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400">
              {taxRate}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              aria-label="Tax Rate Slider"
              min="0"
              max="50"
              step="1"
              value={Math.min(50, Math.max(0, Number(taxRate) || 0))}
              onChange={(e) => handleDecimalChange('taxRate', e.target.value)}
              className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="relative">
              <input
                id="fdr-tax"
                type="text"
                inputMode="decimal"
                value={taxRate ?? ''}
                onChange={(e) => handleDecimalChange('taxRate', e.target.value)}
                onBlur={() => handleBlur('taxRate')}
                className="w-20 pl-2 pr-5 py-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-white font-mono text-xs text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                %
              </span>
            </div>
          </div>

          {/* Quick Tax Rate Presets */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              { label: '0% (Exempt)', val: 0 },
              { label: '5% (Rebate)', val: 5 },
              { label: '10% (TIN/Filer)', val: 10 },
              { label: '15% (Non-Filer)', val: 15 },
              { label: '20% (Corporate)', val: 20 },
            ].map((item) => (
              <button
                key={item.val}
                type="button"
                onClick={() => setInputs(prev => ({ ...prev, taxRate: item.val }))}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition ${
                  Number(taxRate) === item.val
                    ? 'bg-amber-500 text-white border-amber-600 font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
