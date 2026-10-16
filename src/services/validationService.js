// src/services/validationService.js
// خدمة التحقق من صحة المدخلات — مستخرجة من ConstructFlow

const MAX_TEXT       = 2000;
const MAX_PHOTO_BYTES = 850000;

export function sanitizeText(value, maxLength = MAX_TEXT) {
  return String(value ?? '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeRecord(record) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      typeof value === 'string' &&
      key.toLowerCase().includes('photo') &&
      value.startsWith('data:image/')
        ? value
        : typeof value === 'string'
          ? sanitizeText(value)
          : value,
    ]),
  );
}

function photoIsSafe(value) {
  if (!value) return true;
  return (
    typeof value === 'string' &&
    value.startsWith('data:image/') &&
    value.length <= MAX_PHOTO_BYTES
  );
}

function validateRequired(data, fields, errors) {
  fields.forEach((field) => {
    if (!sanitizeText(data[field])) errors.push(`الحقل ${field} مطلوب.`);
  });
}

function result(errors, data = null) {
  return { isValid: errors.length === 0, errors, data };
}

export function validatePermit(data) {
  const errors = [];
  validateRequired(data, ['type', 'location', 'workDescription', 'supervisorName'], errors);
  return result(errors, sanitizeRecord(data));
}

export function validateReport(data) {
  const errors = [];
  validateRequired(data, ['title', 'reportType'], errors);
  if (!['Violation', 'Near Miss'].includes(data.reportType))
    errors.push('نوع التقرير غير صحيح.');
  if (!photoIsSafe(data.photoBase64))
    errors.push('الصورة كبيرة جدًا أو نوعها غير مدعوم.');
  return result(errors, sanitizeRecord(data));
}

export function validateNote(note) {
  const clean = sanitizeText(note, 600);
  const errors = [];
  if (clean.length < 3) errors.push('النص قصير جدًا.');
  return result(errors, clean);
}
