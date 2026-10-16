import React from 'react';
import { X } from 'lucide-react';

export const GlassCard = ({ children, className = '', onClick }) => (
  <div onClick={onClick} className={`bg-gradient-to-br from-white/40 to-white/10 dark:from-white/10 dark:to-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.15),inset_0_2px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.1)] rounded-[2rem] ${onClick ? 'cursor-pointer hover:-translate-y-1 active:scale-95 transition-all duration-300' : ''} ${className}`}>
    {children}
  </div>
);

export const GlassInput = ({ ...props }) => (
  <input {...props} className={`w-full bg-white/40 dark:bg-black/30 border border-white/60 dark:border-white/10 rounded-xl p-3.5 text-sm text-slate-800 dark:text-white placeholder-slate-500/70 dark:placeholder-white/50 shadow-[inset_0_3px_6px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_3px_6px_rgba(0,0,0,0.3)] focus:bg-white/70 dark:focus:bg-white/10 outline-none focus:ring-2 focus:ring-indigo-400/50 transition-all font-bold ${props.className || ''}`} />
);

export const GlassButton = ({ children, primary, danger, success, className = '', ...props }) => {
  let base = "bg-gradient-to-b from-white/50 to-white/20 dark:from-white/20 dark:to-white/5 text-slate-800 dark:text-white border-white/60 dark:border-white/20 border-b-[4px] border-b-black/10 dark:border-b-black/50 active:border-b-0 active:translate-y-[4px]";
  if (primary) base = "bg-gradient-to-b from-indigo-400 to-indigo-600 hover:from-indigo-300 hover:to-indigo-500 text-white border-indigo-400 border-b-[4px] border-b-indigo-800 active:border-b-0 active:translate-y-[4px] shadow-[0_8px_20px_rgba(99,102,241,0.4),inset_0_2px_1px_rgba(255,255,255,0.4)]";
  if (danger) base = "bg-gradient-to-b from-red-400 to-red-600 hover:from-red-300 hover:to-red-500 text-white border-red-400 border-b-[4px] border-b-red-800 active:border-b-0 active:translate-y-[4px] shadow-[0_8px_20px_rgba(239,68,68,0.4),inset_0_2px_1px_rgba(255,255,255,0.4)]";
  if (success) base = "bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-white border-emerald-400 border-b-[4px] border-b-emerald-800 active:border-b-0 active:translate-y-[4px] shadow-[0_8px_20px_rgba(16,185,129,0.4),inset_0_2px_1px_rgba(255,255,255,0.4)]";
  
  return (
    <button {...props} className={`backdrop-blur-md rounded-2xl font-black transition-all duration-200 flex items-center justify-center gap-2 border shadow-sm ${base} ${className}`}>
      {children}
    </button>
  );
};

export const ModalWrapper = ({ children, onClose, title, subTitle }) => (
  <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-xl z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div className="bg-white/60 dark:bg-black/30 w-full sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-black/10 dark:border-white/10 max-h-[92vh] overflow-y-auto custom-scrollbar backdrop-blur-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
       <div className="w-12 h-1.5 bg-black/20 dark:bg-white/20 rounded-full mx-auto mb-6 sm:hidden"></div>
       <div className="flex justify-between items-start mb-6 border-b border-black/10 dark:border-white/10 pb-5">
         <div><h2 className="text-xl font-black text-slate-800 dark:text-white">{title}</h2>{subTitle && <p className="text-[10px] font-bold opacity-60 mt-1">{subTitle}</p>}</div>
         <button onClick={onClose} className="bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 p-2.5 rounded-full backdrop-blur-md transition-all text-slate-800 dark:text-white"><X size={18}/></button>
       </div>
       {children}
    </div>
  </div>
);
