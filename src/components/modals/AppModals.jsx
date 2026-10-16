import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, X, Camera, Image as ImageIcon, Loader2, QrCode, Sparkles, Users, UserCheck, HardHat, Send, MessageSquare, MapPin, Zap, ListChecks, CheckCircle } from 'lucide-react';
import { GlassInput, GlassButton, ModalWrapper } from '../ui/GlassComponents';
import { simulateQRScan } from '../../utils/helpers';
import { fetchGemini } from '../../services/ai';

export const CameraView = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let currentStream = null;
    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          if (mounted) setError('الكاميرا غير مدعومة أو غير مصرح بها في هذا المتصفح.');
          return;
        }
        currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (mounted) {
            streamRef.current = currentStream;
            if (videoRef.current) videoRef.current.srcObject = currentStream;
        } else {
            currentStream.getTracks().forEach(t => t.stop());
        }
      } catch (err) {
        console.warn("Environment camera not found, trying default camera...", err);
        try {
          currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (mounted) {
              streamRef.current = currentStream;
              if (videoRef.current) videoRef.current.srcObject = currentStream;
          } else {
              currentStream.getTracks().forEach(t => t.stop());
          }
        } catch (fallbackErr) {
          if (mounted) setError('تعذر الوصول للكاميرا، الرجاء التحقق من الصلاحيات واستخدام متصفح آمن.');
        }
      }
    };
    startCamera();
    
    return () => { 
      mounted = false;
      if (currentStream) { currentStream.getTracks().forEach(track => track.stop()); }
      if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); }
    };
  }, []);

  const takePhoto = () => {
    if (!isReady) return;
    try {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const context = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth || 640;
        canvasRef.current.height = videoRef.current.videoHeight || 480;
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        onCapture(canvasRef.current.toDataURL('image/jpeg', 0.8));
      }
    } catch (err) {
      console.error("Camera capture error:", err);
      setError("حدث خطأ أثناء التقاط الصورة.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[200] flex flex-col items-center justify-center">
      {error ? (
        <div className="text-white text-center p-6"><AlertTriangle size={48} className="mx-auto mb-4 text-red-400"/><p>{error}</p><button onClick={onClose} className="mt-6 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white px-6 py-2 rounded-xl font-bold transition-all">رجوع</button></div>
      ) : (
        <>
          <video ref={videoRef} onCanPlay={() => setIsReady(true)} autoPlay playsInline muted className="w-full h-full object-cover rounded-3xl overflow-hidden shadow-2xl bg-black"></video>
          <canvas ref={canvasRef} className="hidden"></canvas>
          <button onClick={onClose} className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 border border-white/20 text-white p-3 rounded-full backdrop-blur-md transition-all z-10"><X size={24}/></button>
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-6 items-center">
            <button onClick={takePhoto} disabled={!isReady} className={`w-20 h-20 rounded-full border flex items-center justify-center transition-all ${isReady ? 'bg-white/20 hover:bg-white/30 backdrop-blur-xl border-white/50 active:scale-90 shadow-[0_0_40px_rgba(255,255,255,0.3)]' : 'bg-gray-500/50 border-gray-400/50 opacity-50 cursor-not-allowed'}`}>
              <div className={`w-14 h-14 rounded-full shadow-inner ${isReady ? 'bg-white' : 'bg-gray-300'}`}></div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export function NewPermitModal({ closeModal, addPermit, t, isRtl, user }) {
  const [formData, setFormData] = useState({ type: 'Hot Work / أعمال ساخنة', location: '', workersCount: '', supervisorsCount: '', supervisorName: '', engineerName: '', requesterName: user?.name || '', workDescription: '' });
  const [customTBT, setCustomTBT] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const generateTBT = async () => {
    if (!formData.workDescription) return alert('الرجاء كتابة تفاصيل وطبيعة العمل أولاً');
    setIsAnalyzing(true);
    const prompt = `أنت خبير سلامة مهنية (HSE). قم بتحليل طبيعة العمل التالية: "${formData.workDescription}". استخرج أهم 3 مخاطر محتملة و 3 إجراءات وقائية كرسالة (Toolbox Talk) سريعة للعمال. يجب أن يكون الرد عبارة عن مصفوفة JSON تحتوي على 3 نصوص فقط. مثال: ["1. خطر كذا: يجب عمل كذا", "2. ...", "3. ..."]. الرد يجب أن يكون JSON Array فقط بدون أي نصوص إضافية أو علامات ماركداون.`;
    try {
      const response = await fetchGemini(prompt, true);
      const cleanedRes = response.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanedRes);
      if (Array.isArray(data)) setCustomTBT(data);
    } catch (e) {
      alert('حدث خطأ في توليد التعليمات، تأكد من جودة الوصف وجرب مرة أخرى.');
    }
    setIsAnalyzing(false);
  };

  const handleSubmit = (e) => { 
    e.preventDefault(); 
    addPermit({ id: `PRM-${Math.floor(Math.random()*1000)}`, ...formData, customTBT, status: 'statusActive', validUntil: '20:00', risk: 'riskHigh', pmNote: '' }); 
    closeModal(); 
  };
  
  return (
    <ModalWrapper onClose={closeModal} title={t('newPermitTitle')} subTitle={t('newPermitSub')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2"><label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">{t('permitType')}</label>
               <select name="type" onChange={handleChange} className="w-full bg-white/5 dark:bg-black/20 border border-black/20 dark:border-white/20 rounded-xl p-3.5 text-sm outline-none cursor-pointer text-slate-800 dark:text-white [&>option]:text-black"><option>Hot Work / أعمال ساخنة</option><option>Cold Work / أعمال باردة</option><option>Confined Space / أماكن مغلقة</option><option>Lifting / أعمال رفع</option><option>Electrical Work / أعمال كهربائية</option></select>
            </div>
            <div className="col-span-1 md:col-span-2"><label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">{t('permitLoc')} *</label><GlassInput type="text" name="location" onChange={handleChange} required /></div>
            
            <div className="col-span-1 md:col-span-2">
               <div className="flex justify-between items-end mb-1.5">
                 <label className="text-[10px] font-bold opacity-70 text-slate-800 dark:text-white">{t('workDescLbl')} *</label>
                 <button type="button" onClick={generateTBT} disabled={isAnalyzing} className="text-[9px] font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 border border-indigo-500/30 px-2.5 py-1 rounded-lg backdrop-blur-sm transition-all hover:bg-indigo-500/30">
                   {isAnalyzing ? <Loader2 size={10} className="animate-spin inline mr-1" /> : <Sparkles size={10} className="inline mr-1"/>} توليد TBT ذكي ✨
                 </button>
               </div>
               <textarea name="workDescription" value={formData.workDescription} onChange={handleChange} placeholder="اكتب تفاصيل العمل والمعدات المستخدمة بدقة..." className="w-full bg-white/5 dark:bg-black/20 border border-black/20 dark:border-white/20 rounded-xl p-3.5 text-sm h-20 outline-none resize-none placeholder-slate-400 dark:placeholder-white/50 focus:bg-white/10 dark:focus:bg-white/10 focus:ring-2 focus:ring-indigo-400/50 transition-all text-slate-800 dark:text-white" required></textarea>
            </div>
            
            {customTBT.length > 0 && (
               <div className="col-span-1 md:col-span-2 bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl mt-1 animate-in fade-in">
                 <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 block mb-2">تعليمات TBT المقترحة:</span>
                 <ul className="space-y-1.5">
                   {customTBT.map((item, i) => <li key={i} className="text-[10px] font-medium flex gap-2 items-start text-slate-800 dark:text-white"><CheckCircle size={12} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5"/> <span>{item}</span></li>)}
                 </ul>
               </div>
            )}

            <div><label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">{t('workersCount')} *</label><div className="relative"><Users size={16} className={`absolute top-3.5 ${isRtl ? 'left-3.5' : 'right-3.5'} opacity-40 text-slate-800 dark:text-white`}/><GlassInput type="number" name="workersCount" min="1" onChange={handleChange} required /></div></div>
            <div><label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">{t('superCount')} *</label><div className="relative"><UserCheck size={16} className={`absolute top-3.5 ${isRtl ? 'left-3.5' : 'right-3.5'} opacity-40 text-slate-800 dark:text-white`}/><GlassInput type="number" name="supervisorsCount" min="1" onChange={handleChange} required /></div></div>
            <div><label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">{t('supervisor')} *</label><div className="relative"><HardHat size={16} className={`absolute top-3.5 ${isRtl ? 'left-3.5' : 'right-3.5'} opacity-40 text-slate-800 dark:text-white`}/><GlassInput type="text" name="supervisorName" onChange={handleChange} required /></div></div>
            <div><label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">{t('execEng')} *</label><GlassInput type="text" name="engineerName" onChange={handleChange} required /></div>
          </div>
          <GlassButton primary type="submit" className="w-full py-4 mt-6">{t('issueBtn')}</GlassButton>
        </form>
    </ModalWrapper>
  );
}

export function NewRequestModal({ closeModal, addReq, t }) {
  const [desc, setDesc] = useState('');
  const handleSubmit = (e) => { e.preventDefault(); addReq({ id: `REQ-${Math.floor(Math.random()*1000)}`, text: desc, status: 'pendingReq', reply: '' }); closeModal(); };
  return (
    <ModalWrapper onClose={closeModal} title={<span className="flex items-center gap-2"><MessageSquare size={20}/> {t('newReqTitle')}</span>}>
        <form onSubmit={handleSubmit} className="space-y-5"><textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t('reqDesc')} className="w-full bg-white/5 dark:bg-black/20 border border-black/20 dark:border-white/20 rounded-2xl p-4 text-sm h-32 outline-none resize-none placeholder-slate-400 dark:placeholder-white/50 focus:bg-white/10 dark:focus:bg-white/10 focus:ring-2 focus:ring-indigo-400/50 transition-all text-slate-800 dark:text-white" required></textarea><GlassButton primary type="submit" className="w-full py-4"><Send size={16}/> {t('sendReq')}</GlassButton></form>
    </ModalWrapper>
  );
}

export function NewReportModal({ closeModal, addReport, t, lang, isRtl }) {
  const [desc, setDesc] = useState(''); const [workerId, setWorkerId] = useState(''); const [reportType, setReportType] = useState('Violation'); const [photo, setPhoto] = useState(null); const [isAnalyzing, setIsAnalyzing] = useState(false); const [gpsLoc, setGpsLoc] = useState('جاري التحديد...'); const [isGpsReady, setIsGpsReady] = useState(false); const [isScanning, setIsScanning] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => { if (navigator.geolocation) { navigator.geolocation.getCurrentPosition((pos) => { setGpsLoc(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`); setIsGpsReady(true); }, () => { setGpsLoc('تعذر GPS'); }); } }, []);
  const analyzeViolation = async () => { if (!desc) return; setIsAnalyzing(true); const prompt = `Analyze this safety issue: "${desc}". Return ONLY JSON with {"improvedDesc": "Better wording", "advice": "Quick fix"}.`; try { const response = await fetchGemini(prompt, true); const data = JSON.parse(response); if (data.improvedDesc) setDesc(data.improvedDesc); } catch (e) {} setIsAnalyzing(false); };
  const handleQRClick = () => { setIsScanning(true); simulateQRScan((id) => { setWorkerId(id.toString()); setIsScanning(false); }); };
  const processFile = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setPhoto(reader.result); reader.readAsDataURL(file); } };
  const handleSubmit = (e) => { e.preventDefault(); addReport({ id: `REP-${Math.floor(Math.random()*1000)}`, title: desc, severity: reportType === 'Near Miss' ? 'riskMedium' : 'riskHigh', location: gpsLoc, time: 'Now', status: 'statusOpen', photoBase64: photo, workerId: workerId, reportType: reportType, pmNote: '' }); closeModal(); };
  
  return (
    <>
    <ModalWrapper onClose={closeModal} title={t('newReportTitle')} subTitle={t('newReportSub')}>
        <div className="mb-5 bg-white/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-3.5 rounded-xl flex items-center justify-between backdrop-blur-sm"><div className="flex items-center gap-2 text-slate-800 dark:text-white"><MapPin size={16} className={isGpsReady ? "text-green-500 dark:text-green-400 animate-pulse" : "text-amber-500 dark:text-amber-400"} /><span className="text-[10px] font-bold opacity-70">موقع (GPS):</span></div><span className={`text-[10px] font-bold ${isGpsReady ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`} dir="ltr">{gpsLoc}</span></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">{t('reportTypeLbl')}</label>
             <div className="flex bg-white/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-1 rounded-xl backdrop-blur-sm">
                <button type="button" onClick={()=>setReportType('Violation')} className={`flex-1 text-xs font-bold py-2.5 rounded-lg transition-all ${reportType === 'Violation' ? 'bg-red-500/80 text-white shadow-md' : 'opacity-60 hover:opacity-100 text-slate-800 dark:text-white'}`}>{t('violation')}</button>
                <button type="button" onClick={()=>setReportType('Near Miss')} className={`flex-1 text-xs font-bold py-2.5 rounded-lg transition-all ${reportType === 'Near Miss' ? 'bg-amber-500/80 text-white shadow-md' : 'opacity-60 hover:opacity-100 text-slate-800 dark:text-white'}`}>{t('nearMiss')}</button>
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2 sm:col-span-1 relative"><label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">{t('workerId')}</label><div className="flex gap-2"><GlassInput type="text" value={workerId} onChange={(e) => setWorkerId(e.target.value)} /><GlassButton type="button" onClick={handleQRClick} disabled={isScanning} className="px-4 border-dashed">{isScanning ? <Loader2 size={16} className="animate-spin"/> : <QrCode size={16}/>}</GlassButton></div></div>
             <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">{t('uploadPhoto')}</label>
                {photo ? (
                  <div className="relative w-full h-[46px] rounded-xl overflow-hidden border border-green-500 dark:border-green-400 shadow-sm"><img src={photo} className="w-full h-full object-cover" alt="Captured" /><button type="button" onClick={()=>setPhoto(null)} className="absolute top-1 right-1 bg-red-500/80 backdrop-blur-md text-white rounded-full p-1"><X size={12}/></button></div>
                ) : (
                  <div className="flex gap-2 w-full h-[46px]">
                    <GlassButton type="button" onClick={() => setShowCamera(true)} className="flex-1 flex-col gap-0.5 border-dashed"><Camera size={14} /><span className="text-[8px]">{t('cameraBtn')}</span></GlassButton>
                    <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-xl transition-all cursor-pointer backdrop-blur-md font-bold text-slate-800 dark:text-white"><ImageIcon size={14} className="mb-0.5"/><span className="text-[8px]">{t('galleryBtn')}</span><input type="file" accept="image/*" className="hidden" onChange={processFile} /></label>
                  </div>
                )}
             </div>
          </div>
          <div><div className="flex justify-between items-end mb-1.5"><label className="text-[10px] font-bold opacity-70 text-slate-800 dark:text-white">{t('descLbl')} *</label><button type="button" onClick={analyzeViolation} disabled={isAnalyzing} className="text-[9px] font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 border border-indigo-500/30 px-2.5 py-1 rounded-lg backdrop-blur-sm transition-all hover:bg-indigo-500/30">{isAnalyzing ? <Loader2 size={10} className="animate-spin inline mr-1" /> : <Sparkles size={10} className="inline mr-1"/>} {t('aiAnalyze')}</button></div><textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full bg-white/5 dark:bg-black/20 border border-black/20 dark:border-white/20 rounded-xl p-3.5 text-sm h-28 outline-none resize-none placeholder-slate-400 dark:placeholder-white/50 focus:bg-white/10 dark:focus:bg-white/10 focus:ring-2 focus:ring-indigo-400/50 transition-all text-slate-800 dark:text-white" required></textarea></div>
          <GlassButton type="submit" danger={reportType !== 'Near Miss'} className={`w-full py-4 mt-2 ${reportType === 'Near Miss' ? 'bg-amber-500/80 border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:bg-amber-500 text-white' : ''}`}>{t('submitReport')}</GlassButton>
        </form>
    </ModalWrapper>
    {showCamera && <CameraView onCapture={(data) => { setPhoto(data); setShowCamera(false); }} onClose={() => setShowCamera(false)} />}
    </>
  );
}

export function NewEquipmentModal({ closeModal, addEquipment, t, isRtl, initialTab = 'heavy' }) {
  const heavyTypes = [
    'Mobile Crane / ونش متحرك', 'Tower Crane / ونش برجي', 'Scissor Lift / سيزر ليفت',
    'Excavator / حفار', 'Loader / لودر', 'Bulldozer / بلدوزر',
    'Forklift / رافعة شوكية', 'Concrete Pump / مضخة خرسانة', 'Dump Truck / سيارة قلاب'
  ];
  const electricalTypes = [
    'Electrical Panel / لوحة توزيع كهرباء', 'Generator / مولد كهربائي', 'Power Tool / معدة كهربائية يدوية', 'Welding Machine / ماكينة لحام'
  ];
  
  const availableTypes = initialTab === 'electrical' ? electricalTypes : heavyTypes;

  const [eqName, setEqName] = useState(''); 
  const [eqType, setEqType] = useState(availableTypes[0]); 
  const [operatorId, setOperatorId] = useState(''); 
  const [eqPhoto, setEqPhoto] = useState(null); const [serialPhoto, setSerialPhoto] = useState(null); const [isScanning, setIsScanning] = useState(false);
  const [activeCamera, setActiveCamera] = useState(null);

  const handleQRClick = () => { setIsScanning(true); simulateQRScan((id) => { setOperatorId(id.toString()); setIsScanning(false); }); };
  const handleSubmit = (e) => { e.preventDefault(); addEquipment({ id: `EQ-${Math.floor(Math.random()*10000)}`, name: eqName, type: eqType, category: initialTab, status: 'statusValid', operatorId: operatorId, lastInspected: 'الآن', eqPhotoBase64: eqPhoto, serialPhotoBase64: serialPhoto }); closeModal(); };
  const processFile = (e, setter) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setter(reader.result); reader.readAsDataURL(file); } };

  return (
    <>
    <ModalWrapper onClose={closeModal} title={t('newEqTitle')} subTitle={t('newEqSub')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">{t('eqNameLbl')} *</label><GlassInput type="text" value={eqName} onChange={(e) => setEqName(e.target.value)} required /></div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">{t('eqTypeLbl')}</label>
                <select value={eqType} onChange={(e) => setEqType(e.target.value)} className="w-full bg-white/5 dark:bg-black/20 border border-black/20 dark:border-white/20 rounded-xl p-3.5 text-sm outline-none cursor-pointer text-slate-800 dark:text-white [&>option]:text-black">
                   {availableTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
             </div>
             <div><label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">{t('operatorId')} *</label><div className="flex gap-2"><GlassInput type="text" value={operatorId} onChange={(e) => setOperatorId(e.target.value)} required /><GlassButton type="button" onClick={handleQRClick} disabled={isScanning} className="px-4 border-dashed">{isScanning ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}</GlassButton></div></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">{t('eqPhoto')}</label>
                {eqPhoto ? (
                  <div className="relative w-full h-[60px] rounded-xl overflow-hidden border border-emerald-500 dark:border-emerald-400"><img src={eqPhoto} className="w-full h-full object-cover" /><button type="button" onClick={()=>setEqPhoto(null)} className="absolute top-1 right-1 bg-red-500/80 backdrop-blur-md text-white rounded-full p-1"><X size={12}/></button></div>
                ) : (
                  <div className="flex gap-1.5 w-full h-[60px]">
                    <GlassButton type="button" onClick={() => setActiveCamera('eq')} className="flex-1 flex-col gap-0.5 border-dashed"><Camera size={14} /><span className="text-[8px]">{t('cameraBtn')}</span></GlassButton>
                    <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-xl cursor-pointer backdrop-blur-md font-bold transition-all text-slate-800 dark:text-white"><ImageIcon size={14} className="mb-0.5"/><span className="text-[8px]">{t('galleryBtn')}</span><input type="file" accept="image/*" className="hidden" onChange={(e) => processFile(e, setEqPhoto)} /></label>
                  </div>
                )}
             </div>
             <div>
                <label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">{t('serialPhoto')}</label>
                {serialPhoto ? (
                  <div className="relative w-full h-[60px] rounded-xl overflow-hidden border border-emerald-500 dark:border-emerald-400"><img src={serialPhoto} className="w-full h-full object-cover" /><button type="button" onClick={()=>setSerialPhoto(null)} className="absolute top-1 right-1 bg-red-500/80 backdrop-blur-md text-white rounded-full p-1"><X size={12}/></button></div>
                ) : (
                  <div className="flex gap-1.5 w-full h-[60px]">
                    <GlassButton type="button" onClick={() => setActiveCamera('serial')} className="flex-1 flex-col gap-0.5 border-dashed"><Camera size={14} /><span className="text-[8px]">{t('cameraBtn')}</span></GlassButton>
                    <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-xl cursor-pointer backdrop-blur-md font-bold transition-all text-slate-800 dark:text-white"><ImageIcon size={14} className="mb-0.5"/><span className="text-[8px]">{t('galleryBtn')}</span><input type="file" accept="image/*" className="hidden" onChange={(e) => processFile(e, setSerialPhoto)} /></label>
                  </div>
                )}
             </div>
          </div>
          <GlassButton success type="submit" className="w-full py-4 mt-6">{t('registerEq')}</GlassButton>
        </form>
    </ModalWrapper>
    {activeCamera && (
      <CameraView onCapture={(data) => { if(activeCamera === 'eq') setEqPhoto(data); else setSerialPhoto(data); setActiveCamera(null); }} onClose={() => setActiveCamera(null)} />
    )}
    </>
  );
}

export function ChecklistModal({ eq, closeModal, onSave, t, isRtl, user }) {
  const [checks, setChecks] = useState({ item1: true, item2: true, item3: true });
  const [inspectorName, setInspectorName] = useState(user?.name || '');
  
  const isElectrical = eq?.type?.includes('كهرباء') || eq?.type?.includes('Generator') || eq?.type?.includes('Panel') || eq?.type?.includes('Tool') || eq?.type?.includes('Welding');
  
  const checklistItems = isElectrical ? [
     { id: 'item1', label: 'التوصيلات والكابلات سليمة ولا يوجد أي أسلاك عارية أو تالفة؟' },
     { id: 'item2', label: 'تم التحقق من توصيل نظام التأريض (Earthing) بكفاءة؟' },
     { id: 'item3', label: 'اللوحة مغلقة وقواطع التسريب الأرضي (ELCB/GFCI) تعمل بشكل صحيح؟' }
  ] : [
     { id: 'item1', label: t('chkBrakes') },
     { id: 'item2', label: t('chkLeaks') },
     { id: 'item3', label: t('chkSafety') }
  ];

  const handleToggle = (key) => setChecks({ ...checks, [key]: !checks[key] });
  
  const handleSubmit = () => { 
    if(!inspectorName.trim()) return alert("برجاء كتابة اسم المفتش / الفاحص قبل الاعتماد.");
    onSave(eq.id, (checks.item1 && checks.item2 && checks.item3) ? 'statusValid' : 'statusMaint', inspectorName); 
  };
  
  return (
    <ModalWrapper onClose={closeModal} title={<span className="flex items-center gap-2"><ListChecks size={20} className="text-emerald-500 dark:text-emerald-400"/> {t('checklistTitle')}</span>} subTitle={`معدة: ${eq?.name} | النوع: ${isElectrical ? 'فحص كهربائي ⚡' : 'فحص ميكانيكي ⚙️'}`}>
          <div className="mb-4">
             <label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">{t('inspectorLbl')} *</label>
             <GlassInput type="text" value={inspectorName} onChange={(e) => setInspectorName(e.target.value)} placeholder="اكتب الاسم هنا..." required />
          </div>
          
          <div className="space-y-3 mb-8 mt-2">
             {checklistItems.map(item => (
               <div key={item.id} className="flex justify-between items-center p-4 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-md text-slate-800 dark:text-white"><span className="text-xs font-bold leading-relaxed w-3/4">{item.label}</span><button onClick={() => handleToggle(item.id)} className={`w-14 h-7 rounded-full relative transition-colors shadow-inner shrink-0 ${checks[item.id] ? 'bg-emerald-500' : 'bg-red-500/80'}`}><span className={`absolute top-1.5 ${isRtl ? (checks[item.id] ? 'left-1.5' : 'right-1.5') : (checks[item.id] ? 'right-1.5' : 'left-1.5')} w-4 h-4 bg-white rounded-full transition-all shadow-md`}></span></button></div>
             ))}
          </div>
          <GlassButton success onClick={handleSubmit} className="w-full py-4">{t('saveChecklist')}</GlassButton>
    </ModalWrapper>
  );
}

export function MaintenanceModal({ eq, closeModal, onSave, t, isRtl, user }) {
  const [details, setDetails] = useState('');
  const [photo, setPhoto] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [inspectorName, setInspectorName] = useState(user?.name || '');

  const processFile = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setPhoto(reader.result); reader.readAsDataURL(file); } };

  const handleSubmit = (e) => { 
    e.preventDefault();
    if(!inspectorName.trim()) return alert("برجاء كتابة اسم الفني للاعتماد.");
    onSave(eq.id, details, photo, inspectorName); 
  };
  
  return (
    <>
    <ModalWrapper onClose={closeModal} title={<span className="flex items-center gap-2"><Zap size={20} className="text-blue-500"/> {t('fixEqTitle')}</span>} subTitle={`معدة: ${eq?.name} | الكود: ${eq?.id}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
             <label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">اسم الفني / المسؤول *</label>
             <GlassInput type="text" value={inspectorName} onChange={(e) => setInspectorName(e.target.value)} required />
          </div>
          
          <div>
             <label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">{t('fixDetailsLbl')} *</label>
             <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="مثال: تم تغيير الكابل التالف وتوصيل تأريض جديد..." className="w-full bg-white/40 dark:bg-black/30 border border-white/60 dark:border-white/10 rounded-xl p-3.5 text-sm h-24 outline-none resize-none shadow-[inset_0_3px_6px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_3px_6px_rgba(0,0,0,0.3)] focus:ring-2 focus:ring-indigo-400/50 transition-all text-slate-800 dark:text-white font-bold" required></textarea>
          </div>

          <div>
             <label className="block text-[10px] font-bold opacity-70 mb-1.5 text-slate-800 dark:text-white">{t('fixPhotoLbl')}</label>
             {photo ? (
               <div className="relative w-full h-[80px] rounded-xl overflow-hidden border border-blue-500 dark:border-blue-400 shadow-sm"><img src={photo} className="w-full h-full object-cover" alt="Fixed" /><button type="button" onClick={()=>setPhoto(null)} className="absolute top-2 right-2 bg-red-500/80 backdrop-blur-md text-white rounded-full p-1.5 shadow-md"><X size={14}/></button></div>
             ) : (
               <div className="flex gap-2 w-full h-[60px]">
                 <GlassButton type="button" onClick={() => setShowCamera(true)} className="flex-1 flex-col gap-0.5 border-dashed"><Camera size={16} /><span className="text-[9px]">{t('cameraBtn')}</span></GlassButton>
                 <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-black/20 dark:border-white/20 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-xl transition-all cursor-pointer backdrop-blur-md font-bold text-slate-800 dark:text-white"><ImageIcon size={16} className="mb-0.5"/><span className="text-[9px]">{t('galleryBtn')}</span><input type="file" accept="image/*" className="hidden" onChange={processFile} /></label>
               </div>
             )}
          </div>
          <GlassButton primary type="submit" className="w-full py-4 mt-4 bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-300 hover:to-blue-500 border-blue-400 border-b-[4px] border-b-blue-800 shadow-[0_8px_20px_rgba(59,130,246,0.4)]">{t('markAsFixed')}</GlassButton>
        </form>
    </ModalWrapper>
    {showCamera && <CameraView onCapture={(data) => { setPhoto(data); setShowCamera(false); }} onClose={() => setShowCamera(false)} />}
    </>
  );
}
