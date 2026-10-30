/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExerciseInfo, ExerciseResult, HouseBrackmannGrade, TherapeuticProtocol } from '../types';

export const CLINICAL_EXERCISES: ExerciseInfo[] = [
  {
    id: 'eyebrows',
    number: 1,
    nameAr: 'رفع الحاجبين للأعلى',
    nameEn: 'Eyebrow Elevation',
    instructionAr: 'ارفع حاجبيك لأعلى قدر الإمكان كما لو كنت متفاجئاً مع إبقاء الرأس ثابتاً.',
    instructionEn: 'Raise your eyebrows as high as possible as if surprised.',
    targetMuscleAr: 'العضلة الجبهية (Frontalis Muscle) - العصب الصدغي',
    targetMuscleEn: 'Frontalis Muscle (Temporal Branch)',
    iconName: 'ArrowUpCircle',
  },
  {
    id: 'eyes',
    number: 2,
    nameAr: 'إغلاق العينين بقوة',
    nameEn: 'Tight Eye Closure',
    instructionAr: 'أغمض عينيك بإحكام واضغط بالجفون مع ملاحظة اكتمال إغلاق الجفن في الجهتين.',
    instructionEn: 'Close both eyes tightly and observe eyelid seal.',
    targetMuscleAr: 'العضلة الدويرية العينية (Orbicularis Oculi) - العصب الوجني',
    targetMuscleEn: 'Orbicularis Oculi (Zygomatic Branch)',
    iconName: 'Eye',
  },
  {
    id: 'smile',
    number: 3,
    nameAr: 'الابتسامة العريضة وإظهار الأسنان',
    nameEn: 'Broad Smile with Teeth',
    instructionAr: 'ابتسم ابتسامة عريضة مع إظهار الأسنان وملاحظة زاوية الفم التناظرية.',
    instructionEn: 'Smile broadly showing teeth and observe oral commissure excursion.',
    targetMuscleAr: 'العضلة الوجنية الكبيرة والصغيرة (Zygomaticus Major/Minor) - العصب الشدقي',
    targetMuscleEn: 'Zygomaticus Major & Minor (Buccal Branch)',
    iconName: 'Smile',
  },
  {
    id: 'cheeks',
    number: 4,
    nameAr: 'نفخ الخدين بالهواء',
    nameEn: 'Cheek Puffing',
    instructionAr: 'املأ فمك وخديك بالهواء دون السماح للهواء بالتسرب من زاوية الشفاه.',
    instructionEn: 'Puff out both cheeks with air without air leak.',
    targetMuscleAr: 'العضلة المبوقة (Buccinator Muscle) - العصب الشدقي',
    targetMuscleEn: 'Buccinator Muscle (Buccal Branch)',
    iconName: 'Maximize2',
  },
  {
    id: 'lips',
    number: 5,
    nameAr: 'وزم الشفاه والتصفير',
    nameEn: 'Lip Puckering / Whistle',
    instructionAr: 'ضم شفتيك للأمام كأنك تهم بالصفير أو تقبيل الهواء وملاحظة توسط الشفتين.',
    instructionEn: 'Pucker your lips forward as in whistling.',
    targetMuscleAr: 'العضلة الدويرية الفموية (Orbicularis Oris) - العصب الفكي الهامشي',
    targetMuscleEn: 'Orbicularis Oris (Marginal Mandibular Branch)',
    iconName: 'Sparkles',
  },
];

export function calculateHouseBrackmannGrade(averageSymmetryScore: number): HouseBrackmannGrade {
  if (averageSymmetryScore >= 92) return 1; // Grade I: Normal
  if (averageSymmetryScore >= 80) return 2; // Grade II: Mild dysfunction
  if (averageSymmetryScore >= 62) return 3; // Grade III: Moderate dysfunction
  if (averageSymmetryScore >= 45) return 4; // Grade IV: Moderately severe
  if (averageSymmetryScore >= 25) return 5; // Grade V: Severe dysfunction
  return 6; // Grade VI: Total paralysis
}

export function getGradeLabel(grade: HouseBrackmannGrade, lang: 'ar' | 'en' = 'ar'): {
  title: string;
  badge: string;
  description: string;
  color: string;
} {
  const labels = {
    1: {
      ar: {
        title: 'الدرجة الأولى (I) - وظيفة طبيعية',
        badge: 'وظيفة طبيعية تماماً',
        description: 'حركة وجهية متناظرة وطبيعية في جميع أجزاء الوجه، لا يوجد أي ضعف ملحوظ.',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      },
      en: {
        title: 'Grade I - Normal Function',
        badge: 'Normal Function',
        description: 'Normal facial function in all areas. Symmetrical movement without weakness.',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      },
    },
    2: {
      ar: {
        title: 'الدرجة الثانية (II) - خلل وظيفي طفيف',
        badge: 'ضعف طفيف جداً',
        description: 'تناظر سليم أثناء الراحة، ضعف طفيف يُلاحظ عند التدقيق عن قرب، إغلاق كامل للعين بجهد بسيط، حركة الفم شبه متناظرة.',
        color: 'text-teal-700 bg-teal-50 border-teal-200',
      },
      en: {
        title: 'Grade II - Mild Dysfunction',
        badge: 'Mild Dysfunction',
        description: 'Normal symmetry at rest. Slight weakness noticeable on close inspection. Complete eye closure.',
        color: 'text-teal-700 bg-teal-50 border-teal-200',
      },
    },
    3: {
      ar: {
        title: 'الدرجة الثالثة (III) - خلل وظيفي متوسط',
        badge: 'ضعف متوسط ملحوظ',
        description: 'تناظر طبيعي عند الراحة، اختلاف واضح بين نصفي الوجه أثناء الحركة لكن بدون تشوه دائم، إغلاق كامل للعين مع بذل جهد، حركة جبهية خفيفة.',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
      },
      en: {
        title: 'Grade III - Moderate Dysfunction',
        badge: 'Moderate Dysfunction',
        description: 'Obvious but not disfiguring difference between sides. Complete eye closure with effort. Asymmetry of mouth.',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
      },
    },
    4: {
      ar: {
        title: 'الدرجة الرابعة (IV) - خلل وظيفي متوسط إلى شديد',
        badge: 'ضعف شديد وتشوه ملحوظ',
        description: 'ضعف واضح ولافت ومشوه في التناظر، عدم اكتمال إغلاق العين (بقاء فتحة جفنية)، حركة محدودة جداً في زاوية الفم والجبهة.',
        color: 'text-orange-700 bg-orange-50 border-orange-200',
      },
      en: {
        title: 'Grade IV - Moderately Severe',
        badge: 'Moderately Severe',
        description: 'Obvious weakness and disfiguring asymmetry. Incomplete eye closure. Inability to move forehead.',
        color: 'text-orange-700 bg-orange-50 border-orange-200',
      },
    },
    5: {
      ar: {
        title: 'الدرجة الخامسة (V) - خلل وظيفي شديد',
        badge: 'شلل حركي شبه كامل',
        description: 'عدم تناظر شديد وواضح حتى عند الراحة، حركة بالكاد ملحوظة عند المحاولة القصوى، عجز كامل عن إغلاق العين، هبوط في زاوية الفم.',
        color: 'text-rose-700 bg-rose-50 border-rose-200',
      },
      en: {
        title: 'Grade V - Severe Dysfunction',
        badge: 'Severe Dysfunction',
        description: 'Barely perceptible motion. Severe asymmetry at rest. Incomplete eye closure with broad gap.',
        color: 'text-rose-700 bg-rose-50 border-rose-200',
      },
    },
    6: {
      ar: {
        title: 'الدرجة السادسة (VI) - شلل كلي تام',
        badge: 'شلل كلي تام',
        description: 'فقدان تام وكامل لحركة عضلات الوجه في الجهة المصابة (No movement)، ارتخاء كامل.',
        color: 'text-red-700 bg-red-50 border-red-200',
      },
      en: {
        title: 'Grade VI - Total Paralysis',
        badge: 'Total Paralysis',
        description: 'No facial movement whatsoever. Complete loss of tone and motion.',
        color: 'text-red-700 bg-red-50 border-red-200',
      },
    },
  };

  return labels[grade][lang];
}

export function generateTherapeuticProtocol(
  results: ExerciseResult[]
): TherapeuticProtocol {
  const avgSymmetry = Math.round(
    results.reduce((acc, r) => acc + r.symmetryScore, 0) / (results.length || 1)
  );

  let leftCount = 0;
  let rightCount = 0;
  results.forEach(r => {
    if (r.affectedSide === 'left') leftCount++;
    if (r.affectedSide === 'right') rightCount++;
  });

  const affectedSide: 'left' | 'right' | 'bilateral' =
    leftCount > rightCount ? 'left' : rightCount > leftCount ? 'right' : 'left';

  const grade = calculateHouseBrackmannGrade(avgSymmetry);

  // Protocols tailored specifically based on House-Brackmann Stage
  // Low-intensity neuromuscular stimulation & low-level laser therapy (LLLT)
  let emsFreq = 25; // Hz
  let emsWidth = 200; // µs
  let emsMa = 10; // mA
  let emsDuration = 15; // minutes
  let laserJcm2 = 4.0; // J/cm2
  let laserMin = 10; // minutes

  if (grade === 1) {
    emsFreq = 20;
    emsWidth = 150;
    emsMa = 8;
    emsDuration = 10;
    laserJcm2 = 3.0;
    laserMin = 8;
  } else if (grade === 2) {
    emsFreq = 25;
    emsWidth = 200;
    emsMa = 10;
    emsDuration = 15;
    laserJcm2 = 4.0;
    laserMin = 10;
  } else if (grade === 3) {
    emsFreq = 30;
    emsWidth = 220;
    emsMa = 12;
    emsDuration = 15;
    laserJcm2 = 5.0;
    laserMin = 12;
  } else if (grade === 4) {
    emsFreq = 35;
    emsWidth = 250;
    emsMa = 14;
    emsDuration = 20;
    laserJcm2 = 6.0;
    laserMin = 15;
  } else if (grade >= 5) {
    emsFreq = 40;
    emsWidth = 300;
    emsMa = 16;
    emsDuration = 20;
    laserJcm2 = 6.5;
    laserMin = 15;
  }

  const recommendationsAr = [
    `تطبيق التحفيز الكهربائي الموضعي (NMES) على فروع العصب الوجهي في الجهة ${affectedSide === 'left' ? 'اليسرى' : 'اليمنى'} بتردد ${emsFreq} هرتز وشدة ${emsMa} ملي أمبير.`,
    `جلسات الليزر البارد منخفض الشدة (LLLT 650nm/810nm) بجرعة ${laserJcm2} جول/سم² لتحفيز تجدد خلايا العصب والميتوكوندريا وتقليل الالتهاب العصبي.`,
    'استخدام قطرات ترطيب العين ومرهم الحماية مع لصقة ليلية لمنع جفاف القرنية (ضروري جداً).',
    'الالتزام بتمارين الارتجاع البيولوجي (Biofeedback) اليومية أمام المرآة بدون إجهاد لمنع حدوث التزامن الحركي الخاطئ (Synkinesis).',
    'استخدام كمادات دافئة لطيفة على منطقة مخرج العصب خلف الأذن (Stylomastoid Foramen) لتحسين التروية الدموية.',
  ];

  const recommendationsEn = [
    `Targeted NMES electrical stimulation to the ${affectedSide} facial nerve branches at ${emsFreq} Hz and ${emsMa} mA.`,
    `Photobiomodulation / LLLT laser therapy (650nm/810nm) at ${laserJcm2} J/cm² to accelerate axonal regeneration and reduce edema.`,
    `Eye protection protocol: artificial tears, lubricating ointment and nighttime patch to prevent corneal ulceration.`,
    `Gentle biofeedback mirror exercises, avoiding forceful straining to prevent synkinesis.`,
    `Gentle moist warm compress near the stylomastoid foramen to enhance local microcirculation.`,
  ];

  return {
    houseBrackmannGrade: grade,
    affectedSide,
    overallSymmetryScore: avgSymmetry,
    ems: {
      frequencyHz: emsFreq,
      pulseDurationUs: emsWidth,
      currentIntensitymA: emsMa,
      onTimeSec: 5,
      offTimeSec: 10,
      sessionDurationMin: emsDuration,
      targetBranches: ['الصدغي (Temporal)', 'الوجني (Zygomatic)', 'الشدقي (Buccal)', 'الفكي الهامشي (Marginal)'],
    },
    laser: {
      wavelengthNm: 650,
      powerDensitymW: 100,
      energyJcm2: laserJcm2,
      durationMin: laserMin,
      activePointsCount: 16,
    },
    clinicalRecommendationsAr: recommendationsAr,
    clinicalRecommendationsEn: recommendationsEn,
  };
}
