import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ImageModule from 'docxtemplater-image-module-free';
import fs from 'fs';
import path from 'path';
import { getDriveViewerUrl } from './utils';

export interface ReportTemplateData {
    MES_REPORTE: string;
    ANIO_REPORTE: number;
    photos: { url: string; description: string; date: string }[];
}

async function fetchImageBuffer(src: string): Promise<Buffer> {
    try {
        console.log("Fetching image buffer for:", src);
        const directUrl = getDriveViewerUrl(src, true);
        const res = await fetch(directUrl);
        if (!res.ok) throw new Error(`Fetch failed for ${directUrl} status ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error("Error fetching image for Word:", error);
        // Imagen transparente 1x1
        return Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
    }
}


export async function generateWordFromTemplate(data: any): Promise<Buffer> {
    console.log("Iniciando generateWordFromTemplate (pre-loading images)...");

    const templatePath = path.resolve(process.cwd(), 'public/templates/Plantilla_Base.docx');
    
    if (!fs.existsSync(templatePath)) {
        throw new Error(`No se ha encontrado la plantilla en: ${templatePath}`);
    }

    // Mapa para acceso rápido a buffers por URL
    const imageMap = new Map<string, Buffer>();
    
    async function collectImages(obj: any) {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
            for (const item of obj) await collectImages(item);
            return;
        }
        for (const key in obj) {
            if (key === 'url' && typeof obj[key] === 'string') {
                const buffer = await fetchImageBuffer(obj[key]);
                obj['image_buffer'] = buffer;
                imageMap.set(obj[key], buffer);
            } else {
                await collectImages(obj[key]);
            }
        }
    }

    try {
        // 1. Pre-cargar todas las imágenes y guardarlas en el mapa
        await collectImages(data);

        const content = fs.readFileSync(templatePath);
        const zip = new PizZip(content);

        // 2. Configurar ImageModule
        const opts = {
            centered: true,
            fileType: "docx",
            getImage: (tagValue: any) => {
                if (tagValue && tagValue.image_buffer) return tagValue.image_buffer;
                if (typeof tagValue === 'string' && imageMap.has(tagValue)) return imageMap.get(tagValue);
                if (Buffer.isBuffer(tagValue)) return tagValue;
                return null;
            },
            getSize: () => [500, 350]
        };
        const imageModule = new ImageModule(opts);

        // 3. Inicializar Docxtemplater
        const doc = new Docxtemplater(zip, {
            modules: [imageModule],
            paragraphLoop: true,
            linebreaks: true,
            nullGetter() { return ""; }
        });

        doc.setData(data);
        
        try {
            doc.render();
        } catch (error: any) {
            // DIAGNÓSTICO DETALLADO DE MULTI-ERROR
            if (error.properties && error.properties.errors instanceof Array) {
                const details = error.properties.errors.map((e: any) => {
                    return `[${e.name}] ${e.properties?.explanation || e.message} en tag: ${e.properties?.xtag || 'desconocido'}`;
                }).join(" | ");
                console.error("DETALLE DE ERRORES WORD:", details);
                throw new Error(`Error de Plantilla: ${details}`);
            }
            throw error;
        }

        return doc.getZip().generate({
            type: 'nodebuffer',
            compression: "DEFLATE",
        });
    } catch (error: any) {
        console.error("Error crítico en generación Word:", error);
        throw error;
    }
}
