"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registrado con éxito en scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[PWA] Error registrando Service Worker:", err);
        });
    }
  }, []);

  return null;
}
