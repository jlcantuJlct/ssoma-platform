/**
 * SSOMA Offline Queue & Synchronization Manager
 * Permite guardar inspecciones, fotos y correos en IndexedDB cuando el celular está sin señal
 * y sincronizarlos automáticamente cuando se recupera la conexión a internet.
 */

export interface OfflineInspection {
    id: string;
    createdAt: string; // ISO
    moduleName: string;
    isMachineryMatrix?: boolean;
    meta: any;
    checklist: any;
    observaciones: string;
    firmas: any;
    fotosDefectos: Record<string, string[]>;
    itemComments?: Record<string, string>;
    emailData?: {
        to: string[];
        cc?: string[];
        subject: string;
        message: string;
        fromEmail?: string;
        fromName?: string;
    } | null;
    extraPayload?: any;
    status: 'pending' | 'syncing' | 'failed' | 'synced';
    lastError?: string;
    syncedAt?: string;
}

const DB_NAME = 'SSOMA_OFFLINE_DB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_inspections';

// Helper para abrir la base de datos IndexedDB
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.indexedDB) {
            return reject(new Error('IndexedDB no está disponible en este entorno'));
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('status', 'status', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Suscriptores de cambios para actualizar componentes de React
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function subscribeToOfflineQueue(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function notifyListeners() {
    listeners.forEach(fn => {
        try { fn(); } catch (e) { console.error('Error in offline queue listener:', e); }
    });
}

/**
 * Guarda una nueva inspección completa en la memoria interna del celular (IndexedDB)
 */
export async function saveToOfflineQueue(
    data: Omit<OfflineInspection, 'id' | 'createdAt' | 'status'>
): Promise<OfflineInspection> {
    const db = await openDB();
    const id = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: OfflineInspection = {
        ...data,
        id,
        createdAt: new Date().toISOString(),
        status: 'pending',
    };

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(record);

        req.onsuccess = () => {
            notifyListeners();
            resolve(record);
        };
        req.onerror = () => reject(req.error);
    });
}

/**
 * Obtiene todas las inspecciones pendientes de sincronizar
 */
export async function getPendingInspections(): Promise<OfflineInspection[]> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.getAll();

            req.onsuccess = () => {
                const items: OfflineInspection[] = req.result || [];
                // Ordenar por fecha descendente
                items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                resolve(items);
            };
            req.onerror = () => reject(req.error);
        });
    } catch {
        return [];
    }
}

/**
 * Elimina una inspección de la cola
 */
export async function deleteFromOfflineQueue(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);

        req.onsuccess = () => {
            notifyListeners();
            resolve();
        };
        req.onerror = () => reject(req.error);
    });
}

/**
 * Actualiza el estado de una inspección en la cola
 */
async function updateInspectionStatus(id: string, status: OfflineInspection['status'], errorMsg?: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(id);

        getReq.onsuccess = () => {
            const item: OfflineInspection = getReq.result;
            if (item) {
                item.status = status;
                if (errorMsg) item.lastError = errorMsg;
                if (status === 'synced') item.syncedAt = new Date().toISOString();
                store.put(item);
            }
            notifyListeners();
            resolve();
        };
        getReq.onerror = () => reject(getReq.error);
    });
}

/**
 * Sincroniza una sola inspección pendiente con el servidor (Vercel)
 */
export async function syncSingleInspection(item: OfflineInspection): Promise<{ success: boolean; driveUrl?: string; error?: string }> {
    if (typeof window === 'undefined' || !navigator.onLine) {
        return { success: false, error: 'Sin conexión a internet' };
    }

    await updateInspectionStatus(item.id, 'syncing');

    try {
        // 1. Generar Excel y guardar en Drive / Servidor
        const exportRes = await fetch('/api/export-excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                moduleName: item.moduleName,
                isMachineryMatrix: item.isMachineryMatrix ?? false,
                meta: item.meta,
                checklist: item.checklist,
                template: item.extraPayload?.template,
                answers: item.extraPayload?.answers,
                observaciones: item.observaciones,
                firmas: item.firmas,
                fotosDefectos: item.fotosDefectos || {},
                saveToDrive: true,
            }),
        });

        if (!exportRes.ok) {
            const errJson = await exportRes.json().catch(() => ({}));
            throw new Error(errJson.error || `Error al exportar Excel (${exportRes.status})`);
        }

        const exportData = await exportRes.json();
        const driveLink: string = exportData.driveUrl || '';

        // 2. Guardar registro en la tabla de inspecciones
        let inspectionRecordId: number | null = null;
        try {
            const recRes = await fetch('/api/inspections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    data: {
                        date: item.meta?.fecha || item.createdAt.split('T')[0],
                        responsible: item.meta?.chofer || item.meta?.operador || item.firmas?.operadorNombre || item.firmas?.inspector || 'Inspector en Campo',
                        inspectionType: item.moduleName,
                        area: item.meta?.proyecto || item.meta?.area || 'CAMPO',
                        zone: item.meta?.equipo || item.meta?.lugar || 'Inspección Móvil Offline',
                        status: 'Completado',
                        observations: item.observaciones || 'Inspección realizada en campo offline sincronizada.',
                        evidencePdf: driveLink,
                        evidenceImgs: [],
                    },
                }),
            });
            if (recRes.ok) {
                const recData = await recRes.json();
                inspectionRecordId = recData.id;
            }
        } catch (e) {
            console.warn('Error no crítico registrando inspección en BD:', e);
        }

        // 3. Crear Levantamiento de observaciones si hubo hallazgos
        let levantamientoLink: string | null = null;
        const badItemsList = Object.entries(item.checklist || {}).filter(([_, val]) =>
            ['R', 'M', 'F', 'RESUM', 'FUGA', 'NC', false].includes(val as any)
        );
        const hasObservations = badItemsList.length > 0 || (item.observaciones && item.observaciones.trim().length > 0);

        if (hasObservations) {
            try {
                const hallazgosList = badItemsList.length > 0
                    ? badItemsList.map(([k, status], i) => ({
                        index: i,
                        descripcion: `- ${k} (${status}): ${item.itemComments?.[k] || ''}`.trim(),
                        riesgo: 'Medio',
                        categoria: 'Condición Subestándar',
                        responsable: item.firmas?.capatazNombre || 'Responsable',
                        responsableEmail: 'responsable@casacontratistas.com',
                        fecha: item.meta?.fecha || item.createdAt.split('T')[0],
                        fotosDefectos: item.fotosDefectos?.[k] ? { [k]: item.fotosDefectos[k] } : {},
                    }))
                    : [{
                        index: 0,
                        descripcion: item.observaciones || `Observaciones de ${item.moduleName}`,
                        riesgo: 'Medio',
                        categoria: 'Condición Subestándar',
                        responsable: item.firmas?.capatazNombre || 'Responsable',
                        responsableEmail: 'responsable@casacontratistas.com',
                        fecha: item.meta?.fecha || item.createdAt.split('T')[0],
                        fotosDefectos: item.fotosDefectos || {},
                    }];

                const lvRes = await fetch('/api/levantamiento/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        moduleName: item.moduleName,
                        template: item.checklist,
                        answers: { ...item.meta, observaciones: item.observaciones, firmas: item.firmas, fotosDefectos: item.fotosDefectos },
                        inspectionRecordId,
                        hallazgos: hallazgosList,
                    }),
                });

                if (lvRes.ok) {
                    const lvData = await lvRes.json();
                    if (lvData.items && lvData.items.length > 0) {
                        levantamientoLink = `${window.location.origin}/levantamiento/${lvData.items[0].token}`;
                    }
                }
            } catch (err) {
                console.warn('Error generando levantamiento:', err);
            }
        }

        // 4. Enviar correo si el usuario dejó destinatarios seleccionados en campo
        if (item.emailData && item.emailData.to && item.emailData.to.length > 0) {
            try {
                let bodyWithLink = item.emailData.message;
                if (bodyWithLink.includes('[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]')) {
                    bodyWithLink = bodyWithLink.replace(
                        '[📎 El enlace al reporte en Drive se generará y adjuntará automáticamente aquí]',
                        driveLink ? `📎 Enlace al reporte en Drive:\n${driveLink}` : ''
                    );
                } else if (driveLink) {
                    bodyWithLink += `\n\n📎 Enlace al reporte en Drive:\n${driveLink}`;
                }

                if (levantamientoLink) {
                    bodyWithLink += `\n\n✅ Enlace de Levantamiento de Observaciones:\n${levantamientoLink}`;
                }

                let htmlBody = bodyWithLink.replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#1a73e8;font-weight:bold;">📄 Ver / Descargar Reporte</a>');
                if (levantamientoLink) {
                    htmlBody += `<br><br><p style="text-align:center;background:#f0fdf4;padding:16px;border-radius:12px;border:1px solid #bbf7d0;"><a href="${levantamientoLink}" style="background:#059669;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;font-size:16px;">✅ Ingresar para Levantar Observaciones</a></p>`;
                }

                const emailRes = await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: item.emailData.to,
                        cc: item.emailData.cc,
                        subject: item.emailData.subject,
                        text: bodyWithLink,
                        html: htmlBody,
                        fromEmail: item.emailData.fromEmail,
                        fromName: item.emailData.fromName,
                    }),
                });

                if (!emailRes.ok) {
                    console.warn('Correo no pudo salir en la sincronización, pero el reporte quedó guardado');
                }
            } catch (err) {
                console.warn('Error despachando correo:', err);
            }
        }

        // Sincronización exitosa: eliminamos el registro de la cola de pendientes
        await deleteFromOfflineQueue(item.id);
        return { success: true, driveUrl: driveLink };
    } catch (error: any) {
        console.error('Error sincronizando inspección:', error);
        await updateInspectionStatus(item.id, 'failed', error.message || 'Error desconocido');
        return { success: false, error: error.message };
    }
}

/**
 * Sincroniza todas las inspecciones pendientes
 */
export async function syncAllPendingInspections(): Promise<{ total: number; synced: number; failed: number }> {
    const list = await getPendingInspections();
    let synced = 0;
    let failed = 0;

    for (const item of list) {
        const res = await syncSingleInspection(item);
        if (res.success) {
            synced++;
        } else {
            failed++;
        }
    }

    return { total: list.length, synced, failed };
}

/**
 * Helper unificado para guardar en cola offline y alertar amigablemente al usuario en el celular
 */
export async function queueOfflineInspection({
    moduleName,
    isMachineryMatrix,
    meta,
    checklist,
    observaciones,
    firmas,
    fotosDefectos,
    itemComments,
    emailData,
    extraPayload
}: {
    moduleName: string;
    isMachineryMatrix?: boolean;
    meta?: any;
    checklist?: any;
    observaciones?: string;
    firmas?: any;
    fotosDefectos?: Record<string, string[]>;
    itemComments?: Record<string, string>;
    emailData?: any;
    extraPayload?: any;
}): Promise<OfflineInspection> {
    const saved = await saveToOfflineQueue({
        moduleName,
        isMachineryMatrix,
        meta: meta || {},
        checklist: checklist || {},
        observaciones: observaciones || '',
        firmas: firmas || {},
        fotosDefectos: fotosDefectos || {},
        itemComments: itemComments || {},
        emailData: emailData || null,
        extraPayload: extraPayload || null,
    });

    const emailNote = emailData && emailData.to && emailData.to.length > 0
        ? `\n\n✉️ Destinatario(s): ${Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to}\nEl correo se despachará automáticamente con el Excel adjunto apenas recuperes señal.`
        : '';

    alert(
        `📱 ¡Inspección guardada en el celular! (Modo Offline)\n\n` +
        `Estás en una zona sin conexión a internet.\n` +
        `Todos los datos, fotos y firmas se han guardado con éxito en la memoria interna del teléfono.` +
        emailNote +
        `\n\nAl regresar a campamento o tener señal (Wi-Fi o datos móviles), se sincronizará automáticamente y se generará el reporte oficial.`
    );

    return saved;
}
