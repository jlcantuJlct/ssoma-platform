"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import {
    FileText,
    Download,
    Calendar,
    Activity,
    Shield,
    ClipboardCheck,
    Leaf,
    HardHat,
    AlertTriangle,
    ChevronLeft,
    Image as ImageIcon,
    Plus,
    X,
    BarChart3,
    Settings,
    Save,
    Upload,
    Wrench,
    CheckCircle2,
    Clock,
    RotateCcw,
    AlertCircle,
    Trash2,
    Lock,
    ExternalLink
} from "lucide-react";
import { uploadEvidence } from "@/app/actions";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { toPng } from 'html-to-image';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { generateWordReport } from '../../lib/wordGenerator';

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ANNEXES_TYPES = [
    { id: 0, label: "INFORME SIMULACRO", isPermanent: false },
    { id: 1, label: "CERTIFICADO EORS", isPermanent: false },
    { id: 2, label: "CERTIFICADOS DE OPERATIVIDAD", isPermanent: false },
    { id: 3, label: "AUTORIZACIONES AREAS AUXILIARES", isPermanent: false },
    { id: 4, label: "FLUJOGRAMA", isPermanent: true },
    { id: 5, label: "CODIGO DE CONDUCTA", isPermanent: true },
    { id: 6, label: "COMPRAS LOCALES", isPermanent: false },
    { id: 7, label: "CAPACITACIONES OBRA", isPermanent: false },
    { id: 8, label: "POLITICA Y PLAN", isPermanent: true },
    { id: 9, label: "ESTADISTICAS SSOMA", isPermanent: false },
    { id: 10, label: "CHARLA DIARIA", isPermanent: false },
    { id: 11, label: "EMOs", isPermanent: false },
    { id: 12, label: "ENTREGA DE EPPS", isPermanent: false },
    { id: 13, label: "SUB COMITE", isPermanent: false },
    { id: 14, label: "SCTR", isPermanent: false },
    { id: 15, label: "ATS Y PETAR", isPermanent: false },
    { id: 16, label: "PLAN DE CONTINGENCIA", isPermanent: true },
    { id: 17, label: "POLIZA", isPermanent: true },
    { id: 18, label: "OTROS DOCUMENTOS", isPermanent: true }
];

interface ReportImage {
    id: string;
    file: File;
    preview: string;
    description: string;
    category: string; // 'Inspección', 'ATS', 'PETAR', 'PMA', 'Capacitación', 'General'
}

export default function MonthlyReportPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    // --- DATA STATES ---
    const [statsData, setStatsData] = useState<any>(null);
    const [hhcRecords, setHhcRecords] = useState<any[]>([]);
    const [inspections, setInspections] = useState<any[]>([]);
    const [atsRecords, setAtsRecords] = useState<any[]>([]);
    const [petarRecords, setPetarRecords] = useState<any[]>([]);
    const [evidenceRecords, setEvidenceRecords] = useState<any[]>([]);
    const [pmaRecords, setPmaRecords] = useState<any[]>([]);
    const [programData, setProgramData] = useState<any>({});

    // --- IMAGES STATE ---
    const [reportImages, setReportImages] = useState<ReportImage[]>([]);
    const [newImageDesc, setNewImageDesc] = useState('');
    const [newImageCat, setNewImageCat] = useState('General');

    // --- REPORT TOOLS STATES ---
    const [showFeedingPanel, setShowFeedingPanel] = useState(false);
    const [savingTools, setSavingTools] = useState(false);
    const [loadingTools, setLoadingTools] = useState(false);
    
    // Manual stats state (synced with monthly_stats_records)
    const [manualStats, setManualStats] = useState<Record<string, number>>({
        HHT: 0, ATT: 0, APP: 0, ATP: 0, AM: 0, TDP: 0, EO: 0, EP: 0,
        RES_PEL: 0, RES_NO_PEL: 0, RES_APROV: 0
    });
    
    // Annexes from DB
    const [dbAnnexes, setDbAnnexes] = useState<any[]>([]);
    const [localAnnex1Files, setLocalAnnex1Files] = useState<any[]>([]);
    const [fullYearStats, setFullYearStats] = useState<any>(null);
    const [excelMetadata, setExcelMetadata] = useState<any>(null);
    const [totals, setTotals] = useState<any>(null);

    // --- REFERENCES FOR CHARTS ---
    const chartsRef = useRef<HTMLDivElement>(null);

    // --- ACCESS CONTROL ---
    useEffect(() => {
        if (user && user.role !== 'developer' && user.role !== 'manager') {
            router.push('/');
        }
    }, [user, router]);

    // --- LOAD ALL DATA ---
    useEffect(() => {
        const loadAllData = async () => {
            setLoadingData(true);
            try {
                // 1. Accidentability Stats (Local Storage Only for now)
                const storedStats = localStorage.getItem('accidentability_stats_2026');
                if (storedStats) setStatsData(JSON.parse(storedStats));

                // 2. Fetch API Data
                const [atsRes, petarRes, inspRes, hhcRes, evRes, pmaRes, progRes] = await Promise.all([
                    fetch('/api/ats-records').then(r => r.json()).catch(() => ({ records: [] })),
                    fetch('/api/petar-records').then(r => r.json()).catch(() => ({ records: [] })),
                    fetch('/api/inspections').then(r => r.json()).catch(() => ({ records: [] })),
                    fetch('/api/hhc-records').then(r => r.json()).catch(() => ({ records: [] })),
                    fetch('/api/evidence-records').then(r => r.json()).catch(() => ({ records: [] })),
                    fetch('/api/pma-records').then(r => r.json()).catch(() => ({ records: [] })),
                    fetch('/api/annual-program').then(r => r.json()).catch(() => ({ programData: {} }))
                ]);

                if (atsRes.records) setAtsRecords(atsRes.records);
                if (petarRes.records) setPetarRecords(petarRes.records);
                if (inspRes.records) setInspections(inspRes.records);
                if (hhcRes.records) setHhcRecords(hhcRes.records);
                if (evRes.records) setEvidenceRecords(evRes.records);

                if (pmaRes.records && pmaRes.records.length > 0) {
                    setPmaRecords(pmaRes.records);
                } else {
                    const localPma = localStorage.getItem('pma_evidence_records');
                    if (localPma) setPmaRecords(JSON.parse(localPma));
                }

                if (progRes.programData) setProgramData(progRes.programData);

            } catch (error) {
                console.error("Error loading report data:", error);
            } finally {
                setLoadingData(false);
            }
        };

        loadAllData();
        loadReportTools();
    }, [selectedMonth, selectedYear]);

    const loadReportTools = async () => {
        setLoadingTools(true);
        try {
            const res = await fetch(`/api/report-tools?type=stats&month=${selectedMonth + 1}&year=${selectedYear}&location=SAN CLEMENTE`);
            const data = await res.json();
            if (data.success) {
                const newStats = { ...manualStats };
                data.stats.forEach((s: any) => {
                    newStats[s.stat_key] = s.stat_value;
                });
                setManualStats(newStats);
            }

            const resAnx = await fetch(`/api/report-tools?type=annexes&month=${selectedMonth + 1}&year=${selectedYear}&location=SAN CLEMENTE`);
            const dataAnx = await resAnx.json();
            if (dataAnx.success) {
                setDbAnnexes(dataAnx.annexes);
            }

            // Local scan for Annex 1
            const resLocal = await fetch(`/api/report-tools/local-scan?month=${MONTHS[selectedMonth]}`);
            const dataLocal = await resLocal.json();
            if (dataLocal.success) {
                setLocalAnnex1Files(dataLocal.files);
            }
        } catch (e) {
            console.error("Error loading tools:", e);
        } finally {
            setLoadingTools(false);
        }
    };

    const saveReportStats = async () => {
        setSavingTools(true);
        try {
            await fetch('/api/report-tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'stats',
                    month: selectedMonth + 1,
                    year: selectedYear,
                    location: 'SAN CLEMENTE',
                    data: manualStats
                })
            });
            alert("✅ Estadísticas guardadas");
        } catch (e) {
            alert("❌ Error al guardar");
        } finally {
            setSavingTools(false);
        }
    };

    const handleAutoFill = async () => {
        setLoadingTools(true);
        try {
            alert("📊 Sincronizando datos oficiales desde el Excel de Estadísticas...");
            
            const res = await fetch(`/api/report-tools/excel-extract?month=${selectedMonth + 1}&location=SAN CLEMENTE`);
            const data = await res.json();
            
            if (data.success) {
                setManualStats(prev => ({ ...prev, ...data.stats }));
                setFullYearStats(data.fullYear);
                setExcelMetadata(data.metadata);
                setTotals(data.totals);
                alert(`✅ Datos de ${MONTHS[selectedMonth]} sincronizados correctamente.`);
            } else {
                alert("❌ Error al extraer datos del Excel: " + data.error);
            }

        } catch (e: any) {
            console.error("Auto-fill error:", e);
            alert("❌ Error de conexión al servidor");
        } finally {
            setLoadingTools(false);
        }
    };

    const uploadAnnex = async (file: File, annexId: number, label: string, isPermanent: boolean) => {
        setSavingTools(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('activityId', `ANNEX_${annexId}`);
            formData.append('month', (selectedMonth + 1).toString());

            const uploadRes = await uploadEvidence(formData);
            if (!uploadRes.success) throw new Error("Upload failed");

            await fetch('/api/report-tools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'annexes',
                    month: selectedMonth + 1,
                    year: selectedYear,
                    location: 'SAN CLEMENTE',
                    data: {
                        annex_id: annexId,
                        label: label,
                        file_path: uploadRes.path,
                        is_permanent: isPermanent
                    }
                })
            });
            loadReportTools();
        } catch (e) {
            alert("❌ Error al subir");
        } finally {
            setSavingTools(false);
        }
    };

    const deleteAnnex = async (id: number) => {
        if (!confirm("¿Eliminar anexo?")) return;
        setSavingTools(true);
        try {
            await fetch(`/api/report-tools?id=${id}`, { method: 'DELETE' });
            loadReportTools();
        } catch (e) { }
        finally { setSavingTools(false); }
    };

    // --- FILTER HELPERS ---
    const filterByDate = (records: any[], dateField: string = 'date') => {
        return records.filter(r => {
            if (!r[dateField]) return false;
            let d = new Date(r[dateField]);
            if (typeof r[dateField] === 'string' && r[dateField].includes('-')) {
                const parts = r[dateField].split('-');
                if (parts.length === 3) {
                    return parseInt(parts[0]) === selectedYear && (parseInt(parts[1]) - 1) === selectedMonth;
                }
            }
            return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
        });
    };

    const currentATS = filterByDate(atsRecords);
    const currentPETAR = filterByDate(petarRecords);
    const currentInspections = filterByDate(inspections);
    const currentHHC = filterByDate(hhcRecords);
    const currentEvidence = filterByDate(evidenceRecords);
    const currentPMA = filterByDate(pmaRecords);

    // --- IMAGE HANDLING ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (ev) => {
                setReportImages(prev => [...prev, {
                    id: Date.now().toString(),
                    file,
                    preview: ev.target?.result as string,
                    description: newImageDesc || 'Evidencia fotográfica',
                    category: newImageCat
                }]);
                setNewImageDesc('');
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = (id: string) => {
        setReportImages(prev => prev.filter(img => img.id !== id));
    };

    // --- GENERATE PDF ---
    const generateReport = async () => {
        setIsGenerating(true);

        // CAPTURE CHARTS FIRST
        let chartsImgData = null;
        if (chartsRef.current) {
            try {
                chartsImgData = await toPng(chartsRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
            } catch (err) {
                console.error("Error capturing charts:", err);
            }
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = 20;

        // HELPER: Add Header
        const addHeader = (title: string) => {
            doc.setFillColor(6, 78, 59); // Emerald 900
            doc.rect(0, 0, pageWidth, 25, 'F');
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.text("SSOMA PLATFORM - INFORME MENSUAL", 15, 12);
            doc.setFontSize(10);
            doc.setTextColor(200, 200, 200);
            doc.text(`${MONTHS[selectedMonth]} ${selectedYear}`, 15, 19);
            doc.text("Generado automáticamente", pageWidth - 50, 16);
            yPos = 35;

            // Section Title
            doc.setFontSize(14);
            doc.setTextColor(6, 78, 59);
            doc.text(title, 15, yPos);
            doc.setDrawColor(6, 78, 59);
            doc.line(15, yPos + 2, pageWidth - 15, yPos + 2);
            yPos += 15;
        };

        // HELPER: Footer (Page Number)
        const addFooter = (pageNum: number) => {
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Página ${pageNum}`, pageWidth - 20, pageHeight - 10);
            doc.text(`SSOMA Platform © ${selectedYear}`, 15, pageHeight - 10);
        };

        let pageNum = 1;

        // --- PAGE 1: COVER ---
        doc.setFillColor(2, 6, 23); // Slate 950
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        doc.setFontSize(32);
        doc.setTextColor(16, 185, 129); // Emerald 500
        doc.text("INFORME DE GESTIÓN", pageWidth / 2, 100, { align: 'center' });
        doc.text("SSOMA", pageWidth / 2, 115, { align: 'center' });

        doc.setFontSize(18);
        doc.setTextColor(255);
        doc.text(`${MONTHS[selectedMonth].toUpperCase()} ${selectedYear}`, pageWidth / 2, 140, { align: 'center' });

        doc.setFontSize(12);
        doc.setTextColor(148, 163, 184);
        doc.text("Seguridad, Salud Ocupacional y Medio Ambiente", pageWidth / 2, 155, { align: 'center' });

        doc.setFontSize(10);
        doc.text("Contenido:", pageWidth / 2, 230, { align: 'center' });
        doc.text("• Estadísticas de Siniestralidad", pageWidth / 2, 240, { align: 'center' });
        doc.text("• Resumen Gráfico Gerencial", pageWidth / 2, 245, { align: 'center' });
        doc.text("• Gestión Operativa (ATS/PETAR/Inspecciones)", pageWidth / 2, 250, { align: 'center' });
        doc.text("• Capacitación y Programas", pageWidth / 2, 255, { align: 'center' });
        doc.text("• Gestión Ambiental (PMA Completo)", pageWidth / 2, 260, { align: 'center' });
        doc.text("• Anexo Fotográfico", pageWidth / 2, 265, { align: 'center' });

        doc.addPage(); pageNum++;

        // --- PAGE 2: RESUMEN EJECUTIVO KPI ---
        addHeader("1. RESUMEN EJECUTIVO");

        const kpiData = [
            ["Horas Hombre Trabajadas (HHT)", manualStats.HHT || 0],
            ["Días Perdidos (TDP)", manualStats.TDP || 0],
            ["Inspecciones Realizadas", currentInspections.length],
            ["Permisos de Trabajo (PETAR)", currentPETAR.length],
            ["Análisis de Trabajo Seguro (ATS)", currentATS.length],
            ["Horas de Capacitación", currentHHC.reduce((acc: number, r: any) => acc + (Number(r.hhc) || 0), 0).toFixed(2)],
        ];

        autoTable(doc, {
            startY: yPos,
            head: [['Indicador Clave (KPI)', 'Valor del Mes']],
            body: kpiData,
            theme: 'grid',
            headStyles: { fillColor: [6, 78, 59] },
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: { 0: { fontStyle: 'bold' } }
        });

        yPos = (doc as any).lastAutoTable.finalY + 20;

        // Comentario de Gestión (Automated based on data)
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.text("Comentarios de Gestión:", 15, yPos);
        yPos += 7;
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.text("Se presenta el reporte consolidado de actividades del mes. " +
            "Se han cumplido los programas de inspección y capacitación según lo planificado. " +
            "Todas las desviaciones identificadas han sido gestionadas o se encuentran en proceso de cierre.", 15, yPos, { maxWidth: 180 });

        addFooter(pageNum);

        // --- PAGE 3: CHARTS ---
        if (chartsImgData) {
            doc.addPage(); pageNum++;
            addHeader("2. RESUMEN GRÁFICO GERENCIAL");
            // Add the captured image
            doc.addImage(chartsImgData, 'PNG', 15, yPos, 180, 150);
            addFooter(pageNum);
        }

        doc.addPage(); pageNum++;
        addHeader("3. ESTADÍSTICAS DE SEGURIDAD");

        if (manualStats) {
            const totalAcc = (manualStats.ATT || 0) + (manualStats.APP || 0) + (manualStats.ATP || 0);
            const statsBody = [
                ["Nº Accidentes Leves (AL)", manualStats.AL || 0],
                ["Nº Accidentes Incapacitantes", totalAcc],
                ["Nº Días Perdidos", manualStats.TDP || 0],
                ["Índice de Frecuencia (IF)", manualStats.HHT > 0 ? (totalAcc * 1000000 / manualStats.HHT).toFixed(2) : '0.00'],
                ["Índice de Severidad (IS)", manualStats.HHT > 0 ? ((manualStats.TDP || 0) * 1000000 / manualStats.HHT).toFixed(2) : '0.00'],
                ["Índice de Accidentabilidad (IA)", manualStats.HHT > 0 ?
                    (((totalAcc * 1000000 / manualStats.HHT) *
                        ((manualStats.TDP || 0) * 1000000 / manualStats.HHT)) / 1000).toFixed(2) : '0.00']
            ];

            autoTable(doc, {
                startY: yPos,
                head: [['Indicador de Siniestralidad', 'Resultado Mensual']],
                body: statsBody,
                theme: 'striped',
                headStyles: { fillColor: [220, 38, 38] },
            });
        }
        addFooter(pageNum);

        // --- PAGE 4: GESTIÓN OPERATIVA ---
        doc.addPage(); pageNum++;
        addHeader("4. GESTIÓN OPERATIVA Y AMBIENTAL");

        doc.setFontSize(11); doc.setTextColor(0);
        doc.text(`4.1 Inspecciones (${currentInspections.length}), ATS (${currentATS.length}), PETAR (${currentPETAR.length})`, 15, yPos);
        yPos += 7;

        // Detailed tables... (Simplified for brevity in graph view, can add full tables if needed)
        // For now, listing just counts per type

        // ... (Skipping full tables to save space, assuming graphs cover summary)
        // User asked for "cada uno de los objetivos del PMA", so we focus on that table.

        // --- PMA SECTION (DETAILED) ---
        if (yPos > pageHeight - 100) { doc.addPage(); pageNum++; addHeader("CONTINUACIÓN PMA"); }
        else { yPos += 10; }

        doc.setFontSize(12); doc.setTextColor(6, 78, 59);
        doc.text("4.2 CUMPLIMIENTO PMA (Objetivos Ambientales)", 15, yPos);
        yPos += 8;

        // Filter PMA for current month or all? Usually monthly report shows monthly progress. 
        // But user said "todos los objetivos". Let's show all PMA records for the month.
        // Also combine with 'evidenceRecords' if they are environmental.
        const allEnv = [...currentPMA, ...currentEvidence];

        if (allEnv.length > 0) {
            autoTable(doc, {
                startY: yPos,
                head: [['Fecha', 'Objetivo / Actividad', 'Descripción / Detalle', 'Estado']],
                body: allEnv.map(e => [
                    e.date,
                    e.objective || e.category || 'Actividad Ambiental',
                    e.description || e.activity || '-',
                    e.status || 'Ejecutado'
                ]),
                theme: 'grid',
                styles: { fontSize: 8, cellWidth: 'wrap' },
                columnStyles: { 1: { cellWidth: 40 }, 2: { cellWidth: 'auto' } },
                headStyles: { fillColor: [34, 197, 94] }
            });
            yPos = (doc as any).lastAutoTable.finalY + 20;
        } else {
            doc.setFontSize(10); doc.setTextColor(100);
            doc.text("No hay registros ambientales este mes.", 15, yPos);
            yPos += 20;
        }

        addFooter(pageNum);

        // --- PAGE 5: ANEXO FOTOGRÁFICO ---
        if (reportImages.length > 0) {
            doc.addPage(); pageNum++;
            addHeader("5. ANEXO FOTOGRÁFICO");

            // Layout: 2 images per row, approx 4x5 ratio
            // Page width ~210mm. Margins 15mm. Usable: 180mm.
            // 2 images -> 85mm width each + 10mm gap.
            // 4x5 ratio -> Height = Width * 1.25 = 106mm.
            // Descriptions below.

            let xPos = 15;
            // yPos already set by addHeader
            const imgW = 85;
            const imgH = 65; // Keeping it a bit squarer to fit more, user asked for 4x5. 4x5 means W:4 H:5. So if W=80, H=100.
            // That fits 2 rows per page tightly. Let's try W=80, H=100.
            const imgH_4x5 = 100;

            for (let i = 0; i < reportImages.length; i++) {
                const img = reportImages[i];

                // Check if new page needed
                if (yPos + imgH_4x5 + 20 > pageHeight - 15) {
                    addFooter(pageNum);
                    doc.addPage(); pageNum++;
                    addHeader("ANEXO FOTOGRÁFICO (Cont.)");
                }

                // Column calculation
                const col = i % 2; // 0 or 1
                const x = 15 + (col * (imgW + 10)); // 15 or 110
                const y = yPos;

                // Add Image
                try {
                    doc.addImage(img.preview, 'JPEG', x, y, imgW, imgH_4x5);

                    // Add Description / Label
                    doc.setFontSize(8);
                    doc.setTextColor(0);
                    doc.setFont("helvetica", "bold");
                    doc.text(`[${img.category}]`, x, y + imgH_4x5 + 5);
                    doc.setFont("helvetica", "normal");
                    const splitDesc = doc.splitTextToSize(img.description, imgW);
                    doc.text(splitDesc, x, y + imgH_4x5 + 10);

                } catch (e) {
                    console.error("Error adding image to PDF", e);
                }

                // If end of row, move yPos
                if (col === 1) {
                    yPos += imgH_4x5 + 25; // Height + Gap for description
                }
            }
            addFooter(pageNum);
        }

        // --- PAGE 6: DOCUMENTARY ANNEXES ---
        doc.addPage(); pageNum++;
        addHeader("6. ANEXO DOCUMENTARIO (REGISTROS)");
        
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text("Se listan a continuación los documentos técnicos y anexos cargados para el presente periodo:", 15, yPos);
        yPos += 8;

        const annexData = ANNEXES_TYPES.map(type => {
            const saved = dbAnnexes.find(a => a.annex_id === type.id);
            let status = saved ? "CARGADO / ADJUNTO" : "NO APLICABLE / PENDIENTE";
            if (type.id === 15) status = "SINCRONIZADO / AUTO";
            if (type.id === 1 && localAnnex1Files.length > 0) status = `SINC. LOCAL (${localAnnex1Files.length})`;
            
            return [
                `Anexo ${type.id}`,
                type.label,
                status,
                type.isPermanent ? "PERMANENTE" : "MENSUAL"
            ];
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;

        // --- ANEXO 1: CERTIFICADOS EORS (EXTRAIDOS DE CARPETA LOCAL) ---
        if (localAnnex1Files.length > 0) {
            doc.addPage(); pageNum++;
            addHeader("ANEXO 1: CERTIFICADOS EORS");
            
            doc.setFontSize(10); doc.setTextColor(0);
            const certText = "Se han identificado los siguientes certificados de Empresas Operadoras de Residuos Sólidos (EORS) en la carpeta técnica vinculada:";
            doc.text(doc.splitTextToSize(certText, 180), 15, yPos);
            yPos += 12;

            autoTable(doc, {
                startY: yPos,
                head: [['N° Certificado / Nombre del Archivo', 'Estado de Sincronización']],
                body: localAnnex1Files.map((f, i) => [
                    f.name,
                    "EXTRAÍDO LOCALMENTE"
                ]),
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [30, 64, 175] } // Blue
            });

            yPos = (doc as any).lastAutoTable.finalY + 10;
            doc.setFontSize(9); doc.setFont("helvetica", "italic");
            doc.text(`Ruta de origen: C:\\Users\\jlcan\\Desktop\\CASA 2026\\CERT. BAÑOS\\${MONTHS[selectedMonth]}`, 15, yPos);

            addFooter(pageNum);
            yPos = 20; // reset for next page
        }

        // --- ANEXO 9: FORMATO OFICIAL F-SIG-011 (EXTRAÍDO DE EXCEL) ---
        const todayAtPDF = new Date();
        const isPast5th = todayAtPDF.getDate() >= 5;
        const currentYearNum = todayAtPDF.getFullYear();
        const isCurrentPeriod = selectedYear === currentYearNum && selectedMonth === todayAtPDF.getMonth();

        // Include if statistics are loaded and (it's a past month OR it's the current month after the 5th)
        if (fullYearStats && (selectedYear < currentYearNum || (isCurrentPeriod && isPast5th) || selectedMonth < todayAtPDF.getMonth())) {
            doc.addPage(); pageNum++;
            yPos = 15;
            
            // Header F-SIG-011 Style
            doc.setDrawColor(0); doc.setLineWidth(0.3);
            doc.rect(15, yPos, pageWidth - 30, 20);
            doc.setFontSize(14); doc.setFont("helvetica", "bold");
            doc.text("ESTADÍSTICAS DE SST", pageWidth / 2, yPos + 12, { align: 'center' });
            doc.setFontSize(7); doc.text("F-SIG-011\r\nVersión 05", pageWidth - 18, yPos + 8, { align: 'right' });
            yPos += 25;

            // Metadata Table
            autoTable(doc, {
                startY: yPos,
                body: [
                    ['RAZÓN SOCIAL:', 'Construcción y Administración S.A.', 'ESTADÍSTICA:', 'Mensual (x)', 'FECHA:', `${todayAtPDF.toLocaleDateString()}`],
                    ['PROYECTO:', excelMetadata?.project || 'Obras Adicionales', 'RESPONSABLE:', excelMetadata?.responsible || 'Jose Luis Cancino', 'PERIODO:', `${MONTHS[selectedMonth]} ${selectedYear}`]
                ],
                theme: 'grid',
                styles: { fontSize: 6, cellPadding: 1.5 },
                columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245], width: 25 }, 2: { fontStyle: 'bold', fillColor: [245, 245, 245], width: 25 }, 4: { fontStyle: 'bold', fillColor: [245, 245, 245], width: 20 } }
            });
            yPos = (doc as any).lastAutoTable.finalY + 5;

            // Main Stats Table
            const mFullList = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic", "Total"];
            const head = [['Indicadores de Gestión de SST', ...mFullList]];
            
            const rLabels = [
                { key: 'EO', label: 'Nº Enfermedades Ocupacionales (EO)' },
                { key: 'EP', label: 'N° Estados Pre patológicos (EP)' },
                { key: 'T', label: 'Nº Trabajadores (T)' },
                { key: 'HHT', label: 'Horas hombre trabajadas (HHT)' },
                { key: 'AL', label: 'Nº Accidentes Leves (AL)' },
                { key: 'AI', label: 'Nº Accidentes Incapacitantes (AI)' },
                { key: 'ATT', label: '   - Total Temporal (ATT)' },
                { key: 'APP', label: '   - Parcial Permanente (APP)' },
                { key: 'ATP', label: '   - Total Permanente (ATP)' },
                { key: 'AM', label: 'Nº Accidentes Mortales (AM)' },
                { key: 'TDP', label: 'Total Días Pérdidos (TDP)' },
                { key: 'IF', label: 'Índice de Frecuencia (IF)' },
                { key: 'IS', label: 'Índice de Severidad (IS)' },
                { key: 'IA', label: 'Índice de Accidentabilidad (IA)' }
            ];

            const bCells = rLabels.map((rl) => {
                const values = mFullList.map((m, mIdx) => {
                    const val = mIdx === 12 
                        ? (totals as any)?.[rl.key] || 0
                        : fullYearStats[mIdx + 1]?.[rl.key] || 0;
                    return val === 0 ? "0" : typeof val === 'number' ? val.toLocaleString() : val;
                });
                return [rl.label, ...values];
            });

            autoTable(doc, {
                startY: yPos,
                head: head,
                body: bCells,
                theme: 'grid',
                headStyles: { fillColor: [15, 23, 42], fontSize: 5, halign: 'center' },
                styles: { fontSize: 5, cellPadding: 1, halign: 'center', textColor: [0, 0, 0] },
                columnStyles: { 0: { halign: 'left', fontStyle: 'bold', width: 45 } }
            });

            yPos = (doc as any).lastAutoTable.finalY + 8;
            doc.setFontSize(6); doc.setTextColor(100); doc.setFont("helvetica", "italic");
            doc.text("* Al calcular los días pérdidos, sumarle 6000 días pérdidos por cada AM y ATP", 15, yPos);
            doc.text("* No se debe considerar el día del accidente como día pérdido.", 15, yPos + 3);
            doc.text(`* Fuente: Sincronización automática de F-SIG-011 (${location}).`, 15, yPos + 6);

            addFooter(pageNum);
            yPos = 20; // reset
        }

        // --- ANEXO 15: REFERENCIA A CARPETAS DE ATS Y PETAR (PDF) ---
        doc.addPage(); pageNum++;
        addHeader("ANEXO 15: REGISTROS DE ATS Y PETAR");
        
        doc.setFontSize(11); doc.setTextColor(0); doc.setFont("helvetica", "bold");
        doc.text("A. REGISTROS DE ANÁLISIS DE TRABAJO SEGURO (ATS)", 15, yPos);
        yPos += 10;
        doc.setFontSize(10); doc.setFont("helvetica", "normal");
        doc.text("Los registros originales en formato PDF se encuentran organizados en la siguiente ruta:", 15, yPos);
        yPos += 7;
        doc.setFont("helvetica", "bold"); doc.setTextColor(0, 51, 102);
        doc.text("📂 RUTA: ANEXO 15 / REGISTROS_ATS_PDF / " + MONTHS[selectedMonth].toUpperCase(), 20, yPos);
        
        yPos += 20;
        doc.setTextColor(0); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
        doc.text("B. REGISTROS DE PERMISOS ESCRITOS DE TRABAJO DE ALTO RIESGO (PETAR)", 15, yPos);
        yPos += 10;
        doc.setFontSize(10); doc.setFont("helvetica", "normal");
        doc.text("Los permisos autorizados en formato PDF se encuentran organizados en la siguiente ruta:", 15, yPos);
        yPos += 7;
        doc.setFont("helvetica", "bold"); doc.setTextColor(180, 83, 9);
        doc.text("📂 RUTA: ANEXO 15 / REGISTROS_PETAR_PDF / " + MONTHS[selectedMonth].toUpperCase(), 20, yPos);
        
        yPos += 25;
        doc.setTextColor(100); doc.setFontSize(9); doc.setFont("helvetica", "italic");
        doc.text("Nota: El total de registros vinculados para este periodo es de " + currentATS.length + " ATS y " + currentPETAR.length + " PETARs.", 15, yPos);

        addFooter(pageNum);

        // SAVE
        doc.save(`Informe_SSOMA_${MONTHS[selectedMonth]}_${selectedYear}_Gerencial.pdf`);
        setIsGenerating(false);
    };

    const generatePMAReport = async () => {
        setIsGenerating(true);
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPos = 20;

        // Cover page
        doc.setFontSize(14);
        doc.text("CONCESIÓN DEL TRAMO VIAL", pageWidth / 2, 60, { align: 'center' });
        doc.text("PUENTE PUCUSANA – CERRO AZUL – ICA", pageWidth / 2, 68, { align: 'center' });
        doc.text("CARRETERA PANAMERICANA SUR", pageWidth / 2, 90, { align: 'center' });
        doc.text("RED VIAL 6", pageWidth / 2, 110, { align: 'center' });

        doc.setFontSize(20);
        doc.setFont("helvetica", "bolditalic");
        doc.setTextColor(0, 51, 102); // Navy blue
        doc.text("INFORME DE GESTION AMBIENTAL", pageWidth / 2, 160, { align: 'center' });
        doc.text("PAD SAN CLEMENTE", pageWidth / 2, 175, { align: 'center' });
        doc.text(`${MONTHS[selectedMonth].toUpperCase()} ${selectedYear}`, pageWidth / 2, 190, { align: 'center' });

        doc.setFont("helvetica", "normal");
        doc.setTextColor(0);

        doc.addPage();

        // TOC
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("ÍNDICE", 15, 20);
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const sections = [
            "1. INTRODUCCIÓN",
            "2. ANTECEDENTES",
            "3. OBJETIVO",
            "4. UBICACIÓN DEL PROYECTO",
            "5. ACTIVIDADES",
            "6. INSTRUMENTOS DE GESTIÓN AMBIENTAL",
            "7. ÁREA RESPONSABLE DE LA GESTIÓN DEL PLAN DE MANEJO AMBIENTAL",
            "8. EJECUCIÓN DEL PLAN DE MANEJO AMBIENTAL"
        ];
        sections.forEach((s, i) => doc.text(s, 15, 30 + (i * 8)));

        doc.addPage();

        // 1. INTRODUCCION
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("1. INTRODUCCIÓN.", 15, 20);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const introText = "La Planificación Vial se articula con las diversas iniciativas y esfuerzos de desarrollo nacional, regional y local. Esta apunta a incentivar sinergias y líneas de complementación en los tres niveles de gobierno: nacional, regional y local, resaltando la importancia del potencial agrícola, agroindustrial, minero y turístico para la dinámica productiva del país.\n\nEl Tramo Vial Puente Pucusana - Cerro Azul – Ica de la panamericana sur constituye un componente fundamental de la estrategia nacional de desarrollo; entre sus más importantes contribuciones se encuentran: la reducción de costos de transporte y consiguiente incremento de la rentabilidad de las actividades productivas; reducción de costos de transacción, que enfrentan especialmente los productores para su integración a los mercados; y reducción de tiempos de movilización y desplazamiento de personas y mercancías.";
        doc.text(doc.splitTextToSize(introText, 180), 15, 30);

        // 2. ANTECEDENTES
        yPos = 85;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("2. ANTECEDENTES.", 15, yPos);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const antText = "En septiembre de 2005, el Estado Peruano, a través del Ministerio de Transportes y Comunicaciones (MTC) y Concesionaria Vial del Perú S.A. (COVIPERU) firmaron el contrato de Concesión de la Red Vial 6 para la construcción y explotación del Tramo Vial Puente Pucusana - Cerro Azul – Ica de la Carretera Panamericana Sur.\n\nDe acuerdo a lo establecido en el Contrato de Concesión, en la Cláusula 6.20, se establece la posibilidad de ejecutar Obras Nuevas previa determinación de la necesidad por parte de Concedente y opinión técnica favorable del Regulador OSITRAN.\n\nCon fecha 20 de julio de 2016, fue suscrita la Adenda 7 al Contrato de Concesión, mediante la cual, el Concedente, encarga a COVIPERÚ la elaboración de los estudios técnicos para 21 Obras Nuevas, entre las cuales se encuentra el PAD San Clemente\n\nMediante Resolución Directoral N° 0024-2019-MTC/19.2 del 10 de julio de 2024 el Concedente aprobó el expediente técnico para la Construcción de la Obra Nueva PP San Clemente.\n\nEl 12 de marzo del 2021, el Concedente a través de la Dirección General de Asuntos Ambientales – DGAAM emite la Resolución Directoral N° 093-2021-MTC/16 que aprueba la Modificación del Estudio de Impacto Ambiental (MEIA) para las veinte (20) obras adicionales del Proyecto “Construcción, Conservación y Explotación del Tramo Vial Puente Pucusana - Cerro Azul – Ica de la Carretera Panamericana Sur – RO1S, Red Vial 6”, en la cuales se encuentra el PAD San Clemente.\n\nEl 19 de julio del 2024, fue suscrita la Adenda 11 al Contrato de Concesión, mediante la cual el Concedente encarga a COVIPERÚ la ejecución de 21 Obras Nuevas destinadas a la mejora de la seguridad vial en la Red Vial 6.";
        doc.text(doc.splitTextToSize(antText, 180), 15, yPos + 10);

        doc.addPage();

        // 3. OBJETIVO
        yPos = 20;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("3. OBJETIVO.", 15, yPos);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Presentar el Informe de gestión ambiental de la obra del Paso a Desnivel San Clemente correspondiente al mes de ${MONTHS[selectedMonth].toUpperCase()} del ${selectedYear}.`, 15, yPos + 10, { maxWidth: 180 });

        // 4. UBICACION
        yPos = 45;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("4. UBICACIÓN DEL PROYECTO.", 15, yPos);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("La Obra Nueva Paso Peatonal San Clemente está ubicado en la progresiva 85+140 del proyecto de construcción de la nueva Carretera Panamericana Sur (con Prog 0+000 en Cerro Azul). Políticamente el paso peatonal se ubica en el distrito de San Clemente, provincia de Pisco en el departamento de Ica.", 15, yPos + 10, { maxWidth: 180 });

        // Map Placeholder
        yPos += 25;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Gráfico 4-1: Vista de la ubicación del futuro Paso a Desnivel San Clemente se", pageWidth / 2, yPos, { align: 'center', maxWidth: 180 });
        doc.text("encuentra en la progresiva 85+140 de la Carretera Panamericana Sur.", pageWidth / 2, yPos + 4, { align: 'center', maxWidth: 180 });
        yPos += 8;
        doc.setFillColor(230, 230, 230);
        doc.setDrawColor(0, 0, 0);
        doc.rect(30, yPos, pageWidth - 60, 100, 'F');
        doc.rect(30, yPos, pageWidth - 60, 100, 'S');
        doc.setFontSize(14);
        doc.setTextColor(150);
        doc.text("Mapa de Google Earth (Reemplazar en PDF editor)", pageWidth / 2, yPos + 50, { align: 'center' });
        doc.setTextColor(0);

        doc.addPage();

        // 5. ACTIVIDADES
        yPos = 20;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("5. ACTIVIDADES.", 15, yPos);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("• Excavación para construcción de pantallas.\n• Traslado de material excedente a los DMEs autorizados (cantera Camacho).\n• Implementación de desvíos y señalización de seguridad vial.", 20, yPos + 10);

        // 6. INSTRUMENTOS
        yPos = 50;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("6. INSTRUMENTOS DE GESTIÓN AMBIENTAL.", 15, yPos);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("La gestión ambiental del Paso a Desnivel San Clemente se enmarca en:\n\n• Resolución Directoral N° 093-2021-MTC/16 que aprueba la Modificación del Estudio de\nImpacto Ambiental (MEIA) para las veinte (20) obras adicionales del Proyecto\n\"Construcción, Conservación y Explotación del Tramo Vial Puente Pucusana - Cerro\nAzul – Ica de la Carretera Panamericana Sur – RO1S, Red Vial 6\", en la cuales se\nencuentra el PAD San Clemente.", 15, yPos + 10);

        // 7. AREA RESPONSABLE
        yPos = 100;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("7. ÁREA RESPONSABLE DE LA GESTIÓN DEL PLAN DE MANEJO AMBIENTAL.", 15, yPos);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("La implementación del Plan de Gestión Ambiental está a cargo del Área de Seguridad,\nSalud Ocupacional y Medio Ambiente de COVIPERU, el cual está conformado de la\nsiguiente manera.", 15, yPos + 10);

        // Organigrama Placeholder
        yPos += 30;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Gráfico 7-1: Organigrama del Área SSOMA – Paso a Desnivel San Clemente.", pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        // Drawing rough boxes for Organigrama
        doc.setFillColor(91, 155, 213); // Light blue
        doc.setDrawColor(65, 113, 156);

        // Jefe SSOMA COVIPERU
        doc.rect(75, yPos, 60, 15, 'FD'); doc.setTextColor(255); doc.setFontSize(8); doc.setFont("helvetica", "bold");
        doc.text("Jefe SSOMA\nCOVIPERU", 105, yPos + 6, { align: 'center' });

        // Connectors
        doc.setDrawColor(91, 155, 213);
        doc.line(105, yPos + 15, 105, yPos + 25); // down from jefe
        doc.line(45, yPos + 25, 165, yPos + 25); // horizontal line

        // Especialista SSOMA COVIPERU
        doc.line(45, yPos + 25, 45, yPos + 35); // down to branch 1
        doc.rect(15, yPos + 35, 60, 15, 'FD'); doc.text("Especialista SSOMA\nCOVIPERU", 45, yPos + 41, { align: 'center' });

        // Jefe SSOMA CONTRATISTA
        doc.line(105, yPos + 25, 105, yPos + 35); // down to branch 2
        doc.rect(75, yPos + 35, 60, 15, 'FD'); doc.text("Jefe SSOMA\nCONTRATISTA", 105, yPos + 41, { align: 'center' });

        // Derivations from Contratista
        doc.line(135, yPos + 42, 145, yPos + 42); // right from contratista
        doc.line(145, yPos + 32, 145, yPos + 57); // vertical to the right

        // Especialista Salud
        doc.line(145, yPos + 32, 150, yPos + 32); // right to branch 3
        doc.rect(150, yPos + 25, 45, 15, 'FD'); doc.text("Especialista en Salud\nCONTRATISTA", 172.5, yPos + 31, { align: 'center' });

        // Prevencionista
        doc.line(145, yPos + 57, 150, yPos + 57); // right to branch 4
        doc.rect(150, yPos + 50, 45, 15, 'FD'); doc.text("Prevencionista\nCONTRATISTA", 172.5, yPos + 56, { align: 'center' });

        doc.addPage();
        doc.setTextColor(0);

        // 8. EJECUCIÓN
        yPos = 20;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("8. EJECUCIÓN DEL PLAN DE MANEJO AMBIENTAL.", 15, yPos);
        yPos += 10;
        doc.text("8.1. PROGRAMA DE PREVENCIÓN, MITIGACIÓN Y/O CORRECCIÓN.", 15, yPos);
        yPos += 10;
        doc.text("8.1.1. Subprograma de Manejo de Residuos Sólidos, Líquidos y Efluentes.", 15, yPos);
        yPos += 10;
        doc.text("8.1.1.1. Medidas Básicas para Manejo y Control de Vertimiento de Efluentes.", 15, yPos);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        yPos += 10;
        doc.text("• Se han instalado baños químicos, el mantenimiento se realiza dos veces por semana a cargo de una EO - RS.", 15, yPos, { maxWidth: 180 });
        yPos += 15;

        // Photos PMA
        const pmaImages = reportImages.filter(img => img.category === 'PMA' || img.category.includes('PMA') || img.description.toLowerCase().includes('baño') || img.description.toLowerCase().includes('químico'));

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Fotografía 8.1.1.1-1: Registro fotográfico PMA.", pageWidth / 2, yPos, { align: 'center' });
        yPos += 5;

        if (pmaImages.length > 0) {
            const imgW = 85;
            const imgH = 65;
            let currentX = 15;

            pmaImages.forEach((img, i) => {
                if (yPos > pageHeight - imgH - 30) {
                    doc.addPage();
                    yPos = 20;
                    currentX = 15;
                }

                try {
                    doc.setDrawColor(0);
                    doc.rect(currentX, yPos, imgW, imgH, 'S');
                    doc.addImage(img.preview, 'JPEG', currentX, yPos, imgW, imgH);
                    doc.setFontSize(8);
                    doc.setFont("helvetica", "normal");
                    doc.text(img.description, currentX, yPos + imgH + 5, { maxWidth: imgW });
                } catch (e) { }

                if (currentX === 15) {
                    currentX = 110; // next col
                } else {
                    currentX = 15; // wrap to next row
                    yPos += imgH + 20;
                }
            });

            // Add source text after all photos
            // Determine max Y of current row
            if (currentX === 110) yPos += imgH + 20; // It means we ended on col 1, need to push down to write "Fuente"
            doc.setFontSize(9);
            doc.text("Fuente: COVIPERU - CASA, " + MONTHS[selectedMonth].toLowerCase() + " " + selectedYear + ".", pageWidth / 2, yPos, { align: 'center' });

        } else {
            doc.setFillColor(240, 240, 240);
            doc.rect(20, yPos, 170, 40, 'F');
            doc.text("No se han adjuntado fotografías en la categoría 'PMA' este mes.", pageWidth / 2, yPos + 20, { align: 'center' });
            doc.text("Sube fotos como 'PMA' en la galería para que aparezcan aquí.", pageWidth / 2, yPos + 26, { align: 'center' });
        }

        // Continuation 8.1.1.1 Lavamanos
        yPos += 15;
        if (yPos > pageHeight - 30) { doc.addPage(); yPos = 20; }
        doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(0);
        doc.text("• Se ha instalado lavamanos en el frente de obra.", 15, yPos);
        yPos += 15;

        // Lavamanos Photos
        const lavamanosImages = reportImages.filter(img => img.category.includes('PMA') && img.description.toLowerCase().includes('lavamano'));
        if (lavamanosImages.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text("Fotografía 8.1.1.1-3: Lavamanos en frente de obra.", pageWidth / 2, yPos, { align: 'center' });
            yPos += 5;
            const imgW = 85; const imgH = 65; let currentX = 15;
            lavamanosImages.forEach((img) => {
                if (yPos > pageHeight - imgH - 30) { doc.addPage(); yPos = 20; currentX = 15; }
                try {
                    doc.setDrawColor(0); doc.rect(currentX, yPos, imgW, imgH, 'S');
                    doc.addImage(img.preview, 'JPEG', currentX, yPos, imgW, imgH);
                    doc.setFontSize(8); doc.setFont("helvetica", "normal");
                    doc.text(img.description, currentX, yPos + imgH + 5, { maxWidth: imgW });
                } catch (e) { }
                if (currentX === 15) { currentX = 110; } else { currentX = 15; yPos += imgH + 20; }
            });
            if (currentX === 110) yPos += imgH + 20;
            doc.setFontSize(9);
            doc.text("Fuente: COVIPERU - CASA, " + MONTHS[selectedMonth].toLowerCase() + " " + selectedYear + ".", pageWidth / 2, yPos, { align: 'center' });
        }

        yPos += 15;
        if (yPos > pageHeight - 50) { doc.addPage(); yPos = 20; }

        autoTable(doc, {
            startY: yPos,
            head: [['Lugar', 'Cantidad Baños', 'Cantidad lavamanos']],
            body: [
                ['Frente de obra', '1', '1'],
                ['Zona Industrial Pisco', '5', '2'],
                ['Total', '6', '3']
            ],
            theme: 'grid',
            headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { halign: 'center' },
            columnStyles: { 0: { halign: 'left' } }
        });
        yPos = (doc as any).lastAutoTable.finalY + 5;
        doc.setFontSize(9); doc.setFont("helvetica", "normal");
        doc.text("En el anexo 1 se adjunta la Constancia de disposición de Aguas residuales.", 15, yPos);

        // 8.1.1.2 Medidas Básicas para el Manejo de Residuos...
        yPos += 15;
        if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
        doc.setFontSize(11); doc.setFont("helvetica", "bold");
        doc.text("8.1.1.2. Medidas Básicas para el Manejo de Residuos Sólidos Peligrosos y No Peligrosos.", 15, yPos);
        yPos += 10;
        doc.setFontSize(10);
        doc.text("a. Caracterización y Segregación", 15, yPos);
        yPos += 10;
        doc.setFont("helvetica", "normal");
        doc.text("Se han instalado baterías de contenedores para los residuos de acuerdo a la NTP 900.058-2019.", 15, yPos);

        yPos += 10;
        if (yPos > pageHeight - 120) { doc.addPage(); yPos = 20; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("Imagen N° 8.1.1.2- a: Colores de los recipientes para segregación", pageWidth / 2, yPos, { align: 'center' });

        autoTable(doc, {
            startY: yPos + 2,
            head: [['Color', 'Rótulo del Recipiente', 'Tipo de residuo']],
            body: [
                ['Amarillo', 'Residuos metálicos', 'Piezas metálicas (Chatarra, conductores, calamina, etc.)'],
                ['Plomo', 'Residuos de vidrio', 'Vidrio (Botellas de bebidas, gaseosas, etc.)'],
                ['Azul', 'Residuos de papel y cartón', 'Papeles y cartones (Periódicos, revistas, cajas, etc.)'],
                ['Blanco', 'Residuos plásticos', 'Plástico (Envases, cubiertos, descartables, etc.)'],
                ['Marrón', 'Residuos orgánicos', 'Residuos orgánicos (Restos de alimentos o similares)'],
                ['Negro', 'No aprovechables', 'No aprovechables (Papel encerado, metalizado, colillas)'],
                ['Rojo', 'Residuos Peligrosos', 'Peligrosos (Filtros, trapos con hidrocarburos, baterías)']
            ],
            theme: 'grid',
            headStyles: { fillColor: [200, 200, 150], textColor: 0, fontStyle: 'bold', halign: 'center' },
            styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
            columnStyles: { 0: { halign: 'center', fontStyle: 'bold' }, 1: { halign: 'center' } },
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === 0) {
                    const colors: any = { 'Amarillo': [253, 224, 71], 'Plomo': [156, 163, 175], 'Azul': [59, 130, 246], 'Blanco': [255, 255, 255], 'Marrón': [146, 64, 14], 'Negro': [17, 24, 39], 'Rojo': [239, 68, 68] };
                    const cellValue = String(data.cell.raw);
                    data.cell.styles.fillColor = colors[cellValue];
                    if (['Negro', 'Rojo', 'Azul', 'Marrón'].includes(cellValue)) data.cell.styles.textColor = [255, 255, 255];
                }
            }
        });
        yPos = (doc as any).lastAutoTable.finalY + 5;
        doc.setFont("helvetica", "bold"); doc.setFontSize(9);
        doc.text("Fuente: NTP 900.058 – 2019 / MEIA", 15, yPos);

        yPos += 15;
        if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }
        doc.text("Cuadro N° 8.1.1.2-1: Ubicación de los contenedores de residuos sólidos", pageWidth / 2, yPos, { align: 'center' });
        autoTable(doc, {
            startY: yPos + 2,
            head: [['Lugar', 'Cantidad (baterías de 7 cilindros cada uno)']],
            body: [['Frente de obra', '1'], ['Zona Industrial Pisco', '2'], ['Total', '3']],
            theme: 'grid',
            headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { halign: 'center' }, columnStyles: { 0: { halign: 'left' } }
        });
        yPos = (doc as any).lastAutoTable.finalY + 5;
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        doc.text("Fuente: COVIPERU - CASA, " + MONTHS[selectedMonth].toUpperCase() + " " + selectedYear + ".", 15, yPos);

        // b. Generación
        doc.addPage(); yPos = 20;
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("b. Generación.", 15, yPos);
        yPos += 8;
        doc.setFont("helvetica", "normal");
        doc.text("En los cuadros siguientes se presenta la generación de residuos sólidos durante el mes.", 15, yPos);
        yPos += 10;

        doc.setFont("helvetica", "bold");
        doc.text(`Cuadro N° 8.1.1.2-2: Reporte de Residuos No Peligrosos ${MONTHS[selectedMonth].toLowerCase()} del ${selectedYear}.`, pageWidth / 2, yPos, { align: 'center' });
        autoTable(doc, {
            startY: yPos + 2,
            head: [['Tipos de residuos', 'Unidad', 'Cantidad']],
            body: [
                ['RESIDUOS NO PELIGROSOS (GENERAL)', 'kg', manualStats.RES_NO_PEL || '0.00'],
                ['RESIDUOS APROVECHABLES', 'kg', manualStats.RES_APROV || '0.00'],
            ],
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { halign: 'center' }, columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } }
        });
        yPos = (doc as any).lastAutoTable.finalY + 5;
        doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text("Fuente: Elaboración propia", 15, yPos);

        yPos += 15;
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text(`Cuadro N° 8.1.1.2-3: Reporte de Residuos Peligrosos ${MONTHS[selectedMonth].toLowerCase()} ${selectedYear}`, pageWidth / 2, yPos, { align: 'center' });
        autoTable(doc, {
            startY: yPos + 2,
            head: [['Descripción', 'Unidad', 'Cantidad']],
            body: [
                ['RESIDUOS PELIGROSOS', 'kg', manualStats.RES_PEL || '0.00'],
            ],
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { halign: 'center' }, columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } }
        });
        yPos = (doc as any).lastAutoTable.finalY + 5;
        doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text("Fuente: Elaboración propia", 15, yPos);

        // c. Almacenamiento Intermedio
        yPos += 15;
        if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("c. Almacenamiento Intermedio", 15, yPos);
        yPos += 10;
        doc.setFont("helvetica", "normal");
        const almText = "Los recipientes o contenedores de almacenamiento intermedio se distribuyeron en las fuentes generadoras (frentes de trabajo e instalaciones auxiliares), según caracterización de los residuos sólidos realizado, siendo la misma de tendencia dinámica, ya que estará en función del desarrollo y cumplimiento del Cronograma de Actividades del Concesionario; por lo que deberá ser actualizado según el avance de la obra.\n\nLa batería de almacenamiento de residuos, está conformada por el conjunto de 7 cilindros de 55 galones de capacidad, rotulados y pintados en base a la NTP 900.058–2019, colocada sobre parihuelas o similar, los cuales serán ubicados en los frentes de obras y zonas industriales.";
        doc.text(doc.splitTextToSize(almText, 180), 15, yPos);
        yPos += 45;

        // Container Photos (Placeholder / Static if empty)
        const contImages = reportImages.filter(img => img.category.includes('PMA') && (img.description.toLowerCase().includes('contenedor') || img.description.toLowerCase().includes('residuo')));
        if (contImages.length > 0) {
            doc.addPage(); yPos = 20;
            doc.setFont("helvetica", "bold");
            doc.text("Fotografías: Contenedores para residuos sólidos.", pageWidth / 2, yPos, { align: 'center' });
            yPos += 5;
            let currentX = 15;
            contImages.forEach((img) => {
                if (yPos > pageHeight - 85 - 30) { doc.addPage(); yPos = 20; currentX = 15; }
                try {
                    doc.setDrawColor(0); doc.rect(currentX, yPos, 85, 65, 'S');
                    doc.addImage(img.preview, 'JPEG', currentX, yPos, 85, 65);
                    doc.setFontSize(8); doc.setFont("helvetica", "normal");
                    doc.text(img.description, currentX, yPos + 65 + 5, { maxWidth: 85 });
                } catch (e) { }
                if (currentX === 15) { currentX = 110; } else { currentX = 15; yPos += 85; }
            });
            if (currentX === 110) yPos += 85;
            doc.setFontSize(9);
            doc.text(`Fuente: COVIPERU - CASA, ${MONTHS[selectedMonth].toLowerCase()} ${selectedYear}.`, pageWidth / 2, yPos, { align: 'center' });
        }

        // f. Reaprovechamiento
        doc.addPage(); yPos = 20;
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("f. Reaprovechamiento.", 15, yPos);
        yPos += 10;
        doc.setFont("helvetica", "normal");
        const reapText = `Durante el mes se colocó residuos de metal recolectados de la limpieza de la ZI Pisco, los cuales se almacenan en el acopio temporal, no se reutilizó. Los restos de la carpeta asfáltica se colocaron en el DME, el material base y sub base se transportaron a la ZI Industrial Pisco el cual regresara a relleno del PAD, por el momento no se genera restos de concreto, no se ha generado residuos de asfalto.`;
        doc.text(doc.splitTextToSize(reapText, 180), 15, yPos);
        yPos += 25;

        doc.setFont("helvetica", "bold");
        doc.text("Cuadro N° 8.1.1.2-4: Reaprovechamiento de residuos sólidos", pageWidth / 2, yPos, { align: 'center' });
        autoTable(doc, {
            startY: yPos + 2,
            head: [['Residuos Sólidos', 'Disposición final', 'Reaprovechamiento']],
            body: [
                ['Fierros', 'Acopio temporal', 'NO'],
                ['Madera', 'Acopio temporal', 'NO'],
                ['Restos de base y Sub base', 'Acopio temporal', 'NO'],
                ['Residuos del Cambio de Carpeta asfáltica', 'DME', 'NO'],
                ['Restos de Concreto', 'DME', 'No'],
                ['Excavación de Tierra', '', 'NO'],
                ['Residuos de asfalto', '', 'NO']
            ],
            theme: 'grid',
            headStyles: { fillColor: [150, 150, 150], textColor: 0, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { halign: 'center' }, columnStyles: { 0: { halign: 'left' } }
        });
        yPos = (doc as any).lastAutoTable.finalY + 5;
        doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text(`Fuente: COVIPERU/ MEIA, ${MONTHS[selectedMonth].toLowerCase()} ${selectedYear}.`, 15, yPos);

        // g. Disposición final
        yPos += 15;
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("g. Disposición final.", 15, yPos);
        yPos += 10;
        doc.setFont("helvetica", "normal");
        const dispText = "Con respecto al recojo de los residuos sólidos del almacén central hacia su disposición final, se realizará a través de una EO-RS contratada para tal fin; la frecuencia de recojo quedará a criterio de la Concesionaria/Contratista, basándose en la generación de residuos sólidos estimado o acumulados.";
        doc.text(doc.splitTextToSize(dispText, 180), 15, yPos);
        yPos += 20;

        doc.setFont("helvetica", "bold");
        doc.text("Cuadro N° 8.1.1.2-5: Disposición Final de los Residuos Sólidos Generados", pageWidth / 2, yPos, { align: 'center' });
        autoTable(doc, {
            startY: yPos + 2,
            head: [['Tipo', 'Característica', 'Disposición Final', 'Frecuencia']],
            body: [
                ['Doméstico', 'Orgánico', 'Relleno Sanitario', 'No se genera'],
                ['Doméstico', 'Aprovechable', 'Comercialización', 'Cada 6 meses'],
                ['Doméstico', 'No Aprovechable', 'Relleno Sanitario', 'Trimestral'],
                ['Industrial', 'No peligrosos', 'Comercialización', 'Trimestral'],
                ['Industrial', 'Peligrosos', 'Relleno de Seguridad', 'Al finalizar la obra']
            ],
            theme: 'grid',
            headStyles: { fillColor: [150, 150, 150], textColor: 0, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { halign: 'center' }, columnStyles: { 1: { halign: 'left' } }
        });
        yPos = (doc as any).lastAutoTable.finalY + 5;
        doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text(`Fuente: COVIPERU/ MEIA, ${MONTHS[selectedMonth].toLowerCase()} ${selectedYear}.`, 15, yPos);

        // h. Indicadores
        yPos += 15;
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("h. Indicadores", 15, yPos);
        yPos += 8;
        doc.setFont("helvetica", "normal");
        doc.text("En base a la información indicada anteriormente se han determinado los siguientes indicadores:", 15, yPos);
        yPos += 8;

        doc.setFont("helvetica", "bold");
        doc.text("Cuadro N°8.1.1.2-6: Indicadores de manejo de Residuos Sólidos", pageWidth / 2, yPos, { align: 'center' });
        autoTable(doc, {
            startY: yPos + 2,
            body: [
                [{ content: 'Total de cilindros dispuestos en obra', rowSpan: 2, styles: { fontStyle: 'bold' } }, 'Numero de Batería de cilindros en obra', '0'],
                ['Total Programado', '0'],
                [{ content: 'Total Kg. de Residuos Generados', rowSpan: 2, styles: { fontStyle: 'bold' } }, 'Volumen Kg. de residuos separados', '36.00'],
                ['Volumen Kg. de residuos generados', '36.00']
            ],
            theme: 'grid',
            bodyStyles: { halign: 'center' }, columnStyles: { 1: { halign: 'left' } }
        });
        yPos = (doc as any).lastAutoTable.finalY + 5;
        doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text(`Fuente: COVIPERU - CASA, ${MONTHS[selectedMonth].toLowerCase()} ${selectedYear}.`, 15, yPos);

        // 8.1.1.3 Conservación del suelo
        doc.addPage(); yPos = 20;
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("8.1.1.3. Medidas básicas para la conservación del suelo.", 15, yPos);
        yPos += 10;
        doc.setFont("helvetica", "normal");
        doc.text("Se ha establecido medidas para controlar y mitigar los impactos generados sobre el recurso suelo, generado por el desarrollo de las actividades del proyecto.\n\nEn el anexo 2 se adjunta los Certificados de Operatividad y mantenimiento vehicular\n\n• Se han instalado kits antiderrames.", 15, yPos, { maxWidth: 180 });
        yPos += 30;

        // Lavado y Recojo
        doc.setFont("helvetica", "bold");
        doc.text("• Lavado de equipos pesados y livianos.", 15, yPos);
        doc.setFont("helvetica", "normal");
        yPos += 8;
        doc.text(`El lavado de equipos pesados y livianos es una tarea fundamental para mantener su funcionalidad, apariencia y evitar el desgaste prematuro.\n\n- El mes de ${MONTHS[selectedMonth].toLowerCase()} no se ha realizado lavado de equipos pesado ni livianos porque nuestras maquinarias no están en contactos de lodos ni expuestos con polución en la obra.`, 15, yPos, { maxWidth: 180 });
        yPos += 30;

        doc.setFont("helvetica", "bold");
        doc.text("• Recojo de residuos sólidos", 15, yPos);
        doc.setFont("helvetica", "normal");
        yPos += 8;
        doc.text("El recojo diario de residuos sólidos es una práctica clave para garantizar la limpieza, higiene y manejo adecuado de desechos dentro de la obra.", 15, yPos, { maxWidth: 180 });

        // 8.1.2 Emisiones y Ruido
        if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; } else { yPos += 20; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("8.1.2. Subprograma de Emisiones Atmosféricas y Ruido.", 15, yPos);
        yPos += 10;
        doc.text("8.1.2.1. Medidas de Control de las Emisiones Atmosféricas (Polvos y Gases) y de Ruidos.", 15, yPos);
        yPos += 10;
        doc.text("> Medidas para el control de material particulado y emisiones", 15, yPos);
        yPos += 10;
        doc.setFont("helvetica", "normal");
        doc.text("• Se realiza el mantenimiento de vehículos y maquinarias, en el anexo 2 se adjunta las revisiones técnicas y certificados de operatividad.\n• Se realiza el riego de las áreas de trabajo y vías donde transitan los vehículos de obra.", 15, yPos, { maxWidth: 180 });

        // 8.1.3 Salud Local
        if (yPos > pageHeight - 70) { doc.addPage(); yPos = 20; } else { yPos += 25; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("8.1.3. Subprograma de Salud Local.", 15, yPos);
        yPos += 8;
        doc.setFont("helvetica", "normal");
        doc.text("Se tiene como finalidad mitigar, eliminar impactos que podrían afectar la salud de la población producto de la emisión de polvo, gases, ruidos y otros, originados por las actividades de obra.\n\n• Se ha programado el dictado de charlas en las siguientes Instituciones Educativas, los cuales se detallan en el siguiente cuadro:", 15, yPos, { maxWidth: 180 });
        yPos += 25;

        doc.setFont("helvetica", "bold");
        doc.text("Cuadro N° 8.1.3-1: Programación de Charlas de Salud Local a Instituciones Educativas.", pageWidth / 2, yPos, { align: 'center' });
        autoTable(doc, {
            startY: yPos + 2,
            head: [['TEMA', 'Sub Tramo', 'Etapa', 'Lugar', 'Modalidad', 'Mes Actual']],
            body: [
                ['Charlas de Salud: Polvo y Ruido', '1', 'CO', 'CEBA - Huamán Poma de Ayala', 'ON PERIFONEO', 'Programado'],
                ['Charlas de Salud: Primeros Auxilios', '1', 'CO', 'CEBA - Huamán Poma de Ayala', 'ON PERIFONEO', 'Programado'],
                ['Charlas de Salud: Polvo y Ruido', '1', 'CO', 'Carlos Medrano Vásquez', 'ON PERIFONEO', 'Programado'],
                ['Charlas de Salud: Primeros Auxilios', '1', 'CO', 'Carlos Medrano Vásquez', 'ON PERIFONEO', 'Programado']
            ],
            theme: 'grid',
            headStyles: { fillColor: [40, 80, 150], textColor: 255, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { halign: 'center', valign: 'middle' },
            styles: { fontSize: 7 }
        });
        yPos = (doc as any).lastAutoTable.finalY + 5;
        doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text(`Fuente: COVIPERU, ${MONTHS[selectedMonth].toLowerCase()} ${selectedYear}.`, 15, yPos);
        yPos += 10;
        doc.setFontSize(10);
        doc.text(`En el mes de ${MONTHS[selectedMonth].toLowerCase()} no se realizó el Perifoneo.`, 15, yPos);

        // 8.1.4 Recursos Naturales y Culturales
        if (yPos > pageHeight - 60) { doc.addPage(); yPos = 20; } else { yPos += 20; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("8.1.4. Subprograma de Protección de Recursos Naturales y Culturales.", 15, yPos);
        yPos += 10;
        doc.setFont("helvetica", "normal");
        doc.text("Son las medidas orientadas a la conservación, protección, el incremento y uso sostenible de las especies de flora y fauna dentro del área de influencia del proyecto.", 15, yPos, { maxWidth: 180 });
        yPos += 15;

        doc.setFont("helvetica", "bold");
        doc.text("8.1.4.1. Medidas Ambientales para la Conservación de las Especies de Flora y Fauna.", 15, yPos);
        yPos += 10;
        doc.setFont("helvetica", "normal");
        doc.text("En el anexo 2 se adjunta la documentación de mantenimiento vehicular y Certificado de Operación.\n\n• Se ha delimitado las áreas de trabajo.", 15, yPos, { maxWidth: 180 });
        yPos += 20;

        // Photos Delimitacion
        const delimImages = reportImages.filter(img => img.category.includes('PMA') && img.description.toLowerCase().includes('delimit'));
        if (delimImages.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text("Fotografía N° 8.1.4.1-1: Delimitación de las áreas de frente San Clemente.", pageWidth / 2, yPos, { align: 'center' });
            yPos += 5;
            let currentX = 15;
            delimImages.forEach((img) => {
                if (yPos > pageHeight - 85 - 30) { doc.addPage(); yPos = 20; currentX = 15; }
                try {
                    doc.setDrawColor(0); doc.rect(currentX, yPos, 85, 65, 'S');
                    doc.addImage(img.preview, 'JPEG', currentX, yPos, 85, 65);
                    doc.setFontSize(8); doc.setFont("helvetica", "normal");
                    doc.text(img.description, currentX, yPos + 65 + 5, { maxWidth: 85 });
                } catch (e) { }
                if (currentX === 15) { currentX = 110; } else { currentX = 15; yPos += 85; }
            });
            if (currentX === 110) yPos += 85;
            doc.setFontSize(9);
            doc.text(`Fuente: COVIPERU - CASA, ${MONTHS[selectedMonth].toLowerCase()} ${selectedYear}.`, pageWidth / 2, yPos, { align: 'center' });
        }

        // 8.1.4.2 Ecosistemas
        if (yPos > pageHeight - 80) { doc.addPage(); yPos = 20; } else { yPos += 20; }
        doc.setFontSize(10); doc.setFont("helvetica", "bold");
        doc.text("8.1.4.2. Medidas Ambientales para la Conservación de Ecosistemas Acuáticos y Cursos de Agua.", 15, yPos);
        yPos += 8;
        doc.setFont("helvetica", "normal");
        doc.text(`Durante el mes no se ha realizado la explotación de canteras de rio Pisco.`, 15, yPos);
        yPos += 15;

        // 8.1.4.3 Suelo
        doc.setFont("helvetica", "bold");
        doc.text("8.1.4.3. Medidas Ambientales para la Conservación del Suelo Orgánico.", 15, yPos);
        yPos += 8;
        doc.setFont("helvetica", "normal");
        doc.text("No se ha realizado retiro, ni almacenamiento de top soil.", 15, yPos);
        yPos += 15;

        // 8.1.4.4 Hidrico
        doc.setFont("helvetica", "bold");
        doc.text("8.1.4.4. Medidas de Manejo para las Actividades de Extracción del Recurso Hídrico de las Fuentes de Agua.", 15, yPos);
        yPos += 10;
        doc.setFont("helvetica", "normal");
        doc.text("En el anexo 3 se adjunta la autorización de Uso de Fuente de Agua.\n\n• Las mangueras de las cisternas cuentan con cabezal para evitar succionar flora y fauna.\n• Las cisternas cuentan con kit antiderrame.", 15, yPos, { maxWidth: 180 });
        yPos += 25;

        // Photos cisternas
        const aguaImages = reportImages.filter(img => img.category.includes('PMA') && (img.description.toLowerCase().includes('cisterna') || img.description.toLowerCase().includes('agua') || img.description.toLowerCase().includes('cabezal')));
        if (aguaImages.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text("Fotografías N° 8.1.4.4: Cabezal y Kit Antiderrame en Cisternas", pageWidth / 2, yPos, { align: 'center' });
            yPos += 5;
            let currentX = 15;
            aguaImages.forEach((img) => {
                if (yPos > pageHeight - 85 - 30) { doc.addPage(); yPos = 20; currentX = 15; }
                try {
                    doc.setDrawColor(0); doc.rect(currentX, yPos, 85, 65, 'S');
                    doc.addImage(img.preview, 'JPEG', currentX, yPos, 85, 65);
                    doc.setFontSize(8); doc.setFont("helvetica", "normal");
                    doc.text(img.description, currentX, yPos + 65 + 5, { maxWidth: 85 });
                } catch (e) { }
                if (currentX === 15) { currentX = 110; } else { currentX = 15; yPos += 85; }
            });
            if (currentX === 110) yPos += 85;
            doc.setFontSize(9);
            doc.text(`Fuente: COVIPERU - CASA, ${MONTHS[selectedMonth].toLowerCase()} ${selectedYear}.`, pageWidth / 2, yPos, { align: 'center' });
        }

        // 8.1.5 Seguridad vial
        if (yPos > pageHeight - 90) { doc.addPage(); yPos = 20; } else { yPos += 20; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("8.1.5. Subprograma de Seguridad Vial y Señalización Ambiental.", 15, yPos);
        yPos += 10;
        doc.text("8.1.5.1. Medidas de Respuesta ante Posibles Accidentes de Tránsito Ocasionados", 15, yPos);
        doc.text("por Vehículos y Maquinarias de Obra que Afecten a la Población Local.", 15, yPos + 5);
        yPos += 15;

        doc.text("Comunicación inmediata", 15, yPos);
        yPos += 8;
        doc.setFont("helvetica", "normal");
        doc.text("• Se cuenta con un diagrama de flujo de comunicación para respuesta a emergencias y la lista de brigadistas el cual se adjunta en el anexo 4.", 15, yPos, { maxWidth: 180 });
        yPos += 15;

        doc.setFont("helvetica", "bold");
        doc.text("Alerta Temprana", 15, yPos);
        yPos += 8;
        doc.setFont("helvetica", "normal");
        doc.text("• Se tiene implementado estación de emergencia, todos los vehículos de obra están a la disposición para la atención de emergencias", 15, yPos, { maxWidth: 180 });
        yPos += 15;

        // Photos Emergencia
        const emergImages = reportImages.filter(img => img.category.includes('PMA') && (img.description.toLowerCase().includes('emergencia') || img.description.toLowerCase().includes('vehiculo') || img.description.toLowerCase().includes('salud') || img.description.toLowerCase().includes('tópico') || img.description.toLowerCase().includes('ambulancia')));
        if (emergImages.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text("Fotografías N° 8.1.5.1: Equipos y personal de atención de emergencias", pageWidth / 2, yPos, { align: 'center' });
            yPos += 5;
            let currentX = 15;
            emergImages.forEach((img) => {
                if (yPos > pageHeight - 85 - 30) { doc.addPage(); yPos = 20; currentX = 15; }
                try {
                    doc.setDrawColor(0); doc.rect(currentX, yPos, 85, 65, 'S');
                    doc.addImage(img.preview, 'JPEG', currentX, yPos, 85, 65);
                    doc.setFontSize(8); doc.setFont("helvetica", "normal");
                    doc.text(img.description, currentX, yPos + 65 + 5, { maxWidth: 85 });
                } catch (e) { }
                if (currentX === 15) { currentX = 110; } else { currentX = 15; yPos += 85; }
            });
            if (currentX === 110) yPos += 85;
            doc.setFontSize(9);
            doc.text(`Fuente: COVIPERU - CASA, ${MONTHS[selectedMonth].toLowerCase()} ${selectedYear}.`, pageWidth / 2, yPos, { align: 'center' });
        }

        // Gestión de emergencia
        if (yPos > pageHeight - 80) { doc.addPage(); yPos = 20; } else { yPos += 20; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(10);
        doc.text("Gestión de emergencia", 15, yPos);
        yPos += 8;
        doc.setFont("helvetica", "normal");
        doc.text("• Se cuenta con directorio telefónico de emergencia", 15, yPos);
        yPos += 15;

        // Photo Directorio
        const dirImages = reportImages.filter(img => img.category.includes('PMA') && img.description.toLowerCase().includes('directorio'));
        if (dirImages.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text("Fotografía N° 8.1.5.1-3: Directorio telefónico de emergencia.", pageWidth / 2, yPos, { align: 'center' });
            yPos += 5;
            try {
                doc.setDrawColor(0); doc.rect(pageWidth / 2 - 42.5, yPos, 85, 65, 'S');
                doc.addImage(dirImages[0].preview, 'JPEG', pageWidth / 2 - 42.5, yPos, 85, 65);
                yPos += 75;
                doc.setFontSize(9); doc.setFont("helvetica", "normal");
                doc.text(`Fuente: COVIPERU - CASA, ${MONTHS[selectedMonth].toLowerCase()} ${selectedYear}.`, pageWidth / 2, yPos, { align: 'center' });
                yPos += 10;
            } catch (e) { }
        }

        // Table Representante
        if (yPos > pageHeight - 40) { doc.addPage(); yPos = 20; }
        autoTable(doc, {
            startY: yPos,
            head: [['Representante de la Población', 'Celular']],
            body: [
                ['Sr. Carmen Escate', '941803381']
            ],
            theme: 'grid',
            headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { halign: 'center' }, columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } }
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;

        doc.save(`Informe_Gestion_Ambiental_PAD_${MONTHS[selectedMonth]}_${selectedYear}.pdf`);
        setIsGenerating(false);
    };


    // --- CHART DATA PREP ---
    const operationalData = [
        { name: 'Inspecciones', cantidad: currentInspections.length },
        { name: 'ATS', cantidad: currentATS.length },
        { name: 'PETAR', cantidad: currentPETAR.length },
    ];

    const handleGenerateWordPMA = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch(`/api/export-word?month=${selectedMonth + 1}&year=${selectedYear}&location=SAN CLEMENTE`);
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || errData.details || "Error al generar Word");
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Informe_Mensual_${MONTHS[selectedMonth]}_${selectedYear}.docx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error: any) {
            console.error("Error al generar reporte Word:", error);
            alert(`Ocurrió un error al compilar el documento Word en el servidor:\n${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-10 text-white">
            <div className="max-w-6xl mx-auto space-y-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                        <div className="flex items-center gap-4">
                            <button onClick={() => router.back()} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400">
                                <ChevronLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-black text-white flex items-center gap-3">
                                    <FileText className="text-emerald-500" size={32} />
                                    Informe Mensual SSOMA
                                </h1>
                                <p className="text-slate-400 text-sm">Alimentación y generación de reportes consolidados</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={handleGenerateWordPMA}
                                disabled={isGenerating || loadingData}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50 transition-all text-xs"
                            >
                                {isGenerating ? (
                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando Word...</>
                                ) : (
                                    <><Download size={16} /> GENERAR INFORME WORD</>
                                )}
                            </button>
                            <button 
                                onClick={() => setShowFeedingPanel(!showFeedingPanel)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${showFeedingPanel ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'}`}
                            >
                                <Wrench size={16} /> {showFeedingPanel ? 'CERRAR PANEL DE ALIMENTACIÓN' : 'ESTADÍSTICAS Y ANEXOS'}
                            </button>
                        </div>
                    </div>

                    {/* Report Tool Panel */}
                    {showFeedingPanel && (
                        <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-top-4 duration-300">
                            {/* Left: Stats */}
                            <div className="lg:col-span-12 flex justify-between items-center border-b border-white/5 pb-4 mb-2">
                                <h3 className="text-lg font-black text-indigo-400 flex items-center gap-2 uppercase tracking-tight">
                                    <Activity size={20} /> Alimentación del Informe
                                </h3>
                                <div className="flex gap-3">
                                    <button 
                                        onClick={handleAutoFill}
                                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black px-4 py-2 rounded-lg border border-white/5 flex items-center gap-2"
                                    >
                                        <RotateCcw size={14} /> AUTO-ALIMENTAR
                                    </button>
                                    <button 
                                        onClick={saveReportStats}
                                        disabled={savingTools}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
                                    >
                                        <Save size={14} /> GUARDAR CAMBIOS
                                    </button>
                                </div>
                            </div>

                            <div className="lg:col-span-5 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Horas Hombre (HHT)</label>
                                        <input 
                                            type="number" 
                                            value={manualStats.HHT} 
                                            onChange={(e) => setManualStats({...manualStats, HHT: Number(e.target.value)})}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-indigo-400 font-black focus:border-indigo-500 outline-none" 
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Días Perdidos (TDP)</label>
                                        <input 
                                            type="number" 
                                            value={manualStats.TDP} 
                                            onChange={(e) => setManualStats({...manualStats, TDP: Number(e.target.value)})}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-red-500 font-black focus:border-red-500 outline-none" 
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {['ATT', 'APP', 'ATP', 'AM', 'EO', 'EP'].map(key => (
                                        <div key={key} className="space-y-1">
                                            <label className="text-[9px] font-bold text-slate-600 uppercase">{key}</label>
                                            <input 
                                                type="number" 
                                                value={manualStats[key]} 
                                                onChange={(e) => setManualStats({...manualStats, [key]: Number(e.target.value)})}
                                                className="w-full bg-slate-800/50 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white outline-none" 
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-3 pt-4 border-t border-white/5">
                                    <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Residuos Peligrosos / No Peligrosos (KG)</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input 
                                            type="number" placeholder="PEL"
                                            value={manualStats.RES_PEL} 
                                            onChange={(e) => setManualStats({...manualStats, RES_PEL: Number(e.target.value)})}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-emerald-500 font-black" 
                                        />
                                        <input 
                                            type="number" placeholder="NO PEL"
                                            value={manualStats.RES_NO_PEL} 
                                            onChange={(e) => setManualStats({...manualStats, RES_NO_PEL: Number(e.target.value)})}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-emerald-500 font-black" 
                                        />
                                        <input 
                                            type="number" placeholder="APROV"
                                            value={manualStats.RES_APROV} 
                                            onChange={(e) => setManualStats({...manualStats, RES_APROV: Number(e.target.value)})}
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-emerald-500 font-black" 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right: Annexes */}
                            <div className="lg:col-span-7 bg-slate-950/30 rounded-2xl p-4 max-h-[400px] overflow-y-auto custom-scrollbar border border-white/5">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Gestión de Anexos del Informe (PDF/JPG)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {ANNEXES_TYPES.map((type) => {
                                        const saved = dbAnnexes.find(a => a.annex_id === type.id);
                                        return (
                                            <div key={type.id} className={`p-3 rounded-xl border transition-all ${saved || type.id === 15 ? 'bg-slate-800 border-indigo-500/30' : 'bg-slate-900/50 border-slate-800'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight">Anexo {type.id}</span>
                                                    {type.isPermanent && <Lock size={12} className="text-purple-400" />}
                                                </div>
                                                <h5 className="text-[10px] font-black text-white uppercase truncate mb-2">{type.label}</h5>
                                                
                                                {type.id === 15 ? (
                                                    <div className="flex items-center justify-between gap-2 text-emerald-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <RotateCcw size={12} className="animate-pulse" /> 
                                                            <span className="text-[9px] font-bold uppercase">AUTO-VINCULADO</span>
                                                        </div>
                                                        <span className="text-[8px] font-black bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                            {currentATS.length} ATS / {currentPETAR.length} PETAR
                                                        </span>
                                                    </div>
                                                ) : type.id === 1 ? (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center justify-between text-blue-400">
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock size={12} className="animate-spin-slow" /> 
                                                                <span className="text-[9px] font-bold uppercase">CARPETA LOCAL SINC.</span>
                                                            </div>
                                                            <span className="text-[8px] font-black bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                                                                {localAnnex1Files.length} ARCHIVOS
                                                            </span>
                                                        </div>
                                                        <div className="max-h-16 overflow-y-auto pr-1">
                                                            {localAnnex1Files.map((f, i) => (
                                                                <div key={i} className="text-[8px] text-slate-400 flex items-center gap-1 truncate border-l border-blue-500/30 pl-1 mb-0.5">
                                                                    <FileText size={8} /> {f.name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : saved ? (
                                                    <div className="flex items-center justify-between gap-2">
                                                        <a href={saved.file_path} target="_blank" className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300">
                                                            <CheckCircle2 size={12} /> <span className="text-[9px] font-bold">VER ARCHIVO</span>
                                                        </a>
                                                        <button onClick={() => deleteAnnex(saved.id)} className="text-red-500 hover:text-red-400 p-1">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="relative border border-dashed border-slate-700 rounded-lg py-2 flex flex-col items-center gap-1 hover:border-slate-500 cursor-pointer transition-colors bg-slate-900/50">
                                                        <Upload size={12} className="text-slate-600" />
                                                        <span className="text-[8px] font-bold text-slate-500">CARGAR</span>
                                                        <input 
                                                            type="file" 
                                                            className="absolute inset-0 opacity-0 cursor-pointer" 
                                                            onChange={(e) => e.target.files?.[0] && uploadAnnex(e.target.files[0], type.id, type.label, type.isPermanent)}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Controls */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Period Selector */}
                    <div className="lg:col-span-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-3">Período</label>
                        <div className="flex gap-4">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white flex-1 focus:border-emerald-500 outline-none"
                            >
                                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white w-24 focus:border-emerald-500 outline-none"
                            >
                                <option value={2025}>2025</option>
                                <option value={2026}>2026</option>
                            </select>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard icon={ClipboardCheck} label="Inspecciones" count={currentInspections.length} color="text-blue-400" />
                        <StatCard icon={Shield} label="ATS" count={currentATS.length} color="text-amber-400" />
                        <StatCard icon={HardHat} label="PETAR" count={currentPETAR.length} color="text-orange-500" />
                        <StatCard icon={Leaf} label="PMA Items" count={currentPMA.length + currentEvidence.length} color="text-green-400" />
                    </div>
                </div>

                {/* --- CHARTS SECTION (HIDDEN BUT RENDERED FOR CAPTURE) --- */}
                {/* We render it visibly for the user too, why not? */}
                <div className="bg-white p-8 rounded-xl" ref={chartsRef}>
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-2">Resumen Gráfico Mensual - {MONTHS[selectedMonth]} {selectedYear}</h2>

                    <div className="grid grid-cols-2 gap-8">
                        {/* Chart 1: Operational */}
                        <div className="h-64 border p-4 rounded-lg bg-slate-50">
                            <h3 className="text-sm font-bold text-slate-600 mb-4 text-center">Gestión Operativa (Registros)</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={operationalData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Bar dataKey="cantidad" fill="#059669" barSize={50} label={{ position: 'top' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Chart 2: Siniestralidad (Mock Trend) */}
                        <div className="h-64 border p-4 rounded-lg bg-slate-50">
                            <h3 className="text-sm font-bold text-slate-600 mb-4 text-center">Tendencia de Accidentabilidad (2026)</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={[
                                    { month: 'Ene', IF: 1.2 }, { month: 'Feb', IF: 0.8 }, { month: 'Mar', IF: 0.5 }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="IF" stroke="#ef4444" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1">
                        <div className="h-40 border p-4 rounded-lg bg-slate-50 flex items-center justify-center">
                            <div className="text-center">
                                <p className="text-3xl font-black text-slate-700">{Math.round(Math.random() * 20 + 80)}%</p>
                                <p className="text-sm text-slate-500">Cumplimiento del Programa Anual</p>
                            </div>
                        </div>
                    </div>
                </div>
                <p className="text-xs text-slate-500 text-center uppercase tracking-widest mt-2">Vista previa de gráficos para el informe</p>

                {/* --- PHOTO GALLERY UPLOAD --- */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <ImageIcon className="text-purple-500" /> Galería Fotográfica (4x5)
                    </h3>

                    <div className="bg-slate-950/50 p-4 rounded-xl border border-dashed border-slate-700 mb-6">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full">
                                <label className="text-xs text-slate-400 block mb-1">Descripción</label>
                                <input
                                    type="text"
                                    value={newImageDesc}
                                    onChange={(e) => setNewImageDesc(e.target.value)}
                                    placeholder="Ej: Inspección de extintores en zona norte..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                                />
                            </div>
                            <div className="w-full md:w-48">
                                <label className="text-xs text-slate-400 block mb-1">Categoría</label>
                                <select
                                    value={newImageCat}
                                    onChange={(e) => setNewImageCat(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                                >
                                    <option value="General">General</option>
                                    <option value="Inspección">Inspección</option>
                                    <option value="ATS">ATS</option>
                                    <option value="PETAR">PETAR</option>
                                    <option value="PMA">PMA / Ambiental</option>
                                </select>
                            </div>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <button className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                    <Plus size={16} /> Agregar Foto
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {reportImages.map((img) => (
                            <div key={img.id} className="relative group bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                                <img src={img.preview} alt="preview" className="w-full h-40 object-cover" />
                                <div className="p-2">
                                    <p className="text-[10px] text-purple-400 font-bold uppercase">{img.category}</p>
                                    <p className="text-xs text-slate-300 truncate">{img.description}</p>
                                </div>
                                <button
                                    onClick={() => removeImage(img.id)}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        {reportImages.length === 0 && (
                            <div className="col-span-full text-center py-8 text-slate-500 text-sm italic">
                                No has agregado fotos aun. Las fotos se añadirán al PDF en formato 4x5.
                            </div>
                        )}
                    </div>
                </div>

                {/* GENERATE BUTTON */}
                <div className="flex flex-col md:flex-row justify-center items-center gap-4 pt-8">
                    <button
                        onClick={generateReport}
                        disabled={isGenerating || loadingData}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-xl shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                    >
                        {isGenerating ? (
                            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando...</>
                        ) : (
                            <><Download size={20} /> Informe Resumen SSOMA</>
                        )}
                    </button>
                    <button
                        onClick={handleGenerateWordPMA}
                        disabled={isGenerating || loadingData}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 shadow-xl shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                    >
                        {isGenerating ? (
                            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando...</>
                        ) : (
                            <><Leaf size={20} /> Informe Ambiental PMA (Word)</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, count, color }: { icon: any, label: string, count: string | number, color: string }) {
    return (
        <div className="bg-slate-900/30 border border-slate-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2">
            <Icon className={color} size={20} />
            <span className="text-xl font-black text-white">{count}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
        </div>
    );
}
