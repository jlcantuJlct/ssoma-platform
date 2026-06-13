"use client";
 
import { useState, useEffect } from "react";
import {
    AlertTriangle,
    Upload,
    Trash2,
    Calendar,
    MapPin,
    FileText,
    Eye,
    X,
    Save,
    CheckCircle2,
    Search,
    Download,
    Plus,
    Activity,
    BarChart3,
    TrendingUp,
    Filter,
    Users,
    DownloadCloud,
    Edit2,
    FileX,
    QrCode,
    Car,
    HardHat,
    ArrowUp,
    Zap,
    Lock,
    Smartphone,
    Wrench,
    Package,
    ShieldAlert,
    ShieldOff,
    Siren,
    Flame,
    FileWarning,
    SearchX,
    Layers,
    Cone,
    BadgeMinus,
    Wine,
    Ban,
    ShieldX,
    Building,
    LightbulbOff,
    Route,
    Droplets,
    Trash2,
    VolumeX,
    Radiation,
    CloudLightning,
    Wind,
    PlugZap,
    FlaskConical,
    User
} from "lucide-react";

const getCategoryIcon = (text: string, isChecked: boolean, size: number = 24) => {
    const t = text.toLowerCase();
    const color = isChecked ? 'text-[#f97316]' : 'text-slate-500';
    if (t.includes('conducir') && t.includes('autorización')) return <BadgeMinus size={size} className={color} />;
    if (t.includes('vehícul') || t.includes('móviles') || t.includes('conducir')) return <Car size={size} className={color} />;
    if (t.includes('guardas') || t.includes('barandas')) return <ShieldOff size={size} className={color} />;
    if (t.includes('lesiones') || t.includes('accidentes')) return <Siren size={size} className={color} />;
    if (t.includes('fuego') || t.includes('incendio') || t.includes('caliente')) return <Flame size={size} className={color} />;
    if (t.includes('bloqueo') || t.includes('energía')) return <Zap size={size} className={color} />;
    if (t.includes('celular') || t.includes('teléfono')) return <Smartphone size={size} className={color} />;
    if (t.includes('epp')) return <HardHat size={size} className={color} />;
    if (t.includes('normas') || t.includes('ssoma') || t.includes('petar')) return <FileWarning size={size} className={color} />;
    if (t.includes('altura') || t.includes('caída') || t.includes('escaleras') || t.includes('apoyo')) return <ArrowUp size={size} className={color} />;
    if (t.includes('evaluar') || t.includes('riesgos')) return <SearchX size={size} className={color} />;
    if (t.includes('simultánea') || t.includes('múltiples')) return <Layers size={size} className={color} />;
    if (t.includes('delimitar') || t.includes('señalización')) return <Cone size={size} className={color} />;
    if (t.includes('alcohol') || t.includes('drogas')) return <Wine size={size} className={color} />;
    if (t.includes('restringidas')) return <Ban size={size} className={color} />;
    if (t.includes('cargas') || t.includes('izaje') || t.includes('levantar')) return <Package size={size} className={color} />;
    if (t.includes('proteccion inadecuadas') || t.includes('inexistente para hacer')) return <ShieldX size={size} className={color} />;
    if (t.includes('paredes') || t.includes('taludes')) return <Building size={size} className={color} />;
    if (t.includes('herramienta') || t.includes('equipo') || t.includes('defectuosos')) return <Wrench size={size} className={color} />;
    if (t.includes('iluminación')) return <LightbulbOff size={size} className={color} />;
    if (t.includes('caminos') || t.includes('pisos') || t.includes('superficies')) return <Route size={size} className={color} />;
    if (t.includes('congestión')) return <Activity size={size} className={color} />;
    if (t.includes('derrame')) return <Droplets size={size} className={color} />;
    if (t.includes('orden') || t.includes('limpieza') || t.includes('rrss')) return <Trash2 size={size} className={color} />;
    if (t.includes('ruido')) return <VolumeX size={size} className={color} />;
    if (t.includes('radiación')) return <Radiation size={size} className={color} />;
    if (t.includes('climas')) return <CloudLightning size={size} className={color} />;
    if (t.includes('ventilación')) return <Wind size={size} className={color} />;
    if (t.includes('cables') || t.includes('energizados')) return <PlugZap size={size} className={color} />;
    if (t.includes('quimicos')) return <FlaskConical size={size} className={color} />;
    if (t.includes('ergonómicos')) return <User size={size} className={color} />;
    return <AlertTriangle size={size} className={color} />;
};
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip as RechartsTooltip, 
    ResponsiveContainer,
    Legend
} from 'recharts';
import { generateFilename, getDriveViewerUrl, canDeleteRecord} from '@/lib/utils';
import { exportTableToPDF, exportRecordToPDF } from "@/lib/pdfExport";
import jsPDF from 'jspdf';
import { uploadEvidence } from "@/lib/uploadClient";
import { SSOMA_LOCATIONS } from "@/lib/locations";
import { useAuth } from "@/lib/auth";
import { ACTOS_LIST, CONDICIONES_LIST, RESPONSIBLES } from "@/lib/categories";
import SearchableSelect from "@/components/SearchableSelect";

// --- TYPES ---
type ReporteACRecord = {
    id: number;
    date: string;
    responsible: string;
    acto: string;
    condicion: string;
    cantidad: number;
    location: string;
    pdfUrl: string;
    accion_inmediata?: string;
    descripcion?: string;
};

export default function ReporteACPage() {
    const { user } = useAuth();

    // --- STATE ---
    const [records, setRecords] = useState<ReporteACRecord[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    
    // Form State
    const [form, setForm] = useState<{
        date: string;
        responsible: string;
        location: string;
        descripcion: string;
        accion_inmediata: string;
        type: 'acto' | 'condicion';
        actos_checked: string[];
        condiciones_checked: string[];
    }>({
        date: new Date().toISOString().split('T')[0],
        responsible: user?.name || '',
        location: '',
        descripcion: '',
        accion_inmediata: '',
        type: 'acto',
        actos_checked: [],
        condiciones_checked: []
    });
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [isSyncing, setIsSyncing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string, type: 'pdf' | 'image' } | null>(null);
    const [showQR, setShowQR] = useState(false);

    // Edit State
    const [editingRecord, setEditingRecord] = useState<ReporteACRecord | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Filters
    const [filterDate, setFilterDate] = useState("");
    const [filterLocation, setFilterLocation] = useState("");
    const [filterActo, setFilterActo] = useState("");
    const [filterMonth, setFilterMonth] = useState("");

    // Dynamic Activities from Program (OBJ 04)
    const [programActivities, setProgramActivities] = useState<any[]>([]);

    // --- EFFECT: LOAD DYNAMIC ACTIVITIES (OBJ 04) ---
    useEffect(() => {
        const loadProgram = async () => {
            try {
                const res = await fetch('/api/annual-program');
                const data = await res.json();
                if (data.success && data.programData['obj4']) {
                    setProgramActivities(data.programData['obj4']);
                }
            } catch (e) {
                console.error("Error fetching annual program:", e);
            }
        };
        loadProgram();
    }, []);

    // --- EFFECT: LOAD/SAVE ---
    useEffect(() => {
        const init = async () => {
            const stored = localStorage.getItem('reporte_ac_records');
            if (stored) {
                try { setRecords(JSON.parse(stored)); } catch (e) { }
            }

            try {
                const res = await fetch('/api/reporte-ac-records');
                const data = await res.json();
                if (data.success && data.records.length > 0) {
                    const mapped = data.records.map((r: any) => ({
                        id: Number(r.record_id) || r.id,
                        date: r.date,
                        responsible: r.responsible,
                        acto: r.acto,
                        condicion: r.condicion,
                        cantidad: Number(r.cantidad),
                        location: r.location,
                        pdfUrl: r.pdf_url,
                        accion_inmediata: r.accion_inmediata,
                        descripcion: r.descripcion
                    }));
                    setRecords(mapped);
                    localStorage.setItem('reporte_ac_records', JSON.stringify(mapped));
                }
            } catch (e) { }
            setIsLoaded(true);
        };
        init();
    }, []);

    const handleSync = async (currentRecords: ReporteACRecord[]) => {
        setIsSyncing(true);
        try {
            await fetch('/api/reporte-ac-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: currentRecords, userName: user?.name })
            });
        } catch (e) {
            console.error("Sync error:", e);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSave = async () => {
        if (form.actos_checked.length === 0 && form.condiciones_checked.length === 0) {
            alert("Debe seleccionar al menos una clasificación de Acto o Condición.");
            return;
        }

        if (!form.responsible || !form.location) {
            alert("Debe completar Responsable y Lugar.");
            return;
        }

        const totalCantidad = form.actos_checked.length + form.condiciones_checked.length;

        const confirmMsg = `⚠️ Estás a punto de registrar un total de ${totalCantidad} reporte(s).\n\n¿La cantidad de tarjetas TOP escaneadas en el archivo coincide exactamente con estos ${totalCantidad} registros?`;
        
        if (!window.confirm(confirmMsg)) {
            return;
        }

        setIsUploading(true);
        try {
            let uploadedUrl = "";
            if (pdfFile) {
                uploadedUrl = await uploadEvidence(
                    pdfFile,
                    'ActosInseguros' as any,
                    'Reporte_TOP',
                    form.date,
                    form.responsible,
                    'EVID',
                    'SEGURIDAD',
                    form.location
                );
            }

            const newRecords: ReporteACRecord[] = [];
            const baseId = Date.now();

            form.actos_checked.forEach((actoStr, i) => {
                newRecords.push({
                    id: baseId + i,
                    date: form.date,
                    responsible: form.responsible,
                    location: form.location,
                    acto: actoStr,
                    condicion: '',
                    cantidad: 1,
                    pdfUrl: uploadedUrl,
                    accion_inmediata: form.accion_inmediata,
                    descripcion: form.descripcion
                });
            });

            form.condiciones_checked.forEach((condStr, i) => {
                newRecords.push({
                    id: baseId + 1000 + i,
                    date: form.date,
                    responsible: form.responsible,
                    location: form.location,
                    acto: '',
                    condicion: condStr,
                    cantidad: 1,
                    pdfUrl: uploadedUrl,
                    accion_inmediata: form.accion_inmediata,
                    descripcion: form.descripcion
                });
            });

            const updated = [...newRecords, ...records];
            setRecords(updated);
            localStorage.setItem('reporte_ac_records', JSON.stringify(updated));
            handleSync(updated);

            // Reset
            setForm({ ...form, actos_checked: [], condiciones_checked: [], accion_inmediata: '', descripcion: '' });
            setPdfFile(null);
            alert(`✅ ${newRecords.length} reporte(s) de A/C registrado(s) con éxito.`);
        } catch (error) {
            console.error("Save error:", error);
            alert("❌ Error al guardar el reporte.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = (id: number) => {
        const record = records.find(r => r.id === id);
        if (!canDeleteRecord(id, user?.role || 'user', record?.date)) {
            alert('⏱️ No se puede eliminar este registro.\nLos usuarios solo pueden eliminar documentos dentro de las primeras 24 horas de su ingreso.\nContacte al administrador si necesita realizar esta acción.');
            return;
        }
        if (!confirm("¿Eliminar este registro?")) return;
        const updated = records.filter(r => r.id !== id);
        setRecords(updated);
        localStorage.setItem('reporte_ac_records', JSON.stringify(updated));
        handleSync(updated);
    };

    const handleUpdate = async () => {
        if (!editingRecord) return;
        setIsUpdating(true);
        try {
            const res = await fetch('/api/reporte-ac-records', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...editingRecord, userName: user?.name })
            });
            const data = await res.json();
            if (data.success) {
                const updated = records.map(r => r.id === editingRecord.id ? editingRecord : r);
                setRecords(updated);
                localStorage.setItem('reporte_ac_records', JSON.stringify(updated));
                setEditingRecord(null);
                alert('✅ Registro actualizado con éxito');
            } else {
                alert('❌ Error: ' + data.error);
            }
        } catch (e) {
            alert('❌ Error al actualizar');
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredRecords = (records || []).filter(r => {
        const matchesDate = !filterDate || (r.date && r.date.includes(filterDate));
        const matchesLocation = !filterLocation || (r.location && r.location === filterLocation);
        const matchesActo = !filterActo || (r.acto && r.acto === filterActo);
        const matchesMonth = !filterMonth || (r.date && new Date(r.date).toLocaleString('es-ES', { month: 'short' }).toLowerCase().replace('.', '') === filterMonth.toLowerCase());
        
        return matchesDate && matchesLocation && matchesActo && matchesMonth;
    });

    const MONTHS_LIST = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const getMonthCount = (m: string) => {
        return records.filter(r => {
            if (!r.date) return false;
            const monthStr = new Date(r.date).toLocaleString('es-ES', { month: 'short' }).toLowerCase().replace('.', '');
            return monthStr === m.toLowerCase();
        }).length;
    };

    // --- CHART DATA LOGIC ---
    const getMonthlyData = () => {
        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const data = months.map(m => ({ month: m, actos: 0, condiciones: 0, topActo: '', topCondicion: '' }));
        
        const detailCounts: Record<string, { actos: Record<string, number>, condiciones: Record<string, number> }> = {};
        months.forEach(m => detailCounts[m] = { actos: {}, condiciones: {} });

        records.forEach(r => {
            if (!r.date) return;
            const m = new Date(r.date).toLocaleString('es-ES', { month: 'short' }).toLowerCase().replace('.', '');
            const monthIndex = months.findIndex(x => x.toLowerCase() === m);
            if (monthIndex === -1) return;
            
            const targetMonth = months[monthIndex];
            const monthData = data[monthIndex];

            if (r.acto) {
                monthData.actos += r.cantidad;
                detailCounts[targetMonth].actos[r.acto] = (detailCounts[targetMonth].actos[r.acto] || 0) + r.cantidad;
            }
            if (r.condicion) {
                monthData.condiciones += r.cantidad;
                detailCounts[targetMonth].condiciones[r.condicion] = (detailCounts[targetMonth].condiciones[r.condicion] || 0) + r.cantidad;
            }
        });

        data.forEach(d => {
            const actosObj = detailCounts[d.month].actos;
            const condObj = detailCounts[d.month].condiciones;
            if (Object.keys(actosObj).length > 0) d.topActo = Object.entries(actosObj).sort((a,b) => b[1]-a[1])[0][0];
            if (Object.keys(condObj).length > 0) d.topCondicion = Object.entries(condObj).sort((a,b) => b[1]-a[1])[0][0];
        });

        return data;
    };

    const monthlyData = getMonthlyData();
    const maxActoValue = Math.max(...monthlyData.map(d => d.actos));
    const maxCondicionValue = Math.max(...monthlyData.map(d => d.condiciones));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const d = monthlyData.find(m => m.month === label);
            return (
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl">
                    <p className="text-white font-black mb-2 uppercase">{label}</p>
                    <div className="space-y-2">
                        <div className="bg-orange-500/10 p-2 rounded-lg border border-orange-500/20">
                            <p className="text-orange-500 font-bold text-xs">Actos: {payload[0]?.value}</p>
                            {d?.topActo && <p className="text-orange-400 text-[10px] mt-1 line-clamp-2 leading-tight">🔥 Principal: {d.topActo}</p>}
                        </div>
                        <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                            <p className="text-blue-500 font-bold text-xs">Condiciones: {payload[1]?.value}</p>
                            {d?.topCondicion && <p className="text-blue-400 text-[10px] mt-1 line-clamp-2 leading-tight">❄️ Principal: {d.topCondicion}</p>}
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const CustomizedActoLabel = (props: any) => {
        const { x, y, value, index } = props;
        if (value === maxActoValue && value > 0) {
            const top = monthlyData[index].topActo;
            return (
                <text x={x} y={y - 15} fill="#fb923c" fontSize={9} textAnchor="middle" fontWeight="black" className="bg-slate-900">
                    🏆 {top?.substring(0, 20)}...
                </text>
            );
        }
        return null;
    };

    const CustomizedCondicionLabel = (props: any) => {
        const { x, y, value, index } = props;
        if (value === maxCondicionValue && value > 0) {
            const top = monthlyData[index].topCondicion;
            return (
                <text x={x} y={y + 20} fill="#60a5fa" fontSize={9} textAnchor="middle" fontWeight="black" className="bg-slate-900">
                    🏆 {top?.substring(0, 20)}...
                </text>
            );
        }
        return null;
    };

    if (!isLoaded) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Cargando...</div>;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] -mr-32 -mt-32 rounded-full"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4 mb-2">
                                <AlertTriangle size={40} className="text-orange-500" />
                                Control de Tarjeta de Observación Preventiva (TOP)
                            </h1>
                            <p className="text-slate-400 font-bold max-w-2xl">
                                Herramienta para el registro de actos y condiciones inseguras identificadas en campo, sincronizado con el OBJ 04 del Programa Anual.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center min-w-[120px]">
                                <p className="text-[10px] font-black text-orange-500 uppercase">Actos</p>
                                <p className="text-2xl font-black text-white">{records.filter(r => r.acto).length}</p>
                            </div>
                            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center min-w-[120px]">
                                <p className="text-[10px] font-black text-blue-500 uppercase">Condiciones</p>
                                <p className="text-2xl font-black text-white">{records.filter(r => r.condicion).length}</p>
                            </div>
                            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center min-w-[120px] flex items-center justify-center cursor-pointer hover:bg-slate-900 transition-colors" onClick={() => setShowQR(true)}>
                                <div className="text-center">
                                    <QrCode size={32} className="text-white mx-auto mb-1" />
                                    <p className="text-[10px] font-black text-white uppercase">Obtener QR</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {showQR && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full text-center relative shadow-2xl">
                            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 rounded-full p-1">
                                <X size={20} />
                            </button>
                            <QrCode size={48} className="text-orange-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">QR de Acceso Libre</h2>
                            <p className="text-slate-400 text-sm mb-6">Escanee este código QR para acceder al reporte TOP desde cualquier dispositivo móvil sin contraseña.</p>
                            <div className="bg-white p-4 rounded-2xl inline-block mx-auto mb-6 shadow-inner">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin + '/public/reporte-ac' : 'https://ssoma-platform.vercel.app/public/reporte-ac')}`} alt="QR Code" className="w-48 h-48" />
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                                <p className="text-xs text-slate-300 font-mono break-all select-all">
                                    {typeof window !== 'undefined' ? window.location.origin + '/public/reporte-ac' : 'https://ssoma-platform.vercel.app/public/reporte-ac'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Analysis Dashboard */}
                <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-[2rem] shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-white flex items-center gap-3">
                            <TrendingUp size={24} className="text-emerald-500" />
                            Tendencia de Actos y Condiciones
                        </h3>
                    </div>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData} margin={{ top: 30, left: 10, right: 30, bottom: 10 }}>
                                <defs>
                                    <linearGradient id="colorActos" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorCondiciones" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                    </linearGradient>
                                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="4" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis 
                                    dataKey="month" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} 
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 10 }} 
                                    dx={-10}
                                />
                                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} iconType="circle" />
                                <Area 
                                    type="monotone" 
                                    dataKey="condiciones" 
                                    name="Condiciones Inseguras" 
                                    stroke="#3b82f6" 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#colorCondiciones)" 
                                    filter="url(#glow)"
                                    activeDot={{ r: 6, stroke: '#1e293b', strokeWidth: 2, fill: '#60a5fa' }}
                                    label={<CustomizedCondicionLabel />}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="actos" 
                                    name="Actos Inseguros" 
                                    stroke="#f97316" 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#colorActos)" 
                                    filter="url(#glow)"
                                    activeDot={{ r: 6, stroke: '#1e293b', strokeWidth: 2, fill: '#fb923c' }}
                                    label={<CustomizedActoLabel />}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-[#1c222b] border border-slate-700/50 p-6 md:p-8 rounded-[2rem] shadow-2xl space-y-6 relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700/50 pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#b35922] p-3 rounded-2xl shadow-lg">
                                        <AlertTriangle size={32} className="text-[#1c222b] fill-current" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Tarjeta de Observación Preventiva</h1>
                                        <p className="text-slate-400 text-sm">Proyecto: Red Vial 6</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="bg-[#b35922]/20 text-[#f97316] text-[10px] font-bold px-2 py-1 rounded border border-[#b35922]/50 uppercase">Código: F-SIG-060</span>
                                    <span className="bg-[#b35922]/20 text-[#f97316] text-[10px] font-bold px-2 py-1 rounded border border-[#b35922]/50 uppercase">Versión: 01</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="border border-[#b35922] rounded-xl p-3 bg-transparent flex flex-col justify-center">
                                    <label className="text-[10px] text-slate-400 uppercase flex items-center gap-2 mb-1"><Calendar size={12}/> Fecha:</label>
                                    <input type="date" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} className="bg-transparent text-white text-sm font-bold outline-none" />
                                </div>
                                <div className="border border-[#b35922] rounded-xl p-3 bg-transparent flex flex-col justify-center">
                                    <label className="text-[10px] text-slate-400 uppercase flex items-center gap-2 mb-1"><Users size={12}/> Reportado Por:</label>
                                    <select value={form.responsible} onChange={e=>setForm({...form, responsible: e.target.value})} className="bg-[#1c222b] text-white text-sm font-bold outline-none border-none">
                                        <option value="">Seleccionar...</option>
                                        {RESPONSIBLES.map(r=><option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div className="border border-[#b35922] rounded-xl p-3 bg-transparent flex flex-col justify-center">
                                    <label className="text-[10px] text-slate-400 uppercase flex items-center gap-2 mb-1"><MapPin size={12}/> Ubicación:</label>
                                    <select value={form.location} onChange={e=>setForm({...form, location: e.target.value})} className="bg-[#1c222b] text-white text-sm font-bold outline-none border-none">
                                        <option value="">Seleccionar...</option>
                                        {SSOMA_LOCATIONS.map(r=><option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-center my-6">
                                <div className="flex bg-[#232a35] rounded-full p-1 border border-slate-700/50 w-full sm:w-auto relative">
                                    <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#f97316] rounded-full transition-all duration-300 shadow-md ${form.type === 'acto' ? 'left-1' : 'left-[calc(50%+4px)]'}`}></div>
                                    <button type="button" onClick={() => setForm({...form, type: 'acto'})} className={`relative flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold uppercase tracking-wider z-10 flex items-center justify-center gap-2 transition-colors ${form.type === 'acto' ? 'text-black' : 'text-slate-400 hover:text-slate-200'}`}>
                                        <CheckCircle2 size={14} /> Acto Inseguro
                                    </button>
                                    <button type="button" onClick={() => setForm({...form, type: 'condicion'})} className={`relative flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold uppercase tracking-wider z-10 transition-colors ${form.type === 'condicion' ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                                        Condición Insegura
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar mb-6">
                                {(form.type === 'acto' ? ACTOS_LIST : CONDICIONES_LIST).map(item => {
                                    const isChecked = form.type === 'acto' ? form.actos_checked.includes(item) : form.condiciones_checked.includes(item);
                                    return (
                                        <label key={item} className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all aspect-square justify-center items-center text-center gap-2 ${isChecked ? 'border-[#f97316] bg-[#f97316]/10 shadow-[0_0_15px_rgba(249,115,22,0.15)] scale-[1.02]' : 'border-slate-700 bg-transparent hover:border-slate-500 hover:bg-slate-800/50'}`}>
                                            <div className="absolute top-2 right-2">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isChecked ? 'bg-[#f97316] border-[#f97316]' : 'border-slate-500 bg-transparent'}`}>
                                                    {isChecked && <CheckCircle2 size={12} className="text-white" />}
                                                </div>
                                            </div>
                                            {getCategoryIcon(item, isChecked, 24)}
                                            <span className={`text-[10px] font-bold leading-tight ${isChecked ? 'text-white' : 'text-slate-300'}`}>{item}</span>
                                            <input 
                                                type="checkbox" 
                                                className="hidden"
                                                checked={isChecked}
                                                onChange={(e) => {
                                                    const list = form.type === 'acto' ? form.actos_checked : form.condiciones_checked;
                                                    const newChecked = e.target.checked ? [...list, item] : list.filter(x => x !== item);
                                                    if (form.type === 'acto') setForm({...form, actos_checked: newChecked});
                                                    else setForm({...form, condiciones_checked: newChecked});
                                                }}
                                            />
                                        </label>
                                    );
                                })}
                            </div>

                            <div className="border border-[#b35922] rounded-xl p-4 bg-transparent">
                                <label className="text-xs text-slate-400 mb-2 block">Descripción detallada de la observación...</label>
                                <textarea value={form.descripcion} onChange={e=>setForm({...form, descripcion: e.target.value})} className="w-full bg-transparent text-white text-sm outline-none resize-none h-20" placeholder="Ingresar detalles aquí..." />
                            </div>

                            <div className="border border-[#b35922] rounded-xl p-4 bg-transparent mt-4">
                                <label className="text-xs text-slate-400 mb-2 block">Acción Inmediata (Opcional)</label>
                                <textarea value={form.accion_inmediata} onChange={e=>setForm({...form, accion_inmediata: e.target.value})} className="w-full bg-transparent text-white text-sm outline-none resize-none h-16" placeholder="Describir acción..." />
                            </div>

                            <div className="space-y-1 pt-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Evidencia (PDF)</label>
                                <div className="relative group" onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) { setPdfFile(e.dataTransfer.files[0]); } }}>
                                    <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full" />
                                    <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${isDragging ? 'border-[#f97316] bg-[#f97316]/20' : pdfFile ? 'border-[#f97316]/50 bg-transparent' : 'border-slate-700 bg-transparent group-hover:border-[#f97316]/50'}`}>
                                        <Upload className={`mx-auto mb-2 ${isDragging || pdfFile ? 'text-[#f97316]' : 'text-slate-600'} ${isDragging ? 'animate-bounce' : ''}`} size={20} />
                                        <p className={`text-[10px] font-bold uppercase tracking-tighter ${isDragging ? 'text-[#f97316]' : 'text-slate-500'}`}>
                                            {isDragging ? '¡SUELTA EL ARCHIVO AQUÍ!' : pdfFile ? pdfFile.name : 'Subir Archivo PDF'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-center pb-2">
                                <button 
                                    onClick={handleSave}
                                    disabled={isUploading}
                                    className="w-full md:w-auto md:min-w-[250px] bg-gradient-to-r from-[#ff6b00] to-[#ff8c00] hover:from-[#ff8c00] hover:to-[#ffa600] text-white font-bold py-3.5 px-8 rounded-full shadow-[0_0_20px_rgba(255,107,0,0.4)] hover:shadow-[0_0_30px_rgba(255,107,0,0.6)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:-translate-y-1"
                                >
                                    {isUploading ? <Activity className="animate-spin" size={18} /> : null}
                                    Registrar Reporte ↑
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table Side */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] shadow-xl overflow-hidden">
                            <div className="p-6 border-b border-slate-800 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                                        <FileText size={20} className="text-orange-500" />
                                        Registros Recientes
                                    </h3>
                                    <div className="text-[10px] font-mono text-slate-500 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                                        {filteredRecords.length} REGISTROS
                                    </div>
                                    <button
                                        onClick={() => {
                                            const cols = [
                                                { header: 'Fecha', dataKey: 'date' },
                                                { header: 'Responsable', dataKey: 'responsible' },
                                                { header: 'Acto', dataKey: 'acto' },
                                                { header: 'Condición', dataKey: 'condicion' },
                                                { header: 'Cantidad', dataKey: 'cantidad' },
                                                { header: 'Lugar', dataKey: 'location' },
                                                { header: 'Descripción', dataKey: 'descripcion' },
                                                { header: 'Acción Inmediata', dataKey: 'accion_inmediata' }
                                            ];
                                            exportTableToPDF('Reportes de Actos y Condiciones', cols, filteredRecords, 'Reportes_AC.pdf');
                                        }}
                                        disabled={filteredRecords.length === 0}
                                        className="bg-slate-800 hover:bg-orange-600 disabled:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all border border-slate-700"
                                    >
                                        <FileText size={14} /> Descargar PDF
                                    </button>
                                </div>

                                {/* Month Summary Bar */}
                                <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                                    {MONTHS_LIST.map(m => {
                                        const count = getMonthCount(m);
                                        return (
                                            <div 
                                                key={m} 
                                                onClick={() => setFilterMonth(filterMonth === m ? "" : m)}
                                                className={`p-2 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${filterMonth === m ? 'bg-orange-500 border-orange-400 text-black' : count > 0 ? 'bg-orange-500/10 border-orange-500/20 text-orange-500 hover:bg-orange-500/20' : 'bg-slate-950 border-slate-800 text-slate-700 opacity-40'}`}
                                            >
                                                <span className="text-[8px] font-black uppercase">{m}</span>
                                                <span className="text-xs font-black">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* FILTERS */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-800/30 p-4 rounded-2xl border border-slate-800/50 items-end">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Fecha</label>
                                            {filterDate && (
                                                <button onClick={() => setFilterDate('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <input 
                                            type="date"
                                            value={filterDate}
                                            onChange={e => setFilterDate(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-[10px] text-white focus:border-orange-500 outline-none"
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
                                            onChange={(val) => setFilterLocation(val)}
                                            placeholder="Todos los lugares..."
                                            className="[&>div]:bg-slate-950 [&>div]:border-slate-700 [&>div]:py-1.5 [&>div]:px-3 [&>div]:text-[10px]"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[9px] font-black text-slate-500 uppercase">Filtrar por Acto</label>
                                            {filterActo && (
                                                <button onClick={() => setFilterActo('')} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <SearchableSelect 
                                            options={ACTOS_LIST.map(l => ({ id: l, label: l }))}
                                            value={filterActo}
                                            onChange={(val) => setFilterActo(val)}
                                            placeholder="Todos los actos..."
                                            className="[&>div]:bg-slate-950 [&>div]:border-slate-700 [&>div]:py-1.5 [&>div]:px-3 [&>div]:text-[10px]"
                                        />
                                    </div>
                                    <div className="space-y-1 flex flex-col justify-end h-[53px]">
                                        {(filterLocation || filterDate || filterActo || filterMonth) && (
                                            <button 
                                                onClick={() => { setFilterLocation(''); setFilterDate(''); setFilterActo(''); setFilterMonth(''); }}
                                                className="w-full h-[33px] bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold uppercase transition-colors border border-red-500/20 flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <X size={14} strokeWidth={3} /> Limpiar Filtros
                                            </button>
                                        )}
                                    </div>
                                </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-800 bg-slate-950/50">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Fecha</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Responsable</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Acto / Condición</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-center">Cant.</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase">Lugar</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {filteredRecords.map(r => (
                                            <tr key={r.id} className="hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-6 py-4 text-xs font-bold">{r.date}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-black border border-slate-700">
                                                            {r.responsible.substring(0,2).toUpperCase()}
                                                        </div>
                                                        <span className="text-xs">{r.responsible}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        {r.acto && <span className="block text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full border border-orange-500/20 w-fit">A: {r.acto}</span>}
                                                        {r.condicion && <span className="block text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 w-fit">C: {r.condicion}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-black text-orange-500">{r.cantidad}</td>
                                                <td className="px-6 py-4 text-[10px] text-slate-400 font-medium uppercase">{r.location}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {r.pdfUrl ? (
                                                            <button 
                                                                onClick={() => setPreviewFile({ url: r.pdfUrl, type: 'pdf' })}
                                                                className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-all border border-emerald-500/20"
                                                                title="Ver Archivo"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        ) : (
                                                            <div 
                                                                className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 cursor-help"
                                                                title="Archivo no cargado"
                                                            >
                                                                <FileX size={16} />
                                                            </div>
                                                        )}
                                                        <button 
                                                            onClick={() => exportRecordToPDF('Detalle de Reporte A/C', r, `ReporteAC_${r.id}.pdf`)}
                                                            className="p-2 text-slate-600 hover:text-blue-400 transition-colors" 
                                                            title="Descargar Fila"
                                                        >
                                                            <DownloadCloud size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => setEditingRecord(r)}
                                                            className="p-2 text-slate-600 hover:text-amber-400 transition-colors" 
                                                            title="Editar Registro"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(r.id)}
                                                            className="p-2 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PREVIEW MODAL */}
            {previewFile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-slate-950/95 backdrop-blur-md">
                    <div className="relative w-full max-w-5xl h-full flex flex-col bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <FileText className="text-orange-500" />
                                Visualización de Evidencia
                            </h3>
                            <button 
                                onClick={() => setPreviewFile(null)}
                                className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 bg-slate-950 p-4">
                            <iframe 
                                src={getDriveViewerUrl(previewFile.url)} 
                                className="w-full h-full rounded-2xl border border-slate-800"
                                title="Visualizador"
                            />
                        </div>
                        <div className="p-4 border-t border-slate-800 flex justify-center">
                            <a 
                                href={previewFile.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-8 py-3 bg-slate-800 hover:bg-orange-600 text-white font-black rounded-xl transition-all uppercase text-xs tracking-widest"
                            >
                                <Download size={18} /> Descargar Original
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {editingRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                            <h3 className="text-xl font-black text-white flex items-center gap-3">
                                <Edit2 className="text-amber-500" />
                                Editar Registro
                            </h3>
                            <button 
                                onClick={() => setEditingRecord(null)}
                                className="p-2 text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase">Fecha</label>
                                    <input 
                                        type="date"
                                        value={editingRecord.date}
                                        onChange={e => setEditingRecord({...editingRecord, date: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase">Responsable</label>
                                    <SearchableSelect 
                                        options={RESPONSIBLES}
                                        value={editingRecord.responsible}
                                        onChange={val => setEditingRecord({...editingRecord, responsible: val})}
                                        placeholder="Seleccionar..."
                                        icon={<Users size={16} />}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase">Lugar</label>
                                    <SearchableSelect 
                                        options={SSOMA_LOCATIONS}
                                        value={editingRecord.location}
                                        onChange={val => setEditingRecord({...editingRecord, location: val})}
                                        placeholder="Seleccionar..."
                                        icon={<MapPin size={16} />}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase">Cantidad</label>
                                    <input 
                                        type="number"
                                        value={editingRecord.cantidad}
                                        onChange={e => setEditingRecord({...editingRecord, cantidad: Number(e.target.value)})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase">Acto</label>
                                <SearchableSelect 
                                    options={ACTOS_LIST}
                                    value={editingRecord.acto}
                                    onChange={val => setEditingRecord({...editingRecord, acto: val})}
                                    placeholder="Seleccionar..."
                                    icon={<AlertTriangle size={16} className="text-orange-500" />}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase">Condición</label>
                                <SearchableSelect 
                                    options={CONDICIONES_LIST}
                                    value={editingRecord.condicion}
                                    onChange={val => setEditingRecord({...editingRecord, condicion: val})}
                                    placeholder="Seleccionar..."
                                    icon={<AlertTriangle size={16} className="text-blue-500" />}
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                            <button 
                                onClick={() => setEditingRecord(null)}
                                className="px-6 py-2 rounded-xl text-slate-400 font-bold hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleUpdate}
                                disabled={isUpdating}
                                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {isUpdating ? <Activity className="animate-spin" size={16} /> : <Save size={16} />}
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
    );
}
