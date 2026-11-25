"use client";

import React, { useState, useRef } from 'react';
import {
    ClipboardCheck,
    Upload,
    Download,
    Save,
    CheckCircle2,
    AlertCircle,
    Search,
    Shield,
    Leaf,
    Stethoscope,
    Users2,
    BarChart3,
    Layers,
    FileSpreadsheet,
    Eye
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
    InspectionSubprogram,
    InspectionSubprogramItem,
    DEFAULT_SUBPROGRAM_INSPECCIONES_SEGURIDAD,
    DEFAULT_SUBPROGRAM_INSPECCIONES_MA,
    DEFAULT_SUBPROGRAM_INSPECCIONES_SALUD,
    DEFAULT_SUBPROGRAM_INSPECCIONES_SCSST,
    matchInspectionRecordsForTopic,
    matchScsstInspectionRecords,
    parseInspectionExcelFile,
    generateInspectionExcelWorkbook
} from '@/lib/inspectionsSubprogramsData';

interface Props {
    subprograms: Record<string, InspectionSubprogram>;
    inspectionRecords?: any[];
    evidenceRecords?: any[];
    onUpdateSubprograms: (updated: Record<string, InspectionSubprogram>) => void;
    onSaveToCloud: (data: Record<string, InspectionSubprogram>) => Promise<void>;
    isSaving?: boolean;
    onSelectRecords?: (activity: string, month: string, records: any[]) => void;
}

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'];
const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function InspectionsSubprogramsSection({
    subprograms,
    inspectionRecords = [],
    evidenceRecords = [],
    onUpdateSubprograms,
    onSaveToCloud,
    isSaving = false,
    onSelectRecords
}: Props) {
    const [activeTab, setActiveTab] = useState<'seguridad' | 'ma' | 'salud' | 'scsst' | 'resumen'>('seguridad');
    const [searchTerm, setSearchTerm] = useState('');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const progSeguridad = subprograms?.subprog_insp_seguridad || DEFAULT_SUBPROGRAM_INSPECCIONES_SEGURIDAD;
    const progMA = subprograms?.subprog_insp_ma || DEFAULT_SUBPROGRAM_INSPECCIONES_MA;
    const progSalud = subprograms?.subprog_insp_salud || DEFAULT_SUBPROGRAM_INSPECCIONES_SALUD;
    const progSCSST = subprograms?.subprog_insp_scsst || DEFAULT_SUBPROGRAM_INSPECCIONES_SCSST;

    // Helper para obtener datos de ejecución en vivo buscando en registros de inspecciones de campo o Control SCSST
    const getItemExecutionData = (it: InspectionSubprogramItem, mIdx: number, subprogKey: string = 'subprog_insp_seguridad') => {
        const pVal = (it.programmed && it.programmed[mIdx]) || 0;
        // Regla oficial: Si no está programado, no mostrar ejecutados para no alterar porcentajes
        if (pVal === 0) {
            return { count: 0, matched: [], hasLiveRecords: false };
        }

        let matched: any[] = [];
        if (subprogKey === 'subprog_insp_scsst') {
            // Vincular estrictamente con las inspecciones registradas en Control SCSST (evidenceRecords)
            matched = matchScsstInspectionRecords(mIdx, evidenceRecords);
        } else {
            matched = matchInspectionRecordsForTopic(it.title, it.formCode, mIdx, inspectionRecords);
        }

        const hasLiveRecords = matched.length > 0;
        const manualExec = (it.executed && it.executed[mIdx]) || 0;
        const count = hasLiveRecords ? matched.length : manualExec;
        return { count, matched, hasLiveRecords };
    };

    // Modificar celda (P o E) de un ítem en un subprograma
    const handleCellToggle = (
        subprogKey: 'subprog_insp_seguridad' | 'subprog_insp_ma' | 'subprog_insp_salud' | 'subprog_insp_scsst',
        itemIdx: number,
        monthIdx: number,
        type: 'P' | 'E'
    ) => {
        let targetProg: InspectionSubprogram;
        if (subprogKey === 'subprog_insp_ma') targetProg = progMA;
        else if (subprogKey === 'subprog_insp_salud') targetProg = progSalud;
        else if (subprogKey === 'subprog_insp_scsst') targetProg = progSCSST;
        else targetProg = progSeguridad;

        const updatedItems = [...(targetProg.items || [])];
        const it = { ...updatedItems[itemIdx] };
        const progArray = [...(it.programmed || new Array(12).fill(0))];
        const execArray = [...(it.executed || new Array(12).fill(0))];

        if (type === 'P') {
            const current = progArray[monthIdx] || 0;
            progArray[monthIdx] = current > 0 ? 0 : 1;
            it.programmed = progArray;
        } else {
            const current = execArray[monthIdx] || 0;
            const pVal = progArray[monthIdx] || 0;
            execArray[monthIdx] = current > 0 ? 0 : (pVal > 0 ? pVal : 1);
            it.executed = execArray;
        }

        updatedItems[itemIdx] = it;
        const updatedSubprograms = {
            ...subprograms,
            [subprogKey]: {
                ...targetProg,
                items: updatedItems
            }
        };

        onUpdateSubprograms(updatedSubprograms);
        setHasUnsavedChanges(true);
    };

    // Totales mensuales dinámicos por subprograma
    const getSubprogramMonthlyTotals = (prog?: InspectionSubprogram, subprogKey: string = 'subprog_insp_seguridad') => {
        const totalsP = new Array(12).fill(0);
        const totalsE = new Array(12).fill(0);
        if (!prog?.items) return { totalsP, totalsE, sumP: 0, sumE: 0 };

        (prog.items || []).forEach(it => {
            for (let m = 0; m < 12; m++) {
                totalsP[m] += (it.programmed && it.programmed[m]) || 0;
                const { count } = getItemExecutionData(it, m, subprogKey);
                totalsE[m] += count;
            }
        });

        const sumP = totalsP.reduce((a, b) => a + (Number(b) || 0), 0);
        const sumE = totalsE.reduce((a, b) => a + (Number(b) || 0), 0);

        return { totalsP, totalsE, sumP, sumE };
    };

    const totalsSeg = getSubprogramMonthlyTotals(progSeguridad, 'subprog_insp_seguridad');
    const totalsMA = getSubprogramMonthlyTotals(progMA, 'subprog_insp_ma');
    const totalsSalud = getSubprogramMonthlyTotals(progSalud, 'subprog_insp_salud');
    const totalsSCSST = getSubprogramMonthlyTotals(progSCSST, 'subprog_insp_scsst');

    // Totales combinados (alimentan la fila macro del Objetivo 3)
    const combinedTotalsP = totalsSeg.totalsP.map((val, i) => val + totalsMA.totalsP[i] + totalsSalud.totalsP[i] + totalsSCSST.totalsP[i]);
    const combinedTotalsE = totalsSeg.totalsE.map((val, i) => val + totalsMA.totalsE[i] + totalsSalud.totalsE[i] + totalsSCSST.totalsE[i]);
    const combinedSumP = totalsSeg.sumP + totalsMA.sumP + totalsSalud.sumP + totalsSCSST.sumP;
    const combinedSumE = totalsSeg.sumE + totalsMA.sumE + totalsSalud.sumE + totalsSCSST.sumE;

    const handleSave = async () => {
        await onSaveToCloud(subprograms);
        setHasUnsavedChanges(false);
    };

    // Manejador de Carga de Excel (F-SIG-067)
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const buffer = await file.arrayBuffer();
            const parsed = parseInspectionExcelFile(buffer);

            if (parsed.totalItems === 0) {
                alert('⚠️ No se encontraron tablas de inspección válidas en el archivo Excel. Asegúrese de subir el formato F-SIG-067 oficial.');
                return;
            }

            const updated: Record<string, InspectionSubprogram> = { ...subprograms };
            if (parsed.seguridad) updated.subprog_insp_seguridad = parsed.seguridad;
            if (parsed.medioAmbiente) updated.subprog_insp_ma = parsed.medioAmbiente;
            if (parsed.salud) updated.subprog_insp_salud = parsed.salud;
            if (parsed.scsst) updated.subprog_insp_scsst = parsed.scsst;

            onUpdateSubprograms(updated);
            await onSaveToCloud(updated);
            setHasUnsavedChanges(false);

            alert(`✅ ¡Programa Anual de Inspecciones Operacionales (F-SIG-067) actualizado con éxito!\nSe cargaron ${parsed.totalItems} inspecciones.`);
        } catch (err: any) {
            console.error('Error al procesar Excel:', err);
            alert('❌ Error al procesar archivo Excel: ' + (err.message || 'Formato no compatible'));
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDownloadTemplate = () => {
        const wb = generateInspectionExcelWorkbook(subprograms, inspectionRecords, evidenceRecords);
        XLSX.writeFile(wb, 'F-SIG-067_Programa_Anual_Inspecciones_SSOMA_2026.xlsx');
    };

    const renderTableForSubprogram = (
        prog: InspectionSubprogram,
        subprogKey: 'subprog_insp_seguridad' | 'subprog_insp_ma' | 'subprog_insp_salud' | 'subprog_insp_scsst',
        themeColor: string
    ) => {
        const filtered = (prog.items || []).filter(it =>
            (it.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (it.formCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (it.responsable || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        const totals = getSubprogramMonthlyTotals(prog, subprogKey);

        return (
            <div className="space-y-4">
                {/* Meta Cabecera */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div>
                        <span className="text-slate-400">Código Oficial:</span> <strong className="text-slate-200">{prog.code || 'F-SIG-067'}</strong>
                        <span className="mx-2 text-slate-600">|</span>
                        <span className="text-slate-400">Versión:</span> <strong className="text-slate-200">{prog.version || '01'}</strong>
                        <span className="mx-2 text-slate-600">|</span>
                        <span className="text-slate-400">Responsable:</span> <strong className="text-slate-200">{prog.areaName}</strong>
                        {subprogKey === 'subprog_insp_scsst' && (
                            <>
                                <span className="mx-2 text-slate-600">|</span>
                                <span className="px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 font-semibold border border-amber-700/50">
                                    Alimentado de Control SCSST
                                </span>
                            </>
                        )}
                    </div>
                    <div>
                        <span className="text-slate-400">Sede:</span> <span className="text-emerald-400 font-semibold">{prog.sede}</span>
                    </div>
                </div>

                {/* Tabla de Inspecciones */}
                <div className="overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900/90 shadow-2xl">
                    <table className="w-full text-xs text-left border-collapse min-w-[1250px]">
                        <thead>
                            <tr className="bg-slate-800/90 text-slate-300 font-semibold uppercase tracking-wider border-b border-slate-700">
                                <th rowSpan={2} className="py-3 px-2 text-center w-12 border-r border-slate-700/60">#</th>
                                <th rowSpan={2} className="py-3 px-3 min-w-[240px] border-r border-slate-700/60">Inspección Operacional</th>
                                <th rowSpan={2} className="py-3 px-3 min-w-[190px] border-r border-slate-700/60">Código / Formato de Registro</th>
                                <th rowSpan={2} className="py-3 px-2 w-28 text-center border-r border-slate-700/60">Responsable</th>
                                {MONTHS.map(m => (
                                    <th key={m} colSpan={2} className="py-2 px-1 text-center border-r border-slate-700/60 text-slate-200 font-bold bg-slate-800/40">
                                        {m}
                                    </th>
                                ))}
                                <th colSpan={3} className="py-2 px-2 text-center bg-slate-800/80 font-bold">TOTAL ANUAL</th>
                            </tr>
                            <tr className="bg-slate-800/60 text-[10px] text-slate-400 font-medium border-b border-slate-700">
                                {MONTHS.map((m, idx) => (
                                    <React.Fragment key={idx}>
                                        <th className="py-1 px-1 text-center w-7 border-r border-slate-700/40 text-blue-400 font-bold">P</th>
                                        <th className="py-1 px-1 text-center w-7 border-r border-slate-700/60 text-emerald-400 font-bold">E</th>
                                    </React.Fragment>
                                ))}
                                <th className="py-1 px-1 text-center w-10 text-blue-300 font-bold border-r border-slate-700/40">P</th>
                                <th className="py-1 px-1 text-center w-10 text-emerald-300 font-bold border-r border-slate-700/40">E</th>
                                <th className="py-1 px-1 text-center w-12 text-amber-300 font-bold">%</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {filtered.map((it, idx) => {
                                const realIdx = (prog.items || []).findIndex(x => x.item === it.item);
                                const programmedList = Array.isArray(it.programmed) ? it.programmed : [];
                                const executedList = Array.isArray(it.executed) ? it.executed : [];
                                const totP = programmedList.reduce((a, b) => a + (Number(b) || 0), 0);

                                let totE = 0;
                                for (let m = 0; m < 12; m++) {
                                    const { count } = getItemExecutionData(it, m, subprogKey);
                                    totE += count;
                                }

                                const pct = totP > 0 ? Math.min(100, Math.round((totE / totP) * 100)) : 0;

                                return (
                                    <tr key={it.item} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="py-2.5 px-2 text-center font-bold text-slate-400 border-r border-slate-800">{it.item}</td>
                                        <td className="py-2.5 px-3 font-medium text-slate-200 border-r border-slate-800">
                                            {it.title}
                                        </td>
                                        <td className="py-2.5 px-3 text-[11px] text-slate-400 border-r border-slate-800 font-mono">
                                            {it.formCode || '-'}
                                        </td>
                                        <td className="py-2.5 px-2 text-center text-slate-400 text-[11px] border-r border-slate-800">
                                            {it.responsable || '-'}
                                        </td>

                                        {/* Meses P y E */}
                                        {MONTHS.map((_, mIdx) => {
                                            const pVal = programmedList[mIdx] || 0;
                                            const { count, matched, hasLiveRecords } = getItemExecutionData(it, mIdx, subprogKey);
                                            const isDone = pVal > 0 && count >= pVal;
                                            const isPartial = pVal > 0 && count > 0 && count < pVal;

                                            return (
                                                <React.Fragment key={mIdx}>
                                                    {/* P (Programado) */}
                                                    <td
                                                        onClick={() => handleCellToggle(subprogKey, realIdx, mIdx, 'P')}
                                                        className={`py-2 px-1 text-center font-semibold cursor-pointer border-r border-slate-800/40 select-none transition-all ${
                                                            pVal > 0
                                                                ? 'bg-blue-950/40 text-blue-400 hover:bg-blue-900/60 font-bold'
                                                                : 'text-slate-600 hover:bg-slate-800/40'
                                                        }`}
                                                        title={`Click para editar programado: ${MONTH_NAMES[mIdx]}`}
                                                    >
                                                        {pVal > 0 ? pVal : '-'}
                                                    </td>

                                                    {/* E (Ejecutado) */}
                                                    <td
                                                        onClick={() => {
                                                            if (hasLiveRecords && onSelectRecords) {
                                                                onSelectRecords(it.title, MONTH_NAMES[mIdx], matched);
                                                            } else {
                                                                handleCellToggle(subprogKey, realIdx, mIdx, 'E');
                                                            }
                                                        }}
                                                        className={`py-2 px-1 text-center font-bold cursor-pointer border-r border-slate-800/60 select-none transition-all ${
                                                            isDone
                                                                ? 'bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/70'
                                                                : isPartial
                                                                ? 'bg-amber-950/60 text-amber-400 hover:bg-amber-900/70'
                                                                : count > 0
                                                                ? 'bg-emerald-950/40 text-emerald-300'
                                                                : 'text-slate-600 hover:bg-slate-800/40'
                                                        }`}
                                                        title={
                                                            hasLiveRecords
                                                                ? `🔍 ${count} inspección(es) registrada(s) con evidencia. Click para ver detalles.`
                                                                : `Click para editar ejecutado manual: ${MONTH_NAMES[mIdx]}`
                                                        }
                                                    >
                                                        <div className="flex items-center justify-center gap-0.5">
                                                            {count > 0 ? count : '-'}
                                                            {hasLiveRecords && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                            )}
                                                        </div>
                                                    </td>
                                                </React.Fragment>
                                            );
                                        })}

                                        {/* Totales Fila */}
                                        <td className="py-2 px-1 text-center font-bold text-blue-300 bg-slate-900/40 border-r border-slate-800/40">
                                            {totP}
                                        </td>
                                        <td className="py-2 px-1 text-center font-bold text-emerald-300 bg-slate-900/40 border-r border-slate-800/40">
                                            {totE}
                                        </td>
                                        <td className={`py-2 px-1 text-center font-bold ${
                                            pct >= 100 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : pct > 0 ? 'text-red-400' : 'text-slate-500'
                                        }`}>
                                            {totP > 0 ? `${pct}%` : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            {/* Totales Programados del Subprograma */}
                            <tr className="bg-blue-950/30 text-slate-200 font-bold border-t-2 border-blue-500/40">
                                <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-[11px] text-blue-300 border-r border-slate-800">
                                    Total Inspecciones Programadas (P):
                                </td>
                                {MONTHS.map((_, mIdx) => (
                                    <React.Fragment key={mIdx}>
                                        <td className="py-2 px-1 text-center text-blue-400 font-bold border-r border-slate-800/40">
                                            {totals.totalsP[mIdx]}
                                        </td>
                                        <td className="py-2 px-1 text-center text-slate-600 border-r border-slate-800/60">-</td>
                                    </React.Fragment>
                                ))}
                                <td className="py-2 px-1 text-center text-blue-300 font-extrabold border-r border-slate-800/40">
                                    {totals.sumP}
                                </td>
                                <td className="py-2 px-1 text-center text-slate-600 border-r border-slate-800/40">-</td>
                                <td className="py-2 px-1 text-center text-blue-300 font-bold">100%</td>
                            </tr>

                            {/* Totales Ejecutados del Subprograma */}
                            <tr className="bg-emerald-950/30 text-slate-200 font-bold border-t border-slate-800">
                                <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-[11px] text-emerald-300 border-r border-slate-800">
                                    Total Inspecciones Ejecutadas (E):
                                </td>
                                {MONTHS.map((_, mIdx) => (
                                    <React.Fragment key={mIdx}>
                                        <td className="py-2 px-1 text-center text-slate-600 border-r border-slate-800/40">-</td>
                                        <td className="py-2 px-1 text-center text-emerald-400 font-bold border-r border-slate-800/60">
                                            {totals.totalsE[mIdx]}
                                        </td>
                                    </React.Fragment>
                                ))}
                                <td className="py-2 px-1 text-center text-slate-600 border-r border-slate-800/40">-</td>
                                <td className="py-2 px-1 text-center text-emerald-300 font-extrabold border-r border-slate-800/40">
                                    {totals.sumE}
                                </td>
                                <td className="py-2 px-1 text-center text-emerald-300 font-bold">
                                    {totals.sumP > 0 ? `${Math.min(100, Math.round((totals.sumE / totals.sumP) * 100))}%` : '0%'}
                                </td>
                            </tr>

                            {/* % Cumplimiento Mensual */}
                            <tr className="bg-slate-800/80 text-amber-300 font-bold border-t border-slate-700">
                                <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-[11px] border-r border-slate-700">
                                    % Cumplimiento Mensual:
                                </td>
                                {MONTHS.map((_, mIdx) => {
                                    const p = totals.totalsP[mIdx];
                                    const e = totals.totalsE[mIdx];
                                    const pct = p > 0 ? Math.min(100, Math.round((e / p) * 100)) : 100;
                                    return (
                                        <td key={mIdx} colSpan={2} className={`py-2 px-1 text-center border-r border-slate-700 font-bold ${
                                            p === 0 ? 'text-slate-500' : pct >= 100 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'
                                        }`}>
                                            {p > 0 ? `${pct}%` : '-'}
                                        </td>
                                    );
                                })}
                                <td colSpan={3} className="py-2 px-1 text-center font-extrabold text-amber-300 bg-amber-950/30">
                                    {totals.sumP > 0 ? `${Math.min(100, Math.round((totals.sumE / totals.sumP) * 100))}%` : '0%'}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header del Componente */}
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 shadow-inner">
                                <ClipboardCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                    Subprogramas Oficiales de Inspecciones Operacionales
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                                        F-SIG-067
                                    </span>
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Objetivo 3: Seguimiento por categorías (Seguridad, Medio Ambiente, Salud Ocupacional y Subcomité SCSST).
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Buscador */}
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar inspección..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors w-48"
                            />
                        </div>

                        {/* Input Oculto para Carga de Excel */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".xlsx, .xls"
                            className="hidden"
                        />

                        {/* Botón Cargar Excel */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            title="Actualizar F-SIG-067 subiendo archivo Excel"
                        >
                            <Upload className="w-3.5 h-3.5 text-blue-400" />
                            <span>{isUploading ? 'Procesando...' : 'Cargar Excel'}</span>
                        </button>

                        {/* Botón Descargar Excel */}
                        <button
                            onClick={handleDownloadTemplate}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all shadow-sm active:scale-95"
                            title="Descargar libro Excel oficial con todas las hojas"
                        >
                            <Download className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Exportar F-SIG-067</span>
                        </button>

                        {/* Botón Guardar en Nube */}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all shadow-md active:scale-95 ${
                                hasUnsavedChanges
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                                    : 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50'
                            }`}
                        >
                            <Save className="w-3.5 h-3.5" />
                            <span>{isSaving ? 'Guardando...' : hasUnsavedChanges ? 'Guardar Cambios *' : 'Sincronizado'}</span>
                        </button>
                    </div>
                </div>

                {/* Tabs de Navegación */}
                <div className="flex flex-wrap items-center gap-2 mt-6 border-b border-slate-800 pb-3">
                    <button
                        onClick={() => setActiveTab('seguridad')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'seguridad'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        <Shield className="w-4 h-4 text-blue-400" />
                        <span>Inspecciones de Seguridad (14)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-blue-950 text-blue-300">
                            {progSeguridad.items?.length || 0}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('ma')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'ma'
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        <Leaf className="w-4 h-4 text-emerald-400" />
                        <span>Medio Ambiente (2)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-950 text-emerald-300">
                            {progMA.items?.length || 0}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('salud')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'salud'
                                ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20'
                                : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        <Stethoscope className="w-4 h-4 text-rose-400" />
                        <span>Salud Ocupacional (8)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-rose-950 text-rose-300">
                            {progSalud.items?.length || 0}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('scsst')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'scsst'
                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                                : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        <Users2 className="w-4 h-4 text-amber-400" />
                        <span>Subcomité SCSST (1)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-950 text-amber-300">
                            {progSCSST.items?.length || 0}
                        </span>
                    </button>

                    <button
                        onClick={() => setActiveTab('resumen')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'resumen'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                        <BarChart3 className="w-4 h-4 text-indigo-400" />
                        <span>Resumen y Alimentación Anual</span>
                    </button>
                </div>
            </div>

            {/* Contenido de la Pestaña Activa */}
            {activeTab === 'seguridad' && renderTableForSubprogram(progSeguridad, 'subprog_insp_seguridad', 'blue')}
            {activeTab === 'ma' && renderTableForSubprogram(progMA, 'subprog_insp_ma', 'emerald')}
            {activeTab === 'salud' && renderTableForSubprogram(progSalud, 'subprog_insp_salud', 'rose')}
            {activeTab === 'scsst' && renderTableForSubprogram(progSCSST, 'subprog_insp_scsst', 'amber')}

            {activeTab === 'resumen' && (
                <div className="space-y-6">
                    {/* Tarjetas KPI */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                            <div className="text-slate-400 text-xs font-medium">Seguridad (Prevencionistas)</div>
                            <div className="text-xl font-bold text-white mt-1">{totalsSeg.sumE} / {totalsSeg.sumP}</div>
                            <div className="text-xs text-blue-400 mt-1 font-semibold">
                                {totalsSeg.sumP > 0 ? Math.min(100, Math.round((totalsSeg.sumE / totalsSeg.sumP) * 100)) : 0}% Cumplimiento
                            </div>
                        </div>

                        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                            <div className="text-slate-400 text-xs font-medium">Medio Ambiente</div>
                            <div className="text-xl font-bold text-white mt-1">{totalsMA.sumE} / {totalsMA.sumP}</div>
                            <div className="text-xs text-emerald-400 mt-1 font-semibold">
                                {totalsMA.sumP > 0 ? Math.min(100, Math.round((totalsMA.sumE / totalsMA.sumP) * 100)) : 0}% Cumplimiento
                            </div>
                        </div>

                        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                            <div className="text-slate-400 text-xs font-medium">Salud Ocupacional</div>
                            <div className="text-xl font-bold text-white mt-1">{totalsSalud.sumE} / {totalsSalud.sumP}</div>
                            <div className="text-xs text-rose-400 mt-1 font-semibold">
                                {totalsSalud.sumP > 0 ? Math.min(100, Math.round((totalsSalud.sumE / totalsSalud.sumP) * 100)) : 0}% Cumplimiento
                            </div>
                        </div>

                        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
                            <div className="text-slate-400 text-xs font-medium">Subcomité SCSST</div>
                            <div className="text-xl font-bold text-white mt-1">{totalsSCSST.sumE} / {totalsSCSST.sumP}</div>
                            <div className="text-xs text-amber-400 mt-1 font-semibold">
                                {totalsSCSST.sumP > 0 ? Math.min(100, Math.round((totalsSCSST.sumE / totalsSCSST.sumP) * 100)) : 0}% Cumplimiento
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Consolidación Anual que alimenta el Objetivo 3 */}
                    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl">
                        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-emerald-400" />
                            Matriz Consolidada de Inspecciones Operacionales (Alimentador Objetivo 3)
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-slate-800 text-slate-300 font-bold border-b border-slate-700">
                                        <th className="py-2.5 px-3">Subprograma</th>
                                        {MONTHS.map(m => (
                                            <th key={m} className="py-2 px-1 text-center">{m}</th>
                                        ))}
                                        <th className="py-2 px-2 text-center bg-slate-800/80">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    <tr className="hover:bg-slate-800/40">
                                        <td className="py-2 px-3 font-semibold text-blue-400">Seguridad - Prog. (P)</td>
                                        {totalsSeg.totalsP.map((val, i) => (
                                            <td key={i} className="py-2 px-1 text-center text-slate-300">{val}</td>
                                        ))}
                                        <td className="py-2 px-2 text-center font-bold text-blue-300">{totalsSeg.sumP}</td>
                                    </tr>
                                    <tr className="hover:bg-slate-800/40">
                                        <td className="py-2 px-3 font-semibold text-blue-300">Seguridad - Ejec. (E)</td>
                                        {totalsSeg.totalsE.map((val, i) => (
                                            <td key={i} className="py-2 px-1 text-center text-slate-400">{val}</td>
                                        ))}
                                        <td className="py-2 px-2 text-center font-bold text-blue-400">{totalsSeg.sumE}</td>
                                    </tr>

                                    <tr className="hover:bg-slate-800/40">
                                        <td className="py-2 px-3 font-semibold text-emerald-400">Medio Ambiente - Prog. (P)</td>
                                        {totalsMA.totalsP.map((val, i) => (
                                            <td key={i} className="py-2 px-1 text-center text-slate-300">{val}</td>
                                        ))}
                                        <td className="py-2 px-2 text-center font-bold text-emerald-300">{totalsMA.sumP}</td>
                                    </tr>
                                    <tr className="hover:bg-slate-800/40">
                                        <td className="py-2 px-3 font-semibold text-emerald-300">Medio Ambiente - Ejec. (E)</td>
                                        {totalsMA.totalsE.map((val, i) => (
                                            <td key={i} className="py-2 px-1 text-center text-slate-400">{val}</td>
                                        ))}
                                        <td className="py-2 px-2 text-center font-bold text-emerald-400">{totalsMA.sumE}</td>
                                    </tr>

                                    <tr className="hover:bg-slate-800/40">
                                        <td className="py-2 px-3 font-semibold text-rose-400">Salud Ocupacional - Prog. (P)</td>
                                        {totalsSalud.totalsP.map((val, i) => (
                                            <td key={i} className="py-2 px-1 text-center text-slate-300">{val}</td>
                                        ))}
                                        <td className="py-2 px-2 text-center font-bold text-rose-300">{totalsSalud.sumP}</td>
                                    </tr>
                                    <tr className="hover:bg-slate-800/40">
                                        <td className="py-2 px-3 font-semibold text-rose-300">Salud Ocupacional - Ejec. (E)</td>
                                        {totalsSalud.totalsE.map((val, i) => (
                                            <td key={i} className="py-2 px-1 text-center text-slate-400">{val}</td>
                                        ))}
                                        <td className="py-2 px-2 text-center font-bold text-rose-400">{totalsSalud.sumE}</td>
                                    </tr>

                                    <tr className="hover:bg-slate-800/40">
                                        <td className="py-2 px-3 font-semibold text-amber-400">Subcomité SCSST - Prog. (P)</td>
                                        {totalsSCSST.totalsP.map((val, i) => (
                                            <td key={i} className="py-2 px-1 text-center text-slate-300">{val}</td>
                                        ))}
                                        <td className="py-2 px-2 text-center font-bold text-amber-300">{totalsSCSST.sumP}</td>
                                    </tr>
                                    <tr className="hover:bg-slate-800/40">
                                        <td className="py-2 px-3 font-semibold text-amber-300">Subcomité SCSST - Ejec. (E)</td>
                                        {totalsSCSST.totalsE.map((val, i) => (
                                            <td key={i} className="py-2 px-1 text-center text-slate-400">{val}</td>
                                        ))}
                                        <td className="py-2 px-2 text-center font-bold text-amber-400">{totalsSCSST.sumE}</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-800/90 font-bold border-t-2 border-slate-700">
                                        <td className="py-2.5 px-3 text-white">TOTAL PROGRAMADO (P)</td>
                                        {combinedTotalsP.map((val, i) => (
                                            <td key={i} className="py-2.5 px-1 text-center text-blue-300 font-bold">{val}</td>
                                        ))}
                                        <td className="py-2.5 px-2 text-center text-blue-300 font-extrabold">{combinedSumP}</td>
                                    </tr>
                                    <tr className="bg-slate-800/90 font-bold border-t border-slate-700">
                                        <td className="py-2.5 px-3 text-white">TOTAL EJECUTADO (E)</td>
                                        {combinedTotalsE.map((val, i) => (
                                            <td key={i} className="py-2.5 px-1 text-center text-emerald-400 font-bold">{val}</td>
                                        ))}
                                        <td className="py-2.5 px-2 text-center text-emerald-400 font-extrabold">{combinedSumE}</td>
                                    </tr>
                                    <tr className="bg-slate-950 font-bold border-t border-slate-700 text-amber-400">
                                        <td className="py-2.5 px-3">% CUMPLIMIENTO CONSOLIDADO</td>
                                        {MONTHS.map((_, mIdx) => {
                                            const p = combinedTotalsP[mIdx];
                                            const e = combinedTotalsE[mIdx];
                                            const pct = p > 0 ? Math.min(100, Math.round((e / p) * 100)) : 100;
                                            return (
                                                <td key={mIdx} className="py-2.5 px-1 text-center font-bold">
                                                    {p > 0 ? `${pct}%` : '-'}
                                                </td>
                                            );
                                        })}
                                        <td className="py-2.5 px-2 text-center text-emerald-400 font-extrabold">
                                            {combinedSumP > 0 ? `${Math.min(100, Math.round((combinedSumE / combinedSumP) * 100))}%` : '0%'}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
