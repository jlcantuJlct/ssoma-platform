"use client";

import { useEffect } from "react";

const ESSENTIAL_ROUTES = [
  '/',
  '/dashboard',
  '/inspections',
  '/public/reporte-ac',
  '/ats',
  '/petar',
  '/epp',
  '/reporte-ac'
];

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registrado:", reg.scope);
          // Si estamos online, precargar silenciosamente las herramientas clave para dejarlas listas offline
          if (navigator.onLine) {
            setTimeout(() => {
              ESSENTIAL_ROUTES.forEach(route => {
                fetch(route, { credentials: 'same-origin' }).catch(() => {});
              });
            }, 1500);
          }
        })
        .catch((err) => {
          console.warn("[PWA] Error registrando Service Worker:", err);
        });
    }
  }, []);

  return null;
}
