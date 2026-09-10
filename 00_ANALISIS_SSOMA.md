# 00_ANALISIS_SSOMA.md

## Análisis Arquitectónico - Plataforma SSOMA

He analizado la estructura de carpetas y archivos de este repositorio y aquí te presento el mapeo completo de la plataforma:

### 1. Propósito General del Sistema
La plataforma "SSOMA" (Seguridad, Salud Ocupacional y Medio Ambiente) parece ser un sistema robusto para la gestión y seguimiento de métricas, inspecciones y reportes en campo. Se observa una integración fuerte entre recolección de datos (posiblemente a través de reportes y WhatsApp, dado el archivo `ssoma_whatsapp_robot.py`) y visualización o exportación de documentos (Excel, Word, PDFs).

### 2. Arquitectura y Stack Tecnológico
Basado en los archivos, el proyecto utiliza una arquitectura moderna Full-Stack:

*   **Frontend y Backend (Framework):** Está desarrollado sobre **Next.js** (basado en React y TypeScript), evidenciado por carpetas como `app/`, `components/`, `lib/`, `.next/` y el archivo `next.config.ts`.
*   **Base de Datos:** Usa SQLite localmente (`database.sqlite`), pero los múltiples scripts de parcheo (`patch_db.js`, `check_pg.js`, `check_cols_pg.js`) indican que el sistema en producción probablemente se conecta a una base de datos PostgreSQL (posiblemente en Vercel o Supabase).
*   **Almacenamiento de Archivos (Blobs):** Utiliza Vercel Blob Storage fuertemente para subir y almacenar imágenes o documentos (archivos como `all_blobs.json`, `blobs_backup.json`, `analyze_blobs.js`).
*   **Despliegue (Hosting):** La infraestructura está alojada en **Vercel** (`.vercel`, `vercel.json`, `update_vercel.bat`).
*   **Automatización y Robots:** Se nota la existencia de robots auxiliares y puentes de conexión: `google-bridge.gs` (Google Apps Script), integración con Google Drive (`list_drive.js`, `search_drive.js`), y bots de WhatsApp o Python (`ssoma_whatsapp_robot.py`, `EJECUTAR_ROBOT.bat`).

### 3. Puntos de Atención (Deuda Técnica) y Recomendaciones
El directorio raíz contiene **demasiados archivos "huérfanos"** (scripts de testeo, parcheo y respaldo como `check_*.js`, `patch_*.js`, `test_*.js`, `fix_*.js`). Esto es común durante un desarrollo ágil, pero dificulta el mantenimiento a largo plazo.

**Top 3 Sugerencias de Mejora a Implementar:**

1.  **Limpieza y Organización de Scripts de Utilidad (Refactorización):**
    *   *Problema:* Hay más de 40 archivos sueltos de pruebas y parches en la carpeta principal (`fix.js`, `patch_backend.js`, `test_export.ts`, etc.).
    *   *Solución:* Crear una carpeta dedicada llamada `scripts_utilidad/` o `tools/` y mover allí todos los archivos `.js` y `.bat` que no pertenezcan al código fuente de la aplicación web de Next.js, para mantener limpia la raíz.
2.  **Centralización de las Consultas a Base de Datos (ORM/Query Builder):**
    *   *Problema:* Los múltiples archivos de parcheo (e.g., `check_cols_pg_10.js`) sugieren que hay inconsistencias en cómo interactúa la aplicación con las columnas de PostgreSQL o SQLite.
    *   *Solución:* Asegurarse de utilizar de forma estricta un ORM (como Prisma o Drizzle) centralizado dentro de la carpeta `lib/` para que los esquemas (tablas y columnas) sean idénticos tanto en local como en la nube.
3.  **Sistema de Backups Automatizado y Optimizado:**
    *   *Problema:* Existen archivos estáticos de respaldo muy pesados en el código fuente (ej. `all_blobs.json` pesa 400KB, pero hay archivos `.xlsx` y fotos grandes sueltas). 
    *   *Solución:* Configurar una ruta segura o un Bucket (AWS S3, Vercel Blob) dedicado estrictamente para backups y evitar guardar los "dumps" dentro de la carpeta local de desarrollo, ya que esto alentará el control de versiones (Git) y el despliegue.

---
**Nota del Arquitecto (Antigravity):**
*El sistema es extremadamente completo y veo que hemos trabajado arduamente en las automatizaciones. He documentado este resumen para ti.*
