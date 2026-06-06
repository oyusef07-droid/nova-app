import { useState, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import PlatformIcon from "../../components/PlatformIcon";
import { useLang } from "../../utils/useLang";
import { useHistory } from "../../utils/useHistory";
import {
  Trash2,
  ExternalLink,
  Download,
  Music,
  Video,
  Image as ImageIcon,
  Inbox,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";

function timeAgo(iso, lang) {
  const date = new Date(iso);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const isAr = lang === "ar";
  if (seconds < 60) return isAr ? "الآن" : "Just now";
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    return isAr ? `منذ ${m} دقيقة` : `${m}m ago`;
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    return isAr ? `منذ ${h} ساعة` : `${h}h ago`;
  }
  const d = Math.floor(seconds / 86400);
  return isAr ? `منذ ${d} يوم` : `${d}d ago`;
}

function FormatIcon({ type }) {
  if (type === "audio") return <Music size={12} />;
  if (type === "image") return <ImageIcon size={12} />;
  return <Video size={12} />;
}

export default function HistoryPage() {
  const { t, lang, toggleLang } = useLang();
  const { history, removeItem, clearAll } = useHistory();
  const [confirmClear, setConfirmClear] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [cardData, setCardData] = useState({});
  const [downloadingKey, setDownloadingKey] = useState(null);
  const [imgErrors, setImgErrors] = useState({});
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleImgError = (id) => setImgErrors(prev => ({ ...prev, [id]: true }));

  const fetchFormats = async (item) => {
    if (!item.sourceUrl) return;
    setAnalyzingId(item.id);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.sourceUrl })
      });
      if (!res.ok) throw new Error("Failed to fetch formats");
      const data = await res.json();
      setCardData(prev => ({ ...prev, [item.id]: data }));
    } catch (err) {
      console.error(err);
      alert(t("networkError") || "Error analyzing link");
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDownload = async (format, item) => {
    if (!isOnline) return;
    setDownloadingKey(format.url);
    try {
      const ext = format.extension || (format.type === "audio" ? "mp3" : "mp4");
      const cleanTitle = (item.title || "download").replace(/[^\w\u0600-\u06FF\s-]/g, "").trim() || "download";
      
      const link = document.createElement("a");
      link.href = `/api/download?url=${encodeURIComponent(format.url)}&filename=${encodeURIComponent(cleanTitle + "." + ext)}`;
      link.target = "_blank";
      link.download = "";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => setDownloadingKey(null), 800);
    }
  };

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
                <p className="text-sm text-red-50 opacity-90">{lang === 'ar' ? 'يرجى الاتصال للتحميل' : 'Please connect to download'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white tracking-tight mb-2">
                {t("historyTitle")}
              </h1>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full">
                <span>
                  {history.length} {t("historyCount")}
                </span>
              </div>
            </div>
            {history.length > 0 ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
              >
                <Trash2 size={14} />
                <span>{t("clearHistory")}</span>
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {history.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 flex items-center justify-center mx-auto mb-4">
                <Inbox size={24} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                {t("historyEmpty")}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                {t("historyEmptyDesc")}
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Download size={14} />
                <span>{t("home")}</span>
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-gray-300 dark:border-gray-700 transition-colors"
                >
                  <div className="relative bg-gray-50 dark:bg-gray-950 aspect-video">
                    {item.thumbnail && !imgErrors[item.id] ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title || "preview"}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={() => handleImgError(item.id)}
                      />
                    ) : item.formatType === "video" && item.downloadUrl && !imgErrors[item.id] ? (
                      <video
                        src={item.downloadUrl}
                        className="w-full h-full object-cover"
                        preload="metadata"
                        muted
                        playsInline
                        onError={() => handleImgError(item.id)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlatformIcon id={item.platform?.id} size={36} />
                      </div>
                    )}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute top-2 end-2 w-7 h-7 rounded-full bg-white dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:text-red-600 hover:border-red-200 transition-colors"
                      aria-label="Remove"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full">
                        <PlatformIcon id={item.platform?.id} size={10} />
                        <span className="font-medium">
                          {item.platform?.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {timeAgo(item.createdAt, lang)}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 mb-3 min-h-[2.5rem]">
                      {item.title || "Untitled"}
                    </h3>

                    <div className="flex flex-col gap-2 mt-2">
                      {!cardData[item.id] ? (
                        <button 
                          onClick={() => fetchFormats(item)}
                          disabled={analyzingId === item.id}
                          className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-70 transition-colors"
                        >
                          {analyzingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                          <span>{lang === "ar" ? "عرض روابط التحميل" : "View Download Links"}</span>
                        </button>
                      ) : (
                        <div className="bg-gray-50 dark:bg-gray-950 p-2 rounded-lg border border-gray-100 dark:border-gray-800 max-h-[160px] overflow-y-auto custom-scrollbar space-y-1.5 mt-1">
                          {cardData[item.id].formats?.map((format, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleDownload(format, item)}
                              disabled={downloadingKey === format.url}
                              className={`w-full flex items-center justify-between p-2 text-xs rounded-md transition-colors ${
                                idx === 0 
                                  ? "bg-primary-600 text-white hover:bg-primary-700" 
                                  : "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
                              }`}
                            >
                              <span className="flex items-center gap-1.5 font-medium">
                                <FormatIcon type={format.type} />
                                {format.label}
                              </span>
                              <div className="flex items-center gap-2">
                                {format.size && (
                                  <span className="opacity-70">{format.size}</span>
                                )}
                                {downloadingKey === format.url ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Download size={12} />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {item.sourceUrl && (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <ExternalLink size={16} />
                          <span>{t("viewSource")}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Confirm clear modal */}
      {confirmClear ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl max-w-sm w-full p-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              {t("clearHistory")}?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
              {lang === "ar"
                ? "هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء."
                : "Are you sure? This action cannot be undone."}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmClear(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-950 transition-colors"
              >
                {lang === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={() => {
                  clearAll();
                  setConfirmClear(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                {lang === "ar" ? "مسح الكل" : "Clear all"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Footer t={t} />
    </>
  );
}
