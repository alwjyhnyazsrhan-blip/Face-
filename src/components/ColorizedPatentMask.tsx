/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  Palette, 
  Download, 
  Eye, 
  Zap, 
  Cpu, 
  ShieldCheck, 
  Check, 
  Radio, 
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { Language } from '../types';

export type ColorTheme = 'medical_teal' | 'surgical_blue' | 'titanium_slate' | 'nerve_spectrum';
export type DisplayMode = 'full_color' | 'interactive_highlight' | 'original_mono';

interface ColorizedPatentMaskProps {
  figureNumber: 1 | 2 | 3 | 6;
  imageSrc: string;
  lang: Language;
  onElementSelect?: (elementId: string) => void;
  selectedElementId?: string | null;
  className?: string;
}

export const ColorizedPatentMask: React.FC<ColorizedPatentMaskProps> = ({
  figureNumber,
  imageSrc,
  lang,
  onElementSelect,
  selectedElementId = null,
  className = '',
}) => {
  const isArabic = lang === 'ar';
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [displayMode, setDisplayMode] = useState<DisplayMode>('full_color');
  const [colorTheme, setColorTheme] = useState<ColorTheme>('medical_teal');
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const activeElement = selectedElementId || hoveredElement;

  // Color palettes
  const palettes = {
    medical_teal: {
      nameAr: 'تركوازي طبي كلاسيكي',
      nameEn: 'Medical Cyan / Teal',
      primaryShell: 'url(#gradTealShell)',
      primaryShellRight: 'url(#gradTealShellRight)',
      goggles: 'url(#gradAmberGoggles)',
      electrodes: 'url(#gradElectrodesBlue)',
      laser: '#ef4444',
      laserGlow: '#ff000088',
      straps: '#334155',
      buckle: '#1e293b',
      pcb: '#059669',
      powerBtn: '#06b6d4',
      accent: '#0d7679'
    },
    surgical_blue: {
      nameAr: 'أزرق جراحي نقي',
      nameEn: 'Surgical Hospital Blue',
      primaryShell: 'url(#gradBlueShell)',
      primaryShellRight: 'url(#gradBlueShellRight)',
      goggles: 'url(#gradBlueGoggles)',
      electrodes: 'url(#gradElectrodesGold)',
      laser: '#dc2626',
      laserGlow: '#ff0033aa',
      straps: '#1e293b',
      buckle: '#0f172a',
      pcb: '#0284c7',
      powerBtn: '#38bdf8',
      accent: '#0284c7'
    },
    titanium_slate: {
      nameAr: 'بلاتينيوم وتيتانيوم فاخر',
      nameEn: 'Titanium Platinum',
      primaryShell: 'url(#gradTitaniumShell)',
      primaryShellRight: 'url(#gradTitaniumShellRight)',
      goggles: 'url(#gradSmokeGoggles)',
      electrodes: 'url(#gradElectrodesGold)',
      laser: '#f43f5e',
      laserGlow: '#f43f5e88',
      straps: '#475569',
      buckle: '#334155',
      pcb: '#10b981',
      powerBtn: '#22c55e',
      accent: '#475569'
    },
    nerve_spectrum: {
      nameAr: 'خريطة فروع العصب الملونة',
      nameEn: 'Nerve Branch Spectrum',
      primaryShell: 'url(#gradSpectrumShell)',
      primaryShellRight: 'url(#gradSpectrumShellRight)',
      goggles: 'url(#gradAmberGoggles)',
      electrodes: 'url(#gradElectrodesCyan)',
      laser: '#ef4444',
      laserGlow: '#ff0000aa',
      straps: '#334155',
      buckle: '#1e293b',
      pcb: '#059669',
      powerBtn: '#06b6d4',
      accent: '#7c3aed'
    }
  };

  const currentPalette = palettes[colorTheme];

  // Helper for interactive selection
  const handleElementHover = (id: string | null) => {
    setHoveredElement(id);
    if (id && onElementSelect) {
      onElementSelect(id);
    }
  };

  // Export composite to PNG
  const handleExportPNG = async () => {
    if (!canvasRef.current || !containerRef.current) return;
    setIsExporting(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      canvas.width = img.naturalWidth || 1080;
      canvas.height = img.naturalHeight || 745;

      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (displayMode !== 'original_mono') {
        // Draw SVG layer to canvas
        const svgElement = containerRef.current.querySelector('svg');
        if (svgElement) {
          const svgString = new XMLSerializer().serializeToString(svgElement);
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
          const URL = window.URL || window.webkitURL || window;
          const blobURL = URL.createObjectURL(svgBlob);
          const svgImg = new Image();

          await new Promise((resolve) => {
            svgImg.onload = () => {
              ctx.drawImage(svgImg, 0, 0, canvas.width, canvas.height);
              URL.revokeObjectURL(blobURL);
              resolve(null);
            };
            svgImg.src = blobURL;
          });
        }

        // Draw original drawing with multiply blend mode
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      } else {
        // Just mono image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      }

      // Trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `patent_mask_figure_${figureNumber}_colored.png`;
      downloadLink.href = dataUrl;
      downloadLink.click();
    } catch (e) {
      console.error('Failed to export colorized image', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`flex flex-col space-y-4 ${className}`} ref={containerRef}>
      {/* Hidden canvas for PNG export */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Toolbar: Color Theme, Display Mode & Download */}
      <div className="bg-[#f7faf9] rounded-2xl p-3 border border-teal-100 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Mode Selector */}
        <div className="inline-flex p-1 bg-white rounded-xl border border-teal-200/80 shadow-xs">
          <button
            onClick={() => setDisplayMode('full_color')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              displayMode === 'full_color'
                ? 'bg-[#0d7679] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isArabic ? 'ملوّن بالكامل' : 'Full Color'}</span>
          </button>

          <button
            onClick={() => setDisplayMode('interactive_highlight')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              displayMode === 'interactive_highlight'
                ? 'bg-[#0d7679] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isArabic ? 'تحديد تفاعلي' : 'Highlight Mode'}</span>
          </button>

          <button
            onClick={() => setDisplayMode('original_mono')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              displayMode === 'original_mono'
                ? 'bg-[#0d7679] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{isArabic ? 'أبيض وأسود أصلي' : 'Original Mono'}</span>
          </button>
        </div>

        {/* Theme Picker (when colored) */}
        {displayMode !== 'original_mono' && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-gray-500 hidden sm:inline">
              {isArabic ? 'النمط اللوني:' : 'Palette:'}
            </span>
            {(Object.keys(palettes) as ColorTheme[]).map((themeKey) => {
              const pal = palettes[themeKey];
              return (
                <button
                  key={themeKey}
                  onClick={() => setColorTheme(themeKey)}
                  title={isArabic ? pal.nameAr : pal.nameEn}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all border flex items-center gap-1.5 ${
                    colorTheme === themeKey
                      ? 'bg-white border-[#0d7679] text-[#0d7679] shadow-xs'
                      : 'bg-white/60 border-gray-200 text-gray-600 hover:bg-white'
                  }`}
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: pal.accent }}
                  />
                  <span className="hidden md:inline">
                    {themeKey === 'medical_teal' && (isArabic ? 'تركوازي' : 'Teal')}
                    {themeKey === 'surgical_blue' && (isArabic ? 'أزرق' : 'Blue')}
                    {themeKey === 'titanium_slate' && (isArabic ? 'تيتانيوم' : 'Titanium')}
                    {themeKey === 'nerve_spectrum' && (isArabic ? 'الأعصاب' : 'Nerves')}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={handleExportPNG}
          disabled={isExporting}
          className="px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 border border-teal-200 text-[#0d7679] text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs shrink-0"
          title={isArabic ? 'تصدير الرسم الملون كصورة PNG' : 'Export Colored PNG'}
        >
          {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span>{isArabic ? 'حفظ الصورة الملونة' : 'Export PNG'}</span>
        </button>
      </div>

      {/* Main Interactive Stage: Layers Container */}
      <div className="relative w-full rounded-3xl bg-white border-2 border-teal-200/90 p-2 sm:p-6 flex items-center justify-center overflow-hidden shadow-sm group">
        
        {/* Container with exact aspect ratio (1080 x 745 / 738 / 736 / 721) */}
        <div className="relative w-full max-w-4xl max-h-[580px] flex items-center justify-center">
          
          {/* UNDERLAYER: SVG Color Fills (rendered only when in full_color or highlight mode) */}
          {displayMode !== 'original_mono' && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none select-none"
              viewBox={
                figureNumber === 1 ? '0 0 1080 745' :
                figureNumber === 2 ? '0 0 1080 738' :
                figureNumber === 3 ? '0 0 1080 736' : '0 0 1080 721'
              }
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Medical Teal Gradients */}
                <linearGradient id="gradTealShell" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ccfbf1" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#99f6e4" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#5eead4" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="gradTealShellRight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.85" />
                </linearGradient>

                {/* Surgical Blue Gradients */}
                <linearGradient id="gradBlueShell" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="gradBlueShellRight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.85" />
                </linearGradient>

                {/* Titanium Slate Gradients */}
                <linearGradient id="gradTitaniumShell" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="gradTitaniumShellRight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.85" />
                </linearGradient>

                {/* Spectrum Gradients */}
                <linearGradient id="gradSpectrumShell" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ede9fe" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.85" />
                </linearGradient>
                <linearGradient id="gradSpectrumShellRight" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fae8ff" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#e879f9" stopOpacity="0.75" />
                </linearGradient>

                {/* Goggles Glass Amber Gradients */}
                <linearGradient id="gradAmberGoggles" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffedd5" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#fed7aa" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="gradBlueGoggles" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.75" />
                </linearGradient>
                <linearGradient id="gradSmokeGoggles" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#475569" stopOpacity="0.8" />
                </linearGradient>

                {/* Electrodes Gradients */}
                <radialGradient id="gradElectrodesBlue" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="70%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#0369a1" />
                </radialGradient>
                <radialGradient id="gradElectrodesGold" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="70%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#ca8a04" />
                </radialGradient>
                <radialGradient id="gradElectrodesCyan" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#a5f3fc" />
                  <stop offset="70%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#0891b2" />
                </radialGradient>
                <radialGradient id="gradLaserDot" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fee2e2" />
                  <stop offset="40%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#b91c1c" />
                </radialGradient>

                {/* Glow Filter for Lasers */}
                <filter id="laserGlowFilter" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* FIGURE 1 COLOR LAYERS */}
              {figureNumber === 1 && (
                <g id="fig1_colors">
                  {/* Head Strap (106) */}
                  <path
                    d="M 635 290 Q 695 330 740 400 Q 755 425 730 445 Q 675 480 645 520 L 635 515 Z"
                    fill={currentPalette.straps}
                    opacity={displayMode === 'interactive_highlight' && activeElement !== '106' ? 0.2 : 0.85}
                  />

                  {/* Wireless Unit (107) */}
                  <rect
                    x="650" y="345" width="48" height="60" rx="8"
                    fill={currentPalette.pcb}
                    opacity={displayMode === 'interactive_highlight' && activeElement !== '107' ? 0.2 : 0.85}
                  />

                  {/* Mask Right Half (101 - Patient's Right) */}
                  <path
                    d="M 458 135 C 390 145 340 220 335 340 C 330 420 340 540 375 660 C 405 730 435 780 458 810 L 458 135 Z"
                    fill={currentPalette.primaryShell}
                    opacity={displayMode === 'interactive_highlight' && activeElement !== '101' ? 0.2 : 0.88}
                  />

                  {/* Mask Left Half (102 - Patient's Left) */}
                  <path
                    d="M 458 135 C 530 145 615 210 640 330 C 660 410 655 520 620 640 C 585 730 520 785 458 810 L 458 135 Z"
                    fill={currentPalette.primaryShellRight}
                    opacity={displayMode === 'interactive_highlight' && activeElement !== '102' ? 0.2 : 0.88}
                  />

                  {/* Forehead Micro-perforation Laser / Air matrix (Upper 100) */}
                  <path
                    d="M 355 170 Q 458 150 615 170 L 630 330 Q 458 310 338 330 Z"
                    fill="#0d9488"
                    opacity={0.15}
                  />

                  {/* Nose Piece */}
                  <path
                    d="M 432 475 L 485 475 L 495 580 L 422 580 Z"
                    fill="#94a3b8"
                    opacity={0.4}
                  />

                  {/* Mouth Aperture Opening */}
                  <path
                    d="M 425 600 Q 460 605 498 600 Q 498 640 460 645 Q 425 640 425 600 Z"
                    fill="#334155"
                    opacity={0.3}
                  />

                  {/* Eye Goggles (104) */}
                  <g id="goggles_104" opacity={displayMode === 'interactive_highlight' && activeElement !== '104' ? 0.2 : 0.95}>
                    <ellipse cx="395" cy="385" rx="56" ry="34" transform="rotate(-6 395 385)" fill={currentPalette.goggles} />
                    <ellipse cx="538" cy="405" rx="60" ry="36" transform="rotate(6 538 405)" fill={currentPalette.goggles} />
                  </g>

                  {/* Power Button (103) */}
                  <circle
                    cx="615" cy="545" r="14"
                    fill={currentPalette.powerBtn}
                    filter="url(#laserGlowFilter)"
                    opacity={displayMode === 'interactive_highlight' && activeElement !== '103' ? 0.3 : 1}
                  />

                  {/* Sensor Rim (105) */}
                  <ellipse
                    cx="345" cy="485" rx="8" ry="14"
                    fill="#0ea5e9"
                    opacity={0.8}
                  />

                  {/* Stimulation Electrodes (115) */}
                  <g id="electrodes_115" opacity={displayMode === 'interactive_highlight' && activeElement !== '115' ? 0.2 : 1}>
                    {[
                      [390, 235], [490, 275], [550, 280],
                      [365, 460], [552, 505],
                      [405, 600], [512, 630],
                      [413, 645], [501, 670],
                      [505, 780]
                    ].map(([cx, cy], i) => (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r="12" fill={currentPalette.electrodes} />
                        <circle cx={cx} cy={cy} r="6" fill="#ffffff" opacity="0.6" />
                      </g>
                    ))}
                  </g>

                  {/* Laser Emitters (114) */}
                  <g id="laser_114" opacity={displayMode === 'interactive_highlight' && activeElement !== '114' ? 0.2 : 1}>
                    {[
                      [388, 310], [502, 335], [552, 355],
                      [368, 515], [552, 550],
                      [398, 555], [500, 560],
                      [405, 595], [518, 585],
                      [412, 640], [518, 630],
                      [501, 668], [520, 770]
                    ].map(([cx, cy], i) => (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r="8" fill={currentPalette.laserGlow} filter="url(#laserGlowFilter)" />
                        <circle cx={cx} cy={cy} r="5" fill="url(#gradLaserDot)" />
                      </g>
                    ))}
                  </g>
                </g>
              )}

              {/* FIGURE 2 COLOR LAYERS (Interior Skin-Contact) */}
              {figureNumber === 2 && (
                <g id="fig2_colors">
                  {/* Silicone Mask Cup Inner Lining */}
                  <path
                    d="M 420 70 C 310 100 260 250 265 480 C 270 650 340 810 425 870 C 510 810 610 680 630 480 C 640 280 580 100 420 70 Z"
                    fill={currentPalette.primaryShell}
                    opacity={displayMode === 'interactive_highlight' && !['108', '109', '110'].includes(activeElement || '') ? 0.25 : 0.85}
                  />

                  {/* Eye Openings (Hollow cutouts) */}
                  <ellipse cx="355" cy="415" rx="58" ry="38" fill="#ffffff" />
                  <ellipse cx="515" cy="350" rx="70" ry="40" fill="#ffffff" />

                  {/* Head Strap and Buckle (111) */}
                  <g id="strap_111" opacity={displayMode === 'interactive_highlight' && activeElement !== '111' ? 0.2 : 0.9}>
                    <path
                      d="M 320 520 Q 420 620 560 640 L 760 610 Q 770 650 740 680 L 560 690 Q 380 660 300 580 Z"
                      fill={currentPalette.straps}
                    />
                    {/* Quick-release Buckle */}
                    <rect x="560" y="615" width="45" height="70" rx="6" fill={currentPalette.buckle} />
                  </g>

                  {/* Forehead Electrode Matrix (108) */}
                  <g id="electrodes_108" opacity={displayMode === 'interactive_highlight' && activeElement !== '108' ? 0.2 : 1}>
                    {[
                      [450, 160], [480, 175], [520, 185], [560, 205],
                      [430, 210], [470, 220], [510, 235], [550, 255]
                    ].map(([cx, cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="9" fill={currentPalette.electrodes} />
                    ))}
                  </g>

                  {/* Cheek & Mouth Conductive Pads (110) */}
                  <g id="electrodes_110" opacity={displayMode === 'interactive_highlight' && activeElement !== '110' ? 0.2 : 1}>
                    {[
                      [345, 270], [330, 345], [315, 430], [330, 710],
                      [345, 740], [370, 770], [480, 520], [530, 530],
                      [560, 560], [580, 600]
                    ].map(([cx, cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="10" fill={currentPalette.electrodes} />
                    ))}
                  </g>

                  {/* Cold Laser Emitters (109) */}
                  <g id="laser_109" opacity={displayMode === 'interactive_highlight' && activeElement !== '109' ? 0.2 : 1}>
                    {[
                      [370, 220], [410, 260], [490, 290], [570, 310],
                      [360, 480], [480, 480], [540, 490], [570, 510],
                      [335, 660], [360, 680], [460, 690], [490, 710]
                    ].map(([cx, cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="6" fill="url(#gradLaserDot)" filter="url(#laserGlowFilter)" />
                    ))}
                  </g>
                </g>
              )}

              {/* FIGURE 3 COLOR LAYERS (Side Electronic Unit) */}
              {figureNumber === 3 && (
                <g id="fig3_colors">
                  {/* Mask Shell Base */}
                  <path
                    d="M 420 70 C 310 100 260 250 265 480 C 270 650 340 810 425 870 C 510 810 610 680 630 480 C 640 280 580 100 420 70 Z"
                    fill={currentPalette.primaryShell}
                    opacity={0.7}
                  />

                  {/* Electronic Microcontroller Unit (112) */}
                  <g id="mcu_112" opacity={displayMode === 'interactive_highlight' && activeElement !== '112' ? 0.2 : 0.95}>
                    <rect x="645" y="315" width="45" height="115" rx="8" fill={currentPalette.pcb} />
                    {/* Status LEDs */}
                    <circle cx="667" cy="335" r="4" fill="#22c55e" filter="url(#laserGlowFilter)" />
                    <circle cx="667" cy="350" r="4" fill="#06b6d4" filter="url(#laserGlowFilter)" />
                  </g>

                  {/* Interface Socket / Connector (113) */}
                  <g id="socket_113" opacity={displayMode === 'interactive_highlight' && activeElement !== '113' ? 0.2 : 1}>
                    <rect x="695" y="360" width="18" height="70" rx="3" fill="#eab308" />
                    {/* Gold Contact Pins */}
                    {[370, 380, 390, 400, 410, 420].map((y, i) => (
                      <line key={i} x1="697" y1={y} x2="711" y2={y} stroke="#ca8a04" strokeWidth="2" />
                    ))}
                  </g>
                </g>
              )}

              {/* FIGURE 6 COLOR LAYERS (Nerve Distribution Map) */}
              {figureNumber === 6 && (
                <g id="fig6_colors">
                  {/* Face Profile Base */}
                  <path
                    d="M 515 120 C 420 130 400 250 405 450 C 410 620 460 740 515 785 C 570 740 670 630 685 450 C 690 270 620 130 515 120 Z"
                    fill={currentPalette.primaryShell}
                    opacity={displayMode === 'interactive_highlight' && !['114', '115'].includes(activeElement || '') ? 0.25 : 0.85}
                  />

                  {/* Goggles Glass */}
                  <ellipse cx="460" cy="365" rx="45" ry="28" fill={currentPalette.goggles} opacity="0.8" />
                  <ellipse cx="585" cy="390" rx="55" ry="32" fill={currentPalette.goggles} opacity="0.8" />

                  {/* 5 Facial Nerve Branches Spectrum Radiance */}
                  <g opacity="0.4" strokeWidth="6" strokeLinecap="round">
                    {/* Temporal branch */}
                    <path d="M 685 400 Q 640 280 500 240" stroke="#f59e0b" fill="none" />
                    {/* Zygomatic branch */}
                    <path d="M 685 420 Q 620 370 470 380" stroke="#06b6d4" fill="none" />
                    {/* Buccal branch */}
                    <path d="M 685 440 Q 600 480 470 560" stroke="#10b981" fill="none" />
                    {/* Marginal mandibular */}
                    <path d="M 685 460 Q 600 580 480 620" stroke="#8b5cf6" fill="none" />
                    {/* Cervical branch */}
                    <path d="M 685 490 Q 600 680 515 760" stroke="#ec4899" fill="none" />
                  </g>

                  {/* Motor Points Electrodes (115) */}
                  <g id="electrodes_115_fig6" opacity={displayMode === 'interactive_highlight' && activeElement !== '115' ? 0.2 : 1}>
                    {[
                      [455, 220], [455, 290],
                      [600, 260], [600, 335],
                      [408, 460], [465, 565], [465, 615], [475, 680],
                      [605, 480], [570, 555], [565, 600], [555, 670]
                    ].map(([cx, cy], i) => (
                      <g key={i}>
                        <circle cx={cx} cy={cy} r="13" fill={currentPalette.electrodes} />
                        <circle cx={cx} cy={cy} r="7" fill="#ffffff" opacity="0.6" />
                      </g>
                    ))}
                  </g>

                  {/* Laser Emitters (114) */}
                  <g id="laser_114_fig6" opacity={displayMode === 'interactive_highlight' && activeElement !== '114' ? 0.2 : 1}>
                    {[
                      [455, 255], [600, 295],
                      [435, 510], [585, 515],
                      [465, 590], [565, 580],
                      [475, 645], [555, 635]
                    ].map(([cx, cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="8" fill="url(#gradLaserDot)" filter="url(#laserGlowFilter)" />
                    ))}
                  </g>
                </g>
              )}
            </svg>
          )}

          {/* TOP LAYER: The User's EXACT Original Drawing with multiply blend mode */}
          {/* This guarantees 100% fidelity: every line, arrow, number, and text remains permanently crystal-clear */}
          <img
            src={imageSrc}
            alt={`الشكل ${figureNumber}`}
            className="w-full h-auto object-contain select-none transition-transform duration-300"
            style={{
              mixBlendMode: displayMode === 'original_mono' ? 'normal' : 'multiply',
            }}
          />

          {/* Interactive Callout Badges floating over active element */}
          {activeElement && (
            <div className="absolute bottom-4 right-4 bg-teal-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-sm border border-teal-400/40 animate-fade-in flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {activeElement === '100' && (isArabic ? '١٠٠ - الهيكل العام للقناع' : '100 - Mask Body')}
                {activeElement === '101' && (isArabic ? '١٠١ - النصف الأيمن للقناع' : '101 - Right Mask Half')}
                {activeElement === '102' && (isArabic ? '١٠٢ - النصف الأيسر للقناع' : '102 - Left Mask Half')}
                {activeElement === '103' && (isArabic ? '١٠٣ - زر التشغيل والإيقاف' : '103 - Power Switch')}
                {activeElement === '104' && (isArabic ? '١٠٤ - نظارة حماية العينين' : '104 - Protective Goggles')}
                {activeElement === '106' && (isArabic ? '١٠٦ - حزام تثبيت الرأس' : '106 - Retaining Strap')}
                {activeElement === '107' && (isArabic ? '١٠٧ - هوائي البلوتوث والواي فاي' : '107 - Wireless Unit')}
                {activeElement === '108' && (isArabic ? '١٠٨ - مصفوفة أقطاب الجبهة' : '108 - Forehead Electrodes')}
                {activeElement === '109' && (isArabic ? '١٠٩ - ثقوب إشعاع الليزر البارد' : '109 - Laser Emitters')}
                {activeElement === '110' && (isArabic ? '١١٠ - أقطاب الوجنة ومحيط الفم' : '110 - Facial Electrodes')}
                {activeElement === '111' && (isArabic ? '١١١ - مشبك إحكام وتثبيت الحزام' : '111 - Strap Buckle')}
                {activeElement === '112' && (isArabic ? '١١٢ - وحدة التحكم والأردوينو' : '112 - Microcontroller')}
                {activeElement === '113' && (isArabic ? '١١٣ - مقبس التوصيل التسلسلي USB' : '113 - Serial/USB Port')}
                {activeElement === '114' && (isArabic ? '١١٤ - مصفوفة بواعث الليزر 650nm' : '114 - 650nm Laser Diodes')}
                {activeElement === '115' && (isArabic ? '١١٥ - أقطاب التحفيز الكهربائي الموضعي' : '115 - Motor Points Electrodes')}
              </span>
            </div>
          )}

        </div>

      </div>

      {/* Interactive Element Buttons: Hover or click to highlight on the colored mask */}
      <div className="bg-white rounded-2xl p-4 border border-teal-100 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-[#14292b] flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-[#0d7679]" />
            <span>{isArabic ? 'العناصر الملونة في الرسم الأصلي (انقر للإبراز):' : 'Colored Elements (Click to Highlight):'}</span>
          </span>
          <span className="text-[10px] text-gray-500 font-medium">
            {isArabic ? 'الرسم الأصلي مع التلوين الدقيق' : 'Original drawing with precise color fills'}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {figureNumber === 1 && [
            { id: '101', labelAr: '١٠١ - النصف الأيمن', labelEn: '101 - Right Half', color: '#14b8a6' },
            { id: '102', labelAr: '١٠٢ - النصف الأيسر', labelEn: '102 - Left Half', color: '#0ea5e9' },
            { id: '104', labelAr: '١٠٤ - نظارة الحماية', labelEn: '104 - Goggles', color: '#f97316' },
            { id: '103', labelAr: '١٠٣ - زر التشغيل المضيء', labelEn: '103 - Power Button', color: '#06b6d4' },
            { id: '106', labelAr: '١٠٦ - حزام التثبيت', labelEn: '106 - Strap', color: '#334155' },
            { id: '107', labelAr: '١٠٧ - الاتصال اللاسلكي', labelEn: '107 - Wireless', color: '#10b981' },
            { id: '115', labelAr: '١١٥ - أقطاب التحفيز (EMS)', labelEn: '115 - Electrodes', color: '#0284c7' },
            { id: '114', labelAr: '١١٤ - بواعث الليزر 650nm', labelEn: '114 - Laser', color: '#ef4444' },
          ].map((item) => (
            <button
              key={item.id}
              onMouseEnter={() => handleElementHover(item.id)}
              onMouseLeave={() => handleElementHover(null)}
              onClick={() => onElementSelect && onElementSelect(item.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                activeElement === item.id
                  ? 'bg-teal-50 border-[#0d7679] text-[#0d7679] shadow-xs scale-105'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span>{isArabic ? item.labelAr : item.labelEn}</span>
            </button>
          ))}

          {figureNumber === 2 && [
            { id: '108', labelAr: '١٠٨ - أقطاب الجبهة', labelEn: '108 - Forehead', color: '#0284c7' },
            { id: '110', labelAr: '١١٠ - أقطاب الوجنة والفم', labelEn: '110 - Cheeks/Mouth', color: '#0284c7' },
            { id: '109', labelAr: '١٠٩ - منافذ الليزر البارد', labelEn: '109 - Cold Laser', color: '#ef4444' },
            { id: '111', labelAr: '١١١ - مشبك التثبيت والإحكام', labelEn: '111 - Strap Buckle', color: '#1e293b' },
          ].map((item) => (
            <button
              key={item.id}
              onMouseEnter={() => handleElementHover(item.id)}
              onMouseLeave={() => handleElementHover(null)}
              onClick={() => onElementSelect && onElementSelect(item.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                activeElement === item.id
                  ? 'bg-teal-50 border-[#0d7679] text-[#0d7679] shadow-xs scale-105'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span>{isArabic ? item.labelAr : item.labelEn}</span>
            </button>
          ))}

          {figureNumber === 3 && [
            { id: '112', labelAr: '١١٢ - لوحة الأردوينو والمتحكم', labelEn: '112 - MCU Board', color: '#059669' },
            { id: '113', labelAr: '١١٣ - منفذ التوصيل Serial/USB', labelEn: '113 - Serial Socket', color: '#eab308' },
          ].map((item) => (
            <button
              key={item.id}
              onMouseEnter={() => handleElementHover(item.id)}
              onMouseLeave={() => handleElementHover(null)}
              onClick={() => onElementSelect && onElementSelect(item.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                activeElement === item.id
                  ? 'bg-teal-50 border-[#0d7679] text-[#0d7679] shadow-xs scale-105'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span>{isArabic ? item.labelAr : item.labelEn}</span>
            </button>
          ))}

          {figureNumber === 6 && [
            { id: '115', labelAr: '١١٥ - نقاط تحفيز العضلات (Motor Points)', labelEn: '115 - Motor Points', color: '#0284c7' },
            { id: '114', labelAr: '١١٤ - مصفوفة الليزر 650nm', labelEn: '114 - Laser Diodes', color: '#ef4444' },
          ].map((item) => (
            <button
              key={item.id}
              onMouseEnter={() => handleElementHover(item.id)}
              onMouseLeave={() => handleElementHover(null)}
              onClick={() => onElementSelect && onElementSelect(item.id)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                activeElement === item.id
                  ? 'bg-teal-50 border-[#0d7679] text-[#0d7679] shadow-xs scale-105'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span>{isArabic ? item.labelAr : item.labelEn}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
