import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PlatformIcon from "../../components/PlatformIcon";
import { useLang } from "../../utils/useLang";
import { PLATFORMS } from "../../data/platforms";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";

const STATUS_META = {
  full: { color: "bg-green-500", labelKey: "fullSupport" },
  partial: { color: "bg-orange-500", labelKey: "partialSupport" },
  none: { color: "bg-red-500", labelKey: "notSupported" },
};

export default function SupportedPage() {
  const { t, lang, toggleLang } = useLang();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    return PLATFORMS.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.domain.toLowerCase().includes(q) ||
        p.types.join(" ").toLowerCase().includes(q)
      );
    });
  }, [query, filter]);

  const tabs = [
    {
      id: "all",
      label: lang === "ar" ? "الكل" : "All",
      count: PLATFORMS.length,
    },
    {
      id: "full",
      label: t("fullSupport"),
      count: PLATFORMS.filter((p) => p.status === "full").length,
    },
    {
      id: "partial",
      label: t("partialSupport"),
      count: PLATFORMS.filter((p) => p.status === "partial").length,
    },
    {
      id: "none",
      label: t("notSupported"),
      count: PLATFORMS.filter((p) => p.status === "none").length,
    },
  ];

  return (
    <>
      <Header t={t} lang={lang} toggleLang={toggleLang} />

      <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight mb-2">
            {t("supportedTitle")}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
            {t("supportedSubtitle")}
          </p>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mb-6 focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-600/10 transition-colors">
            <div className="flex items-center gap-2 px-4 py-3">
              <Search size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  lang === "ar" ? "ابحث عن منصة..." : "Search for a platform..."
                }
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none min-w-0"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-800 mb-6">
            <div className="flex items-center gap-6 overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = filter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`inline-flex items-center gap-2 pb-3 -mb-[1px] text-sm whitespace-nowrap transition-colors border-b-2 ${
                      isActive
                        ? "text-gray-900 dark:text-white font-medium border-primary-600"
                        : "text-gray-500 dark:text-gray-400 font-normal border-transparent hover:text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 text-xs rounded-full ${
                        isActive
                          ? "bg-primary-50 text-primary-600"
                          : "bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Platforms grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const meta = STATUS_META[p.status];
              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:border-gray-300 dark:border-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                      <PlatformIcon id={p.id} size={22} />
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${meta.color}`}
                      ></span>
                      <span className="font-medium">{t(meta.labelKey)}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-0.5">
                    {p.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{p.domain}</p>

                  <div className="space-y-1">
                    {p.types.map((type) => (
                      <div key={type} className="text-sm text-gray-600 dark:text-gray-300 py-0.5">
                        <span className="text-gray-400 dark:text-gray-500 me-2">-</span>
                        <span>{type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-10 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {lang === "ar" ? "لا توجد نتائج" : "No results"}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <Footer t={t} />
    </>
  );
}
