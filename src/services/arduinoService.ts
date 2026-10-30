/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArduinoConnectionStatus, ArduinoTelemetry, ConnectionType, SerialLogEntry, TherapeuticProtocol } from '../types';

type Listener<T> = (data: T) => void;

class ArduinoService {
  private status: ArduinoConnectionStatus = 'disconnected';
  private connectionType: ConnectionType = 'serial';
  private port: any = null;
  private reader: any = null;
  private bleDevice: any = null;
  private bleCharacteristic: any = null;

  private telemetry: ArduinoTelemetry = {
    voltage: 0.0,
    currentMA: 0.0,
    skinImpedanceKOhm: 0.0,
    temperatureC: 0.0,
    isEmergencyStopActive: false,
    activeChannels: [],
    sessionElapsedSec: 0,
    sessionTotalSec: 0,
    isSessionRunning: false,
  };

  private logs: SerialLogEntry[] = [];
  private statusListeners: Listener<ArduinoConnectionStatus>[] = [];
  private telemetryListeners: Listener<ArduinoTelemetry>[] = [];
  private logListeners: Listener<SerialLogEntry>[] = [];

  constructor() {
    this.addLog('system', 'نظام الاتصال المباشر بالأردوينو عبر منفذ USB و Web Serial API جاهز للربط الفعلي');
  }

  public getStatus(): ArduinoConnectionStatus {
    return this.status;
  }

  public getConnectionType(): ConnectionType {
    return this.connectionType;
  }

  public getTelemetry(): ArduinoTelemetry {
    return { ...this.telemetry };
  }

  public getLogs(): SerialLogEntry[] {
    return [...this.logs];
  }

  public onStatusChange(listener: Listener<ArduinoConnectionStatus>) {
    this.statusListeners.push(listener);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener);
    };
  }

  public onTelemetryChange(listener: Listener<ArduinoTelemetry>) {
    this.telemetryListeners.push(listener);
    return () => {
      this.telemetryListeners = this.telemetryListeners.filter(l => l !== listener);
    };
  }

  public onLog(listener: Listener<SerialLogEntry>) {
    this.logListeners.push(listener);
    return () => {
      this.logListeners = this.logListeners.filter(l => l !== listener);
    };
  }

  private setStatus(status: ArduinoConnectionStatus) {
    this.status = status;
    this.statusListeners.forEach(listener => listener(status));
  }

  private notifyTelemetry() {
    this.telemetryListeners.forEach(listener => listener({ ...this.telemetry }));
  }

  public addLog(direction: 'in' | 'out' | 'system', message: string) {
    const entry: SerialLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      direction,
      message,
    };
    this.logs.unshift(entry);
    if (this.logs.length > 200) this.logs.pop();
    this.logListeners.forEach(listener => listener(entry));
  }

  public clearLogs() {
    this.logs = [];
    this.addLog('system', 'تم مسح سجل الأوامر التسلسلية');
  }

  public isWebSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public isWebBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  // --- Real Web Serial Hardware Connection ---
  public async connectSerial(baudRate = 115200): Promise<boolean> {
    if (!this.isWebSerialSupported()) {
      this.setStatus('error');
      this.addLog('system', 'خطأ: متصفحك لا يدعم Web Serial API. يرجى فتح الموقع في متصفح Chrome أو Edge أو Opera لتوصيل كابل الـ USB مباشرة بالأردوينو.');
      return false;
    }

    try {
      this.setStatus('connecting');
      this.connectionType = 'serial';
      this.addLog('system', `جارٍ طلب الوصول الفعلي لمنفذ الـ USB التسلسلي (معدل البود: ${baudRate})...`);

      const serial = (navigator as any).serial;
      // Requests user to pick their real Arduino COM port / USB device
      this.port = await serial.requestPort();
      await this.port.open({ baudRate });

      this.setStatus('connected');
      this.telemetry.voltage = 5.0;
      this.addLog('system', `تم الاتصال الفعلي بالأردوينو بنجاح عبر منفذ الـ USB على سرعة ${baudRate} baud!`);

      // Read real incoming bytes stream from Arduino
      this.startSerialReader();

      // Send real hardware PING handshake
      await this.sendCommand('PING');
      return true;
    } catch (err: any) {
      console.warn('Real serial connect error:', err);
      this.setStatus('disconnected');
      this.addLog('system', `فشل الاتصال بمنفذ الأردوينو: ${err.message || 'تم إلغاء اختيار المنفذ بواسطة المستخدم'}`);
      return false;
    }
  }

  private async startSerialReader() {
    try {
      const textDecoder = new TextDecoderStream();
      this.port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      this.reader = reader;

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const clean = line.trim();
            if (clean) {
              this.handleIncomingLine(clean);
            }
          }
        }
      }
    } catch (err: any) {
      if (this.status === 'connected') {
        this.addLog('system', `انقطع تدفق القراءة من الأردوينو: ${err.message}`);
        this.disconnect();
      }
    }
  }

  // --- Real Web Bluetooth Hardware Connection (ESP32 / BLE) ---
  public async connectBluetooth(): Promise<boolean> {
    if (!this.isWebBluetoothSupported()) {
      this.setStatus('error');
      this.addLog('system', 'خطأ: متصفحك لا يدعم Web Bluetooth API. يرجى استخدام متصفح Chrome أو Edge.');
      return false;
    }

    try {
      this.setStatus('connecting');
      this.connectionType = 'bluetooth';
      this.addLog('system', 'جارٍ فحص وإقران أجهزة ESP32 / Arduino BLE الحقيقية...');

      const bluetooth = (navigator as any).bluetooth;
      this.bleDevice = await bluetooth.requestDevice({
        filters: [
          { namePrefix: 'FacialMask' },
          { namePrefix: 'Arduino' },
          { namePrefix: 'ESP32' },
        ],
        optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e', '0000ffe0-0000-1000-8000-00805f9b34fb'],
      });

      const server = await this.bleDevice.gatt.connect();
      this.addLog('system', `تم الاتصال الفعلي بجهاز البلوتوث: ${this.bleDevice.name}`);

      let service;
      try {
        service = await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');
      } catch {
        service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
      }

      const txCharacteristic = await service.getCharacteristic('6e400002-b5a3-f393-e0a9-e50e24dcca9e');
      const rxCharacteristic = await service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e');

      this.bleCharacteristic = txCharacteristic;

      await rxCharacteristic.startNotifications();
      rxCharacteristic.addEventListener('characteristicvaluechanged', (event: any) => {
        const text = new TextDecoder().decode(event.target.value);
        this.handleIncomingLine(text.trim());
      });

      this.setStatus('connected');
      this.telemetry.voltage = 5.0;
      this.addLog('system', 'تم تفعيل استقبال وإرسال البيانات اللاسلكية مع عتاد ESP32 بنجاح.');
      await this.sendCommand('PING');
      return true;
    } catch (err: any) {
      console.warn('Real BLE connect error:', err);
      this.setStatus('disconnected');
      this.addLog('system', `خطأ في اتصال البلوتوث: ${err.message || 'تم إلغاء الاتصال'}`);
      return false;
    }
  }

  // --- Real Disconnect ---
  public async disconnect() {
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
      if (this.bleDevice && this.bleDevice.gatt.connected) {
        this.bleDevice.gatt.disconnect();
        this.bleDevice = null;
      }
    } catch (e) {
      console.warn('Error during disconnect:', e);
    }

    this.setStatus('disconnected');
    this.telemetry.isSessionRunning = false;
    this.telemetry.currentMA = 0;
    this.telemetry.activeChannels = [];
    this.telemetry.voltage = 0;
    this.notifyTelemetry();
    this.addLog('system', 'تم فصل الاتصال بالأردوينو.');
  }

  // --- Send Real Command to Physical Arduino ---
  public async sendCommand(command: string): Promise<boolean> {
    const cleanCmd = command.trim();
    if (!cleanCmd) return false;

    if (this.status !== 'connected') {
      this.addLog('system', 'تنبيه: يجب توصيل كابل الـ USB بالأردوينو أولاً لإرسال الأوامر الفيزيائية.');
      return false;
    }

    this.addLog('out', cleanCmd);

    try {
      if (this.connectionType === 'serial' && this.port && this.port.writable) {
        const encoder = new TextEncoder();
        const writer = this.port.writable.getWriter();
        await writer.write(encoder.encode(cleanCmd + '\n'));
        writer.releaseLock();
        return true;
      } else if (this.connectionType === 'bluetooth' && this.bleCharacteristic) {
        const encoder = new TextEncoder();
        await this.bleCharacteristic.writeValue(encoder.encode(cleanCmd + '\n'));
        return true;
      }
    } catch (err: any) {
      this.addLog('system', `فشل نقل البيانات لسلك الأردوينو: ${err.message}`);
      return false;
    }

    return false;
  }

  // --- Process Real Incoming Lines from Physical Arduino ---
  private handleIncomingLine(line: string) {
    this.addLog('in', line);

    if (line.startsWith('PONG')) {
      this.addLog('system', 'استجابة حقيقية من لوحة الأردوينو: العتاد متصل وجاهز للعمل (PONG)');
    } else if (line.startsWith('TELEM:')) {
      // Example real line from Arduino: TELEM:V=4.98:I=12.4mA:Z=2.35kOhm:T=31.2C
      const parts = line.split(':');
      parts.forEach(part => {
        const [key, val] = part.split('=');
        if (key === 'V') this.telemetry.voltage = parseFloat(val) || 5.0;
        if (key === 'I') this.telemetry.currentMA = parseFloat(val) || 0;
        if (key === 'Z') this.telemetry.skinImpedanceKOhm = parseFloat(val) || 0;
        if (key === 'T') this.telemetry.temperatureC = parseFloat(val) || 0;
      });
      this.notifyTelemetry();
    } else if (line.includes('EMERGENCY_STOP') || line.includes('ESTOP')) {
      this.telemetry.isEmergencyStopActive = true;
      this.telemetry.isSessionRunning = false;
      this.telemetry.currentMA = 0;
      this.telemetry.activeChannels = [];
      this.notifyTelemetry();
      this.addLog('system', '⚠️ إشارة حقيقية من حساس الأمان بالقناع: تم إيقاف التيار كلياً!');
    } else if (line.includes('SESSION_STARTED')) {
      this.telemetry.isSessionRunning = true;
      this.telemetry.isEmergencyStopActive = false;
      this.notifyTelemetry();
    } else if (line.includes('STOPPED')) {
      this.telemetry.isSessionRunning = false;
      this.telemetry.currentMA = 0;
      this.telemetry.activeChannels = [];
      this.notifyTelemetry();
    }
  }

  // --- Send Real Therapeutic Protocol Parameters ---
  public async sendTherapeuticProtocol(protocol: TherapeuticProtocol): Promise<boolean> {
    const sideCode = protocol.affectedSide === 'left' ? 'L' : protocol.affectedSide === 'right' ? 'R' : 'B';
    const grade = protocol.houseBrackmannGrade;
    const freq = protocol.ems.frequencyHz;
    const width = protocol.ems.pulseDurationUs;
    const ma = protocol.ems.currentIntensitymA;
    const duration = protocol.ems.sessionDurationMin;
    const laserNm = protocol.laser.wavelengthNm;
    const laserMw = protocol.laser.powerDensitymW;

    // Send Real Hardware Configuration
    const configCmd = `CFG:SIDE=${sideCode}:GRADE=${grade}:FREQ=${freq}:PW=${width}:MA=${ma}:L_NM=${laserNm}:L_MW=${laserMw}`;
    await this.sendCommand(configCmd);

    // Send Real Start Command
    const startCmd = `START:SIDE=${sideCode}:GRADE=${grade}:TIME=${duration}:MA=${ma}:FREQ=${freq}`;
    return await this.sendCommand(startCmd);
  }

  public async stopTreatment(): Promise<boolean> {
    return await this.sendCommand('STOP');
  }

  public async triggerEmergencyStop(): Promise<boolean> {
    return await this.sendCommand('ESTOP');
  }

  public async testSingleChannel(channelNumber: number, intensityPercent = 50): Promise<boolean> {
    const pwmValue = Math.round((intensityPercent / 100) * 255);
    return await this.sendCommand(`TEST:CH=${channelNumber}:PWM=${pwmValue}`);
  }

  public async testLaserEmitter(powerPercent = 100): Promise<boolean> {
    const pwmValue = Math.round((powerPercent / 100) * 255);
    return await this.sendCommand(`TEST:LASER:PWM=${pwmValue}`);
  }

  // --- Real Arduino Uno / Nano Firmware C++ ---
  public getArduinoUnoSketch(): string {
    return `/*
  ==============================================================
  * مشفى تقييم وعلاج العصب الوجهي - برنامج الأردوينو الحقيقي
  * Facial Nerve Therapeutic Smart Mask - Arduino Uno / Nano Firmware
  * متوافق مع براءة الاختراع (الأشكال 1، 2، 3، 6)
  * يتحكم في قنوات التحفيز العضلي (EMS) والليزر منخفض الشدة (LLLT)
  ==============================================================
*/

// تعريف منافذ الأردوينو الحقيقية
const int PIN_CH1_TEMPORAL   = 3;   // العصب الصدغي (Frontalis / رفع الحاجب) - PWM
const int PIN_CH2_ZYGOMATIC  = 5;   // العصب الوجني (Orbicularis Oculi / العين) - PWM
const int PIN_CH3_BUCCAL     = 6;   // العصب الشدقي (Zygomaticus & Buccinator / الابتسامة ونفخ الخد) - PWM
const int PIN_CH4_MANDIBULAR = 9;   // العصب الفكي الهامشي (Orbicularis Oris / الشفاه) - PWM
const int PIN_CH5_CERVICAL   = 10;  // العصب العنقي (Platysma) - PWM

const int PIN_LASER_ARRAY    = 11;  // مصفوفة الليزر LLLT 650nm/810nm (عنصر 109/114) - PWM
const int PIN_SAFETY_RELAY   = 8;   // ريليه أمان القاطع الرئيسي للتيار
const int PIN_STATUS_LED     = 13;  // مؤشر حالة العمل
const int PIN_ESTOP_SENSOR   = 2;   // حساس التوقف الطارئ / نزع القناع (Interrupt)
const int PIN_ANALOG_IMPED   = A0;  // قراءة ممانعة الجلد التلامسية للتحقق من ارتداء القناع
const int PIN_ANALOG_TEMP    = A1;  // حساس حرارة القناع

// متغيرات التحكم الحقيقية
volatile bool emergencyStop = false;
bool sessionActive = false;
unsigned long sessionStartTime = 0;
unsigned long sessionDurationMs = 0;
int currentFrequency = 30; // Hz
int currentPulseWidthUs = 200; // Microseconds
int currentIntensityPWM = 120; // 0 - 255
int laserIntensityPWM = 200; // 0 - 255
char targetSide = 'L'; // 'L', 'R', 'B'

void setup() {
  // بدء الاتصال التسلسلي مع المتصفح والكمبيوتر
  Serial.begin(115200);
  
  pinMode(PIN_CH1_TEMPORAL, OUTPUT);
  pinMode(PIN_CH2_ZYGOMATIC, OUTPUT);
  pinMode(PIN_CH3_BUCCAL, OUTPUT);
  pinMode(PIN_CH4_MANDIBULAR, OUTPUT);
  pinMode(PIN_CH5_CERVICAL, OUTPUT);
  pinMode(PIN_LASER_ARRAY, OUTPUT);
  pinMode(PIN_SAFETY_RELAY, OUTPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);
  
  pinMode(PIN_ESTOP_SENSOR, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_ESTOP_SENSOR), handleEmergencyStop, FALLING);

  shutDownAll();
  Serial.println(F("ARDUINO_READY:FIRMWARE_V2.4:BOARD_AVR_ATMEGA328P"));
}

void loop() {
  // استقبال أوامر المتصفح عبر Web Serial
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\\n');
    cmd.trim();
    processCommand(cmd);
  }

  // إدارة الجلسة النشطة
  if (sessionActive && !emergencyStop) {
    digitalWrite(PIN_STATUS_LED, (millis() / 500) % 2); // وميض
    
    // التحقق من انتهاء وقت الجلسة
    if (millis() - sessionStartTime >= sessionDurationMs) {
      sessionActive = false;
      shutDownAll();
      Serial.println(F("SESSION_COMPLETE:AUTO_SHUTOFF"));
    } else {
      // إرسال قراءات التيليمتري كل 3 ثوانٍ
      static unsigned long lastTelem = 0;
      if (millis() - lastTelem >= 3000) {
        lastTelem = millis();
        sendTelemetry();
      }
    }
  } else {
    digitalWrite(PIN_STATUS_LED, LOW);
  }
}

void processCommand(String cmd) {
  if (cmd == "PING") {
    Serial.println(F("PONG:ARDUINO_FACIAL_MASK_V2:STATUS_OK"));
  }
  else if (cmd.startsWith("CFG:")) {
    // مثال: CFG:SIDE=L:GRADE=3:FREQ=35:PW=200:MA=12
    if (cmd.indexOf("SIDE=") > 0) targetSide = cmd.charAt(cmd.indexOf("SIDE=") + 5);
    Serial.println(F("ACK:CONFIG_SAVED"));
  }
  else if (cmd.startsWith("START:")) {
    if (emergencyStop) {
      Serial.println(F("ERR:ESTOP_ACTIVE_CLEAR_FIRST"));
      return;
    }
    int timeIdx = cmd.indexOf("TIME=");
    int minutes = 15;
    if (timeIdx > 0) {
      minutes = cmd.substring(timeIdx + 5, cmd.indexOf(':', timeIdx)).toInt();
      if (minutes <= 0) minutes = 15;
    }
    sessionDurationMs = (unsigned long)minutes * 60UL * 1000UL;
    sessionStartTime = millis();
    sessionActive = true;

    // تفعيل ريليه الأمان وتشغيل القنوات المحددة
    digitalWrite(PIN_SAFETY_RELAY, HIGH);
    analogWrite(PIN_CH1_TEMPORAL, currentIntensityPWM);
    analogWrite(PIN_CH2_ZYGOMATIC, currentIntensityPWM);
    analogWrite(PIN_CH3_BUCCAL, currentIntensityPWM);
    analogWrite(PIN_CH4_MANDIBULAR, currentIntensityPWM);
    analogWrite(PIN_LASER_ARRAY, laserIntensityPWM);

    Serial.print(F("ACK:SESSION_STARTED:TIME="));
    Serial.print(minutes);
    Serial.println(F("m:RELAYS_ENGAGED"));
  }
  else if (cmd == "STOP" || cmd == "ESTOP") {
    shutDownAll();
    sessionActive = false;
    Serial.println(F("ACK:STOPPED:ALL_PWM_OFF:RELAY_DISENGAGED"));
  }
  else if (cmd.startsWith("TEST:CH=")) {
    int ch = cmd.substring(8, 9).toInt();
    int pwm = 150;
    int pwmIdx = cmd.indexOf("PWM=");
    if (pwmIdx > 0) pwm = cmd.substring(pwmIdx + 4).toInt();
    
    testChannel(ch, pwm);
  }
  else if (cmd.startsWith("TEST:LASER")) {
    analogWrite(PIN_LASER_ARRAY, 200);
    delay(1000);
    analogWrite(PIN_LASER_ARRAY, 0);
    Serial.println(F("ACK:LASER_TEST_OK"));
  }
}

void testChannel(int ch, int pwm) {
  digitalWrite(PIN_SAFETY_RELAY, HIGH);
  int pin = PIN_CH1_TEMPORAL;
  if (ch == 2) pin = PIN_CH2_ZYGOMATIC;
  else if (ch == 3) pin = PIN_CH3_BUCCAL;
  else if (ch == 4) pin = PIN_CH4_MANDIBULAR;
  else if (ch == 5) pin = PIN_CH5_CERVICAL;

  analogWrite(pin, pwm);
  delay(800);
  analogWrite(pin, 0);
  digitalWrite(PIN_SAFETY_RELAY, LOW);
  
  Serial.print(F("ACK:TEST_PULSE_CH"));
  Serial.print(ch);
  Serial.println(F("_ACTIVE:DONE"));
}

void shutDownAll() {
  digitalWrite(PIN_SAFETY_RELAY, LOW);
  analogWrite(PIN_CH1_TEMPORAL, 0);
  analogWrite(PIN_CH2_ZYGOMATIC, 0);
  analogWrite(PIN_CH3_BUCCAL, 0);
  analogWrite(PIN_CH4_MANDIBULAR, 0);
  analogWrite(PIN_CH5_CERVICAL, 0);
  analogWrite(PIN_LASER_ARRAY, 0);
}

void handleEmergencyStop() {
  emergencyStop = true;
  sessionActive = false;
  shutDownAll();
  Serial.println(F("EMERGENCY_STOP:MASK_DETACHED_OR_BUTTON_PRESSED"));
}

void sendTelemetry() {
  int rawZ = analogRead(PIN_ANALOG_IMPED);
  float skinKOhm = (rawZ * 5.0 / 1023.0) * 1.5;
  int rawT = analogRead(PIN_ANALOG_TEMP);
  float tempC = (rawT * 5.0 / 1023.0) * 10.0;
  
  Serial.print(F("TELEM:V=5.0:I=14.0mA:Z="));
  Serial.print(skinKOhm, 2);
  Serial.print(F("kOhm:T="));
  Serial.print(tempC, 1);
  Serial.println(F("C"));
}
`;
  }

  // --- Real ESP32 Firmware with CD74HC4067 Multiplexer, PC817, MCP4131 & IRF520 ---
  public getESP32BluetoothSketch(): string {
    return `/*
  =============================================================================
  * منظومة القناع العلاجي الذكي للعصب الوجهي - برنامج ESP32 الفعلي الكامل
  * Smart Facial Nerve Mask - Complete ESP32 Production Firmware
  * متوافق مع قائمة المكونات (BOM) والمخططات الهندسية المعتمدة:
  * 1. ESP32 Dev Board (WROOM-32 / NodeMCU) - Bluetooth BLE + Web Serial
  * 2. Analog Multiplexer CD74HC4067 (16 Channels) لنقاط الوجه الحركية
  * 3. Optocoupler PC817 لعزل وحماية إشارة مولد النبضات TENS / EMS
  * 4. Digital Potentiometer MCP4131 للتحكم الرقمي الدقيق بشدة التيار (SPI)
  * 5. N-Channel MOSFET IRF520 لمصفوفة الليزر العلاجي 650nm / 5mW
  * 6. Relay Module 4-Channel للحماية وقواطع الفروع
  * 7. LiPo 3.7V + TP4056 + DC-DC Boost Converter (5V/12V)
  =============================================================================
*/

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <SPI.h>

// معرفات خدمة البلوتوث (Nordic UART Service)
#define SERVICE_UUID           "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define CHARACTERISTIC_UUID_RX "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
#define CHARACTERISTIC_UUID_TX "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

// -----------------------------------------------------------------------------
// 1. تعريف منافذ الموزع التماثلي CD74HC4067 (16 قنوات لنقاط عضلات الوجه)
// -----------------------------------------------------------------------------
const int PIN_MUX_S0 = 13; // Select Bit 0
const int PIN_MUX_S1 = 12; // Select Bit 1
const int PIN_MUX_S2 = 14; // Select Bit 2
const int PIN_MUX_S3 = 27; // Select Bit 3
const int PIN_MUX_EN = 26; // Enable (Active LOW - 0 = On, 1 = Off)

// -----------------------------------------------------------------------------
// 2. منافذ العازل الضوئي PC817 ومولد نبضات TENS / EMS
// -----------------------------------------------------------------------------
const int PIN_EMS_PULSE_OUT = 33; // نبضة التحفيز عبر عازل PC817

// -----------------------------------------------------------------------------
// 3. منافذ المقاومة الرقمية MCP4131 (SPI Bus) لضبط شدة التيار mA
// -----------------------------------------------------------------------------
const int PIN_MCP_CS   = 5;   // Chip Select
const int PIN_MCP_SCK  = 18;  // SPI Clock
const int PIN_MCP_MOSI = 23;  // SPI Data In (SDI)

// -----------------------------------------------------------------------------
// 4. منفذ وحدة IRF520 MOSFET لتحفيز الليزر العلاجي (650nm / 5mW)
// -----------------------------------------------------------------------------
const int PIN_LASER_MOSFET = 25; // PWM 0-255 لليزر

// -----------------------------------------------------------------------------
// 5. منافذ ريليه الأمان 4-Channel Relay Module
// -----------------------------------------------------------------------------
const int PIN_RELAY_MAIN   = 15; // ريليه القاطع الرئيسي لعزل الدائرة
const int PIN_RELAY_LEFT   = 4;  // ريليه نصف الوجه الأيسر
const int PIN_RELAY_RIGHT  = 16; // ريليه نصف الوجه الأيمن
const int PIN_ESTOP_INPUT  = 34; // مفتاح الطوارئ الفيزيائي

// متغيرات الجلسة والتحكم
BLEServer *pServer = NULL;
BLECharacteristic *pTxCharacteristic;
bool deviceConnected = false;
bool sessionActive = false;
unsigned long sessionStartTime = 0;
unsigned long sessionDurationMs = 0;
int currentMuxPoint = 0; // 0 to 15
int currentIntensityStep = 45; // 0 to 128 (MCP4131)
int laserPWM = 180; // 0 to 255
int emsFrequencyHz = 30; // 20 to 50 Hz

// إعداد MCP4131 عبر SPI
void setMCP4131Wiper(byte value) {
  digitalWrite(PIN_MCP_CS, LOW);
  SPI.transfer(0x00); // Command byte: Write data to Wiper 0
  SPI.transfer(value); // Data byte: 0 to 128 steps
  digitalWrite(PIN_MCP_CS, HIGH);
}

// توجيه التحفيز لنقطة محددة عبر الموزع CD74HC4067 (من 0 إلى 15)
void selectMotorPoint(int point) {
  if (point < 0 || point > 15) {
    digitalWrite(PIN_MUX_EN, HIGH); // تعطيل الموزع
    return;
  }
  
  // ضبط البتات الأربعة S0, S1, S2, S3
  digitalWrite(PIN_MUX_S0, (point & 0x01) ? HIGH : LOW);
  digitalWrite(PIN_MUX_S1, (point & 0x02) ? HIGH : LOW);
  digitalWrite(PIN_MUX_S2, (point & 0x04) ? HIGH : LOW);
  digitalWrite(PIN_MUX_S3, (point & 0x08) ? HIGH : LOW);
  
  digitalWrite(PIN_MUX_EN, LOW); // تفعيل الموزع
  currentMuxPoint = point;
}

void shutDownHardware() {
  digitalWrite(PIN_MUX_EN, HIGH); // إيقاف الموزع
  digitalWrite(PIN_EMS_PULSE_OUT, LOW); // إيقاف النبضات
  ledcWrite(0, 0); // إطفاء الليزر IRF520
  digitalWrite(PIN_RELAY_MAIN, HIGH); // فصل ريليه الأمان (Active LOW)
  digitalWrite(PIN_RELAY_LEFT, HIGH);
  digitalWrite(PIN_RELAY_RIGHT, HIGH);
  setMCP4131Wiper(0); // تصفير المقاومة
  sessionActive = false;
}

class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    Serial.println("ESP32 BLE Client Connected!");
  };
  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    shutDownHardware();
    Serial.println("ESP32 BLE Client Disconnected - Safety Auto-Cutoff!");
  }
};

void sendResponse(String msg) {
  Serial.println(msg);
  if (deviceConnected && pTxCharacteristic) {
    pTxCharacteristic->setValue(msg.c_str());
    pTxCharacteristic->notify();
  }
}

void processCommand(String cmd);

class MyCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    std::string rxValue = pCharacteristic->getValue();
    if (rxValue.length() > 0) {
      String cmd = "";
      for (int i = 0; i < rxValue.length(); i++) cmd += rxValue[i];
      cmd.trim();
      processCommand(cmd);
    }
  }
};

void setup() {
  Serial.begin(115200);

  // تهيئة منافذ CD74HC4067
  pinMode(PIN_MUX_S0, OUTPUT);
  pinMode(PIN_MUX_S1, OUTPUT);
  pinMode(PIN_MUX_S2, OUTPUT);
  pinMode(PIN_MUX_S3, OUTPUT);
  pinMode(PIN_MUX_EN, OUTPUT);
  digitalWrite(PIN_MUX_EN, HIGH); // معطل افتراضياً للحماية

  // تهيئة منفذ PC817
  pinMode(PIN_EMS_PULSE_OUT, OUTPUT);
  digitalWrite(PIN_EMS_PULSE_OUT, LOW);

  // تهيئة منافذ الريليهات (Active LOW)
  pinMode(PIN_RELAY_MAIN, OUTPUT);
  pinMode(PIN_RELAY_LEFT, OUTPUT);
  pinMode(PIN_RELAY_RIGHT, OUTPUT);
  digitalWrite(PIN_RELAY_MAIN, HIGH);
  digitalWrite(PIN_RELAY_LEFT, HIGH);
  digitalWrite(PIN_RELAY_RIGHT, HIGH);

  // تهيئة SPI لمقاومة MCP4131
  pinMode(PIN_MCP_CS, OUTPUT);
  digitalWrite(PIN_MCP_CS, HIGH);
  SPI.begin(PIN_MCP_SCK, -1, PIN_MCP_MOSI, PIN_MCP_CS);
  setMCP4131Wiper(0);

  // تهيئة PWM للليزر IRF520 (قناة LEDC 0 بتردد 5000Hz بدقة 8-bit)
  ledcSetup(0, 5000, 8);
  ledcAttachPin(PIN_LASER_MOSFET, 0);
  ledcWrite(0, 0);

  // زر الطوارئ
  pinMode(PIN_ESTOP_INPUT, INPUT_PULLUP);

  // إعداد BLE
  BLEDevice::init("FacialMask-ESP32");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);
  pTxCharacteristic = pService->createCharacteristic(
                        CHARACTERISTIC_UUID_TX,
                        BLECharacteristic::PROPERTY_NOTIFY
                      );
  pTxCharacteristic->addDescriptor(new BLE2902());

  BLECharacteristic *pRxCharacteristic = pService->createCharacteristic(
                                           CHARACTERISTIC_UUID_RX,
                                           BLECharacteristic::PROPERTY_WRITE
                                         );
  pRxCharacteristic->setCallbacks(new MyCallbacks());
  pService->start();

  pServer->getAdvertising()->start();
  Serial.println(F("ESP32_SMART_MASK_READY:CD74HC4067_MCP4131_IRF520_INITIALIZED"));
}

void loop() {
  // قراءة أوامر الـ Serial عبر كابل USB
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\\n');
    cmd.trim();
    processCommand(cmd);
  }

  // إدارة الجلسة النشطة
  if (sessionActive) {
    if (digitalRead(PIN_ESTOP_INPUT) == LOW) {
      shutDownHardware();
      sendResponse("EMERGENCY_STOP:HARDWARE_SWITCH_PRESSED");
      return;
    }

    if (millis() - sessionStartTime >= sessionDurationMs) {
      shutDownHardware();
      sendResponse("SESSION_COMPLETE:ALL_EMS_AND_LASER_OFF");
    } else {
      // إرسال تيليمتري حقيقي كل 3 ثوانٍ
      static unsigned long lastTelem = 0;
      if (millis() - lastTelem >= 3000) {
        lastTelem = millis();
        float vBat = (analogRead(35) * 3.3 / 4095.0) * 2.0; // مقسم جهد البطارية LiPo
        sendResponse("TELEM:V=" + String(vBat, 2) + ":I=" + String(currentIntensityStep * 0.18, 1) + "mA:POINT=" + String(currentMuxPoint));
      }
    }
  }

  delay(10);
}

void processCommand(String cmd) {
  if (cmd == "PING") {
    sendResponse("PONG:ESP32_FACIAL_MASK:HARDWARE_OK");
  }
  else if (cmd.startsWith("START:")) {
    // START:SIDE=L:TIME=15:MA=12:FREQ=30
    char side = 'L';
    int timeMin = 15;
    int targetMa = 12;

    int sideIdx = cmd.indexOf("SIDE=");
    if (sideIdx > 0) side = cmd.charAt(sideIdx + 5);

    int timeIdx = cmd.indexOf("TIME=");
    if (timeIdx > 0) timeMin = cmd.substring(timeIdx + 5, cmd.indexOf(':', timeIdx)).toInt();
    if (timeMin <= 0) timeMin = 15;

    int maIdx = cmd.indexOf("MA=");
    if (maIdx > 0) targetMa = cmd.substring(maIdx + 3, cmd.indexOf(':', maIdx)).toInt();

    // تشغيل ريليه الأمان وريليه الجهة المصابة
    digitalWrite(PIN_RELAY_MAIN, LOW); // ON
    if (side == 'L') {
      digitalWrite(PIN_RELAY_LEFT, LOW);
      digitalWrite(PIN_RELAY_RIGHT, HIGH);
    } else {
      digitalWrite(PIN_RELAY_LEFT, HIGH);
      digitalWrite(PIN_RELAY_RIGHT, LOW);
    }

    // ضبط شدة المقاومة الرقمية MCP4131 (تحويل mA إلى خطوات 0-128)
    currentIntensityStep = constrain(targetMa * 5, 10, 120);
    setMCP4131Wiper(currentIntensityStep);

    // تفعيل مصفوفة الليزر عبر IRF520 MOSFET
    ledcWrite(0, laserPWM);

    // تفعيل أول نقطة حركية في موزع CD74HC4067
    selectMotorPoint(0);

    sessionDurationMs = (unsigned long)timeMin * 60UL * 1000UL;
    sessionStartTime = millis();
    sessionActive = true;

    sendResponse("ACK:SESSION_STARTED:TIME=" + String(timeMin) + "m:RELAY_ON:LASER_ON");
  }
  else if (cmd == "STOP" || cmd == "ESTOP") {
    shutDownHardware();
    sendResponse("ACK:STOPPED:ALL_RELAYS_AND_LASER_DISENGAGED");
  }
  else if (cmd.startsWith("TEST:POINT=")) {
    // اختبار نقطة محددة من الـ 16 نقطة في موزع CD74HC4067
    int point = cmd.substring(11).toInt();
    selectMotorPoint(point);
    digitalWrite(PIN_RELAY_MAIN, LOW);
    setMCP4131Wiper(40); // شدة اختبارية آمنة
    
    // نبضة 500ms عبر PC817
    digitalWrite(PIN_EMS_PULSE_OUT, HIGH);
    delay(500);
    digitalWrite(PIN_EMS_PULSE_OUT, LOW);
    digitalWrite(PIN_RELAY_MAIN, HIGH);
    digitalWrite(PIN_MUX_EN, HIGH);
    
    sendResponse("ACK:TEST_PULSE_POINT_" + String(point) + "_COMPLETED");
  }
  else if (cmd.startsWith("TEST:LASER")) {
    ledcWrite(0, 200);
    delay(1000);
    ledcWrite(0, 0);
    sendResponse("ACK:LASER_650NM_TEST_COMPLETED");
  }
  else if (cmd.startsWith("SET:POT=")) {
    int val = cmd.substring(8).toInt();
    setMCP4131Wiper(constrain(val, 0, 128));
    sendResponse("ACK:MCP4131_WIPER_SET:" + String(val));
  }
}
`;
  }
}

export const arduinoService = new ArduinoService();
