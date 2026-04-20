"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { BIRTHDAY_CONFIG, isBirthdayToday } from "@/config/app-config";

interface BirthdayContextValue {
  isBirthdayMode: boolean;
  isBirthdayDay: boolean;
}

const BirthdayContext = createContext<BirthdayContextValue>({
  isBirthdayMode: false,
  isBirthdayDay: false,
});

export function useBirthday() {
  return useContext(BirthdayContext);
}

export function BirthdayProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  const isMode = BIRTHDAY_CONFIG.enabled;
  const isDay = isBirthdayToday();

  useEffect(() => {
    setMounted(true);
    if (isMode) {
      document.documentElement.classList.add("birthday-mode");
    } else {
      document.documentElement.classList.remove("birthday-mode");
    }
    return () => {
      document.documentElement.classList.remove("birthday-mode");
    };
  }, [isMode]);

  // Avoid SSR/client mismatch — render children immediately but context
  // values start false until mounted (avoids hydration flicker on effects)
  return (
    <BirthdayContext.Provider
      value={{
        isBirthdayMode: mounted ? isMode : false,
        isBirthdayDay: mounted ? isDay : false,
      }}
    >
      {children}
    </BirthdayContext.Provider>
  );
}
