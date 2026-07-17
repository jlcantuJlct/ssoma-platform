const fs = require('fs');

let content = fs.readFileSync('app/petar/page.tsx', 'utf8');

// 1. Imports
content = content.replace(
    /import \{ exportTableToPDF, exportRecordToPDF \} from "@\/lib\/pdfExport";/,
    "import { exportTableToPDF, exportRecordToPDF } from \"@/lib/pdfExport\";\nimport { PDFDocument } from 'pdf-lib';"
);

// 2. State & logic
content = content.replace(
    /    \/\/ Filter State\n    const \[filterDate, setFilterDate\] = useState\(""\);\n    const \[filterResponsible, setFilterResponsible\] = useState\(""\);\n    const \[filterLocation, setFilterLocation\] = useState\(""\);/g,
    `    // Filter State
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");
    const [filterResponsible, setFilterResponsible] = useState("");
    const [filterLocation, setFilterLocation] = useState("");

    const filteredRecords = records.filter(r => {
        const matchesDate = (!filterStartDate || r.date >= filterStartDate) && (!filterEndDate || r.date <= filterEndDate);
        const matchesResp = filterResponsible === "" || (r.responsible?.toLowerCase() || "").includes(filterResponsible.toLowerCase());
        const matchesLoc = filterLocation === "" || r.location === filterLocation;
        return matchesDate && matchesResp && matchesLoc;
    });

    const [isDownloadingZip, setIsDownloadingZip] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);

    const downloadMergedPDF = async () => {
        if (filteredRecords.length === 0) {
            alert("No hay registros para descargar.");
            return;
        }

        const filesToDownload = filteredRecords
            .filter(r => r.fileUrl)
            .map(r => r.fileUrl);

        if (filesToDownload.length === 0) {
            alert("Ninguno de los registros filtrados tiene un archivo adjunto.");
            return;
        }

        setIsDownloadingZip(true);
        setDownloadProgress(0);
        try {
            const mergedPdf = await PDFDocument.create();
            let successCount = 0;

            for (let i = 0; i < filesToDownload.length; i++) {
                try {
                    setDownloadProgress(Math.round(((i + 1) / filesToDownload.length) * 100));
                    const proxyUrl = \`/api/proxy-file?url=\${encodeURIComponent(filesToDownload[i])}\`;
                    const res = await fetch(proxyUrl);
                    if (!res.ok) continue;

                    const arrayBuffer = await res.arrayBuffer();
                    const pdf = await PDFDocument.load(arrayBuffer);
                    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    copiedPages.forEach((page) => {
                        mergedPdf.addPage(page);
                    });
                    successCount++;
                } catch (err) {
                    console.error("Error merging file:", err);
                }
            }

            if (successCount === 0) {
                alert("No se pudo descargar ningún archivo PDF.");
                return;
            }

            const mergedPdfBytes = await mergedPdf.save();
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`PETAR_Documentos_\${generateFilename()}.pdf\`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error: any) {
            console.error("Error merging PDFs:", error);
            alert("Error al unir los archivos PDF.");
        } finally {
            setIsDownloadingZip(false);
            setDownloadProgress(0);
        }
    };`
);

// 3. exportTableToPDF fix
content = content.replace(
    /const filtered = records\.filter\(r => \{[\s\S]*?return matchesDate && matchesResp && matchesLoc;\n\s*\}\);\n\s*exportTableToPDF\('Control de PETAR', cols, filtered, 'Petar\.pdf'\);/g,
    `exportTableToPDF('Control de PETAR', cols, filteredRecords, 'Petar.pdf');`
);

// 4. Grid header
content = content.replace(
    /<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-slate-800\/30 p-4 rounded-xl border border-slate-800\/50 items-end">/,
    `<div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6 bg-slate-800/30 p-4 rounded-xl border border-slate-800/50 items-end">`
);

// 5. Date filter UI
const oldDateUI = `<div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Fecha</label>
                                            {filterDate && (
                                                <button onClick={() => setFilterDate("")} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="date"
                                            value={filterDate}
                                            onChange={e => setFilterDate(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-orange-500 outline-none transition-colors"
                                        />
                                    </div>`;

const newDateUI = `<div className="space-y-1 lg:col-span-2">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Fecha (Inicio - Fin)</label>
                                            {(filterStartDate || filterEndDate) && (
                                                <button onClick={() => { setFilterStartDate(""); setFilterEndDate(""); }} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                value={filterStartDate}
                                                onChange={e => setFilterStartDate(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-orange-500 outline-none transition-colors"
                                            />
                                            <span className="text-slate-500 text-xs">-</span>
                                            <input
                                                type="date"
                                                value={filterEndDate}
                                                onChange={e => setFilterEndDate(e.target.value)}
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-orange-500 outline-none transition-colors"
                                            />
                                        </div>
                                    </div>`;

content = content.replace(oldDateUI, newDateUI);

// 6. Limpiar filtros button
const oldClearBtn = `<div className="space-y-1 flex flex-col justify-end h-[53px]">
                                        <button 
                                            onClick={() => { setFilterDate(""); setFilterResponsible(""); setFilterLocation(""); }}
                                            className={\`w-full h-[33px] rounded-lg text-[10px] font-bold uppercase transition-all border flex items-center justify-center gap-2 active:scale-95 \${
                                                (filterDate || filterResponsible || filterLocation)
                                                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 shadow-lg shadow-red-950/20'
                                                : 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                                            }\`}
                                            disabled={!(filterDate || filterResponsible || filterLocation)}
                                        >
                                            <RotateCcw size={12} strokeWidth={3} /> Limpiar Filtros
                                        </button>
                                    </div>`;

const newClearBtn = `<div className="flex items-center justify-end h-[53px]">
                                        {(filterStartDate || filterEndDate || filterResponsible || filterLocation) && (
                                            <button 
                                                onClick={() => { setFilterStartDate(""); setFilterEndDate(""); setFilterResponsible(""); setFilterLocation(""); }}
                                                className="w-full h-[33px] bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold uppercase transition-colors border border-red-500/20 flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <X size={12} strokeWidth={3} /> Limpiar Filtros
                                            </button>
                                        )}
                                    </div>`;

content = content.replace(oldClearBtn, newClearBtn);

// 7. Table logic & download button
const oldTableStart = `<div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">`;

const newTableStart = `<div className="flex justify-between items-center mb-4 mt-6">
                                    <h3 className="text-lg font-bold text-slate-300">Registros Encontrados ({filteredRecords.length})</h3>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={downloadMergedPDF}
                                            disabled={isDownloadingZip}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold hover:bg-blue-500/20 transition-all disabled:opacity-50"
                                        >
                                            {isDownloadingZip ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div> : <Download size={14} />}
                                            {isDownloadingZip ? \`Uniendo... \${downloadProgress}%\` : "Descargar PDFs (Unido)"}
                                        </button>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">`;

content = content.replace(oldTableStart, newTableStart);

// 8. Replace map records
const oldMapLogic = `{records.filter(r => {
                                                const matchesDate = filterDate === "" || r.date === filterDate;
                                                const matchesResp = filterResponsible === "" || (r.responsible?.toLowerCase() || "").includes(filterResponsible.toLowerCase());
                                                const matchesLoc = filterLocation === "" || r.location === filterLocation;
                                                return matchesDate && matchesResp && matchesLoc;
                                            }).length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="py-12 text-center text-slate-500 italic">
                                                        {records.length === 0 ? "No hay registros de PETAR aún." : "No se encontraron registros con los filtros aplicados."}
                                                    </td>
                                                </tr>
                                            ) : (
                                                records
                                                    .filter(r => {
                                                        const matchesDate = filterDate === "" || r.date === filterDate;
                                                        const matchesResp = filterResponsible === "" || (r.responsible?.toLowerCase() || "").includes(filterResponsible.toLowerCase());
                                                        const matchesLoc = filterLocation === "" || r.location === filterLocation;
                                                        return matchesDate && matchesResp && matchesLoc;
                                                    })
                                                    .map((record) => (`;

const newMapLogic = `{filteredRecords.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="py-12 text-center text-slate-500 italic">
                                                        {records.length === 0 ? "No hay registros de PETAR aún." : "No se encontraron registros con los filtros aplicados."}
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredRecords.map((record) => (`;

content = content.replace(oldMapLogic, newMapLogic);

fs.writeFileSync('app/petar/page.tsx', content, 'utf8');
console.log("Successfully patched petar");
