import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker } from "./services/offlineManager";

createRoot(document.getElementById("root")!).render(<App />);

// تسجيل Service Worker للـ PWA + Offline support
registerServiceWorker();
