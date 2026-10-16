# 🔐 دليل الإعداد الآمن للمشروع

## ⚠️ تنبيه أمني مهم

**المفاتيح الحساسة لا يجب أن تكون مرئية في الكود أو المستودع!**

---

## 📋 الخطوات

### 1️⃣ استنساخ المستودع

```bash
git clone https://github.com/your-org/hse-management-system.git
cd hse-management-system
npm install
```

### 2️⃣ إنشاء ملف `.env.local`

```bash
# انسخ النموذج
cp .env.example .env.local
```

### 3️⃣ ملء المفاتيح الحساسة

#### 🔑 Firebase Configuration
1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. اختر المشروع الخاص بك
3. اذهب إلى **Project Settings** (⚙️)
4. اختر **Your apps** → **Web App**
5. انسخ البيانات إلى `.env.local`:

```env
VITE_FIREBASE_API_KEY=AIzaSyBL5...
VITE_FIREBASE_AUTH_DOMAIN=hsepro-fefad.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=hsepro-fefad
VITE_FIREBASE_STORAGE_BUCKET=hsepro-fefad.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=707965738335
VITE_FIREBASE_APP_ID=1:707965738335:web:...
```

#### 🤖 Gemini AI Key
1. اذهب إلى [Google AI Studio](https://aistudio.google.com/app/apikeys)
2. اضغط **Create API Key**
3. اختر **Create API key in new Google Cloud project**
4. انسخ المفتاح إلى `.env.local`:

```env
VITE_GEMINI_API_KEY=AIzaSyDicM...
```

### 4️⃣ تشغيل التطبيق

```bash
npm run dev
```

ثم افتح: `http://localhost:3000`

---

## ✅ التحقق من الأمان

```bash
# تأكد أن .gitignore يخفي الملفات الحساسة
cat .gitignore | grep -E "\.env|node_modules"

# تأكد أن .env لم يُرسَل إلى Git
git status
```

---

## 🚨 إذا حدثت مصيبة...

إذا أُرسِلت مفاتيح حساسة بالخطأ:

```bash
# 1. حذف الملف من Git (بدون حذفه محلياً)
git rm --cached .env.local

# 2. عمل commit
git commit -m "Remove sensitive data from tracking"

# 3. دفع التغييرات
git push origin main
```

**ثم أعد توليد المفاتيح في:**
- [Firebase Console](https://console.firebase.google.com)
- [Google AI Studio](https://aistudio.google.com/app/apikeys)

---

## 📚 المراجع

- [Firebase Security Best Practices](https://firebase.google.com/docs/projects/learn-more)
- [Environment Variables in Vite](https://vitejs.dev/guide/env-and-mode.html)
- [Git Security](https://docs.github.com/en/code-security)

---

**آخر تحديث:** 2026-05-21
