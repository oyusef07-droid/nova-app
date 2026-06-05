import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useLang } from "../../utils/useLang";

export default function PrivacyPolicy() {
  const { t, isRTL, lang, toggleLang } = useLang();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans">
      <Header t={t} lang={lang} toggleLang={toggleLang} />
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 pb-4 border-b border-gray-100 dark:border-gray-800">
            {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </h1>
          
          <div className="space-y-8 text-gray-600 dark:text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {isRTL ? '1. جمع المعلومات' : '1. Information Collection'}
              </h2>
              <p>
                {isRTL 
                  ? 'نحن لا نطلب منك التسجيل الإجباري لاستخدام الموقع. نحن نجمع فقط البيانات الأساسية الضرورية لتشغيل الموقع وتحسين تجربة المستخدم مثل عنوان IP ونوع المتصفح لغرض الإحصائيات.' 
                  : 'We do not require mandatory registration to use the site. We only collect essential data necessary to operate the site and improve user experience, such as IP address and browser type for statistical purposes.'}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {isRTL ? '2. الروابط والملفات' : '2. Links and Files'}
              </h2>
              <p>
                {isRTL
                  ? 'نحن لا نقوم بتخزين أي روابط أو ملفات تقوم بتحميلها على خوادمنا. تتم معالجة جميع الطلبات في الوقت الفعلي (Real-time) وتقديمها لك مباشرة دون الاحتفاظ بنسخ احتياطية منها.'
                  : 'We do not store any links or files you download on our servers. All requests are processed in real-time and served to you directly without keeping backup copies.'}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {isRTL ? '3. ملفات تعريف الارتباط (Cookies)' : '3. Cookies'}
              </h2>
              <p>
                {isRTL
                  ? 'يستخدم الموقع ملفات تعريف الارتباط الأساسية فقط لضمان عمل الموقع بشكل سليم، مثل حفظ تفضيلات اللغة وإبقاء الجلسة نشطة للمستخدمين المسجلين.'
                  : 'The site uses essential cookies only to ensure proper functionality, such as saving language preferences and keeping sessions active for registered users.'}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {isRTL ? '4. مشاركة البيانات' : '4. Data Sharing'}
              </h2>
              <p>
                {isRTL
                  ? 'نحن نلتزم بعدم بيع أو تأجير أو مشاركة أي بيانات شخصية مع أطراف ثالثة لأغراض تسويقية.'
                  : 'We commit not to sell, rent, or share any personal data with third parties for marketing purposes.'}
              </p>
            </section>
            
            <p className="pt-8 text-sm text-gray-400 dark:text-gray-500">
              {isRTL ? 'آخر تحديث: يونيو 2026' : 'Last updated: June 2026'}
            </p>
          </div>
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
}
