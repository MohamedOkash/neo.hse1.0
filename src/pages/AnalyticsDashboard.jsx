// src/pages/AnalyticsDashboard.jsx
// لوحة التحليلات التفاعلية — KPIs قياسية + رسوم بيانية + مقارنة بالمعيار الدولي
import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { TrendingDown, TrendingUp, Minus, AlertTriangle, Clock, CheckCircle, Activity, Users } from 'lucide-react';
import { calculateKPIs, kpiStatus, INDUSTRY_BENCHMARKS } from '../services/kpiService';

// ── helpers ───────────────────────────────────────────────────
const GlassCard = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-white/80 bg-white/90 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/80 ${className}`}>
    {children}
  </div>
);

const STATUS_COLORS = {
  excellent: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-300', border: 'border-emerald-500/30', bar: '#10b981' },
  good:      { bg: 'bg-blue-500/10',    text: 'text-blue-600    dark:text-blue-300',    border: 'border-blue-500/30',    bar: '#3b82f6' },
  warning:   { bg: 'bg-amber-500/10',   text: 'text-amber-600   dark:text-amber-300',   border: 'border-amber-500/30',   bar: '#f59e0b' },
  danger:    { bg: 'bg-red-500/10',     text: 'text-red-600     dark:text-red-300',     border: 'border-red-500/30',     bar: '#ef4444' },
  neutral:   { bg: 'bg-zinc-500/10',    text: 'text-zinc-600    dark:text-zinc-300',    border: 'border-zinc-500/30',    bar: '#71717a' },
};

const SEVERITY_COLORS = { riskCritical: '#ef4444', riskHigh: '#f97316', riskMedium: '#f59e0b', riskLow: '#10b981' };
const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6'];

function KpiCard({ label, value, unit = '', benchmark, benchmarkLabel, statusKey, trend, description }) {
  const st = kpiStatus(statusKey, value);
  const c  = STATUS_COLORS[st] || STATUS_COLORS.neutral;
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = statusKey === 'NMFR'
    ? (trend === 'up' ? 'text-emerald-500' : 'text-red-500')
    : (trend === 'down' ? 'text-emerald-500' : trend === 'up' ? 'text-red-500' : 'text-zinc-400');

  return (
    <GlassCard className={`p-5 border ${c.border}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
          <p className={`text-3xl font-black mt-1 ${c.text}`}>{value}<span className="text-sm ml-1 opacity-60">{unit}</span></p>
        </div>
        <div className={`p-2 rounded-xl ${c.bg}`}>
          <Icon size={20} className={trendColor} />
        </div>
      </div>
      {benchmark !== undefined && (
        <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/10">
          <div className="flex justify-between text-[10px] font-bold opacity-60 mb-1">
            <span>{benchmarkLabel}</span><span>{benchmark}</span>
          </div>
          <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10">
            <div
              className={`h-full rounded-full transition-all ${st === 'danger' ? 'bg-red-500' : st === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, benchmark > 0 ? (value / (benchmark * 2)) * 100 : 100)}%` }}
            />
          </div>
        </div>
      )}
      {description && <p className="text-[10px] font-bold opacity-50 mt-2">{description}</p>}
    </GlassCard>
  );
}

// ── بيانات التوزيع الشهري من البلاغات ─────────────────────────
function buildMonthlyData(reports) {
  const map = {};
  reports.forEach(r => {
    const d = new Date(r.createdAt || r.timestamp || Date.now());
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map[key]) map[key] = { month: key, violations: 0, nearMiss: 0, closed: 0 };
    const isNear = (r.reportType || '').toLowerCase().includes('near');
    if (isNear) map[key].nearMiss++;
    else        map[key].violations++;
    if (r.status === 'closed' || r.status === 'statusClosed') map[key].closed++;
  });
  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
}

function buildSeverityData(reports, t) {
  const map = {};
  reports.forEach(r => {
    const s = r.severity || 'riskMedium';
    map[s] = (map[s] || 0) + 1;
  });
  const labels = {
    riskCritical: t('riskCritical'),
    riskHigh: t('riskHigh'),
    riskMedium: t('riskMedium'),
    riskLow: t('riskLow'),
  };
  return Object.entries(map).map(([k, v]) => ({ name: labels[k] || k, value: v, color: SEVERITY_COLORS[k] || '#94a3b8' }));
}

function buildPermitStatusData(permits, t) {
  const map = {};
  permits.forEach(p => {
    const s = p.workflowStatus || p.status || 'unknown';
    map[s] = (map[s] || 0) + 1;
  });
  const labels = {
    permitActive: t('permitActive'), permitApproved: t('permitApproved'), permitDraft: t('permitDraft'),
    permitClosed: t('permitClosed'), permitExpired: t('permitExpired'), permitSubmitted: t('permitSubmitted'),
    open: t('statusOpen'), active: t('statusActive'), expired: t('permitExpired'), stopped: t('stopped'),
  };
  return Object.entries(map).map(([k, v], i) => ({ name: labels[k] || k, value: v, color: CHART_COLORS[i % CHART_COLORS.length] }));
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900/95 border border-white/10 rounded-xl p-3 text-white shadow-xl">
      <p className="text-[10px] font-black opacity-60 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-bold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

// ── الصفحة الرئيسية ────────────────────────────────────────────
export function AnalyticsDashboard({ reports = [], permits = [], correctiveActions = [], equipments = [], t, isRtl }) {
  const [manHours, setManHours] = useState(0);
  const [workers,  setWorkers]  = useState(0);

  const kpis        = useMemo(() => calculateKPIs(reports, manHours, workers), [reports, manHours, workers]);
  const monthlyData = useMemo(() => buildMonthlyData(reports), [reports]);
  const sevData     = useMemo(() => buildSeverityData(reports, t), [reports, t]);
  const permitData  = useMemo(() => buildPermitStatusData(permits, t), [permits, t]);

  const openActions    = correctiveActions.filter(a => a.status !== 'caClosed').length;
  const closureRate    = correctiveActions.length
    ? Math.round(correctiveActions.filter(a => a.status === 'caClosed').length / correctiveActions.length * 100)
    : 0;

  return (
    <div className={`max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300`} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-xl font-black">{t('analyticsDashboardTitle')}</h2>
          <p className="text-xs font-bold opacity-60 mt-1">{t('analyticsDashboardSub')}</p>
        </div>
        {/* إدخال ساعات العمل */}
        <div className="flex gap-3">
          <div className="text-center">
            <p className="text-[9px] font-black opacity-50 mb-1">{t('workHours')}</p>
            <input type="number" value={manHours || ''} onChange={e => setManHours(+e.target.value)}
              placeholder="200000"
              className="w-24 text-center rounded-xl border border-zinc-200/80 bg-white/70 px-2 py-1.5 text-xs font-bold dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </div>
          <div className="text-center">
            <p className="text-[9px] font-black opacity-50 mb-1">{t('workersCount')}</p>
            <input type="number" value={workers || ''} onChange={e => setWorkers(+e.target.value)}
              placeholder="100"
              className="w-20 text-center rounded-xl border border-zinc-200/80 bg-white/70 px-2 py-1.5 text-xs font-bold dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label={t('ltif')} value={kpis.LTIF} benchmark={INDUSTRY_BENCHMARKS.LTIF}
          benchmarkLabel={t('industryBenchmark')} statusKey="LTIF" description={t('ltifDesc')} />
        <KpiCard label={t('trir')} value={kpis.TRIR} benchmark={INDUSTRY_BENCHMARKS.TRIR}
          benchmarkLabel={t('industryBenchmark')} statusKey="TRIR" description={t('trirDesc')} />
        <KpiCard label={t('dart')} value={kpis.DART} benchmark={INDUSTRY_BENCHMARKS.DART}
          benchmarkLabel={t('industryBenchmark')} statusKey="DART" description={t('dartDesc')} />
        <KpiCard label={t('nearMiss')} value={kpis.nearMisses} unit={t('case')} 
          statusKey="NMFR" description={t('kpiNearMissDescription')} />
      </div>

      {/* ── الأرقام الخام ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <AlertTriangle size={16} />, label: t('totalIncidents'),    val: kpis.totalIncidents,    color: 'text-red-500' },
          { icon: <Clock         size={16} />, label: t('lostDays'), val: kpis.totalLostDays,   color: 'text-amber-500' },
          { icon: <CheckCircle   size={16} />, label: t('closureRate'),    val: `${closureRate}%`,    color: 'text-emerald-500' },
          { icon: <Activity      size={16} />, label: t('registeredHours'),      val: kpis.manHours.toLocaleString(), color: 'text-blue-500' },
        ].map((item, i) => (
          <GlassCard key={i} className="p-4 flex items-center gap-3">
            <span className={item.color}>{item.icon}</span>
            <div>
              <p className="text-sm font-black">{item.val}</p>
              <p className="text-[10px] font-bold opacity-60">{item.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* ── الرسوم البيانية ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* توزيع الحوادث الشهرية */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-black mb-4">{t('monthlyIncidents')}</h3>
          {monthlyData.length === 0
            ? <p className="text-center py-8 text-xs opacity-40 font-bold">{t('noDataEnough')}</p>
            : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} barSize={14}>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="violations" name={t('violation')}   fill="#ef4444" radius={[4,4,0,0]} />
                  <Bar dataKey="nearMiss"   name={t('nearMiss')} fill="#f59e0b" radius={[4,4,0,0]} />
                  <Bar dataKey="closed"     name={t('closed')}      fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </GlassCard>

        {/* توزيع الخطورة */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-black mb-4">{t('severityDistribution')}</h3>
          {sevData.length === 0
            ? <p className="text-center py-8 text-xs opacity-40 font-bold">{t('noData')}</p>
            : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={180}>
                  <PieChart>
                    <Pie data={sevData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" strokeWidth={0}>
                      {sevData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {sevData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                        <span className="text-[11px] font-bold">{item.name}</span>
                      </div>
                      <span className="text-[11px] font-black opacity-70">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        </GlassCard>

        {/* حالة التصاريح */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-black mb-4">{t('permitStatus')}</h3>
          {permitData.length === 0
            ? <p className="text-center py-8 text-xs opacity-40 font-bold">{t('noData')}</p>
            : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={180}>
                  <PieChart>
                    <Pie data={permitData} cx="50%" cy="50%" outerRadius={75} dataKey="value" strokeWidth={0}>
                      {permitData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {permitData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                        <span className="text-[11px] font-bold">{item.name}</span>
                      </div>
                      <span className="text-[11px] font-black opacity-70">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        </GlassCard>

        {/* الإجراءات التصحيحية */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-black mb-4">{t('correctiveActionsTitle')}</h3>
          {correctiveActions.length === 0
            ? <p className="text-center py-8 text-xs opacity-40 font-bold">{t('noData')}</p>
            : (() => {
              const statusMap = {};
              correctiveActions.forEach(a => { statusMap[a.status] = (statusMap[a.status]||0) + 1; });
              const labels = {
                caOpen: t('caOpen'), caInProgress: t('caInProgress'), caPendingReview: t('caPendingReview'), caClosed: t('caClosed')
              };
              const barData = Object.entries(statusMap).map(([k,v]) => ({ name: labels[k]||k, count: v }));
              return (
                <>
                  <div className="flex justify-between mb-3">
                    <div className="text-center">
                      <p className="text-xl font-black text-red-500">{openActions}</p>
                      <p className="text-[9px] font-bold opacity-60">{t('openActions')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-black text-emerald-500">{closureRate}%</p>
                      <p className="text-[9px] font-bold opacity-60">{t('closureRate')}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-black">{correctiveActions.length}</p>
                      <p className="text-[9px] font-bold opacity-60">{t('totalActions')}</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={barData} barSize={20} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 9, fill:'#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill:'#94a3b8' }} tickLine={false} axisLine={false} width={70} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#6366f1" radius={[0,4,4,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              );
            })()
          }
        </GlassCard>

      </div>

      {/* مقارنة بالمعيار الدولي */}
      <GlassCard className="p-5">
        <h3 className="text-sm font-black mb-1">{t('compareIndustryTitle')}</h3>
        <p className="text-[10px] opacity-50 font-bold mb-4">{t('compareIndustrySource')}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['LTIF','TRIR','DART'].map(key => {
            const val   = kpis[key];
            const bench = INDUSTRY_BENCHMARKS[key];
            const pct   = bench > 0 ? Math.min(200, Math.round(val / bench * 100)) : 0;
            const color = kpiStatus(key, val);
            const c     = STATUS_COLORS[color] || STATUS_COLORS.neutral;
            return (
              <div key={key} className={`p-4 rounded-2xl border ${c.border} ${c.bg}`}>
                <div className="flex justify-between mb-2">
                  <span className={`text-xs font-black ${c.text}`}>{key}</span>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${c.border} ${c.text}`}>
                    {pct <= 50 ? t('industryExcellent') : pct <= 100 ? t('industryAcceptable') : t('industryDanger')}
                  </span>
                </div>
                <p className={`text-2xl font-black ${c.text}`}>{val}</p>
                <p className="text-[9px] opacity-60 font-bold mt-1">{t('industryLabel')}: {bench} | {t('youAre')}: {pct}% {t('benchmark')}</p>
              </div>
            );
          })}
          <div className="p-4 rounded-2xl border border-zinc-200/50 bg-zinc-500/5">
            <p className="text-[9px] font-black opacity-60 mb-2">{t('safetyScore')}</p>
            <p className={`text-2xl font-black ${kpis.safetyScore >= 80 ? 'text-emerald-500' : kpis.safetyScore >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
              {kpis.safetyScore}
            </p>
            <p className="text-[9px] opacity-60 font-bold mt-1">{t('outOf')} 100</p>
          </div>
        </div>
      </GlassCard>

    </div>
  );
}
