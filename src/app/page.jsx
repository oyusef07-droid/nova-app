import { useState, useCallback, useEffect } from "react";
import {
  Shield,
  Zap,
  Award,
  Music,
  Globe2,
  Sparkles,
  Info,
  Lock,
  Eye,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { API_BASE_URL } from "../config";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LinkInput from "../components/LinkInput";
import ResultCard from "../components/ResultCard";
import PlatformIcon from "../components/PlatformIcon";
import { useLang } from "../utils/useLang";
import { useHistory } from "../utils/useHistory";
import { EXAMPLE_LINKS } from "../data/platforms";

const FEATURE_ICONS = [Award, Shield, Globe2, Lock, Music, Zap];

export default function HomePage() {
  const { t, lang, toggleLang, isRTL } = useLang();
  const { addItem } = useHistory();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Track visit once per session
    if (!sessionStorage.getItem('nova_visit_tracked')) {
      fetch(`${API_BASE_URL}/api/track-visit`, { method: 'POST' }).catch(console.error);
      sessionStorage.setItem('nova_visit_tracked', 'true');
    }
    // Heartbeat every 3 minutes so "active users" stays accurate
    const heartbeat = setInterval(() => {
      fetch(`${API_BASE_URL}/api/track-visit`, { method: 'POST' }).catch(console.error);
    }, 3 * 60 * 1000);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(heartbeat);
    };
  }, []);

  const handleAnalyze = useCallback(
    async (url, platform) => {
      if (!isOnline) {
        setError(lang === 'ar' ? 'يرجى الاتصال بالإنترنت أولاً' : 'Please connect to the internet first');
        return;
      }
      setIsLoading(true);
      setError(null);
      setResult(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || t("networkError"));
        }
        const resultObj = { ...data, sourceUrl: data.sourceUrl || url };
        setResult(resultObj);
        setIsPreviewMode(data.notice === "preview_mode");

        // Save to history upon successful search
        const bestThumbnail = data.thumbnail || (data.formats && data.formats.find(f => f.type === "image")?.url);
        addItem({
          title: data.title,
          thumbnail: bestThumbnail,
          platform: data.platform,
          sourceUrl: resultObj.sourceUrl,
        });
      } catch (err) {
        console.error(err);
        setError(err.message || t("networkError"));
      } finally {
        setIsLoading(false);
      }
    },
    [t, addItem, isOnline, lang],
  );

  const handleDownload = useCallback(
    async (resultObj, format) => {
      if (!isOnline) return;
      if (format.url === "#preview") {
        setError(t("apiKeyMissing"));
        return;
      }
      try {
        // Build filename
        const safeName =
          (resultObj.title || "nova-download")
            .replace(/[^\w\u0600-\u06FF.\- ]/g, "")
            .slice(0, 60)
            .trim() || "nova-download";

        const ext = format.type === "audio" ? "mp3" : (format.type === "video" ? "mp4" : "jpg");
        const finalName = safeName.toLowerCase().endsWith(`.${ext}`) ? safeName : `${safeName}.${ext}`;

        if (format.type === "link") {
          window.open(format.url, '_blank');
          return;
        }

        // Route via our /api/download proxy so it forces "Save As" + handles CORS
        const proxyUrl =
          `${API_BASE_URL}/api/download?url=` +
          encodeURIComponent(format.url) +
          "&filename=" +
          encodeURIComponent(finalName);

        // Trigger the download
        const a = document.createElement("a");
        a.href = proxyUrl;
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        console.error(err);
        setError(t("networkError"));
      }
    },
    [t, isOnline],
  );

  const handleExample = useCallback(
    (example) => {
      handleAnalyze(example.url, { id: example.platform });
    },
    [handleAnalyze],
  );

  const featureTitles = [
    "feat1Title",
    "feat2Title",
    "feat3Title",
    "feat4Title",
    "feat5Title",
    "feat6Title",
  ];
  const featureDescs = [
    "feat1Desc",
    "feat2Desc",
    "feat3Desc",
    "feat4Desc",
    "feat5Desc",
    "feat6Desc",
  ];

  return (
    <>
      <Header t={t} lang={lang} toggleLang={toggleLang} />

      {!isOnline && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 w-[90%] max-w-sm">
          <div className="bg-red-500/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-[0_8px_30px_rgb(239,68,68,0.3)] flex items-center justify-between border border-red-400/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-base mb-0.5">{lang === 'ar' ? 'أنت غير متصل بالإنترنت!' : 'You are offline!'}</h4>
                <p className="text-sm text-red-50 opacity-90">{lang === 'ar' ? 'يرجى الاتصال لاستخدام التطبيق' : 'Please connect to use the app'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="relative bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 md:pt-24 md:pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-full mb-6">
              <Sparkles size={12} />
              <span>{t("heroBadge")}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-gray-900 dark:text-white tracking-tight leading-tight mb-4">
              {t("heroTitle")}
            </h1>

            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              {t("heroSubtitle")}
            </p>

            {/* Trust pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span>{t("pillNoWatermark")}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full">
                <Zap size={12} className="text-orange-500" />
                <span>{t("pillFast")}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full">
                <Award size={12} className="text-primary-600" />
                <span>{t("pillFree")}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full">
                <Shield size={12} className="text-gray-700 dark:text-gray-200" />
                <span>{t("pillSecure")}</span>
              </div>
            </div>

            {/* Input */}
            <div className="max-w-2xl mx-auto">
              <LinkInput
                t={t}
                onSubmit={handleAnalyze}
                isLoading={isLoading}
                isRTL={isRTL}
                disabled={!isOnline}
              />

              {/* Examples */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{t("tryExample")}</span>
                {EXAMPLE_LINKS.map((ex) => (
                  <button
                    key={ex.url}
                    onClick={() => handleExample(ex)}
                    disabled={isLoading || !isOnline}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full hover:border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-950 transition-colors disabled:opacity-50"
                  >
                    <PlatformIcon id={ex.platform} size={11} />
                    <span>{ex.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Supported platform icons strip */}
            <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-800">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                {t("supported")}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 opacity-80">
                {[
                  "youtube",
                  "tiktok",
                  "instagram",
                  "facebook",
                  "twitter",
                  "pinterest",
                  "reddit",
                  "vimeo",
                  "twitch",
                  "soundcloud",
                  "telegram",
                  "linkedin",
                ].map((id) => (
                  <div
                    key={id}
                    className="grayscale hover:grayscale-0 transition-all"
                    title={id}
                  >
                    <PlatformIcon id={id} size={22} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESULT */}
      {(result || error) && (
        <section className="bg-gray-50 dark:bg-gray-950 border-y border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {error ? (
              <div className="bg-white dark:bg-gray-900 border border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={16} className="text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      {lang === "ar" ? "حدث خطأ" : "Something went wrong"}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{error}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {result ? (
              <>
                {isPreviewMode ? (
                  <div className="mb-4 bg-white dark:bg-gray-900 border border-primary-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <Info size={16} className="text-primary-600" />
                      </div>
                      <div className="flex-1 text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {lang === "ar" ? "وضع المعاينة" : "Preview mode"}
                        </span>{" "}
                        — {t("apiKeyMissing")}
                      </div>
                    </div>
                  </div>
                ) : null}
                <ResultCard t={t} result={result} onDownload={handleDownload} />
              </>
            ) : null}
          </div>
        </section>
      )}

      {/* STATS */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "1M+", label: t("statsUsers") },
              { value: "50M+", label: t("statsDownloads") },
              { value: "1000+", label: t("statsPlatforms") },
              { value: "99.9%", label: t("statsUptime") },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 text-center"
              >
                <div className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight mb-1">
                  {stat.value}
                </div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight mb-2">
              {t("featuresTitle")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t("featuresSubtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featureTitles.map((titleKey, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <div
                  key={titleKey}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:border-gray-300 dark:border-gray-700 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-primary-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    {t(titleKey)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {t(featureDescs[i])}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* LIMITATIONS — honesty section */}
      <section className="bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="max-w-2xl mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-full mb-4">
              <Info size={12} />
              <span>{t("limitTitle")}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight mb-2">
              {t("limitSubtitle")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                  <Lock size={14} className="text-gray-700 dark:text-gray-200" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  <span className="font-medium">{t("notSupported")}</span>
                </div>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                {t("whatsappLimitTitle")}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {t("whatsappLimit")}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                  <Eye size={14} className="text-gray-700 dark:text-gray-200" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  <span className="font-medium">{t("partialSupport")}</span>
                </div>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                {t("storiesLimitTitle")}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {t("storiesLimit")}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                  <Clock size={14} className="text-gray-700 dark:text-gray-200" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  <span className="font-medium">{t("partialSupport")}</span>
                </div>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                {t("telegramLimitTitle")}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {t("telegramLimit")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer t={t} />
    </>
  );
}
