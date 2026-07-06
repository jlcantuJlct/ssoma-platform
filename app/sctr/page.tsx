"use client";
import { canDeleteRecord } from '@/lib/utils';

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
    Users,
    RotateCcw
} from 'lucide-react';
import { uploadEvidence } from "@/lib/uploadClient";
import SearchableSelect from "@/components/SearchableSelect";
import { SSOMA_LOCATIONS } from "@/lib/locations";

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
const SSOMA_LOCATIONS = ["GENERAL", "LIMA", "PROYECTOS", "PLANTA"];


export default function SCTRPage() {
    const [records, setRecords] = useState<SCTRMonthlyRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [filterSearch, setFilterSearch] = useState('');
    const [filterPolicy, setFilterPolicy] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [filterMonth, setFilterMonth] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
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
            const logData = {
                control: "SCTR",
                periodo: `${form.month} ${form.year}`,
                empresa: form.company,
                detalle: `Póliza: ${form.policy_number || 'N/A'}, Vencimiento: ${form.expiration_date || 'N/A'}`
            };

            const url = await uploadEvidence(
                selectedFile,
                'SCTR',
                `SCTR_${form.company}_${form.month}_${form.year}`,
                form.expiration_date || new Date().toISOString().split('T')[0],
                'SISTEMA',
                'sctr',
                'seguridad',
                'GENERAL',
                undefined, 
                logData 
            );
            setForm(prev => ({ ...prev, file_url: url }));

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

                        const text = fullText.split('\n')
                            .map(line => line.replace(/[^\S\r\n]+/g, ' ').trim())
                            .filter(line => line.length > 0)
                            .join('\n');
                        
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
                    } catch (innerErr) {
                        console.error("[Robot Browser] Error interno:", innerErr);
                    }
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
        const record = records.find(r => r.id === id);
        if (!canDeleteRecord(id, user?.role || 'user', record?.date)) {
            alert('⏱️ No se puede eliminar este registro.\nLos usuarios solo pueden eliminar documentos dentro de las primeras 24 horas de su ingreso.\nContacte al administrador si necesita realizar esta acción.');
            return;
        }
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
        
        if (targetWords.length === 0) return [];

        // ── SMART SPLIT ──────────────────────────────────────────────────────
        // El PDF de SCTR puede tener dos formatos distintos según el mes:
        //
        // FORMATO A (ej. Mayo):  "59 DNI 22196407 CANCINO TUEROS JOSE LUIS 60 DNI..."
        //   → número correlativo ANTES del DNI
        //
        // FORMATO B (ej. Junio): "BERROCAL RAMOS 42567685 DNI 42 BLANCO ROSAS..."
        //   → número correlativo DESPUÉS del DNI, seguido del siguiente nombre
        //
        let rawLines = record.personnel_list.split('\n');

        const avgLen = record.personnel_list.length / Math.max(rawLines.length, 1);

        if (avgLen > 200) {
            // ── Intento A: número + DNI al inicio de cada persona ──
            const attemptA = record.personnel_list
                .replace(/\s+(\d{1,3})\s+(DNI|N°|Nro\.?|CIP|RUC|\d{7,9})/gi, '\n$1 $2')
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.length > 2);

            // ── Intento B: DNI + número correlativo + nombre siguiente ──
            // Ej: "42567685 DNI 42 BLANCO" → split después de "DNI 42"
            const attemptB = record.personnel_list
                .replace(/(DNI\s+\d{1,3})\s+(?=[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúña-z])/g, '$1\n')
                .split('\n')
                .map(l => l.trim())
                .filter(l => l.length > 2);

            // Elegir el intento que logró más divisiones
            const best = attemptA.length >= attemptB.length ? attemptA : attemptB;

            if (best.length > rawLines.length) {
                rawLines = best;
            }
        }
        // ─────────────────────────────────────────────────────────────────────

        const matches: string[] = [];

        for (const line of rawLines) {
            const normalizedLine = normalize(line);
            if (!normalizedLine.trim()) continue;

            if (/^\d+$/.test(target)) {
                // Búsqueda por DNI exacto
                const dniRegex = new RegExp(`(?<!\\d)${target}(?!\\d)`);
                if (dniRegex.test(normalizedLine)) {
                    matches.push(line.trim());
                }
            } else {
                // Búsqueda por nombre: todas las palabras deben estar presentes
                if (targetWords.every(word => normalizedLine.includes(word))) {
                    matches.push(line.trim());
                }
            }
        }
        return matches;
    };

    const getMonthStatus = (monthName: string) => {
        return records.some(r => r.month === monthName && r.year === currentYear);
    };

    return (
        <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden w-full font-sans">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1400px] mx-auto space-y-8">
                    
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
                                <div className="p-4 rounded-2xl border-2 bg-blue-500/10 border-blue-500/50 flex flex-col items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                                    <span className="text-[10px] font-black uppercase text-blue-400">TOTAL {currentYear}</span>
                                    <span className="text-2xl font-black text-white">{records.filter(r => r.year === currentYear).length}</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 space-y-4">
                            <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Search size={16} /> Verificador de Personal
                            </h2>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                <input 
                                    className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                    placeholder="Ingrese DNI o Nombre..."
                                     onChange={e => setFilterSearch(e.target.value)}
                                />
                            </div>

                            {filterSearch.length >= 3 && (() => {
                                const allMatches: { [key: string]: { entries: { period: string, line: string, year: number, monthIdx: number }[] } } = {};
                                records.forEach(record => {
                                    const matches = getMatchesFromRecord(record, filterSearch);
                                    matches.forEach(line => {
                                        // Extract DNI to use as a unique key for grouping
                                        const dniMatch = line.match(/\b\d{8,9}\b/);
                                        // If no DNI, fallback to normalized name (letters only)
                                        const key = dniMatch ? dniMatch[0] : line.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z]/g, '').toLowerCase();
                                        
                                        if (!allMatches[key]) {
                                            allMatches[key] = { entries: [] };
                                        }
                                        
                                        const label = `${record.month} ${record.year}`;
                                        // Only add if this period isn't already there for this key
                                        if (!allMatches[key].entries.some(e => e.period === label)) {
                                            allMatches[key].entries.push({
                                                period: label,
                                                line: line,
                                                year: record.year,
                                                monthIdx: MONTHS.indexOf(record.month)
                                            });
                                        }
                                    });
                                });
                                const uniqueKeys = Object.keys(allMatches);
                                
                                // Pre-sort entries for each key so the most recent is at index 0
                                uniqueKeys.forEach(key => {
                                    allMatches[key].entries.sort((a, b) => {
                                        if (a.year !== b.year) return b.year - a.year;
                                        return b.monthIdx - a.monthIdx;
                                    });
                                });

                                // Sort keys by relevance to the search term
                                uniqueKeys.sort((a, b) => {
                                    const scoreMatch = (line: string, search: string) => {
                                        const normalizedLine = line.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                                        const normalizedSearch = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                                        const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 0);
                                        let score = 0;
                                        for (const word of searchWords) {
                                            const exactRegex = new RegExp(`\\b${word}\\b`);
                                            if (exactRegex.test(normalizedLine)) score += 100;
                                            else {
                                                const startRegex = new RegExp(`\\b${word}`);
                                                if (startRegex.test(normalizedLine)) score += 50;
                                                else score += 10;
                                            }
                                        }
                                        return score;
                                    };
                                    
                                    const scoreA = scoreMatch(allMatches[a].entries[0].line, filterSearch);
                                    const scoreB = scoreMatch(allMatches[b].entries[0].line, filterSearch);
                                    
                                    if (scoreA !== scoreB) return scoreB - scoreA;
                                    return allMatches[a].entries[0].line.localeCompare(allMatches[b].entries[0].line);
                                });

                                return (
                                    <div className="animate-in fade-in zoom-in-95 duration-200 space-y-3">
                                        {uniqueKeys.length > 0 ? (
                                            <>
                                                {uniqueKeys.length > 1 && (
                                                    <div className="bg-amber-500/10 border border-amber-500/50 p-4 rounded-2xl flex items-center gap-3 mb-4">
                                                        <AlertCircle size={20} className="text-amber-500" />
                                                        <div>
                                                            <p className="text-xs font-black text-amber-500 uppercase">Múltiples Coincidencias ({uniqueKeys.length})</p>
                                                            <p className="text-[10px] text-slate-400 font-bold">Por favor, ingrese el nombre completo o DNI para una conformidad exacta.</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {uniqueKeys.map((key, idx) => {
                                                    const matchData = allMatches[key];
                                                    const currentEntry = matchData.entries[0];
                                                    
                                                    return (
                                                    <div key={idx} className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl space-y-3">
                                                        <div className="flex items-start gap-3">
                                                            <div className="bg-emerald-500 p-2 rounded-full mt-1"><CheckCircle2 size={14} className="text-black" /></div>
                                                            <div className="flex-1">
                                                                <p className="text-[11px] font-mono font-bold text-white break-all leading-relaxed uppercase">{currentEntry.line}</p>
                                                                <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-emerald-500/20">
                                                                    {matchData.entries.map((entry, pIdx) => (
                                                                        <div key={pIdx} className="flex flex-col md:flex-row md:items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800/50">
                                                                            <div className="bg-emerald-500/20 border border-emerald-500/40 px-2 py-1 rounded text-[9px] font-black text-emerald-400 w-fit shrink-0">
                                                                                {entry.period}
                                                                            </div>
                                                                            <span className="text-[10px] font-mono text-slate-400 break-all">{entry.line}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )})}
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

                    <section className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                                <FileText size={18} /> Historial de Bitácora
                            </h2>
                            <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                                {records.filter(r => {
                                    const matchesLoc = !filterLocation || r.location === filterLocation;
                                    const matchesPolicy = !filterPolicy || r.policy_number.includes(filterPolicy);
                                    const matchesMonth = !filterMonth || r.month === filterMonth;
                                    return matchesLoc && matchesPolicy && matchesMonth;
                                }).length} REGISTROS
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-slate-800/30 p-4 rounded-2xl border border-slate-800/50 items-end">
                            <div className="space-y-1">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Mes</label>
                                    {filterMonth && (
                                        <button onClick={() => setFilterMonth('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                                <select 
                                    value={filterMonth}
                                    onChange={e => setFilterMonth(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-emerald-500 outline-none"
                                >
                                    <option value="">Todos los meses...</option>
                                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase">Nº Póliza</label>
                                    {filterPolicy && (
                                        <button onClick={() => setFilterPolicy('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                                <input 
                                    type="text"
                                    placeholder="Buscar póliza..."
                                    value={filterPolicy}
                                    onChange={e => setFilterPolicy(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-emerald-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Lugar</label>
                                    {filterLocation && (
                                        <button onClick={() => setFilterLocation('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                                <SearchableSelect 
                                    options={SSOMA_LOCATIONS.map(l => ({ id: l, label: l }))}
                                    value={filterLocation}
                                    onChange={(val: string) => setFilterLocation(val)}
                                    placeholder="Todos los lugares..."
                                    className="[&>div]:bg-slate-950 [&>div]:border-slate-700 [&>div]:py-1.5 [&>div]:px-3 [&>div]:text-[10px]"
                                />
                            </div>
                            <div className="flex flex-col justify-end h-full">
                                <button 
                                    onClick={() => { setFilterLocation(''); setFilterPolicy(''); setFilterMonth(''); }}
                                    className={`w-full h-[33px] rounded-lg text-[10px] font-bold uppercase transition-all border flex items-center justify-center gap-2 active:scale-95 ${
                                        (filterLocation || filterPolicy || filterMonth)
                                        ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 shadow-lg shadow-red-950/20'
                                        : 'bg-slate-800/50 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                                    }`}
                                    disabled={!(filterLocation || filterPolicy || filterMonth)}
                                >
                                    <RotateCcw size={14} strokeWidth={3} /> Limpiar Filtros
                                </button>
                            </div>
                        </div>

                        {/* RESUMEN MENSUAL */}
                        <div className="flex flex-wrap gap-2 mb-6 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                            {['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'].map((m, i) => {
                                const count = records.filter(r => {
                                    const mPart = i + 1; // 1-indexed
                                    // SCTR records have 'month' as name like 'Enero', 'Febrero'... or index?
                                    // Let's check getMonthIndex or similar logic
                                    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                                    return r.month === monthNames[i];
                                }).length;
                                return (
                                    <div key={m} className={`flex-1 flex flex-col items-center justify-center min-w-[45px] py-2 rounded-xl border transition-all ${count > 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-950/50 border-slate-800/50 text-slate-600 opacity-40'}`}>
                                        <span className="text-[7px] font-black uppercase tracking-tighter mb-0.5">{m}</span>
                                        <span className="text-[10px] font-black">{count}</span>
                                    </div>
                                );
                            })}
                            <div className="flex flex-col items-center justify-center min-w-[70px] py-2 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 ml-auto">
                                <span className="text-[7px] font-black uppercase tracking-tighter">TOTAL</span>
                                <span className="text-[10px] font-black">{records.length}</span>
                            </div>
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
