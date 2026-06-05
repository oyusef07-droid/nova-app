import React, { useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useLang } from '../../utils/useLang';
import { Mail, Lock, ArrowRight, User, AlertCircle, ShieldCheck, CheckCircle, ArrowLeft } from 'lucide-react';

export default function Login() {
  const { t, isRTL, lang, toggleLang } = useLang();
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Forgot Password State
  const [mode, setMode] = useState('login'); // 'login', 'forgot-email', 'forgot-otp', 'forgot-reset'
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For Auth.js, we POST to the provider's signin endpoint
      const res = await fetch('/api/auth/callback/credentials-signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          email,
          password,
          redirect: 'false',
        }),
      });

      if (res.ok) {
        const url = res.url || '';
        if (url.includes('error=')) {
          setError(isRTL ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password');
        } else {
          window.location.href = '/profile';
        }
      } else {
        setError(isRTL ? 'حدث خطأ أثناء تسجيل الدخول' : 'An error occurred during sign in');
      }
    } catch (err) {
      console.error(err);
      setError(isRTL ? 'حدث خطأ في الاتصال' : 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotCheckEmail = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      
      if (!data.exists) {
        setError(isRTL ? 'هذا الحساب ليس مسجل لدينا' : 'This account is not registered with us');
        setLoading(false);
        return;
      }

      // If exists, send OTP
      const otpRes = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });

      const otpData = await otpRes.json().catch(() => ({}));
      if (otpRes.ok) {
        if (otpData.dev_otp) {
          alert('تنبيه: تعذر إرسال الإيميل بسبب قيود السيرفر. كود التفعيل الخاص بك هو: ' + otpData.dev_otp);
        }
        setMode('forgot-otp');
      } else {
        setError(otpData.error || (isRTL ? 'حدث خطأ أثناء إرسال الكود' : 'Failed to send OTP'));
      }
    } catch (err) {
      setError(isRTL ? 'حدث خطأ في الاتصال' : 'Connection error');
    }
    setLoading(false);
  };

  const handleForgotVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, otp }),
      });

      if (res.ok) {
        setMode('forgot-reset');
      } else {
        setError(isRTL ? 'الكود غير صحيح أو منتهي الصلاحية' : 'Invalid or expired code');
      }
    } catch (err) {
      setError(isRTL ? 'حدث خطأ في الاتصال' : 'Connection error');
    }
    setLoading(false);
  };

  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError(isRTL ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError(isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, newPassword }),
      });

      if (res.ok) {
        // Automatically login the user with new password
        const loginRes = await fetch('/api/auth/callback/credentials-signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            email: resetEmail,
            password: newPassword,
            redirect: 'false',
          }),
        });
        
        if (loginRes.ok && !loginRes.url?.includes('error=')) {
          window.location.href = '/profile';
        } else {
          setSuccess(isRTL ? 'تم تغيير كلمة المرور بنجاح، يرجى تسجيل الدخول' : 'Password changed successfully, please log in');
          setMode('login');
        }
      } else {
        setError(isRTL ? 'حدث خطأ أثناء تغيير كلمة المرور' : 'Failed to reset password');
      }
    } catch (err) {
      setError(isRTL ? 'حدث خطأ في الاتصال' : 'Connection error');
    }
    setLoading(false);
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-[#f8fafc] dark:bg-gray-950 flex flex-col font-sans">
      <Header t={t} lang={lang} toggleLang={toggleLang} />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden relative">
          
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-500 via-primary-600 to-indigo-600"></div>

          <div className="p-8 sm:p-10">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl text-sm flex items-center gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {mode === 'login' && (
              <div className="animate-fade-in">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-3">
                    <User className="w-8 h-8 text-primary-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {isRTL ? 'مرحباً بك مجدداً' : 'Welcome Back'}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400">
                    {isRTL ? 'قم بتسجيل الدخول للوصول إلى حسابك' : 'Sign in to access your account'}
                  </p>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 rtl:right-0 ltr:left-0 pl-3 rtl:pr-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rtl:pr-10 ltr:pl-10 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-white transition-colors"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {isRTL ? 'كلمة المرور' : 'Password'}
                      </label>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 rtl:right-0 ltr:left-0 pl-3 rtl:pr-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full rtl:pr-10 ltr:pl-10 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 dark:text-white transition-colors"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-primary-600/20 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        {isRTL ? 'تسجيل الدخول' : 'Sign in'}
                        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-white dark:bg-gray-900 text-gray-500">
                        {isRTL ? 'أو الدخول باستخدام' : 'Or continue with'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <form action="/api/auth/signin/google" method="POST">
                      <input type="hidden" name="callbackUrl" value="/profile" />
                      <button
                        type="submit"
                        className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors gap-3"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          <path d="M1 1h22v22H1z" fill="none" />
                        </svg>
                        {isRTL ? 'جوجل' : 'Google'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
}
