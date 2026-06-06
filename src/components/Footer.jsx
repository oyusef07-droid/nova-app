import { Download, Github, Twitter, Mail } from "lucide-react";

export default function Footer({ t }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <a href="/" className="flex items-center gap-2 group">
                <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-yellow-500 hover:from-primary-500 hover:to-yellow-400 transition-all duration-300">
                  {t("brand")}
                </span>
              </a>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed">
              {t("footerLegal")}
            </p>
            <div className="flex items-center gap-2 mt-4">
              <a
                href="#"
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:border-gray-700 hover:text-gray-900 dark:hover:text-white dark:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github size={16} />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:border-gray-700 hover:text-gray-900 dark:hover:text-white dark:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={16} />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:border-gray-700 hover:text-gray-900 dark:hover:text-white dark:text-white transition-colors"
                aria-label="Email"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {t("footerLinks")}
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white dark:text-white transition-colors"
                >
                  {t("home")}
                </a>
              </li>
              <li>
                <a
                  href="/supported"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white dark:text-white transition-colors"
                >
                  {t("supported")}
                </a>
              </li>
              <li>
                <a
                  href="/history"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white dark:text-white transition-colors"
                >
                  {t("history")}
                </a>
              </li>
              <li>
                <a
                  href="/faq"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white dark:text-white transition-colors"
                >
                  {t("faq")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              {t("footerLegalCol")}
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/privacy"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white dark:text-white transition-colors"
                >
                  {t("privacy")}
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white dark:text-white transition-colors"
                >
                  {t("terms")}
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white dark:text-white transition-colors"
                >
                  {t("contact")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © {year} {t("brand")}. {t("footerRights")}.
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
