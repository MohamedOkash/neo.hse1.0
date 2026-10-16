# 🛡️ HSE Management System — نظام إدارة الصحة والسلامة

## ⚡ البدء السريع

### المتطلبات
- **Node.js 18+** — [تحميل](https://nodejs.org)
- **Git** — للتحكم بالإصدارات

### الخطوات

#### 1. استنساخ المستودع
```bash
git clone <repo-url>
cd hse-standalone-export
```

#### 2. تثبيت المكتبات
```bash
npm install
```

#### 3. إعداد المفاتيح الحساسة
```bash
cp .env.example .env.local
```

**⚠️ مهم:** اقرأ [SETUP_GUIDE.md](./SETUP_GUIDE.md) لتعبئة المفاتيح الآمنة

#### 4. تشغيل في الطور التطويري
```bash
npm run dev
```

ثم افتح: **http://localhost:3000**

---

## 📦 الأوامر الأخرى

```bash
# بناء للإنتاج
npm run build

# معاينة البناء المنتج
npm run preview
```

---

## 🔐 الأمان

✅ **المفاتيح الحساسة محمية:**
- `.env.local` مخفي في `.gitignore`
- `.env.example` يوفر نموذجاً آمناً
- لا يوجد أسرار في الكود المصدري

⚠️ **لا تفعل أبداً:**
- ❌ التزم بـ `.env` في Git
- ❌ شارك المفاتيح عبر البريد الإلكتروني
- ❌ انسخ المفاتيح في الكود

---

## 📚 التوثيق

| الملف | الوصف |
|------|-------|
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | دليل الإعداد والمفاتيح الحساسة |
| [AUDIT_REPORT.md](./AUDIT_REPORT.md) | تقرير المراجعة الشامل |
| `.env.example` | نموذج ملف البيئة |

---

## 🛠️ البنية

```
├── src/
│   ├── App.jsx           # المكون الرئيسي
│   ├── pages/            # الصفحات الرئيسية
│   ├── components/       # المكونات المعاد استخدامها
│   ├── services/         # Firebase و Gemini
│   ├── utils/            # أدوات مساعدة
│   └── locales/          # الترجمات (العربية/الإنجليزية)
├── public/               # ملفات ثابتة
├── dist/                 # البناء المنتج (Generated)
├── .env.example          # نموذج البيئة
├── .gitignore            # ملفات مخفية من Git
└── vite.config.js        # إعدادات Vite
```

---

## 🔄 سير العمل

1. **تطوير محلي:** `npm run dev`
2. **اختبار:** `npm run build && npm run preview`
3. **نشر:** `firebase deploy`

---

## 🚨 الدعم

- 📧 [التواصل](mailto:support@example.com)
- 🐛 [الإبلاغ عن أخطاء](https://github.com/issues)
- 💡 [الاقتراحات](https://github.com/discussions)

---

**آخر تحديث:** 2026-05-21
