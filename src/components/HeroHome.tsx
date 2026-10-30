/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Camera, 
  Activity, 
  ClipboardList, 
  Zap, 
  AlertTriangle, 
  Cpu, 
  Play, 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck, 
  Sparkles,
  FileCheck2,
  Sliders,
  Layers
} from 'lucide-react';
import { ArduinoConnectionStatus, Language } from '../types';

interface HeroHomeProps {
  lang: Language;
  onStartExam: () => void;
  onViewPatients: () => void;
  onOpenArduino: () => void;
  onViewPatentMask: () => void;
  arduinoStatus: ArduinoConnectionStatus;
}

export const HeroHome: React.FC<HeroHomeProps> = ({
  lang,
  onStartExam,
  onViewPatients,
  onOpenArduino,
  onViewPatentMask,
  arduinoStatus,
}) => {
  const isArabic = lang === 'ar';
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  return (
    <div className="pb-16 space-y-8 sm:space-y-12">
      
      {/* ========================================================
          1. HERO SECTION (Exactly reproducing Screenshot 3)
         ======================================================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#005256] via-[#0d6e71] to-[#128286] text-white pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8 shadow-xl">
        {/* Subtle decorative radial glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6 sm:space-y-8">
          
          {/* Badge: تقييم ذكي لشلل الوجه النصفي */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-bold shadow-inner">
            <Activity className="w-4 h-4 text-teal-200 stroke-[2.5]" />
            <span>{isArabic ? 'تقييم ذكي لشلل الوجه النصفي' : 'AI Bell\'s Palsy & Facial Nerve Assessment'}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.25] text-white">
            {isArabic ? (
              <>
                افحص حركة وجه
                <br />
                المريض بالكاميرا
                <br />
                واحصل على تقرير
                <br />
                علاجي فوري
              </>
            ) : (
              <>
                Assess Patient Facial Movement
                <br />
                via Camera & Receive an
                <br />
                Instant Clinical Protocol
              </>
            )}
          </h1>

          {/* Subtitle Paragraph */}
          <p className="max-w-2xl mx-auto text-sm sm:text-lg text-teal-50/90 font-medium leading-relaxed">
            {isArabic
              ? 'يؤدي المريض تمارين وجهية بسيطة أمام الكاميرا، فيحلل النظام التناظر بين نصفي الوجه، ويحدد جهة الإصابة ودرجة هاوس-براكمان، ثم يقترح جرعة التحفيز الكهربائي والليزر.'
              : 'The patient performs simple facial exercises in front of the camera; the system analyzes bilateral symmetry, determines the affected side & House-Brackmann grade, then prescribes precise EMS electrical stimulation and LLLT laser protocols.'}
          </p>

          {/* Action Buttons: ابدأ فحصاً جديداً & سجل المرضى */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            
            {/* Start New Exam Button */}
            <button
              onClick={onStartExam}
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-2xl bg-white text-[#0d5e5e] hover:bg-teal-50 font-black text-base shadow-lg shadow-teal-950/20 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5 text-[#0d7679]" />
              <span>{isArabic ? 'ابدأ فحصاً جديداً' : 'Start New Examination'}</span>
            </button>

            {/* Patients Registry Button */}
            <button
              onClick={onViewPatients}
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-base border border-white/30 backdrop-blur-sm active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <ClipboardList className="w-5 h-5 text-teal-200" />
              <span>{isArabic ? 'سجل المرضى' : 'Patient Registry'}</span>
            </button>

          </div>

          {/* Arduino Status Bar inside Hero */}
          <div className="pt-4 flex items-center justify-center">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-teal-950/30 border border-teal-300/20 backdrop-blur-md text-xs sm:text-sm">
              <Cpu className="w-4 h-4 text-emerald-300" />
              <span className="text-teal-100 font-semibold">
                {isArabic ? 'جاهز للربط الفوري مع أي أردوينو / ESP32 بالقناع العلاجي' : 'Ready for instant link with any Arduino / ESP32 Smart Mask'}
              </span>
              <button
                onClick={onOpenArduino}
                className="underline font-bold text-white hover:text-emerald-300 transition-colors mr-1"
              >
                {isArabic ? 'فتح لوحة التحكم' : 'Open Controller'}
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          2. THE 4 FEATURE CARDS (Exactly reproducing Screenshots 4 & 5)
         ======================================================== */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 space-y-4">
        
        {/* Card 1: تمارين أمام الكاميرا */}
        <div 
          onClick={onStartExam}
          className="bg-white rounded-3xl p-6 sm:p-7 border border-teal-100/90 shadow-[0_4px_20px_rgba(13,118,121,0.05)] hover:shadow-md hover:border-teal-300 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-extrabold text-[#14292b] group-hover:text-[#0d7679] transition-colors">
                {isArabic ? 'تمارين أمام الكاميرا' : 'Exercises in Front of the Camera'}
              </h3>
              <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed">
                {isArabic
                  ? 'رفع الحاجبين، إغلاق العينين، الابتسامة، نفخ الخدين، وزم الشفاه — صورة لكل تمرين.'
                  : 'Eyebrow raise, tight eye closure, broad smile, cheek puffing, and lip puckering — snapshot for each exercise.'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-[#0d7679] shrink-0 border border-teal-100 group-hover:bg-[#0d7679] group-hover:text-white transition-all">
              <Camera className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
        </div>

        {/* Card 2: تحديد جهة الخلل والدرجة */}
        <div 
          onClick={onStartExam}
          className="bg-white rounded-3xl p-6 sm:p-7 border border-teal-100/90 shadow-[0_4px_20px_rgba(13,118,121,0.05)] hover:shadow-md hover:border-teal-300 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-extrabold text-[#14292b] group-hover:text-[#0d7679] transition-colors">
                {isArabic ? 'تحديد جهة الخلل والدرجة' : 'Identify Defect Side & Severity Grade'}
              </h3>
              <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed">
                {isArabic
                  ? 'مقارنة نصفي الوجه لتحديد الجهة المصابة وتقدير درجة House-Brackmann من I إلى VI.'
                  : 'Bilateral hemifacial comparison to determine affected side and estimate House-Brackmann Grade from I to VI.'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-[#0d7679] shrink-0 border border-teal-100 group-hover:bg-[#0d7679] group-hover:text-white transition-all">
              <Activity className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
        </div>

        {/* Card 3: ملخص تشخيصي للطبيب */}
        <div 
          onClick={() => onStartExam()}
          className="bg-white rounded-3xl p-6 sm:p-7 border border-teal-100/90 shadow-[0_4px_20px_rgba(13,118,121,0.05)] hover:shadow-md hover:border-teal-300 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-extrabold text-[#14292b] group-hover:text-[#0d7679] transition-colors">
                {isArabic ? 'ملخص تشخيصي للطبيب' : 'Diagnostic Summary for Physician'}
              </h3>
              <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed">
                {isArabic
                  ? 'تقرير عربي موجز بنتائج كل تمرين ومستوى الشدة وأي علامات تحذيرية.'
                  : 'Structured concise summary of all exercise outcomes, motor severity, and clinical warning flags.'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-[#0d7679] shrink-0 border border-teal-100 group-hover:bg-[#0d7679] group-hover:text-white transition-all">
              <ClipboardList className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
        </div>

        {/* Card 4: جرعة مقترحة للعلاج */}
        <div 
          onClick={onOpenArduino}
          className="bg-white rounded-3xl p-6 sm:p-7 border border-teal-100/90 shadow-[0_4px_20px_rgba(13,118,121,0.05)] hover:shadow-md hover:border-teal-300 transition-all cursor-pointer group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <h3 className="text-xl font-extrabold text-[#14292b] group-hover:text-[#0d7679] transition-colors">
                {isArabic ? 'جرعة مقترحة للعلاج' : 'Suggested Therapeutic Dosage'}
              </h3>
              <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed">
                {isArabic
                  ? 'بروتوكول مبدئي للتحفيز الكهربائي والليزر منخفض المستوى حسب الدرجة المقدرة.'
                  : 'Initial protocol for electrical neuromuscular stimulation (NMES) and low-level laser (LLLT) calibrated to estimated grade.'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-[#0d7679] shrink-0 border border-teal-100 group-hover:bg-[#0d7679] group-hover:text-white transition-all">
              <Zap className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
        </div>

        {/* ========================================================
            3. WARNING DISCLAIMER BANNER (Exactly reproducing Screenshot 4)
           ======================================================== */}
        <div className="bg-[#fef9ee] border border-[#f5dfb8] rounded-3xl p-5 sm:p-6 text-center mt-6">
          <p className="text-sm sm:text-base font-bold text-[#8a5d1b] leading-relaxed">
            {isArabic
              ? 'هذه الأداة مساعدة سريرية فقط ولا تُغني عن الفحص الإكلينيكي وقرار الطبيب المعالج.'
              : 'This tool is for clinical assistance only and is not a substitute for clinical examination and the treating physician\'s judgment.'}
          </p>
        </div>

      </section>

      {/* ========================================================
          4. PATENT SMART MASK & ARDUINO ECOSYSTEM SHOWCASE
         ======================================================== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-teal-100 shadow-[0_8px_30px_rgba(13,118,121,0.07)] overflow-hidden">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-teal-50">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-[#0d7679] text-xs font-bold border border-teal-200 mb-2">
                <Cpu className="w-3.5 h-3.5" />
                <span>{isArabic ? 'براءة الاختراع والأجهزة' : 'Patent & Hardware Integration'}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#14292b]">
                {isArabic ? 'القناع العلاجي الذكي ومنظومة الأردوينو' : 'Smart Therapeutic Mask & Arduino System'}
              </h2>
              <p className="text-sm text-gray-500 mt-1 max-w-xl">
                {isArabic
                  ? 'تصميم مطابق للمخططات الهندسية المرفقة (الشكل 1، 2، 3، 6). القناع مزود بمصفوفة أقطاب التحفيز (115) وأشعة الليزر (114) ووحدة التحكم (112) للربط المباشر مع الأردوينو.'
                  : 'Fully aligned with the patent blueprints (Figures 1, 2, 3, 6). Equipped with multi-zone stimulation electrodes (115), laser matrix (114), and Arduino interface (112).'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                onClick={onViewPatentMask}
                className="px-4 py-2.5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-[#0d7679] font-bold text-sm border border-teal-200 transition-all flex items-center gap-1.5"
              >
                <Layers className="w-4 h-4" />
                <span>{isArabic ? 'عرض مخططات البراءة' : 'View Patent Figures'}</span>
              </button>
              
              <button
                onClick={onOpenArduino}
                className="px-5 py-2.5 rounded-2xl bg-[#0d7679] hover:bg-[#0a5e61] text-white font-bold text-sm shadow-sm transition-all flex items-center gap-1.5"
              >
                <Sliders className="w-4 h-4" />
                <span>{isArabic ? 'لوحة تحكم الأردوينو' : 'Arduino Control Panel'}</span>
              </button>
            </div>
          </div>

          {/* Real Untouched Mask Image & Technical Architecture */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            
            {/* Real Figure 1 Image as uploaded */}
            <div 
              onClick={onViewPatentMask}
              className="md:col-span-5 bg-white rounded-2xl p-4 border border-teal-100 flex flex-col items-center justify-center cursor-pointer hover:border-teal-300 hover:shadow-md transition-all group"
            >
              <img
                src="/assets/aistudio/IMG_20261030_174407_14f5e28b.jpg"
                alt="الشكل 1 - القناع العلاجي الذكي"
                className="max-h-56 w-auto object-contain group-hover:scale-105 transition-transform"
              />
              <span className="text-[11px] font-extrabold text-[#0d7679] mt-2 group-hover:underline">
                {isArabic ? 'الشكل (١) - المخطط الأصلي المعتمد للقناع' : 'Figure (1) - Official Mask Blueprint'}
              </span>
            </div>

            {/* The 3 Core Pillars */}
            <div className="md:col-span-7 grid grid-cols-1 gap-3">
              
              <div className="bg-[#f7faf9] rounded-2xl p-3.5 border border-teal-100/70 space-y-1">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                  <span className="w-5 h-5 rounded-lg bg-teal-200/70 flex items-center justify-center text-xs font-black">١</span>
                  <span>{isArabic ? 'قنوات التحفيز العضلي (EMS / TENS)' : 'EMS Facial Motor Channels'}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {isArabic
                    ? 'أقطاب توصيلية فضية (115) عند النقاط الحركية للفروع الخمسة مع عازل ضوئي PC817.'
                    : 'Conductive electrodes (115) at motor points with PC817 optocoupler isolation.'}
                </p>
              </div>

              <div className="bg-[#f7faf9] rounded-2xl p-3.5 border border-teal-100/70 space-y-1">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                  <span className="w-5 h-5 rounded-lg bg-teal-200/70 flex items-center justify-center text-xs font-black">٢</span>
                  <span>{isArabic ? 'مصفوفة ديودات الليزر العلاجي (650nm / 5mW)' : '650nm Laser Diode Matrix'}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {isArabic
                    ? 'بواعث ليزر بارد (114) بالوجه الداخلي للقناع تعمل عبر IRF520 MOSFET.'
                    : 'Low-level cold laser diodes (114) on the inner shell pulsed via IRF520 MOSFET.'}
                </p>
              </div>

              <div className="bg-[#f7faf9] rounded-2xl p-3.5 border border-teal-100/70 space-y-1">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
                  <span className="w-5 h-5 rounded-lg bg-teal-200/70 flex items-center justify-center text-xs font-black">٣</span>
                  <span>{isArabic ? 'موزع CD74HC4067 ومقاومة MCP4131' : 'CD74HC4067 MUX & MCP4131 Pot'}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {isArabic
                    ? 'توجيه مستقل لـ 16 نقطة حركية في الوجه مع تحكم رقمي دقيق بالتيار عبر ESP32.'
                    : 'Independent routing across 16 facial motor points with digital mA control.'}
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>

    </div>
  );
};
