import { useState, useEffect } from "react";
import { Download, Menu, X, Globe, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Header({ t, lang, toggleLang }) {
  const [open, setOpen] = useState(false);
  const [pathname, setPathname] = useState("/");
  const [theme, setTheme] = useState("light");
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: notifData, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 1000 * 60, // Refetch every minute
    retry: false
  });

  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPathname(window.location.pathname);
      const savedTheme = localStorage.getItem("app-theme") || "light";
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("app-theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleNotificationClick = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      try {
        await fetch("/api/notifications", { method: "PUT" });
        refetch();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const navItems = [
    { href: "/", label: t("home") },
    { href: "/supported", label: t("supported") },
    { href: "/converter", label: t("converter") },
    { href: "/history", label: t("history") },
    { href: "/faq", label: t("faq") },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2 group">
            <img src={theme === "dark" ? "/logo-yellow.png" : "/logo-purple.png?v=2"} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
            <span className="font-semibold text-gray-900 dark:text-white text-lg tracking-tight">
              {t("brand")}
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 text-sm rounded-full transition-all duration-300 ${
                    isActive
                      ? "text-white dark:text-gray-950 font-bold bg-primary-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2 relative">
            <button
              onClick={toggleLang}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full hover:border-gray-300 dark:border-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
              aria-label="Toggle language"
            >
              <Globe size={14} />
              <span>{lang === "ar" ? "EN" : "عربي"}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
              title={lang === "ar" ? "تغيير المظهر" : "Change Theme"}
              aria-label="Toggle theme"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
            </button>
            
            <div className="relative">
              <button
                onClick={handleNotificationClick}
                className="relative inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute ltr:right-0 rtl:left-0 mt-2 w-72 md:w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
                  <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex justify-between items-center">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                      {lang === "ar" ? "الإشعارات" : "Notifications"}
                    </h3>
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <a 
                          key={n.id} 
                          href={n.link || '#'}
                          className={`block p-4 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!n.is_read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                        >
                          <div className="flex gap-3">
                            <div className="mt-1 flex-shrink-0">
                              <div className={`w-2 h-2 rounded-full ${!n.is_read ? 'bg-primary-500' : 'bg-transparent'}`}></div>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">{n.title}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">{n.message}</p>
                              <p className="text-[10px] text-gray-400">{new Date(n.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </a>
                      ))
                    ) : (
                      <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        {lang === "ar" ? "لا توجد إشعارات حالياً" : "No notifications yet"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <a
              href="/profile"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
              title={lang === "ar" ? "الملف الشخصي" : "Profile"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </a>

            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-950"
              aria-label="Menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open ? (
          <div className="md:hidden py-4 px-2 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/90 backdrop-blur-md">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-3 text-base rounded-2xl transition-all ${
                      isActive
                        ? "text-gray-950 font-bold bg-primary-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                        : "text-gray-500 dark:text-gray-300 font-medium hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
