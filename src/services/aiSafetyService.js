// src/services/aiSafetyService.js
// إعادة بناء خدمة Safety AI من البداية
import { sanitizeText } from './validationService';
import { fetchGemini } from './ai';

const FALLBACK_CORRECTIVE = [
  'أوقف العمل مؤقتًا وعزل المنطقة حتى يتم تقييم المخاطر.',
  'أبلغ مشرف السلامة ودوّن الموقف بالصورة والموقع.',
  'نفّذ تدابير تحكم هندسية أو إدارية قبل استئناف النشاط.',
];

function fallbackAnalysis(input, lang = 'ar') {
  const text = sanitizeText(input, 600);
  const lower = text.toLowerCase();
  const isCritical = /fire|حريق|كهرب|electric|سقوط|fall|gas|غاز|crane|ونش|lifting|رفع/.test(lower);
  const isMedium = /leak|تسريب|زيت|حرارة|heat|noise|ضوضاء|near/.test(lower);
  const severity = isCritical ? 'riskCritical' : isMedium ? 'riskMedium' : 'riskHigh';

  return {
    title: lang === 'en' ? 'AI Safety Analysis' : 'تحليل سلامة ذكي',
    summary: text || 'تم رصد حالة تحتاج إلى مراجعة السلامة.',
    severity,
    riskScore: isCritical ? 92 : isMedium ? 65 : 78,
    hazards: [
      isCritical ? 'خطر مباشر على الأفراد أو المعدات' : 'احتمال وجود خطر عمل غير مقنن',
      'الضوابط الحالية غير كافية للظروف الميدانية',
      'احتمال تكرار الحالة إذا لم يتم اتخاذ إجراء تصحيحي',
    ],
    correctiveActions: FALLBACK_CORRECTIVE,
    preventiveActions: [
      'إجراء Toolbox Talk قبل استئناف العمل.',
      'مراجعة تصريح العمل وتحديث تقييم المخاطر.',
      'تعزيز الإشراف على الموقع لحين إصلاح الخلل.',
    ],
    reportBody: `تحليل سلامة: ${text}`,
  };
}

function normalizeList(value, fallback) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value.map((item) => sanitizeText(item, 240)).filter(Boolean).slice(0, 5);
  return cleaned.length ? cleaned : fallback;
}

function normalizeAiResult(raw, originalText, lang) {
  const fallback = fallbackAnalysis(originalText, lang);
  const severity = ['riskLow', 'riskMedium', 'riskHigh', 'riskCritical'].includes(raw?.severity)
    ? raw.severity : fallback.severity;

  return {
    title: sanitizeText(raw?.title || fallback.title, 120),
    summary: sanitizeText(raw?.summary || fallback.summary, 800),
    severity,
    riskScore: Math.min(100, Math.max(1, Number(raw?.riskScore) || fallback.riskScore)),
    hazards: normalizeList(raw?.hazards, fallback.hazards),
    correctiveActions: normalizeList(raw?.correctiveActions, fallback.correctiveActions),
    preventiveActions: normalizeList(raw?.preventiveActions, fallback.preventiveActions),
    reportBody: sanitizeText(raw?.reportBody || fallback.reportBody, 1600),
  };
}

export async function analyzeSafetyText(input, lang = 'ar') {
  const safeInput = sanitizeText(input, 1200);
  if (!safeInput) throw new Error('اكتب وصف الحالة أولًا.');

  const language = lang === 'en' ? 'English' : lang === 'ur' ? 'Urdu' : 'Arabic';
  const prompt = `You are a senior HSE safety engineer. Analyze the following site safety description and return ONLY valid JSON.
Language: ${language}
Input: "${safeInput}"

Schema:
{
  "title": "short report title",
  "summary": "clean professional safety report summary",
  "severity": "riskLow | riskMedium | riskHigh | riskCritical",
  "riskScore": 1-100,
  "hazards": ["hazard 1", "hazard 2", "hazard 3"],
  "correctiveActions": ["immediate corrective action 1", "action 2", "action 3"],
  "preventiveActions": ["preventive action 1", "action 2", "action 3"],
  "reportBody": "complete formatted paragraph suitable for a safety report"
}`;

  try {
    const raw = await fetchGemini(prompt, true);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return normalizeAiResult(parsed, safeInput, lang);
  } catch (error) {
    console.warn('AI Safety fallback used:', error.message);
    return fallbackAnalysis(safeInput, lang);
  }
}

export const generateSafetyReport = analyzeSafetyText;
export const suggestCorrectiveActions = async (input, lang = 'ar') => {
  const result = await analyzeSafetyText(input, lang);
  return result.correctiveActions;
};
