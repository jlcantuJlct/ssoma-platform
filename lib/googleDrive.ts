
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
            folderId: folderIdOverride || "1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5",
            // Si nos pasan un path explícito, lo enviamos. Si no, usamos folderName original o undefined si hay override.
            folderPath: folderName,
            folderName: folderName // FIX: Enviar SIEMPRE, incluso si hay Override (para que el Bridge cree carpetas dentro del ID)
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
                downloadUrl: data.url,
                debug: {
                    rootUsed: 'BRIDGE-MODE',
                    targetUsed: folderIdOverride || "DEFAULT"
                }
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

    // VALIDACIÓN CRÍTICA: Si parentId no existe o es inválido, abortar para evitar bucles
    if (!parentId) throw new Error("Parent ID es nulo en ensureDriveFolderHierarchy");

    for (const part of parts) {
        // Buscar si existe carpeta con este nombre en el padre actual
        const query = `mimeType='application/vnd.google-apps.folder' and name='${part}' and '${currentParentId}' in parents and trashed=false`;

        try {
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

                const newFolder = await drive.files.create({
                    requestBody: folderMetadata,
                    fields: 'id',
                    supportsAllDrives: true
                });
                console.log(`✨ Carpeta CREADA: ${part} -> ID: ${newFolder.data.id}`);
                currentParentId = newFolder.data.id!; // Force non-null assertion
            }
        } catch (opErr: any) {
            console.error(`❌ Error operando carpeta '${part}':`, opErr.message);
            throw opErr; // Re-lanzar para manejar arriba
        }
    }
    return currentParentId;
}

export async function uploadToDrive(file: File, folderName: string, fileName: string) {
    // ESTRATEGIA HÍBRIDA ROBUSTA:
    // 1. Robot: Gestiona ESTRUCTURA DE CARPETAS (Crear/Buscar).
    // 2. Robot: Intenta subir archivo.
    // 3. Fallback (Bridge): Sube archivo SI Robot falla, PERO usando el ID de carpeta que el Robot encontró/creó.

    let rootFolderId = "1j6wEqCN3zU9lsGthKeRCo_a6X4UH6NU5"; // User Confirmed ID (1j6w...)
    let finalTargetFolderId = rootFolderId; // Por defecto Root

    const hasCreds = !!getCredentials();

    console.log(`🔐 ¿Tiene Credenciales Robot? ${hasCreds ? 'SI' : 'NO'}`);

    // GLOBAL PATH CORRECTION
    let relativePath = folderName;

    // A. GESTIÓN DE ESTRUCTURA (SOLO SI HAY CREDENCIALES ROBOT)
    if (hasCreds) {
        try {
            const drive = await getDriveService();

            // 1. Optimización de Ruta (Check Root Name)
            try {
                const rootFolderMeta = await drive.files.get({
                    fileId: rootFolderId,
                    fields: 'name',
                    supportsAllDrives: true
                });
                const rootName = rootFolderMeta.data.name;
                const pathParts = relativePath.split('/').filter(p => p.trim() !== '');
                if (pathParts.length > 0 && rootName && pathParts[0].trim().toUpperCase() === rootName.trim().toUpperCase()) {
                    relativePath = pathParts.slice(1).join('/');
                }
            } catch (ignore) { }

            // 2. Navegar/Crear Carpetas
            if (relativePath && relativePath.trim() !== '') {
                finalTargetFolderId = await ensureDriveFolderHierarchy(drive, rootFolderId, relativePath);
            }

            console.log(`✅ ID FINAL DESTINO (Post-Estructura): ${finalTargetFolderId}`);

            // 3. Compartir carpeta final (para que el Bridge/Usuario pueda ver/escribir)
            if (finalTargetFolderId !== rootFolderId) {
                try {
                    await drive.permissions.create({
                        fileId: finalTargetFolderId,
                        requestBody: { role: 'writer', type: 'anyone' },
                        supportsAllDrives: true
                    });
                } catch (ignore) { }
            }

        } catch (structureError: any) {
            console.error("⚠️ Falló gestión de estructura Robot:", structureError.message);
            // Si falla estructura, seguimos usando rootFolderId (mejor guardar en Root que no guardar)
        }
    }

    // 4. VERIFICACIÓN CRÍTICA: SI EL ROBOT NO PUDO CREAR LA CARPETA, NO SUBIR AL ROOT.
    // Si la carpeta destino sigue siendo el Root, pero habíamos pedido una subcarpeta...
    if (finalTargetFolderId === rootFolderId && folderName.length > 0 && folderName.trim() !== "") {
        console.warn("⚠️ El Robot no pudo crear la estructura de carpetas. Forzando Fallback al Bridge.");
        throw new Error("Robot failed to create folder structure. Handing over to Bridge.");
    }

    // 5. INTENTO DE SUBIDA NATIVA (ROBOT)
    if (hasCreds) {
        try {
            console.log(`📤 Robot intentando subir a: ${finalTargetFolderId}`);
            const drive = await getDriveService();
            const buffer = Buffer.from(await file.arrayBuffer());
            const stream = Readable.from(buffer);

            const media = { mimeType: file.type, body: stream };
            const fileMetadata = { name: fileName, parents: [finalTargetFolderId] };

            const response = await drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id, webViewLink, webContentLink',
                supportsAllDrives: true
            });

            const fileId = response.data.id!;

            // Permisos archivo
            try {
                await drive.permissions.create({
                    fileId: fileId,
                    requestBody: { role: 'reader', type: 'anyone' },
                    supportsAllDrives: true
                });
            } catch (ignore) { }

            return {
                id: fileId,
                url: `https://lh3.googleusercontent.com/d/${fileId}`,
                downloadUrl: response.data.webContentLink,
                debug: { rootUsed: rootFolderId, targetUsed: finalTargetFolderId }
            };

        } catch (uploadError: any) {
            console.error("❌ Falló subida Robot (Storage/Red). Activando Bridge...", uploadError.message);
            // NO lanzamos error. Dejamos caer al bloque Fallback.
        }
    }

    // C. FALLBACK: BRIDGE (APPS SCRIPT)
    try {
        // Lógica Inteligente para el Bridge:
        // Si el Robot NO cambió el ID (finalTargetFolderId === rootFolderId), significa que:
        // 1. O falló la creación de estructura.
        // 2. O era una subida al root.
        // En cualquier caso, si hay un relativePath, se lo pasamos al Bridge para que ÉL cree las carpetas.

        const structureFailed = (finalTargetFolderId === rootFolderId) && (relativePath.length > 0);
        const pathForBridge = structureFailed ? relativePath : ""; // Si Robot cumplió, Bridge no debe crear nada extra.

        console.log(`🌉 Bridge activado. Target: ${finalTargetFolderId}, Path extra: '${pathForBridge}'`);

        return await uploadViaAppsScript(file, pathForBridge, fileName, finalTargetFolderId);
    } catch (bridgeError: any) {
        console.error("❌ Falló TODO (Robot + Bridge):", bridgeError.message);
        throw bridgeError; // Ahora sí, error fatal.
    }
}
