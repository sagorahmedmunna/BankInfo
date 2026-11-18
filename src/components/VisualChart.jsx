import React, { useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters';

export default function VisualChart({ results, currency }) {
  const { inputs, simple, compounded, difference } = results;
  const { amount, isFlat } = inputs;
  const [activeCycle, setActiveCycle] = useState(null);

  const cycles = compounded.cyclesList;
  const maxVal = Math.max(simple.totalAmount, compounded.totalAmount, 1);
  const principalPercent = amount > 0 ? (amount / maxVal) * 100 : 0;
  const simpleInterestPercent = simple.netInterest > 0 ? (simple.netInterest / maxVal) * 100 : 0;
  const baseCompoundedPercent = Math.min(simple.netInterest, compounded.netInterest) > 0
    ? (Math.min(simple.netInterest, compounded.netInterest) / maxVal) * 100
    : 0;
  const extraGainPercent = difference.interestDifference > 0
    ? (difference.interestDifference / maxVal) * 100
    : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm shadow-slate-100 dark:shadow-none transition-colors print-avoid-break">

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-5 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              Growth & Payout Visualization
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isFlat
                ? 'Visual breakdown of initial principal vs flat net interest return'
                : 'Visual side-by-side comparison of principal vs net interest return'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="w-3 h-3 rounded-sm bg-slate-300 dark:bg-slate-700"></span> Principal
          </span>
          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <span className="w-3 h-3 rounded-sm bg-sky-500"></span> Simple Profit
          </span>
          {!isFlat && (
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-3 h-3 rounded-sm bg-emerald-500"></span> Reinvested Profit
            </span>
          )}
        </div>
      </div>

      {/* 1. Comparative Stacked Bars */}
      <div className={`space-y-4 ${cycles.length > 0 ? 'mb-8' : ''}`}>

        {/* Simple Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium mb-1.5">
            <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              One-Time FDR (Simple)
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(simple.totalAmount, currency.symbol)}
            </span>
          </div>

          <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex">
            {/* Principal slice */}
            {principalPercent > 0 && (
              <div
                style={{ width: `${principalPercent}%` }}
                className="h-full bg-slate-300 dark:bg-slate-700 transition-all duration-500 flex items-center justify-start px-2 text-[10px] text-slate-700 dark:text-slate-300 font-mono truncate"
                title={`Principal: ${formatCurrency(amount, currency.symbol)}`}
              >
                {principalPercent >= 14 ? 'Principal' : ''}
              </div>
            )}
            {/* Net interest slice */}
            {simpleInterestPercent > 0 && (
              <div
                style={{ width: `${simpleInterestPercent}%` }}
                className="h-full bg-sky-500 transition-all duration-500 flex items-center justify-center px-1 text-[10px] text-white font-mono font-medium truncate"
                title={`Net Interest: ${formatCurrency(simple.netInterest, currency.symbol)}`}
              >
                {simpleInterestPercent >= 10 ? `+${formatNumber(simple.netInterest, 0)}` : ''}
              </div>
            )}
          </div>
        </div>

        {/* Compounded Bar (only shown when reinvestment interval > 0) */}
        {!isFlat && (
          <div>
            <div className="flex items-center justify-between text-xs font-medium mb-1.5">
              <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Reinvested FDR (Compounded)
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(compounded.totalAmount, currency.symbol)}
              </span>
            </div>

            <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex">
              {/* Principal slice */}
              {principalPercent > 0 && (
                <div
                  style={{ width: `${principalPercent}%` }}
                  className="h-full bg-slate-300 dark:bg-slate-700 transition-all duration-500 flex items-center justify-start px-2 text-[10px] text-slate-700 dark:text-slate-300 font-mono truncate"
                  title={`Principal: ${formatCurrency(amount, currency.symbol)}`}
                >
                  {principalPercent >= 14 ? 'Principal' : ''}
                </div>
              )}
              {/* Base Net interest matching simple */}
              {baseCompoundedPercent > 0 && (
                <div
                  style={{ width: `${baseCompoundedPercent}%` }}
                  className="h-full bg-emerald-500 transition-all duration-500 flex items-center justify-center px-1 text-[10px] text-white font-mono font-medium truncate"
                  title={`Compounded Base Interest: ${formatCurrency(Math.min(simple.netInterest, compounded.netInterest), currency.symbol)}`}
                >
                  {baseCompoundedPercent >= 10 ? `+${formatNumber(Math.min(simple.netInterest, compounded.netInterest), 0)}` : ''}
                </div>
              )}
              {/* Extra Gain highlight slice */}
              {extraGainPercent > 0 && (
                <div
                  style={{ width: `${extraGainPercent}%` }}
                  className="h-full bg-emerald-400 transition-all duration-500 flex items-center justify-center text-[10px] text-emerald-950 font-bold font-mono overflow-hidden"
                  title={`Extra Reinvestment Gain: +${formatCurrency(difference.interestDifference, currency.symbol)}`}
                >
                  {extraGainPercent >= 4 ? '★' : ''}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* 2. Stepped Growth Over Cycles Timeline */}
      {cycles.length > 0 && (
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Compounding Progression (Cycle by Cycle)
            </h4>
            <span className="text-[11px] text-slate-400 no-print">
              Hover or tap a cycle step for details
            </span>
          </div>

          {/* Stepper bar chart */}
          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            {/* Start Node */}
            <div className="w-[calc(50%-0.375rem)] sm:w-[145px] md:w-[150px] p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Start
                </span>
              </div>
              <div className="my-1">
                <span className="text-xs sm:text-sm font-mono font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap block">
                  {formatCurrency(amount, currency.symbol, 0)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                Month 0
              </span>
            </div>

            {/* Each cycle */}
            {cycles.map((c) => {
              const isActive = activeCycle === c.cycleIndex;
              return (
                <div
                  key={c.cycleIndex}
                  role="button"
                  tabIndex={0}
                  onMouseEnter={() => setActiveCycle(c.cycleIndex)}
                  onMouseLeave={() => setActiveCycle(null)}
                  onFocus={() => setActiveCycle(c.cycleIndex)}
                  onClick={() => setActiveCycle(isActive ? null : c.cycleIndex)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveCycle(isActive ? null : c.cycleIndex);
                    }
                  }}
                  className={`w-[calc(50%-0.375rem)] sm:w-[145px] md:w-[150px] p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                      c.isPartial ? 'text-sky-600 dark:text-sky-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {c.isPartial ? 'Pro-rata' : `Cycle ${c.cycleIndex}`}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-700 dark:text-emerald-300 font-semibold bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
                      +{formatNumber(c.cycleNetInterest, 0)}
                    </span>
                  </div>

                  <div className="my-1">
                    <span className="text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap block">
                      {formatCurrency(c.closingPrincipal, currency.symbol, 0)}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    Month {c.endMonth}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Detail preview if active */}
          {activeCycle && (
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
              {(() => {
                const c = cycles.find((x) => x.cycleIndex === activeCycle);
                if (!c) return null;
                return (
                  <>
                    <div>
                      <span className="text-slate-400">
                        {c.isPartial ? `Final Pro-rata (${c.durationMonths}m)` : `Cycle ${c.cycleIndex}`} (Months {c.startMonth} - {c.endMonth}):
                      </span>{' '}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Opening Balance: {formatCurrency(c.openingPrincipal, currency.symbol)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Cycle Net Interest:</span>{' '}
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(c.cycleNetInterest, currency.symbol)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Tax Deducted:</span>{' '}
                      <span className="font-mono text-amber-600 dark:text-amber-400">-{formatCurrency(c.cycleTax, currency.symbol)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Closing Balance:</span>{' '}
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(c.closingPrincipal, currency.symbol)}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

        </div>
      )}

    </div>
  );
}

