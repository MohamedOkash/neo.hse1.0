// src/pages/SafetyWorkspace.jsx
// لوحة تحكم السلامة المركزية — مدمجة من ConstructFlow
import React from 'react';
import { ShieldAlert, FileText, AlertTriangle, CheckCircle, Plus, Flame, Clock, MapPin } from 'lucide-react';
import { STATUSES } from '../constants';

// ─── GlassCard خفيفة مدمجة لتجنب تعارض الاستيراد ───
const GlassCard = ({ children, className = '', onClick }) => (
  <div
    onClick={onClick}
    className={`rounded-2xl border border-white/80 bg-white/90 shadow-xl shadow-zinc-200/40 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/80 dark:shadow-black/50 ${onClick ? 'cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl' : ''} ${className}`}
  >
    {children}
  </div>
);

export function SafetyWorkspace({
  isRtl, setActiveTab,
  permits = [], reports = [], correctiveActions = [],
  user, t,
  canAddReport, canAddPermit,
  onAddReport, onAddPermit,
}) {
  const activePermits  = permits.filter(p => p.status === STATUSES.PERMIT.ACTIVE || p.workflowStatus === 'permitActive');
  const openReports    = reports.filter(r => r.status === STATUSES.REPORT.OPEN);
  const criticalRisks  = openReports.filter(r => r.severity === 'riskCritical').length;
  const openActions    = (correctiveActions || []).filter(a => a.status !== 'caClosed').length;

  return (
    <div className={`max-w-5xl mx-auto space-y-6 animate-in slide-in-from-${isRtl ? 'right' : 'left'}-8 duration-300`} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* رأس الصفحة */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-black text-emerald-700 dark:text-emerald-400 mb-1">
          {t('hseCommandCenter') || 'قسم السلامة والصحة المهنية'}
        </h2>
        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
          {t('safetyDesc') || 'مركز واحد للتحكم في كافة تصاريح وبلاغات الموقع.'}
        </p>
      </div>

      {/* الكروت الإحصائية */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-4 flex flex-col items-center justify-center text-center hover:bg-emerald-50 transition-all" onClick={() => setActiveTab('permits')}>
          <FileText size={24} className="text-emerald-500 mb-2" />
          <h3 className="text-2xl font-black">{activePermits.length}</h3>
          <p className="text-[10px] font-bold opacity-70 uppercase">{t('activePermits') || 'تصاريح نشطة'}</p>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col items-center justify-center text-center hover:bg-amber-50 transition-all" onClick={() => setActiveTab('reports')}>
          <AlertTriangle size={24} className="text-amber-500 mb-2" />
          <h3 className="text-2xl font-black">{openReports.length}</h3>
          <p className="text-[10px] font-bold opacity-70 uppercase">{t('openReports') || 'بلاغات مفتوحة'}</p>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col items-center justify-center text-center border-rose-500/30">
          <Flame size={24} className="text-rose-500 mb-2" />
          <h3 className="text-2xl font-black text-rose-600">{criticalRisks}</h3>
          <p className="text-[10px] font-bold opacity-70 uppercase">{t('criticalRisks') || 'مخاطر حرجة'}</p>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col items-center justify-center text-center">
          <CheckCircle size={24} className="text-blue-500 mb-2" />
          <h3 className="text-2xl font-black">{openActions}</h3>
          <p className="text-[10px] font-bold opacity-70 uppercase">{t('correctiveActions') || 'إجراءات تصحيحية'}</p>
        </GlassCard>
      </div>

      {/* الإجراءات السريعة + جداول البيانات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* عمود الأزرار */}
        <div className="md:col-span-1 space-y-4">
          <GlassCard className="p-5">
            <h3 className="text-sm font-black mb-4 flex items-center gap-2">
              <ShieldAlert size={16} className="text-emerald-500" /> {t('quickActions') || 'إجراءات سريعة'}
            </h3>
            <div className="space-y-3">
              <button
                onClick={onAddPermit}
                disabled={!canAddPermit}
                className="w-full flex items-center justify-between p-3.5 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 transition-all disabled:opacity-50"
              >
                <span className="text-xs font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <FileText size={14} /> {t('issuePermit') || 'إصدار تصريح'}
                </span>
                <Plus size={14} className="text-emerald-500" />
              </button>
              <button
                onClick={onAddReport}
                disabled={!canAddReport}
                className="w-full flex items-center justify-between p-3.5 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-xl hover:bg-amber-100 transition-all disabled:opacity-50"
              >
                <span className="text-xs font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle size={14} /> {t('reportViolation') || 'بلاغ مخالفة'}
                </span>
                <Plus size={14} className="text-amber-500" />
              </button>
            </div>
          </GlassCard>
        </div>

        {/* عمود عرض التصاريح والبلاغات */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* أحدث التصاريح النشطة */}
          <GlassCard className="p-5">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <h3 className="text-xs font-black text-emerald-600">{t('activePermitsNow') || 'التصاريح النشطة الآن'}</h3>
              <button onClick={() => setActiveTab('permits')} className="text-[9px] font-bold opacity-60 hover:opacity-100">{t('viewAll') || 'عرض الكل'}</button>
            </div>
            {activePermits.length === 0 ? (
              <p className="text-center text-xs opacity-50 py-4 font-bold">{t('noActivePermits') || 'لا توجد تصاريح نشطة.'}</p>
            ) : (
              <div className="space-y-3">
                {activePermits.slice(0, 3).map(p => (
                  <div key={p.id} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs font-bold truncate text-emerald-700 dark:text-emerald-400">{p.type}</p>
                    <div className="flex justify-between items-center mt-2 opacity-70">
                      <span className="text-[9px] flex items-center gap-1"><MapPin size={10} /> {p.location}</span>
                      <span className="text-[9px] font-black">{p.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* أحدث البلاغات المفتوحة */}
          <GlassCard className="p-5">
            <div className="flex justify-between items-center mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <h3 className="text-xs font-black text-amber-600">{t('latestReports') || 'أحدث البلاغات'}</h3>
              <button onClick={() => setActiveTab('reports')} className="text-[9px] font-bold opacity-60 hover:opacity-100">{t('viewAll') || 'عرض الكل'}</button>
            </div>
            {openReports.length === 0 ? (
              <p className="text-center text-xs opacity-50 py-4 font-bold">{t('noOpenReports') || 'لا توجد بلاغات مفتوحة.'}</p>
            ) : (
              <div className="space-y-3">
                {openReports.slice(0, 3).map(r => (
                  <div key={r.id} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs font-bold truncate text-amber-700 dark:text-amber-400">{r.title}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[9px] flex items-center gap-1 opacity-70"><Clock size={10} /> {new Date(r.createdAt || Date.now()).toLocaleDateString('ar-EG')}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${r.severity === 'riskCritical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                        {t(r.severity) || r.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
