import { useState, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useLang } from "../../utils/useLang";
import { User, LogOut, Ticket, CheckCircle, Clock, Mail, Calendar, ShieldCheck, ArrowRight, Settings as SettingsIcon } from "lucide-react";

export default function Profile() {
  const { t, isRTL, lang, toggleLang } = useLang();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    if (session) {
      fetchTickets();
    }
  }, [session]);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (Object.keys(data).length > 0) {
          if (data?.user?.needsOnboarding) {
            window.location.href = '/complete-profile';
            return;
          }
          setSession(data);
        } else {
          setSession(null);
        }
      } else {
        setSession(null);
      }
    } catch (e) {
      console.error(e);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    window.location.href = "/api/auth/signout";
  };

  if (loading) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans">
        <Header t={t} lang={lang} toggleLang={toggleLang} />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </main>
      </div>
    );
  }

  if (!session) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans">
        <Header t={t} lang={lang} toggleLang={toggleLang} />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {isRTL ? 'يرجى تسجيل الدخول' : 'Please Sign In'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              {isRTL 
                ? 'لرؤية ملفك الشخصي ومتابعة تذاكر الدعم الفني الخاصة بك، يجب تسجيل الدخول أولاً.' 
                : 'To view your profile and track your support tickets, please sign in first.'}
            </p>
            <a 
              href="/login" 
              className="inline-flex items-center justify-center w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3.5 px-6 rounded-xl transition-all shadow-md shadow-primary-600/20 gap-2"
            >
              {isRTL ? 'تسجيل الدخول' : 'Login'}
              <ArrowRight className="w-5 h-5 rtl:rotate-180" />
            </a>
          </div>
        </main>
        <Footer t={t} />
      </div>
    );
  }

  const openTicketsCount = tickets.filter(t => t.status === 'open').length;
  const answeredTicketsCount = tickets.filter(t => t.status === 'answered').length;
  const closedTicketsCount = tickets.filter(t => t.status === 'closed').length;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Header t={t} lang={lang} toggleLang={toggleLang} />
      
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Profile Header Card */}
        <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-8">
          {/* Decorative background */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary-600 to-indigo-700 opacity-90"></div>
          
          <div className="relative px-8 pt-16 pb-8 sm:px-12 sm:pt-20 sm:pb-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white dark:bg-gray-900">
                {session?.user?.image ? (
                  <img src={session.user.image} alt={session.user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary-100 flex items-center justify-center">
                    <User className="w-12 h-12 text-primary-600" />
                  </div>
                )}
              </div>
              <div className="absolute bottom-1 rtl:left-1 ltr:right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full" title="Online"></div>
            </div>
            
            {/* User Info */}
            <div className="flex-1 text-center sm:text-start pb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 flex items-center justify-center sm:justify-start gap-2">
                {session?.user?.name || 'User'}
                <ShieldCheck className="w-6 h-6 text-primary-500" />
              </h1>
              <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center sm:justify-start gap-2 font-medium">
                <Mail className="w-4 h-4" />
                {session?.user?.email}
              </p>
            </div>
            
            {/* Actions */}
            <div className="pb-2 flex items-center gap-3">
              <a 
                href="/profile/settings"
                className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2.5 rounded-xl font-medium transition-colors"
              >
                <SettingsIcon className="w-4 h-4" />
                {isRTL ? 'الإعدادات' : 'Settings'}
              </a>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-6 py-2.5 rounded-xl font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {isRTL ? 'تسجيل الخروج' : 'Logout'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats & Activity Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stat Card 1 */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Ticket className="w-7 h-7 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{isRTL ? 'إجمالي التذاكر' : 'Total Tickets'}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{tickets.length}</h3>
            </div>
          </div>

          {/* Stat Card 2 */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{isRTL ? 'تذاكر تم الرد عليها' : 'Answered Tickets'}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{answeredTicketsCount + closedTicketsCount}</h3>
            </div>
          </div>

          {/* Stat Card 3 */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-7 h-7 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{isRTL ? 'قيد الانتظار' : 'Pending Tickets'}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{openTicketsCount}</h3>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-8 text-center sm:text-start flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {isRTL ? 'محتاج مساعدة؟' : 'Need Help?'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              {isRTL 
                ? 'فريق الدعم الفني لدينا جاهز للرد على استفساراتك وحل مشاكلك في أسرع وقت ممكن.' 
                : 'Our support team is ready to answer your inquiries and solve your issues as soon as possible.'}
            </p>
          </div>
          <a 
            href="/contact"
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3.5 rounded-xl font-medium transition-all shadow-md shadow-primary-600/20 whitespace-nowrap"
          >
            <Ticket className="w-5 h-5" />
            {isRTL ? 'الذهاب لمركز الدعم' : 'Go to Support Center'}
          </a>
        </div>
        
      </main>

      <Footer t={t} />
    </div>
  );
}
