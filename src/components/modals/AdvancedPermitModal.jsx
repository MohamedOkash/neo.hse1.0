import React, { useState } from 'react';
import { Sparkles, Loader2, CheckCircle, Users, UserCheck, HardHat, ShieldAlert, AlertTriangle } from 'lucide-react';
import { GlassInput, GlassButton, ModalWrapper } from '../ui/GlassComponents';
import { fetchGemini } from '../../services/ai';
import { PERMIT_TYPES, RISK_LEVELS } from '../../data/permitTypes';

export function AdvancedPermitModal({ closeModal, addPermit, t, isRtl, user }) {
  const [selectedTypeId, setSelectedTypeId] = useState(PERMIT_TYPES[0].id);
  const [riskLevel, setRiskLevel] = useState('');
  const [formData, setFormData] = useState({
    location: '',
    workersCount: '',
    supervisorsCount: '',
    supervisorName: '',
    engineerName: '',
    requesterName: user?.name || '',
    workDescription: '',
  });
  const [dynamicValues, setDynamicValues] = useState({});
  const [checklist, setChecklist] = useState({});
  const [customTBT, setCustomTBT] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const selectedType = PERMIT_TYPES.find(pt => pt.id === selectedTypeId) || PERMIT_TYPES[0];
  const effectiveRisk = riskLevel || selectedType.defaultRisk;

  const riskColors = {
    riskLow:      'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    riskMedium:   'text-amber-600   dark:text-amber-400   bg-amber-500/10   border-amber-500/30',
    riskHigh:     'text-orange-600  dark:text-orange-400  bg-orange-500/10  border-orange-500/30',
    riskCritical: 'text-red-600     dark:text-red-400     bg-red-500/10     border-red-500/30',
  };

  const handleTypeChange = (typeId) => {
    setSelectedTypeId(typeId);
    setDynamicValues({});
    setChecklist({});
    const pt = PERMIT_TYPES.find(p => p.id === typeId);
    if (pt) setRiskLevel(pt.defaultRisk);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleDynChange = (id, val) => setDynamicValues({ ...dynamicValues, [id]: val });

  const generateTBT = async () => {
    if (!formData.workDescription) return alert('الرجاء كتابة تفاصيل وطبيعة العمل أولاً');
    setIsAnalyzing(true);
    const prompt = `أنت خبير سلامة مهنية (HSE). قم بتحليل طبيعة العمل التالية: "${formData.workDescription}". نوع التصريح: "${selectedType.name}". مستوى الخطورة: "${effectiveRisk}". استخرج أهم 3 مخاطر محتملة و 3 إجراءات وقائية. يجب أن يكون الرد مصفوفة JSON تحتوي على 3 نصوص فقط. مثال: ["1. خطر: يجب عمل كذا", "2. ...", "3. ..."]. الرد JSON Array فقط.`;
    try {
      const response = await fetchGemini(prompt, true);
      const clean = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(clean);
      if (Array.isArray(data)) setCustomTBT(data);
    } catch (e) {
      alert('حدث خطأ في توليد التعليمات، جرب مرة أخرى.');
    }
    setIsAnalyzing(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newPermit = {
      id: `PRM-${Math.floor(Math.random() * 9000) + 1000}`,
      ...formData,
      type: selectedType.name,
      permitTypeId: selectedType.id,
      riskLevel: effectiveRisk,
      dynamicFields: dynamicValues,
      checklistItems: selectedType.checklist,
      checklistStatus: checklist,
      customTBT,
      status: 'open',
      validUntil: new Date(Date.now() + 8 * 3600000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      risk: effectiveRisk,
      pmNote: '',
      approvalStatus: 'pending',
      approvalLevel: 0,
      approvalHistory: [{
        level: 0,
        role: user?.role || 'worker',
        name: user?.name || 'System',
        action: 'submitted',
        comment: '',
        timestamp: Date.now(),
      }],
      createdAt: new Date().toLocaleString('ar-EG'),
      createdBy: user?.name || '',
    };
    addPermit(newPermit);
  };

  const allDynFilled = selectedType.dynamicFields
    .filter(f => f.required)
    .every(f => dynamicValues[f.id] && dynamicValues[f.id].toString().trim() !== '');

  return (
    <ModalWrapper onClose={closeModal} title={t('newPermitTitle')} subTitle={t('newPermitSub')}>
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Permit Type Selector */}
        <div>
          <label className="block text-[10px] font-bold opacity-70 mb-2 text-slate-800 dark:text-white">
            {t('permitType')} *
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {PERMIT_TYPES.map(pt => (
              <button
                key={pt.id}
                type="button"
                onClick={() => handleTypeChange(pt.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-start ${
                  selectedTypeId === pt.id
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-700 dark:text-indigo-200 shadow-md'
                    : 'bg-white/5 dark:bg-black/20 border-black/10 dark:border-white/20 opacity-70 hover:opacity-100 text-slate-800 dark:text-white'
                }`}
              >
                <span className="text-base shrink-0">{pt.emoji}</span>
                <span className="leading-tight text-[10px]">{pt.name.split('/')[0].trim()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Risk Level */}
        <div>
          <label className="block text-[10px] font-bold opacity-70 mb-2 text-slate-800 dark:text-white">
            {t('riskLevelLbl')}
          </label>
          <div className="flex gap-2">
            {RISK_LEVELS.map(rl => (
              <button
                key={rl.id}
                type="button"
                onClick={() => setRiskLevel(rl.id)}
                className={`flex-1 py-2 rounded-xl border text-[9px] font-bold transition-all ${
                  effectiveRisk === rl.id
                    ? riskColors[rl.id] + ' shadow-sm'
                    : 'bg-white/5 dark:bg-black/20 border-black/10 dark:border-white/20 opacity-50 hover:opacity-80 text-slate-800 dark:text-white'
                }`}
              >
                {rl.emoji} {rl.label.split('/')[0].trim()}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">
            {t('permitLoc')} *
          </label>
          <GlassInput type="text" name="location" onChange={handleChange} required />
        </div>

        {/* Work Description + AI TBT */}
        <div>
          <div className="flex justify-between items-end mb-1.5">
            <label className="text-[10px] font-bold opacity-70 text-slate-800 dark:text-white">
              {t('workDescLbl')} *
            </label>
            <button
              type="button"
              onClick={generateTBT}
              disabled={isAnalyzing}
              className="text-[9px] font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 border border-indigo-500/30 px-2.5 py-1 rounded-lg backdrop-blur-sm transition-all hover:bg-indigo-500/30"
            >
              {isAnalyzing ? <Loader2 size={10} className="animate-spin inline mr-1" /> : <Sparkles size={10} className="inline mr-1" />}
              {t('generateTBTBtn')}
            </button>
          </div>
          <textarea
            name="workDescription"
            value={formData.workDescription}
            onChange={handleChange}
            placeholder="اكتب تفاصيل العمل والمعدات المستخدمة بدقة..."
            className="w-full bg-white/5 dark:bg-black/20 border border-black/20 dark:border-white/20 rounded-xl p-3.5 text-sm h-20 outline-none resize-none placeholder-slate-400 dark:placeholder-white/50 focus:ring-2 focus:ring-indigo-400/50 transition-all text-slate-800 dark:text-white"
            required
          />
        </div>

        {/* AI TBT Results */}
        {customTBT.length > 0 && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl animate-in fade-in">
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 block mb-2">{t('aiTBTGenerated')}</span>
            <ul className="space-y-1.5">
              {customTBT.map((item, i) => (
                <li key={i} className="text-[10px] font-medium flex gap-2 items-start text-slate-800 dark:text-white">
                  <CheckCircle size={12} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Dynamic Fields per Permit Type */}
        {selectedType.dynamicFields.length > 0 && (
          <div>
            <label className="block text-[10px] font-bold opacity-70 mb-2 text-slate-800 dark:text-white border-t border-black/10 dark:border-white/10 pt-3 mt-1">
              {selectedType.emoji} {t('requiredFields')}
            </label>
            <div className="space-y-3">
              {selectedType.dynamicFields.map(field => (
                <div key={field.id}>
                  <label className="block text-[10px] font-bold opacity-60 mb-1 text-slate-800 dark:text-white">
                    {field.label} {field.required && '*'}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={dynamicValues[field.id] || ''}
                      onChange={e => handleDynChange(field.id, e.target.value)}
                      required={field.required}
                      className="w-full bg-white/5 dark:bg-black/20 border border-black/20 dark:border-white/20 rounded-xl p-3 text-sm outline-none text-slate-800 dark:text-white [&>option]:text-black"
                    >
                      <option value="">-- Select / اختر --</option>
                      {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <GlassInput
                      type={field.type}
                      value={dynamicValues[field.id] || ''}
                      onChange={e => handleDynChange(field.id, e.target.value)}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Type-specific Checklist */}
        {selectedType.checklist.length > 0 && (
          <div>
            <label className="block text-[10px] font-bold opacity-70 mb-2 text-slate-800 dark:text-white">
              {t('checklistLbl')}
            </label>
            <div className="space-y-2">
              {selectedType.checklist.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                  <button
                    type="button"
                    onClick={() => setChecklist({ ...checklist, [idx]: !checklist[idx] })}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${checklist[idx] ? 'bg-emerald-500 border-emerald-500' : 'border-black/30 dark:border-white/30'}`}
                  >
                    {checklist[idx] && <CheckCircle size={12} className="text-white" />}
                  </button>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-white leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manpower */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">
              {t('workersCount')} *
            </label>
            <div className="relative">
              <Users size={16} className={`absolute top-3.5 ${isRtl ? 'left-3.5' : 'right-3.5'} opacity-40 text-slate-800 dark:text-white`} />
              <GlassInput type="number" name="workersCount" min="1" onChange={handleChange} required />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">
              {t('superCount')} *
            </label>
            <div className="relative">
              <UserCheck size={16} className={`absolute top-3.5 ${isRtl ? 'left-3.5' : 'right-3.5'} opacity-40 text-slate-800 dark:text-white`} />
              <GlassInput type="number" name="supervisorsCount" min="1" onChange={handleChange} required />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">
              {t('supervisor')} *
            </label>
            <div className="relative">
              <HardHat size={16} className={`absolute top-3.5 ${isRtl ? 'left-3.5' : 'right-3.5'} opacity-40 text-slate-800 dark:text-white`} />
              <GlassInput type="text" name="supervisorName" onChange={handleChange} required />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">
              {t('execEng')} *
            </label>
            <GlassInput type="text" name="engineerName" onChange={handleChange} required />
          </div>
        </div>

        {/* Approval Routing Info */}
        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">Approval Workflow / مسار الاعتماد</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {['You', '→ Supervisor', '→ Safety Eng.', '→ PM', '→ Approved'].map((step, i) => (
              <span key={i} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${i === 0 ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'bg-black/5 dark:bg-white/10 opacity-60 text-slate-800 dark:text-white'}`}>
                {step}
              </span>
            ))}
          </div>
        </div>

        <GlassButton primary type="submit" className="w-full py-4 mt-2">
          <ShieldAlert size={16} /> {t('issueBtn')}
        </GlassButton>
      </form>
    </ModalWrapper>
  );
}
