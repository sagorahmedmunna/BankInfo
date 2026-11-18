export const CURRENCIES = [
  { symbol: '৳', code: 'BDT', name: 'Bangladeshi Taka (৳)' },
  { symbol: '$', code: 'USD', name: 'US Dollar ($)' },
  { symbol: '€', code: 'EUR', name: 'Euro (€)' },
  { symbol: '£', code: 'GBP', name: 'British Pound (£)' },
  { symbol: '₹', code: 'INR', name: 'Indian Rupee (₹)' },
  { symbol: '¥', code: 'JPY', name: 'Japanese Yen (¥)' },
  { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar (C$)' },
  { symbol: 'A$', code: 'AUD', name: 'Australian Dollar (A$)' },
  { symbol: 'AED', code: 'AED', name: 'UAE Dirham (AED)' },
  { symbol: 'SAR', code: 'SAR', name: 'Saudi Riyal (SAR)' },
];

export function formatCurrency(amount, symbol = '৳', decimals = 2) {
  const num = Number(amount);
  if (amount === null || amount === undefined || Number.isNaN(num) || !Number.isFinite(num)) {
    return `${symbol} ${formatNumber(0, decimals)}`;
  }
  const cleanNum = Math.abs(num) < 1e-9 ? 0 : num;
  const isNegative = cleanNum < 0;
  const formatted = formatNumber(Math.abs(cleanNum), decimals);
  return isNegative ? `-${symbol} ${formatted}` : `${symbol} ${formatted}`;
}

export function formatNumber(val, decimals = 2) {
  const num = Number(val);
  if (val === null || val === undefined || Number.isNaN(num) || !Number.isFinite(num)) {
    return (0).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  const cleanNum = Math.abs(num) < 1e-9 ? 0 : num;
  return cleanNum.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats quick amount chip labels appropriately for the active currency.
 * South Asian currencies (BDT, INR) use Lakh notation; others use k / M.
 */
export function formatQuickAmount(amount, currencyCode = 'BDT') {
  const isSouthAsian = currencyCode === 'BDT' || currencyCode === 'INR';
  if (isSouthAsian) {
    if (amount >= 100000) return `${amount / 100000} Lakh`;
    if (amount >= 1000) return `${amount / 1000}k`;
    return String(amount);
  }
  if (amount >= 1000000) return `${amount / 1000000}M`;
  if (amount >= 1000) return `${amount / 1000}k`;
  return String(amount);
}

