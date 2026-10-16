import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const DAY_NAMES = {
  ar: ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'],
  en: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  ur: ['اتوار','پیر','منگل','بدھ','جمعرات','جمعہ','ہفتہ'],
};
const MONTH_NAMES = {
  ar: ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
  en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  ur: ['جنوری','فروری','مارچ','اپریل','مئی','جون','جولائی','اگست','ستمبر','اکتوبر','نومبر','دسمبر'],
};

export function LiveDateTime({ lang = 'ar', isRtl = true }) {
  const [now, setNow] = useState(new Date());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => { clearInterval(timer); clearTimeout(t); };
  }, []);

  const lk = ['ar','en','ur'].includes(lang) ? lang : 'en';
  const dayName = DAY_NAMES[lk][now.getDay()];
  const month   = MONTH_NAMES[lk][now.getMonth()];
  const day     = now.getDate();
  const year    = now.getFullYear();

  const h24 = now.getHours();
  const mm  = String(now.getMinutes()).padStart(2,'0');
  const ss  = String(now.getSeconds()).padStart(2,'0');
  const h12 = h24 % 12 || 12;
  const ampm = lk === 'ar' ? (h24 >= 12 ? 'م' : 'ص') : lk === 'ur' ? (h24 >= 12 ? 'ش' : 'ص') : (h24 >= 12 ? 'PM' : 'AM');

  const dateStr = `${day} ${month} ${year}`;
  const timeStr = `${String(h12).padStart(2,'0')}:${mm}:${ss}`;

  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 py-2 bg-white/25 dark:bg-black/20 border border-white/50 dark:border-white/10 rounded-2xl backdrop-blur-md shadow-sm transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <Clock size={13} className="text-indigo-500 dark:text-indigo-400 shrink-0 animate-pulse" style={{ animationDuration: '2s' }} />
      <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={isRtl ? 'text-right' : 'text-left'}>
          <div className="text-[8px] font-bold opacity-50 leading-none mb-0.5">{dayName}</div>
          <div className="text-[9px] font-black leading-none">{dateStr}</div>
        </div>
        <div className="w-px h-6 bg-black/10 dark:bg-white/15 shrink-0"></div>
        <div className="text-center" dir="ltr">
          <div className="text-sm font-black tabular-nums leading-none tracking-tight">{timeStr}</div>
          <div className="text-[7px] font-bold opacity-40 text-center leading-none mt-0.5">{ampm}</div>
        </div>
      </div>
    </div>
  );
}
