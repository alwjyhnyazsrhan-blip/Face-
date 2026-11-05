/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Calendar, 
  Activity, 
  Database, 
  Cloud, 
  CloudCheck, 
  Trash2, 
  LogIn, 
  LogOut, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  Zap, 
  FileText,
  ShieldCheck
} from 'lucide-react';
import { getGradeLabel } from '../services/assessmentService';
import { HouseBrackmannGrade, Language, DbPatient, DbTherapySession } from '../types';
import { 
  getPatients, 
  savePatient, 
  deletePatient, 
  subscribeToPatients, 
  loginWithGoogle, 
  logoutUser, 
  subscribeToAuth,
  getTherapySessions,
  saveTherapySession
} from '../services/dbService';
import { auth } from '../lib/firebase';
import { User } from 'firebase/auth';

interface PatientRecord extends DbPatient {
  currentGrade: HouseBrackmannGrade;
  initialGrade: HouseBrackmannGrade;
  sessionsCompleted: number;
  lastSessionDate: string;
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
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedPatientForSession, setSelectedPatientForSession] = useState<PatientRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'patients' | 'sessions'>('patients');
  const [therapySessions, setTherapySessions] = useState<DbTherapySession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'syncing' | 'offline'>('connected');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New patient form fields
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState(38);
  const [newGender, setNewGender] = useState<'male' | 'female' | 'other'>('male');
  const [newSide, setNewSide] = useState<'left' | 'right' | 'bilateral'>('left');
  const [newNotes, setNewNotes] = useState('');
  const [newHB, setNewHB] = useState<number>(3);

  // New session form fields
  const [sessionProtocol, setSessionProtocol] = useState('acute_bells_palsy');
  const [sessionDuration, setSessionDuration] = useState(20);
  const [sessionTensMa, setSessionTensMa] = useState(12);
  const [sessionLaserJoule, setSessionLaserJoule] = useState(4.5);
  const [sessionSymmetryBefore, setSessionSymmetryBefore] = useState(55);
  const [sessionSymmetryAfter, setSessionSymmetryAfter] = useState(68);
  const [sessionNotes, setSessionNotes] = useState('');

  // Patients state
  const [patients, setPatients] = useState<PatientRecord[]>(() => {
    try {
      const stored = localStorage.getItem('real_patient_records_v3');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });

  // Track Firebase Auth state
  useEffect(() => {
    const unsub = subscribeToAuth((user) => {
      setCurrentUser(user);
      if (user) {
        setDbStatus('syncing');
        // Fetch or subscribe to real Firestore data
        try {
          const unsubPatients = subscribeToPatients((cloudPatients) => {
            const mapped: PatientRecord[] = cloudPatients.map((cp) => ({
              ...cp,
              currentGrade: (cp.houseBrackmannScale || 3) as HouseBrackmannGrade,
              initialGrade: (cp.houseBrackmannScale || 3) as HouseBrackmannGrade,
              sessionsCompleted: 0,
              lastSessionDate: cp.createdAt.split('T')[0],
            }));
            setPatients(mapped);
            setDbStatus('connected');
            try {
              localStorage.setItem('real_patient_records_v3', JSON.stringify(mapped));
            } catch (e) {}
          });

          // Fetch sessions
          getTherapySessions().then((sess) => {
            setTherapySessions(sess);
          }).catch(() => {});

          return () => unsubPatients();
        } catch (err) {
          console.error(err);
          setDbStatus('offline');
        }
      } else {
        setDbStatus('connected');
      }
    });

    return () => unsub();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await loginWithGoogle();
      setDbStatus('connected');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(isArabic ? 'حدث خطأ أثناء تسجيل الدخول عبر Google' : 'Error signing in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const patientId = `PT-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const newPatientRecord: PatientRecord = {
      id: patientId,
      ownerId: currentUser?.uid || 'local_clinician',
      name: newName.trim(),
      age: newAge,
      gender: newGender,
      affectedSide: newSide,
      onsetDays: 7,
      houseBrackmannScale: newHB,
      sunnybrookScore: Math.max(10, 100 - (newHB - 1) * 18),
      notes: newNotes.trim() || undefined,
      currentGrade: newHB as HouseBrackmannGrade,
      initialGrade: newHB as HouseBrackmannGrade,
      sessionsCompleted: 0,
      lastSessionDate: nowIso.split('T')[0],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Save to Firestore if authenticated
    if (currentUser) {
      setDbStatus('syncing');
      try {
        await savePatient(newPatientRecord);
        setDbStatus('connected');
      } catch (err: any) {
        console.error('Firestore save failed:', err);
        setErrorMessage(isArabic ? 'تعذر الحفظ في قاعدة البيانات السحابية' : 'Failed to save to cloud database');
      }
    }

    const updated = [newPatientRecord, ...patients];
    setPatients(updated);
    try {
      localStorage.setItem('real_patient_records_v3', JSON.stringify(updated));
    } catch (e) {}

    setShowAddModal(false);
    setNewName('');
    setNewNotes('');
    onStartExamForPatient(newPatientRecord);
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا المريض وسجلاته؟' : 'Are you sure you want to delete this patient record?')) {
      return;
    }

    if (currentUser) {
      try {
        await deletePatient(patientId);
      } catch (err) {
        console.error('Failed to delete from Firestore:', err);
      }
    }

    const updated = patients.filter((p) => p.id !== patientId);
    setPatients(updated);
    try {
      localStorage.setItem('real_patient_records_v3', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleOpenAddSession = (patient: PatientRecord) => {
    setSelectedPatientForSession(patient);
    setShowSessionModal(true);
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForSession) return;

    const sessionId = `SES-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    const newSession: DbTherapySession = {
      id: sessionId,
      patientId: selectedPatientForSession.id,
      userId: currentUser?.uid || 'local_clinician',
      sessionDate: nowIso,
      durationMinutes: sessionDuration,
      protocol: sessionProtocol,
      targetBranches: ['temporal', 'zygomatic', 'buccal'],
      motorPoints: [0, 2, 4, 6],
      tensIntensityMa: sessionTensMa,
      laserDoseJoule: sessionLaserJoule,
      facialSymmetryBefore: sessionSymmetryBefore,
      facialSymmetryAfter: sessionSymmetryAfter,
      notes: sessionNotes.trim() || undefined,
      createdAt: nowIso,
    };

    if (currentUser) {
      try {
        await saveTherapySession(newSession);
        const refreshed = await getTherapySessions();
        setTherapySessions(refreshed);
      } catch (err) {
        console.error('Failed to save session to Firestore:', err);
      }
    } else {
      setTherapySessions([newSession, ...therapySessions]);
    }

    // Update patient sessions count
    const updated = patients.map((p) => {
      if (p.id === selectedPatientForSession.id) {
        return {
          ...p,
          sessionsCompleted: p.sessionsCompleted + 1,
          lastSessionDate: nowIso.split('T')[0],
        };
      }
      return p;
    });
    setPatients(updated);
    try {
      localStorage.setItem('real_patient_records_v3', JSON.stringify(updated));
    } catch (e) {}

    setShowSessionModal(false);
    setSelectedPatientForSession(null);
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner & Search */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-teal-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#0d7679] text-xs font-bold border border-teal-200 mb-1">
            <Database className="w-3.5 h-3.5" />
            <span>{isArabic ? 'قاعدة بيانات سحابية مفعلة (Cloud Firestore)' : 'Cloud Firestore Database Active'}</span>
          </div>
          <h1 className="text-2xl font-black text-[#14292b]">
            {isArabic ? 'سجل المرضى وجلسات القناع العلاجي' : 'Patient Records & Smart Mask Sessions'}
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            {isArabic
              ? 'مزامنة وحفظ سحابي فوري لسجلات المرضى، جلسات التحفيز الكهربائي، والتقييمات السريرية'
              : 'Real-time cloud synchronization for patient profiles, TENS/laser sessions, and clinical evaluations'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 px-3 py-2 rounded-2xl">
              <div className="w-7 h-7 rounded-full bg-[#0d7679] text-white flex items-center justify-center font-bold text-xs">
                {currentUser.displayName ? currentUser.displayName[0] : 'U'}
              </div>
              <div className="text-left text-xs">
                <p className="font-bold text-gray-800 leading-tight">{currentUser.displayName || 'طبيب معتمد'}</p>
                <p className="text-[10px] text-teal-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />
                  <span>{isArabic ? 'سحابي متصل' : 'Cloud Synced'}</span>
                </p>
              </div>
              <button
                onClick={handleGoogleLogout}
                title={isArabic ? 'تسجيل الخروج' : 'Sign Out'}
                className="p-1 hover:bg-teal-100 text-gray-500 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-teal-50 text-[#0d7679] border border-teal-200 text-xs font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>{isArabic ? 'تسجيل دخول Google للمزامنة' : 'Sign in with Google'}</span>
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-[#0d7679] hover:bg-[#0a5e61] text-white text-xs font-black shadow-md shadow-teal-900/15 flex items-center justify-center gap-2 active:scale-98 transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isArabic ? 'إضافة مريض جديد' : 'Add New Patient'}</span>
          </button>
        </div>
      </div>

      {/* Cloud Database Status Card */}
      <div className="bg-gradient-to-r from-teal-900 to-[#0d5e5e] rounded-3xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <Cloud className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm">
                {isArabic ? 'حالة قاعدة البيانات (Firestore Database)' : 'Database State (Firestore)'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-400/30">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-teal-100/80 mt-0.5">
              {currentUser 
                ? (isArabic ? `مرتبط بحساب: ${currentUser.email} • التشفير وZero-Trust مفعل` : `Linked to: ${currentUser.email} • Zero-Trust active`)
                : (isArabic ? 'قاعدة البيانات جاهزة ومجهزة • يمكنك تسجيل الدخول بحساب Google لحفظ السجلات تحت هويتك السريرية' : 'Database ready • Sign in with Google to isolate records under your identity')
              }
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-black/20 p-1 rounded-2xl self-start sm:self-center">
          <button
            onClick={() => setActiveTab('patients')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'patients' ? 'bg-white text-[#0d7679] shadow-sm' : 'text-teal-200 hover:text-white'
            }`}
          >
            {isArabic ? `المرضى (${patients.length})` : `Patients (${patients.length})`}
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'sessions' ? 'bg-white text-[#0d7679] shadow-sm' : 'text-teal-200 hover:text-white'
            }`}
          >
            {isArabic ? `جلسات القناع (${therapySessions.length})` : `Sessions (${therapySessions.length})`}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold p-3 rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Tab Content */}
      {activeTab === 'patients' ? (
        <>
          {/* Search Bar */}
          {patients.length > 0 && (
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
          )}

          {/* Patients List Grid or Clean Empty State */}
          {patients.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 sm:p-14 border border-teal-100 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-teal-50 text-[#0d7679] flex items-center justify-center mx-auto border border-teal-100">
                <Users className="w-8 h-8 stroke-[1.8]" />
              </div>
              <h3 className="text-xl font-bold text-[#14292b]">
                {isArabic ? 'لا توجد بيانات مرضى مسجلة في قاعدة البيانات' : 'No Patient Records in Database Yet'}
              </h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                {isArabic
                  ? 'قاعدة البيانات السحابية جاهزة لحفظ بيانات مرضى العصب السابع. انقر على زر "إضافة مريض جديد" لتسجيل أول مريض ومزامنته فورياً.'
                  : 'Cloud database is ready to store facial nerve records. Click "Add New Patient" to register and sync.'}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 rounded-2xl bg-[#0d7679] hover:bg-[#0a5e61] text-white text-xs font-black shadow-md shadow-teal-900/15 inline-flex items-center gap-2 active:scale-98 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isArabic ? 'إضافة مريض جديد الآن' : 'Add Patient Now'}</span>
              </button>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-teal-100 text-center text-sm text-gray-500 font-bold">
              {isArabic ? 'لم يتم العثور على نتائج تطابق البحث' : 'No matching patient records found'}
            </div>
          ) : (
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
                        {patient.notes && (
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{patient.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-black border ${currentLabel.color}`}>
                          {currentLabel.badge}
                        </span>
                        <button
                          onClick={() => handleDeletePatient(patient.id)}
                          title={isArabic ? 'حذف من قاعدة البيانات' : 'Delete from database'}
                          className="p-1.5 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Tracker Bar */}
                    <div className="bg-[#f7faf9] rounded-2xl p-3 border border-teal-100/70 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-gray-600 font-bold">
                        <span className="flex items-center gap-1.5 text-[#0d7679]">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>{isArabic ? 'سجل التعافي' : 'Recovery Path'}</span>
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
                      <button
                        onClick={() => handleOpenAddSession(patient)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isArabic ? 'تسجيل جلسة قناع' : 'Log Mask Session'}</span>
                      </button>

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
          )}
        </>
      ) : (
        /* Sessions Tab */
        <div className="space-y-4">
          {therapySessions.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-teal-100 text-center space-y-3">
              <Zap className="w-12 h-12 text-amber-500 mx-auto" />
              <h3 className="text-lg font-bold text-gray-800">
                {isArabic ? 'لا توجد جلسات قناع علاجية مسجلة حتى الآن' : 'No mask therapy sessions logged yet'}
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {isArabic ? 'يمكنك تسجيل جلسات تحفيز العصب الوجهي والليزر من بطاقة كل مريض.' : 'Log facial nerve stimulation & laser sessions directly from each patient card.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {therapySessions.map((session) => (
                <div key={session.id} className="bg-white rounded-3xl p-5 border border-teal-100 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-gray-400">{session.id}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-[#0d7679] text-xs font-bold border border-teal-200">
                      {session.protocol}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <span className="text-gray-400 block text-[10px]">{isArabic ? 'المدة' : 'Duration'}</span>
                      <span className="font-bold text-gray-800">{session.durationMinutes} دقيقة</span>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-xl text-amber-900">
                      <span className="text-amber-700 block text-[10px]">{isArabic ? 'التيار (TENS)' : 'Current'}</span>
                      <span className="font-bold">{session.tensIntensityMa} mA</span>
                    </div>
                    <div className="bg-rose-50 p-2 rounded-xl text-rose-900">
                      <span className="text-rose-700 block text-[10px]">{isArabic ? 'جرعة الليزر' : 'Laser'}</span>
                      <span className="font-bold">{session.laserDoseJoule} J</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2">
                    <span>{isArabic ? `التناظر: ${session.facialSymmetryBefore}% ➔ ${session.facialSymmetryAfter}%` : `Symmetry: ${session.facialSymmetryBefore}% ➔ ${session.facialSymmetryAfter}%`}</span>
                    <span className="text-[11px] font-mono">{session.sessionDate.split('T')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-teal-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-teal-50">
              <div className="flex items-center gap-2 text-[#0d7679]">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-black text-base text-[#14292b]">
                  {isArabic ? 'تسجيل مريض جديد في قاعدة البيانات' : 'Register New Patient to Database'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isArabic ? 'اسم المريض الثلاثي' : 'Patient Full Name'}
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={isArabic ? 'مثال: عبد الله أحمد السعيد' : 'e.g. John Doe'}
                  className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-teal-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7679]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isArabic ? 'العمر' : 'Age'}
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={newAge}
                    onChange={(e) => setNewAge(parseInt(e.target.value) || 30)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-teal-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7679]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isArabic ? 'الجنس' : 'Gender'}
                  </label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-teal-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7679]"
                  >
                    <option value="male">{isArabic ? 'ذكر' : 'Male'}</option>
                    <option value="female">{isArabic ? 'أنثى' : 'Female'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isArabic ? 'جهة شلل العصب السابع المصابة' : 'Affected Facial Nerve Side'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSide('right')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      newSide === 'right'
                        ? 'bg-[#0d7679] text-white border-[#0d7679]'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-teal-50'
                    }`}
                  >
                    {isArabic ? 'الجهة اليمنى (Right)' : 'Right Side'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSide('left')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      newSide === 'left'
                        ? 'bg-[#0d7679] text-white border-[#0d7679]'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-teal-50'
                    }`}
                  >
                    {isArabic ? 'الجهة اليسرى (Left)' : 'Left Side'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isArabic ? 'درجة هاوس-براكمان المبدئية (HB Scale)' : 'Initial House-Brackmann Grade'}
                </label>
                <select
                  value={newHB}
                  onChange={(e) => setNewHB(parseInt(e.target.value) || 3)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 rounded-xl border border-teal-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d7679]"
                >
                  <option value={1}>{isArabic ? 'الدرجة 1: طبيعي تماماً' : 'Grade 1: Normal'}</option>
                  <option value={2}>{isArabic ? 'الدرجة 2: خلل وظيفي طفيف' : 'Grade 2: Mild'}</option>
                  <option value={3}>{isArabic ? 'الدرجة 3: خلل وظيفي متوسط' : 'Grade 3: Moderate'}</option>
                  <option value={4}>{isArabic ? 'الدرجة 4: خلل وظيفي شديد نسبياً' : 'Grade 4: Moderately Severe'}</option>
                  <option value={5}>{isArabic ? 'الدرجة 5: شلل شديد' : 'Grade 5: Severe'}</option>
                  <option value={6}>{isArabic ? 'الدرجة 6: شلل كامل' : 'Grade 6: Total Paralysis'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isArabic ? 'ملاحظات سريرية (اختياري)' : 'Clinical Notes (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder={isArabic ? 'تاريخ بداية الإصابة، تاريخ مرضي، أدوية كورتيزون...' : 'Onset date, medical history...'}
                  className="w-full px-3.5 py-2 bg-gray-50 rounded-xl border border-teal-100 text-xs focus:outline-none focus:ring-2 focus:ring-[#0d7679]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-teal-50">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0d7679] hover:bg-[#0a5e61] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isArabic ? 'حفظ في قاعدة البيانات وبدء الفحص' : 'Save to DB & Start Exam'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Session Modal */}
      {showSessionModal && selectedPatientForSession && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-teal-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-teal-50">
              <div className="flex items-center gap-2 text-[#0d7679]">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-base text-[#14292b]">
                  {isArabic ? `تسجيل جلسة قناع: ${selectedPatientForSession.name}` : `Log Session for ${selectedPatientForSession.name}`}
                </h3>
              </div>
              <button
                onClick={() => setShowSessionModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isArabic ? 'البروتوكول العلاجي' : 'Therapeutic Protocol'}
                </label>
                <select
                  value={sessionProtocol}
                  onChange={(e) => setSessionProtocol(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 rounded-xl border border-teal-100 text-xs font-bold"
                >
                  <option value="acute_bells_palsy">{isArabic ? 'شلل بيل الحاد (Acute Bell\'s Palsy)' : 'Acute Bell\'s Palsy'}</option>
                  <option value="chronic_paralysis">{isArabic ? 'شلل مزمن وتحفيز الألياف العصبية' : 'Chronic Paralysis'}</option>
                  <option value="synkinesis_suppression">{isArabic ? 'تثبيط الحركات المصاحبة (Synkinesis)' : 'Synkinesis Suppression'}</option>
                  <option value="maintenance_rx">{isArabic ? 'جلسة وقائية داعمة' : 'Maintenance'}</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    {isArabic ? 'المدة (د)' : 'Min'}
                  </label>
                  <input
                    type="number"
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(parseInt(e.target.value) || 20)}
                    className="w-full px-2 py-1.5 bg-gray-50 rounded-xl border border-teal-100 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    {isArabic ? 'TENS (mA)' : 'TENS (mA)'}
                  </label>
                  <input
                    type="number"
                    value={sessionTensMa}
                    onChange={(e) => setSessionTensMa(parseInt(e.target.value) || 10)}
                    className="w-full px-2 py-1.5 bg-gray-50 rounded-xl border border-teal-100 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    {isArabic ? 'الليزر (J)' : 'Laser (J)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={sessionLaserJoule}
                    onChange={(e) => setSessionLaserJoule(parseFloat(e.target.value) || 4)}
                    className="w-full px-2 py-1.5 bg-gray-50 rounded-xl border border-teal-100 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    {isArabic ? 'التناظر قبل الجلسة (%)' : 'Symmetry Before (%)'}
                  </label>
                  <input
                    type="number"
                    value={sessionSymmetryBefore}
                    onChange={(e) => setSessionSymmetryBefore(parseInt(e.target.value) || 50)}
                    className="w-full px-2 py-1.5 bg-gray-50 rounded-xl border border-teal-100 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    {isArabic ? 'التناظر بعد الجلسة (%)' : 'Symmetry After (%)'}
                  </label>
                  <input
                    type="number"
                    value={sessionSymmetryAfter}
                    onChange={(e) => setSessionSymmetryAfter(parseInt(e.target.value) || 65)}
                    className="w-full px-2 py-1.5 bg-gray-50 rounded-xl border border-teal-100 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isArabic ? 'استجابة المريض والملاحظات' : 'Response & Notes'}
                </label>
                <textarea
                  rows={2}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder={isArabic ? 'تحسن حركة زاوية الفم، عدم وجود ألم...' : 'Improved mouth angle, no pain...'}
                  className="w-full px-3 py-1.5 bg-gray-50 rounded-xl border border-teal-100 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-teal-50">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  {isArabic ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'حفظ الجلسة سحابياً' : 'Save Session to Cloud'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
