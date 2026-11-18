import React, { useState } from 'react';
import {
  Award,
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  DollarSign,
  Calendar,
  ExternalLink,
  Sparkles,
  BarChart3,
  Table as TableIcon,
  ArrowUpRight,
  Percent,
  Link2,
  Repeat,
  Receipt,
  Download,
  FileText,
  Check
} from 'lucide-react';
import {
  DEFAULT_COMPARED_SCHEMES,
  FDR_COMPARISON_PRESETS,
  MAX_FDR_DURATION_MONTHS
} from '../utils/fdrCalculator';
import { formatCurrency, formatNumber, formatQuickAmount } from '../utils/formatters';
import { exportToCsv } from '../utils/csvExport';

const SCHEME_PALETTES = [
  {
    key: 'emerald',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    barBg: 'bg-emerald-500',
    winnerRowBg: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-l-4 border-l-emerald-500',
  },
  {
    key: 'sky',
    badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    barBg: 'bg-sky-500',
    winnerRowBg: 'bg-sky-50/50 dark:bg-sky-950/20 border-l-4 border-l-sky-500',
  },
  {
    key: 'indigo',
    badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    barBg: 'bg-indigo-500',
    winnerRowBg: 'bg-indigo-50/50 dark:bg-indigo-950/20 border-l-4 border-l-indigo-500',
  },
  {
    key: 'amber',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    barBg: 'bg-amber-500',
    winnerRowBg: 'bg-amber-50/50 dark:bg-amber-950/20 border-l-4 border-l-amber-500',
  },
  {
    key: 'rose',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    barBg: 'bg-rose-500',
    winnerRowBg: 'bg-rose-50/50 dark:bg-rose-950/20 border-l-4 border-l-rose-500',
  },
];

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];
const QUICK_DURATIONS = [
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1Y', months: 12 },
  { label: '2Y', months: 24 },
  { label: '3Y', months: 36 },
];

const INTERVAL_OPTIONS = [
  { value: 0, label: 'None (One-Time Flat)' },
  { value: 1, label: '1 Mo (Monthly)' },
  { value: 3, label: '3 Mo (Quarterly)' },
  { value: 6, label: '6 Mo (Semi-Annual)' },
  { value: 12, label: '12 Mo (Annual)' },
];
const STANDARD_INTERVAL_VALUES = new Set(INTERVAL_OPTIONS.map((o) => o.value));

export const MULTI_SYNC_STORAGE_KEY = 'bankinfo_multi_fdr_sync_v1';
export const DEFAULT_SYNC_FIELDS = {
  amount: false,
  totalDuration: false,
  interval: false,
  annualRate: false,
  taxRate: false,
};
const SYNCABLE_FIELDS = ['amount', 'totalDuration', 'interval', 'annualRate', 'taxRate'];

function generateSchemeId(prefix = 'scheme') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function MultiFdrComparison({
  currency,
  schemes,
  setSchemes,
  syncFields,
  setSyncFields,
  comparisonResults,
  onInspectSingleScheme,
  onOpenExport,
  onCopyShareLink,
  shareCopied = false,
}) {
  const [customIntervalRows, setCustomIntervalRows] = useState({});

  const {
    schemes: rankedSchemes,
    bestScheme,
    lowestScheme,
    winners = [],
    winnerCount = 0,
    isAllEqual = false,
    maxDifference,
    maxDifferencePercent,
  } = comparisonResults;

  // Master scheme update handler
  const updateScheme = (id, updates) => {
    const normalizedUpdates =
      updates.interval !== undefined && updates.isCompounded === undefined
        ? { ...updates, isCompounded: Number(updates.interval) > 0 }
        : updates;

    setSchemes((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return { ...s, ...normalizedUpdates };
        }
        const syncedUpdates = {};
        SYNCABLE_FIELDS.forEach((field) => {
          if (syncFields[field] && normalizedUpdates[field] !== undefined) {
            syncedUpdates[field] = normalizedUpdates[field];
            if (field === 'interval') {
              syncedUpdates.isCompounded = normalizedUpdates.isCompounded;
            }
          }
        });
        return Object.keys(syncedUpdates).length > 0 ? { ...s, ...syncedUpdates } : s;
      })
    );
  };

  const handleFieldChange = (id, field, value, isDecimal = false) => {
    const isValid = isDecimal
      ? value === '' || /^\d*\.?\d*$/.test(value)
      : value === '' || /^\d*$/.test(value);

    if (isValid) {
      updateScheme(id, { [field]: value });
    }
  };

  const handleFieldBlur = (id, field, defaultValue) => {
    setSchemes((prev) => {
      const targetScheme = prev.find((s) => s.id === id);
      const val = targetScheme?.[field];
      const num = Number(val);
      let normalized;
      if (val === '' || val === undefined || isNaN(num)) {
        normalized = defaultValue;
      } else if (field === 'totalDuration') {
        normalized = Math.min(MAX_FDR_DURATION_MONTHS, Math.max(1, Math.floor(num)));
      } else if (field === 'interval') {
        normalized = Math.min(MAX_FDR_DURATION_MONTHS, Math.max(0, Math.floor(num)));
      } else if (field === 'annualRate' || field === 'taxRate') {
        normalized = Math.min(100, Math.max(0, num));
      } else {
        normalized = Math.max(0, num);
      }

      const isSynced = Boolean(syncFields[field]);
      return prev.map((s) => {
        if (s.id === id || isSynced) {
          if (field === 'interval') {
            return { ...s, interval: normalized, isCompounded: normalized > 0 };
          }
          return { ...s, [field]: normalized };
        }
        return s;
      });
    });
  };

  // Toggle sync for any editable parameter column (aligns all rows to top visible row)
  const handleToggleSync = (field) => {
    const nextSync = !syncFields[field];
    setSyncFields((prev) => ({ ...prev, [field]: nextSync }));
    if (nextSync && schemes.length > 0) {
      const sourceScheme = rankedSchemes[0] || schemes[0];
      const baseValue = sourceScheme[field];
      setSchemes((prev) =>
        prev.map((s) => {
          if (field === 'interval') {
            const normalizedInterval = baseValue !== undefined ? Number(baseValue) : 0;
            return {
              ...s,
              interval: normalizedInterval,
              isCompounded: normalizedInterval > 0,
            };
          }
          return { ...s, [field]: baseValue };
        })
      );
    }
  };

  const handleClearAllSync = () => {
    setSyncFields(DEFAULT_SYNC_FIELDS);
  };

  // Add Scheme (up to 5)
  const handleAddScheme = () => {
    if (schemes.length >= 5) return;
    const nextIndex = schemes.length + 1;
    const syncedSource = schemes[0] || DEFAULT_COMPARED_SCHEMES[0];
    const baseScheme = schemes[schemes.length - 1] || DEFAULT_COMPARED_SCHEMES[0];
    const intervalVal = syncFields.interval
      ? Number(syncedSource.interval ?? 0)
      : baseScheme.interval !== undefined
      ? baseScheme.interval
      : 3;

    const newScheme = {
      id: generateSchemeId('scheme'),
      name: `Bank ${String.fromCharCode(64 + nextIndex)} Offer`,
      amount: syncFields.amount ? syncedSource.amount : 100000,
      totalDuration: syncFields.totalDuration ? syncedSource.totalDuration : 12,
      interval: intervalVal,
      annualRate: syncFields.annualRate
        ? syncedSource.annualRate
        : Math.min(15, Number((Number(baseScheme.annualRate || 9) + 0.5).toFixed(2))),
      taxRate: syncFields.taxRate ? syncedSource.taxRate : 15,
      isCompounded: Number(intervalVal) > 0,
    };
    setSchemes([...schemes, newScheme]);
  };

  // Duplicate Scheme
  const handleDuplicateScheme = (schemeToCopy) => {
    if (schemes.length >= 5) return;
    const newScheme = {
      ...schemeToCopy,
      id: generateSchemeId('scheme'),
      name: `${schemeToCopy.name} (Copy)`,
    };
    setSchemes([...schemes, newScheme]);
  };

  // Remove Scheme (min 2)
  const handleRemoveScheme = (idToRemove) => {
    if (schemes.length <= 2) return;
    setSchemes(schemes.filter((s) => s.id !== idToRemove));
  };

  // Reset to default
  const handleResetToDefault = () => {
    setSchemes(DEFAULT_COMPARED_SCHEMES);
    setSyncFields(DEFAULT_SYNC_FIELDS);
    setCustomIntervalRows({});
  };

  // Apply preset
  const handleApplyPreset = (preset) => {
    setSchemes(preset.schemes.map((s) => ({ ...s, id: generateSchemeId('preset') })));
    setSyncFields(DEFAULT_SYNC_FIELDS);
    setCustomIntervalRows({});
  };

  // Export Comparison CSV
  const handleExportComparisonCSV = () => {
    const headers = [
      'Rank',
      'Bank / Scheme Name',
      `Deposit (${currency.code})`,
      'Duration (Months)',
      'Renewal Interval (Months)',
      'Annual Rate (%)',
      'Tax Rate (%)',
      'Gross Interest',
      'Tax Deducted',
      'Net Profit',
      'Maturity Total',
      'Net APY (%)',
      'Advantage vs Minimum',
    ];
    const rows = rankedSchemes.map((s) => [
      isAllEqual ? 'Tied' : `#${s.rank}`,
      s.name,
      s.amount.toFixed(2),
      s.totalDuration,
      s.interval,
      s.annualRate.toFixed(2),
      s.taxRate.toFixed(2),
      s.grossInterest.toFixed(2),
      s.tax.toFixed(2),
      s.netInterest.toFixed(2),
      s.totalAmount.toFixed(2),
      s.netApy.toFixed(2),
      s.diffVsLowest.toFixed(2),
    ]);
    exportToCsv(`Multi_FDR_Comparison_${currency.code}.csv`, headers, rows);
  };

  const syncColumnConfigs = [
    { field: 'amount', label: `Deposit (${currency.symbol})`, Icon: DollarSign, colMinWidth: 'min-w-[175px]' },
    { field: 'totalDuration', label: 'Tenure (Duration)', Icon: Calendar, colMinWidth: 'min-w-[145px]' },
    { field: 'interval', label: 'Renewal Interval', Icon: Repeat, colMinWidth: 'min-w-[155px]' },
    { field: 'annualRate', label: 'Annual Rate', Icon: Percent, colMinWidth: 'min-w-[140px]' },
    { field: 'taxRate', label: 'Tax Rate', Icon: Receipt, colMinWidth: 'min-w-[150px]' },
  ];
  const activeSyncCount = SYNCABLE_FIELDS.filter((f) => syncFields[f]).length;

  // Step rate +/-
  const handleRateStep = (schemeId, currentRate, delta) => {
    const newRate = Math.max(0.1, Math.min(30, Number((Number(currentRate || 0) + delta).toFixed(2))));
    updateScheme(schemeId, { annualRate: newRate });
  };

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Control Toolbar & 1-Click Presets */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          {/* Left: Title & Quick Count */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <TableIcon className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                Multi-FDR Comparison Table
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                {schemes.length} FDRs (1 Per Row)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Each row is an FDR. You can directly edit the values in the table cells to compare returns.
            </p>
          </div>

          {/* Right: Master Actions */}
          <div className="flex flex-wrap items-center gap-2 no-print">

            {/* Add FDR Button */}
            <button
              type="button"
              onClick={handleAddScheme}
              disabled={schemes.length >= 5}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer ${
                schemes.length >= 5
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add FDR Row ({schemes.length}/5)</span>
            </button>

            {/* Export Comparison CSV */}
            <button
              type="button"
              onClick={handleExportComparisonCSV}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title="Export comparison table to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Open Text Statement */}
            {onOpenExport && (
              <button
                type="button"
                onClick={onOpenExport}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 transition cursor-pointer"
                title="View Multi-FDR Text Statement"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Statement</span>
              </button>
            )}

            {/* Copy Share Link */}
            {onCopyShareLink && (
              <button
                type="button"
                onClick={onCopyShareLink}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                title="Copy shareable link for this Multi-FDR comparison"
              >
                {shareCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Share Link</span>
                  </>
                )}
              </button>
            )}

            {/* Reset */}
            <button
              type="button"
              onClick={handleResetToDefault}
              aria-label="Reset comparison to initial schemes"
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Reset comparison to initial schemes"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preset Scenarios Pill Bar */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center gap-2 no-print">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>1-Click Presets:</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {FDR_COMPARISON_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition cursor-pointer font-medium"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Winner Highlight Summary Banner */}
      {bestScheme && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white p-4 sm:p-5 shadow-lg shadow-emerald-900/10 transition print-avoid-break">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[11px] font-bold uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {isAllEqual
                    ? 'Equal Performing FDRs'
                    : winnerCount > 1
                    ? '🏆 Tied Top Performing FDRs'
                    : '🏆 Top Performing FDR'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight flex flex-wrap items-center gap-2">
                <span>
                  {isAllEqual
                    ? 'All Plans Match'
                    : winnerCount > 1
                    ? winners.map((w) => w.name).join(' & ')
                    : bestScheme.name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-400 text-slate-900 font-extrabold uppercase">
                  {isAllEqual ? 'Tied Returns' : winnerCount > 1 ? `Tied #1 (${winnerCount})` : 'Rank #1 Winner'}
                </span>
              </h3>
              <p className="text-xs text-emerald-100 max-w-xl">
                {isAllEqual ? 'All compared schemes yield an identical maturity payout of ' : 'Highest payout of '}
                <strong className="text-white font-mono font-bold">
                  {formatCurrency(bestScheme.totalAmount, currency.symbol)}
                </strong>{' '}
                with take-home net profit of{' '}
                <strong className="text-white font-mono font-bold">
                  +{formatCurrency(bestScheme.netInterest, currency.symbol)}
                </strong>{' '}
                (effective APY: {formatNumber(bestScheme.netApy, 2)}%).
              </p>
            </div>

            {lowestScheme && !isAllEqual && maxDifference > 0 && (
              <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-xl p-3 text-right flex flex-row sm:flex-col justify-between items-end gap-1 shrink-0">
                <span className="text-[10px] text-emerald-100 uppercase tracking-wider block font-semibold">
                  Profit Advantage vs Lowest
                </span>
                <div className="text-xl sm:text-2xl font-black font-mono text-white">
                  +{formatCurrency(maxDifference, currency.symbol)}
                </div>
                <div className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>+{formatNumber(maxDifferencePercent, 1)}% higher return</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1 ROW PER FDR - EDITABLE COMPARISON TABLE                            */}
      {/* ==================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        
        {/* Table Title Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              FDR Comparison Table (1 FDR per Row)
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Edit rates, duration, or deposit directly in each row
          </span>
        </div>

        {/* Scrollable Table Container */}
        <div className="overflow-x-auto print-table-wrap">
          <table className="w-full text-xs text-left border-collapse min-w-[1100px]">
            <thead>
              {/* Sync Controls Row — aligned column-by-column inside the same table */}
              <tr className="bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3 min-w-[210px]">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    <Link2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Sync Column Values</span>
                  </div>
                </th>

                {syncColumnConfigs.map(({ field, label, Icon, colMinWidth }) => {
                  const isSynced = Boolean(syncFields[field]);
                  return (
                    <th key={field} className={`py-2.5 px-3 ${colMinWidth}`}>
                      <button
                        type="button"
                        onClick={() => handleToggleSync(field)}
                        aria-pressed={isSynced}
                        aria-label={`Sync ${label}`}
                        title={`When ON, changing ${label} on any row updates all FDR rows together`}
                        className={`w-full inline-flex items-center justify-between gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition cursor-pointer whitespace-nowrap ${
                          isSynced
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-400 shadow-sm'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/60 dark:hover:bg-slate-800/80'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Icon className="w-3 h-3 shrink-0" />
                          <span>Sync</span>
                        </span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            isSynced
                              ? 'bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {isSynced ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    </th>
                  );
                })}

                <th colSpan={5} className="py-2.5 px-3 text-right font-normal">
                  <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                    {activeSyncCount > 0 ? (
                      <button
                        type="button"
                        onClick={handleClearAllSync}
                        className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-white dark:hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-800/60 transition cursor-pointer"
                        title="Turn off all column sync locks"
                      >
                        Unsync All ({activeSyncCount})
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        Toggle Sync ON to lock any column across all rows
                      </span>
                    )}
                  </div>
                </th>
              </tr>

              {/* Column Naming Row */}
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3.5 px-3 min-w-[210px]">Bank / Scheme Name</th>
                {syncColumnConfigs.map(({ field, label, colMinWidth }) => {
                  const isSynced = Boolean(syncFields[field]);
                  return (
                    <th
                      key={field}
                      className={`py-3.5 px-3 ${colMinWidth} whitespace-nowrap ${
                        isSynced ? 'text-emerald-700 dark:text-emerald-300' : ''
                      }`}
                    >
                      {label}
                    </th>
                  );
                })}
                <th className="py-3.5 px-3 min-w-[130px] text-right">Net Profit</th>
                <th className="py-3.5 px-3 min-w-[140px] text-right">Maturity Total</th>
                <th className="py-3.5 px-3 min-w-[90px] text-center">Net APY</th>
                <th className="py-3.5 px-3 min-w-[115px] text-center">vs Minimum</th>
                <th className="py-3.5 px-3 min-w-[105px] text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rankedSchemes.map((scheme) => {
                const rawScheme = schemes.find((s) => s.id === scheme.id) || scheme;
                const palette = SCHEME_PALETTES[scheme.index % SCHEME_PALETTES.length];
                const isWinner = scheme.isWinner;
                const rawIntervalVal = rawScheme.interval ?? 0;
                const isCustomInterval =
                  Boolean(customIntervalRows[scheme.id]) ||
                  rawIntervalVal === '' ||
                  !STANDARD_INTERVAL_VALUES.has(Number(rawIntervalVal));
                const remMonths =
                  scheme.interval > 0 ? scheme.totalDuration % scheme.interval : 0;

                return (
                  <tr
                    key={scheme.id}
                    className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/60 ${
                      isWinner ? palette.winnerRowBg : ''
                    }`}
                  >
                    {/* 1. Scheme Name & Rank Badge */}
                    <td className="py-3.5 px-3 align-top">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${
                            isWinner
                              ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                              : palette.badge
                          }`}
                        >
                          {isAllEqual
                            ? 'Equal Return'
                            : isWinner
                            ? winnerCount > 1
                              ? '🏆 Tied #1'
                              : '🏆 Best Winner'
                            : `#${scheme.rank} Performer`}
                        </span>
                      </div>
                      <input
                        type="text"
                        aria-label={`Bank or scheme name for row ${scheme.index + 1}`}
                        value={rawScheme.name ?? ''}
                        onChange={(e) => updateScheme(scheme.id, { name: e.target.value })}
                        className="w-full text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        placeholder="e.g. Bank Name"
                      />
                    </td>

                    {/* 2. Deposit Amount (Principal) */}
                    <td className="py-3.5 px-3 align-top">
                      <div className="relative mb-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          {currency.symbol}
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          aria-label={`Deposit amount for ${scheme.name}`}
                          value={rawScheme.amount ?? ''}
                          onChange={(e) => handleFieldChange(scheme.id, 'amount', e.target.value, false)}
                          onBlur={() => handleFieldBlur(scheme.id, 'amount', 100000)}
                          className="w-full pl-6 pr-2 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        />
                      </div>
                      {/* Quick Amount Chips */}
                      <div className="flex flex-wrap gap-1">
                        {QUICK_AMOUNTS.map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => updateScheme(scheme.id, { amount: amt })}
                            className={`text-[9px] px-1.5 py-0.5 rounded font-semibold transition cursor-pointer ${
                              Number(rawScheme.amount) === amt
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {formatQuickAmount(amt, currency.code)}
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* 3. Duration (Tenure) */}
                    <td className="py-3.5 px-3 align-top">
                      <div className="flex items-center gap-1.5 mb-1">
                        <input
                          type="text"
                          inputMode="numeric"
                          aria-label={`Tenure in months for ${scheme.name}`}
                          value={rawScheme.totalDuration ?? ''}
                          onChange={(e) => handleFieldChange(scheme.id, 'totalDuration', e.target.value, false)}
                          onBlur={() => handleFieldBlur(scheme.id, 'totalDuration', 12)}
                          className="w-14 text-center text-xs font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-1.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        />
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Months</span>
                      </div>
                      {/* Quick Duration Chips */}
                      <div className="flex flex-wrap gap-1">
                        {QUICK_DURATIONS.map((dur) => (
                          <button
                            key={dur.months}
                            type="button"
                            onClick={() => updateScheme(scheme.id, { totalDuration: dur.months })}
                            className={`text-[9px] px-1.5 py-0.5 rounded font-semibold transition cursor-pointer ${
                              Number(rawScheme.totalDuration) === dur.months
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {dur.label}
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* 4. Renewal / Compounding Interval (with Custom Months support) */}
                    <td className="py-3.5 px-3 align-top">
                      <select
                        aria-label={`Renewal interval preset for ${scheme.name}`}
                        value={isCustomInterval ? 'custom' : Number(rawIntervalVal)}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            setCustomIntervalRows((prev) => ({ ...prev, [scheme.id]: true }));
                            return;
                          }
                          const val = Number(e.target.value);
                          setCustomIntervalRows((prev) => {
                            const next = { ...prev };
                            delete next[scheme.id];
                            return next;
                          });
                          updateScheme(scheme.id, {
                            interval: val,
                            isCompounded: val > 0,
                          });
                        }}
                        className="w-full text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer"
                      >
                        {INTERVAL_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                        <option value="custom">Custom (Months)...</option>
                      </select>

                      {isCustomInterval && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <input
                            type="text"
                            inputMode="numeric"
                            aria-label={`Custom renewal interval in months for ${scheme.name}`}
                            value={rawScheme.interval ?? ''}
                            onChange={(e) => handleFieldChange(scheme.id, 'interval', e.target.value, false)}
                            onBlur={() => {
                              handleFieldBlur(scheme.id, 'interval', 3);
                              setCustomIntervalRows((prev) => {
                                const next = { ...prev };
                                delete next[scheme.id];
                                return next;
                              });
                            }}
                            placeholder="4"
                            className="w-16 text-center text-xs font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-1.5 py-1 rounded-lg border border-emerald-400 dark:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                          />
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            mo cycle
                          </span>
                        </div>
                      )}

                      <span className="text-[10px] block mt-1">
                        {scheme.interval === 0 ? (
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">
                            ⏹️ One-Time Flat
                          </span>
                        ) : scheme.interval >= scheme.totalDuration ? (
                          <span className="text-sky-600 dark:text-sky-400 font-semibold">
                            ℹ️ Single term ({scheme.totalDuration}M)
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            🔄 Reinvests ({scheme.interval}M{remMonths > 0 ? ` + ${remMonths}m` : ''})
                          </span>
                        )}
                      </span>
                    </td>

                    {/* 5. Annual Rate (%) */}
                    <td className="py-3.5 px-3 align-top">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleRateStep(scheme.id, rawScheme.annualRate, -0.25)}
                          className="w-6 h-7 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 text-xs flex items-center justify-center cursor-pointer border border-slate-200 dark:border-slate-700"
                          title="-0.25%"
                        >
                          -
                        </button>
                        <div className="relative flex-1">
                          <input
                            type="text"
                            inputMode="decimal"
                            aria-label={`Annual interest rate for ${scheme.name}`}
                            value={rawScheme.annualRate ?? ''}
                            onChange={(e) => handleFieldChange(scheme.id, 'annualRate', e.target.value, true)}
                            onBlur={() => handleFieldBlur(scheme.id, 'annualRate', 9.0)}
                            className="w-full text-center text-xs font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-1 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRateStep(scheme.id, rawScheme.annualRate, +0.25)}
                          className="w-6 h-7 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 text-xs flex items-center justify-center cursor-pointer border border-slate-200 dark:border-slate-700"
                          title="+0.25%"
                        >
                          +
                        </button>
                        <span className="text-[11px] font-bold text-slate-400">%</span>
                      </div>
                    </td>

                    {/* 6. Tax Rate (%) */}
                    <td className="py-3.5 px-3 align-top">
                      <div className="relative mb-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          aria-label={`Tax rate for ${scheme.name}`}
                          value={rawScheme.taxRate ?? ''}
                          onChange={(e) => handleFieldChange(scheme.id, 'taxRate', e.target.value, true)}
                          onBlur={() => handleFieldBlur(scheme.id, 'taxRate', 15)}
                          className="w-full text-center text-xs font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 pl-2 pr-6 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                          %
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { label: '0%', val: 0 },
                          { label: '10% TIN', val: 10 },
                          { label: '15% No', val: 15 },
                        ].map((opt) => (
                          <button
                            key={opt.val}
                            type="button"
                            onClick={() => updateScheme(scheme.id, { taxRate: opt.val })}
                            className={`text-[9px] py-1 px-1 rounded font-semibold border transition cursor-pointer text-center ${
                              Number(rawScheme.taxRate) === opt.val
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-400'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* 7. Net Profit */}
                    <td className="py-3.5 px-3 align-top text-right">
                      <div className="font-mono font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(scheme.netInterest, currency.symbol)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Gross: +{formatCurrency(scheme.grossInterest, currency.symbol)}
                      </div>
                      <div className="text-[10px] text-rose-500 dark:text-rose-400 font-mono">
                        Tax: -{formatCurrency(scheme.tax, currency.symbol)}
                      </div>
                    </td>

                    {/* 9. Maturity Total */}
                    <td className="py-3.5 px-3 align-top text-right">
                      <div className="font-mono font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                        {formatCurrency(scheme.totalAmount, currency.symbol)}
                      </div>
                    </td>

                    {/* 10. Net APY */}
                    <td className="py-3.5 px-3 align-top text-center font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {formatNumber(scheme.netApy, 2)}%
                    </td>

                    {/* 11. vs Minimum */}
                    <td className="py-3.5 px-3 align-top text-center font-mono text-xs">
                      {scheme.diffVsLowest > 0.005 ? (
                        <div className="flex flex-col items-center gap-0.5">
                          {isWinner && (
                            <span className="inline-block font-sans text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              {winnerCount > 1 ? '🏆 Tied #1' : '🏆 Winner'}
                            </span>
                          )}
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(scheme.diffVsLowest, currency.symbol)}
                          </span>
                          {scheme.percentVsLowest > 0 && (
                            <span className="text-[10px] font-sans font-semibold text-emerald-500/80 dark:text-emerald-400/75">
                              +{formatNumber(scheme.percentVsLowest, 1)}% more
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="inline-block font-sans text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {isAllEqual ? 'Equal Return' : 'Minimum Base'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatCurrency(0, currency.symbol)}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 12. Actions */}
                    <td className="py-3.5 px-3 align-top text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateScheme(scheme)}
                          disabled={schemes.length >= 5}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition disabled:opacity-20 cursor-pointer"
                          title="Duplicate this row"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveScheme(scheme.id)}
                          disabled={schemes.length <= 2}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition disabled:opacity-20 cursor-pointer"
                          title={schemes.length <= 2 ? 'Minimum 2 rows required' : 'Remove this row'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (onInspectSingleScheme) {
                              onInspectSingleScheme(scheme);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                          title="Inspect detailed cycle schedule"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>

            {/* Table Footer: Add Row CTA & Summary */}
            <tfoot>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700">
                <td colSpan={11} className="py-3 px-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Comparing {schemes.length} FDR schemes • All values update dynamically in real time
                    </span>
                    <button
                      type="button"
                      onClick={handleAddScheme}
                      disabled={schemes.length >= 5}
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        schemes.length >= 5
                          ? 'opacity-40 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-400'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another FDR Row ({schemes.length}/5)</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Visual Chart Comparison */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm transition-colors print-avoid-break">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4 gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <BarChart3 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Visual Comparison: Principal vs Net Profit Return
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Visual return difference across all table rows
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-slate-700"></span> Principal
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Net Profit
            </span>
          </div>
        </div>

        {/* Stacked comparison bars */}
        <div className="space-y-3">
          {(() => {
            const maxMaturity = Math.max(...rankedSchemes.map((s) => s.totalAmount), 1);

            return rankedSchemes.map((scheme) => {
              const palette = SCHEME_PALETTES[scheme.index % SCHEME_PALETTES.length];
              const principalPercent = (scheme.amount / maxMaturity) * 100;
              const profitPercent = (scheme.netInterest / maxMaturity) * 100;

              return (
                <div key={scheme.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                      <span className={`w-2 h-2 rounded-full ${palette.barBg}`}></span>
                      <span>{scheme.name}</span>
                      {scheme.isWinner && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                          🏆 Best
                        </span>
                      )}
                    </span>
                    <div className="flex items-baseline gap-2 font-mono text-[11px]">
                      <span className="text-slate-500">
                        Profit: <strong className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(scheme.netInterest, currency.symbol)}</strong>
                      </span>
                      <span className="text-slate-900 dark:text-white font-bold">
                        Total: {formatCurrency(scheme.totalAmount, currency.symbol)}
                      </span>
                    </div>
                  </div>

                  <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex p-0.5">
                    {principalPercent > 0 && (
                      <div
                        style={{ width: `${principalPercent}%` }}
                        className="h-full bg-slate-300 dark:bg-slate-700 rounded-l flex items-center pl-2 text-[10px] font-mono font-medium text-slate-600 dark:text-slate-300 truncate"
                        title={`Principal: ${formatCurrency(scheme.amount, currency.symbol)}`}
                      >
                        {principalPercent >= 16 ? formatCurrency(scheme.amount, currency.symbol) : ''}
                      </div>
                    )}
                    {profitPercent > 0 && (
                      <div
                        style={{ width: `${profitPercent}%` }}
                        className={`h-full ${palette.barBg} rounded-r flex items-center justify-end pr-2 text-[10px] font-mono font-bold text-white truncate`}
                        title={`Net Profit: +${formatCurrency(scheme.netInterest, currency.symbol)}`}
                      >
                        {profitPercent >= 10 ? `+${formatCurrency(scheme.netInterest, currency.symbol)}` : ''}
                      </div>
                    )}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </div>

    </div>
  );
}
