/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroHome } from './components/HeroHome';
import { AuthView } from './components/AuthView';
import { FacialAssessment } from './components/FacialAssessment';
import { DiagnosticReport } from './components/DiagnosticReport';
import { ArduinoConnector } from './components/ArduinoConnector';
import { PatientRegistry } from './components/PatientRegistry';
import { PatentMaskViewer } from './components/PatentMaskViewer';
import { arduinoService } from './services/arduinoService';
import { generateTherapeuticProtocol } from './services/assessmentService';
import { 
  ArduinoConnectionStatus, 
  AssessmentReport, 
  ConnectionType, 
  ExerciseResult, 
  Language 
} from './types';

// Default initial clinical assessment report so the user can immediately test
// the Arduino connection and see the full report right away!
const INITIAL_DEMO_REPORT: AssessmentReport = {
  id: 'RPT-2026-1030',
  date: new Date().toISOString(),
  patientName: 'أحمد عبد الله القحطاني',
  patientId: 'PT-1042',
  patientAge: 42,
  patientGender: 'male',
  doctorName: 'د. محمد أحمد',
  exerciseResults: [
    {
      exerciseId: 'eyebrows',
      symmetryScore: 65,
      leftMovement: 45,
      rightMovement: 90,
      affectedSide: 'left',
      completedAt: new Date().toISOString(),
    },
    {
      exerciseId: 'eyes',
      symmetryScore: 70,
      leftMovement: 50,
      rightMovement: 92,
      affectedSide: 'left',
      completedAt: new Date().toISOString(),
    },
    {
      exerciseId: 'smile',
      symmetryScore: 58,
      leftMovement: 38,
      rightMovement: 95,
      affectedSide: 'left',
      completedAt: new Date().toISOString(),
    },
    {
      exerciseId: 'cheeks',
      symmetryScore: 62,
      leftMovement: 42,
      rightMovement: 88,
      affectedSide: 'left',
      completedAt: new Date().toISOString(),
    },
    {
      exerciseId: 'lips',
      symmetryScore: 68,
      leftMovement: 48,
      rightMovement: 90,
      affectedSide: 'left',
      completedAt: new Date().toISOString(),
    },
  ],
  protocol: generateTherapeuticProtocol([
    {
      exerciseId: 'eyebrows',
      symmetryScore: 65,
      leftMovement: 45,
      rightMovement: 90,
      affectedSide: 'left',
      completedAt: new Date().toISOString(),
    },
    {
      exerciseId: 'eyes',
      symmetryScore: 70,
      leftMovement: 50,
      rightMovement: 92,
      affectedSide: 'left',
      completedAt: new Date().toISOString(),
    },
    {
      exerciseId: 'smile',
      symmetryScore: 58,
      leftMovement: 38,
      rightMovement: 95,
      affectedSide: 'left',
      completedAt: new Date().toISOString(),
    },
    {
      exerciseId: 'cheeks',
      symmetryScore: 62,
      leftMovement: 42,
      rightMovement: 88,
      affectedSide: 'left',
      completedAt: new Date().toISOString(),
    },
    {
      exerciseId: 'lips',
      symmetryScore: 68,
      leftMovement: 48,
      rightMovement: 90,
      affectedSide: 'left',
      completedAt: new Date().toISOString(),
    },
  ]),
  notes: 'المريض يعاني من شلل العصب السابع المحيطي (Bell\'s Palsy) في الجهة اليسرى منذ 12 يوماً. يستجيب جيداً للتحفيز الكهربائي والليزر بالقناع الذكي.',
};

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [currentTab, setCurrentTab] = useState<
    'home' | 'assessment' | 'report' | 'arduino' | 'patients' | 'auth' | 'patent_mask'
  >('home');
  const [doctorName, setDoctorName] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem('auth_doctor');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.name || null;
      }
    } catch (e) {}
    return 'د. محمد أحمد';
  });
  const [activeReport, setActiveReport] = useState<AssessmentReport>(INITIAL_DEMO_REPORT);
  const [arduinoStatus, setArduinoStatus] = useState<ArduinoConnectionStatus>(arduinoService.getStatus());
  const [connectionType, setConnectionType] = useState<ConnectionType>(arduinoService.getConnectionType());
  const [activePatientName, setActivePatientName] = useState<string>('أحمد عبد الله القحطاني');

  // Sync RTL and lang attribute with html element
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Subscribe to Arduino status
  useEffect(() => {
    const unsub = arduinoService.onStatusChange((status) => {
      setArduinoStatus(status);
      setConnectionType(arduinoService.getConnectionType());
    });
    return () => unsub();
  }, []);

  const handleAssessmentComplete = (results: ExerciseResult[]) => {
    const protocol = generateTherapeuticProtocol(results);
    const newReport: AssessmentReport = {
      id: `RPT-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      patientName: activePatientName,
      patientId: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
      patientAge: 35,
      patientGender: 'male',
      doctorName: doctorName || (lang === 'ar' ? 'د. محمد أحمد' : 'Dr. Mohammed Ahmed'),
      exerciseResults: results,
      protocol,
    };
    setActiveReport(newReport);
    setCurrentTab('report');
  };

  const handleStartExamForPatient = (patient: any) => {
    setActivePatientName(patient.name);
    setCurrentTab('assessment');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f8f7] text-[#14292b]">
      
      {/* Header matching user screenshots */}
      <Header
        currentTab={currentTab as any}
        setCurrentTab={setCurrentTab as any}
        lang={lang}
        setLang={setLang}
        arduinoStatus={arduinoStatus}
        connectionType={connectionType}
        onOpenArduinoModal={() => setCurrentTab('arduino')}
        doctorName={doctorName}
        onLogout={() => setDoctorName(null)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HeroHome
            lang={lang}
            onStartExam={() => setCurrentTab('assessment')}
            onViewPatients={() => setCurrentTab('patients')}
            onOpenArduino={() => setCurrentTab('arduino')}
            onViewPatentMask={() => setCurrentTab('patent_mask')}
            arduinoStatus={arduinoStatus}
          />
        )}

        {currentTab === 'assessment' && (
          <FacialAssessment
            lang={lang}
            onComplete={handleAssessmentComplete}
            onCancel={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'report' && (
          <DiagnosticReport
            lang={lang}
            report={activeReport}
            onRetakeExam={() => setCurrentTab('assessment')}
            onOpenArduino={() => setCurrentTab('arduino')}
            onSaveToRegistry={() => setCurrentTab('patients')}
          />
        )}

        {currentTab === 'arduino' && (
          <ArduinoConnector
            lang={lang}
            onViewPatentMask={() => setCurrentTab('patent_mask')}
          />
        )}

        {currentTab === 'patients' && (
          <PatientRegistry
            lang={lang}
            onSelectPatient={(p) => handleStartExamForPatient(p)}
            onStartExamForPatient={(p) => handleStartExamForPatient(p)}
          />
        )}

        {currentTab === 'auth' && (
          <AuthView
            lang={lang}
            onLoginSuccess={(name, email) => {
              setDoctorName(name);
              setCurrentTab('home');
            }}
            onClose={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'patent_mask' && (
          <PatentMaskViewer
            lang={lang}
            onOpenArduino={() => setCurrentTab('arduino')}
            onBack={() => setCurrentTab('home')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-teal-100 py-6 px-4 text-center text-xs text-gray-500 space-y-2">
        <p className="font-semibold text-gray-600">
          {lang === 'ar'
            ? 'منظومة تقييم العصب الوجهي والتحكم بالقناع العلاجي الذكي للأردوينو'
            : 'Facial Nerve AI Assessment & Arduino Smart Mask Controller'}
        </p>
        <p className="text-[11px] text-gray-400">
          {lang === 'ar'
            ? 'متوافق مع براءة الاختراع (الأشكال 1، 2، 3، 6) ومكتبات Web Serial API و Bluetooth BLE'
            : 'Compatible with Patent Figures (1, 2, 3, 6) & Web Serial / Bluetooth BLE'}
        </p>
      </footer>

    </div>
  );
}
