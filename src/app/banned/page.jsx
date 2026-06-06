import { useLang } from "../../utils/useLang";
import { ShieldAlert } from "lucide-react";

export default function BannedPage() {
  const { t, isRTL } = useLang();

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl p-8 text-center shadow-lg border border-red-100 dark:border-red-900/30">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {isRTL ? "حسابك محظور" : "Account Banned"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
          {isRTL 
            ? "لقد تم حظر حسابك نهائياً بسبب انتهاك شروط الاستخدام أو بناءً على قرار من إدارة الموقع. لا يمكنك استخدام أي من مميزات المنصة حالياً."
            : "Your account has been permanently banned due to a violation of our terms of service or by an admin decision. You can no longer use the platform features."}
        </p>
      </div>
    </div>
  );
}
