const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const os = require('os');
const https = require('https');

/**
 * CONFIGURACIÓN DEL ROBOT
 * Cambia esta URL si tu app está en otro dominio.
 */
const BASE_URL = "https://ssoma-platform.vercel.app"; // Cambiado para pruebas locales (antes era https://ssoma-platform.vercel.app)
const API_BASE_URL = `${BASE_URL}/api/export-center`;
const CRON_SECRET = "ssoma_cron_2026"; // Debe coincidir con el del servidor
const POLLING_INTERVAL = 5000; // 5 segundos

// Carpetas de Escritorio
const DESKTOP_PATH = path.join(os.homedir(), 'Desktop');
const SHAREPOINT_ROOT = path.join(DESKTOP_PATH, 'Share point SIG CASA');
const OSITRAN_ROOT = path.join(DESKTOP_PATH, 'Informes OSITRAN');

async function getDriveService() {
    let credentials;
    try {
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (fs.existsSync(keyPath)) {
            credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        } else {
            const credsTsPath = path.join(process.cwd(), 'lib', 'credentials.ts');
            if (fs.existsSync(credsTsPath)) {
                const content = fs.readFileSync(credsTsPath, 'utf8');
                const emailMatch = content.match(/client_email:\s*"([^"]+)"/);
                const keyMatch = content.match(/private_key:\s*"([^"]+)"/);
                if (emailMatch && keyMatch) {
                    credentials = {
                        client_email: emailMatch[1],
                        private_key: keyMatch[1].replace(/\\n/g, '\n')
                    };
                }
            }
        }
    } catch (e) {
        console.error("❌ Error cargando credenciales:", e.message);
    }

    if (!credentials) {
        console.warn("⚠️ No se encontraron credenciales. Se simularán las descargas de Google Drive.");
        return null; // Return null if no credentials, we'll simulate downloads
    }

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    return google.drive({ version: 'v3', auth });
}

async function updateStatus(id, action, progress = 0) {
    try {
        await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CRON_SECRET}`
            },
            body: JSON.stringify({ action, id, progress })
        });
    } catch (e) {
        console.error(`❌ Error actualizando status: ${e.message}`);
    }
}

async function fetchRecords(endpoint) {
    return new Promise((resolve) => {
        const url = new URL(`${BASE_URL}/api/${endpoint}`);
        require('https').get(url, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    resolve(data.records || []);
                } catch (e) {
                    resolve([]);
                }
            });
        }).on('error', () => {
            resolve([]);
        });
    });
}

function extractDriveId(url) {
    if (!url) return null;
    let match = url.match(/id=([^&]+)/);
    if (match) return match[1];
    match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

async function downloadFile(drive, fileId, destPath, fallbackName) {
    if (!fileId) {
        fs.writeFileSync(destPath, `No se encontró ID de archivo.`);
        return;
    }
    try {
        const res = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
    } catch (e) {
        fs.writeFileSync(destPath, `Error descargando archivo ${fileId}: ${e.message}`);
    }
}

async function downloadDirectFile(fileUrl, destPath) {
    try {
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
    } catch (e) {
        const isImage = destPath.toLowerCase().endsWith('.jpg');
        fs.writeFileSync(destPath, isImage ? `%IMAGE\n%Link: ${fileUrl}\n%%EOF` : `%PDF-1.4\n%Link: ${fileUrl}\n%%EOF`);
    }
}

function normalizeLocation(loc) {
    return String(loc).trim().toUpperCase();
}

function matchesMonth(recordMonth, targetMonthIndex) {
    const MONTH_NAMES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    if (!recordMonth) return false;
    const rm = String(recordMonth).toUpperCase();
    const targetName = MONTH_NAMES[targetMonthIndex];
    
    if (rm.includes(targetName) || rm === String(targetMonthIndex + 1) || rm === `0${targetMonthIndex + 1}`) return true;
    
    if (/^\d{4}-\d{2}-\d{2}/.test(rm)) {
        const monthPart = rm.split('-')[1];
        if (parseInt(monthPart, 10) === targetMonthIndex + 1) return true;
    }
    
    return false;
}

const MONTH_NAMES = [
    "01. ENERO", "02. FEBRERO", "03. MARZO", "04. ABRIL", "05. MAYO", "06. JUNIO",
    "07. JULIO", "08. AGOSTO", "09. SEPTIEMBRE", "10. OCTUBRE", "11. NOVIEMBRE", "12. DICIEMBRE"
];

const FOLDERS_MAP = {
    "01. SCSST": ["evidence-records"],
    "02. ANALISIS DE TRABAJO SEGURO (AST)": ["ats-records"],
    "03. COMPROMISO DE CUMPLIMIENTO": ["risstma-records"],
    "04. DOCUMENTOS DE GESTION DE SSTMA": ["sstma-docs-records"],
    "05. VIGILANCIA DE LA SALUD OCUPACIONAL": null,
    "06. EQUIPOS DE PROTECCION PERSONAL": ["epp-records"],
    "07. INFORMES": ["informes-records"],
    "08. COMUNICACION CON LA SUPERVISION O CLIENTE": ["cliente-comms-records"],
    "09. REGISTRO DE INDUCCIÓN, CAPACITACIÓN": ["hhc-records"],
    "10. MANIFIESTO": ["manifiesto-records"],
    "11. PERMISOS": ["petar-records"],
    "12. REGISTROS": ["accidentes-records", "simulacro-records", "reporte-ac-records"],
    "13. REGISTRO DE INSPECCIONES INTERNAS": ["inspections"],
    "14. MONITOREOS DE SSTMA": ["monitoreos"],
    "15. GESTIÓN DE RESIDUOS": ["residuos-certificados"],
    "16. Fotografías": ["pma-records", "desvio-records", "hhc-records"]
};

const OSITRAN_MAP = {
    "ANEXO 0. INFORME SIMULACRO": ["simulacro-records"],
    "ANEXO 1. CERTIFICADO EORS": ["residuos-certificados"],
    "ANEXO 2. CERTIFICADOS DE OPERATIVIDAD": ["equipment-certs"],
    "ANEXO 3. AUTORIZACIONES DE LAS ÁREAS AUXILIARES": null,
    "ANEXO 4. FLUJOGRAMA": null,
    "ANEXO 5. CÓDIGO DE CONDUCTA": ["sstma-docs-records"],
    "ANEXO 6. COMPRAS LOCALES": null,
    "ANEXO 7. CAPACITACIÓN OBRA PREVENCIÓN": ["hhc-records"],
    "ANEXO 8. POLÍTICA Y PLAN": ["sstma-docs-records"],
    "ANEXO 9. ESTADÍSTICAS SSOMA": null,
    "ANEXO 10. CHARLA DIARIA": ["hhc-records"],
    "ANEXO 11. EMOS": null,
    "ANEXO 12. ENTREGA DE EPPS": ["epp-records"],
    "ANEXO 13. SUB COMITÉ": ["actas-supervision"],
    "ANEXO 14. SCTR": ["sctr-records"],
    "ANEXO 15. ATS Y PETAR": ["ats-records", "petar-records"],
    "ANEXO 16. PLAN DE CONTINGENCIA": ["sstma-docs-records"],
    "ANEXO 17. PÓLIZA": ["sstma-docs-records"]
};

async function processRequest(request) {
    console.log(`\n📦 PROCESANDO SOLICITUD: [${request.type}] ID: ${request.id}`);
    
    const id = request.id;
    const type = request.type || 'SHAREPOINT';
    const month = (request.month !== undefined && request.month !== null) ? request.month : new Date().getMonth();
    const year = request.year || new Date().getFullYear();
    const location = request.location || 'GENERAL';
    const targetLocations = location === 'GENERAL' ? [] : location.split(',').map(normalizeLocation);
    const monthName = MONTH_NAMES[month] || `MES_${month + 1}`;

    try {
        const drive = await getDriveService();
        await updateStatus(id, 'update-progress', 10);

        if (type === 'SHAREPOINT') {
            const baseDir = path.join(SHAREPOINT_ROOT, year.toString(), monthName);
            if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

            const foldersKeys = Object.keys(FOLDERS_MAP);
            
            for (let i = 0; i < foldersKeys.length; i++) {
                const folderName = foldersKeys[i];
                const endpoint = FOLDERS_MAP[folderName];
                const folderPath = path.join(baseDir, folderName);
                if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
                
                let hasRecords = false;

                if (FOLDERS_MAP[folderName]) {
                    const endpoints = FOLDERS_MAP[folderName];
                    for (let eIdx = 0; eIdx < endpoints.length; eIdx++) {
                        const endpoint = endpoints[eIdx];
                        console.log(`   > Obteniendo registros de: ${folderName} [${endpoint}]...`);
                        const records = await fetchRecords(endpoint);
                        
                        const filtered = records.filter(r => {
                            const locMatch = targetLocations.length === 0 || targetLocations.includes(normalizeLocation(r.zona || r.location || r.lugar));
                            const monthMatch = matchesMonth(r.month || r.date, month);
                            if (endpoint === 'sstma-docs-records' || endpoint === 'sctr-records' || endpoint === 'equipment-certs') return true;
                            return locMatch && monthMatch;
                        });

                        for (let idx = 0; idx < filtered.length; idx++) {
                            const rec = filtered[idx];
                            hasRecords = true;
                            
                            let fileUrls = [];
                            if (rec.fileUrls) fileUrls = Array.isArray(rec.fileUrls) ? rec.fileUrls : JSON.parse(rec.fileUrls);
                            else if (rec.files) fileUrls = Array.isArray(rec.files) ? rec.files : JSON.parse(rec.files);
                            else {
                                if (rec.fileUrl) fileUrls.push(rec.fileUrl);
                                if (rec.url) fileUrls.push(rec.url);
                                if (rec.pdfUrl) fileUrls.push(rec.pdfUrl);
                                if (rec.imgUrl) fileUrls.push(rec.imgUrl);
                                if (rec.evidencePdf) fileUrls.push(rec.evidencePdf);
                            }
                            if (rec.evidenceImgs && Array.isArray(rec.evidenceImgs)) {
                                fileUrls.push(...rec.evidenceImgs);
                            }

                            for (let urlIdx = 0; urlIdx < fileUrls.length; urlIdx++) {
                                const fileUrl = fileUrls[urlIdx];
                                const fileId = extractDriveId(fileUrl);
                                
                                let targetPath = folderPath;
                                if (folderName.includes("INDUCCIÓN")) {
                                    const subfolderName = rec.type || "GENERAL";
                                    targetPath = path.join(folderPath, subfolderName);
                                    if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, { recursive: true });
                                }
                                if (folderName.includes("DOCUMENTOS DE GESTION")) {
                                    const subfolderName = rec.documentType || rec.docType || "GENERAL";
                                    targetPath = path.join(folderPath, subfolderName);
                                    if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, { recursive: true });
                                }

                                const isImage = folderName.includes("Fotografías");
                                const ext = isImage ? '.jpg' : '.pdf';
                                const prefixName = (rec.type || rec.documentType || rec.acto || rec.condicion || endpoint).replace(/[^a-zA-Z0-9]/g, '');
                                const safeName = `${rec.zona || rec.location || 'GEN'}_${rec.date || ''}_${prefixName}_${idx}_${urlIdx}${ext}`.replace(/[:\/\\]/g, '_');
                                const destFilePath = path.join(targetPath, safeName);
                                
                                if (fileId) {
                                    await downloadFile(drive, fileId, destFilePath, safeName);
                                } else {
                                    await downloadDirectFile(fileUrl, destFilePath);
                                }
                            }
                        }
                    }
                }

                // Placeholder if no records
                if (!hasRecords) {
                    fs.writeFileSync(path.join(folderPath, "Sin_Registros.txt"), "No se genero durante el mes");
                }
                
                const p = Math.round(10 + ((i + 1) / foldersKeys.length) * 80);
                await updateStatus(id, 'update-progress', p);
            }
        } 
        else if (type === 'OSITRAN') {
            const locations = String(location).split(',').map(l => l.trim());
            console.log(`   > Iniciando descarga de Anexos para ${locations.length} sedes: ${locations.join(', ')}...`);
            
            const annexesKeys = Object.keys(OSITRAN_MAP);

            const reportRoot = path.join(OSITRAN_ROOT, String(year), monthName);
            if (!fs.existsSync(reportRoot)) fs.mkdirSync(reportRoot, { recursive: true });

            for (let i = 0; i < annexesKeys.length; i++) {
                const annexFolderName = annexesKeys[i];
                const endpoints = OSITRAN_MAP[annexFolderName];
                const annexPath = path.join(reportRoot, annexFolderName);
                if (!fs.existsSync(annexPath)) fs.mkdirSync(annexPath, { recursive: true });

                console.log(`   [${i + 1}/${annexesKeys.length}] Procesando ${annexFolderName}...`);
                
                for (let locIdx = 0; locIdx < locations.length; locIdx++) {
                    const currentLoc = locations[locIdx];
                    const sedePath = path.join(annexPath, currentLoc);
                    if (!fs.existsSync(sedePath)) fs.mkdirSync(sedePath, { recursive: true });

                    let hasRecords = false;

                    if (endpoints && endpoints.length > 0) {
                        for (let eIdx = 0; eIdx < endpoints.length; eIdx++) {
                            const endpoint = endpoints[eIdx];
                            const records = await fetchRecords(endpoint);
                            
                            const filtered = records.filter(r => {
                                const locMatch = normalizeLocation(r.zona || r.location || r.lugar || currentLoc).includes(normalizeLocation(currentLoc));
                                const monthMatch = matchesMonth(r.month || r.date, month);
                                if (endpoint === 'sstma-docs-records' || endpoint === 'sctr-records' || endpoint === 'equipment-certs') return true;
                                return locMatch && monthMatch;
                            });

                            for (let idx = 0; idx < filtered.length; idx++) {
                                const rec = filtered[idx];
                                hasRecords = true;
                                
                                let urls = [];
                                if (rec.fileUrls) urls = Array.isArray(rec.fileUrls) ? rec.fileUrls : JSON.parse(rec.fileUrls);
                                else if (rec.files) urls = Array.isArray(rec.files) ? rec.files : JSON.parse(rec.files);
                                else if (rec.fileUrl) urls = [rec.fileUrl];
                                else if (rec.url) urls = [rec.url];
                                else if (rec.pdfUrl) urls = [rec.pdfUrl];
                                else if (rec.imgUrl) urls = [rec.imgUrl];
                                else if (rec.evidencePdf) urls = [rec.evidencePdf];
                                
                                if (rec.evidenceImgs && Array.isArray(rec.evidenceImgs)) {
                                    urls.push(...rec.evidenceImgs);
                                }

                                for (let urlIdx = 0; urlIdx < urls.length; urlIdx++) {
                                    const fileUrl = urls[urlIdx];
                                    const fileId = extractDriveId(fileUrl);
                                    
                                    const ext = fileUrl.toLowerCase().includes('.jpg') || fileUrl.toLowerCase().includes('.png') ? '.jpg' : '.pdf';
                                    const prefixName = (rec.type || rec.documentType || rec.acto || rec.condicion || endpoint).replace(/[^a-zA-Z0-9]/g, '');
                                    const safeName = `${currentLoc}_${rec.date || ''}_${prefixName}_${idx}_${urlIdx}${ext}`.replace(/[:\/\\]/g, '_');
                                    const destFilePath = path.join(sedePath, safeName);
                                    
                                    if (fileId) {
                                        await downloadFile(drive, fileId, destFilePath, safeName);
                                    } else {
                                        await downloadDirectFile(fileUrl, destFilePath);
                                    }
                                }
                            }
                        }
                    }

                    if (!hasRecords) {
                        fs.writeFileSync(path.join(sedePath, "Sin_Registros.txt"), "No se genero durante el mes o se debe subir manualmente");
                    }
                    
                    const annexWeight = 100 / annexesKeys.length;
                    const progressInAnnex = ((locIdx + 1) / locations.length) * annexWeight;
                    const totalProgress = Math.round((i * annexWeight) + progressInAnnex);
                    
                    if (locIdx === locations.length - 1) {
                        await updateStatus(id, 'update-progress', Math.max(10, totalProgress));
                    }
                }
            }
        }

        await updateStatus(id, 'complete', 100);
        console.log(`✅ SOLICITUD ${id} COMPLETADA EXITOSAMENTE.`);

    } catch (error) {
        console.error(`❌ Error procesando solicitud ${id}:`, error.message);
    }
}

async function poll() {
    process.stdout.write(".");
    const url = `${API_BASE_URL}?action=get-pending`;
    
    require('https').get(url, {
        headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
    }, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', async () => {
            try {
                const data = JSON.parse(body);
                if (data.success && data.requests && data.requests.length > 0) {
                    console.log(`\n🔔 Se encontraron ${data.requests.length} solicitudes pendientes.`);
                    for (const req of data.requests) {
                        await processRequest(req);
                    }
                }
            } catch (e) {}
            setTimeout(poll, POLLING_INTERVAL);
        });
    }).on('error', (e) => {
        console.error(`\n❌ Error de conexión: ${e.message}`);
        setTimeout(poll, POLLING_INTERVAL);
    });
}

console.log("=================================================");
console.log("   ROBOT LOCAL DE EXPORTACIÓN SSOMA v1.0");
console.log("=================================================");
console.log(`📡 Polleando: ${API_BASE_URL}`);
console.log(`🏠 Escritorio: ${DESKTOP_PATH}`);
console.log("Escaneando solicitudes...");

poll();
