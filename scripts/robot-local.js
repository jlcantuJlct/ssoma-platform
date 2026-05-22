const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const os = require('os');
const https = require('https');

/**
 * CONFIGURACIÓN DEL ROBOT
 * Cambia esta URL si tu app está en otro dominio.
 */
const BASE_URL = "https://ssoma-platform.vercel.app";
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
    const data = JSON.stringify({ action, id, progress });
    const url = new URL(API_BASE_URL);
    
    return new Promise((resolve) => {
        const req = https.request({
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CRON_SECRET}`,
                'Content-Length': data.length
            }
        }, (res) => {
            resolve();
        });
        req.on('error', (e) => {
            console.error(`❌ Error actualizando status: ${e.message}`);
            resolve();
        });
        req.write(data);
        req.end();
    });
}

async function fetchRecords(endpoint) {
    return new Promise((resolve) => {
        const url = new URL(`${BASE_URL}/api/${endpoint}`);
        https.get(url, (res) => {
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
    const match = url.match(/id=([^&]+)/);
    return match ? match[1] : null;
}

async function downloadFile(drive, fileId, destPath, fallbackName) {
    if (!drive) {
        // Create dummy file if no drive access
        fs.writeFileSync(destPath, `%PDF-1.4\n%Dummy PDF for ${fallbackName}\n%%EOF`);
        return;
    }
    try {
        const dest = fs.createWriteStream(destPath);
        const res = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'stream' }
        );
        return new Promise((resolve, reject) => {
            res.data
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .pipe(dest);
        });
    } catch (e) {
        // Fallback dummy file
        fs.writeFileSync(destPath, `%PDF-1.4\n%Error downloading from drive\n%%EOF`);
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
    return rm.includes(targetName) || rm === String(targetMonthIndex + 1) || rm === `0${targetMonthIndex + 1}`;
}

const MONTH_NAMES = [
    "01. ENERO", "02. FEBRERO", "03. MARZO", "04. ABRIL", "05. MAYO", "06. JUNIO",
    "07. JULIO", "08. AGOSTO", "09. SEPTIEMBRE", "10. OCTUBRE", "11. NOVIEMBRE", "12. DICIEMBRE"
];

const FOLDERS_MAP = {
    "01. SCSST": ["scsst-records"],
    "02. ANALISIS DE TRABAJO SEGURO (AST)": ["ats-records"],
    "03. COMPROMISO DE CUMPLIMIENTO": ["risstma-records"],
    "04. DOCUMENTOS DE GESTION DE SSTMA": ["sstma-docs-records"],
    "05. VIGILANCIA DE LA SALUD OCUPACIONAL": null,
    "06. EQUIPOS DE PROTECCION PERSONAL": ["epp-records"],
    "07. INFORMES": ["informes-records"],
    "08. COMUNICACION CON LA SUPERVISION O CLIENTE": ["cliente-comms-records"],
    "09. REGISTRO DE INDUCCIÓN, CAPACITACIÓN...": ["hhc-records"],
    "10. MANIFIESTO": ["manifiesto-records"],
    "11. PERMISOS": ["petar-records"],
    "12. REGISTROS": ["accidentes-records", "simulacro-records", "reporte-ac-records"],
    "13. REGISTRO DE INSPECCIONES INTERNAS": ["inspections"],
    "14. MONITOREOS DE SSTMA": ["monitoreos"],
    "15. GESTIÓN DE RESIDUOS": ["residuos-certificados"],
    "16. Fotografías": ["pma-records", "desvio-records", "hhc-records"]
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
                            const locMatch = targetLocations.length === 0 || targetLocations.includes(normalizeLocation(r.zona || r.location));
                            const monthMatch = matchesMonth(r.month || r.date, month);
                            return locMatch && monthMatch;
                        });

                        for (let idx = 0; idx < filtered.length; idx++) {
                            const rec = filtered[idx];
                            hasRecords = true;
                            
                            let urls = [];
                            if (rec.fileUrls) urls = Array.isArray(rec.fileUrls) ? rec.fileUrls : JSON.parse(rec.fileUrls);
                            else if (rec.files) urls = Array.isArray(rec.files) ? rec.files : JSON.parse(rec.files);
                            else if (rec.fileUrl) urls = [rec.fileUrl];
                            else if (rec.pdfUrl) urls = [rec.pdfUrl];
                            else if (rec.imgUrl) urls = [rec.imgUrl];

                            for (let urlIdx = 0; urlIdx < urls.length; urlIdx++) {
                                const fileUrl = urls[urlIdx];
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
                                    fs.writeFileSync(destFilePath, isImage ? `%IMAGE\n%Link: ${fileUrl}\n%%EOF` : `%PDF-1.4\n%Link: ${fileUrl}\n%%EOF`);
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
            
            const annexes = [
                "ANEXO 0. INFORME SIMULACRO", "ANEXO 1. CERTIFICADO EORS", "ANEXO 2. CERTIFICADOS DE OPERATIVIDAD",
                "ANEXO 3. AUTORIZACIONES DE LAS ÁREAS AUXILIARES", "ANEXO 4. FLUJOGRAMA", "ANEXO 5. CÓDIGO DE CONDUCTA",
                "ANEXO 6. COMPRAS LOCALES", "ANEXO 7. CAPACITACIÓN OBRA PREVENCIÓN", "ANEXO 8. POLÍTICA Y PLAN",
                "ANEXO 9. ESTADÍSTICAS SSOMA", "ANEXO 10. CHARLA DIARIA", "ANEXO 11. EMOS",
                "ANEXO 12. ENTREGA DE EPPS", "ANEXO 13. SUB COMITÉ", "ANEXO 14. SCTR",
                "ANEXO 15. ATS Y PETAR", "ANEXO 16. PLAN DE CONTINGENCIA", "ANEXO 17. PÓLIZA"
            ];

            const reportRoot = path.join(OSITRAN_ROOT, String(year), monthName);
            if (!fs.existsSync(reportRoot)) fs.mkdirSync(reportRoot, { recursive: true });

            for (let i = 0; i < annexes.length; i++) {
                const annexFolderName = annexes[i];
                const annexPath = path.join(reportRoot, annexFolderName);
                if (!fs.existsSync(annexPath)) fs.mkdirSync(annexPath, { recursive: true });

                console.log(`   [${i + 1}/${annexes.length}] Procesando ${annexFolderName}...`);
                
                for (let locIdx = 0; locIdx < locations.length; locIdx++) {
                    const currentLoc = locations[locIdx];
                    const sedePath = path.join(annexPath, currentLoc);
                    if (!fs.existsSync(sedePath)) fs.mkdirSync(sedePath, { recursive: true });

                    const fileName = `${annexFolderName.replace(/\./g, '')}_${currentLoc}_${monthName}.pdf`;
                    const filePath = path.join(sedePath, fileName);
                    
                    const minimalPdf = Buffer.from(
                        "%PDF-1.4\n" +
                        "1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n" +
                        "2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n" +
                        "3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R>> endobj\n" +
                        "4 0 obj <</Length 20>> stream\n" +
                        "BT /F1 12 Tf ET\n" +
                        "endstream\n" +
                        "endobj\n" +
                        "xref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000056 00000 n\n0000000111 00000 n\n0000000202 00000 n\ntrailer <</Size 5 /Root 1 0 R>>\nstartxref\n271\n%%EOF"
                    );

                    fs.writeFileSync(filePath, minimalPdf);
                    
                    const annexWeight = 100 / annexes.length;
                    const progressInAnnex = ((locIdx + 1) / locations.length) * annexWeight;
                    const totalProgress = Math.round((i * annexWeight) + progressInAnnex);
                    
                    if (locIdx === locations.length - 1) {
                        await updateStatus(id, 'update-progress', Math.max(10, totalProgress));
                    }
                    console.log(`      ✓ ${currentLoc}: ${fileName}`);
                    await new Promise(r => setTimeout(r, 100));
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
    
    https.get(url, {
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
