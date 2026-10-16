import React, { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, Shield, ClipboardList, Search, FileText, Copy, CheckCircle, Zap } from 'lucide-react';
import { GlassCard, GlassButton } from '../components/ui/GlassComponents';
import { fetchGemini } from '../services/ai';

const AI_MODULES = [
  { id: 'incident', icon: <AlertTriangle size={18}/>, labelKey: 'aiIncidentAnalysis', labelAr: 'تحليل الحوادث',        labelUr: 'حادثے کا تجزیہ',       color: 'red'    },
  { id: 'ppe',      icon: <Shield size={18}/>,        labelKey: 'aiPPERec',           labelAr: 'توصيات مهمات الوقاية', labelUr: 'PPE سفارشات',          color: 'blue'   },
  { id: 'jsa',      icon: <ClipboardList size={18}/>, labelKey: 'aiJSAGen',           labelAr: 'مولّد JSA',           labelUr: 'JSA جنریٹر',           color: 'indigo' },
  { id: 'hazard',   icon: <Search size={18}/>,        labelKey: 'aiHazardDetect',     labelAr: 'كشف المخاطر',         labelUr: 'خطرات کی تشخیص',       color: 'amber'  },
  { id: 'summary',  icon: <FileText size={18}/>,      labelKey: 'aiReportSummary',    labelAr: 'ملخص التقارير',       labelUr: 'رپورٹ خلاصہ',          color: 'emerald'},
];

// Translation keys for module labels (must match translations.js)
const MODULE_LABEL_KEYS = {
  incident: { en: 'Incident Analysis',    ar: 'تحليل الحوادث',         ur: 'حادثے کا تجزیہ'     },
  ppe:      { en: 'PPE Recommendations',  ar: 'توصيات مهمات الوقاية',  ur: 'PPE سفارشات'        },
  jsa:      { en: 'JSA Generator',        ar: 'مولّد تحليل سلامة العمل', ur: 'JSA جنریٹر'        },
  hazard:   { en: 'Hazard Detection',     ar: 'كشف المخاطر',           ur: 'خطرات کی تشخیص'    },
  summary:  { en: 'Report Summary',       ar: 'ملخص التقارير',         ur: 'رپورٹ خلاصہ'       },
};

const MODULE_CONFIG = {
  incident: {
    promptFn: (input, lang) => lang === 'en'
      ? `You are an expert safety investigator. Analyze this incident comprehensively: "${input}". Provide in English: 1) Root Causes 2) Severity Classification 3) Immediate Corrective Actions 4) Long-term Preventive Measures 5) Lessons Learned. Present clearly and structured.`
      : `أنت محقق سلامة خبير. قم بتحليل الحادث التالي: "${input}". أعطني: 1) الأسباب الجذرية 2) تصنيف الخطورة 3) الإجراءات التصحيحية الفورية 4) الإجراءات الوقائية طويلة الأمد 5) الدروس المستفادة. بشكل منظم وواضح.`,
    titleKey: 'aiIncidentTitle',
  },
  ppe: {
    promptFn: (input, lang) => lang === 'en'
      ? `You are a PPE expert. Based on this task: "${input}", provide a comprehensive list of required PPE with reasons. Divide into: 1) Mandatory basic PPE 2) Task-specific PPE 3) Recommended optional PPE.`
      : `أنت خبير في مهمات الوقاية الشخصية. بناءً على المهمة: "${input}"، قدم قائمة شاملة بمهمات الوقاية المطلوبة مع السبب لكل منها. قسّمها إلى: 1) مهمات أساسية إلزامية 2) مهمات خاصة بالمهمة 3) مهمات احتياطية موصى بها.`,
    titleKey: 'aiPPETitle',
  },
  jsa: {
    promptFn: (input, lang) => lang === 'en'
      ? `You are a safety engineer. Create a Job Safety Analysis (JSA) for: "${input}". Present as sequential steps with: potential hazards, preventive measures, and responsible person for each step.`
      : `أنت مهندس سلامة خبير. أنشئ تحليل سلامة العمل (JSA) للمهمة: "${input}". قدمه كجدول بالخطوات التسلسلية مع المخاطر المحتملة والإجراءات الوقائية والمسؤول عن كل إجراء.`,
    titleKey: 'aiJSATitle',
  },
  hazard: {
    promptFn: (input, lang) => lang === 'en'
      ? `You are a safety inspector. Based on: "${input}", identify all potential hazards. Classify each by: 1) Hazard type (physical/chemical/biological/ergonomic/behavioral) 2) Severity level (low/medium/high/critical) 3) Likelihood 4) Recommended preventive measures.`
      : `أنت مفتش سلامة خبير. بناءً على: "${input}"، حدد جميع المخاطر المحتملة. صنّف كل خطر حسب: 1) نوع الخطر 2) مستوى الخطورة 3) احتمالية الحدوث 4) التدابير الوقائية المقترحة.`,
    titleKey: 'aiHazardTitle',
  },
  summary: {
    promptFn: (input, lang) => lang === 'en'
      ? `You are an executive HSE consultant. Based on: "${input}", create a comprehensive executive summary including: 1) Safety performance overview 2) Key risks & violations 3) Observed trends 4) Strategic recommendations 5) Key Performance Indicators (KPIs).`
      : `أنت مستشار HSE تنفيذي. بناءً على: "${input}"، أنشئ ملخصاً تنفيذياً يشمل: 1) نظرة عامة على الأداء الأمني 2) أبرز المخاطر والمخالفات 3) الاتجاهات الملاحظة 4) التوصيات الاستراتيجية 5) مؤشرات الأداء الرئيسية.`,
    titleKey: 'aiSummaryTitle',
  },
};

const colorMap = {
  red:     'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300',
  blue:    'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300',
  indigo:  'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300',
  amber:   'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300',
  emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
};

function AIModulePanel({ moduleId, t, lang }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const config = MODULE_CONFIG[moduleId];
  const currentLang = lang === 'ar' || lang === 'ur' ? lang : 'en';
  const moduleLabel = MODULE_LABEL_KEYS[moduleId]?.[lang] || MODULE_LABEL_KEYS[moduleId]?.en || moduleId;

  const handleAnalyze = async () => {
    if (!input.trim()) return alert(t('aiInputPlaceholder'));
    setError('');
    setLoading(true);
    setResult('');
    try {
      const response = await fetchGemini(config.promptFn(input, currentLang), false);
      setResult(response || t('aiAnalyzeError') || 'AI service returned no result.');
    } catch (err) {
      console.error('AI analyze failed:', err);
      setError(err?.message || t('aiAnalyzeError') || 'Error connecting to AI service. Please try again.');
    }
    setLoading(false);
  };

  const copyResult = () => {
    navigator.clipboard?.writeText(result).catch((err) => {
      console.warn('Failed to copy result:', err);
      // Optional: show toast notification to user
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      <GlassCard className="p-4 space-y-4">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t('aiInputPlaceholder')}
          className="w-full bg-white/5 dark:bg-black/20 border border-black/20 dark:border-white/20 rounded-xl p-3.5 text-sm h-28 outline-none resize-none placeholder-slate-400 dark:placeholder-white/50 focus:ring-2 focus:ring-indigo-400/50 transition-all text-slate-800 dark:text-white"
        />
        <GlassButton primary onClick={handleAnalyze} disabled={loading} className="w-full py-3.5">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? t('aiAnalyzing') : t('aiAnalyzeBtn')}
        </GlassButton>
      </GlassCard>

      {loading && (
        <GlassCard className="p-6 text-center">
          <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-800 dark:text-white">{t('aiAnalyzing')}</p>
        </GlassCard>
      )}

      {error && !loading && (
        <GlassCard className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/20">
          <p className="text-sm font-semibold text-red-800 dark:text-red-200">{error}</p>
        </GlassCard>
      )}

      {result && !loading && (
        <GlassCard className="p-4">
          <div className="flex justify-between items-center mb-3 border-b border-black/10 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-500 dark:text-indigo-400" />
              <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">{moduleLabel}</span>
            </div>
            <button
              onClick={copyResult}
              className="flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1.5 rounded-lg bg-white/10 dark:bg-black/20 border border-black/10 dark:border-white/10 hover:bg-white/20 transition-all text-slate-800 dark:text-white"
            >
              {copied ? <CheckCircle size={12} className="text-emerald-500" /> : <Copy size={12} />}
              {copied ? t('aiCopied') : t('aiCopy')}
            </button>
          </div>
          <div className="text-xs font-medium leading-relaxed text-slate-800 dark:text-white whitespace-pre-wrap max-h-80 overflow-y-auto">
            {result}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

export function AIAssistantPage({ t, isRtl, lang, permits = [], reports = [] }) {
  const [activeModule, setActiveModule] = useState('incident');
  const activeModuleConfig = AI_MODULES.find(m => m.id === activeModule);
  const currentLang = lang || (isRtl ? 'ar' : 'en');
  const getModuleLabel = (mod) => MODULE_LABEL_KEYS[mod.id]?.[currentLang] || MODULE_LABEL_KEYS[mod.id]?.en || mod.id;

  return (
    <div className={`max-w-xl mx-auto space-y-5 animate-in slide-in-from-${isRtl ? 'right' : 'left'}-8 duration-300`}>
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">{t('aiPageTitle')}</h2>
          <p className="text-xs font-bold opacity-60 mt-1 text-slate-700 dark:text-white">{t('aiPageSub')}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
          <Zap size={12} className="text-indigo-500 animate-pulse" />
          <span className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300">Gemini AI</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { labelKey: 'aiActivePermits', value: permits.filter(p => p.status === 'open').length, icon: '📋', color: 'indigo' },
          { labelKey: 'aiOpenReports',  value: reports.filter(r => r.status === 'open').length, icon: '⚠️', color: 'red' },
          { labelKey: 'aiModulesCount', value: 5, icon: '✨', color: 'purple' },
        ].map(stat => (
          <GlassCard key={stat.labelKey} className="p-3 text-center">
            <div className="text-xl mb-1">{stat.icon}</div>
            <div className="text-xl font-black text-slate-800 dark:text-white">{stat.value}</div>
            <div className="text-[8px] font-bold opacity-50 text-slate-600 dark:text-white">{t(stat.labelKey)}</div>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-3">
        <p className="text-[9px] font-bold opacity-50 mb-2 text-slate-800 dark:text-white">{t('aiSelectModule')}</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {AI_MODULES.map(mod => (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border min-w-[72px] transition-all ${
                activeModule === mod.id
                  ? colorMap[mod.color] + ' shadow-sm'
                  : 'bg-white/5 dark:bg-black/20 border-black/10 dark:border-white/10 opacity-60 hover:opacity-100 text-slate-800 dark:text-white'
              }`}
            >
              <div className="shrink-0">{mod.icon}</div>
              <span className="text-[8px] font-bold text-center leading-tight">{getModuleLabel(mod)}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      <div>
        <div className={`flex items-center gap-2 mb-3 p-3 rounded-xl border ${colorMap[activeModuleConfig?.color || 'indigo']}`}>
          {activeModuleConfig?.icon}
          <p className="text-xs font-black">{getModuleLabel(activeModuleConfig || AI_MODULES[0])}</p>
        </div>
        <AIModulePanel moduleId={activeModule} t={t} lang={currentLang} />
      </div>

      <GlassCard className="p-4">
        <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-1.5">
          <Sparkles size={12}/> {t('aiTipsTitle')}
        </p>
        <ul className="space-y-1.5 text-[10px] text-slate-700 dark:text-white/70">
          <li className="flex gap-2"><span>📍</span>{t('aiTip1')}</li>
          <li className="flex gap-2"><span>📋</span>{t('aiTip2')}</li>
          <li className="flex gap-2"><span>👥</span>{t('aiTip3')}</li>
          <li className="flex gap-2"><span>⚠️</span>{t('aiTip4')}</li>
        </ul>
      </GlassCard>
    </div>
  );
}
