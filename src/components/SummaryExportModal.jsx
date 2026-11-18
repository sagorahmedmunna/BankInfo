import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, FileText, AlertCircle, Link2, Download } from 'lucide-react';
import { formatNumber } from '../utils/formatters';
import { copyTextToClipboard } from '../utils/shareLink';

function buildSingleStatement(results, sym) {
  const { inputs, simple, compounded, difference } = results;
  const { amount, totalDuration, interval, annualRate, taxRate, isFlat } = inputs;

  const cyclesCount = !isFlat && interval > 0 ? Math.floor(totalDuration / interval) : 0;
  const partialSuffix = !isFlat && compounded.hasPartialCycle
    ? ` + ${compounded.remainingMonths}m pro-rata`
    : '';
  const intervalLabel = isFlat
    ? 'None (One-Time Flat FDR)'
    : `Every ${interval} months (${cyclesCount} ${cyclesCount === 1 ? 'cycle' : 'cycles'}${partialSuffix})`;

  const lines = [
    '==================== INVESTMENT SUMMARY ====================',
    `Initial Deposit Amount         : ${sym} ${formatNumber(amount, 2)}`,
    `Total Duration                 : ${totalDuration} months (${(totalDuration / 12).toFixed(1)} years)`,
    `Reinvestment Interval          : ${intervalLabel}`,
    `Annual Interest Rate           : ${annualRate.toFixed(2)}%`,
    `Tax Rate on Interest           : ${taxRate.toFixed(2)}%`,
    '------------------------------------------------------------',
    '1. One-Time FDR (Traditional):',
    `   - Gross Interest Earned     : ${sym} ${formatNumber(simple.grossInterest, 2)}`,
    `   - Tax Deducted              : ${sym} ${formatNumber(simple.tax, 2)}`,
    `   - Net Interest Earned       : ${sym} ${formatNumber(simple.netInterest, 2)}`,
    `   - Final Maturity Payout     : ${sym} ${formatNumber(simple.totalAmount, 2)}`,
  ];

  if (!isFlat) {
    lines.push(
      '',
      '2. Reinvested FDR (Periodic Compounded):',
      `   - Gross Interest Earned     : ${sym} ${formatNumber(compounded.totalGrossInterest, 2)}`,
      `   - Tax Deducted              : ${sym} ${formatNumber(compounded.totalTax, 2)}`,
      `   - Net Interest Earned       : ${sym} ${formatNumber(compounded.netInterest, 2)}`,
      `   - Final Maturity Payout     : ${sym} ${formatNumber(compounded.totalAmount, 2)}`,
      `   - Net Effective APY         : ${formatNumber(difference.netEffectiveApy, 2)}%`,
      '',
      '------------------------------------------------------------',
      `Difference in Net Interest     : ${sym} ${formatNumber(difference.interestDifference, 2)}`,
      `Extra Gain from Reinvestment   : +${sym} ${formatNumber(difference.interestDifference, 2)} (+${formatNumber(difference.gainPercentage, 2)}%)`
    );
  }

  lines.push('============================================================');
  return lines.join('\n');
}

function buildMultiStatement(multiResults, sym) {
  const { schemes = [], bestScheme, winners = [], isAllEqual, maxDifference, maxDifferencePercent } = multiResults || {};
  const lines = [
    '================ MULTI-FDR COMPARISON SUMMARY ================',
    `Plans Compared                 : ${schemes.length}`,
  ];

  if (isAllEqual) {
    lines.push('Outcome                        : All plans yield equal net profit');
  } else if (winners.length > 1) {
    lines.push(`Tied #1 Winners                : ${winners.map((w) => w.name).join(' & ')}`);
  } else if (bestScheme) {
    lines.push(`Rank #1 Winner                 : ${bestScheme.name}`);
  }

  if (!isAllEqual && maxDifference > 0) {
    lines.push(
      `Advantage vs Lowest Plan       : +${sym} ${formatNumber(maxDifference, 2)} (+${formatNumber(maxDifferencePercent, 1)}%)`
    );
  }

  lines.push('------------------------------------------------------------');

  schemes.forEach((s, idx) => {
    const rankLabel = isAllEqual ? 'Tied' : s.isWinner ? (winners.length > 1 ? 'Tied #1' : '#1 Winner') : `#${s.rank}`;
    const intervalText = s.interval > 0 ? `${s.interval}M Compounding` : 'One-Time Flat';
    lines.push(
      `${idx + 1}. ${s.name} [${rankLabel}]`,
      `   - Deposit / Tenure / Mode   : ${sym} ${formatNumber(s.amount, 0)} | ${s.totalDuration} mo | ${intervalText}`,
      `   - Rate / Tax                : ${s.annualRate.toFixed(2)}% p.a. | ${s.taxRate.toFixed(2)}% tax`,
      `   - Gross / Tax / Net Profit  : +${sym} ${formatNumber(s.grossInterest, 2)} / -${sym} ${formatNumber(s.tax, 2)} / +${sym} ${formatNumber(s.netInterest, 2)}`,
      `   - Maturity Total (Net APY)  : ${sym} ${formatNumber(s.totalAmount, 2)} (${formatNumber(s.netApy, 2)}% APY)`,
      ''
    );
  });

  lines.push('============================================================');
  return lines.join('\n');
}

function buildGoalStatement(goalResults, sym) {
  const { inputs, isAchievable, netAnnualRatePercent, simpleRequiredPrincipal, compoundedRequiredPrincipal, principalSaved } =
    goalResults || {};
  if (!inputs) return '';
  const goalLabel =
    inputs.goalType === 'monthly_income'
      ? `Earn Monthly Net Income (${sym} ${formatNumber(inputs.targetAmount, 2)}/mo)`
      : inputs.goalType === 'net_profit'
      ? `Earn Total Net Profit (${sym} ${formatNumber(inputs.targetAmount, 2)})`
      : `Reach Maturity Balance (${sym} ${formatNumber(inputs.targetAmount, 2)})`;

  const lines = [
    '================= REVERSE / GOAL FDR SUMMARY =================',
    `Goal Type                      : ${goalLabel}`,
    `Horizon / Duration             : ${inputs.totalDuration} months (${(inputs.totalDuration / 12).toFixed(1)} years)`,
    `Compounding Interval           : ${inputs.isFlat ? 'None (Flat)' : `Every ${inputs.interval} months`}`,
    `Annual Rate / Tax Rate         : ${inputs.annualRate.toFixed(2)}% p.a. | ${inputs.taxRate.toFixed(2)}% tax (${formatNumber(netAnnualRatePercent, 2)}% net)`,
    '------------------------------------------------------------',
  ];

  if (!isAchievable) {
    lines.push('Result                         : Unachievable (requires Annual Rate > 0% and Tax < 100%)');
  } else {
    lines.push(
      `Flat / Simple Principal Needed : ${sym} ${formatNumber(simpleRequiredPrincipal ?? 0, 2)}`,
      `Compounded Principal Needed    : ${sym} ${formatNumber(compoundedRequiredPrincipal ?? 0, 2)}`
    );
    if (!inputs.isFlat && principalSaved > 0.01) {
      lines.push(
        `Upfront Capital Saved          : ${sym} ${formatNumber(principalSaved, 2)} (by reinvesting)`
      );
    }
  }

  lines.push('============================================================');
  return lines.join('\n');
}

export default function SummaryExportModal({
  isOpen,
  onClose,
  results,
  multiResults = null,
  goalResults = null,
  fdrMode = 'single',
  currency,
  onCopyShareLink,
  shareCopied = false,
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setCopied(false);
    setCopyError(false);
    previousFocusRef.current = document.activeElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sym = currency?.symbol || '৳';
  const isCompareMode = fdrMode === 'compare' && multiResults?.schemes?.length > 0;
  const isGoalMode = fdrMode === 'goal' && Boolean(goalResults);
  const textOutput = isCompareMode
    ? buildMultiStatement(multiResults, sym)
    : isGoalMode
    ? buildGoalStatement(goalResults, sym)
    : buildSingleStatement(results, sym);

  const handleCopy = async () => {
    setCopyError(false);
    const ok = await copyTextToClipboard(textOutput);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  const handleDownloadTxt = () => {
    const filenamePrefix = isCompareMode
      ? 'Multi_FDR_Comparison_Statement'
      : isGoalMode
      ? 'FDR_Goal_Statement'
      : 'FDR_Investment_Statement';
    const blob = new Blob([textOutput], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filenamePrefix}_${currency?.code || 'BDT'}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
      onClick={onClose}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-export-title"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 id="summary-export-title" className="font-bold text-slate-900 dark:text-white text-base">
                {isCompareMode
                  ? 'Multi-FDR Comparison Statement'
                  : isGoalMode
                  ? 'FDR Goal Statement'
                  : 'Investment Summary Statement'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Formatted calculation summary ready to copy, share, or save
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          <div className="relative">
            <pre className="font-mono text-xs sm:text-sm bg-slate-950 text-slate-100 p-4 sm:p-5 rounded-xl overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
              {textOutput}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            {copyError ? (
              <span className="text-rose-600 dark:text-rose-400 inline-flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Clipboard access blocked — please select and copy the text manually
              </span>
            ) : (
              'Calculated net of taxes with periodic compounding'
            )}
          </span>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {onCopyShareLink && (
              <button
                type="button"
                onClick={onCopyShareLink}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                {shareCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Share Link</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadTxt}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save .txt</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm shadow-emerald-600/20 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Statement</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
