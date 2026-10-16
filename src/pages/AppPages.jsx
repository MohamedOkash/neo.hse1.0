import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import {
  Sun, Moon, Droplets, ShieldAlert, Loader2, Bell, MapPin, CheckCircle, Palette, Wind, FileText, AlertTriangle, Activity, User, Download, Printer, Plus, MessageSquare, Flame, Users, PenTool, Send, Camera, Image as ImageIcon, Zap, Clock, ListChecks, ArrowRight, BookOpen, Sparkles, Lock, ChevronLeft, Settings, LogOut, Truck, QrCode, HardHat, UserCheck, Trash2, Check
} from 'lucide-react';
import { GlassCard, GlassInput, GlassButton } from '../components/ui/GlassComponents';
import { simulateQRScan } from '../utils/helpers';
import { fetchGemini } from '../services/ai';
import { PermitQRBadge, QRScanButton } from '../components/ui/PermitQRBadge';
import { LiveDateTime } from '../components/ui/LiveDateTime';
import { ExportModal } from '../components/modals/ExportModal';

// ── Year-based logo accent themes ──────────────────────────────────────────
const YEAR_THEMES = {
  2026: { from: 'from-indigo-400', to: 'to-blue-500',    glowRgb: '99,102,241',  accent: 'text-indigo-600 dark:text-indigo-400',  label: 'Indigo · Electric Blue'  },
  2027: { from: 'from-emerald-400', to: 'to-gray-600',   glowRgb: '16,185,129',  accent: 'text-emerald-600 dark:text-emerald-400', label: 'Emerald · Graphite'       },
  2028: { from: 'from-orange-400',  to: 'to-slate-600',  glowRgb: '249,115,22',  accent: 'text-orange-600 dark:text-orange-400',   label: 'Orange · Steel'           },
  2029: { from: 'from-purple-400',  to: 'to-cyan-500',   glowRgb: '168,85,247',  accent: 'text-purple-600 dark:text-purple-400',   label: 'Purple · Cyan'            },
};
const CURRENT_YEAR = new Date().getFullYear();
function getYearTheme(override) {
  return YEAR_THEMES[override] || YEAR_THEMES[CURRENT_YEAR] || YEAR_THEMES[2026];
}

// Phase 2: Approval Timeline Component
function ApprovalTimeline({ permit, user, onApprove, onReject }) {
  const [rejectComment, setRejectComment] = React.useState('');
  const [showRejectInput, setShowRejectInput] = React.useState(false);

  const steps = [
    { labelAr: 'مُقدَّم' },
    { labelAr: 'المشرف' },
    { labelAr: 'مهندس السلامة' },
    { labelAr: 'مدير المشروع' },
  ];

  const level = permit?.approvalLevel ?? 0;
  const isRejected = permit?.approvalStatus === 'rejected';
  const isApproved = level >= 3 || permit?.approvalStatus === 'approved';

  const canApprove = !isRejected && !isApproved && user && (
    (level === 0 && user.role === 'roleSupervisor') ||
    (level === 1 && user.role === 'roleSafety') ||
    (level === 2 && user.role === 'rolePM')
  );

  const handleApprove = () => onApprove && onApprove(permit.id, user?.name);
  const handleReject = () => {
    if (!rejectComment.trim()) return alert('أدخل سبب الرفض / Enter rejection reason');
    onReject && onReject(permit.id, user?.name, rejectComment);
    setShowRejectInput(false);
    setRejectComment('');
  };

  if (!permit?.approvalHistory && !isApproved && !isRejected && level === 0 && !canApprove) return null;

  return (
    <div className="mt-3 border-t border-black/10 dark:border-white/10 pt-3">
      <p className="text-[9px] font-bold opacity-40 mb-2 text-slate-800 dark:text-white">مسار الاعتماد / Approval Workflow</p>
      <div className="flex items-start justify-between relative mb-2">
        <div className="absolute left-3 right-3 top-2.5 h-0.5 bg-black/10 dark:bg-white/10"></div>
        {steps.map((step, idx) => {
          const isComplete = !isRejected && idx < level;
          const isCurrent = !isRejected && !isApproved && idx === level;
          const isRejectedAt = isRejected && idx === level;
          const isFinalApproved = isApproved && idx === 3;
          return (
            <div key={idx} className="flex flex-col items-center relative z-10 flex-1">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-black transition-all ${
                isRejectedAt ? 'bg-red-500 border-red-500 text-white' :
                isComplete || isFinalApproved ? 'bg-emerald-500 border-emerald-500 text-white' :
                isCurrent ? 'bg-indigo-500 border-indigo-500 text-white animate-pulse' :
                'bg-white/30 dark:bg-black/30 border-black/20 dark:border-white/20 text-slate-400'
              }`}>
                {isRejectedAt ? '✕' : isComplete || isFinalApproved ? '✓' : idx + 1}
              </div>
              <span className="text-[7px] font-bold mt-1 opacity-50 w-full text-center leading-tight text-slate-800 dark:text-white">{step.labelAr}</span>
            </div>
          );
        })}
      </div>

      {isApproved && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
          <CheckCircle size={11}/> معتمد بالكامل / Fully Approved ✓
        </div>
      )}
      {isRejected && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-1.5 text-[9px] font-bold text-red-700 dark:text-red-300 mb-1">
          ✕ مرفوض: {permit.rejectionComment || 'بدون تعليق'}
        </div>
      )}

      {canApprove && !showRejectInput && (
        <div className="flex gap-2 mt-2">
          <button onClick={handleApprove} className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1">
            <CheckCircle size={11}/> اعتماد
          </button>
          <button onClick={() => setShowRejectInput(true)} className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-700 dark:text-red-400 rounded-xl text-[10px] font-bold transition-all">
            ✕ رفض
          </button>
        </div>
      )}
      {canApprove && showRejectInput && (
        <div className="flex gap-2 mt-2 animate-in fade-in">
          <GlassInput type="text" value={rejectComment} onChange={e => setRejectComment(e.target.value)} placeholder="سبب الرفض..." className="py-2 text-xs" />
          <button onClick={handleReject} className="px-3 bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 rounded-xl text-[10px] font-bold hover:bg-red-500/30 transition-all whitespace-nowrap">تأكيد</button>
          <button onClick={() => setShowRejectInput(false)} className="px-3 bg-white/10 text-slate-700 dark:text-white border border-black/10 dark:border-white/10 rounded-xl text-[10px] font-bold transition-all">إلغاء</button>
        </div>
      )}
    </div>
  );
}

// --- 1. شاشة الدخول ---
export function LoginScreen({ onLogin, t, lang, setLang, isRtl, theme, setTheme }) {
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('roleSafety');


  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    try {
      if (isLoginMode) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onLogin({ 
          name: userCredential.user.displayName || userCredential.user.email.split('@')[0], 
          role: 'roleSafety', 
          email: userCredential.user.email 
        });
      } else {
        if (password.length < 6) {
          alert(isRtl ? "كلمة السر لازم تكون 6 حروف على الأقل" : "Password must be at least 6 characters");
          setLoading(false); 
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: fullName });
        onLogin({ name: fullName || email.split('@')[0], role: role, email: email });
      }
    } catch (error) {
      console.error('❌ Auth Error:', error.code, error.message);
      const errorMsg = error.code === 'auth/user-not-found' 
        ? (isRtl ? "المستخدم غير موجود" : "User not found")
        : error.code === 'auth/wrong-password'
        ? (isRtl ? "كلمة المرور خاطئة" : "Wrong password")
        : error.code === 'auth/invalid-credential'
        ? (isRtl ? "البريد الإلكتروني أو كلمة المرور غير صحيحة، أو الحساب غير موجود. يرجى إنشاء حساب جديد إذا كنت مستخدماً جديداً." : "Invalid email/password, or account does not exist. Please register if you are a new user.")
        : error.code === 'auth/email-already-in-use'
        ? (isRtl ? "البريد موجود مسبقاً" : "Email already in use")
        : error.code === 'auth/weak-password'
        ? (isRtl ? "كلمة المرور ضعيفة" : "Password too weak")
        : (isRtl ? `خطأ: ${error.message}` : `Error: ${error.message}`);
      alert(errorMsg);
    } finally { 
      setLoading(false); 
    }
  };

  const bgClass = theme === 'dark' ? 'from-slate-900 via-indigo-950 to-slate-900' : theme === 'ocean' ? 'from-blue-950 via-sky-950 to-blue-900' : 'from-indigo-100 via-purple-100 to-pink-100';
  const textClass = theme === 'light' ? 'text-slate-800' : 'text-white';

  return (
    <div className={`flex flex-col h-screen bg-gradient-to-br ${bgClass} ${textClass} font-sans relative overflow-hidden transition-colors duration-1000`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60vh] h-[60vh] bg-indigo-500/30 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vh] h-[60vh] bg-pink-500/30 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 flex flex-col justify-center items-center h-full p-4 sm:p-6">
        <div className="bg-white/10 dark:bg-black/20 backdrop-blur-2xl border border-black/10 dark:border-white/10 p-6 sm:p-8 rounded-[2.5rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between w-full mb-5">
            <div className="flex bg-white/20 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-1 shadow-inner">
              <button onClick={() => setTheme('light')} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${theme==='light'?'bg-white shadow-md scale-100':'hover:bg-white/50 opacity-60 scale-90'} text-amber-500`}><Sun size={16}/></button>
              <button onClick={() => setTheme('dark')} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${theme==='dark'?'bg-slate-800 shadow-md scale-100':'hover:bg-black/20 opacity-60 scale-90'} text-indigo-300`}><Moon size={16}/></button>
              <button onClick={() => setTheme('ocean')} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${theme==='ocean'?'bg-blue-900 shadow-md scale-100':'hover:bg-blue-900/50 opacity-60 scale-90'} text-cyan-400`}><Droplets size={16}/></button>
            </div>
            <div>
              <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-white/20 dark:bg-white/10 backdrop-blur-xl border border-black/20 dark:border-white/20 text-xs rounded-xl px-3 py-2.5 font-black outline-none cursor-pointer shadow-sm text-slate-800 dark:text-white transition-all hover:bg-white/30 focus:ring-2 focus:ring-indigo-400/50 text-center [&>option]:text-black">
                <option value="ar">عربي</option><option value="en">English</option><option value="ur">اردو</option>
              </select>
            </div>
          </div>

          <div className="w-full border-b border-dashed border-black/20 dark:border-white/10 mb-6"></div>

          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-3xl shadow-[0_0_30px_rgba(99,102,241,0.5)]"><ShieldAlert size={40} className="text-white" /></div>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black mb-2 tracking-tight">HSE<span className="text-indigo-500 dark:text-indigo-400">Pro</span></h1>
            <p className="text-sm opacity-70 font-medium">{isLoginMode ? t('loginSub') : t('registerSub')}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginMode && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-4">
                <div><label className="block text-xs font-bold opacity-80 mb-1">{t('fullNameLbl')}</label><GlassInput type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required={!isLoginMode} placeholder={isRtl ? "الاسم الكامل (سيظهر للمستخدمين)" : "John Doe"} /></div>
                <div><label className="block text-xs font-bold opacity-80 mb-1">{t('roleLbl')}</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-white/40 dark:bg-black/30 border border-white/60 dark:border-white/10 rounded-xl p-3.5 text-sm outline-none cursor-pointer font-bold shadow-[inset_0_3px_6px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_3px_6px_rgba(0,0,0,0.3)] [&>option]:text-black text-slate-800 dark:text-white">
                    <option value="roleSafety">{t('roleSafety')}</option><option value="roleStructural">{t('roleStructural')}</option><option value="rolePM">{t('rolePM')}</option><option value="roleElectrician">{t('roleElectrician')}</option><option value="roleSupervisor">{t('roleSupervisor')}</option><option value="roleWorker">{t('roleWorker')}</option>
                  </select>
                </div>
              </div>
            )}
            <div><label className="block text-xs font-bold opacity-80 mb-1">البريد الإلكتروني (لن يظهر للعامة)</label><GlassInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@hse.com" /></div>
            <div><label className="block text-xs font-bold opacity-80 mb-1">{t('passwordLbl')}</label><GlassInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" /></div>
            <GlassButton type="submit" primary className="w-full py-4 mt-6 text-sm" disabled={loading}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : (isLoginMode ? t('loginBtn') : t('registerBtn'))}
            </GlassButton>
          </form>
          <div className="mt-8 text-center border-t border-black/10 dark:border-white/10 pt-6">
            <p className="text-xs opacity-70 font-bold">{isLoginMode ? t('noAccount') : t('haveAccount')} <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition-colors ml-1">{isLoginMode ? t('createOne') : t('loginHere')}</button></p>
          </div>
        </div>
      </div>
    </div>
  );
}
// --- 2. لوحة التحكم (تم تحديث الإشعارات والـ Avatar) ---
export function HomeDashboard({ safetyScore, weather, locationName, locationCoords, permits, reports, onNavigate, t, lang, isRtl, isPM, user, theme, toggleTheme, notifications, showNotifications, setShowNotifications, markAsRead, markAllAsRead, clearNotifications, onNotificationClick, logoYearOverride, usersList }) {
  const displayName = user?.name?.includes('@') ? user.name.split('@')[0] : (user?.name || t('userName'));
  const getInitials = (name) => { if(!name) return 'U'; return name.substring(0, 2).toUpperCase(); };

  const yearTheme = getYearTheme(logoYearOverride);
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  // دالة لتحديد كود اللون حسب الربع السنوي
  const getHseColorCode = () => {
    const month = new Date().getMonth(); 
    if (month >= 0 && month <= 2) return { bg: 'bg-yellow-400', name: 'أصفر' }; // الربع الأول
    if (month >= 3 && month <= 5) return { bg: 'bg-emerald-500', name: 'أخضر' }; // الربع الثاني
    if (month >= 6 && month <= 8) return { bg: 'bg-red-500', name: 'أحمر' };   // الربع الثالث
    return { bg: 'bg-blue-500', name: 'أزرق' };                                // الربع الرابع
  };
  const hseColor = getHseColorCode();

  return (
    <div className="space-y-5 max-w-xl mx-auto animate-in fade-in duration-500 pb-4">
      <GlassCard className="p-1.5 relative !overflow-visible z-50">
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ background: `rgba(${yearTheme.glowRgb},0.15)` }}></div>
        <div className="bg-gradient-to-br from-white/30 to-transparent dark:from-black/10 dark:to-transparent rounded-[1.6rem] p-4 sm:p-5 relative">
          <div className="flex justify-between items-start mb-4 relative z-50">
            <div className="flex-1">
              <h2 className="text-lg font-black leading-tight drop-shadow-sm">{t('welcomeBack')}،<br/><span className={`${yearTheme.accent} capitalize`}>{displayName}</span> 👋</h2>
              <p className="text-[10px] font-bold opacity-70 mt-1">{t('readyForToday')}</p>
            </div>

            {/* Dynamic Year-Themed Logo */}
            <div className="flex flex-col items-center justify-center shrink-0 mx-2 pointer-events-none group">
              <div
                className={`bg-gradient-to-br ${yearTheme.from} ${yearTheme.to} p-2 rounded-2xl mb-1 transition-all duration-700`}
                style={{ boxShadow: `0 4px 14px rgba(${yearTheme.glowRgb},0.55), inset 0 2px 1px rgba(255,255,255,0.4)` }}
              >
                <ShieldAlert className="text-white drop-shadow-md" size={20} />
              </div>
              <h1 className="text-xs font-extrabold tracking-tight drop-shadow-sm">HSE<span className={yearTheme.accent}>Pro</span></h1>
            </div>

            <div className="flex items-center justify-end gap-3 flex-1 pt-1 pr-2">
              <button onClick={toggleTheme} className="p-2.5 bg-gradient-to-b from-white/60 to-white/20 dark:from-white/10 dark:to-white/5 hover:-translate-y-0.5 active:translate-y-0.5 border border-white/60 dark:border-white/10 border-b-[3px] border-b-black/10 dark:border-b-black/50 active:border-b-0 rounded-xl backdrop-blur-md transition-all shadow-sm">
                {theme === 'light' ? <Sun size={14} className="text-amber-500 drop-shadow-sm"/> : theme === 'dark' ? <Moon size={14} className="text-indigo-300 drop-shadow-sm"/> : <Droplets size={14} className="text-cyan-400 drop-shadow-sm"/>}
              </button>

              {/* Notification Bell with Unread Badge */}
              <div>
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2.5 bg-gradient-to-b from-white/60 to-white/20 dark:from-white/10 dark:to-white/5 hover:-translate-y-0.5 active:translate-y-0.5 border border-white/60 dark:border-white/10 border-b-[3px] border-b-black/10 dark:border-b-black/50 active:border-b-0 rounded-xl backdrop-blur-md transition-all shadow-sm z-50">
                  <Bell size={14} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm flex items-center justify-center text-[8px] font-black text-white px-0.5 animate-in zoom-in duration-300">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-[90]" onClick={() => setShowNotifications(false)}></div>
                    <div className="fixed top-24 left-1/2 -translate-x-1/2 w-[90vw] max-w-[360px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-[0_30px_60px_rgba(0,0,0,0.4)] rounded-2xl p-4 z-[100] animate-in fade-in zoom-in duration-200">
                      <div className="flex items-center justify-between mb-3 border-b border-black/10 dark:border-slate-700/50 pb-2">
                        <h3 className="text-xs font-bold opacity-50 flex items-center gap-2">
                          {t('notifications')}
                          {unreadCount > 0 && <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
                        </h3>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && (
                            <button onClick={() => { markAllAsRead?.(); }} className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:opacity-80 transition-opacity flex items-center gap-1">
                              <Check size={10}/> {t('markAllAsRead')}
                            </button>
                          )}
                          {notifications.length > 0 && (
                            <button onClick={() => { clearNotifications?.(); }} className="text-[9px] font-bold text-red-600 dark:text-red-400 hover:opacity-80 transition-opacity">
                              {t('clearNotifications') || 'Clear'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar text-black dark:text-white">
                        {notifications.length === 0
                          ? <p className="text-xs opacity-50 text-center py-4">{t('noNotifications')}</p>
                          : notifications.slice(0, 12).map((n, i) => (
                            <div
                              key={n.id || i}
                              onClick={() => onNotificationClick?.(n)}
                              className={`cursor-pointer text-[10px] font-bold p-3 rounded-xl border transition-all flex items-start gap-2 ${
                                n.read
                                  ? 'bg-slate-50 dark:bg-slate-800/50 border-black/5 dark:border-white/5 opacity-70'
                                  : 'bg-slate-100 dark:bg-slate-800 border-black/10 dark:border-white/10 shadow-inner'
                              } ${isRtl ? 'flex-row-reverse text-right' : 'flex-row text-left'} hover:shadow-md hover:scale-[1.001]`}
                            >
                              <span className="flex-1 leading-relaxed">{n.message}</span>
                              {!n.read && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); markAsRead?.(n.id); }}
                                  className="shrink-0 p-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 transition-all"
                                  title={t('markAsRead')}
                                >
                                  <Check size={9}/>
                                </button>
                              )}
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => onNavigate('profile')}
                className="w-[38px] h-[38px] shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 hover:-translate-y-0.5 active:translate-y-0.5 border-2 border-white/60 dark:border-white/10 rounded-full shadow-md flex items-center justify-center text-white font-black text-[13px] transition-all"
              >
                {getInitials(displayName)}
              </button>
            </div>
          </div>

          {/* Live Date/Time Widget & Color Code */}
          <div className="mb-4 relative z-10 flex gap-2 items-stretch">
            {/* ويدجت الوقت (هياخد المساحة الأكبر) */}
            <div className="flex-1">
              <LiveDateTime lang={lang || 'ar'} isRtl={isRtl} />
            </div>
{/* كود اللون المعتمد */}
            <div className="bg-white/40 dark:bg-black/20 border border-white/60 dark:border-white/10 rounded-[1.2rem] p-2 flex items-center justify-center gap-2 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] w-auto min-w-[90px]">
              <div className={`w-8 h-8 rounded-xl ${hseColor.bg} border border-white/40 flex items-center justify-center shadow-md shrink-0`}>
                <CheckCircle size={16} className="text-white drop-shadow-sm" />
              </div>
              <div className="text-center w-full">
                <p className="text-[9px] font-bold opacity-60">كود اللون</p>
                <p className="text-xs font-black mt-0.5 text-slate-800 dark:text-white">{hseColor.name}</p>
              </div>
            </div>
          </div>

          {/* كارت الخريطة ومؤشر الأمان */}
          <div className="grid grid-cols-1 gap-3 mb-3 relative z-10">
            <div className="bg-white/40 dark:bg-black/20 border border-white/60 dark:border-white/10 rounded-[1.2rem] p-3 flex flex-col justify-between shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
              
              {/* الهيدر: الموقع + مؤشر الأمان الفعلي */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-500/20 p-2 rounded-xl text-indigo-700 dark:text-indigo-400 shadow-inner">
                    <MapPin size={16}/>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold opacity-60">موقع العمل الميداني</p>
                    <p className="text-xs font-black truncate max-w-[150px] mt-0.5 drop-shadow-sm">{locationName}</p>
                  </div>
                </div>
                
                {/* مؤشر الأمان الدائري (الفعلي) */}
                <div className="relative flex items-center justify-center w-9 h-9 drop-shadow-md" title="مؤشر الأمان الفعلي (يتأثر بالمخالفات والتصاريح)">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-black/5 dark:text-white/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                    {/* السطر ده بيغير لون المؤشر حسب النسبة (أخضر/أصفر/أحمر) وبيملى الدايرة حسب الرقم */}
                    <path 
                      className={`drop-shadow-sm ${safetyScore > 80 ? 'text-emerald-500' : safetyScore > 50 ? 'text-yellow-500' : 'text-red-500'}`} 
                      strokeDasharray={`${safetyScore}, 100`} 
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <span className="text-[9px] font-black z-10">{safetyScore}%</span>
                </div>
              </div>

              {/* الخريطة */}
              <div className="mt-2">
                {locationCoords ? (
                  <div className="h-32 w-full rounded-xl overflow-hidden border border-black/10 dark:border-white/10 shadow-sm mt-1">
                    <iframe 
                      width="100%" 
                      height="100%" 
                      frameBorder="0" 
                      style={{ border: 0 }} 
                      src={`https://maps.google.com/maps?q=${locationCoords.lat},${locationCoords.lng}&hl=ar&z=19&output=embed`} 
                      title="map" 
                      allowFullScreen>
                    </iframe>
                  </div>
                ) : (
                  <div className="text-[10px] opacity-50 text-center py-4">جاري تحديد الإحداثيات بدقة...</div>
                )}
              </div>
            </div>
          </div>

          {/* 🚨 لوحة تتبع الموظفين - تظهر فقط لمدير المشاريع isPM */}
          {isPM && usersList && usersList.length > 0 && (
            <div className="mb-3 bg-white/60 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] p-4 relative z-10 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">رادار تتبع الموظفين (Live)</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-1">
                {usersList.map((emp) => {
                  const isOnline = emp.lastSeen && (Date.now() - emp.lastSeen < 5 * 60 * 1000);
                  return (
                    <div key={emp.id} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-black/20 border border-slate-100 dark:border-white/5 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                            {emp.name ? emp.name.substring(0,2).toUpperCase() : 'U'}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800 dark:text-white">{emp.name}</h5>
                          <p className="text-[9px] opacity-60 font-medium">{t(emp.role) || emp.role}</p>
                        </div>
                      </div>

                      {emp.lat && emp.lng ? (
                        <a 
                          href={`https://maps.google.com/maps?q=${emp.lat},${emp.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm"
                        >
                          <MapPin size={10}/> موقع
                        </a>
                      ) : (
                        <span className="text-[9px] opacity-40">غير متاح</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 relative z-10 mb-5">
            <div className="bg-white/30 dark:bg-white/5 px-3 py-2.5 rounded-[1.2rem] border border-white/50 dark:border-white/10 flex items-center gap-3 shadow-sm">
              <div className="text-xl drop-shadow-md">{weather.condition}</div>
              <div><p className="text-sm font-black drop-shadow-sm" dir="ltr">{weather.temp}°C</p><p className="text-[8px] opacity-70 font-bold truncate">{weather.advice}</p></div>
            </div>
            <div className="bg-white/30 dark:bg-white/5 px-3 py-2.5 rounded-[1.2rem] border border-white/50 dark:border-white/10 flex items-center gap-3 shadow-sm">
              <div className="text-blue-500 dark:text-blue-400 bg-blue-500/10 p-1.5 rounded-lg shadow-inner"><Wind size={14}/></div>
              <div><p className="text-sm font-black drop-shadow-sm" dir="ltr">{weather.wind} <span className="text-[8px] font-normal">km/h</span></p><p className="text-[8px] opacity-70 font-bold">{t('windSpeed')}</p></div>
            </div>
          </div>
          <div className="w-full h-px bg-gradient-to-r from-transparent via-black/10 dark:via-white/20 to-transparent mb-5 drop-shadow-sm"></div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => onNavigate('permits')} className="bg-gradient-to-b from-white/60 to-white/20 dark:from-white/10 dark:to-white/5 border border-white/60 dark:border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.05),inset_0_2px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)] border-b-[4px] border-b-black/10 dark:border-b-black/40 active:border-b-0 active:translate-y-1 rounded-[1.2rem] p-4 flex flex-col items-center justify-center text-center gap-1.5 transition-all group overflow-hidden relative">
              <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 text-white shadow-[0_4px_10px_rgba(99,102,241,0.4),inset_0_2px_1px_rgba(255,255,255,0.4)] mb-1 group-hover:-translate-y-1 transition-transform"><FileText size={20} /></div>
              <div><p className="text-2xl font-black text-slate-800 dark:text-white drop-shadow-sm leading-none">{permits.filter(p => p.status === 'open').length}</p><p className="text-[9px] font-black opacity-60 uppercase tracking-widest mt-1.5">{t('activePermits')}</p></div>
            </button>
            <button onClick={() => onNavigate('reports')} className="bg-gradient-to-b from-white/60 to-white/20 dark:from-white/10 dark:to-white/5 border border-white/60 dark:border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.05),inset_0_2px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)] border-b-[4px] border-b-black/10 dark:border-b-black/40 active:border-b-0 active:translate-y-1 rounded-[1.2rem] p-4 flex flex-col items-center justify-center text-center gap-1.5 transition-all group overflow-hidden relative">
              <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-400 to-red-600 text-white shadow-[0_4px_10px_rgba(239,68,68,0.4),inset_0_2px_1px_rgba(255,255,255,0.4)] mb-1 group-hover:-translate-y-1 transition-transform"><AlertTriangle size={20} /></div>
              <div><p className="text-2xl font-black text-slate-800 dark:text-white drop-shadow-sm leading-none">{reports.filter(r => r.status === 'open').length}</p><p className="text-[9px] font-black opacity-60 uppercase tracking-widest mt-1.5">{t('openViolations')}</p></div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button onClick={() => onNavigate('ai')} className="bg-gradient-to-b from-white/60 to-white/20 dark:from-white/10 dark:to-white/5 border border-white/60 dark:border-white/10 shadow-sm border-b-[3px] border-b-black/10 dark:border-b-black/40 active:border-b-0 active:translate-y-1 rounded-[1.2rem] p-3 flex flex-col items-center justify-center text-center gap-1 transition-all group overflow-hidden relative">
              <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-[0_4px_10px_rgba(168,85,247,0.4),inset_0_2px_1px_rgba(255,255,255,0.4)] mb-0.5 group-hover:-translate-y-1 transition-transform"><Sparkles size={16} /></div>
              <p className="text-[9px] font-black opacity-60 uppercase tracking-widest">AI Assistant</p>
            </button>
            <button onClick={() => onNavigate('forms')} className="bg-gradient-to-b from-white/60 to-white/20 dark:from-white/10 dark:to-white/5 border border-white/60 dark:border-white/10 shadow-sm border-b-[3px] border-b-black/10 dark:border-b-black/40 active:border-b-0 active:translate-y-1 rounded-[1.2rem] p-3 flex flex-col items-center justify-center text-center gap-1 transition-all group overflow-hidden relative">
              <div className="absolute inset-0 bg-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="p-2 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-[0_4px_10px_rgba(20,184,166,0.4),inset_0_2px_1px_rgba(255,255,255,0.4)] mb-0.5 group-hover:-translate-y-1 transition-transform"><ListChecks size={16} /></div>
              <p className="text-[9px] font-black opacity-60 uppercase tracking-widest">Form Builder</p>
            </button>
          </div>
        </div>
      </GlassCard>
      {isPM && (
        <GlassCard className="p-1">
          <div className="bg-gradient-to-r from-indigo-500/10 via-indigo-500/20 to-indigo-500/10 rounded-2xl p-3 flex items-center justify-center gap-2 text-sm font-black text-indigo-800 dark:text-indigo-200 shadow-inner border border-indigo-500/20">
            <Activity size={18} className="animate-pulse"/> {t('monitoringMode')}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

// --- 3. إدارة التصاريح ---
export function PermitsManager({ permits, requests, openModal, openReqModal, openPrint, exportCSV, exportXLSX, exportPDF, exportColumns, t, isRtl, canIssuePermit, isPM, isSafety, isExec, addNote, replyReq, onStopPermit, onApprovePermit, onRejectPermit, user }) {
  const [exportModal, setExportModal] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('permits'); 
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [noteText, setNoteText] = useState('');

  const submitNote = (id) => { if(noteText.trim()) addNote(id, noteText); setActiveNoteId(null); setNoteText(''); };
  const submitReply = (id) => { if(noteText.trim()) replyReq(id, noteText); setActiveNoteId(null); setNoteText(''); };

  const handleStopWithLocation = (id) => {
    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(() => {
        onStopPermit(id);
      }, () => {
        onStopPermit(id); 
      }, { enableHighAccuracy: true, timeout: 10000 });
    } else {
      onStopPermit(id);
    }
  };

  const canModify = isPM || isSafety || isExec;

  return (
    <div className={`max-w-xl mx-auto space-y-5 animate-in slide-in-from-${isRtl ? 'right' : 'left'}-8 duration-300`}>
      <div className="flex justify-between items-end mb-2">
        <div><h2 className="text-2xl font-black">{t('ptwTitle')}</h2><p className="text-xs font-bold opacity-60 mt-1">{t('ptwSub')}</p></div>
        <div className="flex gap-2">
          <div className="flex gap-1.5">
            <button onClick={() => setExportModal(permits)} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 rounded-xl text-[10px] font-bold transition-all"><Download size={14}/> {t('exportData') || 'Export'}</button>
          </div>
          {canIssuePermit && <GlassButton primary onClick={openModal} className="w-10 h-10 p-0 rounded-xl"><Plus size={22} /></GlassButton>}
          {!canIssuePermit && !isPM && <GlassButton primary onClick={openReqModal} className="px-4 py-2 text-xs"><MessageSquare size={16}/> {t('newReq')}</GlassButton>}
        </div>
      </div>
      <div className="flex bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/20 p-1 rounded-2xl shadow-sm">
        <button onClick={() => setActiveSubTab('permits')} className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition-all ${activeSubTab === 'permits' ? 'bg-white/20 shadow-md' : 'opacity-60 hover:opacity-100'}`}>{t('ptwTab')}</button>
        <button onClick={() => setActiveSubTab('requests')} className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${activeSubTab === 'requests' ? 'bg-white/20 shadow-md' : 'opacity-60 hover:opacity-100'}`}>
          {t('reqTab')} {requests.filter(r=>r.status==='pendingReq').length > 0 && <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full">{requests.filter(r=>r.status==='pendingReq').length}</span>}
        </button>
      </div>
      {activeSubTab === 'permits' && (
        <div className="space-y-4 animate-in fade-in">
          {permits.map(permit => (
            <GlassCard key={permit.id} className={`p-5 border-l-4 ${permit.status === 'stopped' ? 'border-l-slate-400 opacity-80' : 'border-l-indigo-500 dark:border-l-indigo-400'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3"><div className="p-2.5 rounded-xl bg-white/10 border border-black/10 dark:border-white/20"><Flame size={20}/></div><div><h3 className="font-bold text-sm">{permit.type || 'Permit'}</h3><p className="text-[10px] font-bold opacity-80 mt-0.5 text-indigo-600 dark:text-indigo-400">{permit.permitNumber || permit.id}</p></div></div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full flex gap-1 items-center border ${permit.status === 'stopped' ? 'bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30' : 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30'}`}><CheckCircle size={10}/>{permit.status === 'stopped' ? t('stopped') || 'موقوف' : t('open')}</span>
                  <div className="flex items-center gap-1.5">
                    <PermitQRBadge permit={permit} t={t} />
                    <button onClick={() => openPrint(permit)} className="text-[9px] bg-white/10 hover:bg-black/5 dark:hover:bg-white/20 px-2 py-1 rounded-lg font-bold flex items-center gap-1 border border-black/10 dark:border-white/20 transition-all"><Printer size={10}/> {t('print')}</button>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-3.5 text-[11px] grid grid-cols-2 gap-3 border border-black/10 dark:border-white/10">
                <p><span className="opacity-50 block text-[9px] mb-0.5">{t('permitLoc')}</span> <span className="font-bold">{permit.location}</span></p>
                <p><span className="opacity-50 block text-[9px] mb-0.5">{t('validUntil')}</span> <span className="font-bold text-indigo-400">{permit.validUntil}</span></p>
                <p><span className="opacity-50 block text-[9px] mb-0.5">{t('execEng')}</span> <span className="font-bold">{permit.engineerName || '--'}</span></p>
                <p><span className="opacity-50 block text-[9px] mb-0.5">{t('workersCount')}</span> <span className="font-bold">{permit.workersCount || 0} <Users size={10} className="inline opacity-70 ml-1"/></span></p>
              </div>

              <ApprovalTimeline
                permit={permit}
                user={user}
                onApprove={onApprovePermit}
                onReject={onRejectPermit}
              />

              {permit.status !== 'stopped' && canModify && (
                <button 
                  onClick={() => handleStopWithLocation(permit.id)}
                  className="w-full mt-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={14} /> إيقاف التصريح
                </button>
              )}
              {permit.status === 'stopped' && permit.closedBy && (
                 <p className="text-[10px] text-center mt-3 opacity-60">تم الإيقاف بواسطة: {permit.closedBy} في {permit.closedAt}</p>
              )}

              {permit.pmNote && (<div className="bg-indigo-500/10 border border-indigo-500/20 p-3.5 rounded-2xl mt-3"><p className="text-[10px] font-bold mb-1 flex items-center gap-1.5 opacity-70"><PenTool size={12}/> {t('pmNoteLbl')}</p><p className="text-xs font-bold leading-relaxed">{permit.pmNote}</p></div>)}
              {isPM && !permit.pmNote && activeNoteId !== permit.id && permit.status !== 'stopped' && (<button onClick={() => setActiveNoteId(permit.id)} className="w-full mt-3 py-2.5 border border-dashed border-black/20 dark:border-white/30 rounded-xl text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 transition-all">{t('addNote')}</button>)}
              {activeNoteId === permit.id && (<div className="mt-3 flex gap-2 animate-in fade-in"><GlassInput type="text" value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder={t('writeNote')} className="py-2.5" /><GlassButton primary onClick={() => submitNote(permit.id)} className="px-4"><Send size={14}/></GlassButton></div>)}
            </GlassCard>
          ))}
          {permits.length === 0 && <p className="text-center opacity-50 text-xs py-10 font-bold">لا توجد تصاريح نشطة.</p>}
        </div>
      )}
      {activeSubTab === 'requests' && (
        <div className="space-y-4 animate-in fade-in">
          {requests.map(req => (
            <GlassCard key={req.id} className="p-5 border-l-4 border-l-blue-500 dark:border-l-blue-400">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3"><div className="bg-white/10 border border-black/10 dark:border-white/20 p-2.5 rounded-xl"><MessageSquare size={18}/></div><div><p className="text-xs font-bold">{t('reqSender')} {req.sender}</p><p className="text-[9px] opacity-60 mt-0.5">{req.role} • {req.time}</p></div></div>
                <span className={`text-[9px] font-bold px-3 py-1 rounded-full border ${req.status === 'pendingReq' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30' : 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30'}`}>{t(req.status)}</span>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-black/10 dark:border-white/10 text-xs font-medium leading-relaxed">{req.text}</div>
              {req.reply && (<div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl mt-2 ml-4 border-r-2 border-r-blue-400"><p className="text-[10px] font-bold opacity-70 mb-1.5">رد قسم السلامة:</p><p className="text-xs font-bold leading-relaxed">{req.reply}</p></div>)}
              {isSafety && !req.reply && activeNoteId !== req.id && (<button onClick={() => setActiveNoteId(req.id)} className="w-full mt-2 py-2.5 border border-dashed border-black/20 dark:border-white/30 rounded-xl text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 transition-all">{t('replyBtn')}</button>)}
              {activeNoteId === req.id && isSafety && (<div className="mt-2 flex gap-2 animate-in fade-in ml-4"><GlassInput type="text" value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder={t('replyPlace')} className="py-2.5" /><GlassButton primary onClick={() => submitReply(req.id)} className="px-4 text-xs">{t('replyBtn')}</GlassButton></div>)}
            </GlassCard>
          ))}
          {requests.length === 0 && <p className="text-center opacity-50 text-xs py-10 font-bold">لا توجد طلبات أو رسائل حالياً.</p>}
        </div>
      )}

      {exportModal && (
        <ExportModal
          data={exportModal}
          columns={exportColumns || [
            { k: '#', l: '#' }, { k: 'permitNumber', l: 'Permit No.' }, { k: 'type', l: t('permitType') },
            { k: 'location', l: t('permitLoc') }, { k: 'status', l: t('statusLbl') }, { k: 'supervisorName', l: t('supervisor') }, { k: 'pmNote', l: 'Notes' },
          ]}
          filename="permits_export"
          onClose={() => setExportModal(null)}
          t={t}
        />
      )}
    </div>
  );
}

// --- 4. السجل ---
export function ReportsCenter({ reports, permits = [], exportCSV, exportXLSX, exportPDF, exportColumns, permitColumns, t, isRtl, isPM, isSafety, isExec, addNote, onCloseReport }) {
  const [activeSubTab, setActiveSubTab] = useState('reports');
  const [exportModal, setExportModal] = useState(null);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [noteText, setNoteText] = useState('');

  const submitNote = (id) => { if(noteText.trim()) addNote(id, noteText); setActiveNoteId(null); setNoteText(''); };

  const handleCloseWithLocation = (id) => {
    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(() => {
        onCloseReport(id);
      }, () => {
        onCloseReport(id); 
      }, { enableHighAccuracy: true, timeout: 10000 });
    } else {
      onCloseReport(id);
    }
  };

  const handleDelete = async (collectionName, id) => {
    if(window.confirm(isRtl ? "هل أنت متأكد من الحذف النهائي؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to permanently delete this?")) {
      try {
        await deleteDoc(doc(db, collectionName, id));
        alert(isRtl ? "تم الحذف بنجاح ✅" : "Deleted successfully");
      } catch (error) {
        console.error("Error deleting:", error);
        alert(isRtl ? "حدث خطأ أثناء الحذف" : "Error deleting record");
      }
    }
  };

  const canModify = isPM || isSafety || isExec;

  return (
    <div className={`max-w-xl mx-auto space-y-5 animate-in slide-in-from-${isRtl ? 'left' : 'right'}-8 duration-300`}>
      <div className="flex justify-between items-end mb-2">
        <div><h2 className="text-2xl font-black">السجل الشامل</h2><p className="text-xs font-bold opacity-60 mt-1">أرشيف المخالفات والتصاريح</p></div>
        <div className="flex gap-1.5">
          <button onClick={() => setExportModal({ data: activeSubTab === 'reports' ? reports : permits, cols: activeSubTab === 'reports' ? exportColumns : permitColumns })} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 rounded-xl text-[10px] font-bold transition-all"><Download size={14}/> {t('exportData') || 'Export'}</button>
        </div>
      </div>

      <div className="flex bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/20 p-1 rounded-2xl shadow-sm mb-4">
        <button onClick={() => setActiveSubTab('reports')} className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${activeSubTab === 'reports' ? 'bg-white/20 shadow-md' : 'opacity-60 hover:opacity-100'}`}><AlertTriangle size={14}/> المخالفات</button>
        <button onClick={() => setActiveSubTab('permits')} className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${activeSubTab === 'permits' ? 'bg-white/20 shadow-md' : 'opacity-60 hover:opacity-100'}`}><FileText size={14}/> التصاريح</button>
      </div>

      {activeSubTab === 'reports' && (
        <div className="space-y-4 animate-in fade-in">
          {reports.map(report => (
            <GlassCard key={report.id} className={`p-4 border-l-4 ${report.status === 'closed' ? 'border-l-green-500 opacity-80' : report.reportType === 'Near Miss' ? 'border-l-amber-500' : 'border-l-red-500'}`}>
              <div className="flex justify-between">
                <div className="flex gap-4">
                  {report.photoBase64 ? (
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-black/10 dark:border-white/20 shadow-inner"><img src={report.photoBase64} alt="Report" className="w-full h-full object-cover"/></div>
                  ) : (
                    <div className="w-16 h-16 bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl flex items-center justify-center shrink-0 opacity-50"><Camera size={24} /></div>
                  )}
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${report.reportType === 'Near Miss' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30' : 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30'}`}>{report.reportType === 'Near Miss' ? t('nearMiss') : t('violation')}</span>
                      {report.status === 'closed' && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-green-500/20 text-green-700 border-green-500/30">مغلق</span>}
                    </div>
                    <h3 className="font-bold text-sm leading-tight">{report.title}</h3>
                    <p className="text-[10px] font-bold opacity-60 mt-1.5 flex items-center gap-1"><MapPin size={10}/> {report.location || 'موقع عام'}</p>
                  </div>
                </div>
                {canModify && (
                  <button onClick={() => handleDelete('reports', report.id)} className="text-red-500/60 hover:text-red-500 transition-colors p-2"><Trash2 size={18}/></button>
                )}
              </div>

              {report.status !== 'closed' && canModify && (
                <button 
                  onClick={() => handleCloseWithLocation(report.id)}
                  className="w-full mt-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-700 dark:text-green-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={14} /> إغلاق المخالفة
                </button>
              )}
              {report.status === 'closed' && report.closedBy && (
                <p className="text-[10px] text-center mt-3 opacity-60">تم الإغلاق بواسطة: {report.closedBy} في {report.closedAt}</p>
              )}

              {report.pmNote && (<div className="bg-indigo-500/10 border border-indigo-500/20 p-3.5 rounded-2xl mt-4"><p className="text-[10px] font-bold opacity-70 mb-1 flex items-center gap-1.5"><PenTool size={12}/> {t('pmNoteLbl')}</p><p className="text-xs font-bold leading-relaxed">{report.pmNote}</p></div>)}
              {isPM && !report.pmNote && activeNoteId !== report.id && report.status !== 'closed' && (<button onClick={() => setActiveNoteId(report.id)} className="w-full mt-4 py-2.5 border border-dashed border-black/20 dark:border-white/30 rounded-xl text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 transition-all">{t('addNote')}</button>)}
              {activeNoteId === report.id && (<div className="mt-4 flex gap-2 animate-in fade-in"><GlassInput type="text" value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder={t('writeNote')} className="py-2.5" /><GlassButton primary onClick={() => submitNote(report.id)} className="px-4"><Send size={14}/></GlassButton></div>)}
            </GlassCard>
          ))}
          {reports.length === 0 && <p className="text-center opacity-50 text-xs py-10 font-bold">لا يوجد سجل للمخالفات.</p>}
        </div>
      )}

      {activeSubTab === 'permits' && (
        <div className="space-y-4 animate-in fade-in">
          {permits.map(permit => (
             <GlassCard key={permit.id} className={`p-4 border-l-4 ${permit.status === 'stopped' ? 'border-l-slate-400 opacity-80' : 'border-l-indigo-500 dark:border-l-indigo-400'}`}>
               <div className="flex justify-between items-start mb-3">
                 <div className="flex items-center gap-2">
                   <div className="p-2 rounded-xl bg-white/10 border border-black/10 dark:border-white/20"><FileText size={16}/></div>
                   <div><h3 className="font-bold text-sm">{permit.type}</h3><p className="text-[10px] font-bold opacity-80 text-indigo-600 dark:text-indigo-400">{permit.permitNumber || permit.id}</p></div>
                 </div>
                 <div className="flex items-center gap-3">
                   <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${permit.status === 'stopped' ? 'bg-slate-500/20 text-slate-700 border-slate-500/30' : 'bg-green-500/20 text-green-700 border-green-500/30'}`}>
                     {permit.status === 'stopped' ? 'موقوف' : 'نشط'}
                   </span>
                   {canModify && (
                     <button onClick={() => handleDelete('permits', permit.id)} className="text-red-500/60 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                   )}
                 </div>
               </div>
               <div className="text-[11px] grid grid-cols-2 gap-2 bg-white/5 p-3 rounded-xl border border-black/10 dark:border-white/10">
                 <p><span className="opacity-50 block text-[9px]">{t('permitLoc')}</span> <span className="font-bold">{permit.location}</span></p>
                 <p><span className="opacity-50 block text-[9px]">{t('execEng')}</span> <span className="font-bold">{permit.engineerName}</span></p>
               </div>
               {permit.status === 'stopped' && permit.closedBy && (
                 <p className="text-[10px] text-center mt-3 opacity-60">تم الإيقاف بواسطة: {permit.closedBy} في {permit.closedAt}</p>
               )}
             </GlassCard>
          ))}
          {permits.length === 0 && <p className="text-center opacity-50 text-xs py-10 font-bold">لا يوجد سجل للتصاريح.</p>}
        </div>
      )}

      {exportModal && (
        <ExportModal
          data={exportModal.data || []}
          columns={exportModal.cols || [
            { k: '#', l: '#' }, { k: 'permitNumber', l: 'Permit No.' }, { k: 'type', l: t('permitType') },
            { k: 'location', l: t('permitLoc') }, { k: 'status', l: t('statusLbl') },
          ]}
          filename={`${activeSubTab}_export`}
          onClose={() => setExportModal(null)}
          t={t}
        />
      )}
    </div>
  );
}

// --- المعدات والدورات والإعدادات والطباعة ---
export function EquipmentManager({ equipments, openModal, openChecklist, openMaintenance, exportCSV, exportPDF, t, isRtl, canAdd, isPM, isElectrician, user }) {
  const [isScanningQR, setIsScanningQR] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState(isElectrician ? 'electrical' : 'heavy');

  useEffect(() => { if (isElectrician) setActiveSubTab('electrical'); }, [isElectrician]);

  const isElectricalEq = (eq) => {
    if (eq.category) return eq.category === 'electrical';
    return eq?.type?.includes('Panel') || eq?.type?.includes('Generator') || eq?.type?.includes('Tool') || eq?.type?.includes('Welding') || eq?.type?.includes('كهرباء') || eq?.type?.includes('لوحة') || eq?.type?.includes('لحام');
  };
  const filteredEq = equipments.filter(eq => activeSubTab === 'electrical' ? isElectricalEq(eq) : !isElectricalEq(eq));

  const handleDailyQRScan = () => {
    setIsScanningQR(true);
    simulateQRScan((id) => {
      setIsScanningQR(false);
      if(filteredEq.length > 0) {
        const eqToInspect = filteredEq[Math.floor(Math.random() * filteredEq.length)];
        if (isElectrician) openMaintenance(eqToInspect);
        else openChecklist(eqToInspect);
      } else {
        alert('لا توجد معدات مسجلة في هذا القسم لإجراء الفحص عليها.');
      }
    });
  };

  return (
    <div className={`max-w-xl mx-auto space-y-5 animate-in slide-in-from-${isRtl ? 'right' : 'left'}-8 duration-300`}>
      <div className="flex justify-between items-end mb-2">
        <div><h2 className="text-2xl font-black">{t('eqTitle')}</h2><p className="text-xs font-bold opacity-60 mt-1">{t('eqSub')}</p></div>
        <div className="flex gap-2">
          <div className="flex gap-1.5"><button onClick={handleDailyQRScan} className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap">{isScanningQR ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14}/>} {t('scanQR')}</button></div>
          {canAdd && <GlassButton success onClick={() => openModal(activeSubTab)} className="w-10 h-10 p-0 rounded-xl"><Plus size={22} /></GlassButton>}
        </div>
      </div>
      <div className="flex bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/20 p-1 rounded-2xl shadow-sm mb-4">
        {!isElectrician && (<button onClick={() => setActiveSubTab('heavy')} className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${activeSubTab === 'heavy' ? 'bg-white/20 shadow-md' : 'opacity-60 hover:opacity-100'}`}><Truck size={14}/> {t('heavyEqTab')}</button>)}
        <button onClick={() => setActiveSubTab('electrical')} className={`flex-1 text-[11px] font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${activeSubTab === 'electrical' ? 'bg-white/20 shadow-md text-amber-400' : 'opacity-60 hover:opacity-100'}`}><Zap size={14}/> {t('electricalEqTab')}</button>
      </div>
      {filteredEq.length === 0 && (
        <div className="text-center py-12 bg-white/5 border border-black/10 dark:border-white/10 rounded-[1.2rem] shadow-inner"><Zap size={32} className="mx-auto mb-3 opacity-20" /><p className="text-xs font-bold opacity-60">لا توجد معدات مسجلة في هذا القسم حالياً.</p>{canAdd && <p className="text-[10px] font-bold opacity-40 mt-1">اضغط على (+) لإضافة معدة جديدة</p>}</div>
      )}
      {filteredEq.map((eq) => (
        <GlassCard key={eq.id} className={`p-5 border-l-4 ${eq.status === 'statusValid' ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-3">
              {eq.eqPhotoBase64 ? (<div className="w-12 h-12 rounded-xl overflow-hidden border border-black/10 dark:border-white/20"><img src={eq.eqPhotoBase64} alt="Eq" className="w-full h-full object-cover"/></div>) : (<div className="p-2.5 rounded-xl bg-white/10 border border-black/10 dark:border-white/20">{eq.type?.includes('Panel') || eq.type?.includes('Generator') || eq.type?.includes('Tool') ? <Zap size={20}/> : <Truck size={20}/>}</div>)}
              <div className="flex flex-col justify-center"><h3 className="font-bold text-sm leading-tight">{eq.name}</h3><p className="text-[10px] font-bold opacity-60 mt-0.5">{eq.type} • {eq.id}</p></div>
            </div>
            <span className={`text-[9px] font-bold px-3 py-1 rounded-full border ${eq.status === 'statusValid' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30'}`}>{t(eq.status)}</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3.5 text-[11px] grid grid-cols-2 gap-3 border border-black/10 dark:border-white/10 mb-4">
            <p className="flex items-center gap-1.5"><User size={12} className="opacity-50"/> <span className="opacity-70 text-[9px]">{t('operatorId')}:</span> <span className="font-bold">{eq.operatorId || '--'}</span></p>
            <p className="flex items-center gap-1.5"><Clock size={12} className="opacity-50"/> <span className="opacity-70 text-[9px]">{t('lastInspected')}:</span> <span className="font-bold whitespace-nowrap overflow-hidden text-ellipsis">{eq.lastInspected}</span></p>
            <p className="flex items-center gap-1.5"><ImageIcon size={12} className={eq.eqPhotoBase64 ? "text-green-400" : "opacity-30"}/> <span className={`font-bold ${eq.eqPhotoBase64 ? 'text-green-400' : 'opacity-70 text-[9px]'}`}>{t('eqPhoto')}</span></p>
            <p className="flex items-center gap-1.5"><ImageIcon size={12} className={eq.serialPhotoBase64 ? "text-green-400" : "opacity-30"}/> <span className={`font-bold ${eq.serialPhotoBase64 ? 'text-green-400' : 'opacity-70 text-[9px]'}`}>{t('serialPhoto')}</span></p>
          </div>
          {eq.lastFixDetails && (
            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl mb-4 flex items-start gap-3">
              {eq.lastFixPhoto && <img src={eq.lastFixPhoto} className="w-12 h-12 rounded-lg object-cover border border-blue-500/30 shrink-0" />}
              <div><p className="text-[9px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1"><Zap size={10}/> {t('lastFixLbl')} ({eq.inspector || t('roleElectrician')})</p><p className="text-xs font-bold mt-0.5 text-slate-800 dark:text-white">{eq.lastFixDetails}</p></div>
            </div>
          )}
          <div className="flex gap-2">
            {!isElectrician ? (<GlassButton onClick={() => openChecklist(eq)} className="flex-1 py-2.5 text-xs text-emerald-600 dark:text-emerald-300 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"><ListChecks size={14}/> {t('dailyCheck')}</GlassButton>) : (<GlassButton primary onClick={() => openMaintenance(eq)} className="flex-1 py-2.5 text-xs bg-gradient-to-b from-blue-400 to-blue-600 hover:from-blue-300 hover:to-blue-500 text-white border-blue-400 border-b-[4px] border-b-blue-800 shadow-[0_4px_10px_rgba(59,130,246,0.4)]"><Zap size={14}/> {t('fixEqBtn')}</GlassButton>)}
            {!isElectrician && <GlassButton className="flex-1 py-2.5 text-xs opacity-50 cursor-not-allowed">{t('maintReq')}</GlassButton>}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

export function KnowledgeBase({ t, isRtl, lang }) {
  const [selectedCourse, setSelectedCourse] = useState(null); const [customTask, setCustomTask] = useState(''); const [generatedTalk, setGeneratedTalk] = useState(''); const [isGenerating, setIsGenerating] = useState(false);
  const generateToolboxTalk = async () => { 
    if (!customTask) return; 
    setIsGenerating(true); 
    const langInstructions = lang === 'en' ? 'Respond in English.' : lang === 'ur' ? 'Respond in Urdu.' : 'Respond in Arabic.'; 
    const prompt = `You are an HSE expert. Create a quick Toolbox Talk for: "${customTask}". Give 3 hazards and 3 precautions. Keep it very short. ${langInstructions}`; 
    try { 
      const response = await fetchGemini(prompt); 
      if (response && response.trim() && !response.startsWith('Error')) {
        setGeneratedTalk(response);
      } else {
        setGeneratedTalk('Unable to generate response. Please try again.');
      }
    } catch (e) { 
      console.error('Toolbox talk error:', e); 
      const errorMsg = e?.message || 'Error: Could not connect to AI service. Please check your internet connection and try again.';
      setGeneratedTalk(errorMsg); 
    } finally {
      setIsGenerating(false);
    }
  };
  const courses = [{ id: 1, title: t('c1Title'), icon: <Activity size={24}/> }, { id: 2, title: t('c2Title'), icon: <Flame size={24}/> }, { id: 3, title: t('c3Title'), icon: <ShieldAlert size={24}/> }, { id: 4, title: t('c4Title'), icon: <Lock size={24}/> }, { id: 5, title: t('c5Title'), icon: <Truck size={24}/> }, { id: 6, title: t('c6Title'), icon: <Settings size={24}/> }];

  if (selectedCourse) { 
    const courseSummary = t(`c${selectedCourse.id}Summary`); 
    return (
      <div className={`max-w-xl mx-auto space-y-5 animate-in slide-in-from-${isRtl ? 'right' : 'left'}-8 duration-300`}>
        <button onClick={() => setSelectedCourse(null)} className="flex items-center gap-2 font-bold text-xs bg-white/10 hover:bg-black/5 dark:hover:bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-xl border border-black/20 dark:border-white/20 transition-all"><ArrowRight size={14} className={isRtl ? '' : 'rotate-180'} /> {t('backToList')}</button>
        <GlassCard className="p-6 bg-gradient-to-br from-white/20 to-white/5"><div className="flex items-center gap-4"><div className="bg-white/20 p-3.5 rounded-2xl backdrop-blur-md border border-black/10 dark:border-white/30 shadow-inner">{selectedCourse.icon}</div><h2 className="text-xl font-black">{selectedCourse.title}</h2></div></GlassCard>
        <GlassCard className="p-6"><h3 className="font-bold mb-5 flex items-center gap-2 opacity-90"><BookOpen size={18}/> {t('keyInstructions')}</h3><ul className="space-y-3">{Array.isArray(courseSummary) && courseSummary.map((point, idx) => (<li key={idx} className="flex gap-3 text-sm font-medium bg-white/5 p-4 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm"><CheckCircle size={18} className="text-green-400 shrink-0 mt-0.5" /><span className="leading-relaxed">{point}</span></li>))}</ul></GlassCard>
      </div>
    ); 
  }
  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div><h2 className="text-2xl font-black">{t('trTitle')}</h2><p className="text-xs font-bold opacity-60 mt-1">{t('trSub')}</p></div>
      <GlassCard className="p-6 bg-indigo-500/10 border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-2xl rounded-full"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2"><Sparkles size={18} className="text-indigo-400" /><h3 className="font-bold text-sm">{t('aiToolboxTitle')}</h3></div>
          <p className="text-[10px] font-bold opacity-70 mb-4">{t('aiToolboxSub')}</p>
          <div className="flex gap-2"><GlassInput type="text" value={customTask} onChange={(e) => setCustomTask(e.target.value)} placeholder={t('aiToolboxPlaceholder')} className="py-3" /><GlassButton primary onClick={generateToolboxTalk} disabled={isGenerating || !customTask} className="px-5 text-xs">{isGenerating ? <Loader2 size={16} className="animate-spin" /> : t('generateBtn')}</GlassButton></div>
          {generatedTalk && <div className="mt-4 p-5 bg-white/10 rounded-2xl border border-black/10 dark:border-white/20 text-xs font-medium leading-relaxed whitespace-pre-wrap backdrop-blur-md shadow-inner">{generatedTalk}</div>}
        </div>
      </GlassCard>
      <div className="grid grid-cols-2 gap-4">
        {courses.map((course) => (
          <GlassCard key={course.id} onClick={() => setSelectedCourse(course)} className="p-5 flex flex-col items-center text-center gap-3 hover:bg-black/5 dark:hover:bg-white/20 transition-all group">
            <div className="bg-white/10 p-3.5 rounded-2xl border border-black/10 dark:border-white/20 group-hover:scale-110 transition-transform shadow-inner">{course.icon}</div>
            <div><h3 className="font-bold text-xs mb-1.5 leading-tight">{course.title}</h3><p className="text-[9px] font-bold opacity-50 flex items-center justify-center gap-1 group-hover:opacity-100 transition-opacity">{t('viewSummary')} <ArrowRight size={10} className={isRtl ? 'rotate-180' : ''} /></p></div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

export function SettingsDashboard({ user, onLogout, t, isRtl, theme, toggleTheme, lang, setLang, logoYearOverride, setLogoYearOverride }) {
  const [showPwdUI, setShowPwdUI] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });

  const handleSavePassword = (e) => {
    e.preventDefault();
    if(pwdForm.new !== pwdForm.confirm) return alert("كلمات المرور لا تتطابق!");
    alert("تم تغيير كلمة المرور بنجاح");
    setShowPwdUI(false); setPwdForm({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div><h2 className="text-2xl font-black">{t('settingsTitle')}</h2><p className="text-xs font-bold opacity-60 mt-1">{t('settingsSub')}</p></div>
      <GlassCard className="p-6 space-y-4">
        <div onClick={() => setShowPwdUI(!showPwdUI)} className="flex items-center justify-between p-4 bg-white/10 dark:bg-black/20 rounded-2xl border border-black/10 dark:border-white/10 shadow-inner cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all">
          <div className="flex items-center gap-4"><Lock size={18} className="text-indigo-500" /><span className="font-bold text-sm">{t('changePassword')}</span></div>
          <ChevronLeft size={18} className={`opacity-50 ${isRtl && !showPwdUI ? '' : '-rotate-90'} transition-transform`} />
        </div>
        {showPwdUI && (
          <form onSubmit={handleSavePassword} className="p-4 bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 space-y-4 animate-in slide-in-from-top-2">
            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-indigo-500 ml-2">{t('currentPassword')}</label><GlassInput type="password" required value={pwdForm.current} onChange={e=>setPwdForm({...pwdForm, current: e.target.value})} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-indigo-500 ml-2">{t('newPassword')}</label><GlassInput type="password" required value={pwdForm.new} onChange={e=>setPwdForm({...pwdForm, new: e.target.value})} /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black uppercase text-indigo-500 ml-2">{t('confirmPassword')}</label><GlassInput type="password" required value={pwdForm.confirm} onChange={e=>setPwdForm({...pwdForm, confirm: e.target.value})} /></div>
            <GlassButton primary type="submit" className="w-full py-3.5 mt-2">{t('saveChanges')}</GlassButton>
          </form>
        )}
      </GlassCard>
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center justify-between p-4 bg-white/10 dark:bg-black/20 rounded-2xl border border-black/10 dark:border-white/10 shadow-inner">
          <div className="flex items-center gap-4"><Sun size={18} className="text-amber-500" /><span className="font-bold text-sm">{t('appTheme')}</span></div>
          <button onClick={toggleTheme} className="text-xs font-bold bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md">{theme === 'light' ? t('themeLight') : theme === 'dark' ? t('themeDark') : t('themeOcean')}</button>
        </div>
        <div className="flex items-center justify-between p-4 bg-white/10 dark:bg-black/20 rounded-2xl border border-black/10 dark:border-white/10 shadow-inner">
          <div className="flex items-center gap-4"><Settings size={18} className="text-slate-500" /><span className="font-bold text-sm">{t('appLanguage')}</span></div>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-white/20 backdrop-blur-xl border border-black/20 dark:border-white/30 text-xs rounded-xl p-2 font-bold outline-none cursor-pointer [&>option]:text-black">
            <option value="ar">عربي</option><option value="en">English</option><option value="ur">اردو</option>
          </select>
        </div>

        {/* Logo Accent Year Override */}
        <div className="p-4 bg-white/10 dark:bg-black/20 rounded-2xl border border-black/10 dark:border-white/10 shadow-inner space-y-3">
          <div className="flex items-center gap-4">
            <ShieldAlert size={18} className="text-indigo-500 shrink-0" />
            <div>
              <span className="font-bold text-sm block">{t('logoAccent') || 'Logo Accent'}</span>
              <span className="text-[9px] opacity-50 font-bold">{t('logoThemeAuto') || 'Auto by year'}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { year: null, label: t('logoThemeAuto') || 'Auto' },
              ...Object.entries(YEAR_THEMES).map(([yr, th]) => ({ year: Number(yr), label: `${yr} — ${th.label}` })),
            ].map(({ year, label }) => {
              const th = year ? YEAR_THEMES[year] : getYearTheme(null);
              const isActive = logoYearOverride === year;
              return (
                <button
                  key={year ?? 'auto'}
                  onClick={() => setLogoYearOverride?.(year)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-[9px] font-bold transition-all ${isActive ? 'bg-white/20 border-black/20 dark:border-white/30 shadow-md' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                >
                  <div className={`w-5 h-5 rounded-lg bg-gradient-to-br ${th.from} ${th.to} shrink-0`} style={{ boxShadow: `0 2px 8px rgba(${th.glowRgb},0.5)` }}></div>
                  <span className="truncate opacity-80 flex-1 text-start">{label}</span>
                  {isActive && <Check size={10} className="shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </GlassCard>
      <button onClick={onLogout} className="w-full bg-red-500/10 border border-red-500/20 py-4 rounded-2xl font-black text-red-600 dark:text-red-400 flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all">
        <LogOut size={20}/> {t('logout')}
      </button>
    </div>
  );
}

export function UserProfile({ user, onLogout, t, isRtl }) {
  return (
    <div className={`max-w-xl mx-auto space-y-6 animate-in slide-in-from-${isRtl ? 'right' : 'left'}-8 duration-300`}>
      <div><h2 className="text-2xl font-black">{t('myProfile')}</h2><p className="text-xs font-bold opacity-60 mt-1">{t('accountDetails')}</p></div>
      <GlassCard className="p-8 flex flex-col items-center">
        <div className="w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-black/10 dark:border-white/20 shadow-2xl mb-5 bg-white/10 backdrop-blur-md">
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'M')}&background=random&color=fff&bold=true&size=128`} alt="Profile Large" className="w-full h-full object-cover" />
        </div>
        <h3 className="text-2xl font-black">{user?.name || t('userName')}</h3>
        <span className="bg-white/10 text-[10px] font-bold px-4 py-1.5 rounded-full mt-2 border border-black/10 dark:border-white/20 backdrop-blur-sm">{user?.role ? t(user.role) : t('userRole')}</span>
        <div className="w-full mt-8 space-y-3">
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm"><User size={20} className="opacity-50"/><div><p className="text-[10px] font-bold opacity-50 mb-0.5">{t('fullNameLbl')}</p><p className="text-sm font-bold">{user?.name}</p></div></div>
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-black/10 dark:border-white/10 shadow-sm"><ShieldAlert size={20} className="opacity-50"/><div><p className="text-[10px] font-bold opacity-50 mb-0.5">{t('roleLbl')}</p><p className="text-sm font-bold">{user?.role ? t(user.role) : t('userRole')}</p></div></div>
        </div>
      </GlassCard>
      <GlassButton danger onClick={onLogout} className="w-full py-4"><LogOut size={18} /> {t('logout')}</GlassButton>
    </div>
  );
}

export function PrintablePermitView({ permit, close, t, isRtl }) {
  useEffect(() => { setTimeout(() => { window.print(); }, 500); }, []);

  const getTBTData = (type) => {
    if(!type) return t('tbtDefault');
    if(type.includes('Hot') || type.includes('ساخنة')) return t('tbtHot');
    if(type.includes('Confined') || type.includes('مغلقة')) return t('tbtConfined');
    if(type.includes('Lifting') || type.includes('رفع')) return t('tbtLifting');
    if(type.includes('Electrical') || type.includes('كهربائية')) return t('tbtElectrical');
    return t('tbtDefault');
  };

  const tbtItems = permit.customTBT && permit.customTBT.length > 0 ? permit.customTBT : getTBTData(permit.type);

  return (
    <div className="fixed inset-0 z-[100] bg-white text-black overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="print:hidden sticky top-0 bg-slate-100 shadow-sm border-b border-slate-200 p-4 flex justify-between items-center z-10"><div><h2 className="font-bold text-slate-800">{t('printView')}</h2></div><div className="flex gap-2"><button onClick={close} className="px-4 py-2 bg-slate-300 hover:bg-slate-400 rounded-lg text-sm font-bold text-slate-800 transition-colors">{t('closeBtn')}</button><button onClick={() => window.print()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-bold text-white flex items-center gap-2 transition-colors"><Printer size={16}/> {t('printDoc')}</button></div></div>
      <div className="p-8 max-w-4xl mx-auto bg-white my-8 border border-slate-300 shadow-xl print:shadow-none print:border-none print:m-0 print:p-0">
        <div className="flex justify-between items-center border-b-4 border-black pb-6 mb-8"><div className="flex items-center gap-3"><ShieldAlert size={40} className="text-black" /><div><h1 className="text-3xl font-black uppercase">{t('appName')} PRO SYSTEM</h1><p className="text-sm font-bold tracking-widest text-slate-500">{t('ptwDocTitle')}</p></div></div><div className="text-right"><p className="text-lg font-bold">{t('permitNo')} <span className="text-red-600">{permit.id}</span></p><p className="text-sm font-medium">{t('dateLbl')} {new Date().toLocaleDateString()}</p></div></div>

        <div className="mb-6 bg-slate-50 p-4 border border-slate-200">
          <h2 className="text-lg font-bold mb-4 uppercase border-b border-slate-300 pb-2">{t('genInfo')}</h2>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <div className="flex justify-between border-b border-slate-200 pb-1"><span className="font-bold">{t('permitType')}:</span> <span>{permit.type}</span></div>
            <div className="flex justify-between border-b border-slate-200 pb-1"><span className="font-bold">{t('permitLoc')}:</span> <span>{permit.location}</span></div>
            <div className="col-span-2 flex justify-between border-b border-slate-200 pb-1 mt-2">
              <span className="font-bold">{t('workDescLbl')}:</span>
              <span className="text-right max-w-[75%] font-medium text-slate-700">{permit.workDescription || '--'}</span>
            </div>
          </div>
        </div>

        <div className="mb-6 bg-slate-50 p-4 border border-slate-200"><h2 className="text-lg font-bold mb-4 uppercase border-b border-slate-300 pb-2">{t('manpowerLbl')}</h2><div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm"><div className="flex justify-between border-b border-slate-200 pb-1"><span className="font-bold">{t('workersCount')}:</span> <span>{permit.workersCount}</span></div><div className="flex justify-between border-b border-slate-200 pb-1"><span className="font-bold">{t('superCount')}:</span> <span>{permit.supervisorsCount}</span></div></div></div>

        <div className="mb-6 bg-slate-50 p-4 border border-slate-200">
          <h2 className="text-lg font-bold mb-4 uppercase border-b border-slate-300 pb-2 flex justify-between items-center">
            <span>{t('tbtSessionLbl')}</span>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded">{permit.customTBT ? t('aiGenHazards') : t('autoGenHazards')}</span>
          </h2>
          <div className="text-sm space-y-4">
            <p className="flex justify-between border-b border-slate-200 pb-2"><span className="font-bold">{t('tbtTopicDiscussed')}</span> <span className="w-2/3 text-slate-800 font-medium">{permit.type} {t('hazardsControls')}</span></p>
            <p className="flex justify-between border-b border-slate-200 pb-2"><span className="font-bold">{t('conductedBy')}</span> <span className="w-2/3 text-slate-800 font-medium">{permit.engineerName} / {permit.supervisorName}</span></p>

            <div className="mt-4">
              <span className="font-bold block mb-3 text-red-700">{t('keyHazards')}</span>
              <ul className="space-y-2 mb-6 text-black">
                {Array.isArray(tbtItems) && tbtItems.map((item, idx) => (
                  <li key={idx} className="font-medium flex gap-2"><CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" /> <span>{item}</span></li>
                ))}
              </ul>

              <span className="font-bold block mb-3 text-slate-600 border-t border-slate-300 pt-4">{t('manualNotes')}</span>
              <ul className="list-disc ml-6 space-y-4">
                <li className="border-b border-dashed border-slate-400 pb-2 w-full text-transparent">_</li>
                <li className="border-b border-dashed border-slate-400 pb-2 w-full text-transparent">_</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t-2 border-dashed border-slate-400">
          <div className="text-center"><div className="h-16 mb-2 border-b border-black"></div><p className="font-bold text-sm">{t('execEng')}</p></div>
          <div className="text-center"><div className="h-16 mb-2 border-b border-black"></div><p className="font-bold text-sm">{t('hseDepartment')}</p></div>
        </div>
      </div>
    </div>
  );
}

export function PrintableListView({ data, listType, columns, close, t, isRtl }) {
  useEffect(() => { setTimeout(() => { window.print(); }, 800); }, []);

  let title = '';
  if (listType === 'permits') title = t('ptwTitle');
  if (listType === 'reports') title = t('recTitle');
  if (listType === 'equipments') title = t('eqTitle');

  return (
    <div className="fixed inset-0 z-[100] bg-white text-black overflow-y-auto p-4 sm:p-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="print:hidden mb-6 flex justify-between items-center bg-slate-100 p-4 rounded-xl border border-slate-300">
        <h2 className="font-bold text-slate-800">{t('printView')} <span className="text-xs text-slate-500 block font-normal mt-1">{t('printPref')}</span></h2>
        <div className="flex gap-2">
          <button onClick={close} className="px-4 py-2 bg-slate-300 hover:bg-slate-400 rounded-lg text-sm font-bold">{t('closeBtn')}</button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold flex items-center gap-2"><Printer size={16}/> {t('printDoc')}</button>
        </div>
      </div>

      <div className="max-w-[100%] mx-auto overflow-x-auto">
        <div className="text-center mb-6 border-b-2 border-black pb-4 flex justify-between items-end">
          <div className="text-start">
            <h1 className="text-2xl font-black uppercase text-slate-800">{title}</h1>
            <p className="text-xs font-bold text-slate-500 mt-1">{t('appName')} PRO SYSTEM - {t('detailReport')}</p>
          </div>
          <p className="font-bold text-sm">{t('dateLbl')} {new Date().toLocaleDateString()}</p>
        </div>

        <table className="w-full text-[10px] sm:text-xs border-collapse border border-slate-300 shadow-sm print:text-[9px]">
          <thead className="bg-slate-800 text-white print:bg-slate-200 print:text-black">
            <tr>{columns.map(c => <th key={c.k} className="border border-slate-300 p-2 sm:p-3 font-bold text-start whitespace-nowrap">{c.l}</th>)}</tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                {columns.map(c => {
                  let cellValue = row[c.k];
                  cellValue = t(cellValue) !== cellValue ? t(cellValue) : cellValue;
                  return <td key={c.k} className="border border-slate-300 p-2 sm:p-3 text-slate-700 font-medium max-w-[150px] truncate hover:whitespace-normal hover:break-words print:whitespace-normal print:break-words">{cellValue || '--'}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {data.length === 0 && <p className="text-center p-8 text-slate-500 font-bold border border-t-0 border-slate-300">{t('noDataPrint')}</p>}
      </div>
    </div>
  );
}