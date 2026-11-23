import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { en } from "./en";
import { kn } from "./kn";
import { liveEn } from "./live.en";
import { liveKn } from "./live.kn";

export type Language = "en" | "kn";
export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "kn", label: "ಕನ್ನಡ" },
];

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: { en: { translation: { ...en, ...liveEn } }, kn: { translation: { ...kn, ...liveKn } } },
    lng: "en",
    fallbackLng: "en",
    initAsync: false,
    interpolation: { escapeValue: false },
  });
}

export default i18n;

/** Pick the active-language side of an engine-provided bilingual string. */
export function pick(b: { en: string; kn: string }, lang: string): string {
  return lang === "kn" ? b.kn : b.en;
}
