"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { FileText, Download, Calendar, ChevronLeft, Activity, Shield, Leaf, ClipboardCheck } from "lucide-react";
import jsPDF from "jspdf";

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function MonthlyReportPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isGenerating, setIsGenerating] = useState(false);

    // Data
    const [hhcRecords, setHhcRecords] = useState<any[]>([]);
    const [evidenceRecords, setEvidenceRecords] = useState<any[]>([]);
    const [pmaRecords, setPmaRecords] = useState<any[]>([]);
    const [inspectionRecords, setInspectionRecords] = useState<any[]>([]);

    // Verificar acceso
    useEffect(() => {
        if (user && user.role !== 'developer' && user.role !== 'manager') {
            router.push('/');
        }
    }, [user, router]);

    // Cargar datos
    useEffect(() => {
        try {
            const hhc = localStorage.getItem('hhc_records');
            if (hhc) setHhcRecords(JSON.parse(hhc));
        } catch (e) { }

        try {
            const ev = localStorage.getItem('evidence_center_records');
            if (ev) setEvidenceRecords(JSON.parse(ev));
        } catch (e) { }

        try {
            const pma = localStorage.getItem('pma_evidence_records');
            if (pma) setPmaRecords(JSON.parse(pma));
        } catch (e) { }

        try {
            const insp = localStorage.getItem('inspections_records');
            if (insp) setInspectionRecords(JSON.parse(insp));
        } catch (e) { }
    }, []);

    // Filtrar por mes/año
    const filterByMonth = (records: any[]) => {
        return (records || []).filter(r => {
            if (!r.date) return false;
            const parts = r.date.split('-');
            if (parts.length < 2) return false;
            return parseInt(parts[0]) === selectedYear && parseInt(parts[1]) - 1 === selectedMonth;
        });
    };

    const filteredHHC = filterByMonth(hhcRecords);
    const filteredEvidence = filterByMonth(evidenceRecords);
    const filteredPMA = filterByMonth(pmaRecords);
    const filteredInspections = filterByMonth(inspectionRecords);

    const totalHHC = filteredHHC.reduce((acc, r) => acc + (Number(r.hhc) || 0), 0);
    const totalParticipants = filteredHHC.reduce((acc, r) => acc + (Number(r.hombres) || 0) + (Number(r.mujeres) || 0), 0);

    // Generar PDF
    const generateReport = async () => {
        setIsGenerating(true);

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            let y = 25;

            // PORTADA
            doc.setFontSize(20);
            doc.setTextColor(0, 100, 0);
            doc.text("INFORME MENSUAL", pageWidth / 2, y, { align: 'center' });
            y += 10;
            doc.setFontSize(16);
            doc.setTextColor(40);
            doc.text("SEGURIDAD, SALUD Y MEDIO AMBIENTE", pageWidth / 2, y, { align: 'center' });
            y += 12;
            doc.setFontSize(14);
            doc.setTextColor(80);
            doc.text(`${MONTHS[selectedMonth]} ${selectedYear}`, pageWidth / 2, y, { align: 'center' });
            y += 15;

            doc.setDrawColor(0, 100, 0);
            doc.setLineWidth(0.5);
            doc.line(20, y, pageWidth - 20, y);
            y += 15;

            // RESUMEN
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 100, 0);
            doc.text("RESUMEN EJECUTIVO", 20, y);
            y += 8;

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0);
            doc.text(`• Horas Hombre Capacitación: ${totalHHC} horas`, 25, y); y += 6;
            doc.text(`• Participantes en formación: ${totalParticipants}`, 25, y); y += 6;
            doc.text(`• Inspecciones realizadas: ${filteredInspections.length}`, 25, y); y += 6;
            doc.text(`• Evidencias registradas: ${filteredEvidence.length}`, 25, y); y += 6;
            doc.text(`• Actividades PMA: ${filteredPMA.length}`, 25, y); y += 12;

            // HHC
            if (filteredHHC.length > 0) {
                doc.setFont("helvetica", "bold");
                doc.setTextColor(16, 185, 129);
                doc.text("FORMACIÓN Y CAPACITACIÓN", 20, y);
                y += 7;
                doc.setFont("helvetica", "normal");
                doc.setTextColor(0);
                doc.setFontSize(9);
                filteredHHC.slice(0, 8).forEach(r => {
                    if (y > 270) { doc.addPage(); y = 20; }
                    doc.text(`${r.date} | ${(r.tema || 'Sin tema').substring(0, 45)} | ${r.responsable || 'N/A'}`, 25, y);
                    y += 5;
                });
                y += 8;
            }

            // INSPECCIONES
            if (filteredInspections.length > 0) {
                if (y > 250) { doc.addPage(); y = 20; }
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(59, 130, 246);
                doc.text("INSPECCIONES", 20, y);
                y += 7;
                doc.setFont("helvetica", "normal");
                doc.setTextColor(0);
                doc.setFontSize(9);
                filteredInspections.slice(0, 8).forEach(r => {
                    if (y > 270) { doc.addPage(); y = 20; }
                    doc.text(`${r.date} | ${(r.actividad || 'Inspección').substring(0, 45)} | ${r.responsable || 'N/A'}`, 25, y);
                    y += 5;
                });
                y += 8;
            }

            // EVIDENCIAS
            if (filteredEvidence.length > 0) {
                if (y > 250) { doc.addPage(); y = 20; }
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(236, 72, 153);
                doc.text("EVIDENCIAS DE OBJETIVOS", 20, y);
                y += 7;
                doc.setFont("helvetica", "normal");
                doc.setTextColor(0);
                doc.setFontSize(9);
                filteredEvidence.slice(0, 8).forEach(r => {
                    if (y > 270) { doc.addPage(); y = 20; }
                    doc.text(`${r.date} | ${r.objective || ''} | ${(r.description || '').substring(0, 40)}`, 25, y);
                    y += 5;
                });
                y += 8;
            }

            // PMA
            if (filteredPMA.length > 0) {
                if (y > 250) { doc.addPage(); y = 20; }
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(34, 197, 94);
                doc.text("PLAN DE MANEJO AMBIENTAL", 20, y);
                y += 7;
                doc.setFont("helvetica", "normal");
                doc.setTextColor(0);
                doc.setFontSize(9);
                filteredPMA.slice(0, 8).forEach(r => {
                    if (y > 270) { doc.addPage(); y = 20; }
                    doc.text(`${r.date} | ${(r.category || '').substring(0, 35)} | ${r.location || 'N/A'} | ${r.images?.length || 0} fotos`, 25, y);
                    y += 5;
                });
                y += 8;
            }

            // GALERÍA
            const allImages = filteredPMA.flatMap(r => r.images || []).slice(0, 4);
            if (allImages.length > 0) {
                doc.addPage();
                y = 20;
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(0, 100, 0);
                doc.text("GALERÍA FOTOGRÁFICA", pageWidth / 2, y, { align: 'center' });
                y += 12;

                for (const img of allImages) {
                    if (y > 200) { doc.addPage(); y = 20; }
                    try {
                        doc.addImage(img, 'JPEG', 25, y, 160, 70);
                        y += 80;
                    } catch (e) { }
                }
            }

            // PIE
            const totalPages = doc.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`SSOMA Platform - ${MONTHS[selectedMonth]} ${selectedYear}`, 20, 290);
                doc.text(`Página ${i}/${totalPages}`, pageWidth - 35, 290);
            }

            doc.save(`Informe_SSOMA_${MONTHS[selectedMonth]}_${selectedYear}.pdf`);
            alert("✅ Informe generado");

        } catch (error) {
            console.error(error);
            alert("❌ Error al generar");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!user || (user.role !== 'developer' && user.role !== 'manager')) {
        return <div className="flex items-center justify-center h-screen bg-slate-950 text-white">Acceso restringido</div>;
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6 md:p-10">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-white flex items-center gap-2">
                            <FileText className="text-emerald-500" /> Informe del Mes
                        </h1>
                        <p className="text-slate-400 text-sm">Genera un PDF consolidado de actividades</p>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-blue-400" /> Seleccionar Período
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Mes</label>
                            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1">
                                {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Año</label>
                            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1">
                                <option value={2025}>2025</option>
                                <option value={2026}>2026</option>
                                <option value={2027}>2027</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                        <Activity className="mx-auto text-emerald-400 mb-1" size={20} />
                        <p className="text-lg font-black text-white">{totalHHC}h</p>
                        <p className="text-[9px] text-emerald-400 uppercase">HHC</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                        <ClipboardCheck className="mx-auto text-blue-400 mb-1" size={20} />
                        <p className="text-lg font-black text-white">{filteredInspections.length}</p>
                        <p className="text-[9px] text-blue-400 uppercase">Insp</p>
                    </div>
                    <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-3">
                        <Shield className="mx-auto text-pink-400 mb-1" size={20} />
                        <p className="text-lg font-black text-white">{filteredEvidence.length}</p>
                        <p className="text-[9px] text-pink-400 uppercase">Evid</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                        <Leaf className="mx-auto text-green-400 mb-1" size={20} />
                        <p className="text-lg font-black text-white">{filteredPMA.length}</p>
                        <p className="text-[9px] text-green-400 uppercase">PMA</p>
                    </div>
                </div>

                <button onClick={generateReport} disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 disabled:opacity-50">
                    {isGenerating ? (
                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generando...</>
                    ) : (
                        <><Download size={20} /> Descargar Informe PDF</>
                    )}
                </button>
            </div>
        </div>
    );
}
