// src/pages/ReportsCenterEnhanced.jsx
// مركز البلاغات المحسّن — يدمج AI Analysis + Corrective Actions من ConstructFlow
import React, { useState } from 'react';
import {
  AlertTriangle, CheckCircle, Download, PenTool, Printer,
  Send, ShieldAlert, Sparkles, Zap, ArrowRight, Clock, FileText
} from 'lucide-react';
import AiSafetyOutput from '../components/ai/AiSafetyOutput.jsx';
import { analyzeSafetyText } from '../services/aiSafetyService.js';
import { CORRECTIVE_NEXT_STATUS, getCorrectiveStatusLabel } from '../constants/correctiveActions.js';

// ─── Glass components مدمجة ───
const GlassCard  = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-white/80 bg-white/90 shadow-xl shadow-zinc-200/40 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/80 dark:shadow-black/50 ${className}`}>{children}</div>
);
const GlassInput = (props) => (
  <input {...props} className={`w-full rounded-xl border border-zinc-200/80 bg-white/70 px-4 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white ${props.className || ''}`} />
);

export function ReportsCenterEnhanced({
  reports = [],
  correctiveActions = [],
  onCreateCorrectiveAction,
  onAdvanceCorrectiveAction,
  exportCSV,
  exportPDF,
  t,
  isRtl,
  addNote,
  user,
}) {
  const [activeSubTab, setActiveSubTab] = useState('reports');
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [noteText, setNoteText]         = useState('');
  const [aiInput, setAiInput]           = useState('');
  const [aiResult, setAiResult]         = useState(null);
  const [aiLoading, setAiLoading]       = useState(false);

  const isPM     = user?.role === 'rolePM'     || user?.role === 'project_manager';
  const isSafety = user?.role === 'roleSafety' || user?.role === 'safety_engineer';
  const canNote  = isPM || isSafety;

  const submitNote = (id) => {
    if (noteText.trim()) { addNote(id, noteText); }
    setActiveNoteId(null);
    setNoteText('');
  };

  const createActionFromReport = (report) => {
    if (!onCreateCorrectiveAction) return;
    onCreateCorrectiveAction({
      sourceType:  'report',
      sourceId:    report.id,
      title:       report.aiAnalysis?.title || report.title,
      description: report.aiAnalysis?.summary || report.title,
      priority:    report.severity,
      owner:       t('hseDepartment') || 'HSE Team',
      dueDate:     new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
  };

  const runAiAnalysis = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    try {
      const result = await analyzeSafetyText(aiInput, t ? 'ar' : 'ar');
      setAiResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const openActions = correctiveActions.filter(a => a.status !== 'caClosed').length;

  return (
    <div className={`max-w-xl mx-auto space-y-5 animate-in slide-in-from-${isRtl ? 'right' : 'left'}-8 duration-300`} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-black">{t ? t('modulesReports') || 'البلاغات' : 'البلاغات'}</h2>
          <p className="text-xs font-bold opacity-60 mt-1">{t ? t('modulesReportsDesc') || 'مركز إدارة البلاغات والإجراءات التصحيحية' : 'مركز إدارة البلاغات والإجراءات التصحيحية'}</p>
        </div>
        <div className="flex gap-2">
          {exportCSV && (
            <button onClick={() => exportCSV(reports)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] font-bold transition-all">
              <Download size={14} /> Excel
            </button>
          )}
          {exportPDF && (
            <button onClick={() => exportPDF()} className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-[10px] font-bold transition-all">
              <Printer size={14} /> PDF
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/20 p-1 rounded-2xl shadow-sm">
        {['reports', 'actions', 'ai-analysis'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeSubTab === tab ? 'bg-white/20 shadow-md' : 'opacity-60 hover:opacity-100'}`}
          >
            {tab === 'reports' && <>{t ? t('reportsTab') || 'البلاغات' : 'البلاغات'}</>}
            {tab === 'actions' && (
              <>{t ? t('correctiveActions') || 'إجراءات تصحيحية' : 'إجراءات تصحيحية'}
                {openActions > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">{openActions}</span>}</>
            )}
            {tab === 'ai-analysis' && <><Sparkles size={12} /> AI تحليل</>}
          </button>
        ))}
      </div>

      {/* ─── تبويب البلاغات ─── */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          {reports.map((report) => (
            <GlassCard key={report.id} className="p-5 border-l-4 border-l-red-500 dark:border-l-red-400 overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className="p-2.5 rounded-xl bg-white/10 border border-black/10 dark:border-white/20 text-red-500">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm leading-tight">{report.title}</h3>
                    <div className="flex items-center gap-2 mt-1 opacity-60">
                      <Clock size={10} />
                      <span className="text-[10px] font-bold">{report.id}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${report.severity === 'riskCritical' ? 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'}`}>
                  {(t && t(report.severity)) || report.severity}
                </span>
              </div>

              {/* AI Analysis إن وُجد */}
              {report.aiAnalysis && (
                <div className="mb-4">
                  <AiSafetyOutput result={report.aiAnalysis} t={t} />
                </div>
              )}

              {/* ملاحظة المدير */}
              {report.pmNote && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl mb-4">
                  <p className="text-[10px] font-black mb-1 flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
                    <PenTool size={12} /> {t ? t('pmNoteLbl') || 'توجيه الإدارة' : 'توجيه الإدارة'}
                  </p>
                  <p className="text-xs font-bold leading-relaxed">{report.pmNote}</p>
                </div>
              )}

              <div className="flex gap-2">
                {canNote && !report.pmNote && activeNoteId !== report.id && (
                  <button onClick={() => setActiveNoteId(report.id)}
                    className="flex-1 py-2.5 border border-dashed border-black/20 dark:border-white/30 rounded-xl text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                    <PenTool size={14} /> {t ? t('addNote') || 'إضافة ملاحظة' : 'إضافة ملاحظة'}
                  </button>
                )}
                {!correctiveActions.some(a => a.sourceId === report.id) && canNote && onCreateCorrectiveAction && (
                  <button onClick={() => createActionFromReport(report)}
                    className="flex-1 py-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2">
                    <Zap size={14} /> {t ? t('createAction') || 'إجراء تصحيحي' : 'إجراء تصحيحي'}
                  </button>
                )}
              </div>

              {activeNoteId === report.id && (
                <div className="mt-3 flex gap-2 animate-in slide-in-from-top-2">
                  <GlassInput value={noteText} onChange={e => setNoteText(e.target.value)} placeholder={t ? t('writeNote') || 'اكتب ملاحظة...' : 'اكتب ملاحظة...'} />
                  <button onClick={() => submitNote(report.id)} className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-xs shadow-lg">
                    <Send size={16} />
                  </button>
                </div>
              )}
            </GlassCard>
          ))}
          {reports.length === 0 && (
            <div className="text-center py-20 opacity-40 font-bold text-sm italic">{t ? t('noReportsFound') || 'لا توجد بلاغات.' : 'لا توجد بلاغات.'}</div>
          )}
        </div>
      )}

      {/* ─── تبويب الإجراءات التصحيحية ─── */}
      {activeSubTab === 'actions' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          {correctiveActions.map((action) => {
            const nextStatus = CORRECTIVE_NEXT_STATUS[action.status];
            return (
              <GlassCard key={action.id} className="p-5 border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-blue-500" />
                    <span className="text-[10px] font-black opacity-50">{action.id?.slice(-6)}</span>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${action.status === 'caClosed' ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' : 'bg-blue-500/20 text-blue-600 border-blue-500/30'}`}>
                    {getCorrectiveStatusLabel(action.status, t)}
                  </span>
                </div>
                <h4 className="font-bold text-sm mb-1">{action.title}</h4>
                <p className="text-xs opacity-70 mb-4 line-clamp-2">{action.description}</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-black/5 dark:bg-white/5 p-2 rounded-lg text-[10px] font-bold">
                    <span className="opacity-50 block mb-0.5">{t ? t('ownerLbl') || 'المسؤول' : 'المسؤول'}</span>
                    {action.owner}
                  </div>
                  <div className="bg-black/5 dark:bg-white/5 p-2 rounded-lg text-[10px] font-bold">
                    <span className="opacity-50 block mb-0.5">{t ? t('priorityLbl') || 'الأولوية' : 'الأولوية'}</span>
                    {(t && t(action.priority)) || action.priority}
                  </div>
                </div>
                {nextStatus && canNote && onAdvanceCorrectiveAction && (
                  <button onClick={() => onAdvanceCorrectiveAction(action)}
                    className="w-full py-3 flex items-center justify-center gap-2 text-xs bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-bold shadow-lg">
                    <ArrowRight size={14} className={isRtl ? 'rotate-180' : ''} />
                    {t ? t('moveTo') || 'الانتقال إلى' : 'الانتقال إلى'} {getCorrectiveStatusLabel(nextStatus, t)}
                  </button>
                )}
              </GlassCard>
            );
          })}
          {correctiveActions.length === 0 && (
            <div className="text-center py-20 opacity-40 font-bold text-sm italic">{t ? t('noActionsFound') || 'لا توجد إجراءات تصحيحية.' : 'لا توجد إجراءات تصحيحية.'}</div>
          )}
        </div>
      )}

      {/* ─── تبويب تحليل AI ─── */}
      {activeSubTab === 'ai-analysis' && (
        <div className="space-y-4 animate-in fade-in duration-500">
          <GlassCard className="p-5">
            <h3 className="text-sm font-black mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-500" /> تحليل السلامة بالذكاء الاصطناعي
            </h3>
            <textarea
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              rows={4}
              placeholder="اكتب وصف الحالة أو المخالفة أو الحادث وسيقوم الذكاء الاصطناعي بتحليلها وتقديم توصيات السلامة..."
              className="w-full rounded-xl border border-zinc-200/80 bg-white/70 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white mb-3"
            />
            <button
              onClick={runAiAnalysis}
              disabled={aiLoading || !aiInput.trim()}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              {aiLoading ? 'جاري التحليل...' : 'تحليل بالذكاء الاصطناعي'}
            </button>
          </GlassCard>

          {aiResult && (
            <AiSafetyOutput result={aiResult} t={t} />
          )}
        </div>
      )}
    </div>
  );
}
