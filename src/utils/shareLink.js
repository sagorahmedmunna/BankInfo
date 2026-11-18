import { MAX_FDR_DURATION_MONTHS } from './fdrCalculator.js';
import { MAX_LOAN_MONTHS, DEFAULT_MERCHANT_PLANS } from './emiCalculator.js';

function toFiniteNonNeg(raw, max = Infinity) {
  if (raw === null || raw === undefined || raw === '') return null;
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.min(max, num);
}

function toPositiveInt(raw, max) {
  const num = toFiniteNonNeg(raw, max);
  if (num === null || num < 1) return null;
  return Math.floor(num);
}

function toNonNegInt(raw, max) {
  const num = toFiniteNonNeg(raw, max);
  if (num === null) return null;
  return Math.floor(num);
}

/**
 * UTF-8 safe base64url encode/decode for compact Multi-FDR sharing
 */
function encodeBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(token) {
  const padded = token.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((token.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Reusable clipboard copy helper with legacy execCommand fallback.
 */
export async function copyTextToClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below when Clipboard API is restricted
    }
  }

  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return Boolean(ok);
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Parses URL hash + query parameters into route and optional scenario state.
 * Supports hashes such as:
 *   #fdr?amount=100000&duration=12&interval=3&rate=9&tax=15&currency=BDT
 *   #fdr-compare?plans=...&sync=...
 *   #fdr-goal?goalType=monthly_income&target=10000&...
 *   #emi?type=merchant&amount=50000&...
 */
export function parseLocationScenario(hashString = '', searchString = '') {
  const trimmedHash = String(hashString || '').trim();
  const qIndex = trimmedHash.indexOf('?');
  const rawRoute = (qIndex >= 0 ? trimmedHash.slice(0, qIndex) : trimmedHash).toLowerCase();
  const hashQuery = qIndex >= 0 ? trimmedHash.slice(qIndex + 1) : '';
  const searchQuery = String(searchString || '').replace(/^\?/, '');

  const params = new URLSearchParams(hashQuery || searchQuery);
  const hasParams = Array.from(params.keys()).length > 0;

  let page = null;
  let mode = null;
  if (rawRoute === '#fdr-compare' || rawRoute === '#compare-fdr') {
    page = 'fdr';
    mode = 'compare';
  } else if (rawRoute === '#fdr-goal' || rawRoute === '#goal-fdr') {
    page = 'fdr';
    mode = 'goal';
  } else if (rawRoute === '#fdr' || rawRoute === '#fdr-calculator') {
    page = 'fdr';
    mode = params.get('mode') === 'compare'
      ? 'compare'
      : params.get('mode') === 'goal'
      ? 'goal'
      : 'single';
  } else if (rawRoute === '#emi' || rawRoute === '#emi-calculator') {
    page = 'emi';
    mode = null;
  }

  if (!page || !hasParams) {
    return {
      page,
      mode,
      hasScenario: false,
      currencyCode: null,
      fdrInputs: null,
      multiSchemes: null,
      multiSyncFields: null,
      goalInputs: null,
      emiState: null,
    };
  }

  const currencyParam = params.get('currency');
  const currencyCode = currencyParam ? currencyParam.toUpperCase() : null;

  if (page === 'fdr' && mode === 'single') {
    const amount = toFiniteNonNeg(params.get('amount'));
    const totalDuration = toPositiveInt(params.get('duration'), MAX_FDR_DURATION_MONTHS);
    const interval = toNonNegInt(params.get('interval'), MAX_FDR_DURATION_MONTHS);
    const annualRate = toFiniteNonNeg(params.get('rate'), 100);
    const taxRate = toFiniteNonNeg(params.get('tax'), 100);

    const hasAnyField =
      amount !== null ||
      totalDuration !== null ||
      interval !== null ||
      annualRate !== null ||
      taxRate !== null;

    return {
      page,
      mode,
      hasScenario: hasAnyField || Boolean(currencyCode),
      currencyCode,
      fdrInputs: hasAnyField
        ? {
            ...(amount !== null ? { amount } : {}),
            ...(totalDuration !== null ? { totalDuration } : {}),
            ...(interval !== null ? { interval } : {}),
            ...(annualRate !== null ? { annualRate } : {}),
            ...(taxRate !== null ? { taxRate } : {}),
          }
        : null,
      multiSchemes: null,
      multiSyncFields: null,
      goalInputs: null,
      emiState: null,
    };
  }

  if (page === 'fdr' && mode === 'compare') {
    let multiSchemes = null;
    const plansToken = params.get('plans');
    if (plansToken) {
      try {
        const decoded = JSON.parse(decodeBase64Url(plansToken));
        if (Array.isArray(decoded) && decoded.length >= 2) {
          multiSchemes = decoded.slice(0, 5).map((item, idx) => {
            const [name, amt, dur, intv, rate, tax] = Array.isArray(item)
              ? item
              : [item.n, item.a, item.d, item.i, item.r, item.t];
            const safeIntv = toNonNegInt(intv, MAX_FDR_DURATION_MONTHS) ?? 3;
            return {
              id: `shared-${idx + 1}`,
              name: typeof name === 'string' && name.trim() ? name.slice(0, 60) : `Bank ${idx + 1}`,
              amount: toFiniteNonNeg(amt) ?? 100000,
              totalDuration: toPositiveInt(dur, MAX_FDR_DURATION_MONTHS) ?? 12,
              interval: safeIntv,
              annualRate: toFiniteNonNeg(rate, 100) ?? 9,
              taxRate: toFiniteNonNeg(tax, 100) ?? 15,
              isCompounded: safeIntv > 0,
            };
          });
        }
      } catch {
        multiSchemes = null;
      }
    }

    const syncRaw = params.get('sync');
    let multiSyncFields = null;
    if (syncRaw !== null) {
      const enabled = new Set(syncRaw.split(',').map((s) => s.trim()).filter(Boolean));
      multiSyncFields = {
        amount: enabled.has('amount'),
        totalDuration: enabled.has('totalDuration'),
        interval: enabled.has('interval'),
        annualRate: enabled.has('annualRate'),
        taxRate: enabled.has('taxRate'),
      };
    }

    return {
      page,
      mode,
      hasScenario: Boolean(multiSchemes || multiSyncFields || currencyCode),
      currencyCode,
      fdrInputs: null,
      multiSchemes,
      multiSyncFields,
      goalInputs: null,
      emiState: null,
    };
  }

  if (page === 'fdr' && mode === 'goal') {
    const rawGoalType = params.get('goalType');
    const goalType =
      rawGoalType === 'maturity' || rawGoalType === 'net_profit' || rawGoalType === 'monthly_income'
        ? rawGoalType
        : null;
    const targetAmount = toFiniteNonNeg(params.get('target'));
    const totalDuration = toPositiveInt(params.get('duration'), MAX_FDR_DURATION_MONTHS);
    const interval = toNonNegInt(params.get('interval'), MAX_FDR_DURATION_MONTHS);
    const annualRate = toFiniteNonNeg(params.get('rate'), 100);
    const taxRate = toFiniteNonNeg(params.get('tax'), 100);

    const hasAnyField =
      goalType !== null ||
      targetAmount !== null ||
      totalDuration !== null ||
      interval !== null ||
      annualRate !== null ||
      taxRate !== null;

    return {
      page,
      mode,
      hasScenario: hasAnyField || Boolean(currencyCode),
      currencyCode,
      fdrInputs: null,
      multiSchemes: null,
      multiSyncFields: null,
      goalInputs: hasAnyField
        ? {
            ...(goalType !== null ? { goalType } : {}),
            ...(targetAmount !== null ? { targetAmount } : {}),
            ...(totalDuration !== null ? { totalDuration } : {}),
            ...(interval !== null ? { interval } : {}),
            ...(annualRate !== null ? { annualRate } : {}),
            ...(taxRate !== null ? { taxRate } : {}),
          }
        : null,
      emiState: null,
    };
  }

  if (page === 'emi') {
    const typeParam = params.get('type');
    const calculatorType = typeParam === 'standard' || typeParam === 'merchant' ? typeParam : null;
    const amount = toFiniteNonNeg(params.get('amount'));
    const annualRate = toFiniteNonNeg(params.get('rate'), 100);
    const loanDuration = toPositiveInt(params.get('duration'), MAX_LOAN_MONTHS);
    const zeroParam = params.get('zero');
    const singleParam = params.get('single');
    const sel = toNonNegInt(params.get('sel'), DEFAULT_MERCHANT_PLANS.length - 1);
    const singlePlanMonths = toPositiveInt(params.get('sm'), 120);
    const singlePlanRate = toFiniteNonNeg(params.get('sr'), 100);
    const fdrRate = toFiniteNonNeg(params.get('fdrRate'), 100);
    const fdrTax = toFiniteNonNeg(params.get('fdrTax'), 100);
    const fdrInterval = toNonNegInt(params.get('fdrInt'), MAX_FDR_DURATION_MONTHS);

    let rates = null;
    const ratesRaw = params.get('rates');
    if (ratesRaw) {
      const parsedRates = {};
      ratesRaw.split(',').forEach((pair) => {
        const [mStr, rStr] = pair.split(':');
        const m = Number(mStr);
        const r = toFiniteNonNeg(rStr, 100);
        if (Number.isInteger(m) && r !== null) {
          parsedRates[m] = r;
        }
      });
      if (Object.keys(parsedRates).length > 0) rates = parsedRates;
    }

    const hasAnyField =
      calculatorType !== null ||
      amount !== null ||
      annualRate !== null ||
      loanDuration !== null ||
      zeroParam !== null ||
      singleParam !== null ||
      sel !== null ||
      singlePlanMonths !== null ||
      singlePlanRate !== null ||
      fdrRate !== null ||
      fdrTax !== null ||
      fdrInterval !== null ||
      rates !== null;

    return {
      page,
      mode: null,
      hasScenario: hasAnyField || Boolean(currencyCode),
      currencyCode,
      fdrInputs: null,
      multiSchemes: null,
      multiSyncFields: null,
      goalInputs: null,
      emiState: hasAnyField
        ? {
            ...(calculatorType !== null ? { calculatorType } : {}),
            ...(amount !== null ? { amount } : {}),
            ...(annualRate !== null ? { annualRate } : {}),
            ...(loanDuration !== null ? { loanDuration } : {}),
            ...(zeroParam !== null ? { isZeroInterest: zeroParam === '1' || zeroParam === 'true' } : {}),
            ...(singleParam !== null ? { isSinglePlanMode: singleParam === '1' || singleParam === 'true' } : {}),
            ...(sel !== null ? { selectedPlanIndex: sel } : {}),
            ...(singlePlanMonths !== null ? { singlePlanMonths } : {}),
            ...(singlePlanRate !== null ? { singlePlanRate } : {}),
            ...(fdrRate !== null ? { fdrOpportunityRate: fdrRate } : {}),
            ...(fdrTax !== null ? { fdrOpportunityTax: fdrTax } : {}),
            ...(fdrInterval !== null ? { fdrOpportunityInterval: fdrInterval } : {}),
            ...(rates !== null ? { rates } : {}),
          }
        : null,
    };
  }

  return {
    page,
    mode,
    hasScenario: false,
    currencyCode: null,
    fdrInputs: null,
    multiSchemes: null,
    multiSyncFields: null,
    goalInputs: null,
    emiState: null,
  };
}

/**
 * Builds a complete client-side shareable URL preserving the current view and parameters.
 */
export function buildShareUrl({
  baseUrl = '',
  page = 'home',
  fdrMode = 'single',
  currencyCode = 'BDT',
  fdrInputs = null,
  multiSchemes = null,
  multiSyncFields = null,
  goalInputs = null,
  emiState = null,
}) {
  const cleanBase = String(baseUrl || '').split('#')[0];

  if (page === 'fdr' && fdrMode === 'single' && fdrInputs) {
    const params = new URLSearchParams({
      amount: String(Number(fdrInputs.amount) || 0),
      duration: String(Number(fdrInputs.totalDuration) || 1),
      interval: String(fdrInputs.interval === '' ? 0 : Number(fdrInputs.interval) || 0),
      rate: String(Number(fdrInputs.annualRate) || 0),
      tax: String(Number(fdrInputs.taxRate) || 0),
      currency: currencyCode,
    });
    return `${cleanBase}#fdr?${params.toString()}`;
  }

  if (page === 'fdr' && fdrMode === 'compare' && Array.isArray(multiSchemes)) {
    const compact = multiSchemes.slice(0, 5).map((s) => [
      String(s.name || 'Scheme'),
      Number(s.amount) || 0,
      Number(s.totalDuration) || 1,
      s.isCompounded === false ? 0 : Number(s.interval) || 0,
      Number(s.annualRate) || 0,
      Number(s.taxRate) || 0,
    ]);
    const params = new URLSearchParams({
      plans: encodeBase64Url(JSON.stringify(compact)),
      currency: currencyCode,
    });
    if (multiSyncFields) {
      const activeSync = Object.keys(multiSyncFields).filter((k) => multiSyncFields[k]);
      if (activeSync.length > 0) {
        params.set('sync', activeSync.join(','));
      }
    }
    return `${cleanBase}#fdr-compare?${params.toString()}`;
  }

  if (page === 'fdr' && fdrMode === 'goal' && goalInputs) {
    const params = new URLSearchParams({
      goalType: goalInputs.goalType || 'monthly_income',
      target: String(Number(goalInputs.targetAmount) || 0),
      duration: String(Number(goalInputs.totalDuration) || 12),
      interval: String(goalInputs.interval === '' ? 0 : Number(goalInputs.interval) || 0),
      rate: String(Number(goalInputs.annualRate) || 0),
      tax: String(Number(goalInputs.taxRate) || 0),
      currency: currencyCode,
    });
    return `${cleanBase}#fdr-goal?${params.toString()}`;
  }

  if (page === 'emi' && emiState) {
    const type = emiState.calculatorType === 'standard' ? 'standard' : 'merchant';
    const params = new URLSearchParams({
      type,
      amount: String(Number(emiState.amount) || 0),
      currency: currencyCode,
    });

    if (type === 'standard') {
      params.set('rate', String(Number(emiState.annualRate) || 0));
      params.set('duration', String(Number(emiState.loanDuration) || 12));
    } else {
      params.set('zero', emiState.isZeroInterest ? '1' : '0');
      params.set('single', emiState.isSinglePlanMode ? '1' : '0');
      params.set('sel', String(Number(emiState.selectedPlanIndex) || 0));
      params.set('sm', String(Number(emiState.singlePlanMonths) || 12));
      params.set('sr', String(Number(emiState.singlePlanRate) || 0));
      params.set('fdrRate', String(emiState.fdrOpportunityRate !== undefined ? Number(emiState.fdrOpportunityRate) || 0 : 9));
      params.set('fdrTax', String(emiState.fdrOpportunityTax !== undefined ? Number(emiState.fdrOpportunityTax) || 0 : 15));
      params.set('fdrInt', String(emiState.fdrOpportunityInterval !== undefined ? Number(emiState.fdrOpportunityInterval) || 0 : 3));
      if (emiState.rates && typeof emiState.rates === 'object') {
        const ratePairs = DEFAULT_MERCHANT_PLANS
          .map((p) => `${p.months}:${Number(emiState.rates[p.months] ?? p.defaultRate) || 0}`)
          .join(',');
        params.set('rates', ratePairs);
      }
    }

    return `${cleanBase}#emi?${params.toString()}`;
  }

  return cleanBase;
}
