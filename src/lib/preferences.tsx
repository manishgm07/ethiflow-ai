import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import i18n, { type Language } from "@/lib/i18n";

export type TextSize = "s" | "m" | "l" | "xl";

export interface Preferences {
  language: Language;
  highContrast: boolean;
  textSize: TextSize;
  reducedMotion: boolean;
  sidebarCollapsed: boolean;
}

export const PREFS_KEY = "ethiflow.prefs";

export const DEFAULT_PREFS: Preferences = {
  language: "en",
  highContrast: false,
  textSize: "m",
  reducedMotion: false,
  sidebarCollapsed: false,
};

export function parsePrefs(raw: string | null): Preferences {
  if (!raw) return DEFAULT_PREFS;
  try {
    const p = JSON.parse(raw) as Partial<Preferences>;
    return {
      language: p.language === "kn" ? "kn" : "en",
      highContrast: p.highContrast === true,
      textSize: p.textSize && ["s", "m", "l", "xl"].includes(p.textSize) ? p.textSize : "m",
      reducedMotion: p.reducedMotion === true,
      sidebarCollapsed: p.sidebarCollapsed === true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

/** Inline script applied before first paint so high contrast / text size never flash. */
export const PREFS_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem('${PREFS_KEY}')||'{}');var d=document.documentElement;if(p.highContrast)d.classList.add('hc');if(p.reducedMotion)d.classList.add('reduce-motion');d.setAttribute('data-text-size',['s','m','l','xl'].indexOf(p.textSize)>-1?p.textSize:'m');if(p.language==='kn')d.lang='kn';}catch(e){}})();`;

function applyToDocument(p: Preferences) {
  const d = document.documentElement;
  d.classList.toggle("hc", p.highContrast);
  d.classList.toggle("reduce-motion", p.reducedMotion);
  d.setAttribute("data-text-size", p.textSize);
  d.lang = p.language;
}

interface PreferencesContextValue extends Preferences {
  update: (patch: Partial<Preferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);

  useEffect(() => {
    const stored = parsePrefs(window.localStorage.getItem(PREFS_KEY));
    setPrefs(stored);
    applyToDocument(stored);
    if (i18n.language !== stored.language) void i18n.changeLanguage(stored.language);
  }, []);

  const update = useCallback((patch: Partial<Preferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      applyToDocument(next);
      if (patch.language && i18n.language !== patch.language) void i18n.changeLanguage(patch.language);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ ...prefs, update }), [prefs, update]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within PreferencesProvider");
  return ctx;
}
