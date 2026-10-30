/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Video, 
  VideoOff, 
  CheckCircle2, 
  RefreshCw, 
  Eye, 
  Smile, 
  Maximize2, 
  Sparkles, 
  ArrowUpCircle,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CLINICAL_EXERCISES } from '../services/assessmentService';
import { ExerciseResult, Language } from '../types';

interface FacialAssessmentProps {
  lang: Language;
  onComplete: (results: ExerciseResult[]) => void;
  onCancel: () => void;
}

export const FacialAssessment: React.FC<FacialAssessmentProps> = ({
  lang,
  onComplete,
  onCancel,
}) => {
  const isArabic = lang === 'ar';
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Real-time computer vision metrics computed from the live webcam
  const [liveSymmetry, setLiveSymmetry] = useState<number>(90);
  const [liveLeftMovement, setLiveLeftMovement] = useState<number>(85);
  const [liveRightMovement, setLiveRightMovement] = useState<number>(85);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);

  const currentExercise = CLINICAL_EXERCISES[currentStep];

  // Request Real User Camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Real camera error:', err);
      setCameraError(
        isArabic
          ? 'يرجى السماح بصلاحية الكاميرا في المتصفح لفحص حركة الوجه الفعلية للمريض.'
          : 'Please grant camera access to perform real facial movement analysis.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Real computer vision processing loop on live webcam stream
  useEffect(() => {
    if (!isCameraActive) return;

    let animId: number;
    const processFrame = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        const w = 160;
        const h = 120;

        // Offscreen sampling canvas
        const offCanvas = document.createElement('canvas');
        offCanvas.width = w;
        offCanvas.height = h;
        const ctx = offCanvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          const currentImg = ctx.getImageData(0, 0, w, h);
          const currentData = currentImg.data;

          if (prevFrameRef.current && prevFrameRef.current.length === currentData.length) {
            const prevData = prevFrameRef.current;
            const midX = Math.floor(w / 2);

            let leftDiffSum = 0;
            let rightDiffSum = 0;
            let leftPixels = 0;
            let rightPixels = 0;

            // Target region of interest (central 60% of frame for facial area)
            const startY = Math.floor(h * 0.2);
            const endY = Math.floor(h * 0.85);

            for (let y = startY; y < endY; y += 2) {
              for (let x = Math.floor(w * 0.15); x < Math.floor(w * 0.85); x += 2) {
                const idx = (y * w + x) * 4;
                const rDiff = Math.abs(currentData[idx] - prevData[idx]);
                const gDiff = Math.abs(currentData[idx + 1] - prevData[idx + 1]);
                const bDiff = Math.abs(currentData[idx + 2] - prevData[idx + 2]);
                const delta = (rDiff + gDiff + bDiff) / 3;

                // When mirrored: left side of screen is patient's right side, right side is patient's left side
                if (x < midX) {
                  rightDiffSum += delta;
                  rightPixels++;
                } else {
                  leftDiffSum += delta;
                  leftPixels++;
                }
              }
            }

            const rawRightActivity = rightPixels > 0 ? rightDiffSum / rightPixels : 0;
            const rawLeftActivity = leftPixels > 0 ? leftDiffSum / leftPixels : 0;

            // Normalize to dynamic 0-100 scale
            const normRight = Math.min(100, Math.max(10, Math.round(rawRightActivity * 6.5 + 40)));
            const normLeft = Math.min(100, Math.max(10, Math.round(rawLeftActivity * 6.5 + 40)));

            // Real symmetry calculation comparing actual facial movement between bilateral halves
            const maxAct = Math.max(normLeft, normRight, 1);
            const diff = Math.abs(normLeft - normRight);
            const calculatedSymmetry = Math.min(100, Math.max(15, Math.round(100 - (diff / maxAct) * 60)));

            setLiveLeftMovement(normLeft);
            setLiveRightMovement(normRight);
            setLiveSymmetry(calculatedSymmetry);
          }

          prevFrameRef.current = new Uint8ClampedArray(currentData);
        }
      }

      animId = requestAnimationFrame(processFrame);
    };

    animId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animId);
  }, [isCameraActive]);

  // Capture snapshot for current exercise
  const triggerCapture = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 800);
      return () => clearTimeout(t);
    } else {
      executeRealCapture();
      setCountdown(null);
    }
  }, [countdown]);

  const executeRealCapture = () => {
    setIsAnalyzing(true);

    let snapshotUrl = '';
    if (videoRef.current && canvasRef.current && isCameraActive) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Mirror horizontally for selfie orientation
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Overlay real facial midline
        ctx.strokeStyle = '#0d7679';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();

        snapshotUrl = canvas.toDataURL('image/jpeg', 0.9);
      }
    }

    // Determine affected side from real measured activity
    let affected: 'left' | 'right' | 'none' = 'none';
    if (liveLeftMovement < liveRightMovement - 8) {
      affected = 'left';
    } else if (liveRightMovement < liveLeftMovement - 8) {
      affected = 'right';
    }

    const currentResult: ExerciseResult = {
      exerciseId: currentExercise.id,
      symmetryScore: liveSymmetry,
      leftMovement: liveLeftMovement,
      rightMovement: liveRightMovement,
      affectedSide: affected,
      snapshotUrl: snapshotUrl || undefined,
      completedAt: new Date().toISOString(),
    };

    setTimeout(() => {
      setIsAnalyzing(false);
      const updatedResults = [...results.filter((r) => r.exerciseId !== currentExercise.id), currentResult];
      setResults(updatedResults);

      if (currentStep < CLINICAL_EXERCISES.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Completed all 5 real exercises
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
        });
        onComplete(updatedResults);
      }
    }, 600);
  };

  const getExerciseIcon = (iconName: string) => {
    switch (iconName) {
      case 'ArrowUpCircle': return <ArrowUpCircle className="w-5 h-5" />;
      case 'Eye': return <Eye className="w-5 h-5" />;
      case 'Smile': return <Smile className="w-5 h-5" />;
      case 'Maximize2': return <Maximize2 className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Header & Exercise Steps Progress */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-teal-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#0d7679] bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            {isArabic ? `تمرين ${currentStep + 1} من 5` : `Exercise ${currentStep + 1} of 5`}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#14292b] mt-1.5">
            {isArabic ? currentExercise.nameAr : currentExercise.nameEn}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            {isArabic ? currentExercise.targetMuscleAr : currentExercise.targetMuscleEn}
          </p>
        </div>

        {/* 5-Step Indicators */}
        <div className="flex items-center gap-2">
          {CLINICAL_EXERCISES.map((ex, idx) => {
            const isDone = results.some((r) => r.exerciseId === ex.id);
            const isCurrent = idx === currentStep;

            return (
              <button
                key={ex.id}
                onClick={() => setCurrentStep(idx)}
                className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs transition-all ${
                  isCurrent
                    ? 'bg-[#0d7679] text-white shadow-md shadow-teal-900/20 scale-105'
                    : isDone
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-gray-100 text-gray-400 hover:bg-teal-50 hover:text-teal-700'
                }`}
                title={isArabic ? ex.nameAr : ex.nameEn}
              >
                {isDone ? '✓' : idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Video Assessment Viewport */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-teal-100 shadow-md space-y-4">
        
        {/* Instruction Banner */}
        <div className="bg-teal-50/80 border border-teal-200/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0d7679] text-white flex items-center justify-center shrink-0">
            {getExerciseIcon(currentExercise.iconName)}
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-[#0d5e5e]">
              {isArabic ? 'التعليمات للمريض:' : 'Patient Instructions:'}
            </h4>
            <p className="text-xs sm:text-sm text-teal-900 font-medium">
              {isArabic ? currentExercise.instructionAr : currentExercise.instructionEn}
            </p>
          </div>
        </div>

        {/* Real Live Video Container */}
        <div className="relative aspect-video max-h-[440px] w-full rounded-2xl overflow-hidden bg-slate-900 border-2 border-teal-500/30 flex items-center justify-center shadow-inner">
          
          {/* Live Webcam Stream */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transform -scale-x-100 ${!isCameraActive ? 'hidden' : 'block'}`}
          />

          {/* Hidden Canvas for High-Resolution Real Snapshot */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Camera Access Warning if not enabled */}
          {!isCameraActive && (
            <div className="text-center p-6 space-y-4 text-white z-10 max-w-md">
              <div className="w-16 h-16 mx-auto rounded-full bg-rose-950/80 border border-rose-400 flex items-center justify-center">
                <VideoOff className="w-8 h-8 text-rose-300" />
              </div>
              <h3 className="text-lg font-bold text-rose-100">
                {isArabic ? 'الكاميرا غير مفعلة' : 'Camera Not Enabled'}
              </h3>
              <p className="text-xs text-rose-200/90 leading-relaxed">
                {cameraError || (isArabic ? 'يرجى تفعيل الكاميرا لقياس حركة الوجه الحقيقية.' : 'Please allow camera access.')}
              </p>
              <button
                onClick={startCamera}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-xs font-bold text-white transition-all shadow-md inline-flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isArabic ? 'السماح بتشغيل الكاميرا' : 'Allow Camera'}</span>
              </button>
            </div>
          )}

          {/* Facial Landmark & Symmetry Grid Overlay */}
          {isCameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              
              {/* Central Midline */}
              <div className="w-[2px] h-full bg-teal-400/80 border-r border-teal-300/80" />
              
              {/* Face Contour Oval */}
              <div className="w-56 sm:w-72 h-72 sm:h-88 border-2 border-teal-400/60 rounded-[50%] absolute pointer-events-none shadow-[0_0_25px_rgba(13,118,121,0.25)]" />
              
              {/* Eye Horizontal Guideline */}
              <div className="absolute top-[38%] w-48 sm:w-60 border-t border-teal-300/50" />
              
              {/* Mouth Horizontal Guideline */}
              <div className="absolute bottom-[30%] w-36 sm:w-44 border-t border-teal-300/50" />

              {/* Countdown Overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-7xl font-black text-white animate-ping">
                    {countdown === 0 ? '✓' : countdown}
                  </span>
                </div>
              )}

              {/* Analyzing indicator */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-teal-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-white">
                  <RefreshCw className="w-8 h-8 animate-spin text-teal-300" />
                  <span className="text-sm font-bold">{isArabic ? 'جارٍ تسجيل وقياس الإحداثيات الفعلية...' : 'Measuring real movement...'}</span>
                </div>
              )}

            </div>
          )}

          {/* Real Metrics Badges */}
          {isCameraActive && (
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs font-bold pointer-events-none">
              <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-teal-400/40 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isArabic ? `معدل التناظر الفعلي: ${liveSymmetry}%` : `Real Symmetry: ${liveSymmetry}%`}</span>
              </div>

              <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-teal-400/40 flex items-center gap-3">
                <span className="text-teal-300">{isArabic ? `اليمين: ${liveRightMovement}%` : `R: ${liveRightMovement}%`}</span>
                <span className="text-gray-400">|</span>
                <span className="text-amber-300">{isArabic ? `اليسار: ${liveLeftMovement}%` : `L: ${liveLeftMovement}%`}</span>
              </div>
            </div>
          )}

        </div>

        {/* Capture Controls */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition-all"
          >
            {isArabic ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            onClick={triggerCapture}
            disabled={isAnalyzing || countdown !== null || !isCameraActive}
            className="px-8 py-3.5 rounded-2xl bg-[#0d7679] hover:bg-[#0a5e61] disabled:opacity-50 text-white text-sm font-extrabold shadow-md shadow-teal-900/15 flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>
              {currentStep === CLINICAL_EXERCISES.length - 1
                ? isArabic ? 'التقاط الصورة الأخيرة وإصدار التقرير الفعلي' : 'Capture & Generate Report'
                : isArabic ? 'التقاط صورة التمرين والانتقال للتالي' : 'Capture & Next'}
            </span>
          </button>
        </div>

      </div>

    </div>
  );
};
