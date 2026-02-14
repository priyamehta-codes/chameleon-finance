import { currencyLocales } from './constants';

/**
 * Convert amount from one currency to another via USD base
 * @param {number} amount - Amount in fromCurrency
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @param {Object} currencies - Currency rates object
 * @returns {number} - Converted amount
 */
export function convertToBase(amount, fromCurrency, toCurrency, currencies) {
  const from = currencies[fromCurrency] || currencies.USD;
  const to = currencies[toCurrency];
  const usdAmount = amount / from.rate;
  return usdAmount * to.rate;
}

export function formatNum(amount, decimals, currencyCode) {
  const locale = currencyLocales[currencyCode] || "en-US";
  return amount.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatCurrency(baseAmount, selectedCurrency, currencies, decimals = 2) {
  const curr = currencies[selectedCurrency];
  const dec = curr.rate > 100 ? 0 : decimals;
  return curr.symbol + formatNum(baseAmount, dec, selectedCurrency);
}

export function formatCurrencyShort(baseAmount, selectedCurrency, currencies) {
  const curr = currencies[selectedCurrency];
  if (baseAmount >= 1_000_000) return curr.symbol + (baseAmount / 1_000_000).toFixed(1) + "M";
  if (baseAmount >= 10_000) return curr.symbol + (baseAmount / 1_000).toFixed(0) + "k";
  if (curr.rate > 100) return curr.symbol + formatNum(Math.round(baseAmount), 0, selectedCurrency);
  return curr.symbol + formatNum(baseAmount, 0, selectedCurrency);
}

export function formatOriginalPrice(sub, selectedCurrency, currencies) {
  const code = sub.currency || selectedCurrency || "USD";
  const curr = currencies[code] || currencies.USD;
  const dec = curr.rate > 100 ? 0 : 2;
  return curr.symbol + formatNum(sub.price, dec, code);
}

export function formatOriginalMonthly(sub, selectedCurrency, currencies) {
  const code = sub.currency || selectedCurrency || "USD";
  const curr = currencies[code] || currencies.USD;
  let monthly = sub.price;
  if (sub.cycle === "Yearly") monthly = sub.price / 12;
  if (sub.cycle === "Weekly") monthly = sub.price * 4.33;
  const dec = curr.rate > 100 ? 0 : 2;
  return curr.symbol + formatNum(monthly, dec, code);
}

export function formatOriginalMonthlyShort(sub, selectedCurrency, currencies) {
  const code = sub.currency || selectedCurrency || "USD";
  const curr = currencies[code] || currencies.USD;
  let monthly = sub.price;
  if (sub.cycle === "Yearly") monthly = sub.price / 12;
  if (sub.cycle === "Weekly") monthly = sub.price * 4.33;
  if (monthly >= 1_000_000) return curr.symbol + (monthly / 1_000_000).toFixed(1) + "M";
  if (monthly >= 10_000) return curr.symbol + (monthly / 1_000).toFixed(0) + "k";
  if (curr.rate > 100) return curr.symbol + formatNum(Math.round(monthly), 0, code);
  return curr.symbol + formatNum(monthly, 0, code);
}

export function formatOriginalYearlyShort(sub, selectedCurrency, currencies) {
  const code = sub.currency || selectedCurrency || "USD";
  const curr = currencies[code] || currencies.USD;
  let yearly = sub.price * 12;
  if (sub.cycle === "Yearly") yearly = sub.price;
  if (sub.cycle === "Weekly") yearly = sub.price * 52;
  if (yearly >= 1_000_000) return curr.symbol + (yearly / 1_000_000).toFixed(1) + "M";
  if (yearly >= 10_000) return curr.symbol + (yearly / 1_000).toFixed(0) + "k";
  if (curr.rate > 100) return curr.symbol + formatNum(Math.round(yearly), 0, code);
  return curr.symbol + formatNum(yearly, 0, code);
}

/**
 * Convert subscription to monthly cost in the selected currency
 * @param {Object} sub - Subscription object
 * @param {string} selectedCurrency - Target currency code
 * @param {Object} currencies - Currency rates object
 * @returns {number} - Monthly cost in selected currency
 */
export function toMonthly(sub, selectedCurrency, currencies) {
  const subCurrency = sub.currency || selectedCurrency || "USD";
  let monthly = sub.price;
  if (sub.cycle === "Yearly") monthly = sub.price / 12;
  if (sub.cycle === "Weekly") monthly = sub.price * 4.33;
  return convertToBase(monthly, subCurrency, selectedCurrency, currencies);
}
