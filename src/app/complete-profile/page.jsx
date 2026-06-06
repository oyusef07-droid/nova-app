import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useLang } from '../../utils/useLang';
import { Calendar, Globe, AlertCircle, ArrowRight, User } from 'lucide-react';

export default function CompleteProfile() {
  const { t, isRTL, lang, toggleLang } = useLang();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    country: '',
    gender: 'Male',
    agreeToTerms: false,
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (Object.keys(data).length > 0) {
          setSession(data);
          setFormData(prev => ({
            ...prev,
            name: data.user?.name || ''
          }));
          if (!data.user?.needsOnboarding) {
            window.location.href = '/profile';
          }
        } else {
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    } catch (e) {
      console.error(e);
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (formData.password.length < 6) {
      setError(isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      setSubmitting(false);
      return;
    }

    if (/[\u0600-\u06FF]/.test(formData.password)) {
      setError(isRTL ? 'يجب أن تكون كلمة المرور باللغة الإنجليزية ولا تحتوي على أحرف عربية' : 'Password must be in English and cannot contain Arabic characters');
      setSubmitting(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(isRTL ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      setSubmitting(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError(isRTL ? 'يجب الموافقة على شروط الاستخدام' : 'You must agree to the terms of use');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        // Force session refresh by calling the session endpoint again or reloading
        window.location.href = '/profile';
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || (isRTL ? 'حدث خطأ أثناء حفظ البيانات' : 'Error saving data'));
      }
    } catch (err) {
      console.error(err);
      setError(isRTL ? 'حدث خطأ في الاتصال' : 'Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 flex flex-col font-sans">
        <Header t={t} lang={lang} toggleLang={toggleLang} />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </main>
        <Footer t={t} />
      </div>
    );
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 flex flex-col font-sans">
      <Header t={t} lang={lang} toggleLang={toggleLang} />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl w-full bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden relative">
          
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 via-primary-600 to-indigo-600"></div>

          <div className="p-8 sm:p-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 transform -rotate-3">
                <User className="w-8 h-8 text-primary-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isRTL ? 'استكمال البيانات' : 'Complete Profile'}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {isRTL ? 'يرجى إكمال هذه البيانات الإضافية لإنهاء إعداد حسابك' : 'Please complete these additional details to finish setting up your account'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {isRTL ? 'الاسم بالكامل' : 'Full Name'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 rtl:right-0 ltr:left-0 pl-3 rtl:pr-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full rtl:pr-10 ltr:pl-10 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {isRTL ? 'النوع' : 'Gender'}
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-white transition-colors appearance-none"
                  >
                    <option value="Male">{isRTL ? 'ذكر' : 'Male'}</option>
                    <option value="Female">{isRTL ? 'أنثى' : 'Female'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {isRTL ? 'الدولة' : 'Country'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 rtl:right-0 ltr:left-0 pl-3 rtl:pr-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      name="country"
                      required
                      value={formData.country}
                      onChange={handleChange}
                      className="block w-full rtl:pr-10 ltr:pl-10 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-white transition-colors appearance-none"
                    >
                      <option value="" disabled>{isRTL ? 'اختر دولتك' : 'Select your country'}</option>
                      <option value="Egypt">{isRTL ? 'مصر' : 'Egypt'}</option>
                      <option value="Saudi Arabia">{isRTL ? 'السعودية' : 'Saudi Arabia'}</option>
                      <option value="UAE">{isRTL ? 'الإمارات' : 'UAE'}</option>
                      <option value="Other">{isRTL ? 'أخرى' : 'Other'}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {isRTL ? 'تاريخ الميلاد' : 'Date of Birth'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 rtl:right-0 ltr:left-0 pl-3 rtl:pr-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="dob"
                    required
                    value={formData.dob}
                    onChange={handleChange}
                    className="block w-full rtl:pr-10 ltr:pl-10 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {isRTL ? 'كلمة المرور' : 'Password'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-white transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center pt-2">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  required
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="agreeToTerms" className="rtl:mr-3 ltr:ml-3 block text-sm text-gray-700 dark:text-gray-300">
                  {isRTL ? 'أوافق على ' : 'I agree to '}
                  <a href="/terms" className="text-primary-600 hover:text-primary-500 font-medium">
                    {isRTL ? 'شروط الاستخدام' : 'Terms of Use'}
                  </a>
                  {isRTL ? ' و ' : ' and '}
                  <a href="/privacy" className="text-primary-600 hover:text-primary-500 font-medium">
                    {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
                  </a>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-primary-600/20 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    {isRTL ? 'حفظ ومتابعة' : 'Save & Continue'}
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <a href="/api/auth/signout" className="text-sm font-medium text-red-600 hover:text-red-500 transition-colors">
                {isRTL ? 'تسجيل الخروج' : 'Logout'}
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
}
