/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Sparkles, 
  Activity, 
  Play, 
  Pause, 
  Square, 
  ShieldAlert, 
  Wifi, 
  Cpu, 
  CheckCircle2, 
  Info, 
  Sliders, 
  Layers, 
  RefreshCw,
  Clock,
  Radio,
  ExternalLink
} from 'lucide-react';
import { FACIAL_MOTOR_POINTS } from '../services/motorPointsData';
import { arduinoService } from '../services/arduinoService';
import { 
  ArduinoConnectionStatus, 
  ConnectionType, 
  Language, 
  MotorPointDef, 
  TherapeuticProtocol 
} from '../types';

interface MotorPointsTherapyProps {
  lang: Language;
  affectedSide?: 'left' | 'right' | 'bilateral';
  protocol?: TherapeuticProtocol | null;
  onOpenPatentMask?: () => void;
}

export const MotorPointsTherapy: React.FC<MotorPointsTherapyProps> = ({
  lang,
  affectedSide = 'left',
  protocol,
  onOpenPatentMask,
}) => {
  const isArabic = lang === 'ar';

  // Hardware connection state
  const [arduinoStatus, setArduinoStatus] = useState<ArduinoConnectionStatus>(arduinoService.getStatus());
  const [connectionType, setConnectionType] = useState<ConnectionType>(arduinoService.getConnectionType());
  const [wifiIp, setWifiIp] = useState('192.168.4.1');
  const [isConnectingWifi, setIsConnectingWifi] = useState(false);

  // Selected motor point for inspection
  const [selectedPointId, setSelectedPointId] = useState<string>('mp1_frontalis');
  const [selectedSide, setSelectedSide] = useState<'left' | 'right'>(
    affectedSide === 'right' ? 'right' : 'left'
  );

  // Live Therapy Session State
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionSecondsRemaining, setSessionSecondsRemaining] = useState(15 * 60);
  const [currentActivePointIndex, setCurrentActivePointIndex] = useState(0);
  const [currentIntensityMA, setCurrentIntensityMA] = useState(protocol?.ems.currentIntensitymA || 10);
  const [isLaserActive, setIsLaserActive] = useState(true);

  // Subscribe to Arduino status & telemetry
  useEffect(() => {
    const unsubStatus = arduinoService.onStatusChange((s) => {
      setArduinoStatus(s);
      setConnectionType(arduinoService.getConnectionType());
    });
    return () => unsubStatus();
  }, []);

  // Timer loop for Live Therapy Session
  useEffect(() => {
    let interval: any = null;
    if (isSessionActive && !isPaused && sessionSecondsRemaining > 0) {
      interval = setInterval(() => {
        setSessionSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleStopSession();
            return 0;
          }
          return prev - 1;
        });

        // Cycle through active motor points every 30 seconds for dynamic stimulation
        setCurrentActivePointIndex((prev) => (prev + 1) % FACIAL_MOTOR_POINTS.length);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive, isPaused, sessionSecondsRemaining]);

  const handleConnectWifi = async () => {
    setIsConnectingWifi(true);
    await arduinoService.connectWifi(wifiIp);
    setIsConnectingWifi(false);
  };

  const handleConnectBluetooth = async () => {
    await arduinoService.connectBluetooth();
  };

  const handleConnectUsb = async () => {
    await arduinoService.connectSerial(115200);
  };

  const handleStartSession = async () => {
    setIsSessionActive(true);
    setIsPaused(false);
    const durationSec = (protocol?.ems.sessionDurationMin || 15) * 60;
    setSessionSecondsRemaining(durationSec);

    // Send real hardware trigger to ESP32 / Arduino
    const targetChannel = selectedSide === 'right' 
      ? FACIAL_MOTOR_POINTS[currentActivePointIndex].muxRightChannel 
      : FACIAL_MOTOR_POINTS[currentActivePointIndex].muxLeftChannel;

    await arduinoService.sendCommand(`SESSION:START:SIDE=${selectedSide}:MA=${currentIntensityMA}:LASER=${isLaserActive ? 1 : 0}`);
    await arduinoService.sendCommand(`MUX:SELECT:${targetChannel}`);
  };

  const handlePauseResume = async () => {
    if (isPaused) {
      setIsPaused(false);
      await arduinoService.sendCommand('SESSION:RESUME');
    } else {
      setIsPaused(true);
      await arduinoService.sendCommand('SESSION:PAUSE');
    }
  };

  const handleStopSession = async () => {
    setIsSessionActive(false);
    setIsPaused(false);
    await arduinoService.sendCommand('SESSION:STOP');
    await arduinoService.sendCommand('LASER:OFF');
  };

  const handleEmergencyStop = async () => {
    setIsSessionActive(false);
    setIsPaused(false);
    await arduinoService.triggerEmergencyStop();
  };

  const handleIntensityChange = async (newVal: number) => {
    setCurrentIntensityMA(newVal);
    if (isSessionActive) {
      await arduinoService.sendCommand(`SET:MA:${newVal}`);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentPoint = FACIAL_MOTOR_POINTS.find((p) => p.id === selectedPointId) || FACIAL_MOTOR_POINTS[0];
  const activeStimulatedPoint = FACIAL_MOTOR_POINTS[currentActivePointIndex];

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6 py-6">
      
      {/* 1. TOP HEADER & CONNECTION BAR */}
      <div className="bg-white rounded-3xl p-6 border border-teal-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#0d7679] text-xs font-bold border border-teal-200 mb-1.5">
            <Radio className="w-3.5 h-3.5 text-[#0d7679]" />
            <span>{isArabic ? 'منظومة الاتصال والتحفيز الذكي' : 'Smart Stimulation & Wireless Gateway'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#14292b]">
            {isArabic ? 'نقاط التقاء العصب والعضلات (Motor Points) وجلسة العلاج' : 'Facial Motor Points & Live Mask Therapy'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            {isArabic
              ? 'توجيه التحفيز الكهربائي والليزر بدقة عبر موزع CD74HC4067 ومقاومة MCP4131 طبقاً لبراءة الاختراع ومخطط نقاط العصب.'
              : 'Direct EMS & LLLT laser delivery via CD74HC4067 multiplexer and MCP4131 digital potentiometer.'}
          </p>
        </div>

        {/* Triple Wireless Gateway Buttons: Bluetooth, Wi-Fi, USB */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Bluetooth Button */}
          <button
            onClick={handleConnectBluetooth}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              arduinoStatus === 'connected' && connectionType === 'bluetooth'
                ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isArabic ? 'بلوتوث BLE' : 'Bluetooth BLE'}</span>
          </button>

          {/* Wi-Fi Input & Connect */}
          <div className="flex items-center bg-[#f0f9f8] p-1 rounded-xl border border-teal-200">
            <input
              type="text"
              value={wifiIp}
              onChange={(e) => setWifiIp(e.target.value)}
              placeholder="192.168.4.1"
              className="w-24 sm:w-28 px-2 py-1 bg-white rounded-lg text-xs font-mono font-bold text-gray-700 border border-teal-100 focus:outline-none"
            />
            <button
              onClick={handleConnectWifi}
              disabled={isConnectingWifi}
              className={`mr-1 px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                arduinoStatus === 'connected' && connectionType === 'wifi'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0d7679] hover:bg-[#0a5e61] text-white'
              }`}
            >
              <Wifi className="w-3.5 h-3.5" />
              <span>{isConnectingWifi ? '...' : isArabic ? 'واي فاي' : 'Wi-Fi'}</span>
            </button>
          </div>

          {/* USB Serial Button */}
          <button
            onClick={handleConnectUsb}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              arduinoStatus === 'connected' && connectionType === 'serial'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{isArabic ? 'سلك USB' : 'USB Serial'}</span>
          </button>

        </div>
      </div>

      {/* 2. LIVE THERAPY SESSION DASHBOARD (Active Execution) */}
      <div className="bg-gradient-to-br from-[#0c595c] via-[#0d6e71] to-[#084547] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-600/40 relative overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-teal-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Timer & Session State */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isSessionActive ? (isPaused ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse') : 'bg-gray-400'}`} />
              <span className="text-xs font-bold tracking-wider uppercase text-teal-200">
                {isSessionActive 
                  ? (isPaused ? (isArabic ? 'الجلسة متوقفة مؤقتاً' : 'Session Paused') : (isArabic ? 'جلسة العلاج جارية الآن' : 'Live Therapy in Progress'))
                  : (isArabic ? 'الجهاز جاهز لبدء الجلسة العلاجية' : 'Mask Ready for Therapy')}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                {formatTime(sessionSecondsRemaining)}
              </div>
              <p className="text-xs text-teal-100 font-medium">
                {isArabic ? 'الوقت المتبقي للجلسة العلاجية المتكاملة' : 'Remaining session duration'}
              </p>
            </div>

            {/* Active Point Badge during session */}
            <div className="bg-teal-950/40 border border-teal-400/30 rounded-2xl p-3.5 backdrop-blur-md">
              <span className="text-[11px] text-teal-300 font-bold block mb-1">
                {isArabic ? 'نقطة التحفيز النشطة حالياً عبر موزع CD74HC4067:' : 'Active Motor Point via MUX:'}
              </span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-white">
                  {isArabic ? activeStimulatedPoint.nameAr : activeStimulatedPoint.nameEn}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-teal-800 text-[11px] font-mono font-bold text-teal-200">
                  {selectedSide === 'right' ? activeStimulatedPoint.activeElectrodeRight : activeStimulatedPoint.activeElectrodeLeft}
                </span>
              </div>
            </div>

            {/* Emergency Stop Button */}
            <button
              onClick={handleEmergencyStop}
              className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-white" />
              <span>{isArabic ? 'إيقاف طارئ فوري (قطع التيار)' : 'Emergency Stop (Cut Power)'}</span>
            </button>
          </div>

          {/* Session Controls & Real-time Dosage Adjustment */}
          <div className="lg:col-span-7 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-4">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-300" />
                <span>{isArabic ? 'التحكم بالجرعة والتشغيل الفوري' : 'Live Intensity & Control'}</span>
              </h3>

              {/* Side Selector */}
              <div className="flex items-center bg-teal-950/40 p-1 rounded-xl text-xs font-bold border border-teal-400/20">
                <button
                  onClick={() => setSelectedSide('right')}
                  className={`px-3 py-1 rounded-lg transition-all ${selectedSide === 'right' ? 'bg-[#0d7679] text-white shadow-sm' : 'text-teal-200'}`}
                >
                  {isArabic ? 'الجهة اليمنى (D)' : 'Right (D)'}
                </button>
                <button
                  onClick={() => setSelectedSide('left')}
                  className={`px-3 py-1 rounded-lg transition-all ${selectedSide === 'left' ? 'bg-[#0d7679] text-white shadow-sm' : 'text-teal-200'}`}
                >
                  {isArabic ? 'الجهة اليسرى (S)' : 'Left (S)'}
                </button>
              </div>
            </div>

            {/* Current Intensity Slider (MCP4131 control) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-teal-100 font-bold">
                  {isArabic ? 'شدة التيار الكهربائي (mA عبر MCP4131):' : 'EMS Current Intensity (mA):'}
                </span>
                <span className="font-mono font-black text-lg text-emerald-300">
                  {currentIntensityMA} mA
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="25"
                step="1"
                value={currentIntensityMA}
                onChange={(e) => handleIntensityChange(parseInt(e.target.value))}
                className="w-full accent-emerald-400 h-2 bg-teal-950/50 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-teal-200">
                <span>2 mA (خفيف)</span>
                <span>12 mA (معياري)</span>
                <span>25 mA (أقصى آمن)</span>
              </div>
            </div>

            {/* Laser Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-4 h-4 ${isLaserActive ? 'text-rose-400' : 'text-gray-400'}`} />
                <span className="text-xs font-bold text-white">
                  {isArabic ? 'ديودات الليزر العلاجي (650nm / IRF520):' : '650nm Cold Laser Diodes:'}
                </span>
              </div>
              <button
                onClick={() => setIsLaserActive(!isLaserActive)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  isLaserActive ? 'bg-rose-600 text-white' : 'bg-gray-600 text-gray-200'
                }`}
              >
                {isLaserActive ? (isArabic ? 'مفعل ✓' : 'ACTIVE') : (isArabic ? 'معطل' : 'OFF')}
              </button>
            </div>

            {/* Main Action Buttons: Start / Pause / Stop */}
            <div className="pt-2 flex items-center gap-3">
              {!isSessionActive ? (
                <button
                  onClick={handleStartSession}
                  className="flex-1 py-3 px-6 rounded-2xl bg-white hover:bg-teal-50 text-[#0d5e5e] font-black text-sm shadow-lg shadow-teal-950/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 text-[#0d7679] fill-current" />
                  <span>{isArabic ? 'بدء الجلسة العلاجية بالقناع الآن' : 'Start Therapy Session Now'}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePauseResume}
                    className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                    <span>{isPaused ? (isArabic ? 'استئناف' : 'Resume') : (isArabic ? 'إيقاف مؤقت' : 'Pause')}</span>
                  </button>

                  <button
                    onClick={handleStopSession}
                    className="flex-1 py-3 px-4 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs border border-white/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>{isArabic ? 'إنهاء الجلسة' : 'End Session'}</span>
                  </button>
                </>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* 3. ANATOMICAL MOTOR POINTS REFERENCE (Crystal Touch Clinic Diagram) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-teal-100 shadow-sm space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-teal-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#0d7679] text-xs font-bold border border-teal-200 mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span>{isArabic ? 'المرجع التشريحي المعتمد لنقاط المحاذاة' : 'Anatomical Motor Points Reference'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#14292b]">
              {isArabic ? 'مخطط نقاط التماس (Motor Points) في الوجه والقناع' : 'Facial Motor Points Mapping'}
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {isArabic
                ? 'توزيع الأقطاب الفعالة (A) والأقطاب المرجعية (R) للجهتين اليمنى (D) واليسرى (S) وتوصيلها بموزع 16 قناة.'
                : 'Active (A) & Reference (R) electrode distribution for Right (D) & Left (S) sides.'}
            </p>
          </div>

          {onOpenPatentMask && (
            <button
              onClick={onOpenPatentMask}
              className="px-4 py-2 rounded-2xl bg-teal-50 hover:bg-teal-100 text-[#0d7679] text-xs font-bold border border-teal-200 transition-all flex items-center gap-1.5 self-start md:self-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isArabic ? 'عرض مخططات براءة الاختراع' : 'View Patent Blueprints'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Real Diagram Image as uploaded by user */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-4 border-2 border-teal-100 shadow-sm flex flex-col items-center">
            <div className="relative rounded-2xl overflow-hidden border border-teal-100 bg-[#fbfdfd] w-full flex justify-center">
              <img
                src="/assets/aistudio/IMG_20261031_201132_d8320459.jpg"
                alt="Facial Motor Points Diagram"
                className="max-h-[480px] w-auto object-contain rounded-xl shadow-inner"
              />
            </div>
            <span className="text-xs font-bold text-[#0d7679] mt-3 text-center">
              {isArabic ? 'المخطط المعتمد لنقاط التحفيز الكهربائي والليزر بالقناع' : 'Official Facial Motor Points Schema'}
            </span>
          </div>

          {/* Interactive 6 Motor Points Breakdown Grid */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-sm font-extrabold text-[#14292b] mb-2">
              {isArabic ? 'قائمة النقاط الحركية الست وقنواتها في الأردوينو:' : 'The 6 Facial Motor Points & Arduino Channels:'}
            </h3>

            <div className="space-y-2.5">
              {FACIAL_MOTOR_POINTS.map((mp) => {
                const isSelected = selectedPointId === mp.id;
                const isCurrentlyPulsing = isSessionActive && activeStimulatedPoint.id === mp.id;

                return (
                  <div
                    key={mp.id}
                    onClick={() => setSelectedPointId(mp.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isCurrentlyPulsing
                        ? 'bg-emerald-50 border-emerald-400 shadow-md ring-2 ring-emerald-300'
                        : isSelected
                        ? 'bg-teal-50/70 border-teal-300 shadow-sm'
                        : 'bg-white border-teal-100 hover:border-teal-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-[#0d7679] text-white flex items-center justify-center text-xs font-black">
                            {mp.number}
                          </span>
                          <h4 className="text-sm font-black text-[#14292b]">
                            {isArabic ? mp.nameAr : mp.nameEn}
                          </h4>
                          {isCurrentlyPulsing && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold animate-pulse">
                              {isArabic ? 'نبض نشط' : 'PULSING'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-teal-800">
                          {mp.nameLatin}
                        </p>
                      </div>

                      {/* Electrodes & MUX Pins */}
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <span className="px-2.5 py-1 rounded-xl bg-teal-100/70 text-teal-900 font-bold" title="Right Electrode">
                          {mp.activeElectrodeRight} (CH{mp.muxRightChannel})
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-blue-100/70 text-blue-900 font-bold" title="Left Electrode">
                          {mp.activeElectrodeLeft} (CH{mp.muxLeftChannel})
                        </span>
                      </div>
                    </div>

                    {/* Expanded details when selected */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-teal-100/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div className="bg-white p-2 rounded-xl border border-teal-50">
                          <span className="text-gray-400 font-semibold">{isArabic ? 'التردد المقترح:' : 'Freq:'}</span>
                          <p className="font-bold text-[#0d7679]">{mp.frequencyHz} Hz</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-teal-50">
                          <span className="text-gray-400 font-semibold">{isArabic ? 'عرض النبضة:' : 'Pulse:'}</span>
                          <p className="font-bold text-[#0d7679]">{mp.pulseWidthUs} µs</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-teal-50">
                          <span className="text-gray-400 font-semibold">{isArabic ? 'التيار الموصى به:' : 'Current:'}</span>
                          <p className="font-bold text-[#0d7679]">{mp.suggestedIntensityMA} mA</p>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-teal-50">
                          <span className="text-gray-400 font-semibold">{isArabic ? 'الليزر البارد:' : 'Laser:'}</span>
                          <p className="font-bold text-rose-600">{mp.laserWavelengthNm} nm</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
