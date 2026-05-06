"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
    ShieldCheck, 
    Plus, 
    Search, 
    Calendar, 
    FileText, 
    Trash2, 
    Download, 
    Loader2, 
    AlertCircle,
    CheckCircle2,
    X,
    ArrowRight,
    Filter,
    Clock,
    Users
} from 'lucide-react';
import { uploadEvidence } from "@/lib/uploadClient";

// Versión estable de PDF.js
const PDF_JS_VERSION = '3.11.174'; 
const APP_VERSION = '2026.05.06.v2'; // Forzando nueva compilación

interface SCTRMonthlyRecord {
    id: number;
    month: string;
    year: number;
    company: string;
    policy_number: string;
    expiration_date: string;
    file_url: string;
    personnel_list: string;
}

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const COMPANIES = ["CASA", "CONTRATISTA", "SUB-CONTRATISTA", "OTROS"];

export default function SCTRPage() {
    const [records, setRecords] = useState<SCTRMonthlyRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // Form state
    const [form, setForm] = useState({
        month: MONTHS[new Date().getMonth()],
        year: new Date().getFullYear(),
        company: 'CASA',
        policy_number: '',
        expiration_date: '',
        file_url: '',
        personnel_list: ''
    });

    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = async () => {
        try {
            const res = await fetch('/api/sctr-records');
            const data = await res.json();
            if (data.success) setRecords(data.records);
        } catch (error) {
            console.error("Error loading records:", error);
        } finally {
            setIsLoaded(true);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (selectedFile.type !== 'application/pdf') {
            alert("⚠️ Solo se permiten archivos PDF.");
            return;
        }

        setIsUploading(true);
        try {
            // 1. Preparar datos para el Log del Excel
            const logData = {
                control: "SCTR",
                periodo: `${form.month} ${form.year}`,
                empresa: form.company,
                detalle: `Póliza: ${form.policy_number || 'N/A'}, Vencimiento: ${form.expiration_date || 'N/A'}`
            };

            // 2. Subir el archivo al almacenamiento (Blob/Drive) y anotar en Excel
            const url = await uploadEvidence(
                selectedFile,
                'SCTR',
                `SCTR_${form.company}_${form.month}_${form.year}`,
                form.expiration_date || new Date().toISOString().split('T')[0],
                'SISTEMA',
                'sctr',
                'seguridad',
                'GENERAL',
                undefined, // objective
                logData // Enviamos los datos al Excel
            );
            setForm(prev => ({ ...prev, file_url: url }));

            // 2. Robot Local (Browser-side) - Versión Inmune a Vercel
            try {
                const script = document.createElement('script');
                script.src = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_JS_VERSION}/pdf.min.js`;
                document.head.appendChild(script);

                script.onload = async () => {
                    try {
                        // @ts-ignore
                        const pdfjsLib = window['pdfjs-dist/build/pdf'];
                        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDF_JS_VERSION}/pdf.worker.min.js`;

                        const arrayBuffer = await selectedFile.arrayBuffer();
                        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                        const pdf = await loadingTask.promise;
                        
                        let fullText = "";
                        for (let i = 1; i <= Math.min(pdf.numPages, 100); i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            const pageText = textContent.items.map((item: any) => item.str).join(" ");
                            fullText += pageText + "\n";
                        }

                        // Preservamos saltos de línea pero limpiamos espacios múltiples horizontales
                        const text = fullText.split('\n')
                            .map(line => line.replace(/[^\S\r\n]+/g, ' ').trim())
                            .filter(line => line.length > 0)
                            .join('\n');
                        
                        console.log(`[Robot Browser] Extraído: ${text.length} caracteres.`);

                        let extractedDate = '';
                        let extractedPolicy = '';

                        const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
                        if (dateMatch) {
                            const [_, day, month, year] = dateMatch;
                            extractedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                        }

                        const policyMatch = text.match(/(?:Póliza|Poliza|N°|Nro|Contrato)\s*:?\s*([A-Z0-9\-\/]{5,})/i);
                        if (policyMatch) extractedPolicy = policyMatch[1];

                        setForm(prev => ({ 
                            ...prev, 
                            personnel_list: text,
                            expiration_date: extractedDate || prev.expiration_date,
                            policy_number: extractedPolicy || prev.policy_number
                        }));
                        
                        alert(`✅ Robot Browser Activo: ${text.length} caracteres extraídos de ${pdf.numPages} páginas.`);
                    } catch (innerErr) {
                        console.error("[Robot Browser] Error interno:", innerErr);
                        alert("⚠️ Error al procesar el contenido del PDF. Ingrese los datos manualmente.");
                    }
                };

                script.onerror = () => {
                    alert("❌ No se pudo cargar el motor del robot. Verifique su conexión a internet.");
                };
            } catch (browserErr: any) {
                console.error("[Robot Browser] Error de inicio:", browserErr);
            }
        } catch (uploadErr: any) {
            console.error("Error al subir archivo:", uploadErr);
            alert("❌ Error al subir el archivo al almacenamiento.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.file_url) return alert("❌ Debe subir el PDF de la póliza.");
        if (isUploading) return alert("⏳ Por favor espere a que el robot termine de leer el PDF.");
        if (!form.personnel_list && !confirm("⚠️ El robot no ha detectado nombres en el PDF. ¿Desea registrar la bitácora sin lista de personal?")) return;
        
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/sctr-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'create', 
                    data: { ...form, policy_number: form.policy_number || 'S/N' } 
                })
            });

            if (res.ok) {
                alert("✨ ¡Bitácora actualizada!");
                setForm({ 
                    month: MONTHS[new Date().getMonth()], 
                    year: new Date().getFullYear(), 
                    company: 'CASA', 
                    policy_number: '', 
                    expiration_date: '', 
                    file_url: '', 
                    personnel_list: '' 
                });
                setShowForm(false);
                loadRecords();
            }
        } catch (error: any) {
            alert(`❌ Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar este registro de la bitácora?")) return;
        try {
            await fetch('/api/sctr-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', data: { id } })
            });
            loadRecords();
        } catch (error) {
            console.error("Error deleting record:", error);
        }
    };

    const getMatchesFromRecord = (record: SCTRMonthlyRecord, search: string) => {
        if (!search || search.length < 3 || !record?.personnel_list) return [];
        
        const normalize = (text: string) => 
            (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            
        const target = normalize(search).trim();
        const targetWords = target.split(/\s+/).filter(w => w.length >= 2);
        
        // Si no hay palabras válidas de búsqueda, retornamos vacío
        if (targetWords.length === 0) return [];

        const lines = record.personnel_list.split('\n');
        const matches: string[] = [];

        for (const line of lines) {
            const normalizedLine = normalize(line);
            if (!normalizedLine.trim()) continue;

            // Búsqueda por DNI (numérico)
            if (/^\d+$/.test(target)) {
                const dniRegex = new RegExp(`(?<!\\d)${target}(?!\\d)`);
                if (dniRegex.test(normalizedLine)) {
                    matches.push(line.trim());
                }
            } else {
                // COINCIDENCIA ESTRICTA: Todas las palabras deben estar EN LA MISMA LÍNEA
                if (targetWords.every(word => normalizedLine.includes(word))) {
                    matches.push(line.trim());
                }
            }
        }
        return matches;
    };

    // Meses con cobertura para el año seleccionado
    const getMonthStatus = (monthName: string) => {
        return records.some(r => r.month === monthName && r.year === currentYear);
    };

    return (
        <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden w-full font-sans">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1400px] mx-auto space-y-8">
                    
                    {/* HEADER */}
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-8">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-3 bg-emerald-500 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                                    <ShieldCheck className="w-8 h-8 text-slate-950" />
                                </div>
                                <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white">Bitácora de SCTR</h1>
                            </div>
                            <p className="text-slate-400 font-bold italic">Control Maestro de Coberturas Mensuales - ANEXO 14</p>
                        </div>

                        <button 
                            onClick={() => setShowForm(!showForm)}
                            className={`flex items-center gap-3 px-8 py-4 font-black rounded-2xl transition-all transform active:scale-95 shadow-2xl ${showForm ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'}`}
                        >
                            {showForm ? <X size={20} /> : <Plus size={20} />}
                            {showForm ? 'CANCELAR CARGA' : 'NUEVO REGISTRO MENSUAL'}
                        </button>
                    </header>

                    {/* DASHBOARD DE ESTADO MENSUAL */}
                    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Calendar size={16} /> Estado de Cobertura {currentYear}
                                </h2>
                                <div className="flex gap-2">
                                    {[2024, 2025, 2026].map(y => (
                                        <button 
                                            key={y} 
                                            onClick={() => setCurrentYear(y)}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${currentYear === y ? 'bg-emerald-500 text-black' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {MONTHS.map(m => {
                                    const active = getMonthStatus(m);
                                    return (
                                        <div key={m} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${active ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-900/50 border-slate-800 opacity-50'}`}>
                                            <span className="text-[10px] font-black uppercase">{m}</span>
                                            {active ? <CheckCircle2 className="text-emerald-500" size={20} /> : <X className="text-slate-700" size={20} />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* BUSCADOR RÁPIDO */}
                        <div className="lg:col-span-4 space-y-4">
                            <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Search size={16} /> Verificador de Personal
                            </h2>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                    placeholder="Ingrese DNI o Nombre..."
                                     onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {searchTerm.length >= 3 && (() => {
                                // Agrupar hallazgos por la línea exacta (Persona)
                                const allMatches: { [line: string]: string[] } = {};
                                
                                records.forEach(record => {
                                    const matches = getMatchesFromRecord(record, searchTerm);
                                    matches.forEach(line => {
                                        if (!allMatches[line]) allMatches[line] = [];
                                        const label = `${record.month} ${record.year}`;
                                        if (!allMatches[line].includes(label)) {
                                            allMatches[line].push(label);
                                        }
                                    });
                                });

                                const uniqueLines = Object.keys(allMatches);

                                return (
                                    <div className="animate-in fade-in zoom-in-95 duration-200 space-y-3">
                                        {uniqueLines.length > 0 ? (
                                            <>
                                                {uniqueLines.length > 1 && (
                                                    <div className="bg-amber-500/10 border border-amber-500/50 p-4 rounded-2xl flex items-center gap-3 mb-4">
                                                        <AlertCircle size={20} className="text-amber-500" />
                                                        <div>
                                                            <p className="text-xs font-black text-amber-500 uppercase">Múltiples Coincidencias ({uniqueLines.length})</p>
                                                            <p className="text-[10px] text-slate-400 font-bold">Por favor, ingrese el nombre completo o DNI para una conformidad exacta.</p>
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {uniqueLines.map((line, idx) => (
                                                    <div key={idx} className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl space-y-3">
                                                        <div className="flex items-start gap-3">
                                                            <div className="bg-emerald-500 p-2 rounded-full mt-1"><CheckCircle2 size={14} className="text-black" /></div>
                                                            <div className="flex-1">
                                                                <p className="text-[11px] font-mono font-bold text-white break-all leading-relaxed uppercase">
                                                                    {line}
                                                                </p>
                                                                <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-emerald-500/20">
                                                                    {allMatches[line].map((period, pIdx) => (
                                                                        <div key={pIdx} className="bg-emerald-500/20 border border-emerald-500/40 px-2 py-1 rounded text-[9px] font-black text-emerald-400">
                                                                            {period}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-2xl flex items-center gap-3">
                                                <div className="bg-red-500 p-2 rounded-full"><AlertCircle size={16} className="text-white" /></div>
                                                <div>
                                                    <p className="text-xs font-black text-red-400 uppercase">No Encontrado</p>
                                                    <p className="text-[10px] text-slate-400">No aparece en ninguna póliza registrada.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </section>

                    {/* FORMULARIO DE CARGA */}
                    {showForm && (
                        <Card className="bg-slate-900 border-2 border-emerald-500/30 animate-in slide-in-from-top-4 duration-300">
                            <CardContent className="p-8">
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mes de Cobertura</label>
                                            <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" value={form.month} onChange={e => setForm({...form, month: e.target.value})}>
                                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Empresa</label>
                                            <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500" value={form.company} onChange={e => setForm({...form, company: e.target.value})}>
                                                {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Archivo PDF de Póliza</label>
                                            <div className="relative h-12">
                                                <input type="file" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                <div className={`h-full flex items-center justify-center gap-3 border-2 border-dashed rounded-xl transition-all ${form.file_url ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-950'}`}>
                                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> : form.file_url ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Plus className="w-4 h-4 text-slate-500" />}
                                                    <span className="text-[10px] font-black uppercase text-slate-400">{isUploading ? 'Procesando...' : form.file_url ? 'Archivo Listo' : 'Seleccionar PDF'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vencimiento</label>
                                                    <input type="date" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none" value={form.expiration_date} onChange={e => setForm({...form, expiration_date: e.target.value})} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nº Póliza</label>
                                                    <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs outline-none" value={form.policy_number} onChange={e => setForm({...form, policy_number: e.target.value})} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                                                Lista de Personal (Nombres/DNI) 
                                                <span className={form.personnel_list ? "text-emerald-500" : "text-amber-500"}>{form.personnel_list ? "✓ Cargado" : "⚠ Pendiente"}</span>
                                            </label>
                                            <textarea 
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-[10px] font-mono outline-none h-24"
                                                placeholder="Pega aquí los nombres si el robot falla..."
                                                value={form.personnel_list}
                                                onChange={e => setForm({...form, personnel_list: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <button type="submit" disabled={isSubmitting || isUploading} className="w-full py-4 bg-emerald-500 text-slate-950 font-black rounded-2xl hover:bg-emerald-400 transition-all disabled:opacity-50 uppercase tracking-widest text-sm shadow-xl">
                                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'REGISTRAR COBERTURA SCTR'}
                                    </button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* BITÁCORA (TABLA) */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                                <FileText size={18} /> Historial de Bitácora
                            </h2>
                            <span className="text-[10px] font-bold text-slate-600">{records.length} registros totales</span>
                        </div>

                        <div className="bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-950/50 border-b border-slate-800">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Periodo</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Empresa</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Póliza</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500">Vencimiento</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-20 text-center text-slate-600 font-medium italic text-sm">No hay registros cargados aún.</td></tr>
                                    ) : (
                                        records.map(r => (
                                            <tr key={r.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors group">
                                                <td className="px-6 py-4 font-bold text-white italic">{r.month} {r.year}</td>
                                                <td className="px-6 py-4 text-xs font-black uppercase text-slate-400">{r.company}</td>
                                                <td className="px-6 py-4 text-xs font-mono text-emerald-500">{r.policy_number}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black ${new Date(r.expiration_date) < new Date() ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                        {r.expiration_date}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-3">
                                                        <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-lg transition-all" title="Ver PDF">
                                                            <Download size={16} />
                                                        </a>
                                                        <button onClick={() => handleDelete(r.id)} className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all" title="Eliminar">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
