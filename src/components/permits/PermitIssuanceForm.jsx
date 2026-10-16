// src/components/permits/PermitIssuanceForm.jsx
// فورم إصدار التصريح — يحل مشكلة الملف الناقص الحرجة
import React, { useState } from 'react';
import { X, FileText, MapPin, Users, Wrench, User, ClipboardList } from 'lucide-react';

const PERMIT_TYPES_AR = [
  'تصريح عمل عام',
  'تصريح أعمال حريق',
  'تصريح أعمال كهربائية',
  'تصريح أعمال على ارتفاع',
  'تصريح دخول للفراغات المغلقة',
  'تصريح أعمال حفر',
  'تصريح رفع وتشغيل رافعة',
  'تصريح أعمال ميكانيكية',
];

export function PermitIssuanceForm({ onSubmit, onClose, t, isRtl, user }) {
  const [form, setForm] = useState({
    type:            '',
    location:        '',
    workDescription: '',
    supervisorName:  user?.displayName || '',
    engineerName:    '',
    workersCount:    1,
    supervisorsCount: 1,
    startDate:       new Date().toISOString().slice(0, 10),
    endDate:         '',
    hazards:         '',
    ppe:             '',
  });
  const [errors, setErrors]   = useState([]);
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const validate = () => {
    const e = [];
    if (!form.type)            e.push('نوع التصريح مطلوب');
    if (!form.location)        e.push('الموقع مطلوب');
    if (!form.workDescription) e.push('وصف العمل مطلوب');
    if (!form.supervisorName)  e.push('اسم المشرف مطلوب');
    if (!form.endDate)         e.push('تاريخ الانتهاء مطلوب');
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (e.length) { setErrors(e); return; }
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        workersCount:    Number(form.workersCount),
        supervisorsCount: Number(form.supervisorsCount),
      });
      onClose();
    } catch (err) {
      setErrors([err.message || 'حدث خطأ أثناء الحفظ']);
    } finally {
      setLoading(false);
    }
  };

  const label = (text) => (
    <label className="block text-xs font-black mb-1 opacity-70">{text}</label>
  );
  const input = (key, placeholder, type = 'text') => (
    <input
      type={type}
      value={form[key]}
      onChange={e => set(key, e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-zinc-200/80 bg-white/70 px-4 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
    />
  );

  return (
    <div className="space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* النوع */}
      <div>
        {label('نوع التصريح *')}
        <select
          value={form.type}
          onChange={e => set('type', e.target.value)}
          className="w-full rounded-xl border border-zinc-200/80 bg-white/70 px-4 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-zinc-900 dark:text-white"
        >
          <option value="">-- اختر نوع التصريح --</option>
          {PERMIT_TYPES_AR.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* الموقع */}
      <div>
        {label('الموقع *')}
        {input('location', 'مثال: المنطقة ب — الطابق الثالث')}
      </div>

      {/* وصف العمل */}
      <div>
        {label('وصف العمل *')}
        <textarea
          value={form.workDescription}
          onChange={e => set('workDescription', e.target.value)}
          rows={3}
          placeholder="وصف تفصيلي لطبيعة العمل المطلوب تنفيذه..."
          className="w-full rounded-xl border border-zinc-200/80 bg-white/70 px-4 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white"
        />
      </div>

      {/* اسم المشرف واسم المهندس */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          {label('اسم المشرف *')}
          {input('supervisorName', 'اسم مشرف الموقع')}
        </div>
        <div>
          {label('اسم المهندس')}
          {input('engineerName', 'اسم المهندس المسؤول')}
        </div>
      </div>

      {/* عدد العمال والمشرفين */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          {label('عدد العمال')}
          {input('workersCount', '1', 'number')}
        </div>
        <div>
          {label('عدد المشرفين')}
          {input('supervisorsCount', '1', 'number')}
        </div>
      </div>

      {/* تاريخ البدء والانتهاء */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          {label('تاريخ البدء')}
          {input('startDate', '', 'date')}
        </div>
        <div>
          {label('تاريخ الانتهاء *')}
          {input('endDate', '', 'date')}
        </div>
      </div>

      {/* المخاطر المتوقعة */}
      <div>
        {label('المخاطر المتوقعة')}
        {input('hazards', 'سقوط من ارتفاع، كهرباء...')}
      </div>

      {/* مستلزمات الوقاية */}
      <div>
        {label('مستلزمات الوقاية الشخصية (PPE)')}
        {input('ppe', 'خوذة، حزام أمان، قفازات...')}
      </div>

      {/* رسائل الخطأ */}
      {errors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 space-y-1">
          {errors.map((e, i) => (
            <p key={i} className="text-xs font-bold text-red-600 dark:text-red-400">• {e}</p>
          ))}
        </div>
      )}

      {/* أزرار الإجراء */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-black text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all disabled:opacity-50"
        >
          {loading ? 'جاري الحفظ...' : (t ? t('issuePermit') || 'إصدار التصريح' : 'إصدار التصريح')}
        </button>
        <button
          onClick={onClose}
          className="px-5 py-3 border border-zinc-200 dark:border-white/10 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-white/5 transition-all"
        >
          {t ? t('cancel') || 'إلغاء' : 'إلغاء'}
        </button>
      </div>
    </div>
  );
}
