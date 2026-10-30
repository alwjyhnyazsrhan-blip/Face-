/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, Cpu, LogIn, User, Wifi, WifiOff, FileText, Camera, ShieldAlert, Sparkles } from 'lucide-react';
import { ArduinoConnectionStatus, ConnectionType, Language } from '../types';

interface HeaderProps {
  currentTab: 'home' | 'assessment' | 'report' | 'arduino' | 'patients' | 'auth';
  setCurrentTab: (tab: 'home' | 'assessment' | 'report' | 'arduino' | 'patients' | 'auth') => void;
  lang: Language;
  setLang: (lang: Language) => void;
  arduinoStatus: ArduinoConnectionStatus;
  connectionType: ConnectionType;
  onOpenArduinoModal: () => void;
  doctorName: string | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  lang,
  setLang,
  arduinoStatus,
  connectionType,
  onOpenArduinoModal,
  doctorName,
  onLogout,
}) => {
  const isArabic = lang === 'ar';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-teal-100 shadow-[0_2px_12px_rgba(13,118,121,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & App Name */}
          <div 
            onClick={() => setCurrentTab('home')}
            className="flex items-center gap-3 cursor-pointer group transition-transform active:scale-98"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#0d7679] to-[#085356] flex items-center justify-center text-white shadow-md shadow-teal-900/10 group-hover:shadow-teal-700/20 transition-all">
              <Activity className="w-6 h-6 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl text-[#0d5e5e] tracking-tight">
                  {isArabic ? 'تقييم العصب الوجهي' : 'Facial Nerve AI'}
                </span>
                <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#0d7679] border border-teal-200">
                  {isArabic ? 'القناع الذكي' : 'Smart Mask'}
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                {isArabic ? 'تشخيص شلل الوجه النصفي والتحكم بالأردوينو' : 'Bell\'s Palsy Assessment & Arduino Controller'}
              </p>
            </div>
          </div>

          {/* Navigation items for desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-[#f4f9f9] p-1.5 rounded-2xl border border-teal-100/70">
            <button
              onClick={() => setCurrentTab('home')}
              className={`px-3.5 py-1.5 text-sm font-semibold rounded-xl transition-all ${
                currentTab === 'home'
                  ? 'bg-white text-[#0d5e5e] shadow-sm'
                  : 'text-gray-600 hover:text-[#0d5e5e]'
              }`}
            >
              {isArabic ? 'الرئيسية' : 'Home'}
            </button>
            <button
              onClick={() => setCurrentTab('assessment')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold rounded-xl transition-all ${
                currentTab === 'assessment'
                  ? 'bg-[#0d7679] text-white shadow-sm'
                  : 'text-gray-600 hover:text-[#0d5e5e]'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{isArabic ? 'فحص الكاميرا' : 'Camera Exam'}</span>
            </button>
            <button
              onClick={() => setCurrentTab('report')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold rounded-xl transition-all ${
                currentTab === 'report'
                  ? 'bg-white text-[#0d5e5e] shadow-sm'
                  : 'text-gray-600 hover:text-[#0d5e5e]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{isArabic ? 'التقرير والجرعات' : 'Report & Rx'}</span>
            </button>
            <button
              onClick={() => setCurrentTab('arduino')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold rounded-xl transition-all ${
                currentTab === 'arduino'
                  ? 'bg-white text-[#0d5e5e] shadow-sm'
                  : 'text-gray-600 hover:text-[#0d5e5e]'
              }`}
            >
              <Cpu className="w-4 h-4 text-emerald-600" />
              <span>{isArabic ? 'ربط الأردوينو' : 'Arduino Link'}</span>
            </button>
            <button
              onClick={() => setCurrentTab('patients')}
              className={`px-3.5 py-1.5 text-sm font-semibold rounded-xl transition-all ${
                currentTab === 'patients'
                  ? 'bg-white text-[#0d5e5e] shadow-sm'
                  : 'text-gray-600 hover:text-[#0d5e5e]'
              }`}
            >
              {isArabic ? 'سجل المرضى' : 'Patients'}
            </button>
          </nav>

          {/* Right Side Controls: Arduino Pill, Language Toggle, Doctor Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Arduino Connection Badge Pill */}
            <button
              onClick={onOpenArduinoModal}
              title={isArabic ? 'حالة الاتصال بالأردوينو (انقر للإعدادات)' : 'Arduino Connection Status (Click to manage)'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                arduinoStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm shadow-emerald-600/10'
                  : arduinoStatus === 'connecting'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300'
              }`}
            >
              {arduinoStatus === 'connected' ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">
                    {connectionType === 'bluetooth' ? 'ESP32 BLE متصل' : 'أردوينو متصل'}
                  </span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-gray-400" />
                  <span className="hidden sm:inline">{isArabic ? 'ربط أردوينو (USB)' : 'Connect Arduino'}</span>
                </>
              )}
            </button>

            {/* Language Toggle matching user screenshot pill */}
            <div className="flex items-center bg-[#eef7f6] p-1 rounded-full border border-teal-100/90 text-xs font-bold">
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  lang === 'en'
                    ? 'bg-white text-[#0d7679] shadow-sm font-extrabold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLang('ar')}
                className={`px-3 py-1 rounded-full transition-all ${
                  lang === 'ar'
                    ? 'bg-[#d2ede9] text-[#0d5e5e] shadow-sm font-extrabold'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                العربية
              </button>
            </div>

            {/* Doctor Profile / Login button */}
            {doctorName ? (
              <div className="flex items-center gap-2 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200">
                <User className="w-4 h-4 text-[#0d7679]" />
                <span className="text-xs font-bold text-[#0d5e5e] max-w-[90px] sm:max-w-[120px] truncate">
                  {doctorName}
                </span>
                <button
                  onClick={onLogout}
                  className="text-[11px] text-red-600 hover:underline mr-1"
                  title={isArabic ? 'تسجيل الخروج' : 'Log out'}
                >
                  {isArabic ? 'خروج' : 'Out'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentTab('auth')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0d7679] text-white hover:bg-[#0a5e61] transition-all shadow-sm active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isArabic ? 'تسجيل الدخول' : 'Sign In'}</span>
              </button>
            )}

          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-teal-50 text-xs font-bold text-gray-600">
          <button
            onClick={() => setCurrentTab('home')}
            className={`px-2 py-1 rounded-lg ${currentTab === 'home' ? 'text-[#0d7679] bg-teal-50' : ''}`}
          >
            {isArabic ? 'الرئيسية' : 'Home'}
          </button>
          <button
            onClick={() => setCurrentTab('assessment')}
            className={`px-2 py-1 rounded-lg ${currentTab === 'assessment' ? 'text-[#0d7679] bg-teal-50' : ''}`}
          >
            {isArabic ? 'فحص الكاميرا' : 'Exam'}
          </button>
          <button
            onClick={() => setCurrentTab('report')}
            className={`px-2 py-1 rounded-lg ${currentTab === 'report' ? 'text-[#0d7679] bg-teal-50' : ''}`}
          >
            {isArabic ? 'التقرير' : 'Report'}
          </button>
          <button
            onClick={() => setCurrentTab('arduino')}
            className={`px-2 py-1 rounded-lg ${currentTab === 'arduino' ? 'text-[#0d7679] bg-teal-50' : ''}`}
          >
            {isArabic ? 'الأردوينو' : 'Arduino'}
          </button>
          <button
            onClick={() => setCurrentTab('patients')}
            className={`px-2 py-1 rounded-lg ${currentTab === 'patients' ? 'text-[#0d7679] bg-teal-50' : ''}`}
          >
            {isArabic ? 'المرضى' : 'Patients'}
          </button>
        </div>

      </div>
    </header>
  );
};
