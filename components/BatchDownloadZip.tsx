import React, { useState } from 'react';
import { Download } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface BatchDownloadZipProps {
    records: any[]; // The filtered records to download
    getUrls: (record: any) => string[]; // Function to extract array of URLs from a record
    getFilename: (record: any, index: number, total: number) => string; // Function to generate the zip entry name
    zipName?: string; // The final downloaded zip name
    className?: string; // Optional styling
}

export default function BatchDownloadZip({ 
    records, 
    getUrls, 
    getFilename, 
    zipName = "evidencias_masivas.zip",
    className = "w-full h-[33px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold uppercase transition-colors border border-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
}: BatchDownloadZipProps) {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownload = async () => {
        if (!records || records.length === 0) {
            alert("No hay registros para descargar con los filtros actuales.");
            return;
        }

        setIsDownloading(true);
        try {
            const zip = new JSZip();
            let hasFiles = false;

            for (const record of records) {
                const urls = getUrls(record);
                if (!urls || urls.length === 0) continue;

                for (let i = 0; i < urls.length; i++) {
                    const url = urls[i];
                    try {
                        const response = await fetch(url);
                        if (!response.ok) throw new Error(`HTTP ${response.status}`);
                        const blob = await response.blob();
                        const fileName = getFilename(record, i, urls.length);
                        zip.file(fileName, blob);
                        hasFiles = true;
                    } catch (error) {
                        console.error("Error descargando archivo para zip:", url, error);
                    }
                }
            }

            if (!hasFiles) {
                alert("No se pudo descargar ningún archivo o no hay archivos válidos.");
                setIsDownloading(false);
                return;
            }

            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, zipName);
        } catch (error) {
            console.error("Error al generar el ZIP:", error);
            alert("Hubo un error al generar el archivo ZIP.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <button 
            onClick={handleDownload}
            disabled={isDownloading || !records || records.length === 0}
            className={className}
            title="Descargar todos los archivos listados en un Zip"
        >
            {isDownloading ? (
                <>
                    <div className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                    Empaquetando...
                </>
            ) : (
                <>
                    <Download size={14} /> Descargar Zip
                </>
            )}
        </button>
    );
}
