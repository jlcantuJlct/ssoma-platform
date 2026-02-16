
import { google } from 'googleapis';
import path from 'path';

// Configuración de autenticación (Reutilizamos la misma lógica de Drive)
async function getAuth() {
    // 1. Intentar obtener desde Variables de Entorno (Vercel)
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        return new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    }

    // 2. Intentar archivo local (fallback)
    try {
        const fs = require('fs');
        const keyPath = path.join(process.cwd(), 'service-account.json');
        if (fs.existsSync(keyPath)) {
            return new google.auth.GoogleAuth({
                keyFile: keyPath,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        }
    } catch (e) {
        console.error("Auth Error", e);
    }

    throw new Error('No Google Credentials found');
}

// ID de la Hoja de Cálculo (Se configurará o buscará dinámicamente)
// Para facilitar, usaremos una variable de entorno o crearemos una si no existe.
let SHEET_ID_CACHE = process.env.GOOGLE_SHEET_ID || '';

async function getSheetId(sheets: any) {
    if (SHEET_ID_CACHE) return SHEET_ID_CACHE;

    // Buscar si existe el archivo "DB_SSOMA_PLATFORM" en Drive
    // (Por simplicidad en este paso, requeriremos que el usuario cree la hoja y nos de el ID, igual que la carpeta)
    // O mejor, dejaremos que falle si no está configurado y le pediremos el ID al usuario.
    return '';
}

export async function appendRow(sheetName: string, values: any[]) {
    try {
        const auth = await getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        // El ID debe estar en vbles de entorno O usamos el proporcionado por usuario
        const spreadsheetId = process.env.GOOGLE_SHEET_ID || '1V-oOFEgt1WBsKp29CHIKN7F3zSXeF0yyG566wOzL5yg';
        if (!spreadsheetId) throw new Error("Falta GOOGLE_SHEET_ID en variables de entorno");

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sheetName}!A:A`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [values],
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Sheet Append Error:", error);
        return { success: false, error };
    }
}

export async function getRows(sheetName: string) {
    try {
        const auth = await getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        const spreadsheetId = process.env.GOOGLE_SHEET_ID || '1V-oOFEgt1WBsKp29CHIKN7F3zSXeF0yyG566wOzL5yg';
        if (!spreadsheetId) return [];

        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}!A:Z`,
        });

        return res.data.values || []; // Array of Arrays
    } catch (error) {
        console.error("Sheet Read Error:", error);
        return [];
    }
}
