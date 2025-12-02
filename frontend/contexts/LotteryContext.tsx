"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  getLotteryTheme,
  LotteryTheme,
  getLotteryConfig,
} from "@/lib/lottery-config";

interface LotteryContextType {
  lotteryType: string;
  theme: LotteryTheme;
  config: ReturnType<typeof getLotteryConfig>;
  setLotteryType: (type: string) => void;
}

const LotteryContext = createContext<LotteryContextType | undefined>(undefined);

export function LotteryProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [lotteryType, setLotteryTypeState] = useState(() => {
    return searchParams.get("lotteryType") || "megasena";
  });

  const theme = getLotteryTheme(lotteryType);
  const config = getLotteryConfig(lotteryType);

  useEffect(() => {
    const param = searchParams.get("lotteryType");
    if (param && param !== lotteryType) {
      setLotteryTypeState(param);
    }
  }, [searchParams]);

  const setLotteryType = (type: string) => {
    setLotteryTypeState(type);
    const params = new URLSearchParams(searchParams.toString());
    params.set("lotteryType", type);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <LotteryContext.Provider
      value={{ lotteryType, theme, config, setLotteryType }}
    >
      {children}
    </LotteryContext.Provider>
  );
}

export function useLottery() {
  const context = useContext(LotteryContext);
  if (context === undefined) {
    throw new Error("useLottery must be used within a LotteryProvider");
  }
  return context;
}
