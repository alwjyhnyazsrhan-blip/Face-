/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { Header } from './components/Header';
import { HeroHome } from './components/HeroHome';
import { AuthView } from './components/AuthView';
import { FacialAssessment } from './components/FacialAssessment';
import { DiagnosticReport } from './components/DiagnosticReport';
import { ArduinoConnector } from './components/ArduinoConnector';
import { PatientRegistry } from './components/PatientRegistry';
import { PatentMaskViewer } from './components/PatentMaskViewer';
import { MotorPointsTherapy } from './components/MotorPointsTherapy';
import { arduinoService } from './services/arduinoService';
import { generateTherapeuticProtocol } from './services/assessmentService';
import { 
  ArduinoConnectionStatus, 
  AssessmentReport, 
  ConnectionType, 
  ExerciseResult, 
  Language 
} from './types';

export default function App() {
  const [lang, setLang] = useState<Language>('ar');
  const [currentTab, setCurrentTab] = useState<
    'home' | 'assessment' | 'report' | 'arduino' | 'patients' | 'auth' | 'patent_mask' | 'motor_points'
  >('home');
  
  // Real authenticated doctor account - strictly null by default until doctor logs in
  const [doctorName, setDoctorName] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem('auth_doctor');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.name === 'string' && parsed.name.trim() && parsed.name !== 'د. محمد أحمد') {
          return parsed.name.trim();
        }
      }
    } catch (e) {}
    return null;
  });

  const [activeReport, setActiveReport] = useState<AssessmentReport | null>(null);
  const [arduinoStatus, setArduinoStatus] = useState<ArduinoConnectionStatus>(arduinoService.getStatus());
  const [connectionType, setConnectionType] = useState<ConnectionType>(arduinoService.getConnectionType());
  const [activePatientName, setActivePatientName] = useState<string>('');

  // Purge any legacy demo mock data or default demo doctor
  useEffect(() => {
    try {
      localStorage.removeItem('real_patient_records');
      const stored = localStorage.getItem('auth_doctor');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.name === 'د. محمد أحمد') {
          localStorage.removeItem('auth_doctor');
          setDoctorName(null);
        }
      }
    } catch (e) {}
  }, []);

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
      patientName: activePatientName || (lang === 'ar' ? 'مريض جديد' : 'New Patient'),
      patientId: `PT-${Math.floor(1000 + Math.random() * 9000)}`,
      patientAge: 35,
      patientGender: 'male',
      doctorName: doctorName || (lang === 'ar' ? 'طبيب معالج' : 'Attending Physician'),
      exerciseResults: results,
      protocol,
    };
    setActiveReport(newReport);
    setCurrentTab('report');
  };

  const [pendingTargetTab, setPendingTargetTab] = useState<
    'home' | 'assessment' | 'report' | 'arduino' | 'patients' | 'auth' | 'patent_mask' | 'motor_points' | null
  >(null);

  // Gated action handler: if not logged in, any button click routes to login first
  const requireAuthAndNavigate = (
    targetTab: 'home' | 'assessment' | 'report' | 'arduino' | 'patients' | 'auth' | 'patent_mask' | 'motor_points'
  ) => {
    if (targetTab === 'home') {
      setCurrentTab('home');
      return;
    }
    if (targetTab === 'auth') {
      setCurrentTab('auth');
      return;
    }
    // If user is not logged in, show login page and remember target
    if (!doctorName) {
      setPendingTargetTab(targetTab);
      setCurrentTab('auth');
      return;
    }
    // Already logged in: directly go to target
    setCurrentTab(targetTab);
  };

  const handleStartExamForPatient = (patient: any) => {
    setActivePatientName(patient.name);
    requireAuthAndNavigate('assessment');
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('auth_doctor');
    } catch (e) {}
    setDoctorName(null);
    setCurrentTab('home');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f8f7] text-[#14292b]">
      
      {/* Header matching user screenshots */}
      <Header
        currentTab={currentTab as any}
        setCurrentTab={(tab) => requireAuthAndNavigate(tab as any)}
        lang={lang}
        setLang={setLang}
        arduinoStatus={arduinoStatus}
        connectionType={connectionType}
        onOpenArduinoModal={() => requireAuthAndNavigate('arduino')}
        doctorName={doctorName}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HeroHome
            lang={lang}
            onStartExam={() => requireAuthAndNavigate('assessment')}
            onViewPatients={() => requireAuthAndNavigate('patients')}
            onOpenArduino={() => requireAuthAndNavigate('arduino')}
            onViewPatentMask={() => requireAuthAndNavigate('patent_mask')}
            onOpenMotorPoints={() => requireAuthAndNavigate('motor_points')}
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
            onRetakeExam={() => requireAuthAndNavigate('assessment')}
            onOpenArduino={() => requireAuthAndNavigate('arduino')}
            onSaveToRegistry={() => requireAuthAndNavigate('patients')}
            onStartTherapySession={() => requireAuthAndNavigate('motor_points')}
          />
        )}

        {currentTab === 'motor_points' && (
          <MotorPointsTherapy
            lang={lang}
            affectedSide={activeReport?.protocol.affectedSide || 'left'}
            protocol={activeReport?.protocol}
            onOpenPatentMask={() => requireAuthAndNavigate('patent_mask')}
          />
        )}

        {currentTab === 'arduino' && (
          <ArduinoConnector
            lang={lang}
            onViewPatentMask={() => requireAuthAndNavigate('patent_mask')}
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
              // Unlock app and take user immediately to the feature they clicked
              const nextTab = pendingTargetTab || 'home';
              setPendingTargetTab(null);
              setCurrentTab(nextTab);
            }}
            onClose={() => {
              setPendingTargetTab(null);
              setCurrentTab('home');
            }}
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
