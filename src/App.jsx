import React, { useState, useEffect, useCallback, useMemo } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  limit,
  orderBy,
} from "firebase/firestore";
import {
  Home,
  FileText,
  AlertTriangle,
  BookOpen,
  Camera,
  ShieldAlert,
  Truck,
  Settings,
  Sparkles,
  ListChecks,
  BarChart2,
  Search,
  WifiOff,
  Trash2,
} from "lucide-react";

// ✅ Firebase يجي من ملف واحد — مفيش config متكرر
import { auth, db, isFirebaseConfigured, missingFirebaseKeys } from "./services/firebase";

import { translations } from "./locales/translations";
import { exportToCSV } from "./utils/helpers";
import {
  LoginScreen,
  HomeDashboard,
  PermitsManager,
  ReportsCenter,
  EquipmentManager,
  KnowledgeBase,
  SettingsDashboard,
  UserProfile,
  PrintablePermitView,
  PrintableListView,
} from "./pages/AppPages";
import {
  NewPermitModal,
  NewReportModal,
  NewEquipmentModal,
  NewRequestModal,
  ChecklistModal,
  MaintenanceModal,
} from "./components/modals/AppModals";
import { AdvancedPermitModal } from "./components/modals/AdvancedPermitModal";
import { AIAssistantPage } from "./pages/AIAssistantPage";
import { FormBuilderPage } from "./pages/FormBuilderPage";
import { SafetyWorkspace } from "./pages/SafetyWorkspace";
import { ReportsCenterEnhanced } from "./pages/ReportsCenterEnhanced";
import { PermitsManagerEnhanced } from "./pages/PermitsManagerEnhanced";
import { PermitIssuancePage } from "./pages/PermitIssuancePage";
import { AnalyticsDashboard } from "./pages/AnalyticsDashboard";
import { IncidentInvestigation } from "./pages/IncidentInvestigation";
import { flushPendingWrites, listenForSyncMessages } from "./services/offlineManager";
import { ROLES, STATUSES, SEVERITY, SAFETY_SCORE_DEDUCTIONS } from "./constants";
import { CORRECTIVE_STATUS } from "./constants/correctiveActions";
import { writeAuditLog, AUDIT_ACTIONS } from "./services/auditService";

// ─────────────────────────────────────────────────────────────
// حساب مؤشر الأمان من البيانات الحقيقية (مش رقم ثابت)
// ✅ FIXED: استخدام ثوابت بدلاً من hardcoded strings
// ─────────────────────────────────────────────────────────────
function calcSafetyScore(permits, reports, equipments) {
  let score = 100;

  // كل تقرير مفتوح يخصم نقاط حسب خطورته
  reports.forEach((r) => {
    if (r.status === STATUSES.REPORT.OPEN) {
      if (r.severity === SEVERITY.CRITICAL) score -= SAFETY_SCORE_DEDUCTIONS.CRITICAL_REPORT;
      else if (r.severity === SEVERITY.HIGH) score -= SAFETY_SCORE_DEDUCTIONS.HIGH_REPORT;
      else if (r.severity === SEVERITY.MEDIUM) score -= SAFETY_SCORE_DEDUCTIONS.MEDIUM_REPORT;
      else score -= SAFETY_SCORE_DEDUCTIONS.LOW_REPORT;
    }
  });

  // تصاريح منتهية الصلاحية أو متوقفة تخصم
  permits.forEach((p) => {
    if (p.status === STATUSES.PERMIT.STOPPED) score -= SAFETY_SCORE_DEDUCTIONS.STOPPED_PERMIT;
    if (p.approvalStatus === STATUSES.APPROVAL.REJECTED) score -= SAFETY_SCORE_DEDUCTIONS.REJECTED_PERMIT;
  });

  // معدات تحتاج صيانة تخصم
  equipments.forEach((eq) => {
    if (eq.status === STATUSES.EQUIPMENT.MAINTENANCE) score -= SAFETY_SCORE_DEDUCTIONS.EQUIPMENT_MAINTENANCE;
  });

  return Math.max(0, Math.min(100, score));
}

export default function App() {
  const [isUiAuthenticated, setIsUiAuthenticated] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);

  const [activeTab, setActiveTab] = useState("home");
  const [lang, setLang] = useState("ar");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // ── Offline/Online detection + Auto-sync ────────────────────
  useEffect(() => {
    const goOnline = async () => {
      setIsOnline(true);
      if (db) {
        const flushed = await flushPendingWrites(db, setDoc, doc);
        if (flushed > 0) pushNotification(`✅ تمت مزامنة ${flushed} عملية معلّقة`);
      }
    };
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    listenForSyncMessages(goOnline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);
  const [theme, setTheme] = useState("light");

  // ✅ safetyScore بيتحسب من البيانات الحقيقية
  const [permits, setPermits] = useState([]);
  const [reports, setReports] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [correctiveActions, setCorrectiveActions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [usersList, setUsersList] = useState([]); // لتخزين مواقع كل المستخدمين

  // ✅ FIXED: استخدام useMemo لتجنب إعادة الحساب غير الضرورية
  const safetyScore = useMemo(
    () => calcSafetyScore(permits, reports, equipments),
    [permits, reports, equipments]
  );

  const [weather, setWeather] = useState({
    temp: "--",
    condition: "⏳",
    wind: "--",
    advice: "جاري التحميل...",
  });
  const [locationName, setLocationName] = useState("جاري التحديد...");
  const [locationCoords, setLocationCoords] = useState(null);

  const [showPermitModal, setShowPermitModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(null);

  const [permitToPrint, setPermitToPrint] = useState(null);
  const [listToPrint, setListToPrint] = useState(null);

  if (!isFirebaseConfigured) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center p-6">
        <div className="max-w-xl rounded-[2rem] border border-red-200 bg-white/90 p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Firebase غير مهيأ</h1>
          <p className="text-sm leading-relaxed text-slate-700 mb-4">
            الرجاء ملء متغيرات البيئة التالية في ملف <code className="rounded bg-slate-100 px-1.5 py-0.5">.env</code> ثم إعادة تشغيل الخادم:
          </p>
          <ul className="mb-4 list-disc list-inside space-y-2 text-sm text-slate-600">
            {missingFirebaseKeys.map((key) => (
              <li key={key}>{key}</li>
            ))}
          </ul>
          <p className="text-xs text-slate-500">
            يمكنك استخدام <code className="rounded bg-slate-100 px-1.5 py-0.5">.env.example</code> كنموذج.
          </p>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 1. مراقبة الدخول + جلب الدور من Firestore (مش localStorage)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsUiAuthenticated(true);

        // ✅ جلب الدور من Firestore مش من localStorage
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          const serverData = userDoc.exists() ? userDoc.data() : {};

          const displayName =
            user.displayName ||
            serverData.name ||
            user.email.split("@")[0];

          const role = serverData.role || "roleSafety";

          setLoggedInUser({
            uid: user.uid,
            name: displayName,
            email: user.email,
            role,
          });
        } catch (err) {
          console.error("خطأ في جلب بيانات المستخدم:", err);
          setLoggedInUser({
            uid: user.uid,
            name: user.displayName || user.email.split("@")[0],
            email: user.email,
            role: "roleSafety",
          });
        }
      } else {
        setIsUiAuthenticated(false);
        setLoggedInUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 2. الاشتراك في البيانات الحقيقية من Firestore
  // ✅ FIXED: صيغة onSnapshot صحيحة مع معالجة أخطاء صحيحة
  // ✅ OPTIMIZED: إضافة filters و limits للأداء الأفضل
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubs = [
      // ✅ تحميل آخر 100 تصريح مرتبة بـ التاريخ الأحدث أولاً
      onSnapshot(
        query(
          collection(db, "permits"),
          orderBy("createdAt", "desc"),
          limit(100)
        ),
        (snapshot) => {
          setPermits(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (error) => {
          console.error("Error fetching permits:", error);
        }
      ),
      // ✅ تحميل آخر 100 تقرير مفتوح أولاً
      onSnapshot(
        query(
          collection(db, "reports"),
          where("status", "==", "open"),
          orderBy("createdAt", "desc"),
          limit(100)
        ),
        (snapshot) => {
          setReports(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (error) => {
          console.error("Error fetching reports:", error);
        }
      ),
      // ✅ تحميل آخر 50 معدة مع تصنيف الحالة
      onSnapshot(
        query(
          collection(db, "equipments"),
          orderBy("lastMaintenance", "desc"),
          limit(50)
        ),
        (snapshot) => {
          setEquipments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (error) => {
          console.error("Error fetching equipments:", error);
        }
      ),
      // ✅ تحميل آخر 50 طلب
      onSnapshot(
        query(
          collection(db, "requests"),
          orderBy("createdAt", "desc"),
          limit(50)
        ),
        (snapshot) => {
          setRequests(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (error) => {
          console.error("Error fetching requests:", error);
        }
      ),
      // ✅ تحميل آخر 50 إشعار
      onSnapshot(
        query(
          collection(db, "notifications"),
          orderBy("timestamp", "desc"),
          limit(50)
        ),
        (snapshot) => {
          setNotifications(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (error) => {
          console.error("Error fetching notifications:", error);
        }
      ),
      // ✅ تحميل قائمة المستخدمين
      onSnapshot(
        collection(db, "users"),
        (snapshot) => {
          setUsersList(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (error) => {
          console.error("Error fetching users:", error);
        }
      ),
      // ✅ تحميل الإجراءات التصحيحية
      onSnapshot(
        query(
          collection(db, "correctiveActions"),
          orderBy("createdAt", "desc"),
          limit(100)
        ),
        (snapshot) => {
          setCorrectiveActions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (error) => {
          console.error("Error fetching correctiveActions:", error);
        }
      ),
    ];

    // ✅ FIXED: معالجة آمنة للـ unsubscribe
    return () => {
      unsubs.forEach((unsub) => {
        if (typeof unsub === "function") {
          unsub();
        }
      });
    };
  }, [firebaseUser]);

  // ─────────────────────────────────────────────────────────────
  // 3. GPS + الطقس الحقيقي (Open-Meteo — مجاني بدون API Key)
  // ✅ FIXED: استخدام AbortController بدلاً من AbortSignal.timeout
  // ✅ FIXED: معالجة أخطاء Geolocation تفصيلية
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const fetchWeather = async (lat, lng) => {
      try {
        // ✅ FIXED: استخدام AbortController متوافق مع جميع المتصفحات
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`,
            { signal: controller.signal }
          );
          clearTimeout(timeout);

          if (!res.ok) {
            if (mounted) setLocationName("خطأ في الطقس / Weather API error");
            return;
          }

          const { current_weather: cw } = await res.json();
          if (!mounted) return;

          const wc = cw.weathercode;
          let condition = "☀️";
          if (wc >= 1 && wc <= 3) condition = "⛅";
          if (wc >= 51) condition = "🌧️";
          if (wc >= 71 && wc <= 77) condition = "❄️";
          if (wc >= 80) condition = "⛈️";

          let advice = "مستقر / Stable";
          if (cw.windspeed > 30) advice = "⛔ رياح شديدة جداً / Stop Lifting";
          else if (cw.windspeed > 25) advice = "⚠️ رياح قوية / High Wind";
          else if (cw.temperature > 40) advice = "⛔ حرارة خطيرة / Heat Emergency";
          else if (cw.temperature > 35) advice = "⚠️ حرارة عالية / Heat Alert";

          setWeather({
            temp: Math.round(cw.temperature),
            condition,
            wind: Math.round(cw.windspeed),
            advice,
          });
          setLocationCoords({ lat, lng });
          setLocationName("تم التحديد بالـ GPS ✅");
        } catch (err) {
          clearTimeout(timeout);
          if (err.name === 'AbortError') {
            if (mounted) setLocationName("انتهت مهلة الطقس / Weather timeout");
          } else {
            if (mounted) setLocationName("تعذر تحديد الطقس / Failed to get weather");
          }
        }
      } catch (err) {
        console.error("Weather fetch error:", err);
        if (mounted) setLocationName("خطأ في الطقس");
      }
    };

    // ✅ FIXED: معالجة أخطاء Geolocation تفصيلية
    navigator.geolocation?.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      (error) => {
        if (!mounted) return;

        // معالجة أخطاء محددة
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationName("رجاء السماح بالموقع / Allow location access");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationName("الموقع غير متاح / Position unavailable");
            break;
          case error.TIMEOUT:
            setLocationName("انتهت مهلة الموقع / Location timeout");
            break;
          default:
            setLocationName("خطأ في الموقع / Location error");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => { mounted = false; };
  }, []);
  // رفع موقع المستخدم الحالي لقاعدة البيانات لايف
  useEffect(() => {
    if (firebaseUser && locationCoords) {
      setDoc(doc(db, "users", firebaseUser.uid), {
        lat: locationCoords.lat,
        lng: locationCoords.lng,
        lastSeen: Date.now(),
        name: loggedInUser?.name || firebaseUser.email.split("@")[0],
        role: loggedInUser?.role || "roleSafety"
      }, { merge: true }).catch(console.error);
    }
  }, [firebaseUser, locationCoords, loggedInUser]);

  // ─────────────────────────────────────────────────────────────
  // الأدوار (مستخرجة من Firestore مش localStorage)
  // ─────────────────────────────────────────────────────────────
  const t = useCallback((key) => translations[lang]?.[key] || key, [lang]);
  const isRtl = lang !== "en";
  const isPM = loggedInUser?.role === "rolePM";
  const isWorker = loggedInUser?.role === "roleWorker";
  const isSafety = loggedInUser?.role === "roleSafety";
  const isElectrician = loggedInUser?.role === "roleElectrician";
  const isExec = loggedInUser?.role === "roleStructural" || isElectrician;
  const isSupervisor = loggedInUser?.role === "roleSupervisor";

  const toggleTheme = () => {
    setTheme((t) => t === "light" ? "dark" : t === "dark" ? "ocean" : "light");
  };

  const getBackgroundClass = () => {
    if (theme === "dark") return "from-slate-950 via-indigo-950 to-slate-900 text-white";
    if (theme === "ocean") return "from-blue-950 via-sky-900 to-blue-950 text-white";
    return "from-slate-100 via-blue-50 to-indigo-100 text-slate-800";
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsUiAuthenticated(false);
    setLoggedInUser(null);
    setActiveTab("home");
  };

  // ─────────────────────────────────────────────────────────────
  // Firestore Operations
  // ─────────────────────────────────────────────────────────────
  const pushNotification = async (msg) => {
    const notif = { id: `N-${Date.now()}`, message: msg, timestamp: Date.now(), read: false };
    if (firebaseUser) {
      await setDoc(doc(collection(db, "notifications")), notif);
    } else {
      setNotifications((prev) => [notif, ...prev]);
    }
  };

  const getNotificationRoute = (message) => {
    if (!message || typeof message !== "string") return "home";
    const text = message.toLowerCase();
    if (text.includes("تصريح") || text.includes("permit") || text.includes("approval") || text.includes("approved") || text.includes("refused") || text.includes("rejected")) return "permits";
    if (text.includes("بلاغ") || text.includes("حادث") || text.includes("مخالفة") || text.includes("report") || text.includes("investigation") || text.includes("near miss")) return "reports";
    if (text.includes("معدة") || text.includes("equipment") || text.includes("maintenance") || text.includes("معده")) return "equipment";
    if (text.includes("طلب") || text.includes("request")) return "home";
    if (text.includes("سلامة") || text.includes("safety")) return "safety";
    return "home";
  };

  const markAsRead = async (id) => {
    if (!id) return;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (firebaseUser) {
      try {
        await updateDoc(doc(db, "notifications", id), { read: true });
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (firebaseUser) {
      const unreadNotifications = notifications.filter((n) => !n.read);
      await Promise.all(
        unreadNotifications.map((n) =>
          updateDoc(doc(db, "notifications", n.id), { read: true }).catch((error) => {
            console.error("Error marking notification as read:", error);
          })
        )
      );
    }
    setShowNotifications(false);
  };

  const clearNotifications = async () => {
    if (firebaseUser) {
      await Promise.all(
        notifications.map((n) =>
          deleteDoc(doc(db, "notifications", n.id)).catch((error) => {
            console.error("Error clearing notification:", error);
          })
        )
      );
    }
    setNotifications([]);
    setShowNotifications(false);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification) return;
    await markAsRead(notification.id);
    const route = getNotificationRoute(notification.message);
    setActiveTab(route);
    setShowNotifications(false);
  };

  const handleStopPermit = async (id) => {
    await setDoc(doc(db, "permits", id), {
      status: "stopped",
      closedAt: new Date().toLocaleString("ar-EG"),
      closedBy: loggedInUser?.name,
    }, { merge: true });
    pushNotification(`تم إيقاف التصريح رقم ${id}`);
  };

  const handleCloseReport = async (id) => {
    await setDoc(doc(db, "reports", id), {
      status: "closed",
      closedAt: new Date().toLocaleString("ar-EG"),
      closedBy: loggedInUser?.name,
    }, { merge: true });
    pushNotification(`تم إغلاق البلاغ ${id}`);
  };

  const addPMNoteToReport = async (id, note) => {
    await setDoc(doc(db, "reports", id), { pmNote: note }, { merge: true });
    pushNotification(`توجيه إدارة لتقرير ${id}`);
  };

  const addPMNoteToPermit = async (id, note) => {
    await setDoc(doc(db, "permits", id), { pmNote: note }, { merge: true });
    pushNotification(`توجيه إدارة لتصريح ${id}`);
  };

  const addReplyToRequest = async (id, replyText) => {
    await setDoc(doc(db, "requests", id), { reply: replyText, status: "repliedReq" }, { merge: true });
    pushNotification(`رد من السلامة على طلب ${id}`);
  };

  const handleAddPermit = async (p) => {
    const ref = doc(collection(db, "permits"));
    const permitData = { ...p, id: ref.id, status: "open", workflowStatus: "permitDraft", createdBy: loggedInUser?.uid, createdAt: new Date().toISOString() };
    await setDoc(ref, permitData);
    await writeAuditLog(AUDIT_ACTIONS.PERMIT_CREATED, loggedInUser, "permits", ref.id, { permitType: p.type });
    pushNotification(`تصريح عمل جديد: ${p.type}`);
    setShowPermitModal(false);
  };

  const handleApprovePermit = async (permitId, approverName) => {
    const target = permits.find((p) => p.id === permitId);
    const newLevel = (target?.approvalLevel ?? 0) + 1;
    const isFullyApproved = newLevel >= 3;
    const newHistory = [
      ...(target?.approvalHistory || []),
      { level: newLevel, role: loggedInUser?.role, name: approverName, action: "approved", timestamp: Date.now() },
    ];
    await setDoc(doc(db, "permits", permitId), {
      approvalLevel: newLevel,
      approvalStatus: isFullyApproved ? "approved" : "pending",
      approvalHistory: newHistory,
    }, { merge: true });
    await writeAuditLog(AUDIT_ACTIONS.PERMIT_APPROVED, loggedInUser, "permits", permitId, { level: newLevel, approverName });
    pushNotification(`✅ تصريح ${permitId} اعتمده ${approverName}${isFullyApproved ? " — معتمد بالكامل!" : ""}`);
  };

  const handleRejectPermit = async (permitId, approverName, comment) => {
    const target = permits.find((p) => p.id === permitId);
    const newHistory = [
      ...(target?.approvalHistory || []),
      { level: target?.approvalLevel ?? 0, role: loggedInUser?.role, name: approverName, action: "rejected", comment, timestamp: Date.now() },
    ];
    await setDoc(doc(db, "permits", permitId), {
      approvalStatus: "rejected",
      rejectionComment: comment,
      rejectedBy: approverName,
      approvalHistory: newHistory,
    }, { merge: true });
    await writeAuditLog(AUDIT_ACTIONS.PERMIT_REJECTED, loggedInUser, "permits", permitId, { comment, approverName });
    pushNotification(`❌ تصريح ${permitId} رُفض: ${comment}`);
  };

  // ✅ معالج workflow الجديد — يحرّك التصريح بين حالاته
  const handlePermitWorkflowTransition = async (permit, nextStatus) => {
    if (!db || !permit?.id) return;
    await setDoc(doc(db, "permits", permit.id), {
      workflowStatus: nextStatus,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: loggedInUser?.name || loggedInUser?.uid,
    }, { merge: true });
    await writeAuditLog(AUDIT_ACTIONS.PERMIT_TRANSITIONED, loggedInUser, "permits", permit.id, { from: permit.workflowStatus, to: nextStatus });
    pushNotification(`تصريح ${permit.id}: انتقل إلى ${nextStatus}`);
  };

  const handleAddReport = async (r) => {
    const ref = doc(collection(db, "reports"));
    const reportData = { ...r, id: ref.id, status: "open", createdBy: loggedInUser?.uid, createdAt: new Date().toISOString() };
    await setDoc(ref, reportData);
    await writeAuditLog(AUDIT_ACTIONS.REPORT_CREATED, loggedInUser, "reports", ref.id, { reportType: r.reportType, severity: r.severity });
    pushNotification(`تسجيل ${r.reportType === "Near Miss" ? "حادث وشيك" : "مخالفة"} جديدة.`);
    setShowReportModal(false);
  };

  const handleAddEquipment = async (eq) => {
    const ref = doc(collection(db, "equipments"));
    await setDoc(ref, { ...eq, id: ref.id, createdBy: loggedInUser?.uid, createdAt: new Date().toISOString() });
    await writeAuditLog(AUDIT_ACTIONS.EQUIPMENT_ADDED, loggedInUser, "equipments", ref.id, { name: eq.name });
    pushNotification(`تم تسجيل معدة: ${eq.name}`);
    setShowEquipmentModal(false);
  };

  const handleAddRequest = async (req) => {
    const newReq = {
      ...req,
      sender: loggedInUser?.name || "User",
      role: t(loggedInUser?.role),
      time: new Date().toLocaleTimeString(),
    };
    const ref = doc(collection(db, "requests"));
    await setDoc(ref, { ...newReq, id: ref.id });
    pushNotification(`طلب جديد من ${newReq.sender}`);
    setShowRequestModal(false);
  };

  // ✅ إضافة إجراء تصحيحي جديد مرتبط ببلاغ
  const handleCreateCorrectiveAction = async (actionData) => {
    if (!db) return;
    const ref = doc(collection(db, "correctiveActions"));
    const newAction = {
      ...actionData,
      id: ref.id,
      status: CORRECTIVE_STATUS.OPEN,
      createdAt: new Date().toISOString(),
      createdBy: loggedInUser?.uid || null,
    };
    await setDoc(ref, newAction);
    await writeAuditLog(AUDIT_ACTIONS.ACTION_CREATED, loggedInUser, "correctiveActions", ref.id, { title: actionData.title, sourceId: actionData.sourceId });
    pushNotification(`إجراء تصحيحي جديد: ${actionData.title}`);
  };

  // ✅ تقديم الإجراء التصحيحي للمرحلة التالية
  const handleAdvanceCorrectiveAction = async (action) => {
    if (!db) return;
    const NEXT = {
      [CORRECTIVE_STATUS.OPEN]:           CORRECTIVE_STATUS.IN_PROGRESS,
      [CORRECTIVE_STATUS.IN_PROGRESS]:    CORRECTIVE_STATUS.PENDING_REVIEW,
      [CORRECTIVE_STATUS.PENDING_REVIEW]: CORRECTIVE_STATUS.CLOSED,
    };
    const nextStatus = NEXT[action.status];
    if (!nextStatus) return;
    await setDoc(doc(db, "correctiveActions", action.id), { status: nextStatus, updatedAt: new Date().toISOString() }, { merge: true });
    const auditAction = nextStatus === CORRECTIVE_STATUS.CLOSED ? AUDIT_ACTIONS.ACTION_CLOSED : AUDIT_ACTIONS.ACTION_ADVANCED;
    await writeAuditLog(auditAction, loggedInUser, "correctiveActions", action.id, { from: action.status, to: nextStatus });
    pushNotification(`تم تحديث الإجراء التصحيحي: ${action.title}`);
  };

  const handleSaveChecklist = async (eqId, statusStr, inspectorName) => {
    const timeNow = new Date().toLocaleString(lang === "ar" ? "ar-EG" : "en-US", {
      weekday: "long", year: "numeric", month: "short",
      day: "numeric", hour: "2-digit", minute: "2-digit",
    });
    await setDoc(doc(db, "equipments", eqId), {
      lastInspected: timeNow, status: statusStr, inspector: inspectorName,
    }, { merge: true });
    setShowChecklistModal(null);
  };

  const handleSaveMaintenance = async (eqId, details, photo, inspectorName) => {
    const timeNow = new Date().toLocaleString(lang === "ar" ? "ar-EG" : "en-US", {
      weekday: "long", year: "numeric", month: "short",
      day: "numeric", hour: "2-digit", minute: "2-digit",
    });
    await setDoc(doc(db, "equipments", eqId), {
      status: "statusValid", lastInspected: timeNow,
      inspector: inspectorName, lastFixDetails: details, lastFixPhoto: photo,
    }, { merge: true });
    setShowMaintenanceModal(null);
    pushNotification(`تم صيانة معدة: ${eqId}`);
  };

  const getColumns = (type) => {
    if (type === "permits")
      return [
        { k: "id", l: "ID" }, { k: "type", l: t("permitType") },
        { k: "location", l: t("permitLoc") }, { k: "workersCount", l: "العمال" },
        { k: "supervisorsCount", l: "المشرفين" }, { k: "supervisorName", l: t("supervisor") },
        { k: "engineerName", l: t("execEng") }, { k: "requesterName", l: "طالب التصريح" },
        { k: "validUntil", l: t("validUntil") }, { k: "pmNote", l: "توجيه الإدارة" },
        { k: "status", l: t("statusLbl") },
      ];
    if (type === "reports")
      return [
        { k: "id", l: "ID" }, { k: "reportType", l: t("reportTypeLbl") },
        { k: "title", l: t("descLbl") }, { k: "workerId", l: "ID العامل" },
        { k: "location", l: "موقع GPS" }, { k: "severity", l: t("sevLbl") },
        { k: "pmNote", l: "توجيه الإدارة" }, { k: "status", l: t("statusLbl") },
      ];
    if (type === "equipments")
      return [
        { k: "id", l: "ID" }, { k: "name", l: t("eqNameLbl") },
        { k: "type", l: t("eqTypeLbl") }, { k: "operatorId", l: t("operatorId") },
        { k: "lastInspected", l: t("lastInspected") }, { k: "inspector", l: t("inspectorLbl") },
        { k: "status", l: t("statusLbl") },
      ];
    return [];
  };

  const handleExportCSV = (type, data) => exportToCSV(data, `${type}_export`, getColumns(type), t);

  // ─────────────────────────────────────────────────────────────
  // Login Screen
  // ─────────────────────────────────────────────────────────────
  if (!isUiAuthenticated) {
    return (
      <LoginScreen
        onLogin={(userData) => {
          setIsUiAuthenticated(true);
          setLoggedInUser(userData);
          // ✅ حفظ الدور في Firestore مش localStorage
          if (userData.uid) {
            setDoc(doc(db, "users", userData.uid), {
              name: userData.name,
              email: userData.email,
              role: userData.role,
            }, { merge: true }).catch(console.error);
          }
        }}
        t={t}
        lang={lang}
        setLang={setLang}
        isRtl={isRtl}
        theme={theme}
        setTheme={setTheme}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Main App
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── شريط وضع عدم الاتصال ── */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 bg-amber-500 text-white py-2 px-4 text-xs font-black shadow-lg">
          <WifiOff size={14} />
          وضع عدم الاتصال — ستُحفظ البيانات وتُرفع تلقائياً عند استعادة الشبكة
        </div>
      )}
      <div
        className={`relative flex flex-col h-screen font-sans overflow-hidden print:hidden transition-colors duration-1000 ${!isOnline ? 'pt-8' : ''} ${theme === "dark" || theme === "ocean" ? "dark" : ""} bg-gradient-to-br ${getBackgroundClass()}`}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/20 dark:bg-indigo-600/30 blur-[80px] animate-pulse"></div>
          <div
            className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-400/20 dark:bg-fuchsia-600/30 blur-[80px] animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <main className="relative z-10 flex-1 overflow-y-auto p-4 pt-6 pb-48 lg:pb-32 scroll-smooth">
          {activeTab === "home" && (
            <HomeDashboard
              safetyScore={safetyScore}
              weather={weather}
              locationName={locationName}
              locationCoords={locationCoords}
              permits={permits}
              reports={reports}
              onNavigate={setActiveTab}
              t={t}
              isRtl={isRtl}
              isPM={isPM}
              user={loggedInUser}
              theme={theme}
              toggleTheme={toggleTheme}
              notifications={notifications}
              showNotifications={showNotifications}
              setShowNotifications={setShowNotifications}
              markAsRead={markAsRead}
              markAllAsRead={markAllAsRead}
              clearNotifications={clearNotifications}
              onNotificationClick={handleNotificationClick}
              usersList={usersList}
            />
          )}
          {activeTab === "permits" && (
            <PermitsManagerEnhanced
              permits={permits}
              requests={requests}
              openModal={() => setShowPermitModal(true)}
              openReqModal={() => setShowRequestModal(true)}
              openPrint={(p) => setPermitToPrint(p)}
              exportCSV={(type, d) => handleExportCSV(type, d)}
              exportPDF={(fmt, type, d) => setListToPrint({ type, data: d })}
              t={t}
              isRtl={isRtl}
              canIssuePermit={isSafety}
              addNote={addPMNoteToPermit}
              replyReq={addReplyToRequest}
              onTransition={handlePermitWorkflowTransition}
              user={loggedInUser}
            />
          )}
          {activeTab === "reports" && (
            <ReportsCenterEnhanced
              reports={reports}
              correctiveActions={correctiveActions}
              onCreateCorrectiveAction={handleCreateCorrectiveAction}
              onAdvanceCorrectiveAction={handleAdvanceCorrectiveAction}
              exportCSV={(d) => handleExportCSV("reports", d)}
              exportPDF={() => setListToPrint({ type: "reports", data: reports })}
              t={t}
              isRtl={isRtl}
              addNote={addPMNoteToReport}
              user={loggedInUser}
            />
          )}
          {activeTab === "equipment" && (
            <EquipmentManager
              equipments={equipments}
              openModal={(tab) => setShowEquipmentModal(tab || "heavy")}
              openChecklist={(eq) => setShowChecklistModal(eq)}
              openMaintenance={(eq) => setShowMaintenanceModal(eq)}
              exportCSV={(d) => handleExportCSV("equipments", d)}
              exportPDF={(d) => setListToPrint({ type: "equipments", data: d })}
              t={t}
              isRtl={isRtl}
              canAdd={isSafety || isElectrician}
              isPM={isPM}
              isElectrician={isElectrician}
              user={loggedInUser}
            />
          )}
          {activeTab === "courses" && <KnowledgeBase t={t} isRtl={isRtl} lang={lang} />}
          {activeTab === "settings" && (
            <SettingsDashboard
              user={loggedInUser}
              onLogout={handleLogout}
              t={t}
              isRtl={isRtl}
              theme={theme}
              toggleTheme={toggleTheme}
              lang={lang}
              setLang={setLang}
            />
          )}
          {activeTab === "profile" && (
            <UserProfile user={loggedInUser} onLogout={handleLogout} t={t} isRtl={isRtl} />
          )}
          {activeTab === "ai" && (
            <AIAssistantPage t={t} isRtl={isRtl} permits={permits} reports={reports} />
          )}
          {activeTab === "forms" && (
            <FormBuilderPage t={t} isRtl={isRtl} user={loggedInUser} />
          )}
          {activeTab === "safety" && (
            <SafetyWorkspace
              isRtl={isRtl}
              setActiveTab={setActiveTab}
              permits={permits}
              reports={reports}
              correctiveActions={correctiveActions}
              user={loggedInUser}
              t={t}
              canAddReport={loggedInUser?.role === ROLES.SAFETY || loggedInUser?.role === ROLES.ADMIN}
              canAddPermit={loggedInUser?.role === ROLES.SAFETY || loggedInUser?.role === ROLES.ADMIN}
              onAddReport={() => setShowReportModal(true)}
              onAddPermit={() => setShowPermitModal(true)}
            />
          )}
          {activeTab === "permit-issuance" && (
            <PermitIssuancePage
              t={t}
              isRtl={isRtl}
              lang={lang}
              user={loggedInUser}
              permits={permits}
              onAddPermit={handleAddPermit}
            />
          )}
          {activeTab === "analytics" && (
            <AnalyticsDashboard
              reports={reports}
              permits={permits}
              correctiveActions={correctiveActions}
              equipments={equipments}
              t={t}
              isRtl={isRtl}
            />
          )}
          {activeTab === "investigation" && (
            <IncidentInvestigation
              reports={reports}
              user={loggedInUser}
              t={t}
              isRtl={isRtl}
              onCreateAction={handleCreateCorrectiveAction}
            />
          )}
        </main>

        {/* Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 px-2 pb-2 z-30 pointer-events-none lg:bottom-6">
          <nav className="bg-gradient-to-b from-white/40 to-white/20 dark:from-black/40 dark:to-black/60 backdrop-blur-3xl border border-white/60 dark:border-white/10 rounded-2xl lg:rounded-[2.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.15),inset_0_2px_1px_rgba(255,255,255,0.6)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] border-b-[6px] border-b-black/10 dark:border-b-black/60 flex justify-between items-center gap-1 p-1.5 pointer-events-auto w-full lg:w-auto lg:max-w-4xl lg:mx-auto transition-all">
            <NavItem icon={<Home size={16} />} label={t("home")} isActive={activeTab === "home"} onClick={() => setActiveTab("home")} />
            <NavItem icon={<FileText size={16} />} label={t("permits")} isActive={activeTab === "permits"} onClick={() => setActiveTab("permits")} />
            <NavItem icon={<Truck size={16} />} label={t("equipment")} isActive={activeTab === "equipment"} onClick={() => setActiveTab("equipment")} />

            <NavItem icon={<AlertTriangle size={16} />} label={t("records")} isActive={activeTab === "reports"} onClick={() => setActiveTab("reports")} />
            
            {!isWorker && !isPM ? (
              <button
                onClick={() => setShowReportModal(true)}
                className="flex flex-col items-center justify-center w-11 h-11 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl transition-all font-black bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_8px_16px_rgba(99,102,241,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:shadow-[0_10px_20px_rgba(99,102,241,0.6)] active:translate-y-0.5 border-b-[3px] border-b-indigo-800"
                title={t("reportViolation")}
              >
                <Camera size={18} className="lg:size-5" />
              </button>
            ) : null}

            <NavItem icon={<ShieldAlert size={16} />} label={t("safety") || "سلامة"} isActive={activeTab === "safety"} onClick={() => setActiveTab("safety")} />
            <NavItem icon={<BarChart2 size={16} />} label={t("analytics") || "تحليلات"} isActive={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} />
            <NavItem icon={<Search size={16} />} label={t("investigation") || "تحقيق"} isActive={activeTab === "investigation"} onClick={() => setActiveTab("investigation")} />
            <NavItem icon={<BookOpen size={16} />} label={t("training")} isActive={activeTab === "courses"} onClick={() => setActiveTab("courses")} />
            <NavItem icon={<Settings size={16} />} label={t("settings")} isActive={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
          </nav>
        </div>

        {/* Modals */}
        {showPermitModal && <AdvancedPermitModal closeModal={() => setShowPermitModal(false)} addPermit={handleAddPermit} t={t} isRtl={isRtl} user={loggedInUser} />}
        {showReportModal && <NewReportModal closeModal={() => setShowReportModal(false)} addReport={handleAddReport} t={t} lang={lang} isRtl={isRtl} />}
        {showEquipmentModal && <NewEquipmentModal closeModal={() => setShowEquipmentModal(false)} addEquipment={handleAddEquipment} t={t} isRtl={isRtl} initialTab={typeof showEquipmentModal === "string" ? showEquipmentModal : "heavy"} />}
        {showRequestModal && <NewRequestModal closeModal={() => setShowRequestModal(false)} addReq={handleAddRequest} t={t} isRtl={isRtl} />}
        {showChecklistModal && <ChecklistModal eq={showChecklistModal} closeModal={() => setShowChecklistModal(null)} onSave={handleSaveChecklist} t={t} isRtl={isRtl} user={loggedInUser} />}
        {showMaintenanceModal && <MaintenanceModal eq={showMaintenanceModal} closeModal={() => setShowMaintenanceModal(null)} onSave={handleSaveMaintenance} t={t} isRtl={isRtl} user={loggedInUser} />}
      </div>

      {permitToPrint && <PrintablePermitView permit={permitToPrint} close={() => setPermitToPrint(null)} t={t} isRtl={isRtl} />}
      {listToPrint && <PrintableListView data={listToPrint.data} listType={listToPrint.type} columns={getColumns(listToPrint.type)} close={() => setListToPrint(null)} t={t} isRtl={isRtl} />}
    </>
  );
}

function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-10 h-10 lg:w-11 lg:h-11 rounded-lg lg:rounded-xl transition-all font-black text-center ${isActive
        ? "bg-black/5 dark:bg-black/40 text-indigo-700 dark:text-indigo-400 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] translate-y-0.5"
        : "opacity-60 hover:opacity-100 hover:bg-white/40 dark:hover:bg-white/10"
        }`}
    >
      <div className="mb-0.5">{icon}</div>
      <span className="text-[6.5px] lg:text-[7px] text-center tracking-tighter truncate w-full px-0.5 leading-tight">{label}</span>
    </button>
  );
}
