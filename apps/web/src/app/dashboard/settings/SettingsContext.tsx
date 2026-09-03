"use client";

import React, { createContext, useContext } from "react";
import { useSettings } from "./useSettings";

const SettingsContext = createContext<ReturnType<typeof useSettings> | null>(null);

export function useSettingsContext() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("Missing SettingsProvider");
  return ctx;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const state = useSettings();
  return <SettingsContext.Provider value={state}>{children}</SettingsContext.Provider>;
}
