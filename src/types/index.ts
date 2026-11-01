/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'ar' | 'en';

export type HouseBrackmannGrade = 1 | 2 | 3 | 4 | 5 | 6;

export interface ExerciseInfo {
  id: string;
  number: number;
  nameAr: string;
  nameEn: string;
  instructionAr: string;
  instructionEn: string;
  targetMuscleAr: string;
  targetMuscleEn: string;
  iconName: string;
}

export interface ExerciseResult {
  exerciseId: string;
  symmetryScore: number; // 0 - 100%
  leftMovement: number; // 0 - 100
  rightMovement: number; // 0 - 100
  affectedSide: 'left' | 'right' | 'none';
  snapshotUrl?: string;
  completedAt: string;
}

export interface FacialNerveBranch {
  id: string;
  nameAr: string;
  nameEn: string;
  muscleAr: string;
  muscleEn: string;
  arduinoPin: number;
  status: 'idle' | 'active' | 'warning';
  intensity: number; // 0 - 100%
}

export interface TherapeuticProtocol {
  houseBrackmannGrade: HouseBrackmannGrade;
  affectedSide: 'left' | 'right' | 'bilateral';
  overallSymmetryScore: number;
  
  // Electrical stimulation (EMS / TENS)
  ems: {
    frequencyHz: number; // e.g. 20 - 50 Hz
    pulseDurationUs: number; // e.g. 150 - 300 µs
    currentIntensitymA: number; // e.g. 5 - 25 mA
    onTimeSec: number;
    offTimeSec: number;
    sessionDurationMin: number;
    targetBranches: string[];
  };

  // Low Level Laser Therapy (LLLT)
  laser: {
    wavelengthNm: number; // 650nm or 810nm
    powerDensitymW: number; // e.g. 100mW
    energyJcm2: number; // e.g. 4 - 6 J/cm2
    durationMin: number;
    activePointsCount: number;
  };

  clinicalRecommendationsAr: string[];
  clinicalRecommendationsEn: string[];
}

export interface AssessmentReport {
  id: string;
  date: string;
  patientName: string;
  patientId: string;
  patientAge: number;
  patientGender: 'male' | 'female';
  doctorName: string;
  exerciseResults: ExerciseResult[];
  protocol: TherapeuticProtocol;
  notes?: string;
}

export type ArduinoConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type ConnectionType = 'serial' | 'bluetooth' | 'wifi';

export interface MotorPointDef {
  id: string;
  number: number; // 1 - 6
  nameLatin: string; // e.g. "m. frontalis"
  nameAr: string; // e.g. "عضلة الجبهة (رفع الحاجبين)"
  nameEn: string; // "Frontalis (Eyebrow Raise)"
  exerciseId: string;
  activeElectrodeRight: string; // "A1-D"
  refElectrodeRight: string; // "R1-D"
  activeElectrodeLeft: string; // "A1-S"
  refElectrodeLeft: string; // "R1-S"
  muxRightChannel: number; // 0, 2, 4, 6, 8, 10
  muxLeftChannel: number; // 1, 3, 5, 7, 9, 11
  suggestedIntensityMA: number;
  frequencyHz: number;
  pulseWidthUs: number;
  laserWavelengthNm: number;
}

export interface ArduinoTelemetry {
  voltage: number; // Volts
  currentMA: number; // mA
  skinImpedanceKOhm: number; // kOhm
  temperatureC: number;
  isEmergencyStopActive: boolean;
  activeChannels: number[];
  sessionElapsedSec: number;
  sessionTotalSec: number;
  isSessionRunning: boolean;
}

export interface SerialLogEntry {
  id: string;
  timestamp: string;
  direction: 'in' | 'out' | 'system';
  message: string;
}
