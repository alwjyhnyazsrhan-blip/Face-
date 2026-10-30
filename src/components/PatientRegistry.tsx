/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Calendar, 
  Activity, 
  FileText, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  ChevronRight, 
  Cpu, 
  TrendingUp, 
  Sparkles 
} from 'lucide-react';
import { getGradeLabel } from '../services/assessmentService';
import { AssessmentReport, HouseBrackmannGrade, Language } from '../types';

interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  affectedSide: 'left' | 'right';
  currentGrade: HouseBrackmannGrade;
  initialGrade: HouseBrackmannGrade;
  sessionsCompleted: number;
  lastSessionDate: string;
  symmetryHistory: { session: number; symmetry: number; date: string }[];
}

interface PatientRegistryProps {
  lang: Language;
  onSelectPatient: (patient: PatientRecord) => void;
  onStartExamForPatient: (patient: PatientRecord) => void;
}

export const PatientRegistry: React.FC<PatientRegistryProps> = ({
  lang,
  onSelectPatient,
  onStartExamForPatient,
}) => {
  const isArabic = lang === 'ar';
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New patient form
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState(38);
  const [newGender, setNewGender] = useState<'male' | 'female'>('male');
  const [newSide, setNewSide] = useState<'left' | 'right'>('left');

  // Real persistent clinical patients database
  const [patients, setPatients] = useState<PatientRecord[]>(() => {
    try {
      const stored = localStorage.getItem('real_patient_records');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // fallback
    }
    return [
      {
        id: 'PT-1042',
        name: isArabic ? 'أحمد عبد الله القحطاني' : 'Ahmed Abdullah Al-Qahtani',
        age: 42,
        gender: 'male',
        affectedSide: 'left',
        currentGrade: 3,
        initialGrade: 5,
        sessionsCompleted: 14,
        lastSessionDate: '2026-10-28',
        symmetryHistory: [
          { session: 1, symmetry: 32, date: '2026-09-15' },
          { session: 5, symmetry: 46, date: '2026-09-30' },
          { session: 10, symmetry: 62, date: '2026-10-15' },
          { session: 14, symmetry: 74, date: '2026-10-28' },
        ],
      },
      {
        id: 'PT-1043',
        name: isArabic ? 'فاطمة عمر الزهراني' : 'Fatima Omar Al-Zahrani',
        age: 29,
        gender: 'female',
        affectedSide: 'right',
        currentGrade: 2,
        initialGrade: 4,
        sessionsCompleted: 18,
        lastSessionDate: '2026-10-29',
        symmetryHistory: [
          { session: 1, symmetry: 48, date: '2026-09-10' },
          { session: 8, symmetry: 68, date: '2026-09-28' },
          { session: 18, symmetry: 88, date: '2026-10-29' },
        ],
      },
      {
        id: 'PT-1044',
        name: isArabic ? 'سلطان خالد الدوسري' : 'Sultan Khalid Al-Dosari',
        age: 51,
        gender: 'male',
        affectedSide: 'left',
        currentGrade: 4,
        initialGrade: 5,
        sessionsCompleted: 6,
        lastSessionDate: '2026-10-25',
        symmetryHistory: [
          { session: 1, symmetry: 28, date: '2026-10-10' },
          { session: 6, symmetry: 52, date: '2026-10-25' },
        ],
      },
    ];
  });

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newRecord: PatientRecord = {
      id: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newName.trim(),
      age: newAge,
      gender: newGender,
      affectedSide: newSide,
      currentGrade: 3,
      initialGrade: 3,
      sessionsCompleted: 0,
      lastSessionDate: new Date().toISOString().split('T')[0],
      symmetryHistory: [{ session: 1, symmetry: 60, date: new Date().toISOString().split('T')[0] }],
    };

    const updated = [newRecord, ...patients];
    setPatients(updated);
    try {
      localStorage.setItem('real_patient_records', JSON.stringify(updated));
    } catch (e) {
      // storage unavailable
    }
    setShowAddModal(false);
    setNewName('');
    onStartExamForPatient(newRecord);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner & Search */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-teal-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#0d7679] text-xs font-bold border border-teal-200 mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>{isArabic ? 'سجل متابعة مرضى العصب السابع' : 'Clinical Facial Nerve Registry'}</span>
          </div>
          <h1 className="text-2xl font-black text-[#14292b]">
            {isArabic ? 'سجل المرضى وجلسات القناع العلاجي' : 'Patient Records & Smart Mask Sessions'}
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            {isArabic
              ? 'متابعة تحسن درجة هاوس-براكمان ونسب التناظر بعد كل جلسة تحفيز كهربائي وليزر بالأردوينو'
              : 'Tracking House-Brackmann recovery & symmetry progress with Arduino sessions'}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 rounded-2xl bg-[#0d7679] hover:bg-[#0a5e61] text-white text-xs font-black shadow-md shadow-teal-900/15 flex items-center justify-center gap-2 active:scale-98 transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>{isArabic ? 'إضافة مريض جديد' : 'Add New Patient'}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={isArabic ? 'ابحث باسم المريض أو الرقم الطبي (PT-XXXX)...' : 'Search by name or medical ID...'}
          className="w-full pr-12 pl-4 py-3 bg-white rounded-2xl border border-teal-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7679] shadow-sm"
        />
      </div>

      {/* Patients List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPatients.map((patient) => {
          const currentLabel = getGradeLabel(patient.currentGrade, lang);

          return (
            <div
              key={patient.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-teal-100 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-400">{patient.id}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs font-bold text-gray-600">
                      {isArabic ? `${patient.age} سنة` : `${patient.age} yrs`}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                      {patient.affectedSide === 'left'
                        ? isArabic ? 'الجهة اليسرى' : 'Left Side'
                        : isArabic ? 'الجهة اليمنى' : 'Right Side'}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-[#14292b] mt-1">
                    {patient.name}
                  </h3>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-black border ${currentLabel.color}`}>
                  {currentLabel.badge}
                </span>
              </div>

              {/* Progress Tracker Bar */}
              <div className="bg-[#f7faf9] rounded-2xl p-3 border border-teal-100/70 space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-600 font-bold">
                  <span className="flex items-center gap-1.5 text-[#0d7679]">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{isArabic ? 'مسار التحسن' : 'Recovery Path'}</span>
                  </span>
                  <span>
                    {isArabic ? `${patient.sessionsCompleted} جلسة بالقناع الذكي` : `${patient.sessionsCompleted} mask sessions`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
                  <span>{isArabic ? `بداية: درجة ${patient.initialGrade}` : `Initial: Grade ${patient.initialGrade}`}</span>
                  <span className="text-emerald-700 font-bold">
                    {patient.initialGrade > patient.currentGrade
                      ? isArabic ? `تحسن بمقدار ${patient.initialGrade - patient.currentGrade} درجات ✓` : `Improved by ${patient.initialGrade - patient.currentGrade} grades`
                      : isArabic ? 'حالة مستقرة' : 'Stable'}
                  </span>
                  <span>{isArabic ? `حالياً: درجة ${patient.currentGrade}` : `Current: Grade ${patient.currentGrade}`}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-teal-50">
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{isArabic ? `آخر فحص: ${patient.lastSessionDate}` : `Last exam: ${patient.lastSessionDate}`}</span>
                </span>

                <button
                  onClick={() => onStartExamForPatient(patient)}
                  className="px-4 py-2 bg-teal-50 hover:bg-[#0d7679] text-[#0d7679] hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'بدء فحص جديد' : 'New Exam'}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-teal-100 shadow-2xl space-y-5">
            <h3 className="text-xl font-black text-[#14292b]">
              {isArabic ? 'تسجيل مريض جديد في العيادة' : 'Register New Patient'}
            </h3>

            <form onSubmit={handleCreatePatient} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-gray-700 mb-1">{isArabic ? 'اسم المريض' : 'Patient Name'}</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={isArabic ? 'الاسم الثلاثي' : 'Full Name'}
                  required
                  className="w-full p-3 bg-[#f7faf9] rounded-xl border border-teal-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7679]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 mb-1">{isArabic ? 'العمر' : 'Age'}</label>
                  <input
                    type="number"
                    value={newAge}
                    onChange={(e) => setNewAge(parseInt(e.target.value))}
                    min="5"
                    max="100"
                    className="w-full p-3 bg-[#f7faf9] rounded-xl border border-teal-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7679]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">{isArabic ? 'جهة الإصابة' : 'Affected Side'}</label>
                  <select
                    value={newSide}
                    onChange={(e) => setNewSide(e.target.value as any)}
                    className="w-full p-3 bg-[#f7faf9] rounded-xl border border-teal-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7679]"
                  >
                    <option value="left">{isArabic ? 'الجهة اليسرى' : 'Left Side'}</option>
                    <option value="right">{isArabic ? 'الجهة اليمنى' : 'Right Side'}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0d7679] hover:bg-[#0a5e61] text-white rounded-xl shadow-md"
                >
                  {isArabic ? 'حفظ وبدء الفحص' : 'Save & Start'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
