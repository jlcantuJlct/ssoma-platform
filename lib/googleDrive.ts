
import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly'
];

import { ROBOT_CREDENTIALS } from './credentials';

// Función para obtener credenciales de forma robusta
function getCredentials() {
    // 0. PRIORIDAD MÁXIMA: Credenciales Incrustadas Seguro (Hardcoded Safe)
    if (ROBOT_CREDENTIALS && ROBOT_CREDENTIALS.private_key) {
        console.log("🔑 Usando credenciales incrustadas (ROBOT_CREDENTIALS)");
        const privateKey = ROBOT_CREDENTIALS.private_key.replace(/\\n/g, '\n'); // Asegurar saltos de línea reales
        return {
            client_email: ROBOT_CREDENTIALS.client_email,
            private_key: privateKey
        };
    }

    // 1. Intentar obtener desde Variables de Entorno (Legacy)
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        return {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
        };
    }

    // 2. Intentar leer archivo local 'service-account.json' (Desarrollo Local)
    try {
        const fs = require('fs');
        const path = require('path');
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (fs.existsSync(keyPath)) {
            const creds = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
            return {
                client_email: creds.client_email,
                private_key: creds.private_key
            };
        }
    } catch (e) {
        console.warn("No se pudo leer service-account.json local:", e);
    }

    // 3. Si no hay credenciales, retornar null (para lanzar error controlado después)
    return null;
}

async function getDriveService() {
    const credentials = getCredentials();

    if (!credentials) {
        throw new Error('No se encontraron credenciales de Google Drive. Configura GOOGLE_CLIENT_EMAIL/PRIVATE_KEY o añade service-account.json');
    }

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: SCOPES,
    });

    return google.drive({ version: 'v3', auth });
}

// NUEVO: URL del Puente Apps Script (Actualizado para usar cuota del usuario de 2TB)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwxvAgdYNiYcklJs08N87wL4APgZ0fR-uTdP6m7naZGli3wzQ2oeLTgO52fqIg5pF5EwQ/exec";

async function uploadViaAppsScript(file: File, folderName: string, fileName: string, folderIdOverride?: string) {
    try {
        console.log(`🚀 Iniciando subida directa (Server-to-Server) a Apps Script: ${fileName} ${folderIdOverride ? `(Override ID: ${folderIdOverride})` : ''}`);

        // Convertir File a Base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Info = buffer.toString('base64');

        const payload = {
            filename: fileName,
            mimetype: file.type || 'application/octet-stream',
            fileBase64: base64Info,
            let targetFolderId = "1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5"; // Default Root (Updated by User)
            // IMPORTANT: Send the full path structure for the script to handle!
            folderPath: folderName,
            folderName: folderIdOverride ? undefined : folderName // Legacy support
        };

        // LLAMADA DIRECTA (Server-side fetch no tiene CORS)
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: 'follow' // Importante para seguir los redirects de Google
        });

        // Intentar leer texto crudo primero para debug
        const text = await response.text();

        // Intentar parsear JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("❌ Respuesta no-JSON del Bridge:", text.substring(0, 500));
            // Si devuelve HTML, probablemente es un error de Google o página de Login (Auth fallido)
            throw new Error(`Google Script devolvió HTML/Error (status ${response.status}). Validar script 'Anyone' y URL.`);
        }

        if (data.result === 'success') {
            console.log(`✅ Subida Exitosa: ${data.url}`);
            return {
                id: 'drive-bridge-file',
                url: data.viewLink || data.url,
                downloadUrl: data.url
            };
        } else {
            console.error("❌ Error lógico del Bridge:", data.error);
            throw new Error(data.error || 'Error desconocido del Script');
        }

    } catch (error: any) {
        console.error("⚠️ Falló la subida Apps Script:", error.message);
        // Lanzamos el error con mensaje claro para que llegue al frontend y NO haga fallback a disco D:
        throw new Error(`Error Nube: ${error.message}`);
    }
}


// Helper Recursivo para crear carpetas
async function ensureDriveFolderHierarchy(drive: any, parentId: string, path: string): Promise<string> {
    const parts = path.split('/').filter(p => p.trim() !== '');
    let currentParentId = parentId;

    console.log(`🔍 Iniciando navegación de carpetas. Raíz: ${parentId}, Ruta: ${path}`);

    for (const part of parts) {
        // Buscar si existe carpeta con este nombre en el padre actual
        const query = `mimeType='application/vnd.google-apps.folder' and name='${part}' and '${currentParentId}' in parents and trashed=false`;

        console.log(`🔎 Buscando carpeta: '${part}' en '${currentParentId}'`);

        const res = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        if (res.data.files && res.data.files.length > 0) {
            // Existe, entramos
            console.log(`✅ Carpeta encontrada: ${part} -> ID: ${res.data.files[0].id}`);
            currentParentId = res.data.files[0].id;
        } else {
            // No existe, crearla
            console.log(`📂 Carpeta NO encontrada. Creando: ${part} en ${currentParentId}`);
            const folderMetadata = {
                name: part,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [currentParentId]
            };
            try {
                const newFolder = await drive.files.create({
                    requestBody: folderMetadata,
                    fields: 'id',
                    supportsAllDrives: true
                });
                console.log(`✨ Carpeta CREADA: ${part} -> ID: ${newFolder.data.id}`);
                currentParentId = newFolder.data.id;
            } catch (createErr: any) {
                console.error(`❌ ERROR CREANDO CARPETA ${part}:`, createErr.message);
                // Si falla crear, probablemente falla todo lo demás. Lanzamos error.
                throw createErr;
            }
        }
    }
    return currentParentId;
}

export async function uploadToDrive(file: File, folderName: string, fileName: string) {
    // ESTRATEGIA: PRIORIDAD ROBOT (NATIVO)
    // Para garantizar que el archivo termine EXACTAMENTE en la carpeta creada por el robot,
    // usamos el mismo robot para la subida.
    // El Bridge (Apps Script) queda solo como fallback si no tenemos credenciales del robot.

    let targetFolderId = "1eJ7QWEpAcqM1cwDJFSHsvE43WJJwQG0I"; // Default Root (Original Request)
    const hasCreds = !!getCredentials();

    console.log(`🔐 ¿Tiene Credenciales Robot? ${hasCreds ? 'SI' : 'NO'}`);
    if (!hasCreds) console.warn("⚠️ ALERTA: No hay credenciales. Se usará el Bridge (Apps Script).");

    // GLOBAL PATH CORRECTION: Remove prefix to avoid duplication if Root IS that folder
    let relativePath = folderName;

    // 1. INTENTO NATIVO (ROBOT) - Prioridad Absoluta
    if (hasCreds) {
        try {
            const drive = await getDriveService();
            const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || targetFolderId;

            // --- DYNAMIC ROOT CHECK (RE-APPLIED) ---
            // Check if we are incorrectly nesting (e.g. putting 'EVIDENCIAS...' inside 'EVIDENCIAS...')
            try {
                const rootFolderMeta = await drive.files.get({
                    fileId: rootFolderId,
                    fields: 'name',
                    supportsAllDrives: true
                });

                const rootName = rootFolderMeta.data.name;
                console.log(`📂 Nombre Real de Carpeta Root (${rootFolderId}): '${rootName}'`);

                const pathParts = relativePath.split('/').filter(p => p.trim() !== '');
                if (pathParts.length > 0 && rootName) {
                    // Check if the FIRST part of the path matches the Root Folder Name
                    if (pathParts[0].trim().toUpperCase() === rootName.trim().toUpperCase()) {
                        console.log(`✂️ Ajuste: Root es '${rootName}', eliminando prefijo redundante.`);
                        relativePath = pathParts.slice(1).join('/');
                    }
                }
            } catch (metaErr) {
                console.warn("⚠️ Advertencia: No se pudo verificar nombre del Root. Se usará la ruta completa.", metaErr);
                // Si falla, NO tocamos relativePath. Asumimos que hay que crear toda la estructura.
            }

            console.log(`🤖 Robot gestionando estructura: ${relativePath}`);

            // Handle Case: Uploading to Root directly (relativePath became empty)
            if (!relativePath || relativePath.trim() === '') {
                targetFolderId = rootFolderId;
            } else {
                targetFolderId = await ensureDriveFolderHierarchy(drive, rootFolderId, relativePath);
            }

            console.log(`✅ ID Carpeta destino: ${targetFolderId}`);

            // [FIX CRITICO BRIDGE] Compartir carpeta destino para que el Bridge pueda escribir
            // Si el Robot crea la carpeta, es privado. El Bridge falla al intentar subir ahí.
            // Solución: Dar permisos de 'writer' a 'anyone' en la carpeta final.
            if (targetFolderId !== rootFolderId) {
                try {
                    console.log(`🔓 Habilitando escritura pública en carpeta ${targetFolderId} (para Bridge)...`);
                    await drive.permissions.create({
                        fileId: targetFolderId,
                        requestBody: { role: 'writer', type: 'anyone' },
                        supportsAllDrives: true
                    });
                } catch (pErr) {
                    // Ignoramos si ya tiene permisos
                    console.warn("ℹ️ Aviso permisos carpeta:", pErr.message);
                }
            }

            // TRAMPA DE DEBUG (TEMPORAL): Si termina en la Raíz pero pidió subcarpetas, ¡GRITA!
            if (targetFolderId === rootFolderId && relativePath.length > 5) {
                console.log("ℹ️ Archivo se subirá al Root ID (validado por lógica dinámica).");
            }

            // B. Subir Archivo (Nativo)
            console.log(`📤 Robot subiendo archivo a: ${targetFolderId}`);
            const buffer = Buffer.from(await file.arrayBuffer());
            const stream = Readable.from(buffer);

            const fileMetadata = {
                name: fileName,
                parents: [targetFolderId]
            };

            const media = {
                mimeType: file.type,
                body: stream,
            };

            const response = await drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id, webViewLink, webContentLink',
                supportsAllDrives: true
            });

            const fileId = response.data.id!;

            // C. Compartir (Asegurar visibilidad para el usuario)
            try {
                await drive.permissions.create({
                    fileId: fileId,
                    requestBody: { role: 'reader', type: 'anyone' },
                    supportsAllDrives: true
                });
            } catch (permErr: any) {
                // Ignorar warnings comunes ("already shared")
                console.warn("⚠️ Advertencia permisos:", permErr.message);
            }

            return {
                id: fileId,
                url: `https://lh3.googleusercontent.com/d/${fileId}`,
                downloadUrl: response.data.webContentLink
            };

        } catch (nativeError: any) {
            console.error("❌ Falló subida Nativa (Robot). Intentando Fallback...", nativeError?.message);
            // NO lanzamos error aquí. Dejamos que el código siga y ejecute el bloque del Bridge.
        }
    }

    // 2. FALLBACK: BRIDGE (APPS SCRIPT)
    try {
        console.log(`⚠️ Usando Fallback Bridge para: ${fileName} en ID: ${targetFolderId}`);
        // USAR relativePath (limpia) en vez de folderName (sucia)
        return await uploadViaAppsScript(file, relativePath, fileName, targetFolderId);
    } catch (error: any) {
        console.error("❌ Falló también el Bridge:", error.message);
        return {
            id: null,
            url: '',
            error: true,
            errorMessage: error.message
        };
    }
}
