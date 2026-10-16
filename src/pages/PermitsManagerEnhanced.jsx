// src/pages/PermitsManagerEnhanced.jsx
// مدير التصاريح المحسّن — يدمج Workflow + نظام الموافقات من ConstructFlow
import React, { useState } from 'react';
import {
  Plus, MessageSquare, Flame, CheckCircle, Printer,
  PenTool, ArrowRight, Send, Download, Clock, ShieldAlert
} from 'lucide-react';
import {
  getAvailablePermitTransitions,
  normalizePermitStatus,
  PERMIT_STATUS_LABELS,
} from '../constants/permitWorkflow.js';

// ─── Glass UI مدمجة ───
const GlassCard  = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-white/80 bg-white/90 shadow-xl shadow-zinc-200/40 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/80 dark:shadow-black/50 ${className}`}>{children}</div>
);
const GlassInput = (props) => (
  <input {...props} className={`w-full rounded-xl border border-zinc-200/80 bg-white/70 px-4 py-2.5 text-sm font-bold outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-white/5 dark:text-white ${props.className || ''}`} />
);
const GlassBtn = ({ children, primary, className = '', ...rest }) => (
  <button {...rest}
    className={`rounded-xl font-bold transition-all flex items-center justify-center gap-2 border disabled:opacity-50 ${primary ? 'border-transparent bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30' : 'border-zinc-200/50 bg-white/70 dark:border-white/10 dark:bg-white/5 dark:text-white'} ${className}`}
  >{children}</button>
);

export function PermitsManagerEnhanced({
  permits = [],
  requests = [],
  openModal,
  openReqModal,
  openPrint,
  exportCSV,
  exportPDF,
  t,
  isRtl,
  canIssuePermit,
  addNote,
  replyReq,
  onTransition,
  user,
}) {
  const [subTab, setSubTab]           = useState('permits');
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [noteText, setNoteText]       = useState('');

  const tf = (k) => (t ? t(k) || k : k);

  const submitNote = (id) => {
    if (noteText.trim()) addNote(id, noteText);
    setActiveNoteId(null);
    setNoteText('');
  };

  const submitReply = (id) => {
    if (noteText.trim()) replyReq(id, noteText);
    setActiveNoteId(null);
    setNoteText('');
  };

  const pendingReqs = requests.filter(r => r.status === 'pendingReq').length;
  const currentData = subTab === 'permits' ? permits : requests;

  return (
    <div className="max-w-xl mx-auto space-y-5 animate-in fade-in duration-300" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-black">{tf('ptwTitle') !== 'ptwTitle' ? tf('ptwTitle') : 'تصاريح العمل'}</h2>
          <p className="text-xs font-bold opacity-60 mt-1">{tf('ptwSub') !== 'ptwSub' ? tf('ptwSub') : 'إدارة تصاريح العمل والطلبات'}</p>
        </div>
        <div className="flex gap-2">
          {exportCSV && currentData.length > 0 && (
            <button onClick={() => exportCSV(subTab, currentData)}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] font-bold transition-all">
              <Download size={14} /> Excel
            </button>
          )}
          {exportPDF && currentData.length > 0 && (
            <button onClick={() => exportPDF('pdf', subTab, currentData)}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 rounded-xl text-[10px] font-bold transition-all">
              <Printer size={14} /> PDF
            </button>
          )}
          {canIssuePermit
            ? <GlassBtn primary onClick={openModal} className="w-10 h-10 p-0 rounded-xl"><Plus size={22} /></GlassBtn>
            : <GlassBtn onClick={openReqModal} className="px-4 py-2 text-xs"><MessageSquare size={16} /> {tf('newReq') !== 'newReq' ? tf('newReq') : 'طلب تصريح'}</GlassBtn>
          }
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/20 p-1 rounded-2xl shadow-sm">
        <button onClick={() => setSubTab('permits')}
          className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition-all ${subTab === 'permits' ? 'bg-white/20 shadow-md' : 'opacity-60 hover:opacity-100'}`}>
          {tf('ptwTab') !== 'ptwTab' ? tf('ptwTab') : 'التصاريح'}
        </button>
        <button onClick={() => setSubTab('requests')}
          className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${subTab === 'requests' ? 'bg-white/20 shadow-md' : 'opacity-60 hover:opacity-100'}`}>
          {tf('reqTab') !== 'reqTab' ? tf('reqTab') : 'الطلبات'}
          {pendingReqs > 0 && (
            <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full">{pendingReqs}</span>
          )}
        </button>
      </div>

      {/* ─── التصاريح ─── */}
      {subTab === 'permits' && (
        <div className="space-y-4 animate-in fade-in">
          {permits.map((permit, index) => {
            const wfStatus    = normalizePermitStatus(permit?.workflowStatus || permit?.status);
            const transitions = getAvailablePermitTransitions(wfStatus, user?.role || 'worker');
            const statusLabel = PERMIT_STATUS_LABELS[wfStatus] || wfStatus;

            return (
              <GlassCard key={`${permit?.id || 'p'}-${index}`} className="p-5 border-s-4 border-s-indigo-500 dark:border-s-indigo-400">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <div className="p-2.5 rounded-xl bg-white/10 border border-black/10 dark:border-white/20">
                      <Flame size={20} className="text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{permit?.type || 'تصريح'}</h3>
                      <p className="text-[10px] font-bold opacity-60 mt-0.5">{permit?.id || '--'}</p>
                      {permit?.location && (
                        <p className="text-[10px] opacity-50 mt-0.5">{permit.location}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex gap-1 items-center">
                      <CheckCircle size={10} />
                      {statusLabel}
                    </span>
                    <button onClick={() => openPrint && openPrint(permit)}
                      className="text-[9px] bg-white/10 hover:bg-black/5 dark:hover:bg-white/20 px-2 py-1 rounded-lg font-bold flex items-center gap-1 border border-black/10 dark:border-white/20 transition-all">
                      <Printer size={10} /> {tf('print') !== 'print' ? tf('print') : 'طباعة'}
                    </button>
                  </div>
                </div>

                {/* ملاحظة PM */}
                {permit?.pmNote && (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-3.5 rounded-2xl mt-3">
                    <p className="text-[10px] font-bold mb-1 flex items-center gap-1.5 opacity-70">
                      <PenTool size={12} /> {tf('pmNoteLbl') !== 'pmNoteLbl' ? tf('pmNoteLbl') : 'توجيه الإدارة'}
                    </p>
                    <p className="text-xs font-bold leading-relaxed">{permit.pmNote}</p>
                  </div>
                )}

                {/* أزرار الـ Workflow */}
                {transitions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {transitions.map((tr) => (
                      <GlassBtn key={tr.next} onClick={() => onTransition(permit, tr.next)} className="px-3 py-2 text-[10px]">
                        <ArrowRight size={12} className={isRtl ? 'rotate-180' : ''} />
                        {tr.label}
                      </GlassBtn>
                    ))}
                  </div>
                )}

                {/* زر إضافة ملاحظة */}
                {addNote && activeNoteId !== permit.id && (
                  <button onClick={() => setActiveNoteId(permit.id)}
                    className="mt-3 w-full py-2 border border-dashed border-black/20 dark:border-white/20 rounded-xl text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-1.5">
                    <PenTool size={13} /> {tf('addNote') !== 'addNote' ? tf('addNote') : 'إضافة ملاحظة'}
                  </button>
                )}
                {activeNoteId === permit.id && (
                  <div className="mt-2 flex gap-2 animate-in fade-in">
                    <GlassInput value={noteText} onChange={e => setNoteText(e.target.value)}
                      placeholder={tf('writeNote') !== 'writeNote' ? tf('writeNote') : 'اكتب ملاحظة...'} />
                    <GlassBtn primary onClick={() => submitNote(permit.id)} className="px-4 text-xs">
                      <Send size={16} />
                    </GlassBtn>
                  </div>
                )}
              </GlassCard>
            );
          })}
          {permits.length === 0 && (
            <p className="text-center opacity-50 text-xs py-10 font-bold">
              {tf('noActivePermits') !== 'noActivePermits' ? tf('noActivePermits') : 'لا توجد تصاريح حتى الآن.'}
            </p>
          )}
        </div>
      )}

      {/* ─── الطلبات ─── */}
      {subTab === 'requests' && (
        <div className="space-y-4 animate-in fade-in">
          {requests.map((req) => (
            <GlassCard key={req.id} className="p-5 border-s-4 border-s-blue-500 dark:border-s-blue-400">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 border border-black/10 dark:border-white/20 p-2.5 rounded-xl">
                    <MessageSquare size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">{req.sender}</p>
                    <p className="text-[9px] opacity-60 mt-0.5">{req.role} • {req.time}</p>
                  </div>
                </div>
                <span className={`text-[9px] font-bold px-3 py-1 rounded-full border ${req.status === 'pendingReq'
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                  : 'bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30'}`}>
                  {tf(req.status)}
                </span>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-black/10 dark:border-white/10 text-xs font-medium leading-relaxed">
                {req.text}
              </div>

              {req.reply && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl mt-2 ms-4 border-s-2 border-s-blue-400">
                  <p className="text-[10px] font-bold opacity-70 mb-1.5">{tf('safetyReplyLbl') !== 'safetyReplyLbl' ? tf('safetyReplyLbl') : 'رد السلامة'}</p>
                  <p className="text-xs font-bold leading-relaxed">{req.reply}</p>
                </div>
              )}

              {canIssuePermit && !req.reply && activeNoteId !== req.id && (
                <button onClick={() => setActiveNoteId(req.id)}
                  className="w-full mt-2 py-2.5 border border-dashed border-black/20 dark:border-white/30 rounded-xl text-xs font-bold hover:bg-black/5 dark:hover:bg-white/10 transition-all">
                  {tf('replyBtn') !== 'replyBtn' ? tf('replyBtn') : 'رد على الطلب'}
                </button>
              )}
              {activeNoteId === req.id && canIssuePermit && (
                <div className="mt-2 flex gap-2 animate-in fade-in ms-4">
                  <GlassInput value={noteText} onChange={e => setNoteText(e.target.value)}
                    placeholder={tf('replyPlace') !== 'replyPlace' ? tf('replyPlace') : 'اكتب الرد...'} />
                  <GlassBtn primary onClick={() => submitReply(req.id)} className="px-4 text-xs">
                    <Send size={16} />
                  </GlassBtn>
                </div>
              )}
            </GlassCard>
          ))}
          {requests.length === 0 && (
            <p className="text-center opacity-50 text-xs py-10 font-bold">
              {tf('noRequests') !== 'noRequests' ? tf('noRequests') : 'لا توجد طلبات.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
