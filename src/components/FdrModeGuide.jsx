import React from 'react';
import { BookOpen, HelpCircle, Info, CheckCircle2 } from 'lucide-react';
import { FDR_GUIDES } from '../data/fdrGuides';

export default function FdrModeGuide({ mode = 'single', onOpenFullGuide }) {
  const guide = FDR_GUIDES[mode] || FDR_GUIDES.single;

  return (
    <section
      aria-label={`${guide.title} Guide`}
      className="mt-8 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs sm:text-sm space-y-4 transition-colors"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-slate-900 dark:text-white font-bold text-sm sm:text-base">
            <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>How {guide.title} Works &amp; Functionality</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
              {guide.badge}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
            {guide.overviewText}
          </p>
        </div>

        {onOpenFullGuide && (
          <button
            type="button"
            onClick={() => onOpenFullGuide(guide.id)}
            className="inline-flex items-center gap-1.5 self-start sm:self-center shrink-0 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold transition cursor-pointer no-print"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Step-by-Step Guide</span>
          </button>
        )}
      </div>

      {/* Core Concepts / Strategies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {guide.concepts.map((concept) => (
          <div
            key={concept.title}
            className={`p-4 rounded-xl border space-y-1 ${concept.highlight
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/60'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
              }`}
          >
            <span
              className={`font-semibold block text-xs sm:text-sm ${concept.highlight
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-800 dark:text-slate-200'
                }`}
            >
              {concept.title}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {concept.description}
            </p>
          </div>
        ))}
      </div>

      {/* Key Functionality Overview */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5">
          Key Functionality in This Mode
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {guide.features.map((feat) => (
            <div
              key={feat.title}
              className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1"
            >
              <div className="flex items-start gap-1.5 font-semibold text-xs text-slate-800 dark:text-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{feat.title}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tip Footer */}
      <div className="flex items-start gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
        <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-700 dark:text-slate-300">Note:</strong> {guide.tip}
        </p>
      </div>
    </section>
  );
}

