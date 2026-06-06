import { useState, useEffect, useCallback } from "react";
import { translations } from "./i18n";

const STORAGE_KEY = "mediafetch_lang";

export function useLang() {
  const [lang, setLangState] = useState("ar");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "ar" || stored === "en") {
        setLangState(stored);
      } else {
        // Try to detect from browser
        const browserLang =
          typeof navigator !== "undefined" && navigator.language
            ? navigator.language.toLowerCase()
            : "ar";
        setLangState(browserLang.startsWith("ar") ? "ar" : "en");
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    }
  }, [lang]);

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "ar" ? "en" : "ar");
  }, [lang, setLang]);

  const t = useCallback(
    (key) => {
      return translations[lang]?.[key] || translations.en[key] || key;
    },
    [lang],
  );

  return { lang, setLang, toggleLang, t, isRTL: lang === "ar" };
}
