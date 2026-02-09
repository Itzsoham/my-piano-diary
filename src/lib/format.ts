import type { CurrencyCode } from "./currency";

const currencyLocaleMap: Record<CurrencyCode, string> = {
  VND: "vi-VN",
  IDR: "id-ID",
  USD: "en-US",
};

const currencyFractionDigits: Record<CurrencyCode, number> = {
  VND: 0,
  IDR: 0,
  USD: 2,
};

export const formatCurrency = (amount: number, currency: CurrencyCode) => {
  const locale = currencyLocaleMap[currency];
  const fractionDigits = currencyFractionDigits[currency];
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
};

export const formatCurrencyNumber = (
  amount: number,
  currency: CurrencyCode,
) => {
  const locale = currencyLocaleMap[currency];
  const fractionDigits = currencyFractionDigits[currency];
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount);
};
