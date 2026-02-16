"use client";

import { Activity, MONTHS, AuditLog } from "@/lib/types";
import React, { useState } from "react";
import { Edit3, Check, X, FileText, Calendar, User, History, Eye, ExternalLink, ShieldAlert, Plus, Trash2, Shield, TrendingUp, Activity as ActivityIcon, Download, FileSpreadsheet, ArrowUp, ArrowDown } from "lucide-react";
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { exportToPDF, exportToExcel } from '@/lib/exportUtils';

interface TableViewProps {
    activities: Activity[];
    onUpdateActivity: (activityId: string, monthIndex: number, type: 'plan' | 'executed', value: number) => void;
    onUpdateName: (activityId: string, newName: string) => void;
    onViewEvidence: (activity: Activity, monthIndex: number) => void;
    isSCSST?: boolean;
    onAddActivity?: () => void;
    onDeleteActivity?: (id: string) => void;
    onMoveActivity?: (activityId: string, direction: 'up' | 'down') => void;
}

export function TableView({
    activities,
    onUpdateActivity,
    onUpdateName,
    onViewEvidence,
    isSCSST,
    onAddActivity,
    onDeleteActivity,
    onMoveActivity
}: TableViewProps) {
    const [editingCell, setEditingCell] = useState<{ id: string, month: number, type: 'plan' | 'executed' } | null>(null);
    const [editValue, setEditValue] = useState<string>("");
    const [editingName, setEditingName] = useState<string | null>(null);
    const [nameValue, setNameValue] = useState("");
    const [historyActivity, setHistoryActivity] = useState<Activity | null>(null);

    const handleStartEdit = (id: string, month: number, type: 'plan' | 'executed', val: number) => {
        setEditingCell({ id, month, type });
        setEditValue(val.toString());
    };

    const handleSaveEdit = () => {
        if (editingCell) {
            onUpdateActivity(editingCell.id, editingCell.month, editingCell.type, Number(editValue) || 0);
            setEditingCell(null);
        }
    };

    const handleStartNameEdit = (activity: Activity) => {
        setEditingName(activity.id);
        setNameValue(activity.name);
    };

    const handleSaveName = () => {
        if (editingName) {
            onUpdateName(editingName, nameValue);
            setEditingName(null);
        }
    };

    return (
        <div className="relative space-y-4">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {isSCSST && (
                    <div className="flex items-center gap-3 bg-blue-50 border-l-4 border-blue-600 p-3 rounded-r-xl">
                        <ShieldAlert size={20} className="text-blue-600" />
                        <span className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em]">Prioridad Estratégica: Actividades Críticas SCSST</span>
                    </div>
                )}
                {!isSCSST && <div />}

                {onAddActivity && (
                    <button
                        onClick={onAddActivity}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-transform active:scale-95"
                    >
                        <Plus size={14} /> Nueva Actividad
                    </button>
                )}
            </div>

            {/* Export Buttons */}
            <div className="flex justify-end gap-3 px-4">
                <button
                    onClick={() => exportToPDF(activities)}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-all shadow-lg font-bold text-[10px] uppercase tracking-wider"
                >
                    <Download size={14} />
                    Exportar PDF
                </button>
                <button
                    onClick={() => exportToExcel(activities)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-lg font-bold text-[10px] uppercase tracking-wider"
                >
                    <FileSpreadsheet size={14} />
                    Exportar Excel
                </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-3xl shadow-2xl bg-white relative max-h-[calc(100vh-250px)] overflow-y-auto">
                <table className="w-full text-[10px] text-left border-collapse min-w-full">
                    <thead className="bg-slate-900 text-white uppercase tracking-wider sticky top-0 z-40">
                        <tr>
                            <th className="px-3 py-4 font-black sticky left-0 bg-slate-900 z-50 min-w-[300px] border-r border-slate-700 shadow-[2px_0_5px_rgba(0,0,0,0.1)]">Actividad {isSCSST ? '(SCSST)' : ''}</th>
                            <th className="px-1 py-4 text-center border-r border-slate-700 w-[50px]">Tipo</th>
                            {MONTHS.map(m => (
                                <th key={m} className="px-0 py-4 text-center w-[40px] border-r border-slate-700 text-[9px]">{m}</th>
                            ))}
                            <th className="px-1 py-4 text-center font-black border-r border-slate-700 w-[50px]">Total</th>
                            <th className="px-1 py-4 text-center font-black w-[70px]">Gestión</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700">
                        {activities.map((activity, index) => {
                            const totalPlan = (activity.data?.plan || new Array(12).fill(0)).reduce((a, b) => a + b, 0);
                            const totalExec = (activity.data?.executed || new Array(12).fill(0)).reduce((a, b) => a + b, 0);
                            const percent = totalPlan > 0 ? Math.round((totalExec / totalPlan) * 100) : 0;

                            const showHeader = index === 0 || activities[index - 1].managementArea !== activity.managementArea;
                            const areaLabels: Record<string, { label: string, icon: React.ReactNode, color: string, bg: string }> = {
                                safety: { label: 'GESTIÓN DE SEGURIDAD', icon: <Shield size={16} />, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                                health: { label: 'GESTIÓN DE LA SALUD', icon: <ActivityIcon size={16} />, color: 'text-rose-700', bg: 'bg-rose-50' },
                                environment: { label: 'GESTIÓN DE MEDIO AMBIENTE', icon: <TrendingUp size={16} />, color: 'text-blue-700', bg: 'bg-blue-50' }
                            };

                            const currentArea = activity.managementArea ? areaLabels[activity.managementArea] : null;

                            return (
                                <React.Fragment key={activity.id}>
                                    {showHeader && currentArea && (
                                        <tr className={`${currentArea.bg} border-y-2 border-slate-200`}>
                                            <td colSpan={16} className="px-6 py-4">
                                                <div className={`flex items-center gap-3 ${currentArea.color} font-black text-[12px] tracking-[0.2em] uppercase`}>
                                                    <div className={`p-2 rounded-xl bg-white shadow-sm border border-slate-200`}>
                                                        {currentArea.icon}
                                                    </div>
                                                    {currentArea.label}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    <tr className={`hover:bg-slate-50 transition-colors border-b border-slate-100 group/row ${isSCSST ? 'bg-blue-50/10' : ''}`}>
                                        <td rowSpan={2} className={`px-4 py-3 sticky left-0 z-20 border-r border-slate-200 shadow-[2px_0_10px_rgba(0,0,0,0.03)] ${isSCSST ? 'bg-blue-50/60 font-black' : 'bg-white'}`}>
                                            <div className="flex items-start justify-between group">
                                                {editingName === activity.id ? (
                                                    <div className="flex flex-col gap-1 w-full">
                                                        <input
                                                            className="border-2 border-blue-500 rounded-lg px-2 py-1.5 w-full outline-none font-bold text-slate-900 text-[11px] shadow-inner"
                                                            value={nameValue}
                                                            onChange={(e) => setNameValue(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-3 font-black text-[9px] uppercase mt-1">
                                                            <button onClick={handleSaveName} className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1"><Check size={10} /> Guardar</button>
                                                            <button onClick={() => setEditingName(null)} className="text-rose-500 hover:text-rose-600 flex items-center gap-1"><X size={10} /> Cancelar</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-between items-center w-full">
                                                        <div className="flex items-start gap-2 pr-4 py-1">
                                                            {onMoveActivity && (
                                                                <div className="flex flex-col gap-0.5 pt-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => onMoveActivity(activity.id, 'up')}
                                                                        className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                                                        title="Subir"
                                                                        disabled={index === 0}
                                                                    >
                                                                        <ArrowUp size={10} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => onMoveActivity(activity.id, 'down')}
                                                                        className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                                                        title="Bajar"
                                                                        disabled={index === activities.length - 1}
                                                                    >
                                                                        <ArrowDown size={10} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                            <div className="flex-1">
                                                                <span className={`text-[12px] block leading-snug ${isSCSST ? 'text-blue-900 font-extrabold underline decoration-blue-300 underline-offset-4' : 'font-bold text-slate-800'}`} title={activity.name}>{activity.name}</span>
                                                                {(activity.target || activity.frequency) && (
                                                                    <div className="flex gap-2 mt-1 text-[9px] text-slate-400 font-medium">
                                                                        {activity.target && <span>Meta: {activity.target}</span>}
                                                                        {activity.frequency && (
                                                                            <>
                                                                                <span>•</span>
                                                                                <span>{activity.frequency}</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                            <button
                                                                onClick={() => handleStartNameEdit(activity)}
                                                                className="p-2 bg-slate-900 text-white rounded-lg shadow-lg shrink-0 hover:bg-emerald-600 transition"
                                                                title="Editar Nombre"
                                                            >
                                                                <Edit3 size={12} />
                                                            </button>
                                                            {onDeleteActivity && (
                                                                <button
                                                                    onClick={() => onDeleteActivity(activity.id)}
                                                                    className="p-2 bg-rose-500 text-white rounded-lg shadow-lg shrink-0 hover:bg-rose-600 transition"
                                                                    title="Eliminar Fila"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-1 py-1 text-center text-[9px] font-black text-blue-800 bg-blue-50/30 border-r border-slate-100">PLAN</td>
                                        {(activity.data?.plan || new Array(12).fill(0)).map((val, i) => (
                                            <td
                                                key={i}
                                                className={`px-0 py-2 text-center border-r border-slate-50 cursor-pointer hover:bg-blue-50 transition-all font-black text-slate-900 ${editingCell?.id === activity.id && editingCell?.month === i && editingCell?.type === 'plan' ? 'bg-blue-100 ring-2 ring-blue-500 z-10' : ''}`}
                                                onClick={() => handleStartEdit(activity.id, i, 'plan', val)}
                                            >
                                                {editingCell?.id === activity.id && editingCell?.month === i && editingCell?.type === 'plan' ? (
                                                    <input
                                                        className="w-full text-center bg-transparent font-black outline-none text-blue-700 text-sm"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onBlur={handleSaveEdit}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                                        autoFocus
                                                    />
                                                ) : val || '-'}
                                            </td>
                                        ))}
                                        <td className="px-1 py-1 text-center font-black text-blue-900 bg-blue-50/50 border-r border-slate-100 text-xs">{totalPlan}</td>
                                        <td rowSpan={2} className="px-2 py-2 text-center border-slate-100 align-middle">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl border-2 flex flex-col items-center justify-center font-black shadow-md ${percent >= 100 ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-amber-400 bg-amber-50 text-amber-700'}`}>
                                                    <span className="text-[10px] leading-none">{percent}%</span>
                                                </div>
                                                <div className="flex flex-col gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setHistoryActivity(activity)}
                                                        className="p-1.5 bg-slate-900 text-white rounded-lg hover:bg-blue-600 transition shadow-lg"
                                                        title="Ver Historial"
                                                    >
                                                        <History size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr className={`hover:bg-slate-50 transition-colors border-b border-slate-300 group/row ${isSCSST ? 'bg-blue-50/5' : ''}`}>
                                        <td className="px-1 py-1 text-center text-[9px] font-black text-emerald-800 bg-emerald-50/30 border-r border-slate-100 uppercase">Ejec</td>
                                        {(activity.data?.executed || new Array(12).fill(0)).map((val, i) => (
                                            <td
                                                key={i}
                                                className="px-0 py-2 text-center border-r border-slate-100 group/real relative"
                                            >
                                                <div
                                                    className={`cursor-pointer hover:bg-emerald-50 transition-all font-black text-slate-900 h-full flex items-center justify-center ${editingCell?.id === activity.id && editingCell?.month === i && editingCell?.type === 'executed' ? 'bg-emerald-100 ring-2 ring-emerald-500 z-10 rounded-sm' : ''}`}
                                                    onClick={() => handleStartEdit(activity.id, i, 'executed', val)}
                                                >
                                                    {editingCell?.id === activity.id && editingCell?.month === i && editingCell?.type === 'executed' ? (
                                                        <input
                                                            className="w-full text-center bg-transparent font-black outline-none text-emerald-700 text-sm"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onBlur={handleSaveEdit}
                                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                                            autoFocus
                                                        />
                                                    ) : val || '-'}
                                                </div>
                                                <button
                                                    onClick={() => onViewEvidence(activity, i)}
                                                    className={`absolute -top-1.5 -right-1.5 p-1 rounded-md shadow-lg transition-all z-10 ${activity.evidence && activity.evidence[i] ? 'bg-rose-500 text-white scale-110' : 'bg-slate-100 text-slate-400 opacity-0 group-hover/real:opacity-100 hover:scale-110'}`}
                                                    title={activity.evidence && activity.evidence[i] ? "Ver Evidencia" : "Subir Evidencia"}
                                                >
                                                    <FileText size={10} />
                                                </button>
                                            </td>
                                        ))}
                                        <td className="px-1 py-1 text-center font-black text-emerald-900 bg-emerald-50/50 border-r border-slate-100 text-xs">{totalExec}</td>
                                    </tr>
                                </React.Fragment>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Audit Modal */}
            {historyActivity && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-300">
                        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600 rounded-xl">
                                    <History size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Audit Log</p>
                                    <h4 className="font-black text-sm uppercase tracking-tighter">Historial de Cambios</h4>
                                </div>
                            </div>
                            <button
                                onClick={() => setHistoryActivity(null)}
                                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 max-h-[400px] overflow-y-auto space-y-3 bg-slate-50 shadow-inner">
                            {historyActivity.history && historyActivity.history.length > 0 ? (
                                historyActivity.history.map((log, i) => (
                                    <div key={i} className="bg-white p-4 border border-slate-100 rounded-2xl shadow-sm space-y-2">
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{log.user.split('@')[0]}</span>
                                            <span className="text-[9px] font-bold text-slate-400">{log.date} {log.time}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-800 font-bold leading-relaxed">{log.action}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-10 text-slate-400 font-black uppercase text-[10px] tracking-widest">Sin registros de actividad</p>
                            )}
                        </div>
                        <div className="p-4 bg-white border-t border-slate-100">
                            <button
                                onClick={() => setHistoryActivity(null)}
                                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

