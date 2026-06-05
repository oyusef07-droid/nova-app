import { useState, useEffect } from "react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { useLang } from "../../../utils/useLang";
import { User, Lock, Save, ArrowLeft, ShieldCheck, Calendar, Globe, AlertCircle, CheckCircle } from "lucide-react";

const countriesList = [
  "Egypt", "Saudi Arabia", "United Arab Emirates", "Kuwait", "Qatar", "Bahrain", "Oman",
  "Jordan", "Lebanon", "Syria", "Iraq", "Palestine", "Yemen", "Algeria", "Morocco",
  "Tunisia", "Libya", "Sudan", "United States", "United Kingdom", "Canada", "Australia",
  "Germany", "France", "Spain", "Italy", "Turkey", "India", "Pakistan", "Indonesia", "Malaysia"
];

export default function Settings() {
  const { t, isRTL, lang, toggleLang } = useLang();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    gender: "",
    country: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (Object.keys(data).length > 0) {
          setSession(data);
          const user = data.user || {};
          setFormData(prev => ({
            ...prev,
            name: user.name || "",
          }));

          const dbRes = await fetch("/api/user/profile");
          if (dbRes.ok) {
            const dbUser = await dbRes.json();
            setFormData(prev => ({
              ...prev,
              name: dbUser.name || user.name || "",
              dob: dbUser.dob ? new Date(dbUser.dob).toISOString().split('T')[0] : "",
              gender: dbUser.gender || "",
              country: dbUser.country || ""
            }));
          }
        } else {
          window.location.href = '/login';
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        setError(isRTL ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters");
        return;
      }
      if (/[\u0600-\u06FF]/.test(formData.newPassword)) {
        setError(isRTL ? "يجب أن تكون كلمة المرور باللغة الإنجليزية ولا تحتوي على أحرف عربية" : "Password must be in English and cannot contain Arabic characters");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError(isRTL ? "كلمتا المرور غير متطابقتين" : "Passwords do not match");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          dob: formData.dob,
          gender: formData.gender,
          country: formData.country,
          newPassword: formData.newPassword || undefined
        })
      });

      if (res.ok) {
        setSuccess(isRTL ? "تم تحديث البيانات بنجاح!" : "Profile updated successfully!");
        setFormData(prev => ({ ...prev, newPassword: "", confirmPassword: "" }));
      } else {
        const data = await res.json();
        setError(data.error || (isRTL ? "حدث خطأ أثناء التحديث" : "An error occurred during update"));
      }
    } catch (err) {
      setError(isRTL ? "حدث خطأ في الاتصال" : "Connection error");
    } finally {
      setSaving(false);
    }
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

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 flex flex-col font-sans">
      <Header t={t} lang={lang} toggleLang={toggleLang} />
      
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              {isRTL ? 'إعدادات الحساب' : 'Account Settings'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {isRTL ? 'قم بتعديل بياناتك الشخصية وتغيير كلمة المرور' : 'Update your personal details and change your password'}
            </p>
          </div>
          <a href="/profile" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {isRTL ? 'رجوع للملف الشخصي' : 'Back to Profile'}
          </a>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8">
            
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Personal Info Section */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-500" />
                {isRTL ? 'البيانات الشخصية' : 'Personal Information'}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {isRTL ? 'الاسم بالكامل' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {isRTL ? 'تاريخ الميلاد' : 'Date of Birth'}
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {isRTL ? 'الجنس' : 'Gender'}
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                  >
                    <option value="">{isRTL ? 'اختر' : 'Select'}</option>
                    <option value="Male">{isRTL ? 'ذكر' : 'Male'}</option>
                    <option value="Female">{isRTL ? 'أنثى' : 'Female'}</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-gray-400" />
                    {isRTL ? 'البلد' : 'Country'}
                  </label>
                  <input
                    list="countries"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                    placeholder={isRTL ? 'ابحث عن دولتك...' : 'Search for your country...'}
                  />
                  <datalist id="countries">
                    {countriesList.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-4 mb-6 mt-8 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary-500" />
                {isRTL ? 'الأمان وكلمة المرور' : 'Security & Password'}
              </h3>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-sm mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                <p>
                  {isRTL 
                    ? 'إذا قمت بتسجيل الدخول عبر جوجل، يمكنك تعيين كلمة مرور هنا لتتمكن من الدخول بها لاحقاً بجانب الدخول بحساب جوجل. اترك الحقول فارغة إذا لم ترغب في التغيير.' 
                    : 'If you signed in with Google, you can set a password here to login via email later. Leave fields empty if you don\'t want to change it.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-gray-400" />
                    {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-md transition-all font-medium disabled:opacity-70"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {isRTL ? 'حفظ التعديلات' : 'Save Changes'}
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </main>
      
      <Footer t={t} />
    </div>
  );
}
