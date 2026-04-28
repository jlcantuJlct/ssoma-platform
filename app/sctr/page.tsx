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
    Clock
} from 'lucide-react';

interface SCTRRecord {
    id: number;
    employee_name: string;
    company: string;
    policy_number: string;
    start_date: string;
    end_date: string;
    file_url: string;
}

export default function SCTRPage() {
    const [records, setRecords] = useState<SCTRRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Form state
    const [form, setForm] = useState({
        employee_name: '',
        company: 'CASA',
        policy_number: '',
        start_date: '',
        end_date: '',
        file_url: ''
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/sctr-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', data: form })
            });

            if (res.ok) {
                setForm({ employee_name: '', company: 'CASA', policy_number: '', start_date: '', end_date: '', file_url: '' });
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
        if (!confirm("¿Eliminar este registro de SCTR?")) return;
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

    const filteredRecords = records.filter(r => 
        r.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.policy_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isExpired = (date: string) => new Date(date) < new Date();

    return (
        <div className="p-8 bg-slate-950 min-h-screen flex-1 text-slate-100">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-500 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                                <ShieldCheck className="w-6 h-6 text-slate-950" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tighter">Control de SCTR</h1>
                        </div>
                        <p className="text-slate-400 font-medium italic">Vigilancia de cobertura de salud y pensión del personal (Anexo 14)</p>
                    </div>

                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all transform active:scale-95 shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
                    >
                        {showForm ? <Trash2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        {showForm ? 'Cancelar' : 'Nuevo Registro SCTR'}
                    </button>
                </header>

                {showForm && (
                    <Card className="bg-slate-900 border-slate-800 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        <CardHeader>
                            <CardTitle className="text-xl text-emerald-400 flex items-center gap-2">
                                <User className="w-5 h-5" /> Datos del Personal y Póliza
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nombre Completo</label>
                                    <input 
                                        required
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="Ej: Juan Perez..."
                                        value={form.employee_name}
                                        onChange={e => setForm({...form, employee_name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Empresa / Contratista</label>
                                    <input 
                                        required
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={form.company}
                                        onChange={e => setForm({...form, company: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Nº de Póliza</label>
                                    <input 
                                        required
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="000-XXXXX"
                                        value={form.policy_number}
                                        onChange={e => setForm({...form, policy_number: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Inicio de Vigencia</label>
                                    <input 
                                        required
                                        type="date"
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={form.start_date}
                                        onChange={e => setForm({...form, start_date: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Fin de Vigencia</label>
                                    <input 
                                        required
                                        type="date"
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                        value={form.end_date}
                                        onChange={e => setForm({...form, end_date: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">URL de Evidencia (Drive)</label>
                                    <input 
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="https://drive.google.com/..."
                                        value={form.file_url}
                                        onChange={e => setForm({...form, file_url: e.target.value})}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <button 
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-emerald-500 text-slate-950 font-black rounded-xl hover:bg-emerald-400 transition-all disabled:bg-slate-700"
                                    >
                                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'GUARDAR REGISTRO SCTR'}
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card className="bg-slate-900 border-slate-800 p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl"><User className="text-blue-500" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Total Personal</p>
                            <p className="text-2xl font-black">{records.length}</p>
                        </div>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800 p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl"><ShieldCheck className="text-emerald-500" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Vigentes</p>
                            <p className="text-2xl font-black">{records.filter(r => !isExpired(r.end_date)).length}</p>
                        </div>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800 p-6 flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-xl"><AlertCircle className="text-red-500" /></div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase">Vencidos</p>
                            <p className="text-2xl font-black text-red-400">{records.filter(r => isExpired(r.end_date)).length}</p>
                        </div>
                    </Card>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                        <input 
                            className="w-full h-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Buscar personal o póliza..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {!isLoaded ? (
                        [1,2,3].map(i => <div key={i} className="h-48 bg-slate-900 animate-pulse rounded-2xl border border-slate-800" />)
                    ) : filteredRecords.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-slate-500 font-medium italic">No se encontraron registros.</div>
                    ) : (
                        filteredRecords.map(record => (
                            <Card key={record.id} className="bg-slate-900 border-slate-800 hover:border-emerald-500/30 transition-all group overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${isExpired(record.end_date) ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{record.company}</span>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleDelete(record.id)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 size={16} /></button>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold mb-1 truncate">{record.employee_name}</h3>
                                    <p className="text-xs text-slate-400 mb-4 font-mono">Póliza: {record.policy_number}</p>

                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                                            <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Inicio</p>
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                                                <Calendar size={12} className="text-slate-500" /> {record.start_date}
                                            </div>
                                        </div>
                                        <div className={`bg-slate-950 p-3 rounded-xl border ${isExpired(record.end_date) ? 'border-red-500/30' : 'border-slate-800'}`}>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Vencimiento</p>
                                            <div className={`flex items-center gap-2 text-xs font-bold ${isExpired(record.end_date) ? 'text-red-400' : 'text-slate-300'}`}>
                                                <Clock size={12} className={isExpired(record.end_date) ? 'text-red-500' : 'text-slate-500'} /> {record.end_date}
                                            </div>
                                        </div>
                                    </div>

                                    {record.file_url ? (
                                        <a 
                                            href={record.file_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
                                        >
                                            <FileText size={14} /> Ver Constancia SCTR
                                        </a>
                                    ) : (
                                        <div className="w-full py-3 bg-slate-800/30 text-slate-600 text-xs font-bold rounded-xl text-center border border-dashed border-slate-700">Sin archivo adjunto</div>
                                    )}
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
