import React, { useState, useEffect, useMemo, useRef } from 'react';
import Header from './components/Header';
import HomePage from './components/HomePage';
import InputPanel from './components/InputPanel';
import ComparisonCards from './components/ComparisonCards';
import VisualChart from './components/VisualChart';
import CycleScheduleTable from './components/CycleScheduleTable';
import SummaryExportModal from './components/SummaryExportModal';
import HowItWorksModal from './components/HowItWorksModal';
import FdrModeGuide from './components/FdrModeGuide';
import MultiFdrComparison, {
  MULTI_SYNC_STORAGE_KEY,
  DEFAULT_SYNC_FIELDS,
} from './components/MultiFdrComparison';
import GoalFdrPanel from './components/GoalFdrPanel';
import EmiPage, {
  EMI_STORAGE_KEY,
  loadSavedEmiState,
  sanitizeEmiState,
} from './components/EmiPage';
import {
  calculateFDRComparison,
  calculateMultiFDRComparison,
  calculateReverseFDRGoal,
  DEFAULT_COMPARED_SCHEMES,
} from './utils/fdrCalculator';
import { CURRENCIES } from './utils/formatters';
import {
  parseLocationScenario,
  buildShareUrl,
  copyTextToClipboard,
} from './utils/shareLink';
import {
  ShieldCheck,
  HelpCircle,
  ArrowLeft,
  TrendingUp,
  Sliders,
  Target,
  ArrowRight,
  Link2,
  X
} from 'lucide-react';

const DEFAULT_INPUTS = {
  amount: 100000,
  totalDuration: 12,
  interval: 3,
  annualRate: 9,
  taxRate: 15,
};

const DEFAULT_GOAL_INPUTS = {
  goalType: 'monthly_income',
  targetAmount: 10000,
  totalDuration: 36,
  interval: 3,
  annualRate: 9.5,
  taxRate: 15,
};

function getInitialLocationScenario() {
  if (typeof window === 'undefined') {
    return parseLocationScenario('', '');
  }
  return parseLocationScenario(window.location.hash, window.location.search);
}

export default function App() {
  const [initialLocationScenario] = useState(() => getInitialLocationScenario());
  const [sharedScenarioBanner, setSharedScenarioBanner] = useState(() =>
    Boolean(initialLocationScenario?.hasScenario)
  );
  const [shareCopied, setShareCopied] = useState(false);

  const [currentPage, setCurrentPage] = useState(() => {
    if (initialLocationScenario.page) return initialLocationScenario.page;
    if (typeof window !== 'undefined') {
      try {
        const savedPage = localStorage.getItem('bankinfo_active_page');
        if (savedPage === 'fdr' || savedPage === 'emi') return savedPage;
      } catch {}
    }
    return 'home';
  });

  const [fdrMode, setFdrMode] = useState(() => {
    if (initialLocationScenario.mode) return initialLocationScenario.mode;
    if (typeof window !== 'undefined') {
      try {
        const savedMode = localStorage.getItem('bankinfo_fdr_mode');
        if (savedMode === 'compare' || savedMode === 'single' || savedMode === 'goal') {
          return savedMode;
        }
      } catch {}
    }
    return 'single';
  });

  const [inputs, setInputs] = useState(() => {
    let base = DEFAULT_INPUTS;
    try {
      const saved = localStorage.getItem('bankinfo_fdr_inputs_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        base = {
          amount: typeof parsed.amount === 'number' && !isNaN(parsed.amount) ? parsed.amount : DEFAULT_INPUTS.amount,
          totalDuration: typeof parsed.totalDuration === 'number' && !isNaN(parsed.totalDuration) ? Math.max(1, parsed.totalDuration) : DEFAULT_INPUTS.totalDuration,
          interval: typeof parsed.interval === 'number' && !isNaN(parsed.interval) ? parsed.interval : DEFAULT_INPUTS.interval,
          annualRate: typeof parsed.annualRate === 'number' && !isNaN(parsed.annualRate) ? parsed.annualRate : DEFAULT_INPUTS.annualRate,
          taxRate: typeof parsed.taxRate === 'number' && !isNaN(parsed.taxRate) ? parsed.taxRate : DEFAULT_INPUTS.taxRate,
        };
      } else {
        const oldSaved = localStorage.getItem('bankinfo_fdr_inputs');
        if (oldSaved) {
          const parsed = JSON.parse(oldSaved);
          base = { ...DEFAULT_INPUTS, ...parsed, taxRate: 15 };
        }
      }
    } catch {}
    return initialLocationScenario.fdrInputs
      ? { ...base, ...initialLocationScenario.fdrInputs }
      : base;
  });

  const [goalInputs, setGoalInputs] = useState(() => {
    let base = DEFAULT_GOAL_INPUTS;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('bankinfo_fdr_goal_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          base = {
            goalType:
              parsed.goalType === 'maturity' || parsed.goalType === 'net_profit'
                ? parsed.goalType
                : 'monthly_income',
            targetAmount:
              typeof parsed.targetAmount === 'number' && !isNaN(parsed.targetAmount)
                ? parsed.targetAmount
                : DEFAULT_GOAL_INPUTS.targetAmount,
            totalDuration:
              typeof parsed.totalDuration === 'number' && !isNaN(parsed.totalDuration)
                ? Math.max(1, parsed.totalDuration)
                : DEFAULT_GOAL_INPUTS.totalDuration,
            interval:
              typeof parsed.interval === 'number' && !isNaN(parsed.interval)
                ? parsed.interval
                : DEFAULT_GOAL_INPUTS.interval,
            annualRate:
              typeof parsed.annualRate === 'number' && !isNaN(parsed.annualRate)
                ? parsed.annualRate
                : DEFAULT_GOAL_INPUTS.annualRate,
            taxRate:
              typeof parsed.taxRate === 'number' && !isNaN(parsed.taxRate)
                ? parsed.taxRate
                : DEFAULT_GOAL_INPUTS.taxRate,
          };
        }
      } catch {}
    }
    return initialLocationScenario.goalInputs
      ? { ...base, ...initialLocationScenario.goalInputs }
      : base;
  });

  // Multi-FDR comparison schemes & sync locks (shared with SummaryExportModal)
  const [multiSchemes, setMultiSchemes] = useState(() => {
    if (initialLocationScenario.multiSchemes) {
      return initialLocationScenario.multiSchemes;
    }
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('bankinfo_multi_fdr_schemes_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length >= 2) {
            return parsed;
          }
        }
      } catch {}
    }
    return DEFAULT_COMPARED_SCHEMES;
  });

  const [multiSyncFields, setMultiSyncFields] = useState(() => {
    if (initialLocationScenario.multiSyncFields) {
      return initialLocationScenario.multiSyncFields;
    }
    try {
      const saved = localStorage.getItem(MULTI_SYNC_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SYNC_FIELDS, ...parsed };
      }
      return {
        ...DEFAULT_SYNC_FIELDS,
        amount: localStorage.getItem('bankinfo_multi_fdr_sync_amount') === 'true',
        totalDuration: localStorage.getItem('bankinfo_multi_fdr_sync_duration') === 'true',
      };
    } catch {
      return DEFAULT_SYNC_FIELDS;
    }
  });

  // Lifted EMI state (shared with Shareable Scenario Links & Header)
  const [emiState, setEmiState] = useState(() => {
    const saved = loadSavedEmiState();
    if (initialLocationScenario.emiState) {
      return sanitizeEmiState({
        ...saved,
        ...initialLocationScenario.emiState,
        rates: initialLocationScenario.emiState.rates
          ? { ...saved.rates, ...initialLocationScenario.emiState.rates }
          : saved.rates,
      });
    }
    return saved;
  });

  const [currency, setCurrency] = useState(() => {
    if (initialLocationScenario.currencyCode) {
      const sharedCurr = CURRENCIES.find((c) => c.code === initialLocationScenario.currencyCode);
      if (sharedCurr) return sharedCurr;
    }
    if (typeof window !== 'undefined') {
      try {
        const savedCode = localStorage.getItem('bankinfo_currency');
        if (savedCode) {
          const found = CURRENCIES.find((c) => c.code === savedCode);
          if (found) return found;
        }
      } catch {}
    }
    return CURRENCIES[0]; // BDT (৳)
  });

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [guideModalMode, setGuideModalMode] = useState('single');

  const openGuideForMode = (mode = 'single') => {
    setGuideModalMode(mode === 'compare' || mode === 'goal' ? mode : 'single');
    setIsHowItWorksOpen(true);
  };

  // Persist currency selection
  useEffect(() => {
    try {
      localStorage.setItem('bankinfo_currency', currency.code);
    } catch {}
  }, [currency]);

  // Persist active page
  useEffect(() => {
    try {
      localStorage.setItem('bankinfo_active_page', currentPage);
    } catch {}
  }, [currentPage]);

  // Persist FDR mode (single, compare, or goal)
  useEffect(() => {
    try {
      localStorage.setItem('bankinfo_fdr_mode', fdrMode);
    } catch {}
  }, [fdrMode]);

  // Persist Multi-FDR schemes & sync settings
  useEffect(() => {
    try {
      const sanitized = multiSchemes.map((s) => ({
        ...s,
        amount: s.amount === '' ? 0 : Number(s.amount),
        totalDuration: s.totalDuration === '' || Number(s.totalDuration) <= 0 ? 1 : Number(s.totalDuration),
        interval: s.interval === '' ? 0 : Number(s.interval),
        annualRate: s.annualRate === '' ? 0 : Number(s.annualRate),
        taxRate: s.taxRate === '' ? 0 : Number(s.taxRate),
      }));
      localStorage.setItem('bankinfo_multi_fdr_schemes_v1', JSON.stringify(sanitized));
    } catch {}
  }, [multiSchemes]);

  useEffect(() => {
    try {
      localStorage.setItem(MULTI_SYNC_STORAGE_KEY, JSON.stringify(multiSyncFields));
    } catch {}
  }, [multiSyncFields]);

  // Persist Goal FDR inputs
  useEffect(() => {
    try {
      const sanitizedGoal = {
        ...goalInputs,
        targetAmount: goalInputs.targetAmount === '' ? 0 : Number(goalInputs.targetAmount),
        totalDuration:
          goalInputs.totalDuration === '' || Number(goalInputs.totalDuration) <= 0
            ? 12
            : Number(goalInputs.totalDuration),
        interval: goalInputs.interval === '' ? 0 : Number(goalInputs.interval),
        annualRate: goalInputs.annualRate === '' ? 0 : Number(goalInputs.annualRate),
        taxRate: goalInputs.taxRate === '' ? 0 : Number(goalInputs.taxRate),
      };
      localStorage.setItem('bankinfo_fdr_goal_v1', JSON.stringify(sanitizedGoal));
    } catch {}
  }, [goalInputs]);

  // Persist EMI state
  useEffect(() => {
    try {
      const stateToSave = {
        ...emiState,
        amount: emiState.amount === '' ? 0 : Number(emiState.amount),
        annualRate: emiState.annualRate === '' ? 9.5 : Number(emiState.annualRate),
        loanDuration: emiState.loanDuration === '' ? 12 : Number(emiState.loanDuration),
        singlePlanMonths: emiState.singlePlanMonths === '' ? 12 : Number(emiState.singlePlanMonths),
        singlePlanRate: emiState.singlePlanRate === '' ? 0 : Number(emiState.singlePlanRate),
        fdrOpportunityRate: emiState.fdrOpportunityRate === '' ? 0 : Number(emiState.fdrOpportunityRate),
        fdrOpportunityTax: emiState.fdrOpportunityTax === '' ? 0 : Number(emiState.fdrOpportunityTax),
      };
      localStorage.setItem(EMI_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {}
  }, [emiState]);

  // Dynamic document title per view
  useEffect(() => {
    if (currentPage === 'emi') {
      document.title = 'Credit Card & Loan EMI Calculator | BankInfo Calculate';
    } else if (currentPage === 'fdr' && fdrMode === 'compare') {
      document.title = 'Compare Multiple FDRs | BankInfo Calculate';
    } else if (currentPage === 'fdr' && fdrMode === 'goal') {
      document.title = 'FDR Goal & Reverse Planner | BankInfo Calculate';
    } else if (currentPage === 'fdr') {
      document.title = 'FDR Reinvestment Calculator | BankInfo Calculate';
    } else {
      document.title = 'BankInfo Calculate — FDR & EMI Financial Calculators';
    }
  }, [currentPage, fdrMode]);

  // Sync hash / history changes (e.g. browser back/forward buttons or pasted share URLs)
  useEffect(() => {
    const syncFromLocation = () => {
      const parsed = parseLocationScenario(window.location.hash, window.location.search);
      if (parsed.page) {
        setCurrentPage(parsed.page);
        if (parsed.mode) setFdrMode(parsed.mode);

        if (parsed.hasScenario) {
          if (parsed.currencyCode) {
            const foundCurr = CURRENCIES.find((c) => c.code === parsed.currencyCode);
            if (foundCurr) setCurrency(foundCurr);
          }
          if (parsed.fdrInputs) {
            setInputs((prev) => ({ ...prev, ...parsed.fdrInputs }));
          }
          if (parsed.multiSchemes) {
            setMultiSchemes(parsed.multiSchemes);
          }
          if (parsed.multiSyncFields) {
            setMultiSyncFields(parsed.multiSyncFields);
          }
          if (parsed.goalInputs) {
            setGoalInputs((prev) => ({ ...prev, ...parsed.goalInputs }));
          }
          if (parsed.emiState) {
            setEmiState((prev) =>
              sanitizeEmiState({
                ...prev,
                ...parsed.emiState,
                rates: parsed.emiState.rates
                  ? { ...prev.rates, ...parsed.emiState.rates }
                  : prev.rates,
              })
            );
          }
          setSharedScenarioBanner(true);
        }
      } else {
        setCurrentPage('home');
      }
    };
    window.addEventListener('hashchange', syncFromLocation);
    window.addEventListener('popstate', syncFromLocation);
    return () => {
      window.removeEventListener('hashchange', syncFromLocation);
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, []);

  const navigateTo = (page, mode = null) => {
    setSharedScenarioBanner(false);
    if (page === 'fdr-compare') {
      setCurrentPage('fdr');
      setFdrMode('compare');
      window.location.hash = 'fdr-compare';
    } else if (page === 'fdr-goal') {
      setCurrentPage('fdr');
      setFdrMode('goal');
      window.location.hash = 'fdr-goal';
    } else if (page === 'fdr') {
      const targetMode = mode || fdrMode;
      setCurrentPage('fdr');
      if (mode) setFdrMode(mode);
      window.location.hash =
        targetMode === 'compare'
          ? 'fdr-compare'
          : targetMode === 'goal'
          ? 'fdr-goal'
          : 'fdr';
    } else if (page === 'home') {
      setCurrentPage('home');
      if (window.location.hash) {
        window.history.pushState(null, '', window.location.pathname + window.location.search);
      }
    } else {
      setCurrentPage(page);
      window.location.hash = page;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dark mode + light-mode enforcement while printing
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('bankinfo_theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const wasDarkBeforePrintRef = useRef(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bankinfo_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bankinfo_theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleBeforePrint = () => {
      wasDarkBeforePrintRef.current = document.documentElement.classList.contains('dark');
      if (wasDarkBeforePrintRef.current) {
        document.documentElement.classList.remove('dark');
      }
    };
    const handleAfterPrint = () => {
      if (wasDarkBeforePrintRef.current) {
        document.documentElement.classList.add('dark');
        wasDarkBeforePrintRef.current = false;
      }
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // Persist inputs to localStorage
  useEffect(() => {
    try {
      const inputsToSave = {
        amount: inputs.amount === '' ? 0 : Number(inputs.amount),
        totalDuration: inputs.totalDuration === '' || Number(inputs.totalDuration) <= 0 ? 1 : Number(inputs.totalDuration),
        interval: inputs.interval === '' ? 0 : Number(inputs.interval),
        annualRate: inputs.annualRate === '' ? 0 : Number(inputs.annualRate),
        taxRate: inputs.taxRate === '' ? 0 : Number(inputs.taxRate),
      };
      localStorage.setItem('bankinfo_fdr_inputs_v2', JSON.stringify(inputsToSave));
    } catch (e) {
      // ignore
    }
  }, [inputs]);

  // Compute results dynamically whenever inputs change
  const results = useMemo(() => {
    return calculateFDRComparison(inputs);
  }, [inputs]);

  const multiResults = useMemo(() => {
    return calculateMultiFDRComparison(multiSchemes);
  }, [multiSchemes]);

  const goalResults = useMemo(() => {
    return calculateReverseFDRGoal(goalInputs);
  }, [goalInputs]);

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
  };

  const handleResetGoal = () => {
    setGoalInputs(DEFAULT_GOAL_INPUTS);
  };

  const handleCopyShareLink = async () => {
    if (typeof window === 'undefined') return;
    const shareUrl = buildShareUrl({
      baseUrl: `${window.location.origin}${window.location.pathname}`,
      page: currentPage,
      fdrMode,
      currencyCode: currency.code,
      fdrInputs: inputs,
      multiSchemes,
      multiSyncFields,
      goalInputs,
      emiState,
    });
    const ok = await copyTextToClipboard(shareUrl);
    if (ok) {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2200);
    }
  };

  const printReportTitle =
    currentPage === 'emi'
      ? 'Credit Card & Bank Loan EMI Report'
      : currentPage === 'fdr' && fdrMode === 'compare'
      ? 'Multi-FDR Comparison Report'
      : currentPage === 'fdr' && fdrMode === 'goal'
      ? 'FDR Goal & Principal Planner Report'
      : 'FDR Reinvestment & Interest Report';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors selection:bg-emerald-500 selection:text-white">

      {/* Navigation Header */}
      <Header
        currency={currency}
        setCurrency={setCurrency}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenHowItWorks={() => openGuideForMode(currentPage === 'fdr' ? fdrMode : 'single')}
        onCopyShareLink={handleCopyShareLink}
        shareCopied={shareCopied}
        currentPage={currentPage}
        setCurrentPage={navigateTo}
        fdrMode={fdrMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Dedicated Print / PDF Report Header */}
        <div className="print-only mb-6 pb-4 border-b-2 border-slate-300 flex items-center justify-between">
          <div>
            <div className="text-xl font-black text-slate-900">
              BankInfo <span className="text-emerald-700">Calculate</span>
            </div>
            <div className="text-sm font-semibold text-slate-700">{printReportTitle}</div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Currency: {currency.code} ({currency.symbol})</div>
            <div>Generated: {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Dismissible Notice when opened via a Shared Scenario Link */}
        {sharedScenarioBanner && currentPage !== 'home' && (
          <div className="mb-4 p-3 px-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 text-xs text-sky-900 dark:text-sky-200 flex items-center justify-between gap-3 no-print animate-fadeIn">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
              <span>Scenario parameters loaded from your shared link.</span>
            </div>
            <button
              type="button"
              onClick={() => setSharedScenarioBanner(false)}
              aria-label="Dismiss shared scenario banner"
              className="p-1 rounded-lg text-sky-600 hover:bg-sky-100 dark:text-sky-300 dark:hover:bg-sky-900/60 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {currentPage === 'home' && (
          <HomePage 
            onNavigateToFDR={() => navigateTo('fdr', 'single')}
            onNavigateToFDRCompare={() => navigateTo('fdr-compare')}
            onNavigateToFDRGoal={() => navigateTo('fdr-goal')}
            onNavigateToEMI={() => navigateTo('emi')}
            onOpenHowItWorks={() => openGuideForMode('single')}
          />
        )}

        {currentPage === 'emi' && (
          <EmiPage
            currency={currency}
            onNavigateHome={() => navigateTo('home')}
            emiState={emiState}
            setEmiState={setEmiState}
            onCopyShareLink={handleCopyShareLink}
            shareCopied={shareCopied}
          />
        )}

        {currentPage === 'fdr' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Top Navigation Bar inside FDR */}
            <div className="flex items-center justify-between pb-2 no-print">
              <button
                type="button"
                onClick={() => navigateTo('home')}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 py-1.5 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition cursor-pointer shadow-sm group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>Back to Home</span>
              </button>

              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">
                BankInfo &gt; Calculators &gt;{' '}
                {fdrMode === 'compare'
                  ? 'Compare Multiple FDRs'
                  : fdrMode === 'goal'
                  ? 'Goal / Reverse FDR Planner'
                  : 'FDR Reinvestment'}
              </span>
            </div>

            {/* Intro Tagline & Mode Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {fdrMode === 'compare'
                    ? 'Compare Multiple FDRs'
                    : fdrMode === 'goal'
                    ? 'Goal / Reverse FDR Planner'
                    : 'FDR Reinvestment & Interest Calculator'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {fdrMode === 'compare'
                    ? 'Compare up to 5 bank FDR offers, interest rates, compounding cycles (including custom intervals), and tax deductions side by side.'
                    : fdrMode === 'goal'
                    ? 'Calculate the exact starting deposit required to earn target monthly passive income or hit a maturity goal.'
                    : 'Compare returns between one-time flat FDR and periodic reinvestment compounding.'}
                </p>
              </div>

              {/* Segmented Mode Control */}
              <div className="flex flex-wrap items-center gap-2 no-print">
                <div className="flex flex-wrap items-center p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl shadow-inner">
                  <button
                    type="button"
                    onClick={() => navigateTo('fdr', 'single')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      fdrMode === 'single'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Single Plan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('fdr', 'compare')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      fdrMode === 'compare'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Compare</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateTo('fdr', 'goal')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      fdrMode === 'goal'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Goal Planner</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold uppercase">
                      New
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => openGuideForMode(fdrMode)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 transition cursor-pointer shrink-0"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {fdrMode === 'compare'
                      ? 'Compare Guide'
                      : fdrMode === 'goal'
                      ? 'Goal Guide'
                      : 'Single Guide'}
                  </span>
                </button>
              </div>
            </div>

            {/* Mode 1: Compare Multiple FDRs View */}
            {fdrMode === 'compare' ? (
              <MultiFdrComparison
                currency={currency}
                schemes={multiSchemes}
                setSchemes={setMultiSchemes}
                syncFields={multiSyncFields}
                setSyncFields={setMultiSyncFields}
                comparisonResults={multiResults}
                onOpenExport={() => setIsExportOpen(true)}
                onCopyShareLink={handleCopyShareLink}
                shareCopied={shareCopied}
                onInspectSingleScheme={(scheme) => {
                  setInputs({
                    amount: scheme.amount,
                    totalDuration: scheme.totalDuration,
                    interval: scheme.interval ?? 0,
                    annualRate: scheme.annualRate,
                    taxRate: scheme.taxRate,
                  });
                  navigateTo('fdr', 'single');
                }}
              />
            ) : fdrMode === 'goal' ? (
              /* Mode 2: Goal / Reverse FDR View */
              <GoalFdrPanel
                goalInputs={goalInputs}
                setGoalInputs={setGoalInputs}
                goalResults={goalResults}
                currency={currency}
                onReset={handleResetGoal}
                onCopyShareLink={handleCopyShareLink}
                shareCopied={shareCopied}
                onApplyToSingle={(solvedInputs) => {
                  setInputs(solvedInputs);
                  navigateTo('fdr', 'single');
                }}
              />
            ) : (
              /* Mode 3: Single FDR Analysis View */
              <>
                {/* Switch to Comparison Banner */}
                <div className="p-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200/80 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs no-print">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                    <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      Comparing multiple bank offers or solving backwards from a target monthly income or maturity goal?
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => navigateTo('fdr', 'goal')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold transition shadow-sm cursor-pointer"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>Goal Planner</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo('fdr', 'compare')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm cursor-pointer"
                    >
                      <span>Compare Multiple FDRs</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

                  {/* Left Column: Input Panel (lg: 5 cols) */}
                  <div className="lg:col-span-5 w-full lg:sticky lg:top-20">
                    <InputPanel
                      inputs={inputs}
                      setInputs={setInputs}
                      currency={currency}
                      onReset={handleReset}
                      onCopyShareLink={handleCopyShareLink}
                      shareCopied={shareCopied}
                    />
                  </div>

                  {/* Right Column: Comparison, Charts & Table (lg: 7 cols) */}
                  <div className="lg:col-span-7 w-full space-y-6">

                    {/* Comparison Cards */}
                    <ComparisonCards
                      results={results}
                      currency={currency}
                      onSelectInterval={(newInterval) => setInputs((prev) => ({ ...prev, interval: newInterval }))}
                    />

                    {/* Visual Chart & Stepper Progression */}
                    <VisualChart results={results} currency={currency} />

                    {/* Detailed Cycle Schedule Table */}
                    <CycleScheduleTable results={results} currency={currency} />

                  </div>
                </div>
              </>
            )}

            {/* Dedicated In-Page Guide & Functionality Card for the Active FDR Mode */}
            <FdrModeGuide mode={fdrMode} onOpenFullGuide={openGuideForMode} />

          </div>
        )}

      </main>

      {/* Global Footer */}
      <footer className="mt-12 border-t border-slate-200/80 dark:border-slate-800/80 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">BankInfo Calculate</span>
            <span>•</span>
            <span>Calculate. Plan. Grow.</span>
          </div>
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            100% Client-Side Browser App • No account required
          </span>
        </div>
      </footer>

      {/* Investment Summary Statement Modal */}
      <SummaryExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        results={results}
        multiResults={multiResults}
        goalResults={goalResults}
        fdrMode={fdrMode}
        currency={currency}
        onCopyShareLink={handleCopyShareLink}
        shareCopied={shareCopied}
      />

      {/* How It Works User Manual Modal */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        initialMode={guideModalMode}
        currentPage={currentPage}
        currentFdrMode={fdrMode}
        onSelectMode={(mode) => {
          setIsHowItWorksOpen(false);
          navigateTo('fdr', mode);
        }}
      />

    </div>
  );
}
