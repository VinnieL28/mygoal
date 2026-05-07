export const CURRENCIES = {
  MKD: { code: 'MKD', symbol: 'ден', label: 'Macedonian Denar', rateFromMKD: 1 },
  EUR: { code: 'EUR', symbol: '€',   label: 'Euro',             rateFromMKD: 1 / 61.5 },
  USD: { code: 'USD', symbol: '$',   label: 'US Dollar',        rateFromMKD: 1 / 57 },
};

export const CURRENCY_LIST = Object.values(CURRENCIES);

export function convertFromMKD(amountMKD, code) {
  const c = CURRENCIES[code] || CURRENCIES.MKD;
  return amountMKD * c.rateFromMKD;
}

export function formatAmount(amountMKD, code = 'MKD', { compact = false, sign = false } = {}) {
  const c = CURRENCIES[code] || CURRENCIES.MKD;
  const value = amountMKD * c.rateFromMKD;
  const abs = Math.abs(value);

  let body;
  if (compact && abs >= 10000) {
    if (abs >= 1_000_000) body = (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    else body = (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  } else {
    const decimals = code === 'MKD' ? 0 : 2;
    body = value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  const prefix = sign && value > 0 ? '+' : '';
  if (code === 'MKD') return `${prefix}${body} ${c.symbol}`;
  return `${prefix}${c.symbol}${body}`;
}
