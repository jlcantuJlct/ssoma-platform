"use client";

import { useAuth } from '@/lib/auth';
import {
    Target,
    Upload,
    FileSpreadsheet,
    Download,
    CheckCircle2,
    AlertTriangle,
    Save,
    RotateCcw,
    Plus,
    Trash2,
    Edit2,
    Search,
    Shield,
    GraduationCap,
    ClipboardCheck,
    Stethoscope,
    HeartPulse,
    UserPlus,
    Leaf,
    Sprout,
    Siren,
    Users,
    Activity,
    ExternalLink,
    Check,
    X,
    Filter
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import Link from 'next/link';

// Objetivos oficiales del Programa Anual para comprobación y coincidencia
export const PROGRAM_OBJECTIVES = [
    { id: 'obj1', code: 'OBJ 01', label: 'OBJ 01: SCSST', name: 'Comité y Sistema de Gestión de SST', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'obj2', code: 'OBJ 02', label: 'OBJ 02: Capacitación', name: 'Capacitación, Entrenamiento y Simulacros', icon: GraduationCap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'obj3', code: 'OBJ 03', label: 'OBJ 03: Inspecciones Seguridad', name: 'Inspecciones Internas de Seguridad', icon: ClipboardCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'obj4', code: 'OBJ 04', label: 'OBJ 04: Reporte A/C Inseguras', name: 'Tarjetas de Observación Preventiva (TOP)', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { id: 'obj5', code: 'OBJ 05', label: 'OBJ 05: EMO Realizados', name: 'Exámenes Médicos Ocupacionales', icon: Stethoscope, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { id: 'obj6', code: 'SEG 01', label: 'SEG 01: Inspecciones de Salud', name: 'Inspecciones y Vigilancia de Salud', icon: HeartPulse, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { id: 'obj7', code: 'SEG 02', label: 'SEG 02: Formaciones de Salud', name: 'Formaciones y Talleres de Salud', icon: UserPlus, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { id: 'obj8', code: 'SEG 03', label: 'SEG 03: Inspecciones M. Ambiente', name: 'Inspecciones de Medio Ambiente', icon: Leaf, color: 'text-green-400', bg: 'bg-green-500/10' },
    { id: 'obj9', code: 'SEG 04', label: 'SEG 04: Formaciones M. Ambiente', name: 'Formaciones Ambientales', icon: Sprout, color: 'text-lime-400', bg: 'bg-lime-500/10' },
    { id: 'obj10', code: 'SEG 05', label: 'SEG 05: Control de Simulacros', name: 'Simulacros de Emergencia', icon: Siren, color: 'text-teal-400', bg: 'bg-teal-500/10' },
    { id: 'obj11', code: 'SEG 06', label: 'SEG 06: Control de Brigadistas', name: 'Brigadas de Emergencia', icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10' },
];

export interface ObjetivoItem {
    id: string;
    codigo: string;
    nombre: string;
    indicador: string;
    meta: string;
    responsable: string;
    frecuencia: string;
    matchedProgramId?: string; // id del objetivo con el que coincide (ej: obj1, obj2)
    observaciones?: string;
}

export default function ObjetivosPage() {
    const { user } = useAuth();
    const activeWs = user?.workspace || 'Red Vial 6';
    const isLongitudinal = activeWs.toLowerCase().includes('longitudinal');

    const [objetivos, setObjetivos] = useState<ObjetivoItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMatch, setFilterMatch] = useState<'all' | 'matched' | 'unmatched'>('all');
    const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Modal para editar o agregar objetivo individual
    const [editingItem, setEditingItem] = useState<ObjetivoItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Cargar objetivos guardados al iniciar o al cambiar de proyecto
    useEffect(() => {
        const loadObjetivos = async () => {
            setIsLoading(true);
            try {
                // 1. Intentar desde localStorage como fallback rápido
                const localKey = `ssoma_objetivos_${activeWs}`;
                const cached = localStorage.getItem(localKey);
                if (cached) {
                    try {
                        setObjetivos(JSON.parse(cached));
                    } catch (e) {}
                }

                // 2. Cargar desde la base de datos
                const res = await fetch(`/api/objetivos?workspace=${encodeURIComponent(activeWs)}`);
                const data = await res.json();
                if (data.success && Array.isArray(data.objetivos) && data.objetivos.length > 0) {
                    setObjetivos(data.objetivos);
                    localStorage.setItem(localKey, JSON.stringify(data.objetivos));
                }
            } catch (err) {
                console.error("Error cargando objetivos:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadObjetivos();
    }, [activeWs]);

    // Función inteligente para detectar coincidencia con el Programa Anual
    const matchWithProgram = (codigo: string, nombre: string): string | undefined => {
        const text = `${codigo} ${nombre}`.toLowerCase().trim();

        // Comprobación por códigos directos
        if (text.includes('obj 1') || text.includes('obj 01') || text.includes('obj-01') || text.includes('scsst') || text.includes('comite') || text.includes('comité')) return 'obj1';
        if (text.includes('obj 2') || text.includes('obj 02') || text.includes('obj-02') || text.includes('capacita') || text.includes('entrena')) return 'obj2';
        if (text.includes('obj 3') || text.includes('obj 03') || text.includes('obj-03') || (text.includes('inspecc') && text.includes('seguridad'))) return 'obj3';
        if (text.includes('obj 4') || text.includes('obj 04') || text.includes('obj-04') || text.includes('top') || text.includes('acto') || text.includes('condici')) return 'obj4';
        if (text.includes('obj 5') || text.includes('obj 05') || text.includes('obj-05') || text.includes('emo') || text.includes('medico') || text.includes('médico')) return 'obj5';
        if (text.includes('seg 1') || text.includes('seg 01') || (text.includes('inspecc') && text.includes('salud'))) return 'obj6';
        if (text.includes('seg 2') || text.includes('seg 02') || (text.includes('formac') && text.includes('salud'))) return 'obj7';
        if (text.includes('seg 3') || text.includes('seg 03') || (text.includes('inspecc') && (text.includes('ambiente') || text.includes('ambiental')))) return 'obj8';
        if (text.includes('seg 4') || text.includes('seg 04') || (text.includes('formac') && (text.includes('ambiente') || text.includes('ambiental')))) return 'obj9';
        if (text.includes('seg 5') || text.includes('seg 05') || text.includes('simulacro')) return 'obj10';
        if (text.includes('seg 6') || text.includes('seg 06') || text.includes('brigad')) return 'obj11';

        return undefined;
    };

    // Procesar archivo Excel subido
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

                if (!data || data.length < 2) {
                    setFeedbackMsg({ type: 'error', text: 'El archivo Excel no contiene suficientes datos o filas.' });
                    return;
                }

                // Encontrar la fila de cabecera
                let headerIdx = 0;
                for (let i = 0; i < Math.min(data.length, 5); i++) {
                    const rowText = (data[i] || []).map((c: any) => String(c).toLowerCase()).join(' ');
                    if (rowText.includes('objetiv') || rowText.includes('meta') || rowText.includes('indicador') || rowText.includes('cod')) {
                        headerIdx = i;
                        break;
                    }
                }

                const headers: string[] = (data[headerIdx] || []).map((h: any) => String(h || '').trim().toLowerCase());
                
                // Mapear índices de columnas de forma flexible
                const colCod = headers.findIndex(h => h.includes('cod') || h.includes('item') || h.includes('n°') || h.includes('id'));
                const colNom = headers.findIndex(h => h.includes('objetiv') || h.includes('descrip') || h.includes('nombre'));
                const colInd = headers.findIndex(h => h.includes('indicador') || h.includes('formula') || h.includes('métrica') || h.includes('metrica'));
                const colMeta = headers.findIndex(h => h.includes('meta') || h.includes('target') || h.includes('valor'));
                const colResp = headers.findIndex(h => h.includes('resp') || h.includes('area') || h.includes('área') || h.includes('lider'));
                const colFrec = headers.findIndex(h => h.includes('frec') || h.includes('period') || h.includes('plazo'));

                const parsedList: ObjetivoItem[] = [];

                for (let r = headerIdx + 1; r < data.length; r++) {
                    const row = data[r];
                    if (!row || row.length === 0) continue;

                    const codVal = colCod !== -1 ? String(row[colCod] || '').trim() : `OBJ ${parsedList.length + 1}`;
                    const nomVal = colNom !== -1 ? String(row[colNom] || '').trim() : String(row[1] || '').trim();
                    
                    if (!nomVal && !codVal) continue;

                    const indVal = colInd !== -1 ? String(row[colInd] || '').trim() : '';
                    const metaVal = colMeta !== -1 ? String(row[colMeta] || '').trim() : '100%';
                    const respVal = colResp !== -1 ? String(row[colResp] || '').trim() : 'Líder SSOMA';
                    const frecVal = colFrec !== -1 ? String(row[colFrec] || '').trim() : 'Mensual';

                    const matchedId = matchWithProgram(codVal, nomVal);

                    parsedList.push({
                        id: `obj_${Date.now()}_${r}`,
                        codigo: codVal || `OBJ ${parsedList.length + 1}`,
                        nombre: nomVal || 'Objetivo sin descripción',
                        indicador: indVal || 'Cumplimiento de actividades',
                        meta: metaVal,
                        responsable: respVal,
                        frecuencia: frecVal,
                        matchedProgramId: matchedId
                    });
                }

                if (parsedList.length === 0) {
                    setFeedbackMsg({ type: 'error', text: 'No se pudieron interpretar objetivos válidos del Excel. Asegúrate de incluir columnas como "Objetivo", "Meta" o "Indicador".' });
                    return;
                }

                setObjetivos(parsedList);
                saveObjetivosToDb(parsedList);
                setFeedbackMsg({ type: 'success', text: `¡Se cargaron exitosamente ${parsedList.length} objetivos desde el Excel!` });
            } catch (err: any) {
                console.error("Error al leer Excel:", err);
                setFeedbackMsg({ type: 'error', text: 'Ocurrió un error al procesar el Excel: ' + (err.message || 'Formato no soportado') });
            }
        };
        reader.readAsBinaryString(file);
        // Reset input
        e.target.value = '';
    };

    // Guardar en Base de Datos y LocalStorage
    const saveObjetivosToDb = async (listToSave: ObjetivoItem[]) => {
        setIsSaving(true);
        try {
            const localKey = `ssoma_objetivos_${activeWs}`;
            localStorage.setItem(localKey, JSON.stringify(listToSave));

            const res = await fetch('/api/objetivos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspace: activeWs, objetivos: listToSave })
            });
            const data = await res.json();
            if (data.success) {
                setFeedbackMsg({ type: 'success', text: 'Objetivos del año sincronizados y guardados correctamente.' });
            }
        } catch (err) {
            console.error("Error al guardar objetivos:", err);
        } finally {
            setIsSaving(false);
        }
    };

    // Descargar plantilla Excel oficial
    const handleDownloadTemplate = () => {
        const templateRows = PROGRAM_OBJECTIVES.map((obj, idx) => ({
            "CÓDIGO": obj.code,
            "OBJETIVO DEL AÑO": obj.name,
            "INDICADOR / FÓRMULA": `(Actividades Ejecutadas / Actividades Programadas) * 100`,
            "META": "100%",
            "RESPONSABLE": "Jefatura SSOMA / Supervisor",
            "FRECUENCIA": "Mensual",
            "COINCIDENCIA PROGRAMA ANUAL": obj.label
        }));

        const ws = XLSX.utils.json_to_sheet(templateRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Objetivos Anuales");
        XLSX.writeFile(wb, `Plantilla_Objetivos_del_Año_${activeWs.replace(/\s+/g, '_')}.xlsx`);
    };

    // Exportar lista actual a Excel
    const handleExportExcel = () => {
        if (objetivos.length === 0) return;
        const exportRows = objetivos.map(o => {
            const match = PROGRAM_OBJECTIVES.find(p => p.id === o.matchedProgramId);
            return {
                "CÓDIGO": o.codigo,
                "OBJETIVO": o.nombre,
                "INDICADOR": o.indicador,
                "META": o.meta,
                "RESPONSABLE": o.responsable,
                "FRECUENCIA": o.frecuencia,
                "ESTADO PROGRAMA ANUAL": match ? `Coincide con ${match.label}` : 'Objetivo Específico / Adicional'
            };
        });

        const ws = XLSX.utils.json_to_sheet(exportRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Objetivos");
        XLSX.writeFile(wb, `Objetivos_del_Año_${activeWs.replace(/\s+/g, '_')}.xlsx`);
    };

    // Filtrado de objetivos en pantalla
    const filteredObjetivos = useMemo(() => {
        return objetivos.filter(obj => {
            const matchesSearch = 
                obj.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                obj.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                obj.responsable.toLowerCase().includes(searchTerm.toLowerCase()) ||
                obj.indicador.toLowerCase().includes(searchTerm.toLowerCase());

            if (!matchesSearch) return false;

            if (filterMatch === 'matched') return Boolean(obj.matchedProgramId);
            if (filterMatch === 'unmatched') return !obj.matchedProgramId;
            return true;
        });
    }, [objetivos, searchTerm, filterMatch]);

    // Estadísticas
    const totalCount = objetivos.length;
    const matchedCount = objetivos.filter(o => Boolean(o.matchedProgramId)).length;
    const unmatchedCount = totalCount - matchedCount;

    // Eliminar objetivo
    const handleDelete = (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este objetivo?')) return;
        const updated = objetivos.filter(o => o.id !== id);
        setObjetivos(updated);
        saveObjetivosToDb(updated);
    };

    // Guardar edición o nuevo
    const handleSaveItemModal = () => {
        if (!editingItem || !editingItem.nombre.trim()) return;

        const matchedId = matchWithProgram(editingItem.codigo, editingItem.nombre);
        const finalizedItem = { ...editingItem, matchedProgramId: matchedId };

        let updated: ObjetivoItem[];
        const exists = objetivos.some(o => o.id === finalizedItem.id);
        if (exists) {
            updated = objetivos.map(o => o.id === finalizedItem.id ? finalizedItem : o);
        } else {
            updated = [finalizedItem, ...objetivos];
        }

        setObjetivos(updated);
        saveObjetivosToDb(updated);
        setIsModalOpen(false);
        setEditingItem(null);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className={`bg-slate-900 border ${isLongitudinal ? 'border-teal-800/60' : 'border-slate-800'} p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl`}>
                    <div className={`absolute top-0 right-0 w-full md:w-64 h-64 ${isLongitudinal ? 'bg-emerald-500/15' : 'bg-amber-500/10'} blur-[80px] -mr-32 -mt-32 rounded-full`}></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isLongitudinal ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'}`}>
                                    Proyecto Activo: {activeWs}
                                </span>
                                <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-700">
                                    Año 2026
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter flex items-center gap-3.5 mb-2">
                                <Target size={38} className={isLongitudinal ? "text-emerald-400" : "text-amber-400"} />
                                Objetivos del Año
                            </h1>
                            <p className="text-slate-400 font-bold max-w-2xl text-xs sm:text-sm">
                                Carga y gestiona la matriz de objetivos anuales para <strong>{activeWs}</strong>. El sistema verifica la coincidencia automática con las metas y actividades del Programa Anual SSOMA.
                            </p>
                        </div>

                        {/* Botones de acción del header */}
                        <div className="flex flex-wrap gap-2.5">
                            <label className={`cursor-pointer px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-lg ${isLongitudinal ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 shadow-emerald-500/20' : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-amber-500/20'}`}>
                                <Upload size={16} /> Cargar Excel de Objetivos
                                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                            </label>

                            <button
                                type="button"
                                onClick={handleDownloadTemplate}
                                className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 shadow-sm"
                                title="Descargar plantilla Excel pre-rellenada con los objetivos del Programa Anual"
                            >
                                <Download size={15} /> Plantilla Excel
                            </button>

                            <Link
                                href="/program"
                                className="px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-bold transition-all border border-emerald-500/30 flex items-center gap-1.5 shadow-sm"
                            >
                                <ExternalLink size={15} /> Ver Programa Anual
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Notificación de feedback */}
                {feedbackMsg && (
                    <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-in fade-in duration-300 ${feedbackMsg.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/20 border-rose-500/40 text-rose-300'}`}>
                        <div className="flex items-center gap-2">
                            {feedbackMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                            <span>{feedbackMsg.text}</span>
                        </div>
                        <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Tarjetas KPI de Resumen */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Objetivos Cargados</span>
                            <Target size={18} className="text-amber-400" />
                        </div>
                        <p className="text-3xl font-black text-white">{totalCount}</p>
                        <p className="text-[11px] text-slate-500 mt-1">Registrados para el año en curso</p>
                    </div>

                    <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-2xl bg-emerald-950/10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Coinciden con Programa</span>
                            <CheckCircle2 size={18} className="text-emerald-400" />
                        </div>
                        <p className="text-3xl font-black text-emerald-400">{matchedCount}</p>
                        <p className="text-[11px] text-slate-400 mt-1">Alineados a las metas del Programa Anual</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Objetivos Específicos</span>
                            <Shield size={18} className="text-sky-400" />
                        </div>
                        <p className="text-3xl font-black text-sky-400">{unmatchedCount}</p>
                        <p className="text-[11px] text-slate-500 mt-1">Metas adicionales propias del proyecto</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Carga Rápida de Excel</span>
                            <p className="text-xs text-slate-300 mt-1 font-bold">Actualiza tu archivo en cualquier momento</p>
                        </div>
                        <label className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer">
                            <FileSpreadsheet size={15} className="text-emerald-400" /> Seleccionar Archivo
                            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                        </label>
                    </div>
                </div>

                {/* Panel de Correspondencia con el Programa Anual */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
                        <div>
                            <h3 className="text-lg font-black text-white flex items-center gap-2">
                                <CheckCircle2 size={20} className="text-emerald-400" />
                                Alineación con el Programa Anual SSOMA
                            </h3>
                            <p className="text-slate-400 text-xs">
                                Comparación entre los objetivos cargados en tu Excel y los objetivos definidos en el Programa Anual.
                            </p>
                        </div>
                        <span className="text-xs bg-slate-800 text-slate-300 font-bold px-3 py-1 rounded-full border border-slate-700">
                            {matchedCount} de {PROGRAM_OBJECTIVES.length} Objetivos Principales Cubiertos
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                        {PROGRAM_OBJECTIVES.map(progObj => {
                            const isFound = objetivos.some(o => o.matchedProgramId === progObj.id);
                            const ProgIcon = progObj.icon;
                            return (
                                <div 
                                    key={progObj.id} 
                                    className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all ${isFound ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-950/50 border-slate-800 text-slate-500 opacity-60'}`}
                                >
                                    <div className={`p-1.5 rounded-lg ${progObj.bg} ${progObj.color}`}>
                                        <ProgIcon size={16} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-black truncate">{progObj.code}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{progObj.name}</p>
                                    </div>
                                    {isFound ? (
                                        <Check size={16} className="text-emerald-400 shrink-0" />
                                    ) : (
                                        <span className="text-[10px] text-slate-600 shrink-0">Pendiente</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Tabla de Objetivos del Año */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
                    <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                <Target size={22} className={isLongitudinal ? 'text-emerald-400' : 'text-amber-400'} />
                                Matriz de Objetivos ({filteredObjetivos.length})
                            </h3>
                            <p className="text-slate-400 text-xs">
                                Lista detallada de metas, indicadores y correspondencias con el plan anual.
                            </p>
                        </div>

                        {/* Barra de Filtros y Búsqueda */}
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar por código, meta, responsable..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-amber-500"
                                />
                            </div>

                            <select
                                value={filterMatch}
                                onChange={(e: any) => setFilterMatch(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                            >
                                <option value="all">Todos los objetivos</option>
                                <option value="matched">Coinciden con Programa</option>
                                <option value="unmatched">Específicos / Adicionales</option>
                            </select>

                            <button
                                type="button"
                                onClick={() => {
                                    setEditingItem({
                                        id: `obj_${Date.now()}`,
                                        codigo: `OBJ ${objetivos.length + 1}`,
                                        nombre: '',
                                        indicador: 'Cumplimiento de actividades',
                                        meta: '100%',
                                        responsable: 'SSOMA',
                                        frecuencia: 'Mensual'
                                    });
                                    setIsModalOpen(true);
                                }}
                                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                            >
                                <Plus size={14} /> Nuevo
                            </button>

                            {objetivos.length > 0 && (
                                <button
                                    type="button"
                                    onClick={handleExportExcel}
                                    className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
                                    title="Exportar a Excel"
                                >
                                    <Download size={14} /> Exportar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Contenido de la Tabla */}
                    {isLoading ? (
                        <div className="p-12 text-center text-slate-400">
                            <Activity className="animate-spin mx-auto mb-2 text-amber-400" size={28} />
                            <p className="text-xs font-bold">Cargando objetivos del año...</p>
                        </div>
                    ) : filteredObjetivos.length === 0 ? (
                        <div className="p-12 text-center space-y-4">
                            <FileSpreadsheet size={48} className="mx-auto text-slate-600" />
                            <div>
                                <h4 className="text-white font-bold text-base">Aún no se han cargado objetivos para {activeWs}</h4>
                                <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
                                    Carga tu archivo Excel con la matriz de objetivos anuales o descarga la plantilla prediseñada para comenzar.
                                </p>
                            </div>
                            <div className="flex justify-center gap-3 pt-2">
                                <label className={`cursor-pointer px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg ${isLongitudinal ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-amber-600 hover:bg-amber-500 text-white'}`}>
                                    <Upload size={16} /> Cargar Excel
                                    <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                                </label>
                                <button
                                    type="button"
                                    onClick={handleDownloadTemplate}
                                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all border border-slate-700 flex items-center gap-1.5"
                                >
                                    <Download size={15} /> Descargar Plantilla
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                        <th className="py-3 px-4">Código</th>
                                        <th className="py-3 px-4">Objetivo del Año</th>
                                        <th className="py-3 px-4">Indicador / Fórmula</th>
                                        <th className="py-3 px-4 text-center">Meta</th>
                                        <th className="py-3 px-4">Responsable</th>
                                        <th className="py-3 px-4">Frecuencia</th>
                                        <th className="py-3 px-4">Coincidencia Programa</th>
                                        <th className="py-3 px-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {filteredObjetivos.map((item) => {
                                        const progMatch = PROGRAM_OBJECTIVES.find(p => p.id === item.matchedProgramId);
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                                                <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                                                    <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800">
                                                        {item.codigo}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-bold text-white max-w-md">
                                                    {item.nombre}
                                                </td>
                                                <td className="py-3 px-4 text-slate-300">
                                                    {item.indicador}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full font-black text-[11px] border ${item.meta.includes('100') ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                                                        {item.meta}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                                                    {item.responsable}
                                                </td>
                                                <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                                                    {item.frecuencia}
                                                </td>
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    {progMatch ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                                            <CheckCircle2 size={12} /> {progMatch.label}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                                            Objetivo Específico
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingItem(item);
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                                                            title="Editar Objetivo"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(item.id)}
                                                            className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>

            {/* Modal para Editar o Crear Objetivo */}
            {isModalOpen && editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 relative shadow-2xl space-y-4">
                        <button
                            type="button"
                            onClick={() => { setIsModalOpen(false); setEditingItem(null); }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
                            <Target size={24} className="text-amber-400" />
                            <div>
                                <h3 className="text-base font-black text-white">
                                    {objetivos.some(o => o.id === editingItem.id) ? 'Editar Objetivo del Año' : 'Nuevo Objetivo del Año'}
                                </h3>
                                <p className="text-xs text-slate-400">{activeWs}</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-1">
                                    <label className="text-slate-400 font-bold block mb-1">Código</label>
                                    <input
                                        type="text"
                                        value={editingItem.codigo}
                                        onChange={e => setEditingItem({ ...editingItem, codigo: e.target.value })}
                                        placeholder="OBJ 01"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-slate-400 font-bold block mb-1">Meta</label>
                                    <input
                                        type="text"
                                        value={editingItem.meta}
                                        onChange={e => setEditingItem({ ...editingItem, meta: e.target.value })}
                                        placeholder="100%"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-400 font-bold block mb-1">Nombre / Descripción del Objetivo</label>
                                <textarea
                                    value={editingItem.nombre}
                                    onChange={e => setEditingItem({ ...editingItem, nombre: e.target.value })}
                                    placeholder="Ej: Implementar y mantener el Sistema de Gestión de SST..."
                                    rows={3}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none resize-none focus:border-amber-500"
                                />
                            </div>

                            <div>
                                <label className="text-slate-400 font-bold block mb-1">Indicador / Fórmula de Cálculo</label>
                                <input
                                    type="text"
                                    value={editingItem.indicador}
                                    onChange={e => setEditingItem({ ...editingItem, indicador: e.target.value })}
                                    placeholder="(Actividades Ejecutadas / Programadas) * 100"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-slate-400 font-bold block mb-1">Responsable</label>
                                    <input
                                        type="text"
                                        value={editingItem.responsable}
                                        onChange={e => setEditingItem({ ...editingItem, responsable: e.target.value })}
                                        placeholder="Líder SSOMA"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-400 font-bold block mb-1">Frecuencia</label>
                                    <select
                                        value={editingItem.frecuencia}
                                        onChange={e => setEditingItem({ ...editingItem, frecuencia: e.target.value })}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none cursor-pointer"
                                    >
                                        <option value="Mensual">Mensual</option>
                                        <option value="Bimestral">Bimestral</option>
                                        <option value="Trimestral">Trimestral</option>
                                        <option value="Semestral">Semestral</option>
                                        <option value="Anual">Anual</option>
                                        <option value="Permanente">Permanente</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={() => { setIsModalOpen(false); setEditingItem(null); }}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveItemModal}
                                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
                            >
                                <Save size={14} /> Guardar Objetivo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
