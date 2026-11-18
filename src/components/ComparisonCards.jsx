import React from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  Wallet,
  CheckCircle2,
  Repeat
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { calculateCompoundedFDR } from '../utils/fdrCalculator';

export default function ComparisonCards({ results, currency, onSelectInterval }) {
  const { inputs, simple, compounded, difference } = results;
  const { amount, totalDuration, interval, annualRate, taxRate, isFlat } = inputs;
  const isPositiveGain = !isFlat && difference.interestDifference > 0.005;

  // If flat (None selected), compute a quick preview of 3M quarterly compounding as a helpful tip
  const quarterlyPreview = isFlat && totalDuration >= 3
    ? calculateCompoundedFDR(amount, totalDuration, 3, annualRate, taxRate)
    : null;
  const quarterlyExtra = quarterlyPreview ? Math.max(0, quarterlyPreview.netInterest - simple.netInterest) : 0;
  const cyclesLabel = compounded.hasPartialCycle
    ? `${compounded.cycles} ${compounded.cycles === 1 ? 'cycle' : 'cycles'} + ${compounded.remainingMonths}m pro-rata`
    : `${compounded.cycles} ${compounded.cycles === 1 ? 'cycle' : 'cycles'}`;

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* Hero Highlight Banner */}
      {isFlat ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 text-white p-5 sm:p-6 shadow-lg shadow-sky-900/10 transition print-avoid-break">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold uppercase tracking-wider mb-2">
                <Wallet className="w-3.5 h-3.5" />
                One-Time Flat FDR
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                Maturity Payout: {formatCurrency(simple.totalAmount, currency.symbol)}
              </h3>
              <p className="text-xs sm:text-sm text-sky-100 max-w-md mt-1">
                Traditional flat calculation across {totalDuration} {totalDuration === 1 ? 'month' : 'months'} with no periodic reinvestment cycles.
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-xl p-3.5 sm:p-4 text-right flex md:flex-col justify-between items-end gap-1">
              <span className="text-xs text-sky-100 uppercase tracking-wider block font-medium">
                Net Profit (Post-Tax)
              </span>
              <div className="flex items-baseline gap-1.5 justify-end">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono">
                  +{formatCurrency(simple.netInterest, currency.symbol)}
                </span>
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-sky-400/30 text-sky-100">
                <span>Net APY: {formatNumber(difference.netEffectiveApy, 2)}%</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`relative overflow-hidden rounded-2xl text-white p-5 sm:p-6 shadow-lg transition print-avoid-break ${
          isPositiveGain
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 shadow-emerald-900/10'
            : 'bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 shadow-slate-900/10'
        }`}>
          {/* Subtle decorative circles */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute right-20 -top-8 w-24 h-24 bg-teal-400/20 rounded-full blur-lg pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold uppercase tracking-wider mb-2">
                <TrendingUp className="w-3.5 h-3.5" />
                {isPositiveGain ? 'Reinvestment Advantage' : 'Single-Period Settlement'}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                {isPositiveGain ? 'Extra Gain from Reinvestment' : 'Matches Flat Maturity Payout'}
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-md mt-1">
                {isPositiveGain
                  ? `By automatically reinvesting net interest every ${interval} ${interval === 1 ? 'month' : 'months'}, your principal snowballs across ${cyclesLabel}.`
                  : `With a ${interval}-month interval over ${totalDuration} ${totalDuration === 1 ? 'month' : 'months'}, no mid-term renewal occurs before maturity.`}
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-xl p-3.5 sm:p-4 text-right flex md:flex-col justify-between items-end gap-1">
              <span className="text-xs text-emerald-100 uppercase tracking-wider block font-medium">
                {isPositiveGain ? 'Net Gain Bonus' : 'Extra Gain'}
              </span>
              <div className="flex items-baseline gap-1.5 justify-end">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono">
                  {difference.interestDifference > 0 ? '+' : ''}
                  {formatCurrency(difference.interestDifference, currency.symbol)}
                </span>
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-white/15 text-emerald-100">
                {isPositiveGain ? (
                  <>
                    <ArrowUpRight className="w-3 h-3" />
                    <span>+{formatNumber(difference.gainPercentage, 2)}% higher return</span>
                  </>
                ) : (
                  <span>Net APY: {formatNumber(difference.netEffectiveApy, 2)}%</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">

        {/* 1. One-time FDR (Simple) */}
        <div className={`bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 relative flex flex-col justify-between transition-colors ${
          isFlat
            ? 'border-2 border-sky-500/80 dark:border-sky-500/70 shadow-md shadow-sky-500/10'
            : 'border border-slate-200 dark:border-slate-800 shadow-sm shadow-slate-100 dark:shadow-none'
        }`}>
          {isFlat && (
            <div className="absolute -top-3 right-5">
              <span className="bg-sky-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Selected Plan
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">
                    One-time FDR
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Traditional Simple Interest
                  </p>
                </div>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                Flat Payout
              </span>
            </div>

            {/* Main Final Total Amount (Primary Focus) */}
            <div className="mb-5">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                Final Total Amount (At Maturity)
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                {formatCurrency(simple.totalAmount, currency.symbol)}
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <span className="text-slate-400 dark:text-slate-500">Net Interest:</span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                  +{formatCurrency(simple.netInterest, currency.symbol)}
                </span>
                <span className="text-[11px] text-slate-400">(post-tax)</span>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-2.5 text-xs sm:text-sm bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Initial Principal</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                  {formatCurrency(amount, currency.symbol)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Gross Interest ({annualRate}%)</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                  +{formatCurrency(simple.grossInterest, currency.symbol)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Tax Deducted ({taxRate}%)</span>
                <span className="font-mono font-medium text-amber-600 dark:text-amber-400">
                  -{formatCurrency(simple.tax, currency.symbol)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                <span>Net Interest Earned</span>
                <span className="font-mono text-base text-sky-600 dark:text-sky-400 font-bold">
                  +{formatCurrency(simple.netInterest, currency.symbol)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Paid as a lump sum after {totalDuration} months
          </div>
        </div>

        {/* 2. Reinvested FDR (Compounded) OR Disabled Info when None selected */}
        {isFlat ? (
          <div className="bg-slate-50/70 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-5 sm:p-6 flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 dark:text-slate-200 text-base">
                      Reinvested FDR
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Reinvestment Interval: None
                    </p>
                  </div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                  Off
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                You selected <strong>None (Flat)</strong> as the reinvestment interval, so your after-tax profit is not compounded mid-term. Your full interest is paid once at maturity.
              </p>

              {quarterlyPreview && quarterlyExtra > 0 && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                  <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                    <span>With 3-Month Compounding:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(quarterlyExtra, currency.symbol)} extra
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700/90 dark:text-emerald-300/80">
                    Reinvesting every 3 months on this deposit would bring your total payout to{' '}
                    <strong className="font-mono">{formatCurrency(quarterlyPreview.totalAmount, currency.symbol)}</strong>.
                  </p>
                  {onSelectInterval && (
                    <button
                      type="button"
                      onClick={() => onSelectInterval(3)}
                      className="w-full mt-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      Enable 3-Month Reinvestment
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              Select any monthly interval in the left panel to compare compounding
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-500/70 dark:border-emerald-500/60 p-5 sm:p-6 shadow-md shadow-emerald-500/5 relative flex flex-col justify-between transition-colors">

            {/* Recommended Tag */}
            <div className="absolute -top-3 right-5">
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Recommended
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      Reinvested FDR
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Compounded per {interval}-Month Interval
                    </p>
                  </div>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-semibold">
                  {compounded.cycles} {compounded.cycles === 1 ? 'Cycle' : 'Cycles'}
                  {compounded.hasPartialCycle ? ` + ${compounded.remainingMonths}m` : ''}
                </span>
              </div>

              {/* Main Final Total Amount (Primary Focus) */}
              <div className="mb-5 flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 block mb-1 font-medium">
                    Final Total Amount (At Maturity)
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(compounded.totalAmount, currency.symbol)}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className="text-slate-400 dark:text-slate-500">Net Interest:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(compounded.netInterest, currency.symbol)}
                    </span>
                    <span className="text-[11px] text-slate-400">(post-tax)</span>
                  </div>
                </div>
                {isPositiveGain && (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                      EXTRA PROFIT
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 inline-block mt-0.5">
                      +{formatCurrency(difference.interestDifference, currency.symbol)}
                    </span>
                  </div>
                )}
              </div>

              {/* Breakdown List */}
              <div className="space-y-2.5 text-xs sm:text-sm bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Initial Principal</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    {formatCurrency(amount, currency.symbol)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Cumulative Gross Interest</span>
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                    +{formatCurrency(compounded.totalGrossInterest, currency.symbol)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Cumulative Tax Deducted</span>
                  <span className="font-mono font-medium text-amber-600 dark:text-amber-400">
                    -{formatCurrency(compounded.totalTax, currency.symbol)}
                  </span>
                </div>
                <div className="pt-2 border-t border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                  <span>Net Interest Earned</span>
                  <span className="font-mono text-base text-emerald-600 dark:text-emerald-400 font-bold">
                    +{formatCurrency(compounded.netInterest, currency.symbol)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Net Effective APY: {formatNumber(difference.netEffectiveApy, 2)}%
              </span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {compounded.cycles} compound steps
              </span>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}

