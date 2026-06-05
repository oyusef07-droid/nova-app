import React, { useState, useEffect } from 'react';

export default function FakeAdmin() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Create an artificial delay to make it look real, but always fail
  const handleFakeLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      alert("كلمة المرور غير صحيحة");
    }, 1500);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/.org/2000/svg" className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            لوحة تحكم الدعم الفني
          </h1>
          <p className="text-gray-500 mb-8">
            يرجى إدخال كلمة سر الإدارة
          </p>
          <form onSubmit={handleFakeLogin}>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center mb-4"
            />
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-medium"
            >
              {loading ? 'جاري التحقق...' : 'دخول'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
