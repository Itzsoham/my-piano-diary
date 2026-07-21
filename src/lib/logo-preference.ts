import { useEffect, useMemo, useState } from "react";

export type LogoVariant =
  | "blossom"
  | "mochi"
  | "kitty"
  | "sakura-keys"
  | "diary-keys";

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
  {
    variant: "kitty",
    label: "Kitty Bow",
    description: "A sleepy cat face with a bow, outlined kawaii style",
  },
  {
    variant: "sakura-keys",
    label: "Sakura Keys",
    description: "A blossom resting on piano keys",
  },
  {
    variant: "diary-keys",
    label: "Diary Keys",
    description: "A diary with piano keys along the bottom edge",
  },
];

const LOGO_VARIANTS: readonly LogoVariant[] = logoOptions.map(
  (o) => o.variant,
);

const isLogoVariant = (value: unknown): value is LogoVariant =>
  typeof value === "string" &&
  LOGO_VARIANTS.includes(value as LogoVariant);

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
