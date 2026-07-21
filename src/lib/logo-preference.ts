import { useEffect, useMemo, useState } from "react";

export type LogoVariant = "blossom" | "mochi";

type LogoOption = {
  variant: LogoVariant;
  label: string;
  description: string;
};

const STORAGE_KEY = "mpd.logo-variant";

export const logoOptions: LogoOption[] = [
  {
    variant: "blossom",
    label: "Blossom Badge",
    description: "The five-petal blossom, on the brand gradient",
  },
  {
    variant: "mochi",
    label: "Mochi Badge",
    description: "The studio cat's face, on the brand gradient",
  },
];

const isLogoVariant = (value: unknown): value is LogoVariant =>
  value === "blossom" || value === "mochi";

export const getStoredLogoVariant = (): LogoVariant => {
  if (typeof window === "undefined") return "blossom";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLogoVariant(stored)) return stored;
  } catch {
    // Ignore storage access errors and fall back to default.
  }
  return "blossom";
};

export const setStoredLogoVariant = (variant: LogoVariant) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, variant);
  } catch {
    // Ignore storage access errors.
  }
};

/**
 * Which logo mark to render in the sidebar / auth screens. A per-browser
 * preference (not synced to the account), same pattern as useCurrency —
 * defaults to "blossom" until hydrated from localStorage on mount, so the
 * server-rendered and first client render always agree.
 */
export const useLogoVariant = () => {
  const [variant, setVariantState] = useState<LogoVariant>("blossom");

  useEffect(() => {
    setVariantState(getStoredLogoVariant());
  }, []);

  const setVariant = (next: LogoVariant) => {
    setVariantState(next);
    setStoredLogoVariant(next);
  };

  return useMemo(() => ({ variant, setVariant }), [variant]);
};
