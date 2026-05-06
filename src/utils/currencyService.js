import Decimal from 'decimal.js';

// rates are quoted as "1 unit of currency = N MAD" (matches db.json `rate` field)
// e.g. EUR rate=10.8 means 1 EUR = 10.8 MAD

export function convertAmount(amount, fromCode, toCode, currencies) {
  const n = Number(amount) || 0;
  if (!currencies?.length || fromCode === toCode) return roundTo2(n);
  const from = currencies.find((c) => c.code === fromCode);
  const to   = currencies.find((c) => c.code === toCode);
  if (!from || !to) return roundTo2(n);
  // amount → MAD → target
  const mad     = new Decimal(n).mul(from.rate || 1);
  const target  = mad.div(to.rate || 1);
  return roundTo2(target.toNumber());
}

function roundTo2(n) {
  return Math.round(n * 100) / 100;
}

export function getCurrencySymbol(code, currencies) {
  if (!code) return '';
  const c = (currencies || []).find((x) => x.code === code);
  if (!c) return code;
  // Strip non-ASCII (Arabic dirham) when used in PDF / latin-1 contexts
  const sym = c.symbol || code;
  return /^[\x20-\x7E]+$/.test(sym) ? sym : code;
}

export function formatAmount(amount, code = 'MAD', currencies = []) {
  const n = Number(amount) || 0;
  let formatted;
  try {
    formatted = new Intl.NumberFormat('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    const abs = Math.abs(n).toFixed(2);
    const [int, dec] = abs.split('.');
    formatted = `${n < 0 ? '-' : ''}${int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${dec}`;
  }
  // Replace narrow no-break space (sometimes inserted by Intl) with regular space
  formatted = formatted.replace(/ | /g, ' ');
  const symbol = getCurrencySymbol(code, currencies) || code;
  return `${formatted} ${symbol}`;
}

export const CURRENCY_FLAGS = {
  MAD: '🇲🇦',
  EUR: '🇪🇺',
  USD: '🇺🇸',
  GBP: '🇬🇧',
};
