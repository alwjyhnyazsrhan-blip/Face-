/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Layers, 
  Info, 
  Eye, 
  Cpu, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  Sliders, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  ZoomIn,
  Download,
  Maximize2
} from 'lucide-react';
import { Language } from '../types';

interface PatentMaskViewerProps {
  lang: Language;
  onOpenArduino: () => void;
  onBack: () => void;
}

export const PatentMaskViewer: React.FC<PatentMaskViewerProps> = ({
  lang,
  onOpenArduino,
  onBack,
}) => {
  const isArabic = lang === 'ar';
  const [activeFigure, setActiveFigure] = useState<1 | 2 | 3 | 6>(1);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Exact image paths uploaded by the user, displayed without any modification
  const figures = {
    1: {
      number: 1,
      imageSrc: '/assets/aistudio/IMG_20261101_232643_19cd98f2.jpg',
      titleAr: 'الشكل (١) - المنظور الأمامي الملون للقناع العلاجي الذكي',
      titleEn: 'Figure (1) - Colored Front Isometric View of Smart Mask',
      descriptionAr: 'المخطط الهندسي الأصلي الملون للشكل (١): يبين الهيكل الخارجي للقناع المكون من نصفي الوجه مع حزام التثبيت (١٠٦)، وزر الطاقة (١٠٣)، ومصفوفة أقطاب التحفيز الكهربائي ومناطق الإضاءة الملونة (أحمر وأزرق)، وثقوب الليزر (١١٤)، وحماية العينين (١٠٤).',
      descriptionEn: 'Original colored blueprint of Figure (1): Shows bilateral face structure, retaining strap (106), power switch (103), multi-zone photobiomodulation (red/blue), and laser matrix.',
      callouts: [
        '١٠٠ - الهيكل العام للقناع العلاجي',
        '١٠١ - النصف الأيمن للقناع',
        '١٠٢ - النصف الأيسر للقناع',
        '١٠٣ - مفتاح التشغيل والإيقاف',
        '١٠٤ - نظارة حماية العينين المدمجة',
        '١٠٦ - حزام تثبيت الرأس القابل للضبط',
        '١٠٧ - وحدة وهوائي الاتصال اللاسلكي (Bluetooth)',
        '١١٤ - مصفوفة باعثات الليزر العلاجي (650nm)',
        '١١٥ - أقطاب التحفيز العصبي الموضعي (Motor Points)',
      ],
    },
    2: {
      number: 2,
      imageSrc: '/assets/aistudio/IMG_20261101_232539_e057fdfc.jpg',
      titleAr: 'الشكل (٢) - المنظور الداخلي الملامس لبشرة الوجه',
      titleEn: 'Figure (2) - Internal Skin-Contact View',
      descriptionAr: 'المخطط الهندسي الأصلي الملون للشكل (٢): يوضح الوجه الداخلي الملامس للجلد والمزود بمصفوفات أقطاب التلامس التوصيلية (١٠٨، ١٠٩، ١١٠)، ومشبك التثبيت والإحكام السريع (١١١) مع مناطق الإشعاع الضوئي الملون.',
      descriptionEn: 'Original colored blueprint of Figure (2): Shows internal skin contact face with conductive stimulation pads (108, 109, 110) and quick-release buckle (111).',
      callouts: [
        '١٠٨ - مصفوفة أقطاب الجبهة والعين العلوية',
        '١٠٩ - مصفوفة ثقوب إشعاع الليزر البارد المباشر للجلد',
        '١١٠ - أقطاب الوجنة والخد ومحيط الفم',
        '١١١ - مشبك التثبيت وإحكام شد الحزام',
      ],
    },
    3: {
      number: 3,
      imageSrc: '/assets/aistudio/patent_figure_3_complete_colored_527688af.jpg',
      titleAr: 'الشكل (٣) - المخطط الشامل الملون للقناع ووحدة التحكم (112)',
      titleEn: 'Figure (3) - Complete Colored Assembly & Microcontroller Hub',
      descriptionAr: 'المخطط الهندسي الأصلي الشامل الملون للشكل (٣): يوضح الهيكل الداخلي المتكامل مع مصفوفات الليزر والتحفيز (١٠٨، ١٠٩)، وموقع لوحة التحكم والدوائر الإلكترونية (١١٢) ومقبس الربط الخارجي وكابل التوصيل (١١٣، ١١٦) المخصص للتوصيل مع كابل الأردوينو ومصدر الطاقة ومولد النبضات.',
      descriptionEn: 'Original complete colored blueprint of Figure (3): Highlights internal photobiomodulation arrays (108, 109), microcontroller board (112), and interface cable (113, 116) for Arduino/ESP32.',
      callouts: [
        '١٠٨، ١٠٩ - مصفوفات الإشعاع الضوئي الموضعي والأقطاب الحركية',
        '١١٢ - لوحة المعالجة والدوائر الإلكترونية (ESP32 / Arduino)',
        '١١٣ - مقبس التوصيل التسلسلي ومصدر التغذية (Serial / USB)',
        '١١٦ - كابل الربط الخارجي لنقل النبضات والطاقة',
        'توصيل موزع CD74HC4067 ومولد نبضات TENS والعازل PC817',
      ],
    },
    6: {
      number: 6,
      imageSrc: '/assets/aistudio/IMG_20261101_232613_c51afa49.jpg',
      titleAr: 'الشكل (٦) - المنظور الجانبي والتوزيع التشريحي للأقطاب',
      titleEn: 'Figure (6) - Side View & Anatomical Electrode Node Placement',
      descriptionAr: 'المخطط الهندسي الأصلي الملون للشكل (٦): يبين المنظور الجانبي الدقيق للقناع مع نقاط التماس للأقطاب الكهربائية (١١٥) وثقوب بواعث الليزر (١١٤) المتطابقة تشريحياً مع فروع العصب الوجهي السابع.',
      descriptionEn: 'Original colored blueprint of Figure (6): Side view highlighting precise lateral placement of stimulation nodes (115) and laser apertures (114) aligned with facial nerve branches.',
      callouts: [
        '١١٥ - نقاط التحفيز الكهربائي المتصلة بموزع CD74HC4067 (من C0 إلى C15)',
        '١١٤ - مصفوفة بواعث الليزر 650nm المتصلة بموديول IRF520 MOSFET',
        'تغطية العصب الصدغي (Temporal) ➔ رفع الحاجب والجبهة',
        'تغطية العصب الوجني (Zygomatic) ➔ إغلاق العين والجفن',
        'تغطية العصب الشدقي (Buccal) ➔ عضلات الابتسامة ونفخ الخد',
        'تغطية العصب الفكي الهامشي (Marginal) ➔ محيط الفم والشفاه',
        'تغطية العصب العنقي (Cervical) ➔ العضلة الجلدية للعنق (Platysma)',
      ],
    },
  };

  const currentFig = figures[activeFigure];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-teal-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-bold text-[#0d7679] hover:underline flex items-center gap-1 mb-1.5"
          >
            {isArabic ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{isArabic ? 'العودة للرئيسية' : 'Back to Home'}</span>
          </button>
          <h1 className="text-2xl font-black text-[#14292b]">
            {isArabic ? 'مخططات براءة اختراع القناع الذكي الأصلية' : 'Original Patent Blueprint Drawings'}
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            {isArabic
              ? 'الرسومات الهندسية المعتمدة كما هي بدون أي تعديل (الأشكال ١، ٢، ٣، ٦)'
              : 'Official patent engineering figures shown untouched as uploaded'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullScreen(true)}
            className="px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5"
            title={isArabic ? 'عرض بكامل الشاشة' : 'Full Screen'}
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">{isArabic ? 'تكبير' : 'Enlarge'}</span>
          </button>

          <button
            onClick={onOpenArduino}
            className="px-5 py-2.5 rounded-2xl bg-[#0d7679] hover:bg-[#0a5e61] text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5"
          >
            <Cpu className="w-4 h-4 text-emerald-300" />
            <span>{isArabic ? 'التحكم بالأردوينو' : 'Arduino Hub'}</span>
          </button>
        </div>
      </div>

      {/* Figures Switcher Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([1, 2, 3, 6] as const).map((figNum) => {
          const fig = figures[figNum];
          return (
            <button
              key={figNum}
              onClick={() => setActiveFigure(figNum)}
              className={`p-3 rounded-2xl font-black text-xs transition-all text-center border flex flex-col items-center gap-2 ${
                activeFigure === figNum
                  ? 'bg-[#0d7679] text-white border-[#0d7679] shadow-md shadow-teal-900/15'
                  : 'bg-white text-gray-700 border-teal-100 hover:bg-teal-50'
              }`}
            >
              <div className="w-full h-16 rounded-xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center p-1">
                <img
                  src={fig.imageSrc}
                  alt={`الشكل ${figNum}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <span>{isArabic ? `الشكل (${figNum})` : `Figure (${figNum})`}</span>
            </button>
          );
        })}
      </div>

      {/* Main Figure Showcase Card - Displaying exact untouched image */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-teal-100 shadow-md space-y-6">
        
        <div>
          <span className="text-xs font-bold text-[#0d7679] bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            {isArabic ? `المخطط الأصلي المعتمد - الشكل (${currentFig.number})` : `Official Patent Blueprint - Figure (${currentFig.number})`}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#14292b] mt-2">
            {isArabic ? currentFig.titleAr : currentFig.titleEn}
          </h2>
          <p className="text-sm text-gray-600 font-medium leading-relaxed mt-1">
            {isArabic ? currentFig.descriptionAr : currentFig.descriptionEn}
          </p>
        </div>

        {/* Exact Image Display Container */}
        <div className="relative w-full rounded-2xl bg-white border-2 border-teal-200/80 p-4 sm:p-8 flex items-center justify-center overflow-hidden shadow-inner group">
          <img
            src={currentFig.imageSrc}
            alt={currentFig.titleAr}
            className="max-h-[520px] w-auto max-w-full object-contain transition-transform group-hover:scale-[1.02]"
          />

          <button
            onClick={() => setIsFullScreen(true)}
            className="absolute bottom-4 left-4 bg-black/70 hover:bg-black/90 text-white p-2.5 rounded-xl text-xs font-bold backdrop-blur-sm transition-all flex items-center gap-1.5 shadow-md"
          >
            <ZoomIn className="w-4 h-4" />
            <span>{isArabic ? 'عرض الصورة بالحجم الكامل' : 'View Full Image'}</span>
          </button>
        </div>

        {/* Technical Callouts Grid */}
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-extrabold text-[#14292b]">
            {isArabic ? 'العناصر الهندسية المحددة في هذا الشكل:' : 'Key Engineering Elements in this Figure:'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentFig.callouts.map((item, idx) => (
              <div key={idx} className="bg-[#f7faf9] rounded-xl p-3 border border-teal-100 flex items-center gap-2.5 text-xs font-bold text-gray-700">
                <CheckCircle2 className="w-4 h-4 text-[#0d7679] shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Full-screen Lightbox Modal */}
      {isFullScreen && (
        <div 
          onClick={() => setIsFullScreen(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-5xl max-h-[90vh] bg-white rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center overflow-auto">
            <div className="w-full flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <span className="text-sm font-black text-[#0d7679]">
                {isArabic ? currentFig.titleAr : currentFig.titleEn}
              </span>
              <button
                onClick={() => setIsFullScreen(false)}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-xl font-bold text-gray-700"
              >
                {isArabic ? 'إغلاق (✕)' : 'Close (✕)'}
              </button>
            </div>
            <img
              src={currentFig.imageSrc}
              alt={currentFig.titleAr}
              className="max-h-[75vh] w-auto max-w-full object-contain"
            />
          </div>
        </div>
      )}

    </div>
  );
};
