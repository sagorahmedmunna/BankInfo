import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  HelpCircle,
  TrendingUp,
  Sparkles,
  Sliders,
  Target,
  CheckCircle2,
  Info,
  ArrowRight
} from 'lucide-react';
import { FDR_GUIDES, FDR_GUIDE_ORDER } from '../data/fdrGuides';

const TAB_ICONS = {
  single: TrendingUp,
  compare: Sliders,
  goal: Target,
};

const STEP_BADGE_STYLES = [
  'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400',
  'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-400',
  'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400',
];

export default function HowItWorksModal({
  isOpen,
  onClose,
  initialMode = 'single',
  onSelectMode = null,
  currentPage = 'home',
  currentFdrMode = 'single',
}) {
  const safeInitial = FDR_GUIDES[initialMode] ? initialMode : 'single';
  const [activeTab, setActiveTab] = useState(safeInitial);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (isOpen) {
      setActiveTab(FDR_GUIDES[initialMode] ? initialMode : 'single');
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const activeGuide = FDR_GUIDES[activeTab] || FDR_GUIDES.single;
  const showSwitchCta =
    Boolean(onSelectMode) && (currentPage !== 'fdr' || activeGuide.id !== currentFdrMode);

  const handleTabKeyDown = (e, currentIndex) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const delta = e.key === 'ArrowRight' ? 1 : -1;
    const nextIndex = (currentIndex + delta + FDR_GUIDE_ORDER.length) % FDR_GUIDE_ORDER.length;
    setActiveTab(FDR_GUIDE_ORDER[nextIndex]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn cursor-pointer"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-it-works-title"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="how-it-works-title" className="font-bold text-slate-900 dark:text-white text-base">
                {activeGuide.title} — Guide &amp; Functionality
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeGuide.modalSubtitle}
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dedicated Per-Tool Tab Bar */}
        <div className="px-6 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/60">
          <div
            role="tablist"
            aria-label="FDR Calculator Guides"
            className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80"
          >
            {FDR_GUIDE_ORDER.map((tabId, idx) => {
              const guide = FDR_GUIDES[tabId];
              const Icon = TAB_ICONS[tabId] || HelpCircle;
              const isSelected = activeTab === tabId;
              return (
                <button
                  key={tabId}
                  id={`guide-tab-${tabId}`}
                  role="tab"
                  type="button"
                  aria-selected={isSelected}
                  aria-controls={`guide-panel-${tabId}`}
                  onClick={() => setActiveTab(tabId)}
                  onKeyDown={(e) => handleTabKeyDown(e, idx)}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{guide.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div
          id={`guide-panel-${activeGuide.id}`}
          role="tabpanel"
          aria-labelledby={`guide-tab-${activeGuide.id}`}
          className="p-6 overflow-y-auto space-y-6"
        >
          {/* Concept Overview */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm mb-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{activeGuide.overviewTitle}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {activeGuide.overviewText}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {activeGuide.concepts.map((concept) => (
                <div
                  key={concept.title}
                  className={`bg-white/85 dark:bg-slate-900/85 p-3 rounded-xl border ${
                    concept.highlight
                      ? 'border-emerald-200 dark:border-emerald-800'
                      : 'border-emerald-100 dark:border-emerald-900/60'
                  }`}
                >
                  <span
                    className={`font-bold text-xs block mb-0.5 ${
                      concept.highlight
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-slate-900 dark:text-white'
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
          </div>

          {/* 3 Quick Steps */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              How It Works (Step-by-Step)
            </h4>
            <div className="space-y-3">
              {activeGuide.steps.map((step, idx) => (
                <div
                  key={step.title}
                  className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                >
                  <div
                    className={`w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                      STEP_BADGE_STYLES[idx % STEP_BADGE_STYLES.length]
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {step.title}
                    </h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Core Functionality */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Functionality &amp; Tools Included
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {activeGuide.features.map((feat) => (
                <div
                  key={feat.title}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1"
                >
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{feat.title}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tip */}
          <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/60 flex items-start gap-2.5 text-xs text-sky-900 dark:text-sky-200">
            <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Key Rule:</strong> {activeGuide.tip}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            Tip: Switch currency anytime from the header; all calculations stay private in your browser.
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {showSwitchCta && (
              <button
                type="button"
                onClick={() => onSelectMode(activeGuide.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
              >
                <span>{activeGuide.ctaLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-sm shadow-emerald-600/20"
            >
              Got it, Let&apos;s Start!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
