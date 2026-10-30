/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Activity, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Language } from '../types';

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
