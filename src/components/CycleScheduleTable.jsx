import React, { useState, useEffect } from 'react';
import {
  Table,
  Download,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { exportToCsv } from '../utils/csvExport';

export default function CycleScheduleTable({ results, currency }) {
  const { inputs, compounded } = results;
  const { amount, interval, annualRate, taxRate } = inputs;
  const cycles = compounded.cyclesList;
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      const saved = localStorage.getItem('bankinfo_fdr_schedule_expanded');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [copiedCsv, setCopiedCsv] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('bankinfo_fdr_schedule_expanded', JSON.stringify(isExpanded));
    } catch (e) {}
  }, [isExpanded]);

  // Generate CSV data for download
  const downloadCSV = () => {
    const headers = [
      'Cycle',
      'Type',
      'Start Month',
      'End Month',
      'Opening Principal',
      'Gross Interest',
      'Tax Deducted',
      'Net Interest Added',
      'Closing Principal',
      'Cumulative Net Interest',
    ];

    const rows = cycles.map((c) => [
      c.cycleIndex,
      c.isPartial ? `Pro-rata (${c.durationMonths}m)` : 'Full Cycle',
      c.startMonth,
      c.endMonth,
      c.openingPrincipal.toFixed(2),
      c.cycleGrossInterest.toFixed(2),
      c.cycleTax.toFixed(2),
      c.cycleNetInterest.toFixed(2),
      c.closingPrincipal.toFixed(2),
      c.cumulativeNetInterest.toFixed(2),
    ]);

    exportToCsv(`FDR_Reinvestment_Schedule_${amount}_${interval}M.csv`, headers, rows);

    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  if (!cycles || cycles.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm shadow-slate-100 dark:shadow-none transition-colors">

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Table className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              Reinvestment Cycle Schedule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detailed step-by-step breakdown of every {interval}-month renewal
              {compounded.hasPartialCycle ? ` (+ ${compounded.remainingMonths}m final pro-rata)` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* CSV Download Button */}
          <button
            type="button"
            onClick={downloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title="Export schedule to CSV"
          >
            {copiedCsv ? (
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

          {/* Expand/Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Toggle Table Visibility"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3 sm:px-4">Cycle</th>
                  <th className="py-3 px-3 sm:px-4">Period</th>
                  <th className="py-3 px-3 sm:px-4">Opening Principal</th>
                  <th className="py-3 px-3 sm:px-4">Gross Return ({annualRate}%)</th>
                  <th className="py-3 px-3 sm:px-4">Tax Paid ({taxRate}%)</th>
                  <th className="py-3 px-3 sm:px-4 text-emerald-600 dark:text-emerald-400">Net Added</th>
                  <th className="py-3 px-3 sm:px-4 font-bold text-slate-800 dark:text-slate-100">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {cycles.map((c) => (
                  <tr
                    key={c.cycleIndex}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      c.isPartial ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3 sm:px-4 font-bold text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span>#{c.cycleIndex}</span>
                        {c.isPartial && (
                          <span className="font-sans text-[10px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-semibold">
                            Pro-rata
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-sans text-slate-500 dark:text-slate-400">
                      Mo {c.startMonth} - {c.endMonth}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-slate-800 dark:text-slate-200">
                      {formatCurrency(c.openingPrincipal, currency.symbol)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-slate-600 dark:text-slate-400">
                      +{formatCurrency(c.cycleGrossInterest, currency.symbol)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-amber-600 dark:text-amber-400">
                      -{formatCurrency(c.cycleTax, currency.symbol)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                      +{formatCurrency(c.cycleNetInterest, currency.symbol)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(c.closingPrincipal, currency.symbol)}
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Table Footer Summary */}
              <tfoot className="bg-slate-50/80 dark:bg-slate-800/80 font-mono font-semibold text-slate-800 dark:text-slate-200 border-t-2 border-slate-200 dark:border-slate-700">
                <tr>
                  <td colSpan="3" className="py-3 px-3 sm:px-4 font-sans font-bold text-slate-900 dark:text-white">
                    Total Maturity Sum
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-slate-700 dark:text-slate-300">
                    +{formatCurrency(compounded.totalGrossInterest, currency.symbol)}
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-amber-600 dark:text-amber-400">
                    -{formatCurrency(compounded.totalTax, currency.symbol)}
                  </td>
                  <td className="py-3 px-3 sm:px-4 text-emerald-600 dark:text-emerald-400 bg-emerald-100/40 dark:bg-emerald-950/40 font-bold">
                    +{formatCurrency(compounded.netInterest, currency.symbol)}
                  </td>
                  <td className="py-3 px-3 sm:px-4 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {formatCurrency(compounded.totalAmount, currency.symbol)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

