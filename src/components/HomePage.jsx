import React from 'react';
import {
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Coins,
  Clock,
  PiggyBank,
  CreditCard,
  Percent,
  HelpCircle,
  Sliders,
  Target
} from 'lucide-react';

export default function HomePage({ onNavigateToFDR, onNavigateToFDRCompare, onNavigateToFDRGoal, onNavigateToEMI, onOpenHowItWorks }) {
  const tools = [
    {
      id: 'fdr',
      title: 'FDR Reinvestment Calculator',
      badge: 'Live & Ready',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      description: 'Calculate traditional vs periodic compounded FDR returns, tax deductions at source, and view step-by-step cycle growth.',
      icon: TrendingUp,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400',
      cta: 'Launch Calculator',
      isLive: true,
      onClick: onNavigateToFDR,
    },
    {
      id: 'fdr-compare',
      title: 'Compare Multiple FDRs',
      badge: 'Live & Ready',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      description: 'Compare up to 5 bank FDR offers side by side with custom renewal intervals, column syncing, CSV export, and shareable links.',
      icon: Sliders,
      iconBg: 'bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400',
      cta: 'Compare FDRs Now',
      isLive: true,
      onClick: onNavigateToFDRCompare,
    },
    {
      id: 'fdr-goal',
      title: 'Goal / Reverse FDR Planner',
      badge: 'New Tool',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
      description: 'Solve backwards from your target monthly passive income, maturity corpus, or net profit to find the exact FDR principal required.',
      icon: Target,
      iconBg: 'bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400',
      cta: 'Plan Goal Now',
      isLive: true,
      onClick: onNavigateToFDRGoal,
    },
    {
      id: 'emi',
      title: 'Credit Card & Loan EMI Calculator',
      badge: 'Live & Ready',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      description: 'Analyze credit card EMIs with true annualized APR & Cash vs. FDR opportunity cost, plus Bank Loan amortization schedules and CSV export.',
      icon: CreditCard,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400',
      cta: 'Launch Calculator',
      isLive: true,
      onClick: onNavigateToEMI,
    },
    {
      id: 'dps',
      title: 'DPS / Monthly Recurring Deposit',
      badge: 'Coming Soon',
      badgeColor: 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-400 border-sky-200 dark:border-sky-800',
      description: 'Calculate monthly installment compounding maturity, total savings deposited, interest accrued, and post-tax maturity value.',
      icon: PiggyBank,
      iconBg: 'bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400',
      cta: 'Coming Soon',
      isLive: false,
    },
    {
      id: 'savings',
      title: 'Savings Yield & Excise Duty',
      badge: 'Coming Soon',
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-400 border-purple-200 dark:border-purple-800',
      description: 'Estimate daily-balance interest on savings accounts, government excise duty brackets, and net annual profit.',
      icon: Percent,
      iconBg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400',
      cta: 'Coming Soon',
      isLive: false,
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-16 animate-fadeIn pb-12">

      {/* Hero Section with Official Graphic Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-sky-50/50 to-emerald-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 border border-slate-200/80 dark:border-slate-800 shadow-sm transition">

        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 p-6 sm:p-10 lg:p-12">

          {/* Left Column: Headline and Actions */}
          <div className="lg:col-span-7 space-y-6">

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Smart Banking Calculators for Everyone</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Bank Info <span className="text-emerald-600 dark:text-emerald-400">Calculate</span>
              </h1>
              <p className="text-lg sm:text-xl font-medium text-slate-600 dark:text-slate-300">
                Calculate. Plan. Grow.
              </p>
            </div>

            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
              Make confident banking and investment decisions. Compare Fixed Deposit Receipt (FDR) returns, simulate periodic compounding reinvestment, and plan your financial future with 100% privacy in your browser.
            </p>

            {/* Call to Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onNavigateToFDR}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition cursor-pointer group"
              >
                <span>Open FDR Calculator</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={onNavigateToFDRCompare}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 font-bold text-sm transition cursor-pointer shadow-sm"
              >
                <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Compare FDRs</span>
              </button>

              <button
                onClick={onNavigateToFDRGoal}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/80 font-bold text-sm transition cursor-pointer shadow-sm"
              >
                <Target className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Goal Planner (New)</span>
              </button>

              <button
                onClick={onOpenHowItWorks}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-sm transition cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>How It Works</span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-5 pt-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> 100% Client-Side & Private
              </span>
              <span className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-500" /> Pre & Post-Tax Precision
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-500" /> Live Dynamic Simulation
              </span>
            </div>

          </div>

          {/* Right Column: Graphic Banner Image */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200/60 dark:border-slate-800 group transition">
              <img
                src={`${import.meta.env.BASE_URL}hero-banner.jpg`}
                alt="Bank Info Calculate - Calculate. Plan. Grow."
                className="w-full h-auto max-w-md object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
          </div>

        </div>

      </section>

      {/* Banking Calculators & Tools Catalog */}
      <section className="space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Banking & Investment Tools
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Explore our financial simulators designed to help you maximize your savings.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 self-start sm:self-auto">
            4 Available Now • 2 In Development
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const CardTag = tool.isLive ? 'button' : 'div';
            return (
              <CardTag
                key={tool.id}
                {...(tool.isLive ? { type: 'button', onClick: tool.onClick } : {})}
                className={`p-6 rounded-3xl border text-left transition-all flex flex-col justify-between ${tool.isLive
                    ? 'bg-white dark:bg-slate-900 border-emerald-500/80 shadow-md shadow-emerald-500/5 hover:shadow-lg hover:border-emerald-500 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500'
                    : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 opacity-80'
                  }`}
              >
                <div className="w-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${tool.iconBg}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${tool.badgeColor}`}>
                      {tool.badge}
                    </span>
                  </div>

                  <h3 className={`text-lg font-bold mb-2 ${tool.isLive ? 'text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400' : 'text-slate-700 dark:text-slate-300'} transition`}>
                    {tool.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                    {tool.description}
                  </p>
                </div>

                <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  {tool.isLive ? (
                    <>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        Full simulator with schedule & charts
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 group-hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm">
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                      Feature currently under development
                    </span>
                  )}
                </div>
              </CardTag>
            );
          })}
        </div>

      </section>

      {/* Why Choose BankInfo Section */}
      <section className="p-6 sm:p-10 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-6">
        <div className="max-w-2xl">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Why Use Bank Info Calculate?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            We built these calculators to empower depositors with clear, honest numbers without commercial bank marketing bias.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-2">

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Complete Privacy
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Calculations run 100% in your browser. No server logging, no tracking, and no bank account access needed.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Accurate Tax Calculation
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Standard bank interest quotes ignore government tax. We show both gross and exact net post-tax payouts.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Compound Power
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              See the exact extra gain earned simply by renewing your FDR periodically rather than letting it sit idle.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}

