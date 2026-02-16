"use client";

import { Activity, MONTHS } from "@/lib/types";
import { useState, useEffect } from "react";
import { X, Upload, Save, FileText, CheckCircle2, ChevronRight } from "lucide-react";

interface UpdateActivityModalProps {
    activity: Activity;
    onClose: () => void;
    onSave: (activityId: string, monthIndex: number, value: number, file: File | null) => void;
}

export function UpdateActivityModal({ activity, onClose, onSave }: UpdateActivityModalProps) {
    const [monthIndex, setMonthIndex] = useState(new Date().getMonth());
    const [inputValue, setInputValue] = useState<string>(""); // Empezamos vacío para evitar confusión
    const [file, setFile] = useState<File | null>(null);

    // Sincronizar valor si el usuario cambia el mes (opcional, pero mejor dejarlo limpio para adición)
    useEffect(() => {
        setInputValue("");
    }, [monthIndex]);

    const handleSave = () => {
        const numVal = Number(inputValue) || 0;
        onSave(activity.id, monthIndex, numVal, file);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 flex flex-col">
                <div className="bg-slate-900 p-5 text-white flex justify-between items-center relative">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-600 rounded-lg">
                            <Edit3 size={14} className="text-white" />
                        </div>
                        <h2 className="font-black text-xs uppercase tracking-widest">Actualizar Registro</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Actividad</p>
                        <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{activity.name}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mes</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-900 text-xs focus:ring-1 ring-blue-500 outline-none"
                                value={monthIndex}
                                onChange={(e) => setMonthIndex(Number(e.target.value))}
                            >
                                {MONTHS.map((month, i) => (
                                    <option key={i} value={i}>{month}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sumar Cantidad</label>
                            <input
                                type="number"
                                placeholder="0"
                                className="w-full bg-blue-50/30 border border-blue-100 rounded-xl p-2.5 font-black text-lg text-blue-900 focus:ring-1 ring-blue-500 outline-none text-center"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Evidencia (PDF/Imagen)</label>
                        <div className="border border-dashed border-slate-300 rounded-xl p-5 flex flex-col items-center justify-center gap-2 bg-slate-50 hover:bg-blue-50 transition-all cursor-pointer relative group">
                            <Upload size={20} className="text-slate-400 group-hover:text-blue-500" />
                            <span className="text-[9px] font-black text-slate-600 uppercase text-center">
                                {file ? file.name : "Subir archivo"}
                            </span>
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-400 font-black uppercase text-[10px] hover:bg-slate-50 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-[1.5] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] py-3 rounded-xl shadow-lg ring-1 ring-blue-500/20 shadow-blue-900/20 transition-all"
                        >
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { Edit3 } from "lucide-react";
