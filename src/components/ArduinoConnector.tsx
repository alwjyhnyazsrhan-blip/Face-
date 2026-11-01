/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Wifi, 
  WifiOff, 
  Sliders, 
  Terminal, 
  Code, 
  Download, 
  Copy, 
  Check, 
  Play, 
  Square, 
  AlertOctagon, 
  RefreshCw, 
  Send, 
  Layers, 
  Zap, 
  Thermometer, 
  Activity, 
  ShieldCheck, 
  Sparkles,
  Radio,
  FileCode,
  HelpCircle
} from 'lucide-react';
import { arduinoService } from '../services/arduinoService';
import { ArduinoConnectionStatus, ArduinoTelemetry, ConnectionType, Language, SerialLogEntry } from '../types';

interface ArduinoConnectorProps {
  lang: Language;
  onViewPatentMask?: () => void;
}

export const ArduinoConnector: React.FC<ArduinoConnectorProps> = ({ lang, onViewPatentMask }) => {
  const isArabic = lang === 'ar';
  
  const [status, setStatus] = useState<ArduinoConnectionStatus>(arduinoService.getStatus());
  const [connectionType, setConnectionType] = useState<ConnectionType>(arduinoService.getConnectionType());
  const [telemetry, setTelemetry] = useState<ArduinoTelemetry>(arduinoService.getTelemetry());
  const [logs, setLogs] = useState<SerialLogEntry[]>(arduinoService.getLogs());
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [customCommand, setCustomCommand] = useState<string>('PING');
  const [activeCodeTab, setActiveCodeTab] = useState<'uno' | 'esp32' | 'schematic'>('uno');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Channel test intensities
  const [channelIntensities, setChannelIntensities] = useState<{ [key: number]: number }>({
    1: 45,
    2: 40,
    3: 50,
    4: 45,
    5: 35,
  });
  const [laserIntensity, setLaserIntensity] = useState<number>(75);

  // CD74HC4067 16-channel motor points & MCP4131 Digital Potentiometer
  const [selectedMotorPoint, setSelectedMotorPoint] = useState<number>(0);
  const [mcpPotValue, setMcpPotValue] = useState<number>(45);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubStatus = arduinoService.onStatusChange((s) => {
      setStatus(s);
      setConnectionType(arduinoService.getConnectionType());
    });
    const unsubTelem = arduinoService.onTelemetryChange((t) => setTelemetry(t));
    const unsubLogs = arduinoService.onLog(() => setLogs(arduinoService.getLogs()));

    return () => {
      unsubStatus();
      unsubTelem();
      unsubLogs();
    };
  }, []);

  const [wifiIp, setWifiIp] = useState('192.168.4.1');
  const [isConnectingWifi, setIsConnectingWifi] = useState(false);

  const handleConnectSerial = async () => {
    await arduinoService.connectSerial(baudRate);
  };

  const handleConnectBluetooth = async () => {
    await arduinoService.connectBluetooth();
  };

  const handleConnectWifi = async () => {
    setIsConnectingWifi(true);
    await arduinoService.connectWifi(wifiIp);
    setIsConnectingWifi(false);
  };

  const handleDisconnect = async () => {
    await arduinoService.disconnect();
  };

  const handleSendCommand = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customCommand.trim()) return;
    await arduinoService.sendCommand(customCommand);
    setCustomCommand('');
  };

  const handleEmergencyStop = async () => {
    await arduinoService.triggerEmergencyStop();
  };

  const handleTestChannel = async (channel: number) => {
    const intensity = channelIntensities[channel] || 50;
    await arduinoService.testSingleChannel(channel, intensity);
  };

  const handleTestLaser = async () => {
    await arduinoService.testLaserEmitter(laserIntensity);
  };

  const handleTestMotorPoint = async (point: number) => {
    setSelectedMotorPoint(point);
    await arduinoService.sendCommand(`TEST:POINT=${point}`);
  };

  const handleSetMcpPot = async (val: number) => {
    setMcpPotValue(val);
    await arduinoService.sendCommand(`SET:POT=${val}`);
  };

  const copyCodeToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const downloadInoFile = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentCode = activeCodeTab === 'uno' 
    ? arduinoService.getArduinoUnoSketch() 
    : arduinoService.getESP32BluetoothSketch();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-teal-100 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isArabic ? 'وحدة الربط بالأردوينو والقناع العلاجي' : 'Arduino Smart Mask Hub'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#14292b]">
              {isArabic ? 'جاهز للربط الفعلي مع أي أردوينو' : 'Ready to Connect with Any Arduino'}
            </h1>
            <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
              {isArabic
                ? 'يدعم الاتصال المباشر والفعلي عبر كابل USB باستخدام Web Serial API، أو لاسلكياً عبر Web Bluetooth مع وحدات ESP32، للتحكم الحقيقي في نبضات القناع وأشعة الليزر.'
                : 'Supports direct physical USB Serial communication via Web Serial API, and BLE wireless via Web Bluetooth, for real hardware pulse and laser control.'}
            </p>
          </div>

          {/* Connection Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {status === 'connected' ? (
              <button
                onClick={handleDisconnect}
                className="px-5 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs border border-rose-200 transition-all flex items-center gap-2 shadow-sm"
              >
                <WifiOff className="w-4 h-4" />
                <span>{isArabic ? 'فصل الاتصال' : 'Disconnect'}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={handleConnectSerial}
                  className="px-4 py-3 rounded-2xl bg-[#0d7679] hover:bg-[#0a5e61] text-white font-extrabold text-xs shadow-md shadow-teal-900/15 transition-all flex items-center gap-2 active:scale-98"
                >
                  <Cpu className="w-4 h-4 text-emerald-300" />
                  <span>{isArabic ? 'اتصال USB' : 'USB Serial'}</span>
                </button>

                <button
                  onClick={handleConnectBluetooth}
                  className="px-4 py-3 rounded-2xl bg-teal-50 hover:bg-teal-100 text-[#0d7679] font-bold text-xs border border-teal-200 transition-all flex items-center gap-2"
                >
                  <Radio className="w-4 h-4" />
                  <span>{isArabic ? 'بلوتوث BLE' : 'Bluetooth BLE'}</span>
                </button>

                <div className="flex items-center bg-[#f0f9f8] p-1.5 rounded-2xl border border-teal-200">
                  <input
                    type="text"
                    value={wifiIp}
                    onChange={(e) => setWifiIp(e.target.value)}
                    placeholder="192.168.4.1"
                    className="w-24 sm:w-28 px-2 py-1.5 bg-white rounded-xl text-xs font-mono font-bold text-gray-700 border border-teal-100 focus:outline-none"
                  />
                  <button
                    onClick={handleConnectWifi}
                    disabled={isConnectingWifi}
                    className="mr-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                  >
                    <Wifi className="w-3.5 h-3.5" />
                    <span>{isConnectingWifi ? '...' : isArabic ? 'واي فاي' : 'Wi-Fi'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status & Telemetry Bar */}
        <div className="mt-6 pt-6 border-t border-teal-50 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          
          <div className="bg-[#f7faf9] rounded-2xl p-3 border border-teal-100/70">
            <span className="text-[11px] font-bold text-gray-500 block">{isArabic ? 'حالة المنفذ' : 'Port Status'}</span>
            <span className={`text-xs font-black inline-flex items-center gap-1.5 mt-1 ${
              status === 'connected' ? 'text-emerald-700' : 'text-gray-500'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                status === 'connected' ? 'bg-emerald-500 animate-ping' : 'bg-gray-400'
              }`} />
              {status === 'connected' ? (isArabic ? 'متصل بالعتاد' : 'Hardware Connected') : (isArabic ? 'غير متصل' : 'Disconnected')}
            </span>
          </div>

          <div className="bg-[#f7faf9] rounded-2xl p-3 border border-teal-100/70">
            <span className="text-[11px] font-bold text-gray-500 block">{isArabic ? 'جهد التشغيل' : 'Voltage'}</span>
            <span className="text-sm font-black text-[#14292b] mt-1 block">
              {telemetry.voltage.toFixed(2)} V
            </span>
          </div>

          <div className="bg-[#f7faf9] rounded-2xl p-3 border border-teal-100/70">
            <span className="text-[11px] font-bold text-gray-500 block">{isArabic ? 'التيار الفعلي' : 'Current mA'}</span>
            <span className="text-sm font-black text-[#0d7679] mt-1 block">
              {telemetry.currentMA.toFixed(1)} mA
            </span>
          </div>

          <div className="bg-[#f7faf9] rounded-2xl p-3 border border-teal-100/70">
            <span className="text-[11px] font-bold text-gray-500 block">{isArabic ? 'ممانعة الجلد' : 'Skin Impedance'}</span>
            <span className="text-sm font-black text-emerald-700 mt-1 block">
              {telemetry.skinImpedanceKOhm.toFixed(2)} kΩ
            </span>
          </div>

          <div className="bg-[#f7faf9] rounded-2xl p-3 border border-teal-100/70">
            <span className="text-[11px] font-bold text-gray-500 block">{isArabic ? 'الحرارة' : 'Temperature'}</span>
            <span className="text-sm font-black text-amber-700 mt-1 block">
              {telemetry.temperatureC.toFixed(1)} °C
            </span>
          </div>

          <div className="bg-[#f7faf9] rounded-2xl p-3 border border-teal-100/70 flex items-center justify-center">
            <button
              onClick={handleEmergencyStop}
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1 active:scale-95 transition-all"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>{isArabic ? 'زر الطوارئ' : 'E-STOP'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mask Channels Testing & Stimulation Grid */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-teal-100 shadow-md space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#0d7679]" />
              <h2 className="text-xl font-extrabold text-[#14292b]">
                {isArabic ? 'معايرة واختبار قنوات القناع العلاجي (الشكل 1 و 6)' : 'Mask Nerve Channels Calibration & Testing'}
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isArabic
                ? 'فحص كل قطب كهربائي في القناع ومطابقته مع فروع العصب الوجهي الخمسة وبواعث الليزر.'
                : 'Test each electrode on the mask matching the 5 facial nerve branches and laser matrix.'}
            </p>
          </div>

          {onViewPatentMask && (
            <button
              onClick={onViewPatentMask}
              className="text-xs font-bold text-[#0d7679] hover:underline flex items-center gap-1"
            >
              <Layers className="w-4 h-4" />
              <span>{isArabic ? 'عرض مخططات البراءة (الشكل 1-6)' : 'View Patent Figures'}</span>
            </button>
          )}
        </div>

        {/* 5 Facial Nerve Channels Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* CH1: Temporal */}
          <div className="bg-[#f7faf9] rounded-2xl p-4 border border-teal-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#0d7679] bg-teal-100/60 px-2 py-0.5 rounded-lg">
                CH 1 (Pin 3 - PWM)
              </span>
              <span className="text-[11px] font-bold text-gray-500">
                {isArabic ? 'العضلة الجبهية' : 'Frontalis'}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[#14292b]">
                {isArabic ? 'العصب الصدغي (Temporal Branch)' : 'Temporal Branch'}
              </h4>
              <p className="text-[11px] text-gray-500">{isArabic ? 'عنصر (115) أعلى القناع - رفع الحاجب' : 'Upper mask electrode - Eyebrow elevation'}</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="100"
                value={channelIntensities[1]}
                onChange={(e) => setChannelIntensities({ ...channelIntensities, 1: parseInt(e.target.value) })}
                className="w-full accent-[#0d7679]"
              />
              <span className="text-xs font-black text-[#0d7679] w-9 text-left">{channelIntensities[1]}%</span>
            </div>
            <button
              onClick={() => handleTestChannel(1)}
              className="w-full py-2 bg-white hover:bg-teal-50 border border-teal-200 text-[#0d7679] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isArabic ? 'إرسال نبضة اختبار (500ms)' : 'Send Test Pulse'}</span>
            </button>
          </div>

          {/* CH2: Zygomatic */}
          <div className="bg-[#f7faf9] rounded-2xl p-4 border border-teal-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#0d7679] bg-teal-100/60 px-2 py-0.5 rounded-lg">
                CH 2 (Pin 5 - PWM)
              </span>
              <span className="text-[11px] font-bold text-gray-500">
                {isArabic ? 'محيط العين' : 'Orbicularis Oculi'}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[#14292b]">
                {isArabic ? 'العصب الوجني (Zygomatic Branch)' : 'Zygomatic Branch'}
              </h4>
              <p className="text-[11px] text-gray-500">{isArabic ? 'عنصر (115) حول عدسات النظارة - إغلاق الجفن' : 'Peri-orbital electrodes - Eye closure'}</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="100"
                value={channelIntensities[2]}
                onChange={(e) => setChannelIntensities({ ...channelIntensities, 2: parseInt(e.target.value) })}
                className="w-full accent-[#0d7679]"
              />
              <span className="text-xs font-black text-[#0d7679] w-9 text-left">{channelIntensities[2]}%</span>
            </div>
            <button
              onClick={() => handleTestChannel(2)}
              className="w-full py-2 bg-white hover:bg-teal-50 border border-teal-200 text-[#0d7679] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isArabic ? 'إرسال نبضة اختبار (500ms)' : 'Send Test Pulse'}</span>
            </button>
          </div>

          {/* CH3: Buccal */}
          <div className="bg-[#f7faf9] rounded-2xl p-4 border border-teal-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#0d7679] bg-teal-100/60 px-2 py-0.5 rounded-lg">
                CH 3 (Pin 6 - PWM)
              </span>
              <span className="text-[11px] font-bold text-gray-500">
                {isArabic ? 'الوجنة والخد' : 'Buccinator'}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[#14292b]">
                {isArabic ? 'العصب الشدقي (Buccal Branch)' : 'Buccal Branch'}
              </h4>
              <p className="text-[11px] text-gray-500">{isArabic ? 'عنصر (115) على الوجنتين - الابتسامة والنفخ' : 'Cheek electrodes - Smile & cheek puff'}</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="100"
                value={channelIntensities[3]}
                onChange={(e) => setChannelIntensities({ ...channelIntensities, 3: parseInt(e.target.value) })}
                className="w-full accent-[#0d7679]"
              />
              <span className="text-xs font-black text-[#0d7679] w-9 text-left">{channelIntensities[3]}%</span>
            </div>
            <button
              onClick={() => handleTestChannel(3)}
              className="w-full py-2 bg-white hover:bg-teal-50 border border-teal-200 text-[#0d7679] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isArabic ? 'إرسال نبضة اختبار (500ms)' : 'Send Test Pulse'}</span>
            </button>
          </div>

          {/* CH4: Marginal Mandibular */}
          <div className="bg-[#f7faf9] rounded-2xl p-4 border border-teal-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#0d7679] bg-teal-100/60 px-2 py-0.5 rounded-lg">
                CH 4 (Pin 9 - PWM)
              </span>
              <span className="text-[11px] font-bold text-gray-500">
                {isArabic ? 'زاوية الفم' : 'Depressor Anguli'}
              </span>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[#14292b]">
                {isArabic ? 'العصب الفكي الهامشي (Mandibular)' : 'Marginal Mandibular'}
              </h4>
              <p className="text-[11px] text-gray-500">{isArabic ? 'عنصر (115) محيط الفم والشفاه - وزم الشفاه' : 'Perioral electrodes - Lip pucker'}</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="100"
                value={channelIntensities[4]}
                onChange={(e) => setChannelIntensities({ ...channelIntensities, 4: parseInt(e.target.value) })}
                className="w-full accent-[#0d7679]"
              />
              <span className="text-xs font-black text-[#0d7679] w-9 text-left">{channelIntensities[4]}%</span>
            </div>
            <button
              onClick={() => handleTestChannel(4)}
              className="w-full py-2 bg-white hover:bg-teal-50 border border-teal-200 text-[#0d7679] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isArabic ? 'إرسال نبضة اختبار (500ms)' : 'Send Test Pulse'}</span>
            </button>
          </div>

          {/* Laser Emitters Array */}
          <div className="bg-[#fff9f9] rounded-2xl p-4 border border-rose-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-lg">
                LASER (Pin 11 - PWM)
              </span>
              <span className="text-[11px] font-bold text-rose-500">
                650nm / 810nm
              </span>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[#14292b]">
                {isArabic ? 'مصفوفة الليزر البارد (LLLT)' : 'Cold Laser Array'}
              </h4>
              <p className="text-[11px] text-gray-500">{isArabic ? 'عنصر (114/109) مصفوفة الثقوب بالوجه الداخلي' : 'Internal face laser emitters - Fig (2)'}</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="100"
                value={laserIntensity}
                onChange={(e) => setLaserIntensity(parseInt(e.target.value))}
                className="w-full accent-rose-600"
              />
              <span className="text-xs font-black text-rose-700 w-9 text-left">{laserIntensity}%</span>
            </div>
            <button
              onClick={handleTestLaser}
              className="w-full py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>{isArabic ? 'اختبار وميض الليزر (1s)' : 'Test Laser Flash'}</span>
            </button>
          </div>

          {/* Master Relay & Safety Switch */}
          <div className="bg-[#f7faf9] rounded-2xl p-4 border border-teal-100 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-lg">
                  RELAY (Pin 8)
                </span>
                <span className="text-[11px] font-bold text-emerald-600">
                  {isArabic ? 'قاطع أمان' : 'Safety Cutoff'}
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-[#14292b] mt-2">
                {isArabic ? 'ريليه العزل الرئيسي للحماية' : 'Galvanic Isolation Relay'}
              </h4>
              <p className="text-[11px] text-gray-500">{isArabic ? 'يفصل التيار كهربائياً بالكامل في حالة الطوارئ' : 'Complete hardware cutoff upon fault'}</p>
            </div>
            <div className="pt-2">
              <button
                onClick={handleEmergencyStop}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>{isArabic ? 'تفعيل قاطع الطوارئ فوراً' : 'Engage Emergency Cutoff'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* 16-Channel Multiplexer (CD74HC4067) & Digital Potentiometer (MCP4131) Control */}
        <div className="pt-6 border-t border-teal-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#0d7679]" />
                <h3 className="text-base font-extrabold text-[#14292b]">
                  {isArabic ? 'وحدة توجيه نقاط التماس الحركية (CD74HC4067 16-Channel MUX)' : 'CD74HC4067 16-Channel Motor Points Switch'}
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {isArabic ? 'انقر على أي نقطة من نقاط الوجه الـ 16 لتوجيه نبضة التحفيز عبر موزع الـ CD74HC4067 مباشرة.' : 'Select any of the 16 facial motor points to route the stimulation pulse.'}
              </p>
            </div>

            {/* MCP4131 Digital Potentiometer Slider */}
            <div className="bg-[#f7faf9] px-4 py-2 rounded-2xl border border-teal-100 flex items-center gap-3">
              <span className="text-xs font-bold text-gray-600 shrink-0">
                {isArabic ? 'المقاومة الرقمية MCP4131:' : 'MCP4131 SPI Pot:'}
              </span>
              <input
                type="range"
                min="0"
                max="128"
                value={mcpPotValue}
                onChange={(e) => handleSetMcpPot(parseInt(e.target.value))}
                className="w-28 sm:w-36 accent-[#0d7679]"
                title="Wiper Step (0-128)"
              />
              <span className="text-xs font-mono font-black text-[#0d7679] w-12 text-left">
                {mcpPotValue}/128
              </span>
            </div>
          </div>

          {/* Motor Points Schema Diagram Banner matching user upload */}
          <div className="bg-[#f0f9f8] p-4 rounded-2xl border border-teal-200 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-white border border-teal-100 shrink-0 p-1 flex items-center justify-center">
              <img
                src="/assets/aistudio/IMG_20261031_201132_d8320459.jpg"
                alt="Motor Points Reference"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-center sm:text-right space-y-1">
              <span className="text-xs font-black text-[#0d7679]">
                {isArabic ? 'مخطط نقاط التماس الست (1 إلى 6) ومطابقتها مع موزع الـ CD74HC4067:' : 'The 6 Facial Motor Points & CD74HC4067 MUX channels:'}
              </span>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                {isArabic
                  ? '1: جبهة (C0/C1) • 2: عين (C2/C3) • 3: رافعة الشفة (C4/C5) • 4: وجنة وابتسامة (C6/C7) • 5: محيط الشفاه (C8/C9) • 6: زاوية الفم والذقن (C10/C11).'
                  : '1: Frontalis (C0/C1) • 2: Orbicularis Oculi (C2/C3) • 3: Nasalis (C4/C5) • 4: Zygomatici (C6/C7) • 5: Orbicularis Oris (C8/C9) • 6: Depressor/Mentalis (C10/C11).'}
              </p>
            </div>
          </div>

          {/* 16 Motor Points Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {[
              { id: 0, labelAr: 'C0: جبهة يمين', labelEn: 'C0: Front R' },
              { id: 1, labelAr: 'C1: جبهة يسار', labelEn: 'C1: Front L' },
              { id: 2, labelAr: 'C2: عين يمين', labelEn: 'C2: Eye R' },
              { id: 3, labelAr: 'C3: عين يسار', labelEn: 'C3: Eye L' },
              { id: 4, labelAr: 'C4: وجنة يمين', labelEn: 'C4: Zyg R' },
              { id: 5, labelAr: 'C5: وجنة يسار', labelEn: 'C5: Zyg L' },
              { id: 6, labelAr: 'C6: خد يمين', labelEn: 'C6: Bucc R' },
              { id: 7, labelAr: 'C7: خد يسار', labelEn: 'C7: Bucc L' },
              { id: 8, labelAr: 'C8: شفة يمين', labelEn: 'C8: Lip R' },
              { id: 9, labelAr: 'C9: شفة يسار', labelEn: 'C9: Lip L' },
              { id: 10, labelAr: 'C10: زاوية يمين', labelEn: 'C10: Angle R' },
              { id: 11, labelAr: 'C11: زاوية يسار', labelEn: 'C11: Angle L' },
              { id: 12, labelAr: 'C12: ذقن', labelEn: 'C12: Chin' },
              { id: 13, labelAr: 'C13: عنق يمين', labelEn: 'C13: Neck R' },
              { id: 14, labelAr: 'C14: عنق يسار', labelEn: 'C14: Neck L' },
              { id: 15, labelAr: 'C15: مرجع GND', labelEn: 'C15: Ref GND' },
            ].map((pt) => (
              <button
                key={pt.id}
                onClick={() => handleTestMotorPoint(pt.id)}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                  selectedMotorPoint === pt.id
                    ? 'bg-[#0d7679] text-white border-[#0d7679] shadow-sm'
                    : 'bg-[#f7faf9] hover:bg-teal-50 text-gray-700 border-teal-100'
                }`}
                title={isArabic ? `توجيه التحفيز إلى ${pt.labelAr}` : `Route to ${pt.labelEn}`}
              >
                <span className="font-mono font-black">{`C${pt.id}`}</span>
                <span className="text-[10px] truncate max-w-[85px]">
                  {isArabic ? pt.labelAr.split(': ')[1] : pt.labelEn.split(': ')[1]}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Live Serial Monitor / Console */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-slate-800 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              {isArabic ? 'وحدة المراقبة التسلسلية الحية (Serial Terminal)' : 'Live Serial Monitor'}
            </h3>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
              {baudRate} baud
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(parseInt(e.target.value))}
              className="bg-slate-800 text-xs text-white px-2 py-1 rounded-lg border border-slate-700 outline-none"
            >
              <option value="9600">9600 baud</option>
              <option value="57600">57600 baud</option>
              <option value="115200">115200 baud</option>
            </select>

            <button
              onClick={() => arduinoService.clearLogs()}
              className="text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-all"
            >
              {isArabic ? 'مسح' : 'Clear'}
            </button>
          </div>
        </div>

        {/* Console Log Area */}
        <div className="h-48 overflow-y-auto space-y-1 font-mono-code text-xs p-3 bg-black/50 rounded-2xl border border-slate-800/80">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 leading-relaxed">
              <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
              <span className={`shrink-0 font-bold select-none ${
                log.direction === 'out' ? 'text-teal-400' : log.direction === 'in' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {log.direction === 'out' ? 'TX >>' : log.direction === 'in' ? 'RX <<' : 'SYS :'}
              </span>
              <span className={`${
                log.direction === 'out' ? 'text-teal-200' : log.direction === 'in' ? 'text-emerald-200' : 'text-amber-200'
              } break-all`}>
                {log.message}
              </span>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        {/* Command Input Bar */}
        <form onSubmit={handleSendCommand} className="flex items-center gap-2">
          <input
            type="text"
            value={customCommand}
            onChange={(e) => setCustomCommand(e.target.value)}
            placeholder={isArabic ? 'اكتب أمر أردوينو (مثل PING أو START أو STOP)...' : 'Type command (e.g. PING, START, STOP)...'}
            className="flex-1 bg-slate-800 text-white placeholder-slate-500 px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-mono-code focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isArabic ? 'إرسال' : 'Send'}</span>
          </button>
        </form>

        {/* Quick Commands Preset Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="text-slate-400 font-bold mr-1">{isArabic ? 'أوامر سريعة:' : 'Presets:'}</span>
          <button
            type="button"
            onClick={() => arduinoService.sendCommand('PING')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-teal-300 font-mono transition-all"
          >
            PING
          </button>
          <button
            type="button"
            onClick={() => arduinoService.sendCommand('START:TIME=15:MA=12')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono transition-all"
          >
            START
          </button>
          <button
            type="button"
            onClick={() => arduinoService.sendCommand('STOP')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 font-mono transition-all"
          >
            STOP
          </button>
          <button
            type="button"
            onClick={() => arduinoService.sendCommand('TEST:CH=1')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono transition-all"
          >
            TEST:CH1
          </button>
          <button
            type="button"
            onClick={() => arduinoService.sendCommand('TEST:LASER')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono transition-all"
          >
            TEST:LASER
          </button>
        </div>

      </div>

      {/* Arduino Firmware Source Code Generator & Download Tab */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-teal-100 shadow-md space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-teal-50">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-[#0d7679] text-xs font-bold border border-teal-200 mb-1">
              <Code className="w-3.5 h-3.5" />
              <span>{isArabic ? 'أكواد جاهزة للرفع على أي أردوينو' : 'Ready-to-Flash Arduino Firmware'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#14292b]">
              {isArabic ? 'برنامج الأردوينو المفتوح المصدر (.ino)' : 'Open Source Arduino Firmware (.ino)'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isArabic
                ? 'انسخ الكود أو حمّله مباشرة وافتحه في Arduino IDE وارفع على لوحتك.'
                : 'Copy or download the sketch and upload via Arduino IDE to your board.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyCodeToClipboard(currentCode)}
              className="px-4 py-2.5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-[#0d7679] text-xs font-bold border border-teal-200 transition-all flex items-center gap-1.5"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? (isArabic ? 'تم النسخ!' : 'Copied!') : (isArabic ? 'نسخ الكود' : 'Copy Code')}</span>
            </button>

            <button
              onClick={() => downloadInoFile(activeCodeTab === 'uno' ? 'FacialMask_Uno.ino' : 'FacialMask_ESP32.ino', currentCode)}
              className="px-4 py-2.5 rounded-2xl bg-[#0d7679] hover:bg-[#0a5e61] text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>{isArabic ? 'تحميل ملف .ino' : 'Download .ino'}</span>
            </button>
          </div>
        </div>

        {/* Code Tabs */}
        <div className="flex items-center gap-2 border-b border-teal-100 text-xs font-bold">
          <button
            onClick={() => setActiveCodeTab('uno')}
            className={`pb-3 px-3 transition-all border-b-2 ${
              activeCodeTab === 'uno'
                ? 'border-[#0d7679] text-[#0d7679] font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Arduino Uno / Nano / Mega (.ino)
          </button>
          <button
            onClick={() => setActiveCodeTab('esp32')}
            className={`pb-3 px-3 transition-all border-b-2 ${
              activeCodeTab === 'esp32'
                ? 'border-[#0d7679] text-[#0d7679] font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            ESP32 + CD74HC4067 + MCP4131 + IRF520 (.ino)
          </button>
          <button
            onClick={() => setActiveCodeTab('schematic')}
            className={`pb-3 px-3 transition-all border-b-2 ${
              activeCodeTab === 'schematic'
                ? 'border-[#0d7679] text-[#0d7679] font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {isArabic ? 'مخطط التوصيل الهندسي للقطع الست (Hardware BOM & Pinout)' : '6-Module Hardware Wiring & BOM'}
          </button>
        </div>

        {/* Code & Schematic Display Area */}
        {activeCodeTab === 'schematic' ? (
          <div className="bg-[#f7faf9] rounded-2xl p-6 border border-teal-100 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-100 pb-3">
              <div>
                <h4 className="text-base font-extrabold text-[#14292b]">
                  {isArabic ? 'دليل التوصيل الكامل لمكونات الدائرة الست على لوحة الاختبار (Breadboard)' : 'Complete 6-Module Breadboard Wiring Guide'}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isArabic ? 'مطابق لقائمتك المعتمدة: ESP32 + CD74HC4067 + PC817 + MCP4131 + IRF520 + LiPo/TP4056' : 'Custom pinout tailored to your exact 6-module hardware BOM'}
                </p>
              </div>
              <span className="text-xs font-black text-[#0d7679] bg-teal-100/70 px-3 py-1 rounded-full">
                {isArabic ? 'تغذية آمنة 3.7V - 5V/12V' : 'Safe 3.7V to 5V/12V Rail'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700">
              
              {/* Box 1: ESP32 & CD74HC4067 Multiplexer */}
              <div className="bg-white p-4 rounded-xl border border-teal-100 shadow-sm space-y-2">
                <span className="font-bold text-[#0d7679] block text-sm flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-[#0d7679] flex items-center justify-center text-xs">١</span>
                  <span>{isArabic ? 'موزع نقاط الوجه (CD74HC4067 ➔ ESP32):' : 'CD74HC4067 ➔ ESP32:'}</span>
                </span>
                <ul className="space-y-1.5 leading-relaxed text-gray-600">
                  <li>• <strong>S0</strong> ➔ GPIO 13 في ESP32</li>
                  <li>• <strong>S1</strong> ➔ GPIO 12 في ESP32</li>
                  <li>• <strong>S2</strong> ➔ GPIO 14 في ESP32</li>
                  <li>• <strong>S3</strong> ➔ GPIO 27 في ESP32</li>
                  <li>• <strong>EN</strong> (Enable) ➔ GPIO 26 في ESP32 (Active LOW)</li>
                  <li>• <strong>SIG</strong> (Common In/Out) ➔ خارج من دائرة العزل الضوئي PC817</li>
                  <li>• <strong>VCC & GND</strong> ➔ 5V و GND المشترك من مخرج الـ Boost Converter</li>
                  <li>• <strong>القنوات (C0 إلى C15)</strong> ➔ تتصل مباشرة بأقطاب القناع الـ 16 (Motor Points)</li>
                </ul>
              </div>

              {/* Box 2: EMS & PC817 & MCP4131 */}
              <div className="bg-white p-4 rounded-xl border border-teal-100 shadow-sm space-y-2">
                <span className="font-bold text-[#0d7679] block text-sm flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-[#0d7679] flex items-center justify-center text-xs">٢</span>
                  <span>{isArabic ? 'التحفيز الكهربائي، العازل PC817 والمقاومة MCP4131:' : 'TENS, PC817 & MCP4131:'}</span>
                </span>
                <ul className="space-y-1.5 leading-relaxed text-gray-600">
                  <li>• <strong>PC817 Pin 1 (Anode)</strong> ➔ GPIO 33 عبر مقاومة 220Ω</li>
                  <li>• <strong>PC817 Pin 2 (Cathode)</strong> ➔ GND الخاص بـ ESP32</li>
                  <li>• <strong>PC817 Pin 3 & 4 (Collector/Emitter)</strong> ➔ مشغل نبضات TENS Generator</li>
                  <li>• <strong>MCP4131 CS</strong> ➔ GPIO 5 (Chip Select)</li>
                  <li>• <strong>MCP4131 SCK</strong> ➔ GPIO 18 (SPI Clock)</li>
                  <li>• <strong>MCP4131 SDI</strong> ➔ GPIO 23 (MOSI Data)</li>
                  <li>• <strong>طرفي المقاومة (A & W)</strong> ➔ متصلان بحلقة ضبط شدة التيار في مولد النبضات</li>
                </ul>
              </div>

              {/* Box 3: IRF520 MOSFET & Laser Diodes */}
              <div className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm space-y-2">
                <span className="font-bold text-rose-700 block text-sm flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs">٣</span>
                  <span>{isArabic ? 'وحدة الليزر العلاجي (IRF520 MOSFET ➔ 650nm Laser):' : 'IRF520 MOSFET & Laser:'}</span>
                </span>
                <ul className="space-y-1.5 leading-relaxed text-gray-600">
                  <li>• <strong>SIG</strong> في موديول IRF520 ➔ GPIO 25 في ESP32 (PWM)</li>
                  <li>• <strong>VCC & GND</strong> ➔ 5V و GND من مخرج الـ Boost Converter</li>
                  <li>• <strong>مخارج V+ و V-</strong> ➔ ديودات الليزر (650nm / 5mW) مع مقاومة 100Ω لحماية كل دايود</li>
                  <li>• <strong>عدد البواعث</strong> ➔ 2 إلى 4 ديودات موزعة على نقاط مسار العصب بالقناع</li>
                </ul>
              </div>

              {/* Box 4: Power Unit & Relays */}
              <div className="bg-white p-4 rounded-xl border border-teal-100 shadow-sm space-y-2">
                <span className="font-bold text-emerald-800 block text-sm flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">٤</span>
                  <span>{isArabic ? 'وحدة الطاقة، البطارية والريليهات (LiPo & Boost):' : 'Power Rail, LiPo & Relays:'}</span>
                </span>
                <ul className="space-y-1.5 leading-relaxed text-gray-600">
                  <li>• <strong>بطارية LiPo (3.7V)</strong> ➔ أطراف B+ و B- في شاحن TP4056</li>
                  <li>• <strong>مخرج TP4056 (OUT+ / OUT-)</strong> ➔ مفتاح الطاقة Power Switch ➔ مدخل DC-DC Boost</li>
                  <li>• <strong>مخرج Boost Converter</strong> ➔ مضبوط بواسطة البوتنشوميتر على 5V لتغذية ESP32 والموديولات</li>
                  <li>• <strong>Relay IN1 (القاطع العام)</strong> ➔ GPIO 15 (يفصل تيار الـ TENS كلياً عند التوقف)</li>
                  <li>• <strong>Relay IN2 (نصف الوجه الأيسر)</strong> ➔ GPIO 4</li>
                  <li>• <strong>Relay IN3 (نصف الوجه الأيمن)</strong> ➔ GPIO 16</li>
                  <li>• <strong>مفتاح الطوارئ (E-STOP)</strong> ➔ GPIO 34 إلى GND مع مقاومة سحب 10kΩ</li>
                </ul>
              </div>

            </div>

            {/* 16 Facial Motor Points Mapping Table */}
            <div className="bg-white p-5 rounded-xl border border-teal-100 shadow-sm space-y-3">
              <span className="font-bold text-[#14292b] block text-sm">
                {isArabic ? 'خريطة توزيع القنوات الـ 16 لموزع CD74HC4067 على عضلات الوجه:' : 'CD74HC4067 16-Channel Facial Motor Points Map:'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-semibold text-gray-600">
                <div className="p-2 bg-[#f4f9f8] rounded-lg border border-teal-50">C0: الجبهة يمين (Frontalis R)</div>
                <div className="p-2 bg-[#f4f9f8] rounded-lg border border-teal-50">C1: الجبهة يسار (Frontalis L)</div>
                <div className="p-2 bg-[#f4f9f8] rounded-lg border border-teal-50">C2: العين يمين (Oculi R)</div>
                <div className="p-2 bg-[#f4f9f8] rounded-lg border border-teal-50">C3: العين يسار (Oculi L)</div>
                <div className="p-2 bg-[#f4f9f8] rounded-lg border border-teal-50">C4: الوجنة يمين (Zygomatic R)</div>
                <div className="p-2 bg-[#f4f9f8] rounded-lg border border-teal-50">C5: الوجنة يسار (Zygomatic L)</div>
                <div className="p-2 bg-[#f4f9f8] rounded-lg border border-teal-50">C6: الخد يمين (Buccinator R)</div>
                <div className="p-2 bg-[#f4f9f8] rounded-lg border border-teal-50">C7: الخد يسار (Buccinator L)</div>
                <div className="p-2 bg-[#f4f9f8] rounded-lg border border-teal-50">C8: الشفة العليا يمين (Oris R)</div>
                <div className="p-2 bg-[#f4f9f8] rounded-lg border border-teal-50">C9: الشفة العليا يسار (Oris L)</div>
                <div className="p-2 bg-[#f4f9f8] rounded-lg border border-teal-50">C10: زاوية الفم يمين (Depressor R)</div>
                <div className="p-2 bg-[#f4f9f8] rounded-lg border border-teal-50">C11: زاوية الفم يسار (Depressor L)</div>
                <div className="p-2 bg-[#f4f9f8] rounded-lg border border-teal-50">C12: الذقن (Mentalis)</div>
                <div className="p-2 bg-[#f4f9f8] rounded-lg border border-teal-50">C13: العنق يمين (Platysma R)</div>
                <div className="p-2 bg-[#f4f9f8] rounded-lg border border-teal-50">C14: العنق يسار (Platysma L)</div>
                <div className="p-2 bg-[#f4f9f8] rounded-lg border border-teal-50">C15: مرجع التأريض للقناع (GND)</div>
              </div>
            </div>

          </div>
        ) : (
          <div className="relative">
            <pre className="bg-slate-950 text-slate-100 p-5 rounded-2xl overflow-x-auto text-xs font-mono-code max-h-96 border border-slate-800 leading-relaxed">
              <code>{currentCode}</code>
            </pre>
          </div>
        )}

      </div>

    </div>
  );
};
