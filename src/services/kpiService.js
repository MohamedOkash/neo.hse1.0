// src/services/kpiService.js
// حساب مؤشرات السلامة الدولية — LTIF · TRIR · DART · Near Miss Rate
// المرجع: OSHA Recordkeeping Standard 29 CFR 1904 + ISO 45001

// ─────────────────────────────────────────────────
// الثابت العالمي: 200,000 ساعة عمل = 100 عامل × 2000 ساعة/سنة
// ─────────────────────────────────────────────────
const BASE_HOURS = 200_000;

/**
 * يصنّف البلاغ حسب معايير OSHA
 * recordable  → أي حادث يحتاج علاجاً طبياً فوق الإسعافات الأولى
 * lostTime    → غياب عن العمل > 0 يوم
 * dart        → Days Away Restricted or Transferred
 * nearMiss    → حادث وشيك
 */
function classifyReport(report) {
  const type     = (report.reportType   || '').toLowerCase();
  const severity = (report.severity     || '').toLowerCase();
  const lostDays = Number(report.lostWorkDays ?? report.daysLost ?? 0);
  const isNear   = type.includes('near') || type.includes('وشيك');
  const isCritical = severity.includes('critical') || severity.includes('حرج');
  const isHigh     = severity.includes('high')     || severity.includes('عالي');
  return {
    isNearMiss:   isNear,
    isRecordable: !isNear && (isCritical || isHigh || lostDays > 0),
    isLostTime:   lostDays > 0,
    isDart:       lostDays > 0 || (report.restricted ?? false),
    lostDays,
  };
}

/**
 * يحسب جميع KPIs بناءً على البلاغات وساعات العمل
 * @param {Array}  reports     - قائمة البلاغات
 * @param {number} manHours    - إجمالي ساعات العمل الفعلية
 * @param {number} workers     - عدد العمال (لتقدير الساعات إن لم تُعطَ)
 * @param {number} workingDays - أيام العمل (لتقدير الساعات)
 */
export function calculateKPIs(reports = [], manHours = 0, workers = 0, workingDays = 0) {
  // تقدير ساعات العمل إذا لم تُعطَ
  const hours = manHours > 0
    ? manHours
    : workers > 0 && workingDays > 0
      ? workers * workingDays * 8
      : BASE_HOURS; // افتراضي للمقارنة

  const classified = reports.map(classifyReport);

  const lostTimeIncidents = classified.filter(r => r.isLostTime).length;
  const recordable        = classified.filter(r => r.isRecordable).length;
  const dartCases         = classified.filter(r => r.isDart).length;
  const nearMisses        = classified.filter(r => r.isNearMiss).length;
  const totalLostDays     = classified.reduce((sum, r) => sum + r.lostDays, 0);
  const totalIncidents    = classified.filter(r => !r.isNearMiss).length;

  const safe = (val) => isFinite(val) && !isNaN(val) ? val : 0;

  return {
    // ── المؤشرات الدولية القياسية ──────────────────────────────
    LTIF:    safe(+(lostTimeIncidents / hours * BASE_HOURS).toFixed(2)), // Lost Time Injury Frequency
    TRIR:    safe(+(recordable        / hours * BASE_HOURS).toFixed(2)), // Total Recordable Incident Rate
    DART:    safe(+(dartCases         / hours * BASE_HOURS).toFixed(2)), // Days Away / Restricted / Transferred
    LTISR:   safe(+(totalLostDays     / hours * BASE_HOURS).toFixed(2)), // Lost Time Injury Severity Rate
    NMFR:    safe(+(nearMisses        / hours * BASE_HOURS).toFixed(2)), // Near Miss Frequency Rate

    // ── الأرقام الخام (للعرض) ──────────────────────────────────
    manHours:           Math.round(hours),
    lostTimeIncidents,
    recordableIncidents: recordable,
    dartCases,
    nearMisses,
    totalLostDays,
    totalIncidents,
    totalReports:       reports.length,

    // ── مؤشر الأداء (0-100) ───────────────────────────────────
    safetyScore: Math.max(0, Math.round(
      100
      - (lostTimeIncidents * 15)
      - (recordable        * 8)
      - (dartCases         * 5)
      + (nearMisses        * 2)  // near miss = ثقافة إيجابية
    )),
  };
}

/** معيار الصناعة للمقارنة (متوسط قطاع البناء عالمياً) */
export const INDUSTRY_BENCHMARKS = {
  LTIF: 2.5,
  TRIR: 3.0,
  DART: 1.8,
  NMFR: 5.0,
};

/** يحدد لون المؤشر بناءً على مقارنته بالمعيار */
export function kpiStatus(key, value) {
  const bench = INDUSTRY_BENCHMARKS[key];
  if (!bench) return 'neutral';
  if (value === 0)          return 'excellent';
  if (value <= bench * 0.5) return 'good';
  if (value <= bench)       return 'warning';
  return 'danger';
}

/** يبني لقطة KPI شهرية للتخزين في Firestore */
export function buildKpiSnapshot(reports, manHours, workers, month) {
  const kpis = calculateKPIs(reports, manHours, workers);
  return {
    month,   // 'YYYY-MM'
    ...kpis,
    snapshotAt: new Date().toISOString(),
  };
}
