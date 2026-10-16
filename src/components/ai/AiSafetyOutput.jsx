// src/components/ai/AiSafetyOutput.jsx
// مكوّن عرض نتيجة تحليل السلامة — مستخرج من ConstructFlow
import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, Sparkles, Zap } from 'lucide-react';

const SEVERITY_STYLES = {
  riskLow:      'text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  riskMedium:   'text-amber-600   dark:text-amber-300   bg-amber-500/10   border-amber-500/30',
  riskHigh:     'text-red-600     dark:text-red-300     bg-red-500/10     border-red-500/30',
  riskCritical: 'text-fuchsia-600 dark:text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/30',
};

export default function AiSafetyOutput({ result, t, onUseReport }) {
  if (!result) return null;

  const severityLabel = t && t(result.severity) !== result.severity
    ? t(result.severity) : result.severity;

  return (
    <div className="space-y-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-slate-800 dark:text-white">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-indigo-700 dark:text-indigo-200">
            <Sparkles size={14} />
            AI Safety Analysis
          </div>
          <h3 className="mt-1 text-sm font-black">{result.title}</h3>
        </div>
        <div className={`rounded-xl border px-3 py-2 text-center text-[10px] font-black ${SEVERITY_STYLES[result.severity] || SEVERITY_STYLES.riskHigh}`}>
          <span className="block">{severityLabel}</span>
          <span className="text-[9px] opacity-70">{result.riskScore}/100</span>
        </div>
      </div>

      <p className="rounded-xl border border-black/10 bg-white/10 p-3 text-xs font-bold leading-relaxed dark:border-white/10">
        {result.summary}
      </p>

      <AiList icon={<AlertTriangle size={14} />} title={t ? t('potentialHazards') || 'المخاطر المحتملة'      : 'المخاطر المحتملة'}      items={result.hazards}           />
      <AiList icon={<Zap          size={14} />} title={t ? t('correctiveActions') || 'إجراءات تصحيحية'     : 'إجراءات تصحيحية'}     items={result.correctiveActions} />
      <AiList icon={<ShieldAlert  size={14} />} title={t ? t('preventiveActions') || 'إجراءات وقائية'      : 'إجراءات وقائية'}      items={result.preventiveActions} />

      {onUseReport && (
        <button
          type="button"
          onClick={() => onUseReport(result)}
          className="w-full rounded-xl border border-indigo-500/30 bg-indigo-500/20 px-4 py-3 text-xs font-black text-indigo-700 transition-all hover:bg-indigo-500/30 dark:text-indigo-100"
        >
          {t ? t('useFormattedReport') || 'استخدام التقرير المنسق' : 'استخدام التقرير المنسق'}
        </button>
      )}
    </div>
  );
}

function AiList({ icon, title, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-[10px] font-black opacity-70">
        {icon}
        {title}
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 rounded-xl bg-white/10 p-2 text-[11px] font-bold leading-relaxed">
            <CheckCircle size={13} className="mt-0.5 shrink-0 text-emerald-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
