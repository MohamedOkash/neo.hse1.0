// ✅ User Roles Constants
export const ROLES = {
  SAFETY: 'roleSafety',
  SUPERVISOR: 'roleSupervisor',
  PROJECT_MANAGER: 'rolePM',
  ADMIN: 'roleAdmin',
};

// Status Constants
export const STATUSES = {
  PERMIT: {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    STOPPED: 'stopped',
  },
  REPORT: {
    OPEN: 'open',
    IN_PROGRESS: 'inProgress',
    CLOSED: 'closed',
    RESOLVED: 'resolved',
  },
  APPROVAL: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },
  EQUIPMENT: {
    OPERATIONAL: 'operational',
    MAINTENANCE: 'statusMaint',
    OUT_OF_SERVICE: 'outOfService',
  },
};

// Severity Levels
export const SEVERITY = {
  CRITICAL: 'riskCritical',
  HIGH: 'riskHigh',
  MEDIUM: 'riskMedium',
  LOW: 'riskLow',
};

// Languages
export const LANGUAGES = {
  AR: 'ar',
  EN: 'en',
  UR: 'ur',
};

// Themes
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

// Default values
export const DEFAULTS = {
  PERMITS_LIMIT: 100,
  REPORTS_LIMIT: 100,
  EQUIPMENTS_LIMIT: 50,
  REQUESTS_LIMIT: 50,
  NOTIFICATIONS_LIMIT: 50,
  WEATHER_TIMEOUT: 6000,
  GEOLOCATION_TIMEOUT: 10000,
  API_RETRY_COUNT: 5,
  API_MAX_DELAY: 10000,
};

// Safety Score Deductions
export const SAFETY_SCORE_DEDUCTIONS = {
  CRITICAL_REPORT: 8,
  HIGH_REPORT: 5,
  MEDIUM_REPORT: 3,
  LOW_REPORT: 1,
  STOPPED_PERMIT: 2,
  REJECTED_PERMIT: 3,
  EQUIPMENT_MAINTENANCE: 4,
};

// Messages
export const MESSAGES = {
  PERMISSION_DENIED: 'Permission denied',
  POSITION_UNAVAILABLE: 'Position unavailable',
  TIMEOUT: 'Request timeout',
  LOCATION_ERROR: 'Location error',
  WEATHER_ERROR: 'Weather API error',
};
