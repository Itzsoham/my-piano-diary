import { useEffect, useMemo, useState } from "react";

export type CurrencyCode = "VND" | "IDR" | "USD";

type CurrencyOption = {
  code: CurrencyCode;
  label: string;
};

const STORAGE_KEY = "mpd.currency";

export const currencyOptions: CurrencyOption[] = [
  { code: "VND", label: "VND" },
  { code: "IDR", label: "IND" },
  { code: "USD", label: "USD" },
];

export const getStoredCurrency = (): CurrencyCode => {
  if (typeof window === "undefined") return "VND";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "VND" || stored === "IDR" || stored === "USD") {
      return stored;
    }
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
