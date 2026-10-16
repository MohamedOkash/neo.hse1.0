// src/pages/IncidentInvestigation.jsx
// تحقيق الحوادث المنهجي — 5-Whys + تحديد جذر السبب + ربط الإجراءات التصحيحية
import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Plus, Save, Sparkles, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '../services/firebase';
import { writeAuditLog, AUDIT_ACTIONS } from '../services/auditService';
import { analyzeSafetyText } from '../services/aiSafetyService';

// ── Glass UI ────────────────────────────────────────────────────
const GlassCard  = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-white/80 bg-white/90 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/80 ${className}`}>{children}</div>
);
const Inp = (props) => (
  <input {...props} className={`w-full rounded-xl border border-zinc-200/80 bg-white/70 px-3 py-2 text-sm font-bold outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white ${props.className||''}`} />
);
const Textarea = (props) => (
  <textarea {...props} className={`w-full rounded-xl border border-zinc-200/80 bg-white/70 px-3 py-2 text-sm font-bold outline-none focus:border-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-white resize-none ${props.className||''}`} />
);

const ROOT_CAUSE_CATEGORIES = [
  { id: 'human',     label: 'عوامل بشرية',        desc: 'خطأ إنساني، قصور في التدريب، إجهاد' },
  { id: 'equipment', label: 'عوامل معدات',          desc: 'عطل، صيانة ناقصة، معدة غير مناسبة' },
  { id: 'procedure', label: 'إجراءات وأنظمة',       desc: 'غياب التعليمات، تعارض إجراءات' },
  { id: 'environment',label:'عوامل بيئية',          desc: 'طقس، إضاءة، ضوضاء، ترتيب الموقع' },
  { id: 'management', label: 'عوامل إدارية',        desc: 'ضغط الإنتاج، رقابة ناقصة، ثقافة السلامة' },
];

const EMPTY_WHY = () => ({ why: '', cause: '' });
const EMPTY_INVESTIGATION = () => ({
  incidentDate:    new Date().toISOString().slice(0, 10),
  incidentTime:    '',
  location:        '',
  affectedPerson:  '',
  witnesses:       '',
  description:     '',
  immediateAction: '',
  whys:            [EMPTY_WHY(), EMPTY_WHY(), EMPTY_WHY(), EMPTY_WHY(), EMPTY_WHY()],
  rootCauseCategory: '',
  rootCauseSummary:  '',
  recurrence:        'no',
  recommendations:   '',
  linkedReportId:    '',
  status:            'open',
});

export function IncidentInvestigation({ reports = [], user, t, isRtl, onCreateAction }) {
  const [selectedReport, setSelectedReport] = useState(null);
  const [form,    setForm]    = useState(EMPTY_INVESTIGATION());
  const [saving,  setSaving]  = useState(false);
  const [aiLoad,  setAiLoad]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [expanded, setExpanded] = useState(0);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setWhy = (i, key, val) => setForm(f => {
    const whys = [...f.whys]; whys[i] = { ...whys[i], [key]: val }; return { ...f, whys };
  });

  const openReports = reports.filter(r => r.status !== 'closed' && r.status !== 'statusClosed');

  const fillFromReport = (report) => {
    setSelectedReport(report);
    setForm(f => ({
      ...f,
      description:    report.title || '',
      location:       report.location || '',
      incidentDate:   (report.createdAt || '').slice(0, 10) || f.incidentDate,
      linkedReportId: report.id,
    }));
  };

  const runAiAssist = async () => {
    if (!form.description) return;
    setAiLoad(true);
    try {
      const res = await analyzeSafetyText(form.description, 'ar');
      const whys = [...form.whys];
      res.hazards?.slice(0, 3).forEach((h, i) => { if (whys[i]) whys[i].why = h; });
      setForm(f => ({
        ...f, whys,
        rootCauseSummary: res.correctiveActions?.[0] || f.rootCauseSummary,
        recommendations:  (res.preventiveActions || []).join('\n') || f.recommendations,
      }));
    } catch { /* silent */ }
    setAiLoad(false);
  };

  const handleSave = async () => {
    if (!db || !form.description) return;
    setSaving(true);
    try {
      const ref = doc(collection(db, 'investigations'));
      const data = {
        ...form,
        id: ref.id,
        createdBy: user?.uid,
        createdAt: new Date().toISOString(),
      };
      await setDoc(ref, data);
      await writeAuditLog(AUDIT_ACTIONS.REPORT_CREATED, user, 'investigations', ref.id, { linkedReportId: form.linkedReportId });
      if (form.recommendations && onCreateAction) {
        await onCreateAction({
          title:       `إجراء من تحقيق: ${form.description.slice(0, 60)}`,
          description: form.recommendations,
          sourceType:  'investigation',
          sourceId:    ref.id,
          priority:    'riskHigh',
          owner:       t ? t('hseDepartment') || 'HSE Team' : 'HSE Team',
          dueDate:     new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally { setSaving(false); }
  };

  const Section = ({ title, idx, children }) => (
    <GlassCard className="overflow-hidden">
      <button onClick={() => setExpanded(expanded === idx ? -1 : idx)}
        className="w-full flex items-center justify-between p-4 text-sm font-black hover:bg-black/5 dark:hover:bg-white/5 transition-all">
        <span className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black">{idx}</span>
          {title}
        </span>
        {expanded === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {expanded === idx && <div className="px-4 pb-5 space-y-4 border-t border-black/10 dark:border-white/10 pt-4">{children}</div>}
    </GlassCard>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-300" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-black">تحقيق الحوادث</h2>
        <p className="text-xs font-bold opacity-60 mt-1">منهجية 5-Whys + تحديد جذر السبب + ISO 45001</p>
      </div>

      {/* ربط ببلاغ موجود */}
      {openReports.length > 0 && (
        <GlassCard className="p-4">
          <p className="text-xs font-black opacity-60 mb-2">ربط ببلاغ موجود (اختياري)</p>
          <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto">
            {openReports.map(r => (
              <button key={r.id} onClick={() => fillFromReport(r)}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all text-right ${selectedReport?.id === r.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-200/50 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5'}`}>
                <span className="truncate">{r.title}</span>
                <span className={`ml-2 px-2 py-0.5 rounded-full text-[9px] font-black ${r.severity === 'riskCritical' ? 'bg-red-500/20 text-red-600' : 'bg-amber-500/20 text-amber-600'}`}>
                  {r.severity}
                </span>
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      {/* 1. معلومات الحادث */}
      <Section title="معلومات الحادث الأساسية" idx={1}>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-[10px] font-black opacity-60 block mb-1">تاريخ الحادث</label><Inp type="date" value={form.incidentDate} onChange={e => set('incidentDate', e.target.value)} /></div>
          <div><label className="text-[10px] font-black opacity-60 block mb-1">وقت الحادث</label><Inp type="time" value={form.incidentTime} onChange={e => set('incidentTime', e.target.value)} /></div>
        </div>
        <div><label className="text-[10px] font-black opacity-60 block mb-1">موقع الحادث</label><Inp value={form.location} onChange={e => set('location', e.target.value)} placeholder="المنطقة / المبنى / الطابق" /></div>
        <div><label className="text-[10px] font-black opacity-60 block mb-1">الشخص المتأثر</label><Inp value={form.affectedPerson} onChange={e => set('affectedPerson', e.target.value)} placeholder="الاسم والوظيفة" /></div>
        <div><label className="text-[10px] font-black opacity-60 block mb-1">الشهود</label><Inp value={form.witnesses} onChange={e => set('witnesses', e.target.value)} placeholder="أسماء الشهود" /></div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-black opacity-60">وصف الحادث *</label>
            <button onClick={runAiAssist} disabled={aiLoad || !form.description}
              className="flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition-all disabled:opacity-40">
              <Sparkles size={10} /> {aiLoad ? 'جاري...' : 'مساعدة AI'}
            </button>
          </div>
          <Textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="وصف تفصيلي لما حدث — من أين بدأ، ما الذي رآه الشهود..." />
        </div>
        <div><label className="text-[10px] font-black opacity-60 block mb-1">الإجراء الفوري المتخذ</label><Textarea rows={2} value={form.immediateAction} onChange={e => set('immediateAction', e.target.value)} placeholder="ما الذي فُعل مباشرة بعد الحادث؟" /></div>
      </Section>

      {/* 2. تحليل 5-Whys */}
      <Section title="تحليل 5-Whys — لماذا حدث ذلك؟" idx={2}>
        <p className="text-[10px] font-bold opacity-60 -mt-1 mb-3">ابدأ من السطح وانزل إلى جذر المشكلة. اسأل "لماذا؟" لكل إجابة.</p>
        {form.whys.map((w, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="w-7 h-7 rounded-full border-2 border-indigo-500/40 flex items-center justify-center text-[10px] font-black text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-1">
              {i + 1}
            </div>
            <div className="flex-1 space-y-1.5">
              <Inp value={w.why} onChange={e => setWhy(i, 'why', e.target.value)} placeholder={`لماذا ${i === 0 ? '(السؤال الأول — ما الذي حدث مباشرة؟)' : i === 4 ? '(هذا هو جذر السبب الحقيقي)' : `السؤال رقم ${i+1}`}`} />
              {i < 4 && (
                <div className="flex items-center gap-1 text-[9px] font-bold opacity-40 px-2">
                  <ArrowLeft size={10} className={isRtl ? 'rotate-180' : ''} /> لأن...
                </div>
              )}
            </div>
          </div>
        ))}
      </Section>

      {/* 3. جذر السبب */}
      <Section title="تحديد جذر السبب" idx={3}>
        <div className="grid grid-cols-1 gap-2">
          {ROOT_CAUSE_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => set('rootCauseCategory', cat.id)}
              className={`flex items-start gap-3 p-3 rounded-xl border text-right transition-all ${form.rootCauseCategory === cat.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-200/50 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5'}`}>
              <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 transition-all ${form.rootCauseCategory === cat.id ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-300 dark:border-zinc-600'}`} />
              <div>
                <p className="text-xs font-black">{cat.label}</p>
                <p className="text-[10px] opacity-60 font-bold">{cat.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <div>
          <label className="text-[10px] font-black opacity-60 block mb-1">ملخص جذر السبب</label>
          <Textarea rows={3} value={form.rootCauseSummary} onChange={e => set('rootCauseSummary', e.target.value)} placeholder="اكتب جذر السبب بوضوح — هذا ما سيُستخدم في الإجراء التصحيحي" />
        </div>
        <div>
          <label className="text-[10px] font-black opacity-60 block mb-1">هل هذا الحادث حدث من قبل؟</label>
          <div className="flex gap-3">
            {[{v:'no',l:'لأول مرة'},{v:'yes',l:'تكرار'},{v:'similar',l:'مشابه'}].map(o => (
              <button key={o.v} onClick={() => set('recurrence', o.v)}
                className={`flex-1 py-2 rounded-xl border text-xs font-black transition-all ${form.recurrence === o.v ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'border-zinc-200/50 dark:border-white/10'}`}>
                {o.l}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* 4. التوصيات */}
      <Section title="التوصيات والإجراءات الوقائية" idx={4}>
        <div>
          <label className="text-[10px] font-black opacity-60 block mb-1">التوصيات (كل سطر إجراء)</label>
          <Textarea rows={5} value={form.recommendations} onChange={e => set('recommendations', e.target.value)}
            placeholder={"1. تدريب العمال على إجراء X\n2. تركيب حاجز حماية عند منطقة Y\n3. مراجعة تصريح العمل Z"} />
          <p className="text-[9px] opacity-50 font-bold mt-1">ستُحفظ هذه التوصيات تلقائياً كإجراءات تصحيحية مرتبطة</p>
        </div>
      </Section>

      {/* زر الحفظ */}
      <button onClick={handleSave} disabled={saving || !form.description}
        className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
        {saved
          ? <><CheckCircle size={18} /> تم الحفظ وإنشاء الإجراءات التصحيحية</>
          : saving
            ? 'جاري الحفظ...'
            : <><Save size={18} /> حفظ التحقيق وإنشاء الإجراءات التصحيحية</>
        }
      </button>

    </div>
  );
}
