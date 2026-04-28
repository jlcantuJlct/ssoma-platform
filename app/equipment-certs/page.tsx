"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
    Truck, 
    Plus, 
    Search, 
    Calendar, 
    FileText, 
    Trash2, 
    Loader2, 
    AlertCircle,
    Settings,
    Tool,
    ShieldCheck,
    Clock
} from 'lucide-react';

interface EquipmentCert {
    id: number;
    equipment_name: string;
    plate_id: string;
    cert_type: string;
    issuing_company: string;
    issue_date: string;
    expiry_date: string;
    file_url: string;
}

export default function EquipmentCertsPage() {
    const [records, setRecords] = useState<EquipmentCert[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [form, setForm] = useState({
        equipment_name: '',
        plate_id: '',
        cert_type: 'Operatividad',
        issuing_company: '',
        issue_date: '',
        expiry_date: '',
        file_url: ''
    });

    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = async () => {
        try {
            const res = await fetch('/api/equipment-certs');
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
            const res = await fetch('/api/equipment-certs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', data: form })
            });

            if (res.ok) {
                setForm({ equipment_name: '', plate_id: '', cert_type: 'Operatividad', issuing_company: '', issue_date: '', expiry_date: '', file_url: '' });
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
        if (!confirm("¿Eliminar este certificado de equipo?")) return;
        try {
            await fetch('/api/equipment-certs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', data: { id } })
            });
            loadRecords();
        } catch (error) {
            console.error("Error deleting record:", error);
        }
    };

    const isExpired = (date: string) => new Date(date) < new Date();

    const filteredRecords = records.filter(r => 
        r.equipment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.plate_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 bg-slate-950 min-h-screen flex-1 text-slate-100">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.4)]">
                                <Truck className="w-6 h-6 text-slate-950" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tighter">Certificados de Operatividad</h1>
                        </div>
                        <p className="text-slate-400 font-medium italic">Control de certificados de equipos pesados, livianos y herramientas (Anexo 2)</p>
                    </div>

                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all transform active:scale-95 shadow-[0_4px_20px_rgba(59,130,246,0.3)]"
                    >
                        {showForm ? <Trash2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        {showForm ? 'Cancelar' : 'Nuevo Certificado'}
                    </button>
                </header>

                {showForm && (
                    <Card className="bg-slate-900 border-slate-800 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        <CardHeader>
                            <CardTitle className="text-xl text-blue-400 flex items-center gap-2">
                                <Settings className="w-5 h-5" /> Registro de Certificación Técnico-Operativa
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Equipo / Herramienta</label>
                                    <input 
                                        required
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Ej: Camioneta Hilux, Grúa..."
                                        value={form.equipment_name}
                                        onChange={e => setForm({...form, equipment_name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Placa / Código Interno</label>
                                    <input 
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="EGP-123 / COD-001"
                                        value={form.plate_id}
                                        onChange={e => setForm({...form, plate_id: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tipo de Certificado</label>
                                    <select 
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={form.cert_type}
                                        onChange={e => setForm({...form, cert_type: e.target.value})}
                                    >
                                        <option value="Operatividad">Operatividad</option>
                                        <option value="RITE">Inspección Técnica</option>
                                        <option value="Mantenimiento">Mantenimiento</option>
                                        <option value="Emisiones">Control de Emisiones</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Empresa Certificadora</label>
                                    <input 
                                        required
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={form.issuing_company}
                                        onChange={e => setForm({...form, issuing_company: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Fecha de Emisión</label>
                                    <input 
                                        required
                                        type="date"
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={form.issue_date}
                                        onChange={e => setForm({...form, issue_date: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Fecha de Vencimiento</label>
                                    <input 
                                        required
                                        type="date"
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={form.expiry_date}
                                        onChange={e => setForm({...form, expiry_date: e.target.value})}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase">URL de Evidencia (Drive)</label>
                                    <input 
                                        className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="https://drive.google.com/..."
                                        value={form.file_url}
                                        onChange={e => setForm({...form, file_url: e.target.value})}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <button 
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-500 transition-all disabled:bg-slate-700"
                                    >
                                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'REGISTRAR CERTIFICADO'}
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                <div className="flex flex-col md:flex-row gap-6 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                        <input 
                            className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 pl-12 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Buscar por equipo, placa o código..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {!isLoaded ? (
                        [1,2,3].map(i => <div key={i} className="h-56 bg-slate-900 animate-pulse rounded-2xl border border-slate-800" />)
                    ) : filteredRecords.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-slate-500 font-medium italic">No hay certificados registrados.</div>
                    ) : (
                        filteredRecords.map(record => (
                            <Card key={record.id} className="bg-slate-900 border-slate-800 hover:border-blue-500/30 transition-all group overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                                            <ShieldCheck size={12} className="text-blue-500" />
                                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{record.cert_type}</span>
                                        </div>
                                        <button onClick={() => handleDelete(record.id)} className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                                    </div>

                                    <h3 className="text-xl font-bold mb-1">{record.equipment_name}</h3>
                                    <p className="text-xs text-slate-500 mb-4 font-mono font-bold tracking-widest">{record.plate_id || 'SIN PLACA'}</p>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500 uppercase font-bold">Certificadora:</span>
                                            <span className="text-slate-300 font-bold">{record.issuing_company}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500 uppercase font-bold">Emisión:</span>
                                            <span className="text-slate-300 font-bold">{record.issue_date}</span>
                                        </div>
                                        <div className="flex justify-between text-xs pt-2 border-t border-slate-800">
                                            <span className="text-slate-500 uppercase font-bold">Vencimiento:</span>
                                            <span className={`font-black ${isExpired(record.expiry_date) ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {record.expiry_date}
                                            </span>
                                        </div>
                                    </div>

                                    {record.file_url ? (
                                        <a 
                                            href={record.file_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 text-xs font-bold rounded-xl transition-colors border border-blue-600/20"
                                        >
                                            <Download size={14} /> Descargar Certificado
                                        </a>
                                    ) : (
                                        <div className="w-full py-3 bg-slate-800/30 text-slate-600 text-xs font-bold rounded-xl text-center border border-dashed border-slate-700">Evidencia no disponible</div>
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
