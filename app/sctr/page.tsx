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
    User,
    Building2,
    Clock,
    Upload,
    Users,
    CheckCircle2,
    X
} from 'lucide-react';
import { uploadEvidence } from "@/lib/uploadClient";

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
            // 1. Upload to Drive/Blob for storage
            const url = await uploadEvidence(
                selectedFile,
                'SCTR',
                `SCTR_${form.company}_${form.month}_${form.year}`,
                form.expiration_date || new Date().toISOString().split('T')[0],
                'SISTEMA',
                'sctr',
                'seguridad',
                'GENERAL'
            );
            setForm(prev => ({ ...prev, file_url: url }));

            // 2. Extract text from PDF
            const formData = new FormData();
            formData.append('file', selectedFile);
            
            const parseRes = await fetch('/api/parse-pdf', {
                method: 'POST',
                body: formData
            });
            const parseData = await parseRes.json();

            if (parseData.success) {
                const text = parseData.text || '';
                let extractedDate = '';
                let extractedPolicy = '';

                // Intentar extraer fecha de vencimiento (Patrones comunes: DD/MM/YYYY o DD-MM-YYYY)
                const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
                if (dateMatch) {
                    const [full, day, month, year] = dateMatch;
                    // Asegurar formato YYYY-MM-DD para el input
                    extractedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }

                // Intentar extraer número de póliza (Ej: Póliza N° 123456)
                const policyMatch = text.match(/(?:Pó|po)liza\s*(?:N|n|°|#)*\s*([A-Z0-9\-]+)/i);
                if (policyMatch) {
                    extractedPolicy = policyMatch[1];
                }

                setForm(prev => ({ 
                    ...prev, 
                    personnel_list: text,
                    expiration_date: extractedDate || prev.expiration_date,
                    policy_number: extractedPolicy || prev.policy_number
                }));

                alert(`✅ PDF procesado con éxito.\n${extractedDate ? `📅 Vencimiento detectado: ${extractedDate}` : '⚠️ No se pudo detectar la fecha de vencimiento automáticamente.'}`);
            } else {
                console.warn("No se pudo extraer el texto automáticamente:", parseData.error);
                alert("✅ Archivo subido, pero el robot no pudo leer el contenido. Intente con otro archivo o ingrese los datos manualmente si fuera necesario.");
            }

        } catch (error: any) {
            alert(`Error al procesar: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.file_url) return alert("Debe subir el PDF de la póliza SCTR.");
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/sctr-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', data: form })
            });

            if (res.ok) {
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
        } catch (error) {
            console.error("Error creating record:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar este registro de SCTR mensual?")) return;
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

    const filteredRecords = (records || []).filter(r => {
        if (!r) return false;
        const search = (searchTerm || "").toLowerCase();
        return (
            (r.month || "").toLowerCase().includes(search) ||
            (r.year || "").toString().includes(search) ||
            (r.company || "").toLowerCase().includes(search) ||
            (r.policy_number || "").toLowerCase().includes(search) ||
            (r.personnel_list || "").toLowerCase().includes(search)
        );
    });

    const isExpired = (date: string) => {
        if (!date) return false;
        return new Date(date) < new Date();
    };

    const isNameInRelation = (record: SCTRMonthlyRecord, name: string) => {
        if (!name || name.length < 3 || !record?.personnel_list) return false;
        
        const normalize = (text: string) => 
            (text || "").normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9 ]/g, " ")
                .replace(/\s+/g, " ")
                .trim();
        
        return normalize(record.personnel_list).includes(normalize(name));
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden w-full">
            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1600px] mx-auto space-y-8">
                    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-500 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                                    <ShieldCheck className="w-6 h-6 text-slate-950" />
                                </div>
                                <h1 className="text-3xl font-black tracking-tighter uppercase italic">Control de SCTR Mensual</h1>
                            </div>
                            <p className="text-slate-400 font-medium italic text-sm">Vigilancia de cobertura de salud y pensión del personal (Anexo 14)</p>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShowForm(!showForm)}
                                className={`flex items-center gap-2 px-6 py-3 font-bold rounded-xl transition-all transform active:scale-95 shadow-xl ${showForm ? 'bg-slate-800 text-slate-300' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'}`}
                            >
                                {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                {showForm ? 'Cerrar Panel' : 'Cargar Póliza Mensual'}
                            </button>
                        </div>
                    </header>

                    {showForm && (
                        <Card className="bg-slate-900 border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl pointer-events-none"></div>
                            <CardHeader>
                                <CardTitle className="text-lg text-emerald-400 flex items-center gap-2 font-black uppercase italic">
                                    <FileText className="w-5 h-5" /> Registro de Póliza Colectiva
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mes</label>
                                            <select 
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                                value={form.month}
                                                onChange={e => setForm({...form, month: e.target.value})}
                                            >
                                                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Año</label>
                                            <select 
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                                value={form.year}
                                                onChange={e => setForm({...form, year: parseInt(e.target.value)})}
                                            >
                                                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Empresa</label>
                                            <select 
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                                value={form.company}
                                                onChange={e => setForm({...form, company: e.target.value})}
                                            >
                                                {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="md:col-span-1 space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-emerald-500/80 italic">Extraído Automáticamente</label>
                                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-bold text-slate-400">
                                                {form.expiration_date ? `Vence: ${form.expiration_date}` : 'Pendiente de carga...'}
                                            </div>
                                        </div>
                                        <div className="md:col-span-3 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Cargar Póliza Mensual (PDF)</label>
                                            <div className="relative group h-12">
                                                <input 
                                                    type="file" 
                                                    accept=".pdf" 
                                                    onChange={handleFileUpload} 
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                                />
                                                <div className={`h-full flex items-center justify-center gap-3 border-2 border-dashed rounded-xl transition-all ${form.file_url ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-950 hover:border-emerald-500/30'}`}>
                                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> : form.file_url ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Upload className="w-4 h-4 text-slate-500" />}
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isUploading ? 'Procesando PDF...' : form.file_url ? 'Póliza Lista para Guardar' : 'Subir archivo de póliza'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="md:col-span-4 hidden">
                                            {/* La lista se procesa en segundo plano */}
                                            <textarea value={form.personnel_list} readOnly />
                                        </div>
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={isSubmitting || isUploading}
                                        className="w-full py-4 bg-emerald-500 text-slate-950 font-black rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50 uppercase tracking-widest text-xs"
                                    >
                                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'GUARDAR PÓLIZA MENSUAL SCTR'}
                                    </button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="bg-slate-900/50 border-slate-800 p-6 flex items-center gap-4 backdrop-blur-sm">
                            <div className="p-3 bg-blue-500/10 rounded-xl"><FileText className="text-blue-500" /></div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pólizas Registradas</p>
                                <p className="text-2xl font-black">{records.length}</p>
                            </div>
                        </Card>
                        <Card className="bg-slate-900/50 border-slate-800 p-6 flex items-center gap-4 backdrop-blur-sm">
                            <div className="p-3 bg-emerald-500/10 rounded-xl"><ShieldCheck className="text-emerald-500" /></div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pólizas Vigentes</p>
                                <p className="text-2xl font-black">{records.filter(r => !isExpired(r.expiration_date)).length}</p>
                            </div>
                        </Card>
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 w-6 h-6" />
                            <input 
                                className="w-full h-16 bg-slate-900 border-2 border-slate-800 rounded-3xl pl-16 pr-6 text-lg font-bold focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none backdrop-blur-xl shadow-2xl transition-all placeholder:text-slate-600"
                                placeholder="ESCRIBE DNI O NOMBRE PARA VERIFICAR REGISTRO..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* STATUS CARD FOR SEARCH */}
                    {searchTerm.length > 3 && (
                        <div className="animate-in zoom-in-95 fade-in duration-300">
                            {records.some(r => isNameInRelation(r, searchTerm)) ? (
                                <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                                    <div className="flex items-center gap-6 text-center md:text-left">
                                        <div className="p-5 bg-emerald-500 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                                            <CheckCircle2 className="w-10 h-10 text-slate-950" />
                                        </div>
                                        <div>
                                            <p className="text-emerald-400 font-black text-3xl tracking-tighter uppercase italic">¡REGISTRADO Y VIGENTE!</p>
                                            <p className="text-slate-300 font-bold text-lg">El trabajador se encuentra en la relación de personal cubierto.</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 text-center min-w-[250px]">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Fin de Cobertura</p>
                                        <p className="text-2xl font-black text-white">{records.find(r => isNameInRelation(r, searchTerm))?.expiration_date}</p>
                                        <p className="text-[10px] text-emerald-500 font-bold uppercase mt-2">Mes: {records.find(r => isNameInRelation(r, searchTerm))?.month} {records.find(r => isNameInRelation(r, searchTerm))?.year}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-3xl p-8 flex items-center gap-6">
                                    <div className="p-4 bg-red-500 rounded-full">
                                        <AlertCircle className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-red-400 font-black text-2xl tracking-tighter uppercase italic">NO ENCONTRADO</p>
                                        <p className="text-slate-400 font-medium">El DNI o Nombre ingresado no figura en los registros de pólizas de este mes.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {!isLoaded ? (
                            [1,2,3].map(i => <div key={i} className="h-64 bg-slate-900 animate-pulse rounded-3xl border border-slate-800" />)
                        ) : filteredRecords.length === 0 ? (
                            <div className="col-span-full py-20 text-center text-slate-500 font-medium italic">No se encontraron pólizas registradas.</div>
                        ) : (
                            filteredRecords.map(record => {
                                const foundInRelation = searchTerm && isNameInRelation(record, searchTerm);
                                return (
                                    <Card key={record.id} className={`bg-slate-900 border-slate-800 hover:border-emerald-500/30 transition-all group overflow-hidden ${foundInRelation ? 'ring-2 ring-emerald-500 border-emerald-500' : ''}`}>
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full ${isExpired(record.expiration_date) ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{record.company}</span>
                                                </div>
                                                <button onClick={() => handleDelete(record.id)} className="p-2 text-slate-700 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                                            </div>

                                            <div className="mb-4">
                                                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{record.month} {record.year}</h3>
                                                <p className="text-xs text-emerald-500 font-bold font-mono">Póliza: {record.policy_number}</p>
                                            </div>

                                            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vencimiento</p>
                                                    <Clock size={14} className={isExpired(record.expiration_date) ? 'text-red-500' : 'text-emerald-500'} />
                                                </div>
                                                <p className={`text-sm font-black ${isExpired(record.expiration_date) ? 'text-red-400' : 'text-slate-100'}`}>
                                                    {record.expiration_date}
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                {foundInRelation && (
                                                    <div className="bg-emerald-500/20 border border-emerald-500/30 p-3 rounded-xl flex items-center gap-2 mb-2 animate-pulse">
                                                        <CheckCircle2 className="text-emerald-400" size={16} />
                                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tight">Trabajador verificado en esta póliza</span>
                                                    </div>
                                                )}
                                                
                                                <a 
                                                    href={record.file_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
                                                >
                                                    <Download size={14} /> Descargar Relación PDF
                                                </a>
                                                
                                                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                                                    <p className="text-[9px] font-black text-slate-600 uppercase mb-2 flex items-center gap-1"><Users size={10} /> Personal Cubierto ({record.personnel_list.split('\n').filter(n => n.trim()).length})</p>
                                                    <p className="text-[10px] text-slate-500 font-medium line-clamp-2 italic">
                                                        {record.personnel_list.replace(/\n/g, ', ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
