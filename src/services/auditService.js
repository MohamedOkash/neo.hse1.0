// src/services/auditService.js
// سجل المراجعة الثابت — لا يمكن تعديله أو حذفه (Immutable Audit Trail)
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export const AUDIT_ACTIONS = {
  // Permits
  PERMIT_CREATED:    'permit.created',
  PERMIT_UPDATED:    'permit.updated',
  PERMIT_TRANSITIONED: 'permit.transitioned',
  PERMIT_APPROVED:   'permit.approved',
  PERMIT_REJECTED:   'permit.rejected',
  PERMIT_CLOSED:     'permit.closed',
  // Reports
  REPORT_CREATED:    'report.created',
  REPORT_CLOSED:     'report.closed',
  REPORT_NOTE_ADDED: 'report.note_added',
  // Corrective Actions
  ACTION_CREATED:    'action.created',
  ACTION_ADVANCED:   'action.advanced',
  ACTION_CLOSED:     'action.closed',
  // Equipment
  EQUIPMENT_ADDED:   'equipment.added',
  EQUIPMENT_INSPECTED: 'equipment.inspected',
  EQUIPMENT_MAINTAINED: 'equipment.maintained',
  // Auth
  USER_LOGIN:        'auth.login',
  USER_LOGOUT:       'auth.logout',
  USER_REGISTERED:   'auth.registered',
};

/**
 * يسجّل عملية في سجل المراجعة — لا يمكن تعديله أو حذفه
 * @param {string} action  - من AUDIT_ACTIONS
 * @param {object} user    - { uid, name, role }
 * @param {string} colName - اسم الـ collection المتأثرة
 * @param {string} docId   - معرّف الوثيقة المتأثرة
 * @param {object} meta    - بيانات إضافية اختيارية
 */
export async function writeAuditLog(action, user, colName, docId, meta = {}) {
  if (!db || !user?.uid) return;
  try {
    const ref = doc(collection(db, 'auditLog'));
    await setDoc(ref, {
      id:         ref.id,
      action,
      userId:     user.uid,
      userName:   user.name  || 'Unknown',
      userRole:   user.role  || 'Unknown',
      collection: colName,
      docId,
      timestamp:  new Date().toISOString(),
      epochMs:    Date.now(),
      ...meta,
    });
  } catch (err) {
    // سجل المراجعة لا يجب أن يعيق العملية الأصلية
    console.warn('[AuditLog] Failed to write:', err.message);
  }
}
