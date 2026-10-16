import React, { useState } from 'react';
import {
  Plus, Trash2, GripVertical, Type, List, CheckSquare, PenTool, MapPin, Camera,
  AlertTriangle, Save, Eye, ChevronDown, ChevronUp, Copy, FileText, X
} from 'lucide-react';
import { GlassCard, GlassButton, GlassInput } from '../components/ui/GlassComponents';

const BLOCK_TYPES = [
  { id: 'text',        icon: <Type size={16}/>,        labelKey: 'fbTypeText',       labelAr: 'حقل نصي',        labelUr: 'متنی فیلڈ' },
  { id: 'textarea',    icon: <FileText size={16}/>,    labelKey: 'fbTypeTextarea',   labelAr: 'نص طويل',        labelUr: 'طویل متن' },
  { id: 'number',      icon: <span className="font-black text-sm">123</span>, labelKey: 'fbTypeNumber', labelAr: 'رقم', labelUr: 'نمبر' },
  { id: 'dropdown',    icon: <List size={16}/>,         labelKey: 'fbTypeDropdown',   labelAr: 'قائمة منسدلة',   labelUr: 'ڈراپ ڈاؤن' },
  { id: 'checkbox',    icon: <CheckSquare size={16}/>,  labelKey: 'fbTypeCheckbox',   labelAr: 'خانة تحقق',     labelUr: 'چیک باکس' },
  { id: 'signature',   icon: <PenTool size={16}/>,      labelKey: 'fbTypeSignature',  labelAr: 'توقيع',          labelUr: 'دستخط' },
  { id: 'gps',         icon: <MapPin size={16}/>,       labelKey: 'fbTypeGPS',        labelAr: 'موقع GPS',       labelUr: 'GPS مقام' },
  { id: 'photo',       icon: <Camera size={16}/>,       labelKey: 'fbTypePhoto',      labelAr: 'رفع صورة',       labelUr: 'تصویر' },
  { id: 'risk_matrix', icon: <AlertTriangle size={16}/>,labelKey: 'fbTypeRiskMatrix', labelAr: 'مصفوفة الخطر',  labelUr: 'خطرے کی میٹرکس' },
];

const FORM_TEMPLATES = [
  { id: 'daily_inspection', nameAr: 'فحص يومي', nameEn: 'Daily Inspection', nameUr: 'روزانہ معائنہ', icon: '📋', blocks: [
    { id: 'b1', type: 'text',       labelAr: 'اسم المفتش',          labelEn: 'Inspector Name',    required: true,  options: [] },
    { id: 'b2', type: 'gps',        labelAr: 'الموقع الجغرافي',     labelEn: 'GPS Location',      required: true,  options: [] },
    { id: 'b3', type: 'checkbox',   labelAr: 'ارتداء مهمات الوقاية الشخصية', labelEn: 'PPE Worn', required: true,  options: [] },
    { id: 'b4', type: 'checkbox',   labelAr: 'منطقة العمل نظيفة',  labelEn: 'Work Area Clean',   required: false, options: [] },
    { id: 'b5', type: 'risk_matrix',labelAr: 'تقييم المخاطر',       labelEn: 'Risk Assessment',   required: true,  options: [] },
    { id: 'b6', type: 'textarea',   labelAr: 'ملاحظات',              labelEn: 'Notes',             required: false, options: [] },
    { id: 'b7', type: 'signature',  labelAr: 'توقيع المفتش',         labelEn: 'Inspector Signature', required: true, options: [] },
  ]},
  { id: 'toolbox_talk', nameAr: 'اجتماع أدوات السلامة TBT', nameEn: 'Toolbox Talk / TBT', nameUr: 'ٹول باکس ٹاک', icon: '🛠️', blocks: [
    { id: 'b1', type: 'text',      labelAr: 'موضوع التوعية',       labelEn: 'Safety Topic',        required: true,  options: [] },
    { id: 'b2', type: 'text',      labelAr: 'منعقد بواسطة',        labelEn: 'Conducted By',        required: true,  options: [] },
    { id: 'b3', type: 'number',    labelAr: 'عدد الحاضرين',        labelEn: 'Attendees Count',     required: true,  options: [] },
    { id: 'b4', type: 'textarea',  labelAr: 'النقاط الرئيسية',     labelEn: 'Key Safety Points',   required: true,  options: [] },
    { id: 'b5', type: 'photo',     labelAr: 'صورة تأكيد الحضور',  labelEn: 'Attendance Photo',    required: false, options: [] },
    { id: 'b6', type: 'signature', labelAr: 'توقيع المشرف',        labelEn: 'Conductor Signature', required: true,  options: [] },
  ]},
  { id: 'incident_report', nameAr: 'تقرير حادث', nameEn: 'Incident Report', nameUr: 'حادثے کی رپورٹ', icon: '⚠️', blocks: [
    { id: 'b1', type: 'text',        labelAr: 'تاريخ ووقت الحادث',    labelEn: 'Incident Date & Time',     required: true,  options: [] },
    { id: 'b2', type: 'gps',         labelAr: 'موقع الحادث',           labelEn: 'Incident Location',        required: true,  options: [] },
    { id: 'b3', type: 'dropdown',    labelAr: 'نوع الحادث',            labelEn: 'Incident Type',            required: true,  options: ['Near Miss', 'First Aid', 'Lost Time Injury', 'Fatality', 'Property Damage'] },
    { id: 'b4', type: 'textarea',    labelAr: 'وصف ما حدث',           labelEn: 'Incident Description',     required: true,  options: [] },
    { id: 'b5', type: 'risk_matrix', labelAr: 'تقييم الخطورة',         labelEn: 'Severity Assessment',      required: true,  options: [] },
    { id: 'b6', type: 'photo',       labelAr: 'صورة من موقع الحادث',  labelEn: 'Scene Photo',              required: false, options: [] },
    { id: 'b7', type: 'textarea',    labelAr: 'الإجراءات التصحيحية',  labelEn: 'Corrective Actions',       required: true,  options: [] },
    { id: 'b8', type: 'signature',   labelAr: 'توقيع المحقق',          labelEn: 'Investigator Signature',   required: true,  options: [] },
  ]},
];

const RISK_MATRIX = [
  { likelihood: 'Rare',     consequence: 'Minor',    level: 'Low',      color: 'emerald' },
  { likelihood: 'Unlikely', consequence: 'Moderate', level: 'Medium',   color: 'amber'   },
  { likelihood: 'Possible', consequence: 'Major',    level: 'High',     color: 'orange'  },
  { likelihood: 'Likely',   consequence: 'Critical', level: 'Critical', color: 'red'     },
];

function getBlockLabel(block, lang) {
  if (block.labelAr && block.labelEn) {
    if (lang === 'ar') return block.labelAr;
    if (lang === 'ur') return block.labelAr;
    return block.labelEn;
  }
  return block.label || block.type;
}

function getBlockTypeLabelAr(type) {
  return BLOCK_TYPES.find(b => b.id === type)?.labelAr || type;
}

function getBlockTypeLabel(type, lang) {
  const bt = BLOCK_TYPES.find(b => b.id === type);
  if (!bt) return type;
  if (lang === 'ar' || lang === 'ur') return bt.labelAr;
  return bt.labelKey.replace('fbType', '');
}

function BlockEditor({ block, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast, t, lang }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white/10 dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        <div className="text-slate-500 dark:text-white/40 cursor-grab"><GripVertical size={16} /></div>
        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          {BLOCK_TYPES.find(b => b.id === block.type)?.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{getBlockLabel(block, lang) || getBlockTypeLabel(block.type, lang)}</p>
          <p className="text-[9px] opacity-50 text-slate-600 dark:text-white">{getBlockTypeLabel(block.type, lang)}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {block.required && (
            <span className="text-[8px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full font-bold">
              {t('fbRequired')}
            </span>
          )}
          <button type="button" onClick={() => !isFirst && onMoveUp()} disabled={isFirst} className="p-1 rounded opacity-50 hover:opacity-100 disabled:opacity-20 text-slate-800 dark:text-white"><ChevronUp size={14}/></button>
          <button type="button" onClick={() => !isLast && onMoveDown()} disabled={isLast} className="p-1 rounded opacity-50 hover:opacity-100 disabled:opacity-20 text-slate-800 dark:text-white"><ChevronDown size={14}/></button>
          <button type="button" onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg hover:bg-white/20 text-slate-800 dark:text-white"><Eye size={14}/></button>
          <button type="button" onClick={() => onDelete(block.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-500"><Trash2 size={14}/></button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-black/10 dark:border-white/10 p-3 space-y-3 bg-black/5 dark:bg-white/5 animate-in fade-in">
          <div>
            <label className="text-[9px] font-bold opacity-60 text-slate-800 dark:text-white block mb-1">{t('fbFieldLabelLbl')}</label>
            <GlassInput
              type="text"
              value={block.label || (lang === 'ar' || lang === 'ur' ? block.labelAr : block.labelEn) || ''}
              onChange={e => onUpdate(block.id, { label: e.target.value, labelAr: e.target.value, labelEn: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onUpdate(block.id, { required: !block.required })}
              className={`text-[9px] font-bold px-3 py-1.5 rounded-lg border transition-all ${block.required ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30' : 'bg-white/5 text-slate-600 dark:text-white border-black/10 dark:border-white/10 opacity-60'}`}
            >
              {block.required ? t('fbRequired') : t('fbOptional')}
            </button>
          </div>
          {block.type === 'dropdown' && (
            <div>
              <label className="text-[9px] font-bold opacity-60 text-slate-800 dark:text-white block mb-1">{t('fbOptionsLbl')}</label>
              <textarea
                value={(block.options || []).join('\n')}
                onChange={e => onUpdate(block.id, { options: e.target.value.split('\n').filter(Boolean) })}
                className="w-full bg-white/5 dark:bg-black/20 border border-black/20 dark:border-white/20 rounded-xl p-3 text-xs h-20 outline-none resize-none text-slate-800 dark:text-white"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FormPreviewModal({ form, onClose, t, lang }) {
  const [values, setValues] = useState({});
  const setValue = (id, val) => setValues(prev => ({ ...prev, [id]: val }));

  const renderBlock = (block) => {
    const label = getBlockLabel(block, lang) || block.label || block.type;
    return (
      <div key={block.id} className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-800 dark:text-white">
          {label}
          {block.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {block.type === 'text' && <GlassInput type="text" value={values[block.id] || ''} onChange={e => setValue(block.id, e.target.value)} />}
        {block.type === 'number' && <GlassInput type="number" value={values[block.id] || ''} onChange={e => setValue(block.id, e.target.value)} />}
        {block.type === 'textarea' && (
          <textarea value={values[block.id] || ''} onChange={e => setValue(block.id, e.target.value)} className="w-full bg-white/40 dark:bg-black/30 border border-white/60 dark:border-white/10 rounded-xl p-3.5 text-sm h-24 outline-none resize-none text-slate-800 dark:text-white" />
        )}
        {block.type === 'dropdown' && (
          <select value={values[block.id] || ''} onChange={e => setValue(block.id, e.target.value)} className="w-full bg-white/5 dark:bg-black/20 border border-black/20 dark:border-white/20 rounded-xl p-3.5 text-sm text-slate-800 dark:text-white [&>option]:text-black">
            <option value="">-- {t('selectOption') || 'Select'} --</option>
            {(block.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        )}
        {block.type === 'checkbox' && (
          <button type="button" onClick={() => setValue(block.id, !values[block.id])} className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-all ${values[block.id] ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'bg-white/5 border-black/10 dark:border-white/10 text-slate-700 dark:text-white opacity-70'}`}>
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${values[block.id] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-400'}`}>
              {values[block.id] && <span className="text-white text-xs font-black">✓</span>}
            </div>
            <span className="text-xs font-bold">{values[block.id] ? t('fbConfirmed') : t('fbTapToConfirm')}</span>
          </button>
        )}
        {block.type === 'gps' && (
          <button type="button" onClick={() => { if(navigator.geolocation) navigator.geolocation.getCurrentPosition(pos => setValue(block.id, `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`)); }} className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white/5 text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <MapPin size={14} className={values[block.id] ? 'text-emerald-500 animate-pulse' : 'text-amber-500'} />
            {values[block.id] || t('fbTapForGPS')}
          </button>
        )}
        {block.type === 'photo' && (
          <label className="flex items-center gap-2 w-full p-3 rounded-xl border border-dashed border-black/20 dark:border-white/20 bg-white/5 cursor-pointer text-xs font-bold text-slate-800 dark:text-white">
            <Camera size={14} className="text-indigo-500" />
            {values[block.id] ? t('fbPhotoAttached') : t('fbUploadPhoto')}
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files[0]; if(f){ const r = new FileReader(); r.onloadend = () => setValue(block.id, r.result); r.readAsDataURL(f); } }} />
          </label>
        )}
        {block.type === 'signature' && (
          <div className={`w-full h-16 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${values[block.id] ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-black/20 dark:border-white/20 bg-white/5'}`} onClick={() => { const name = prompt(t('fbTapToSign') || 'Enter name to sign:'); if(name) setValue(block.id, name); }}>
            <span className="text-xs font-bold opacity-50 text-slate-800 dark:text-white">
              {values[block.id] ? `✍️ ${t('fbSignedBy')} ${values[block.id]}` : `✍️ ${t('fbTapToSign')}`}
            </span>
          </div>
        )}
        {block.type === 'risk_matrix' && (
          <div className="grid grid-cols-2 gap-2">
            {RISK_MATRIX.map(rm => (
              <button key={rm.level} type="button" onClick={() => setValue(block.id, rm.level)} className={`p-2.5 rounded-xl border text-[9px] font-bold text-start transition-all ${values[block.id] === rm.level ? `bg-${rm.color}-500/20 border-${rm.color}-500/50 text-${rm.color}-700 dark:text-${rm.color}-300` : 'bg-white/5 border-black/10 dark:border-white/10 opacity-60 hover:opacity-100 text-slate-800 dark:text-white'}`}>
                <div className="font-black">{rm.level}</div>
                <div className="opacity-60">{rm.likelihood}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xl z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white/60 dark:bg-black/30 w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl border border-black/10 dark:border-white/10 max-h-[90vh] overflow-y-auto custom-scrollbar backdrop-blur-2xl animate-in slide-in-from-bottom-10 duration-300">
        <div className="flex justify-between items-center mb-6 border-b border-black/10 dark:border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white">{form.name}</h2>
            <p className="text-[10px] opacity-50 mt-0.5">{form.blocks?.length || 0} {t('fbFields')}</p>
          </div>
          <button onClick={onClose} className="bg-black/5 dark:bg-white/10 p-2.5 rounded-full text-slate-800 dark:text-white"><X size={18}/></button>
        </div>
        <div className="space-y-4">
          {(form.blocks || []).map(block => renderBlock(block))}
        </div>
        <GlassButton primary className="w-full py-4 mt-6" onClick={onClose}>{t('fbSubmitBtn')}</GlassButton>
      </div>
    </div>
  );
}

export function FormBuilderPage({ t, isRtl, lang, user }) {
  const currentLang = lang || (isRtl ? 'ar' : 'en');
  const [forms, setForms] = useState(() => {
    try {
      const stored = localStorage.getItem('hse_custom_forms');
      return JSON.parse(stored || '[]');
    } catch (err) {
      console.warn('Failed to parse custom forms from localStorage:', err);
      return [];
    }
  });
  const [activeTab, setActiveTab] = useState('builder');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('inspection');
  const [blocks, setBlocks] = useState([]);
  const [previewForm, setPreviewForm] = useState(null);

  const saveForms = (newForms) => {
    setForms(newForms);
    localStorage.setItem('hse_custom_forms', JSON.stringify(newForms));
  };

  const addBlock = (typeId) => {
    const blockType = BLOCK_TYPES.find(b => b.id === typeId);
    const newBlock = {
      id: `block-${Date.now()}`,
      type: typeId,
      label: blockType?.labelAr || typeId,
      labelAr: blockType?.labelAr || typeId,
      labelEn: typeId,
      required: false,
      options: [],
    };
    setBlocks(prev => [...prev, newBlock]);
  };

  const updateBlock = (id, updates) => setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  const deleteBlock = (id) => setBlocks(prev => prev.filter(b => b.id !== id));
  const moveBlock = (id, dir) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (dir === 'up' && idx > 0) { const arr = [...prev]; [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]]; return arr; }
      if (dir === 'down' && idx < prev.length - 1) { const arr = [...prev]; [arr[idx], arr[idx+1]] = [arr[idx+1], arr[idx]]; return arr; }
      return prev;
    });
  };

  const saveForm = () => {
    if (!formName.trim()) return alert(t('fbFormNameLbl').replace(' *', '') + '!');
    if (blocks.length === 0) return alert(t('fbAddFieldsLbl'));
    const newForm = {
      id: `form-${Date.now()}`,
      name: formName,
      category: formCategory,
      blocks: [...blocks],
      createdBy: user?.name || 'Admin',
      createdAt: new Date().toLocaleDateString(),
      submissions: 0,
    };
    saveForms([newForm, ...forms]);
    setFormName('');
    setBlocks([]);
    setActiveTab('library');
  };

  const loadTemplate = (template) => {
    const name = currentLang === 'ar' || currentLang === 'ur' ? template.nameAr : template.nameEn;
    setFormName(name);
    setBlocks(template.blocks.map(b => ({
      ...b,
      id: `block-${Date.now()}-${Math.random()}`,
      label: currentLang === 'ar' || currentLang === 'ur' ? b.labelAr : b.labelEn,
    })));
    setActiveTab('builder');
  };

  const deleteForm = (id) => {
    if (confirm(t('fbDeleteConfirm'))) saveForms(forms.filter(f => f.id !== id));
  };

  const getTemplateName = (tpl) => currentLang === 'ar' || currentLang === 'ur' ? tpl.nameAr : tpl.nameEn;

  const TABS = [
    { id: 'builder',   icon: '🔨', labelKey: 'fbBuilderTab' },
    { id: 'templates', icon: '📋', labelKey: 'fbTemplatesTab' },
    { id: 'library',   icon: '📂', labelKey: 'fbLibraryTab' },
  ];

  return (
    <div className={`max-w-xl mx-auto space-y-5 animate-in slide-in-from-${isRtl ? 'right' : 'left'}-8 duration-300`}>
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white">{t('formBuilder')}</h2>
          <p className="text-xs font-bold opacity-60 mt-1 text-slate-700 dark:text-white">{t('fbPageSub')}</p>
        </div>
      </div>

      <div className="flex bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/20 p-1 rounded-2xl shadow-sm">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 text-[10px] font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 ${activeTab === tab.id ? 'bg-white/20 shadow-md text-slate-800 dark:text-white' : 'opacity-60 hover:opacity-100 text-slate-800 dark:text-white'}`}>
            <span>{tab.icon}</span>
            <span>{t(tab.labelKey)}{tab.id === 'library' ? ` (${forms.length})` : ''}</span>
          </button>
        ))}
      </div>

      {activeTab === 'builder' && (
        <div className="space-y-4 animate-in fade-in">
          <GlassCard className="p-4 space-y-4">
            <div>
              <label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">{t('fbFormNameLbl')}</label>
              <GlassInput type="text" value={formName} onChange={e => setFormName(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">{t('fbCategoryLbl')}</label>
              <div className="flex gap-2 flex-wrap">
                {['inspection', 'toolbox', 'incident', 'checklist', 'audit'].map(cat => (
                  <button key={cat} type="button" onClick={() => setFormCategory(cat)} className={`text-[9px] font-bold px-3 py-1.5 rounded-xl border transition-all ${formCategory === cat ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-700 dark:text-indigo-300' : 'bg-white/5 border-black/10 dark:border-white/10 opacity-60 hover:opacity-100 text-slate-800 dark:text-white'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <p className="text-[10px] font-bold opacity-60 mb-3 text-slate-800 dark:text-white">{t('fbAddFieldsLbl')}</p>
            <div className="grid grid-cols-3 gap-2">
              {BLOCK_TYPES.map(bt => (
                <button key={bt.id} type="button" onClick={() => addBlock(bt.id)} className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white/10 dark:bg-black/20 border border-black/10 dark:border-white/10 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all text-slate-800 dark:text-white group">
                  <div className="text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">{bt.icon}</div>
                  <span className="text-[8px] font-bold text-center leading-tight">{currentLang === 'ar' || currentLang === 'ur' ? bt.labelAr : bt.labelUr && currentLang === 'ur' ? bt.labelUr : bt.labelAr}</span>
                </button>
              ))}
            </div>
          </GlassCard>

          {blocks.length > 0 ? (
            <GlassCard className="p-4 space-y-3">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[10px] font-bold opacity-60 text-slate-800 dark:text-white">{blocks.length} {t('fbFieldsAdded')}</p>
                <button type="button" onClick={() => setBlocks([])} className="text-[9px] text-red-500 font-bold hover:opacity-70">{t('fbClearAllBtn')}</button>
              </div>
              {blocks.map((block, idx) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  onUpdate={updateBlock}
                  onDelete={deleteBlock}
                  onMoveUp={() => moveBlock(block.id, 'up')}
                  onMoveDown={() => moveBlock(block.id, 'down')}
                  isFirst={idx === 0}
                  isLast={idx === blocks.length - 1}
                  t={t}
                  lang={currentLang}
                />
              ))}
              <div className="flex gap-3 mt-4">
                <GlassButton onClick={() => setPreviewForm({ name: formName || t('fbPreviewBtn'), blocks })} className="flex-1 py-3 text-xs">
                  <Eye size={14}/> {t('fbPreviewBtn')}
                </GlassButton>
                <GlassButton primary onClick={saveForm} className="flex-1 py-3 text-xs">
                  <Save size={14}/> {t('fbSaveBtn')}
                </GlassButton>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-8 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm font-bold opacity-60 text-slate-800 dark:text-white">{t('fbAddHint')}</p>
            </GlassCard>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-4 animate-in fade-in">
          {FORM_TEMPLATES.map(tpl => (
            <GlassCard key={tpl.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tpl.icon}</span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">{getTemplateName(tpl)}</h3>
                    <p className="text-[9px] opacity-50 text-slate-600 dark:text-white">{tpl.blocks.length} {t('fbFields')}</p>
                  </div>
                </div>
                <GlassButton primary onClick={() => loadTemplate(tpl)} className="px-4 py-2 text-[10px]">
                  <Copy size={12}/> {t('fbUseTemplate')}
                </GlassButton>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tpl.blocks.slice(0, 4).map((b, i) => (
                  <span key={i} className="text-[8px] bg-white/10 dark:bg-black/20 border border-black/10 dark:border-white/10 px-2 py-0.5 rounded-full font-bold text-slate-700 dark:text-white">
                    {getBlockTypeLabelAr(b.type)}
                  </span>
                ))}
                {tpl.blocks.length > 4 && <span className="text-[8px] bg-white/10 dark:bg-black/20 border border-black/10 dark:border-white/10 px-2 py-0.5 rounded-full font-bold opacity-50 text-slate-700 dark:text-white">+{tpl.blocks.length - 4}</span>}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {activeTab === 'library' && (
        <div className="space-y-4 animate-in fade-in">
          {forms.length === 0 ? (
            <GlassCard className="p-10 text-center">
              <div className="text-4xl mb-3">📂</div>
              <p className="text-sm font-bold opacity-60 text-slate-800 dark:text-white">{t('fbNoFormsTitle')}</p>
              <p className="text-xs opacity-40 mt-1 text-slate-600 dark:text-white">{t('fbNoFormsSub')}</p>
              <GlassButton primary onClick={() => setActiveTab('templates')} className="mt-5 px-6 py-2.5 text-xs mx-auto">
                {t('fbTemplatesTab')}
              </GlassButton>
            </GlassCard>
          ) : (
            forms.map(form => (
              <GlassCard key={form.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 mr-3">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate">{form.name}</h3>
                    <p className="text-[9px] opacity-50 mt-0.5 text-slate-600 dark:text-white">
                      {form.blocks?.length || 0} {t('fbFields')} • {form.category} • {form.createdAt}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <GlassButton onClick={() => setPreviewForm(form)} className="px-3 py-2 text-[10px]">
                      <Eye size={12}/> {t('fbPreviewBtn')}
                    </GlassButton>
                    <button onClick={() => deleteForm(form.id)} className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {previewForm && <FormPreviewModal form={previewForm} onClose={() => setPreviewForm(null)} t={t} lang={currentLang} />}
    </div>
  );
}
