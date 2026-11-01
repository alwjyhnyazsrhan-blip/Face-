/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Cpu, 
  Activity, 
  Zap, 
  Printer, 
  Share2, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  ArrowRight, 
  ArrowLeft,
  Sliders,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';
import { CLINICAL_EXERCISES, getGradeLabel } from '../services/assessmentService';
import { arduinoService } from '../services/arduinoService';
import { AssessmentReport, ExerciseResult, Language, TherapeuticProtocol } from '../types';

interface DiagnosticReportProps {
  lang: Language;
  report: AssessmentReport | null;
  onRetakeExam: () => void;
  onOpenArduino: () => void;
  onSaveToRegistry: () => void;
  onStartTherapySession?: () => void;
}

export const DiagnosticReport: React.FC<DiagnosticReportProps> = ({
  lang,
  report,
  onRetakeExam,
  onOpenArduino,
  onSaveToRegistry,
  onStartTherapySession,
}) => {
  const isArabic = lang === 'ar';

  const [isSendingToArduino, setIsSendingToArduino] = useState(false);
  const [arduinoSentSuccess, setArduinoSentSuccess] = useState(false);

  if (!report) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-teal-100 shadow-sm space-y-6">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-teal-50 text-[#0d7679] flex items-center justify-center border border-teal-100">
            <FileText className="w-8 h-8 stroke-[2]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-[#14292b]">
              {isArabic ? 'لا يوجد تقرير فحص حالي بعد' : 'No Active Assessment Report Yet'}
            </h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              {isArabic
                ? 'قم بإجراء فحص الكاميرا للمريض لتحليل حركة وتناظر عضلات الوجه وتقدير درجة هاوس-براكمان الإكلينيكية تلقائياً وتوليد بروتوكول القناع الذكي.'
                : 'Perform a camera assessment to analyze facial muscle symmetry, determine House-Brackmann grade, and generate smart mask dosages.'}
            </p>
          </div>
          <button
            onClick={onRetakeExam}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#0d7679] hover:bg-[#0a5e61] text-white font-extrabold text-sm shadow-md shadow-teal-900/15 transition-all active:scale-95"
          >
            <Activity className="w-4 h-4" />
            <span>{isArabic ? 'بدء فحص جديد بالكاميرا' : 'Start Camera Examination'}</span>
          </button>
        </div>
      </div>
    );
  }

  const { protocol, exerciseResults } = report;
  const gradeLabel = getGradeLabel(protocol.houseBrackmannGrade, lang);

  const handleSendToArduino = async () => {
    setIsSendingToArduino(true);
    setArduinoSentSuccess(false);

    // If hardware is not connected, trigger real USB port request
    if (arduinoService.getStatus() !== 'connected') {
      const connected = await arduinoService.connectSerial(115200);
      if (!connected) {
        setIsSendingToArduino(false);
        onOpenArduino();
        return;
      }
    }

    try {
      await arduinoService.sendTherapeuticProtocol(protocol);
      setArduinoSentSuccess(true);
      setTimeout(() => setArduinoSentSuccess(false), 4000);
    } catch (e) {
      console.warn('Error sending to Arduino:', e);
    } finally {
      setIsSendingToArduino(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner / Actions Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-teal-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#0d7679] text-xs font-bold border border-teal-200 mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>{isArabic ? 'تقرير الفحص الإكلينيكي المعتمد' : 'Validated Clinical Report'}</span>
          </div>
          <h1 className="text-2xl font-black text-[#14292b]">
            {isArabic ? 'تقرير تقييم العصب الوجهي والبروتوكول العلاجي' : 'Facial Nerve Diagnostic & Therapeutic Report'}
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            {isArabic ? `المريض: ${report.patientName} | التاريخ: ${new Date(report.date).toLocaleDateString('ar-EG')}` : `Patient: ${report.patientName} | Date: ${report.date}`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5"
            title={isArabic ? 'طباعة التقرير' : 'Print Report'}
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isArabic ? 'طباعة' : 'Print'}</span>
          </button>

          <button
            onClick={onRetakeExam}
            className="px-4 py-2 rounded-2xl border border-teal-200 text-[#0d7679] hover:bg-teal-50 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isArabic ? 'إعادة الفحص' : 'Re-take'}</span>
          </button>

          <button
            onClick={onSaveToRegistry}
            className="px-4 py-2 rounded-2xl bg-[#0d7679] hover:bg-[#0a5e61] text-white text-xs font-extrabold shadow-sm transition-all"
          >
            {isArabic ? 'حفظ في السجل' : 'Save Record'}
          </button>
        </div>
      </div>

      {/* Main Diagnosis Card (House-Brackmann Grade + Affected Side) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-teal-100 shadow-md space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Grade Badge */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className={`px-4 py-1.5 rounded-full text-xs font-black border ${gradeLabel.color}`}>
                {gradeLabel.badge}
              </span>
              <span className="text-xs font-bold text-gray-500">
                {isArabic ? `الجهة المصابة: ${protocol.affectedSide === 'left' ? 'اليسرى' : protocol.affectedSide === 'right' ? 'اليمنى' : 'ثنائي الجانب'}` : `Affected Side: ${protocol.affectedSide.toUpperCase()}`}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#14292b]">
              {gradeLabel.title}
            </h2>

            <p className="text-sm text-gray-600 font-medium leading-relaxed">
              {gradeLabel.description}
            </p>
          </div>

          {/* Overall Symmetry Gauge Ring */}
          <div className="bg-gradient-to-br from-[#f2f8f8] to-[#e4f3f1] rounded-2xl p-5 border border-teal-100 text-center flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-[#0d7679] uppercase tracking-wider mb-1">
              {isArabic ? 'معدل التناظر الكلي' : 'Bilateral Symmetry'}
            </span>
            <div className="relative flex items-center justify-center my-2">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-teal-200/50"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-[#0d7679]"
                  fill="transparent"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * protocol.overallSymmetryScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-2xl font-black text-[#0d5e5e]">
                {protocol.overallSymmetryScore}%
              </span>
            </div>
            <span className="text-[11px] font-bold text-gray-500">
              {isArabic ? 'مقياس Sunnybrook / HB المعياري' : 'Sunnybrook / HB Scale'}
            </span>
          </div>

        </div>

      </div>

      {/* Suggested Therapeutic Protocol Card (EMS + Laser LLLT + Arduino Dispatch) */}
      <div className="bg-gradient-to-br from-white to-[#f7fbfb] rounded-3xl p-6 sm:p-8 border-2 border-[#0d7679]/30 shadow-lg space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-teal-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-1">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isArabic ? 'جرعة مقترحة للعلاج بالقناع الذكي' : 'Prescribed Smart Mask Protocol'}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#14292b]">
              {isArabic ? 'بروتوكول التحفيز الكهربائي والليزر (Arduino Ready)' : 'EMS & LLLT Arduino Dosage Prescription'}
            </h3>
          </div>

          {/* Master Buttons: Launch Therapy Session or Send Protocol */}
          <div className="flex flex-wrap items-center gap-2 sm:self-auto">
            {onStartTherapySession && (
              <button
                onClick={onStartTherapySession}
                className="px-5 py-3.5 rounded-2xl bg-[#0d7679] hover:bg-[#0a5e61] text-white font-black text-sm shadow-md shadow-teal-900/15 active:scale-98 transition-all flex items-center gap-2"
              >
                <Zap className="w-5 h-5 text-amber-300 fill-current" />
                <span>{isArabic ? 'بدء جلسة العلاج بالقناع (Motor Points)' : 'Start Motor Points Therapy'}</span>
              </button>
            )}

            <button
              onClick={handleSendToArduino}
              disabled={isSendingToArduino}
              className="px-5 py-3.5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-[#0d7679] border border-teal-200 font-bold text-sm shadow-sm active:scale-98 transition-all flex items-center gap-2"
            >
              <Cpu className="w-5 h-5 text-emerald-600" />
              <span>
                {isSendingToArduino
                  ? isArabic ? 'جارٍ الإرسال...' : 'Sending...'
                  : isArabic ? 'إرسال للأردوينو' : 'Send to Arduino'}
              </span>
            </button>

            {arduinoSentSuccess && (
              <span className="w-full text-xs font-bold text-emerald-600 mt-1 flex items-center gap-1 animate-bounce">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isArabic ? 'تم إرسال الأوامر وتشغيل القناع بنجاح!' : 'Commands transmitted to Arduino successfully!'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Anatomical Facial Motor Points Banner matching user upload */}
        <div className="bg-[#f0f9f8] rounded-2xl p-4 sm:p-5 border border-teal-200 flex flex-col md:flex-row items-center gap-5">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-white border border-teal-100 shadow-sm shrink-0 flex items-center justify-center p-1">
            <img 
              src="/assets/aistudio/IMG_20261031_201132_d8320459.jpg" 
              alt="Facial Motor Points" 
              className="w-full h-full object-contain"
            />
          </div>

          <div className="space-y-1.5 flex-1 text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-200 text-[#0d5e5e] text-xs font-black">
                {isArabic ? 'نقاط التقاء العصب والعضلات (Motor Points)' : 'Anatomical Motor Points'}
              </span>
              <span className="text-xs font-bold text-gray-500">
                {isArabic ? `الجهة المستهدفة: ${protocol.affectedSide === 'left' ? 'اليسرى (S)' : 'اليمنى (D)'}` : `Target: ${protocol.affectedSide.toUpperCase()}`}
              </span>
            </div>
            <h4 className="text-base font-extrabold text-[#14292b]">
              {isArabic 
                ? 'توزيع التحفيز الكهربائي والليزر على النقاط الست في القناع' 
                : '6 Motor Points EMS & Laser Distribution'}
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              {isArabic
                ? 'يتم توجيه نبضات التحفيز عبر موزع 16 قناة (CD74HC4067) ومقاومة MCP4131 طبقاً لدرجة الإصابة لنقاط الجبهة (1)، العين (2)، رافعة الشفة (3)، الوجنة (4)، الفم (5)، والذقن (6).'
                : 'Stimulation is routed via 16-channel MUX (CD74HC4067) to points 1 (frontalis), 2 (orbicularis oculi), 3 (nasalis), 4 (zygomatici), 5 (orbicularis oris), 6 (depressor/mentalis).'}
            </p>
          </div>

          {onStartTherapySession && (
            <button
              onClick={onStartTherapySession}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-[#0d7679] hover:bg-[#0a5e61] text-white text-xs font-black shadow-sm transition-all"
            >
              {isArabic ? 'فتح لوحة الجلسة ←' : 'Open Therapy Panel →'}
            </button>
          )}
        </div>

        {/* Detailed Dosage Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Electrical Muscle Stimulation (EMS/NMES) Card */}
          <div className="bg-white rounded-2xl p-5 border border-teal-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-[#0d7679] font-extrabold text-base">
              <Zap className="w-5 h-5" />
              <span>{isArabic ? 'التحفيز العصبي العضلي (NMES / EMS)' : 'Neuromuscular Electrical Stimulation'}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#f7faf9] p-3 rounded-xl border border-teal-50">
                <span className="text-gray-500 font-semibold">{isArabic ? 'التردد (Frequency)' : 'Frequency'}</span>
                <p className="text-lg font-black text-[#0d5e5e]">{protocol.ems.frequencyHz} Hz</p>
              </div>

              <div className="bg-[#f7faf9] p-3 rounded-xl border border-teal-50">
                <span className="text-gray-500 font-semibold">{isArabic ? 'شدة التيار (Current)' : 'Intensity'}</span>
                <p className="text-lg font-black text-[#0d5e5e]">{protocol.ems.currentIntensitymA} mA</p>
              </div>

              <div className="bg-[#f7faf9] p-3 rounded-xl border border-teal-50">
                <span className="text-gray-500 font-semibold">{isArabic ? 'عرض النبضة (Pulse Width)' : 'Pulse Duration'}</span>
                <p className="text-lg font-black text-[#0d5e5e]">{protocol.ems.pulseDurationUs} µs</p>
              </div>

              <div className="bg-[#f7faf9] p-3 rounded-xl border border-teal-50">
                <span className="text-gray-500 font-semibold">{isArabic ? 'مدة الجلسة (Duration)' : 'Duration'}</span>
                <p className="text-lg font-black text-[#0d5e5e]">{protocol.ems.sessionDurationMin} {isArabic ? 'دقيقة' : 'min'}</p>
              </div>
            </div>

            <div className="text-xs text-gray-500 font-medium">
              <span className="font-bold text-[#14292b]">{isArabic ? 'فروع العصب المغطاة بالقناع:' : 'Targeted branches:'} </span>
              {protocol.ems.targetBranches.join('، ')}
            </div>
          </div>

          {/* Low-Level Laser Therapy (LLLT) Card */}
          <div className="bg-white rounded-2xl p-5 border border-teal-100 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-rose-600 font-extrabold text-base">
              <Sparkles className="w-5 h-5 text-rose-500" />
              <span>{isArabic ? 'الليزر البارد منخفض الشدة (LLLT)' : 'Low-Level Laser Photobiomodulation'}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#fff8f8] p-3 rounded-xl border border-rose-50">
                <span className="text-gray-500 font-semibold">{isArabic ? 'الطول الموجي' : 'Wavelength'}</span>
                <p className="text-lg font-black text-rose-700">{protocol.laser.wavelengthNm} nm</p>
              </div>

              <div className="bg-[#fff8f8] p-3 rounded-xl border border-rose-50">
                <span className="text-gray-500 font-semibold">{isArabic ? 'كثافة الطاقة (Energy)' : 'Energy Density'}</span>
                <p className="text-lg font-black text-rose-700">{protocol.laser.energyJcm2} J/cm²</p>
              </div>

              <div className="bg-[#fff8f8] p-3 rounded-xl border border-rose-50">
                <span className="text-gray-500 font-semibold">{isArabic ? 'القدرة (Power)' : 'Power Density'}</span>
                <p className="text-lg font-black text-rose-700">{protocol.laser.powerDensitymW} mW</p>
              </div>

              <div className="bg-[#fff8f8] p-3 rounded-xl border border-rose-50">
                <span className="text-gray-500 font-semibold">{isArabic ? 'مدة التشغيل' : 'Duration'}</span>
                <p className="text-lg font-black text-rose-700">{protocol.laser.durationMin} {isArabic ? 'دقيقة' : 'min'}</p>
              </div>
            </div>

            <div className="text-xs text-gray-500 font-medium">
              <span className="font-bold text-[#14292b]">{isArabic ? 'مصفوفة بواعث الليزر بالقناع:' : 'Active emitters:'} </span>
              {isArabic ? `${protocol.laser.activePointsCount} باعث ليزر/LED وفق الشكل (6)` : `${protocol.laser.activePointsCount} laser points as per Fig (6)`}
            </div>
          </div>

        </div>

        {/* Clinical Recommendations list */}
        <div className="space-y-2 pt-2">
          <h4 className="text-sm font-extrabold text-[#14292b]">
            {isArabic ? 'توصيات الطبيب المعالج والبروتوكول الإضافي:' : 'Clinical Recommendations & Protocol:'}
          </h4>
          <ul className="space-y-1.5 text-xs sm:text-sm text-gray-600">
            {(isArabic ? protocol.clinicalRecommendationsAr : protocol.clinicalRecommendationsEn).map((rec, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0d7679] mt-2 shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Exercise-by-Exercise Results Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-teal-100 shadow-sm space-y-4">
        <h3 className="text-xl font-extrabold text-[#14292b]">
          {isArabic ? 'تفاصيل نتائج التمارين الخمسة أمام الكاميرا' : '5 Camera Exercises Breakdown'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {exerciseResults.map((result) => {
            const exInfo = CLINICAL_EXERCISES.find((e) => e.id === result.exerciseId);
            if (!exInfo) return null;

            return (
              <div key={result.exerciseId} className="bg-[#f7faf9] rounded-2xl p-4 border border-teal-100/70 space-y-3">
                
                {/* Exercise snapshot if available */}
                {result.snapshotUrl ? (
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-gray-900 border border-teal-200">
                    <img src={result.snapshotUrl} alt={exInfo.nameAr} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-xl bg-teal-100/60 flex items-center justify-center text-[#0d7679] font-bold text-xs">
                    {isArabic ? exInfo.nameAr : exInfo.nameEn}
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-black text-[#14292b]">
                    {isArabic ? exInfo.nameAr : exInfo.nameEn}
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    {isArabic ? exInfo.targetMuscleAr : exInfo.targetMuscleEn}
                  </p>
                </div>

                {/* Symmetry Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-gray-500">{isArabic ? 'التناظر' : 'Symmetry'}</span>
                    <span className="text-[#0d7679]">{result.symmetryScore}%</span>
                  </div>
                  <div className="w-full bg-teal-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0d7679] h-full rounded-full"
                      style={{ width: `${result.symmetryScore}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 pt-1 border-t border-teal-100/50">
                  <span>{isArabic ? `اليمين: ${result.rightMovement}%` : `R: ${result.rightMovement}%`}</span>
                  <span>{isArabic ? `اليسار: ${result.leftMovement}%` : `L: ${result.leftMovement}%`}</span>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
