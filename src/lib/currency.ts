import { useEffect, useMemo, useState } from "react";

export type CurrencyCode = "VND" | "IDR" | "USD" | "INR";

type CurrencyOption = {
  code: CurrencyCode;
  label: string;
};

const STORAGE_KEY = "mpd.currency";

export const currencyOptions: CurrencyOption[] = [
  { code: "VND", label: "VND — Vietnamese đồng" },
  { code: "IDR", label: "IDR — Indonesian rupiah" },
  { code: "USD", label: "USD — US dollar" },
  { code: "INR", label: "INR — Indian rupee" },
];

const CURRENCY_CODES = currencyOptions.map((o) => o.code);

const isCurrencyCode = (value: unknown): value is CurrencyCode =>
  typeof value === "string" && CURRENCY_CODES.includes(value as CurrencyCode);

export const getStoredCurrency = (): CurrencyCode => {
  if (typeof window === "undefined") return "VND";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isCurrencyCode(stored)) return stored;
  } catch {
    // Ignore storage access errors and fall back to default.
  }
  return "VND";
};

export const setStoredCurrency = (code: CurrencyCode) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Ignore storage access errors.
  }
};

export const useCurrency = () => {
  const [currency, setCurrencyState] = useState<CurrencyCode>("VND");

  useEffect(() => {
    setCurrencyState(getStoredCurrency());
  }, []);

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    setStoredCurrency(code);
  };

  return useMemo(
    () => ({
      currency,
      setCurrency,
    }),
    [currency],
  );
};
