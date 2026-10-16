// src/constants/permitWorkflow.js
// نظام workflow للتصاريح — مستخرج من ConstructFlow

export const PERMIT_STATUS = {
  DRAFT:        'permitDraft',
  SUBMITTED:    'permitSubmitted',
  UNDER_REVIEW: 'permitUnderReview',
  APPROVED:     'permitApproved',
  REJECTED:     'permitRejected',
  ACTIVE:       'permitActive',
  CLOSED:       'permitClosed',
  EXPIRED:      'permitExpired',
};

export const PERMIT_STATUS_LABELS = {
  [PERMIT_STATUS.DRAFT]:        'مسودة',
  [PERMIT_STATUS.SUBMITTED]:    'مقدَّم',
  [PERMIT_STATUS.UNDER_REVIEW]: 'قيد المراجعة',
  [PERMIT_STATUS.APPROVED]:     'معتمد',
  [PERMIT_STATUS.REJECTED]:     'مرفوض',
  [PERMIT_STATUS.ACTIVE]:       'نشط',
  [PERMIT_STATUS.CLOSED]:       'مغلق',
  [PERMIT_STATUS.EXPIRED]:      'منتهي',
};

// الأدوار المتوافقة مع مشروع HSE الأصلي
const ROLES_COMPAT = {
  SAFETY:          'roleSafety',
  SUPERVISOR:      'roleSupervisor',
  PROJECT_MANAGER: 'rolePM',
  ADMIN:           'roleAdmin',
  // دعم أدوار ConstructFlow أيضاً
  SAFETY_ENGINEER:  'safety_engineer',
  PM_CF:            'project_manager',
};

export const PERMIT_TRANSITIONS = {
  [PERMIT_STATUS.DRAFT]: [
    { next: PERMIT_STATUS.SUBMITTED, label: 'تقديم', roles: [ROLES_COMPAT.SAFETY, ROLES_COMPAT.SAFETY_ENGINEER] },
  ],
  [PERMIT_STATUS.SUBMITTED]: [
    { next: PERMIT_STATUS.UNDER_REVIEW, label: 'بدء المراجعة', roles: [ROLES_COMPAT.PROJECT_MANAGER, ROLES_COMPAT.PM_CF, ROLES_COMPAT.ADMIN] },
  ],
  [PERMIT_STATUS.UNDER_REVIEW]: [
    { next: PERMIT_STATUS.APPROVED, label: 'اعتماد',  roles: [ROLES_COMPAT.PROJECT_MANAGER, ROLES_COMPAT.PM_CF, ROLES_COMPAT.ADMIN] },
    { next: PERMIT_STATUS.REJECTED, label: 'رفض',     roles: [ROLES_COMPAT.PROJECT_MANAGER, ROLES_COMPAT.PM_CF, ROLES_COMPAT.ADMIN] },
  ],
  [PERMIT_STATUS.APPROVED]: [
    { next: PERMIT_STATUS.ACTIVE,  label: 'تفعيل',  roles: [ROLES_COMPAT.SAFETY, ROLES_COMPAT.SAFETY_ENGINEER] },
    { next: PERMIT_STATUS.EXPIRED, label: 'إنهاء',  roles: [ROLES_COMPAT.PROJECT_MANAGER, ROLES_COMPAT.PM_CF, ROLES_COMPAT.SAFETY, ROLES_COMPAT.ADMIN] },
  ],
  [PERMIT_STATUS.ACTIVE]: [
    { next: PERMIT_STATUS.CLOSED,  label: 'إغلاق',  roles: [ROLES_COMPAT.PROJECT_MANAGER, ROLES_COMPAT.PM_CF, ROLES_COMPAT.SAFETY, ROLES_COMPAT.ADMIN] },
    { next: PERMIT_STATUS.EXPIRED, label: 'إنهاء',  roles: [ROLES_COMPAT.PROJECT_MANAGER, ROLES_COMPAT.PM_CF, ROLES_COMPAT.SAFETY, ROLES_COMPAT.ADMIN] },
  ],
  [PERMIT_STATUS.REJECTED]: [
    { next: PERMIT_STATUS.DRAFT, label: 'إعادة صياغة', roles: [ROLES_COMPAT.SAFETY, ROLES_COMPAT.SAFETY_ENGINEER] },
  ],
};

/** يحوّل الحالات القديمة للمشروع الأصلي إلى نظام الـ workflow الجديد */
export function normalizePermitStatus(status) {
  if (!status) return PERMIT_STATUS.DRAFT;
  if (Object.values(PERMIT_STATUS).includes(status)) return status;
  // خرائط توافق مع الحالات القديمة في المشروع الأصلي
  const map = {
    active:        PERMIT_STATUS.ACTIVE,
    statusActive:  PERMIT_STATUS.ACTIVE,
    expired:       PERMIT_STATUS.EXPIRED,
    stopped:       PERMIT_STATUS.CLOSED,
    pending:       PERMIT_STATUS.SUBMITTED,
    statusPending: PERMIT_STATUS.SUBMITTED,
    approved:      PERMIT_STATUS.APPROVED,
    rejected:      PERMIT_STATUS.REJECTED,
  };
  return map[status] || PERMIT_STATUS.DRAFT;
}

/** يرجع الانتقالات المتاحة للمستخدم الحالي */
export function getAvailablePermitTransitions(status, role) {
  const normalized = normalizePermitStatus(status);
  return (PERMIT_TRANSITIONS[normalized] || []).filter((t) => t.roles.includes(role));
}
