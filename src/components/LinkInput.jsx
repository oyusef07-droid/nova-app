import { useState, useCallback } from "react";
import { Link2, Clipboard, X, ArrowRight, Loader2 } from "lucide-react";
import PlatformIcon from "./PlatformIcon";
import { detectPlatform } from "../utils/i18n";

export default function LinkInput({ t, onSubmit, isLoading, isRTL }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState(null);

  const platform = detectPlatform(url);

  const handlePaste = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) setUrl(text.trim());
      }
    } catch (err) {
      console.error("Clipboard read failed", err);
    }
  }, []);

  const handleClear = useCallback(() => {
    setUrl("");
    setError(null);
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e?.preventDefault?.();
      if (!url.trim()) return;
      if (!platform) {
        setError(t("invalidUrl"));
        return;
      }
      setError(null);
      onSubmit(url.trim(), platform);
    },
    [url, platform, onSubmit, t],
  );

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 transition-colors ${
          error ? "border-red-300" : ""
        } focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-600/10`}
      >
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="flex-shrink-0">
            {platform && platform.id !== "generic" ? (
              <PlatformIcon id={platform.id} size={22} />
            ) : (
              <Link2 size={20} className="text-gray-400 dark:text-gray-500" />
            )}
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder={t("pasteLink")}
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none min-w-0"
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
          />

          <div className="flex items-center gap-1 flex-shrink-0">
            {url ? (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-950 transition-colors"
                aria-label="Clear"
              >
                <X size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePaste}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md hover:border-gray-300 dark:border-gray-700 transition-colors"
              >
                <Clipboard size={12} />
                <span>{t("paste")}</span>
              </button>
            )}
          </div>
        </div>

        <div className="px-4 pb-3 pt-1">
          <button
            type="submit"
            disabled={!url.trim() || isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{t("analyzing")}</span>
              </>
            ) : (
              <>
                <span>{t("analyze")}</span>
                <ArrowRight size={16} className={isRTL ? "rotate-180" : ""} />
              </>
            )}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-2 flex items-center gap-1.5 px-3 py-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
          <span>{error}</span>
        </div>
      ) : null}

      {platform && platform.id !== "generic" && !error ? (
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full">
          <PlatformIcon id={platform.id} size={12} />
          <span className="font-medium">{platform.name}</span>
          <span className="text-gray-400 dark:text-gray-500">·</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          <span className="text-gray-500 dark:text-gray-400">{t("fullSupport")}</span>
        </div>
      ) : null}
    </form>
  );
}
