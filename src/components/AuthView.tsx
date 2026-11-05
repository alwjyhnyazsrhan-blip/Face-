/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Activity, ArrowRight, ShieldCheck, Sparkles, LogIn } from 'lucide-react';
import { Language } from '../types';
import { loginWithGoogle } from '../services/dbService';

interface AuthViewProps {
  lang: Language;
  onLoginSuccess: (doctorName: string, email: string) => void;
  onClose?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ lang, onLoginSuccess, onClose }) => {
  const isArabic = lang === 'ar';
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const user = await loginWithGoogle();
      const displayName = user.displayName || user.email?.split('@')[0] || (isArabic ? 'طبيب معالج' : 'Attending Doctor');
      const userEmail = user.email || '';
      try {
        localStorage.setItem('auth_doctor', JSON.stringify({ name: displayName, email: userEmail }));
      } catch (e) {}
      onLoginSuccess(displayName, userEmail);
    } catch (err: any) {
      console.error(err);
      setError(isArabic ? 'حدث خطأ أثناء تسجيل الدخول بحساب Google' : 'Failed to sign in with Google');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup' && !fullName.trim()) {
      setError(isArabic ? 'يرجى إدخال الاسم الكامل' : 'Please enter your full name');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError(isArabic ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please fill all fields');
      return;
    }

    const nameToUse = mode === 'signup' ? fullName.trim() : fullName.trim() || email.split('@')[0];
    try {
      localStorage.setItem('auth_doctor', JSON.stringify({ name: nameToUse, email: email.trim() }));
    } catch (e) {
      // storage unavailable
    }
    onLoginSuccess(nameToUse, email.trim());
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Background Soft Glow */}
      <div className="w-full max-w-md">
        
        {/* Main Card exactly matching user's screenshots */}
        <div className="bg-white rounded-[32px] p-6 sm:p-9 shadow-[0_10px_35px_rgba(13,118,121,0.08)] border border-teal-100/80 relative">
          
          {/* Card Header with Pulse Icon and Title */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0d7679] tracking-tight">
              {isArabic ? 'تقييم العصب الوجهي' : 'Facial Nerve AI'}
            </h2>
            <Activity className="w-6 h-6 text-[#0d7679] stroke-[2.5]" />
          </div>

          {/* Section Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-[#14292b] mb-2 tracking-tight">
              {mode === 'login'
                ? isArabic ? 'تسجيل الدخول' : 'Sign In'
                : isArabic ? 'إنشاء حساب جديد' : 'Create New Account'}
            </h1>
            <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xs mx-auto">
              {isArabic
                ? 'للأطباء وأخصائيي العلاج الطبيعي لحفظ تقييمات المرضى.'
                : 'For doctors and physiotherapists to record patient assessments.'}
            </p>
          </div>

          {/* Google Sign-in Button for Real Firebase Firestore Cloud Sync */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-teal-50 border border-teal-200 text-[#0d7679] font-bold text-sm shadow-sm flex items-center justify-center gap-2.5 transition-all active:scale-98 mb-5"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {isGoogleLoading
                ? isArabic ? 'جاري الاتصال بـ Google...' : 'Connecting to Google...'
                : isArabic ? 'متابعة باستخدام حساب Google (Firebase)' : 'Continue with Google Account'}
            </span>
          </button>

          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-teal-100 w-full"></div>
            <span className="bg-white px-3 text-xs text-gray-400 font-bold uppercase">
              {isArabic ? 'أو بالبريد الإلكتروني' : 'or with email'}
            </span>
            <div className="border-t border-teal-100 w-full"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name input (for Sign up) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-bold text-[#14292b] mb-1.5">
                  {isArabic ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isArabic ? 'الاسم واللقب الطبي (مثال: د. عبد الله)' : 'Full Name & Title (e.g. Dr. Alex)'}
                  required
                  className="w-full px-4 py-3 bg-[#f6faf9] border border-teal-100 rounded-2xl text-[#14292b] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7679] focus:bg-white transition-all shadow-inner"
                />
              </div>
            )}

            {/* Email input */}
            <div>
              <label className="block text-sm font-bold text-[#14292b] mb-1.5">
                {isArabic ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@example.com"
                required
                className="w-full px-4 py-3 bg-[#f6faf9] border border-teal-100 rounded-2xl text-[#14292b] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7679] focus:bg-white transition-all shadow-inner"
              />
            </div>

            {/* Password input */}
            <div>
              <label className="block text-sm font-bold text-[#14292b] mb-1.5">
                {isArabic ? 'كلمة المرور' : 'Password'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-[#f6faf9] border border-teal-100 rounded-2xl text-[#14292b] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7679] focus:bg-white transition-all shadow-inner"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Main Action Button */}
            <button
              type="submit"
              className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-[#0d7679] hover:bg-[#0a5e61] text-white font-extrabold text-base shadow-md shadow-teal-900/15 active:scale-98 transition-all"
            >
              {mode === 'login'
                ? isArabic ? 'دخول' : 'Log In'
                : isArabic ? 'إنشاء الحساب' : 'Create Account'}
            </button>
          </form>

          {/* Toggle between Login and Signup */}
          <div className="mt-6 text-center">
            {mode === 'login' ? (
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className="text-sm font-bold text-[#0d7679] hover:underline transition-all"
              >
                {isArabic ? 'ليس لديك حساب؟ أنشئ حساباً' : "Don't have an account? Sign up"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="text-sm font-bold text-[#0d7679] hover:underline transition-all"
              >
                {isArabic ? 'لديك حساب بالفعل؟ سجّل الدخول' : 'Already have an account? Log in'}
              </button>
            )}
          </div>

          {onClose && (
            <div className="mt-5 pt-4 border-t border-teal-50 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-gray-500 hover:text-[#0d7679] transition-colors"
              >
                {isArabic ? '← العودة للصفحة الرئيسية' : '← Back to Home Page'}
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
