import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import ImageModule from 'docxtemplater-image-module-free';
import fs from 'fs';
import path from 'path';

export interface ReportTemplateData {
    MES_REPORTE: string;
    ANIO_REPORTE: number;
    photos: { url: string; description: string; date: string }[];
}

async function fetchImageBuffer(src: string): Promise<ArrayBuffer | Buffer> {
    try {
        const res = await fetch(src);
        if (!res.ok) throw new Error("Fetch failed");
        const arrayBuffer = await res.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error("Error fetching image for Word:", error);
        // Devuelve imagen transparente 1x1 si falla, para no quebrar todo el documento
        return Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
    }
}

export async function generateWordFromTemplate(data: ReportTemplateData): Promise<Buffer> {
    // 1. Cargar Plantilla Base
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'Plantilla_Base.docx');
    
    if (!fs.existsSync(templatePath)) {
        throw new Error("No se ha encontrado Plantilla_Base.docx en la carpeta /public/templates/.\nPor favor, suba su documento plantilla primero.");
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    // 2. Configurar ImageModule
    const opts = {
        centered: true,
        fileType: "docx",
        getImage: (tagValue: string) => {
            return fetchImageBuffer(tagValue);
        },
        getSize: (img: any, tagValue: string, tagName: string) => {
            // Tamaño por defecto para el panel fotográfico (ancho, alto)
            return [500, 350]; 
        }
    };
    const imageModule = new ImageModule(opts);

    // 3. Inicializar Docxtemplater
    const doc = new Docxtemplater(zip, {
        modules: [imageModule],
        paragraphLoop: true,
        linebreaks: true,
    });

    // 4. Renderizar Variables Async
    await doc.resolveData({
        ...data
    });
    
    doc.render();

    // 5. Retornar Buffer Final
    const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: "DEFLATE",
    });

    return buf;
}
