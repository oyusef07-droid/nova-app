import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useLang } from "../../utils/useLang";

export default function TermsOfUse() {
  const { t, isRTL, lang, toggleLang } = useLang();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans">
      <Header t={t} lang={lang} toggleLang={toggleLang} />
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 pb-4 border-b border-gray-100 dark:border-gray-800">
            {isRTL ? 'شروط الاستخدام' : 'Terms of Use'}
          </h1>
          
          <div className="space-y-8 text-gray-600 dark:text-gray-300 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {isRTL ? '1. القبول بالشروط' : '1. Acceptance of Terms'}
              </h2>
              <p>
                {isRTL 
                  ? 'باستخدامك لموقع NOVA، فإنك توافق على الالتزام بشروط الاستخدام هذه. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام الموقع.' 
                  : 'By using the NOVA website, you agree to comply with these Terms of Use. If you disagree with any part of these terms, please do not use the site.'}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {isRTL ? '2. الاستخدام الشخصي' : '2. Personal Use'}
              </h2>
              <p>
                {isRTL
                  ? 'هذا الموقع مخصص للاستخدام الشخصي وغير التجاري فقط. أداة التحميل مصممة لمساعدتك على الاحتفاظ بنسخة من الفيديوهات والصور التي تملك حقوقها أو المسموح لك بتحميلها.'
                  : 'This site is for personal and non-commercial use only. The download tool is designed to help you keep a copy of videos and images you have rights to or are permitted to download.'}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {isRTL ? '3. حقوق الملكية الفكرية' : '3. Intellectual Property'}
              </h2>
              <p>
                {isRTL
                  ? 'يجب على المستخدمين احترام حقوق الملكية الفكرية. نحن لا نتحمل مسؤولية أي سوء استخدام للمحتوى المحمل من خلال أداتنا. يتحمل المستخدم المسؤولية الكاملة عن شرعية تحميل واستخدام المحتوى.'
                  : 'Users must respect intellectual property rights. We are not responsible for any misuse of content downloaded through our tool. The user assumes full responsibility for the legality of downloading and using the content.'}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {isRTL ? '4. إخلاء المسؤولية' : '4. Disclaimer'}
              </h2>
              <p>
                {isRTL
                  ? 'نحن نقدم الخدمة "كما هي" دون أي ضمانات. لا نضمن أن الخدمة ستكون متوفرة باستمرار دون انقطاع، ونحتفظ بالحق في إيقاف أو تعديل الخدمة في أي وقت.'
                  : 'We provide the service "as is" without warranties. We do not guarantee uninterrupted availability of the service, and we reserve the right to suspend or modify the service at any time.'}
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
