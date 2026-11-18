import React from 'react';
import { 
  Building2, 
  Moon, 
  Sun, 
  FileText,
  Printer, 
  HelpCircle,
  Calculator,
  CreditCard,
  Sliders,
  Target,
  Home,
  Link2,
  Check
} from 'lucide-react';
import { CURRENCIES } from '../utils/formatters';

export default function Header({ 
  currency, 
  setCurrency, 
  darkMode, 
  setDarkMode, 
  onOpenExport, 
  onOpenHowItWorks,
  onCopyShareLink,
  shareCopied = false,
  currentPage,
  setCurrentPage,
  fdrMode = 'single',
}) {
  const handlePrint = () => {
    window.print();
  };

  const navItems = [
    {
      id: 'fdr-single',
      label: 'FDR Calculator',
      shortLabel: 'FDR',
      Icon: Calculator,
      isActive: currentPage === 'fdr' && fdrMode === 'single',
      onClick: () => setCurrentPage('fdr', 'single'),
    },
    {
      id: 'fdr-compare',
      label: 'Compare FDRs',
      shortLabel: 'Compare',
      Icon: Sliders,
      isActive: currentPage === 'fdr' && fdrMode === 'compare',
      onClick: () => setCurrentPage('fdr', 'compare'),
    },
    {
      id: 'fdr-goal',
      label: 'Goal Planner',
      shortLabel: 'Goal',
      Icon: Target,
      badge: 'New',
      isActive: currentPage === 'fdr' && fdrMode === 'goal',
      onClick: () => setCurrentPage('fdr', 'goal'),
    },
    {
      id: 'emi',
      label: 'EMI Calculator',
      shortLabel: 'EMI',
      Icon: CreditCard,
      isActive: currentPage === 'emi',
      onClick: () => setCurrentPage('emi'),
    },
  ];

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-6">
          <button 
            type="button"
            onClick={() => setCurrentPage('home')}
            className="flex items-center gap-2.5 text-left cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
            title="Go to Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/20 transition-transform group-hover:scale-105">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  Bank<span className="text-emerald-600 dark:text-emerald-400">Info</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                  Calculate
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 hidden sm:block tracking-wide">
                Calculate. Plan. Grow.
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200 dark:border-slate-800">
            {navItems.map(({ id, label, Icon, badge, isActive, onClick }) => (
              <button
                key={id}
                type="button"
                onClick={onClick}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
                {badge && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold uppercase">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Controls specific to FDR Calculator */}
          {currentPage === 'fdr' && (
            <button
              type="button"
              onClick={onOpenHowItWorks}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20 transition cursor-pointer"
              title="How It Works - Simple Manual"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">How It Works</span>
            </button>
          )}

          {/* Currency Selector (Available on FDR and EMI calculators) */}
          {(currentPage === 'fdr' || currentPage === 'emi') && (
            <div className="relative">
              <select
                aria-label="Select Currency"
                value={currency.code}
                onChange={(e) => {
                  const found = CURRENCIES.find((c) => c.code === e.target.value);
                  if (found) setCurrency(found);
                }}
                className="appearance-none bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium py-1.5 pl-2.5 pr-7 rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                title="Select Currency"
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {curr.symbol} ({curr.code})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 dark:text-slate-400 text-xs">
                ▾
              </div>
            </div>
          )}

          {/* Copy Shareable Scenario Link (FDR & EMI) */}
          {(currentPage === 'fdr' || currentPage === 'emi') && onCopyShareLink && (
            <button
              type="button"
              onClick={onCopyShareLink}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title="Copy Shareable Scenario Link"
              aria-label="Copy Shareable Scenario Link"
            >
              {shareCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="hidden lg:inline text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden lg:inline">Share</span>
                </>
              )}
            </button>
          )}

          {/* Export Statement Button (FDR Single, Compare & Goal) */}
          {currentPage === 'fdr' && (
            <button
              type="button"
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 transition cursor-pointer"
              title="View Summary Statement & Copy"
              aria-label="View Summary Statement"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Statement</span>
            </button>
          )}

          {/* Print Button (FDR & EMI) */}
          {(currentPage === 'fdr' || currentPage === 'emi') && (
            <button
              type="button"
              onClick={handlePrint}
              aria-label="Print or Save as PDF"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Dark / Light Toggle (Always available) */}
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300 transition-transform -rotate-12 hover:rotate-0" />
            )}
          </button>
        </div>

      </div>

      {/* Mobile Navigation Bar */}
      <nav aria-label="Mobile navigation" className="md:hidden border-t border-slate-200/70 dark:border-slate-800/80 px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setCurrentPage('home')}
          aria-current={currentPage === 'home' ? 'page' : undefined}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition cursor-pointer ${
            currentPage === 'home'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        {navItems.map(({ id, shortLabel, Icon, isActive, onClick }) => (
          <button
            key={id}
            type="button"
            onClick={onClick}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition cursor-pointer ${
              isActive
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{shortLabel}</span>
          </button>
        ))}
      </nav>
    </header>
  );
}
