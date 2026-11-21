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
    Calendar,
    Eye
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import Link from 'next/link';

// Objetivos oficiales del Programa Anual para comprobación y coincidencia (F-SIG-023 CASA)
export const PROGRAM_OBJECTIVES = [
    { id: 'obj1', code: 'OBJ 01', label: 'OBJ 01: Participación y SCSST', name: 'Asegurar la consulta, participación e información activa de los trabajadores y sus representantes', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'obj2', code: 'OBJ 02', label: 'OBJ 02: Capacitación y Entrenamiento', name: 'Asegurar la formación, capacitación y entrenamiento de los trabajadores en seguridad', icon: GraduationCap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'obj3', code: 'OBJ 03', label: 'OBJ 03: Inspecciones de Seguridad', name: 'Reducir y corregir la cantidad de condiciones inseguras mediante inspecciones continuas', icon: ClipboardCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'obj4', code: 'OBJ 04', label: 'OBJ 04: Control de Peligros y RAC', name: 'Identificar y evaluar permanentemente los peligros y controlar los riesgos en el origen', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { id: 'obj5', code: 'OBJ 05', label: 'OBJ 05: Vigilancia de Salud y EMO', name: 'Identificar y realizar el seguimiento al personal con enfermedades ocupacionales (Vigilancia de Salud)', icon: Stethoscope, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { id: 'obj6', code: 'OBJ 06', label: 'OBJ 06: Emergencias y Simulacros', name: 'Garantizar la preparación y respuesta oportuna ante emergencias en obra', icon: Siren, color: 'text-teal-400', bg: 'bg-teal-500/10' },
    { id: 'obj7', code: 'OBJ 07', label: 'OBJ 07: Gestión Ambiental y PMA', name: 'Asegurar el cumplimiento ambiental, manejo de residuos sólidos y Plan de Manejo Ambiental (PMA)', icon: Leaf, color: 'text-green-400', bg: 'bg-green-500/10' },
    { id: 'obj8', code: 'OBJ 08', label: 'OBJ 08: Requisitos Legales SSTMA', name: 'Garantizar el cumplimiento y actualización de la matriz de requisitos legales aplicables en SSTMA', icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { id: 'obj9', code: 'OBJ 09', label: 'OBJ 09: Mejora Continua y Auditorías', name: 'Promover y ejecutar acciones de mejora continua derivados de inspecciones, auditorías e incidentes', icon: GraduationCap, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
];

export interface ObjetivoEstrategicoItem {
    id: string;
    codigo?: string;
    objetivo_estrategico: string;
    perspectiva_casa: string;
    responsable: string;
    indicador: string;
    formula: string;
    meta: string;
    frecuencia: string;
    estrategia_acciones: string;
    matchedProgramId?: string; // id de coincidencia con el Programa Anual (ej: obj1, obj2, obj3, etc.)
}

export default function ObjetivosPage() {
    const { user } = useAuth();
    const activeWs = user?.workspace || 'Red Vial 6';
    const isLongitudinal = activeWs.toLowerCase().includes('longitudinal');

    const [objetivos, setObjetivos] = useState<ObjetivoEstrategicoItem[]>([]);
    const [fechaActualizacion, setFechaActualizacion] = useState<string>('16 de enero 2026');
    const [fechaRevision, setFechaRevision] = useState<string>('Mensual');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMatch, setFilterMatch] = useState<'all' | 'matched' | 'unmatched'>('all');
    const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Modal de edición / creación
    const [editingItem, setEditingItem] = useState<ObjetivoEstrategicoItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Matcher inteligente con el Programa Anual
    const matchWithProgram = (objText: string, persText: string, indText: string): string | undefined => {
        const full = `${objText} ${persText} ${indText}`.toLowerCase();

        // 1. SCSST / Comité
        if (full.includes('scsst') || full.includes('comité') || full.includes('comite') || (full.includes('consulta') && full.includes('participación'))) return 'obj1';
        // 2. Capacitación
        if (full.includes('capacita') || full.includes('entrena') || full.includes('formación') || full.includes('plan de capacitación')) return 'obj2';
        // 3. Inspecciones Seguridad
        if ((full.includes('inspeccion') || full.includes('inspecciones')) && (full.includes('condiciones inseguras') || full.includes('seguridad operacional') || full.includes('equipos pesados'))) return 'obj3';
        // 4. Reporte A/C / Peligros y Riesgos (TOP)
        if (full.includes('peligros y') || full.includes('controlar los riesgos') || full.includes('iperc') || full.includes('ats') || full.includes('actos y condiciones')) return 'obj4';
        // 5. EMO / Vigilancia de Salud
        if (full.includes('enfermedades ocupacionales') || full.includes('vigilancia de salud') || full.includes('vigilancia de la salud') || full.includes('emo') || full.includes('médico')) return 'obj5';
        // 6. Emergencias y Simulacros
        if (full.includes('emergencia') || full.includes('simulacro') || full.includes('brigada') || full.includes('rescate')) return 'obj6';
        // 7. Medio Ambiente / PMA
        if (full.includes('ambiental') || full.includes('ambiente') || full.includes('residuos') || full.includes('pma')) return 'obj7';
        // 8. Requisitos Legales
        if (full.includes('requisitos legales') || full.includes('matriz legal')) return 'obj8';
        // 9. Mejora continua
        if (full.includes('mejora continua') || full.includes('acciones correctivas') || full.includes('auditoría') || full.includes('auditoria')) return 'obj9';

        return undefined;
    };

    // Cargar objetivos desde la BD o precargar oficiales de CASA
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/objetivos?workspace=${encodeURIComponent(activeWs)}`);
                const data = await res.json();
                if (data.success && Array.isArray(data.objetivos) && data.objetivos.length > 0) {
                    setObjetivos(data.objetivos);
                    if (data.fecha_actualizacion) setFechaActualizacion(data.fecha_actualizacion);
                    if (data.fecha_revision) setFechaRevision(data.fecha_revision);
                }
            } catch (err) {
                console.error("Error al cargar objetivos:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [activeWs]);

    // Procesar archivo Excel subido con el formato exacto CASA
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
                const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

                if (!rawRows || rawRows.length < 2) {
                    setFeedbackMsg({ type: 'error', text: 'El archivo Excel no contiene suficientes datos.' });
                    return;
                }

                // Extraer metadatos de cabecera si existen (Fecha de actualización / revisión)
                let extractedFechaAct = fechaActualizacion;
                let extractedFechaRev = fechaRevision;

                for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
                    const rowText = (rawRows[i] || []).map((c: any) => String(c).toLowerCase()).join(' ');
                    if (rowText.includes('actualización') || rowText.includes('actualizacion')) {
                        const val = rawRows[i].find((cell: any) => String(cell).toLowerCase().includes('202') || String(cell).length > 6);
                        if (val) extractedFechaAct = String(val).trim();
                    }
                    if (rowText.includes('revisión') || rowText.includes('revision')) {
                        const val = rawRows[i].find((cell: any) => String(cell).toLowerCase().includes('mensual') || String(cell).toLowerCase().includes('trimestral'));
                        if (val) extractedFechaRev = String(val).trim();
                    }
                }

                // Buscar la fila de encabezados de las 8 columnas
                let headerRowIdx = -1;
                for (let i = 0; i < Math.min(rawRows.length, 12); i++) {
                    const rowText = (rawRows[i] || []).map((c: any) => String(c).toLowerCase()).join(' ');
                    if (rowText.includes('objetivo') && (rowText.includes('perspectiva') || rowText.includes('responsable') || rowText.includes('indicador') || rowText.includes('meta'))) {
                        headerRowIdx = i;
                        break;
                    }
                }

                if (headerRowIdx === -1) {
                    headerRowIdx = 0; // fallback
                }

                const headers: string[] = (rawRows[headerRowIdx] || []).map((h: any) => String(h || '').trim().toLowerCase());

                // Mapear índices de las 8 columnas oficiales
                const colObj = headers.findIndex(h => h.includes('objetivo'));
                const colPers = headers.findIndex(h => h.includes('perspectiva') || h.includes('casa'));
                const colResp = headers.findIndex(h => h.includes('responsable'));
                const colInd = headers.findIndex(h => h.includes('indicador'));
                const colForm = headers.findIndex(h => h.includes('fórmula') || h.includes('formula'));
                const colMeta = headers.findIndex(h => h.includes('meta'));
                const colFrec = headers.findIndex(h => h.includes('frecuencia') || h.includes('periodicidad'));
                const colEst = headers.findIndex(h => h.includes('estrategia') || h.includes('acciones'));

                const parsedList: ObjetivoEstrategicoItem[] = [];

                for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
                    const row = rawRows[r];
                    if (!row || row.length === 0) continue;

                    const objVal = colObj !== -1 ? String(row[colObj] || '').trim() : String(row[0] || '').trim();
                    if (!objVal || objVal.toLowerCase().includes('fecha de') || objVal.length < 5) continue;

                    const persVal = colPers !== -1 ? String(row[colPers] || '').trim() : '';
                    const respVal = colResp !== -1 ? String(row[colResp] || '').trim() : 'Jefe de SSOMA';
                    const indVal = colInd !== -1 ? String(row[colInd] || '').trim() : 'Cumplimiento de objetivos';
                    const formVal = colForm !== -1 ? String(row[colForm] || '').trim() : '% = (Ejecutado / Programado) * 100';
                    const metaVal = colMeta !== -1 ? String(row[colMeta] || '').trim() : '100%';
                    const frecVal = colFrec !== -1 ? String(row[colFrec] || '').trim() : 'Mensual';
                    const estVal = colEst !== -1 ? String(row[colEst] || '').trim() : '';

                    const matchedId = matchWithProgram(objVal, persVal, indVal);

                    parsedList.push({
                        id: `casa_obj_${Date.now()}_${r}`,
                        codigo: `OBJ ${parsedList.length + 1}`,
                        objetivo_estrategico: objVal,
                        perspectiva_casa: persVal,
                        responsable: respVal,
                        indicador: indVal,
                        formula: formVal,
                        meta: metaVal,
                        frecuencia: frecVal,
                        estrategia_acciones: estVal,
                        matchedProgramId: matchedId
                    });
                }

                if (parsedList.length === 0) {
                    setFeedbackMsg({ type: 'error', text: 'No se encontraron objetivos estratégicos válidos en el archivo.' });
                    return;
                }

                setObjetivos(parsedList);
                setFechaActualizacion(extractedFechaAct);
                setFechaRevision(extractedFechaRev);
                saveToDb(parsedList, extractedFechaAct, extractedFechaRev);
                setFeedbackMsg({ type: 'success', text: `¡Se cargaron exitosamente ${parsedList.length} objetivos estratégicos desde el Excel de CASA!` });
            } catch (err: any) {
                console.error("Error al procesar Excel:", err);
                setFeedbackMsg({ type: 'error', text: 'Error al interpretar el Excel: ' + (err.message || 'Formato inválido') });
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    // Guardar en la base de datos
    const saveToDb = async (list: ObjetivoEstrategicoItem[], fAct = fechaActualizacion, fRev = fechaRevision) => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/objetivos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workspace: activeWs,
                    objetivos: list,
                    fecha_actualizacion: fAct,
                    fecha_revision: fRev
                })
            });
            const data = await res.json();
            if (data.success) {
                setFeedbackMsg({ type: 'success', text: 'Objetivos estratégicos guardados y sincronizados correctamente.' });
            }
        } catch (err) {
            console.error("Error al guardar en BD:", err);
        } finally {
            setIsSaving(false);
        }
    };

    // Descargar plantilla Excel oficial CASA
    const handleDownloadTemplate = () => {
        // Filas de metadatos superiores
        const metaRows = [
            ["CASA", "OBJETIVOS ESTRATÉGICOS"],
            [],
            ["Fecha de actualización:", fechaActualizacion],
            ["Fecha de revisión:", fechaRevision],
            []
        ];

        // Encabezados de las 8 columnas oficiales
        const headerRow = [
            "OBJETIVO ESTRATÉGICO",
            "PERSPECTIVA CASA",
            "RESPONSABLE",
            "INDICADOR DEL OBJETIVO",
            "FÓRMULA",
            "META",
            "FRECUENCIA",
            "ESTRATEGIA DE ACCIONES ASOCIADAS AL OBJETIVO"
        ];

        const dataRows = objetivos.map(o => [
            o.objetivo_estrategico,
            o.perspectiva_casa,
            o.responsable,
            o.indicador,
            o.formula,
            o.meta,
            o.frecuencia,
            o.estrategia_acciones
        ]);

        const allSheetData = [...metaRows, headerRow, ...dataRows];
        const ws = XLSX.utils.aoa_to_sheet(allSheetData);

        // Anchos de columna cómodos para Excel
        ws['!cols'] = [
            { wch: 45 },
            { wch: 55 },
            { wch: 25 },
            { wch: 35 },
            { wch: 45 },
            { wch: 12 },
            { wch: 15 },
            { wch: 55 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Objetivos Estratégicos");
        XLSX.writeFile(wb, `Objetivos_Estrategicos_CASA_${activeWs.replace(/\s+/g, '_')}.xlsx`);
    };

    // Filtrado de objetivos
    const filteredObjetivos = useMemo(() => {
        return objetivos.filter(obj => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = 
                obj.objetivo_estrategico.toLowerCase().includes(term) ||
                obj.perspectiva_casa.toLowerCase().includes(term) ||
                obj.indicador.toLowerCase().includes(term) ||
                obj.responsable.toLowerCase().includes(term) ||
                obj.estrategia_acciones.toLowerCase().includes(term);

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

    // Eliminar fila
    const handleDelete = (id: string) => {
        if (!confirm('¿Eliminar este objetivo estratégico de la lista?')) return;
        const updated = objetivos.filter(o => o.id !== id);
        setObjetivos(updated);
        saveToDb(updated);
    };

    // Guardar edición o nuevo
    const handleSaveItemModal = () => {
        if (!editingItem || !editingItem.objetivo_estrategico.trim()) return;

        const matchedId = matchWithProgram(editingItem.objetivo_estrategico, editingItem.perspectiva_casa, editingItem.indicador);
        const finalized = { ...editingItem, matchedProgramId: matchedId };

        let updated: ObjetivoEstrategicoItem[];
        const exists = objetivos.some(o => o.id === finalized.id);
        if (exists) {
            updated = objetivos.map(o => o.id === finalized.id ? finalized : o);
        } else {
            updated = [...objetivos, finalized];
        }

        setObjetivos(updated);
        saveToDb(updated);
        setIsModalOpen(false);
        setEditingItem(null);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
            <div className="max-w-[96rem] mx-auto space-y-8">

                {/* Banner / Header Oficial CASA */}
                <div className={`bg-slate-900 border ${isLongitudinal ? 'border-teal-800/60' : 'border-slate-800'} p-6 sm:p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl`}>
                    <div className={`absolute top-0 right-0 w-full md:w-96 h-96 ${isLongitudinal ? 'bg-emerald-500/10' : 'bg-orange-500/10'} blur-[100px] -mr-32 -mt-32 rounded-full`}></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                                    🏢 CASA
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${isLongitudinal ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-orange-500/20 text-orange-400 border-orange-500/40'}`}>
                                    {activeWs}
                                </span>
                                <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full border border-slate-700">
                                    Año 2026
                                </span>
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                                <Target size={36} className={isLongitudinal ? "text-emerald-400" : "text-orange-500"} />
                                OBJETIVOS ESTRATÉGICOS
                            </h1>
                            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-3xl font-medium">
                                Matriz corporativa de objetivos estratégicos, perspectiva legal CASA, responsables, fórmulas e indicadores sincronizados con el Programa Anual SSOMA.
                            </p>

                            {/* Fechas de Cabecera Oficial CASA */}
                            <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                                <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                                    <span className="text-slate-400 font-bold">Fecha de actualización:</span>
                                    <input
                                        type="text"
                                        value={fechaActualizacion}
                                        onChange={(e) => setFechaActualizacion(e.target.value)}
                                        onBlur={() => saveToDb(objetivos, fechaActualizacion, fechaRevision)}
                                        className="bg-transparent text-white font-bold outline-none cursor-pointer hover:text-amber-400 transition-colors"
                                        title="Haz clic para editar la fecha de actualización"
                                    />
                                </div>
                                <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                                    <span className="text-slate-400 font-bold">Fecha de revisión:</span>
                                    <input
                                        type="text"
                                        value={fechaRevision}
                                        onChange={(e) => setFechaRevision(e.target.value)}
                                        onBlur={() => saveToDb(objetivos, fechaActualizacion, fechaRevision)}
                                        className="bg-transparent text-white font-bold outline-none cursor-pointer hover:text-amber-400 transition-colors"
                                        title="Haz clic para editar la periodicidad de revisión"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            <label className={`cursor-pointer px-4 py-3 rounded-2xl font-black text-xs transition-all flex items-center gap-2 shadow-xl ${isLongitudinal ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 shadow-emerald-500/20' : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 shadow-orange-500/20'}`}>
                                <Upload size={16} /> Cargar Excel de Objetivos
                                <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                            </label>

                            <button
                                type="button"
                                onClick={handleDownloadTemplate}
                                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-2xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 shadow-md"
                                title="Exportar la matriz actual a archivo Excel oficial"
                            >
                                <Download size={16} /> Descargar Formato Excel
                            </button>

                            <Link
                                href="/program"
                                className="px-4 py-3 bg-slate-800/90 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 rounded-2xl text-xs font-bold transition-all border border-emerald-500/30 flex items-center gap-2 shadow-md"
                            >
                                <ExternalLink size={16} /> Ir al Programa Anual
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Notificaciones */}
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

                {/* Panel de Validación de Coincidencia con el Programa Anual */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
                        <div>
                            <h3 className="text-base font-black text-white flex items-center gap-2">
                                <CheckCircle2 size={20} className="text-emerald-400" />
                                Coincidencia con los Objetivos del Programa Anual ({matchedCount} Coincidentes)
                            </h3>
                            <p className="text-slate-400 text-xs">
                                Los objetivos estratégicos de CASA se vinculan directamente a los códigos y actividades del Programa Anual SSOMA:
                            </p>
                        </div>
                        <span className="text-xs bg-slate-950 text-slate-300 font-mono font-bold px-3 py-1 rounded-full border border-slate-800">
                            {totalCount} Objetivos Registrados
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                        {PROGRAM_OBJECTIVES.map(prog => {
                            const isMatched = objetivos.some(o => o.matchedProgramId === prog.id);
                            const IconComponent = prog.icon;
                            return (
                                <Link
                                    key={prog.id}
                                    href={`/program?obj=${prog.id}`}
                                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all hover:scale-[1.02] ${isMatched ? 'bg-emerald-950/30 border-emerald-500/40 text-white' : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60 hover:opacity-100'}`}
                                    title={`Ver en Programa Anual: ${prog.label}`}
                                >
                                    <div className={`p-1 rounded-md ${prog.bg} ${prog.color}`}>
                                        <IconComponent size={14} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-black truncate">{prog.code}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{prog.name}</p>
                                    </div>
                                    {isMatched ? (
                                        <Check size={14} className="text-emerald-400 shrink-0" />
                                    ) : (
                                        <span className="text-[9px] text-slate-600 shrink-0">Pendiente</span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Tabla de Matriz Oficial CASA (8 Columnas) */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                <Target size={22} className={isLongitudinal ? 'text-emerald-400' : 'text-orange-500'} />
                                Matriz Oficial de Objetivos Estratégicos ({filteredObjetivos.length})
                            </h3>
                            <p className="text-slate-400 text-xs mt-0.5">
                                Formato reglamentario CASA con 8 campos de gestión de SST y Medio Ambiente.
                            </p>
                        </div>

                        {/* Barra de Búsqueda y Filtros */}
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar en objetivos o perspectiva..."
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-orange-500"
                                />
                            </div>

                            <select
                                value={filterMatch}
                                onChange={(e: any) => setFilterMatch(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                            >
                                <option value="all">Todos ({totalCount})</option>
                                <option value="matched">Coinciden con Programa ({matchedCount})</option>
                                <option value="unmatched">Específicos ({unmatchedCount})</option>
                            </select>

                            <button
                                type="button"
                                onClick={() => {
                                    setEditingItem({
                                        id: `casa_obj_${Date.now()}`,
                                        codigo: `OBJ ${objetivos.length + 1}`,
                                        objetivo_estrategico: '',
                                        perspectiva_casa: '',
                                        responsable: 'Jefe de SSOMA',
                                        indicador: '',
                                        formula: '% = (Ejecutado / Programado) * 100',
                                        meta: '100%',
                                        frecuencia: 'Mensual',
                                        estrategia_acciones: ''
                                    });
                                    setIsModalOpen(true);
                                }}
                                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                            >
                                <Plus size={14} /> Nuevo
                            </button>
                        </div>
                    </div>

                    {/* Tabla de 8 Columnas Oficial CASA */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b-2 border-slate-700 bg-slate-950/80 text-[10px] font-black uppercase tracking-wider text-slate-300">
                                    <th className="py-3.5 px-3 min-w-[220px]">OBJETIVO ESTRATÉGICO</th>
                                    <th className="py-3.5 px-3 min-w-[260px]">PERSPECTIVA CASA</th>
                                    <th className="py-3.5 px-3 min-w-[140px]">RESPONSABLE</th>
                                    <th className="py-3.5 px-3 min-w-[180px]">INDICADOR DEL OBJETIVO</th>
                                    <th className="py-3.5 px-3 min-w-[190px]">FÓRMULA</th>
                                    <th className="py-3.5 px-3 text-center min-w-[90px]">META</th>
                                    <th className="py-3.5 px-3 text-center min-w-[100px]">FRECUENCIA</th>
                                    <th className="py-3.5 px-3 min-w-[260px]">ESTRATEGIA DE ACCIONES ASOCIADAS AL OBJETIVO</th>
                                    <th className="py-3.5 px-3 text-right min-w-[80px]">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredObjetivos.map((item, idx) => {
                                    const progMatch = PROGRAM_OBJECTIVES.find(p => p.id === item.matchedProgramId);
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-800/40 transition-colors group align-top">
                                            {/* 1. OBJETIVO ESTRATÉGICO */}
                                            <td className="py-3 px-3">
                                                <div className="space-y-1.5">
                                                    <span className="font-bold text-white text-xs block leading-snug">
                                                        {item.objetivo_estrategico}
                                                    </span>
                                                    {progMatch ? (
                                                        <Link 
                                                            href={`/program?obj=${progMatch.id}`}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                                                            title="Ver en el Programa Anual"
                                                        >
                                                            <CheckCircle2 size={11} /> {progMatch.label}
                                                        </Link>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                                            Objetivo Específico
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* 2. PERSPECTIVA CASA */}
                                            <td className="py-3 px-3 text-slate-300 text-[11px] leading-relaxed">
                                                {item.perspectiva_casa}
                                            </td>

                                            {/* 3. RESPONSABLE */}
                                            <td className="py-3 px-3 font-semibold text-slate-300 text-[11px]">
                                                {item.responsable}
                                            </td>

                                            {/* 4. INDICADOR DEL OBJETIVO */}
                                            <td className="py-3 px-3 font-medium text-slate-200 text-[11px]">
                                                {item.indicador}
                                            </td>

                                            {/* 5. FÓRMULA */}
                                            <td className="py-3 px-3 font-mono text-slate-300 text-[10px] bg-slate-950/30 rounded p-1.5 leading-snug">
                                                {item.formula}
                                            </td>

                                            {/* 6. META */}
                                            <td className="py-3 px-3 text-center">
                                                <span className={`inline-block px-2.5 py-1 rounded-full font-black text-xs border ${item.meta.includes('100') ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}>
                                                    {item.meta}
                                                </span>
                                            </td>

                                            {/* 7. FRECUENCIA */}
                                            <td className="py-3 px-3 text-center">
                                                <span className="bg-slate-950 px-2 py-0.5 rounded text-[11px] text-slate-300 font-bold border border-slate-800 capitalize">
                                                    {item.frecuencia}
                                                </span>
                                            </td>

                                            {/* 8. ESTRATEGIA DE ACCIONES */}
                                            <td className="py-3 px-3 text-slate-300 text-[11px] leading-relaxed">
                                                {item.estrategia_acciones}
                                            </td>

                                            {/* ACCIONES */}
                                            <td className="py-3 px-3 text-right">
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
                                                        <Edit2 size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Modal para Editar o Crear Objetivo */}
            {isModalOpen && editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 relative shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => { setIsModalOpen(false); setEditingItem(null); }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                            <Target size={24} className="text-orange-500" />
                            <div>
                                <h3 className="text-base font-black text-white">
                                    {objetivos.some(o => o.id === editingItem.id) ? 'Editar Objetivo Estratégico (CASA)' : 'Nuevo Objetivo Estratégico (CASA)'}
                                </h3>
                                <p className="text-xs text-slate-400">{activeWs}</p>
                            </div>
                        </div>

                        <div className="space-y-3.5 text-xs">
                            {/* Objetivo Estratégico */}
                            <div>
                                <label className="text-slate-400 font-bold block mb-1">1. Objetivo Estratégico</label>
                                <textarea
                                    value={editingItem.objetivo_estrategico}
                                    onChange={e => setEditingItem({ ...editingItem, objetivo_estrategico: e.target.value })}
                                    placeholder="Ej: Asegurar la consulta, participación e información activa de los trabajadores..."
                                    rows={2}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none resize-none focus:border-orange-500"
                                />
                            </div>

                            {/* Perspectiva CASA */}
                            <div>
                                <label className="text-slate-400 font-bold block mb-1">2. Perspectiva CASA (Normativa / Base Legal)</label>
                                <textarea
                                    value={editingItem.perspectiva_casa}
                                    onChange={e => setEditingItem({ ...editingItem, perspectiva_casa: e.target.value })}
                                    placeholder="Ej: Dar cumplimiento al Art. 19 de la Ley 29783 y Art. 34 del D.S. 011-2019-TR..."
                                    rows={2}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none resize-none focus:border-orange-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-slate-400 font-bold block mb-1">3. Responsable</label>
                                    <input
                                        type="text"
                                        value={editingItem.responsable}
                                        onChange={e => setEditingItem({ ...editingItem, responsable: e.target.value })}
                                        placeholder="Ej: Jefe de SSOMA / SCSST"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-400 font-bold block mb-1">4. Indicador del Objetivo</label>
                                    <input
                                        type="text"
                                        value={editingItem.indicador}
                                        onChange={e => setEditingItem({ ...editingItem, indicador: e.target.value })}
                                        placeholder="Ej: Cumplimiento de acuerdos del SCSST"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-400 font-bold block mb-1">5. Fórmula de Cálculo</label>
                                <input
                                    type="text"
                                    value={editingItem.formula}
                                    onChange={e => setEditingItem({ ...editingItem, formula: e.target.value })}
                                    placeholder="Ej: % Acu. = (N° Acuerdos realizados / N° Acuerdos programados) * 100"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-orange-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-slate-400 font-bold block mb-1">6. Meta</label>
                                    <input
                                        type="text"
                                        value={editingItem.meta}
                                        onChange={e => setEditingItem({ ...editingItem, meta: e.target.value })}
                                        placeholder="≥ 90% o 100%"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold outline-none focus:border-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-slate-400 font-bold block mb-1">7. Frecuencia</label>
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
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-slate-400 font-bold block mb-1">8. Estrategia de Acciones Asociadas al Objetivo</label>
                                <textarea
                                    value={editingItem.estrategia_acciones}
                                    onChange={e => setEditingItem({ ...editingItem, estrategia_acciones: e.target.value })}
                                    placeholder="Ej: Seguimiento y cierre mensual de acuerdos asentados en el libro de actas..."
                                    rows={2}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none resize-none focus:border-orange-500"
                                />
                            </div>
                        </div>

                        <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
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
