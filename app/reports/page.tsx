"use client";

import { useEffect, useState } from "react";
import { Download, Save, RefreshCw } from "lucide-react";
import * as XLSX from 'xlsx';

// Constants
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Types
type MonthlyData = {
    [key: string]: number[]; // array of 12 numbers
};

export default function ReportsPage() {
    // Initial State with 0s
    const initialData: MonthlyData = {
        EO: Array(12).fill(0),
        EP: Array(12).fill(0),
        T: Array(12).fill(0),
        Cancer: Array(12).fill(0),
        HP: Array(12).fill(0),
        AL: Array(12).fill(0),
        IncLeves: Array(12).fill(0),
        IncPelig: Array(12).fill(0),
        ATT: Array(12).fill(0),
        APP: Array(12).fill(0),
        ATP: Array(12).fill(0),
        AM: Array(12).fill(0),
        TDP: Array(12).fill(0),
    };

    const [data, setData] = useState<MonthlyData>(initialData);
    const [isLoaded, setIsLoaded] = useState(false);
    
    // External Works State
    const [otherWorks, setOtherWorks] = useState<string[]>(["PAD San Clemente", "PAD Chinchaysullo", "PAD 9 de Octubre", "San Antonio", "MP", "Longitudinal", "Peaje Jahuay"]);
    const [selectedExtWork, setSelectedExtWork] = useState<string>("PAD San Clemente");
    const [selectedExtYear, setSelectedExtYear] = useState<number>(2026);
    const [externalFiles, setExternalFiles] = useState<Record<string, string>>({});

    // Load from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem('accidentability_stats_2026');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setData({ ...initialData, ...parsed });
            } catch (e) {
                console.error("Error parsing stats", e);
            }
        }
        
        const savedWorks = localStorage.getItem('other_works_list_v4');
        if (savedWorks) {
            try { setOtherWorks(JSON.parse(savedWorks)); } catch (e) {}
        }

        const savedFiles = localStorage.getItem('other_works_files_v4');
        if (savedFiles) {
            try { setExternalFiles(JSON.parse(savedFiles)); } catch (e) {}
        }

        setIsLoaded(true);
    }, []);

    // Save Data
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('accidentability_stats_2026', JSON.stringify(data));
            localStorage.setItem('other_works_list_v4', JSON.stringify(otherWorks));
            localStorage.setItem('other_works_files_v4', JSON.stringify(externalFiles));
        }
    }, [data, otherWorks, externalFiles, isLoaded]);

    const handleChange = (key: string, monthIndex: number, value: string) => {
        const numVal = Number(value) || 0;
        setData(prev => {
            const newData = { ...prev };
            newData[key] = [...prev[key]];
            newData[key][monthIndex] = numVal;
            return newData;
        });
    };

    // Calculate Helper
    const getVal = (key: string, m: number) => {
        if (!data[key]) return 0;
        return data[key][m] || 0;
    };

    // Derived Calculations per month
    const calculateStats = (m: number) => {
        const EO = getVal('EO', m);
        const EP = getVal('EP', m);
        const T = getVal('T', m);
        const HP = getVal('HP', m);

        const ATT = getVal('ATT', m);
        const APP = getVal('APP', m);
        const ATP = getVal('ATP', m);
        const AM = getVal('AM', m);
        const TDP = getVal('TDP', m);

        // Calculated Fields
        const AI = ATT + APP + ATP;
        const ACDP = AI + AM;

        // Indices (Prevention of Div by 0)
        // IF = (ACDP * 1,000,000) / HP
        const IF = HP > 0 ? (ACDP * 1000000) / HP : 0;

        // IS = (TDP * 1,000,000) / HP
        const IS = HP > 0 ? (TDP * 1000000) / HP : 0;

        // IA = (IF * IS) / 1000
        const IA = (IF * IS) / 1000;

        // Tasa Incidencia Enf = (EO * 1,000) / T 
        const TasaIncidencia = T > 0 ? (EO * 1000) / T : 0;

        // Frecuencia Pre Pat = (EP * 1,000) / T
        const FreqPrePat = T > 0 ? (EP * 1000) / T : 0;

        return { AI, ACDP, IF, IS, IA, TasaIncidencia, FreqPrePat };
    };

    // Accumulators
    const getTotal = (key: string) => (data[key] || []).reduce((a, b) => a + b, 0);

    // Derived Totals
    const totalAI = getTotal('ATT') + getTotal('APP') + getTotal('ATP');
    const totalAM = getTotal('AM');
    const totalACDP = totalAI + totalAM;
    const totalTDP = getTotal('TDP');
    const totalHP = getTotal('HP');
    const totalT = getTotal('T'); 
    
    const totalIF = totalHP > 0 ? (totalACDP * 1000000) / totalHP : 0;
    const totalIS = totalHP > 0 ? (totalTDP * 1000000) / totalHP : 0;
    const totalIA = (totalIF * totalIS) / 1000;

    const avgT = totalT > 0 ? totalT / 12 : 0; 
    const totalTasaInc = avgT > 0 ? (getTotal('EO') * 1000) / avgT : 0;
    const totalFreqPrePat = avgT > 0 ? (getTotal('EP') * 1000) / avgT : 0;


    const handleExport = () => {
        const ws = XLSX.utils.table_to_sheet(document.getElementById('stats-table'));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Estadística");
        XLSX.writeFile(wb, "Estadistica_Accidentabilidad_2026.xlsx");
    };

    // Render Helper
    const CellInput = ({ rKey, m }: { rKey: string, m: number }) => (
        <input
            type="number"
            value={data[rKey][m] === 0 ? '' : data[rKey][m]}
            onChange={(e) => handleChange(rKey, m, e.target.value)}
            className="w-full bg-transparent text-center focus:outline-none focus:bg-slate-800 text-slate-300 font-mono text-xs h-full"
            placeholder="0"
        />
    );

    const CellCalc = ({ val, isDec = false }: { val: number, isDec?: boolean }) => (
        <span className={`block w-full text-center ${val > 0 ? 'text-white font-bold' : 'text-slate-500'}`}>
            {val === 0 ? '-' : isDec ? val.toFixed(2) : val}
        </span>
    );

    const ErrorCell = () => <span className="text-red-500 text-[10px] text-center block">#DIV/0!</span>;

    const renderMonthCells = (rowType: 'input' | 'calc', keyOrFn: string | ((m: number) => number), isDec = false) => {
        return MONTHS.map((_, m) => (
            <td key={m} className="border border-slate-700 p-0 h-8 hover:bg-slate-800/30 transition-colors">
                {rowType === 'input'
                    ? <CellInput rKey={keyOrFn as string} m={m} />
                    : (
                        //@ts-ignore
                        <CellCalc val={typeof keyOrFn === 'function' ? keyOrFn(m) : 0} isDec={isDec} />
                    )
                }
            </td>
        ));
    };

    return (
        <div className="p-6 max-w-[1800px] mx-auto space-y-6">
            <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <span className="text-emerald-500">ESTADÍSTICA</span> DE ACCIDENTABILIDAD
                    </h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Control y seguimiento mensual de indicadores de seguridad
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20"
                >
                    <Download size={16} /> Exportar Excel
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table id="stats-table" className="w-full text-xs text-left border-collapse min-w-[1200px]">
                        <thead className="bg-slate-950 text-slate-400 uppercase font-bold tracking-wider">
                            <tr>
                                <th className="p-3 border border-slate-700 min-w-[250px] sticky left-0 z-10 bg-slate-950">Datos Estadísticos</th>
                                <th className="p-3 border border-slate-700 text-center w-[100px]">Cálculo</th>
                                {MONTHS.map(m => (
                                    <th key={m} className="p-3 border border-slate-700 text-center min-w-[60px]">{m}</th>
                                ))}
                                <th className="p-3 border border-slate-700 text-center min-w-[80px] bg-slate-900 text-white">Total</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-300 divide-y divide-slate-800">
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Nº Enfermedades Ocupacionales (EO)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'EO')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('EO')}</td>
                            </tr>
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Nº Estados Pre patológicos (EP)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'EP')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('EP')}</td>
                            </tr>
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Nº Trabajadores (T)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'T')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('T')}</td>
                            </tr>
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Nº Trabajadores con Cáncer Prof.</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'Cancer')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('Cancer')}</td>
                            </tr>
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Horas hombre trabajadas (HP)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'HP')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('HP')}</td>
                            </tr>
                            <tr className="bg-slate-950/30"><td colSpan={15} className="h-2"></td></tr>
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Nº Accidentes Leves (AL)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'AL')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('AL')}</td>
                            </tr>
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Nº Incidentes Leves</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'IncLeves')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('IncLeves')}</td>
                            </tr>
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Nº Incidentes Peligrosos</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'IncPelig')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('IncPelig')}</td>
                            </tr>
                            <tr className="bg-slate-950/30"><td colSpan={15} className="h-2"></td></tr>
                            <tr className="bg-slate-800/20">
                                <td className="p-2 border border-slate-700 font-bold sticky left-0 bg-slate-900">Nº Accidentes Incapacitantes (AI)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] font-mono">ATT+APP+ATP</td>
                                {MONTHS.map((_, m) => (
                                    <td key={m} className={`border border-slate-700 text-center font-bold ${calculateStats(m).AI > 0 ? 'text-orange-400' : 'text-slate-600'}`}>
                                        {calculateStats(m).AI}
                                    </td>
                                ))}
                                <td className="p-2 border border-slate-700 text-center font-black bg-slate-800/50 text-orange-400">{totalAI}</td>
                            </tr>
                            <tr>
                                <td className="p-2 border border-slate-700 text-slate-400 pl-6 sticky left-0 bg-slate-900">Total Temporal (ATT)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'ATT')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('ATT')}</td>
                            </tr>
                            <tr>
                                <td className="p-2 border border-slate-700 text-slate-400 pl-6 sticky left-0 bg-slate-900">Parcial Permanente (APP)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'APP')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('APP')}</td>
                            </tr>
                            <tr>
                                <td className="p-2 border border-slate-700 text-slate-400 pl-6 sticky left-0 bg-slate-900">Total Permanente (ATP)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'ATP')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('ATP')}</td>
                            </tr>
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900 text-red-400">Nº Accidentes Mortales (AM)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'AM')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50 text-red-500">{getTotal('AM')}</td>
                            </tr>
                            <tr className="bg-slate-800/20">
                                <td className="p-2 border border-slate-700 font-bold sticky left-0 bg-slate-900">Total Accidentes con días perdidos (ACDP)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] font-mono">AI+AM</td>
                                {MONTHS.map((_, m) => (
                                    <td key={m} className={`border border-slate-700 text-center font-bold ${calculateStats(m).ACDP > 0 ? 'text-white' : 'text-slate-600'}`}>
                                        {calculateStats(m).ACDP}
                                    </td>
                                ))}
                                <td className="p-2 border border-slate-700 text-center font-black bg-slate-800/50">{totalACDP}</td>
                            </tr>
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Total Días Perdidos (TDP)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'TDP')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('TDP')}</td>
                            </tr>
                            <tr className="bg-emerald-900/20"><td colSpan={15} className="h-4 border-l border-r border-slate-700"></td></tr>
                            <tr className="bg-emerald-900/10">
                                <td className="p-2 border border-slate-700 font-bold sticky left-0 bg-slate-900">Índice de Frecuencia (IF)</td>
                                <td className="p-2 border border-slate-700 text-center text-[8px] font-mono leading-tight">(ACDP*10^6)/HP</td>
                                {MONTHS.map((_, m) => {
                                    const val = calculateStats(m).IF;
                                    const hp = getVal('HP', m);
                                    return <td key={m} className="border border-slate-700 text-center font-mono text-emerald-400 font-bold">
                                        {hp > 0 ? val.toFixed(2) : <ErrorCell />}
                                    </td>
                                })}
                                <td className="p-2 border border-slate-700 text-center font-black bg-slate-800/50 text-emerald-400">
                                    {totalHP > 0 ? totalIF.toFixed(2) : '-'}
                                </td>
                            </tr>
                            <tr className="bg-emerald-900/10">
                                <td className="p-2 border border-slate-700 font-bold sticky left-0 bg-slate-900">Índice de Severidad (IS)</td>
                                <td className="p-2 border border-slate-700 text-center text-[8px] font-mono leading-tight">(TDP*10^6)/HP</td>
                                {MONTHS.map((_, m) => {
                                    const val = calculateStats(m).IS;
                                    const hp = getVal('HP', m);
                                    return <td key={m} className="border border-slate-700 text-center font-mono text-emerald-400 font-bold">
                                        {hp > 0 ? val.toFixed(2) : <ErrorCell />}
                                    </td>
                                })}
                                <td className="p-2 border border-slate-700 text-center font-black bg-slate-800/50 text-emerald-400">
                                    {totalHP > 0 ? totalIS.toFixed(2) : '-'}
                                </td>
                            </tr>
                            <tr className="bg-emerald-900/20">
                                <td className="p-2 border border-slate-700 font-bold sticky left-0 bg-slate-900">Índice de Accidentabilidad (IA)</td>
                                <td className="p-2 border border-slate-700 text-center text-[8px] font-mono leading-tight">(IF*IS)/1000</td>
                                {MONTHS.map((_, m) => {
                                    const val = calculateStats(m).IA;
                                    const hp = getVal('HP', m);
                                    return <td key={m} className="border border-slate-700 text-center font-mono text-white font-black text-xs">
                                        {hp > 0 ? val.toFixed(2) : <ErrorCell />}
                                    </td>
                                })}
                                <td className="p-2 border border-slate-700 text-center font-black bg-slate-800/50 text-white border-l-2 border-l-emerald-500">
                                    {totalHP > 0 ? totalIA.toFixed(2) : '-'}
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Tasa de Incidencia de Enfermedades</td>
                                <td className="p-2 border border-slate-700 text-center text-[8px] font-mono leading-tight">(EO*1000)/T</td>
                                {MONTHS.map((_, m) => {
                                    const val = calculateStats(m).TasaIncidencia;
                                    const t = getVal('T', m);
                                    return <td key={m} className="border border-slate-700 text-center text-slate-400">
                                        {t > 0 ? val.toFixed(2) : <ErrorCell />}
                                    </td>
                                })}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">
                                    {avgT > 0 ? totalTasaInc.toFixed(2) : '-'}
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Índice de Frecuencia de Estados Pre patológicos</td>
                                <td className="p-2 border border-slate-700 text-center text-[8px] font-mono leading-tight">(EP*1000)/T</td>
                                {MONTHS.map((_, m) => {
                                    const val = calculateStats(m).FreqPrePat;
                                    const t = getVal('T', m);
                                    return <td key={m} className="border border-slate-700 text-center text-slate-400">
                                        {t > 0 ? val.toFixed(2) : <ErrorCell />}
                                    </td>
                                })}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">
                                    {avgT > 0 ? totalFreqPrePat.toFixed(2) : '-'}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* SECCIÓN: REGISTROS DE OBRAS EXTERNAS (SISTEMA DE MENÚS) */}
                <div className="mt-12 bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[120px] rounded-full -mr-32 -mt-32"></div>
                    
                    <div className="flex flex-col lg:flex-row items-center justify-between mb-10 gap-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-900/40">
                                <RefreshCw className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Accidentabilidad de Sedes y Obras</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Control de registros mensuales por proyecto y periodo</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 bg-slate-950/50 p-2 rounded-2xl border border-white/5">
                            <div className="flex flex-col px-3 border-r border-white/10">
                                <span className="text-[8px] text-slate-500 font-black uppercase mb-1">Seleccionar Año</span>
                                <select 
                                    value={selectedExtYear}
                                    onChange={(e) => setSelectedExtYear(Number(e.target.value))}
                                    className="bg-transparent text-white font-black text-xs outline-none cursor-pointer"
                                >
                                    {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y} className="bg-slate-900">{y}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col px-3">
                                <span className="text-[8px] text-slate-500 font-black uppercase mb-1">Sede / Obra</span>
                                <select 
                                    value={selectedExtWork}
                                    onChange={(e) => setSelectedExtWork(e.target.value)}
                                    className="bg-transparent text-blue-400 font-black text-xs outline-none cursor-pointer min-w-[200px]"
                                >
                                    {otherWorks.map(w => <option key={w} value={w} className="bg-slate-900">{w}</option>)}
                                </select>
                            </div>
                            <button 
                                onClick={() => {
                                    const name = prompt("Nombre de la nueva Sede/Obra:");
                                    if (name && !otherWorks.includes(name)) {
                                        const updated = [...otherWorks, name];
                                        setOtherWorks(updated);
                                        setSelectedExtWork(name);
                                    }
                                }}
                                className="ml-2 p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all"
                                title="Añadir nueva obra"
                            >
                                <RefreshCw size={14} className="rotate-45" /> 
                            </button>
                        </div>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="px-4 py-1.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">{selectedExtWork} • {selectedExtYear}</span>
                            </div>
                            <button 
                                onClick={() => {
                                    if (confirm(`¿Eliminar la sede "${selectedExtWork}" y todos sus registros asociados?`)) {
                                        const updated = otherWorks.filter(w => w !== selectedExtWork);
                                        setOtherWorks(updated);
                                        if (updated.length > 0) setSelectedExtWork(updated[0]);
                                    }
                                }}
                                className="text-[8px] text-red-500/50 hover:text-red-500 font-black uppercase transition-colors"
                            >
                                Eliminar Sede
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {MONTHS.map((mName, mIdx) => {
                                const fileKey = `${selectedExtWork}-${selectedExtYear}-${mIdx}`;
                                const fileName = externalFiles[fileKey];
                                
                                return (
                                    <div key={mIdx} className="group/item flex flex-col gap-2 p-4 bg-slate-950/40 rounded-3xl border border-slate-800/50 hover:border-blue-500/50 transition-all duration-300">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{mName}</span>
                                            {fileName && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>}
                                        </div>
                                        
                                        <div className="mt-2">
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                id={`file-ext-${mIdx}`}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setExternalFiles(prev => ({ ...prev, [fileKey]: file.name }));
                                                    }
                                                }}
                                            />
                                            <label 
                                                htmlFor={`file-ext-${mIdx}`}
                                                className={`w-full py-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${fileName 
                                                    ? 'bg-emerald-500/5 border-emerald-500/30 border-solid' 
                                                    : 'bg-slate-900/30 border-slate-800 hover:border-blue-500/50'}`}
                                            >
                                                {fileName ? (
                                                    <div className="flex flex-col items-center gap-2 text-emerald-400">
                                                        <Download size={20} />
                                                        <span className="text-[7px] text-emerald-300 font-black uppercase text-center px-2 truncate max-w-full">VER REGISTRO</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 opacity-40 group-hover/item:opacity-100 transition-opacity">
                                                        <Download size={20} className="text-slate-600" />
                                                        <span className="text-[7px] text-slate-500 font-bold uppercase">SUBIR</span>
                                                    </div>
                                                )}
                                            </label>
                                        </div>

                                        {fileName && (
                                            <button 
                                                onClick={() => {
                                                    const updated = { ...externalFiles };
                                                    delete updated[fileKey];
                                                    setExternalFiles(updated);
                                                }}
                                                className="mt-1 text-[8px] text-slate-700 hover:text-red-400 font-bold uppercase transition-colors"
                                            >
                                                Quitar Archivo
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

