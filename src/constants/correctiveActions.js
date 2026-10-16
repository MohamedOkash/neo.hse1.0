// src/constants/correctiveActions.js
// نظام الإجراءات التصحيحية — مستخرج من ConstructFlow

export const CORRECTIVE_STATUS = {
  OPEN:           'caOpen',
  IN_PROGRESS:    'caInProgress',
  PENDING_REVIEW: 'caPendingReview',
  CLOSED:         'caClosed',
};

export const CORRECTIVE_STATUS_LABELS_AR = {
  [CORRECTIVE_STATUS.OPEN]:           'مفتوح',
  [CORRECTIVE_STATUS.IN_PROGRESS]:    'قيد التنفيذ',
  [CORRECTIVE_STATUS.PENDING_REVIEW]: 'في انتظار المراجعة',
  [CORRECTIVE_STATUS.CLOSED]:         'مغلق',
};

export const CORRECTIVE_NEXT_STATUS = {
  [CORRECTIVE_STATUS.OPEN]:           CORRECTIVE_STATUS.IN_PROGRESS,
  [CORRECTIVE_STATUS.IN_PROGRESS]:    CORRECTIVE_STATUS.PENDING_REVIEW,
  [CORRECTIVE_STATUS.PENDING_REVIEW]: CORRECTIVE_STATUS.CLOSED,
};

export function getCorrectiveStatusLabel(status, t) {
  // حاوِل ترجمة أولاً عبر دالة t، وارجع للعربي احتياطياً
  const translated = t && t(status);
  if (translated && translated !== status) return translated;
  return CORRECTIVE_STATUS_LABELS_AR[status] || status || 'مفتوح';
}
