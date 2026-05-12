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
    const [otherWorks, setOtherWorks] = useState<any[]>([]);

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

        const savedWorks = localStorage.getItem('other_works_accident_2026');
        if (savedWorks) {
            try { setOtherWorks(JSON.parse(savedWorks)); } catch (e) {}
        }

        setIsLoaded(true);
    }, []);

    // Save to LocalStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('accidentability_stats_2026', JSON.stringify(data));
        }
    }, [data, isLoaded]);

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
    const totalT = getTotal('T'); // Sum of workers usually implies average, but for annual 'Totals' in these sheets, it implies accumulation or snapshot. 
    // IF Annual = (Total ACDP * 1M) / Total HP
    const totalIF = totalHP > 0 ? (totalACDP * 1000000) / totalHP : 0;
    const totalIS = totalHP > 0 ? (totalTDP * 1000000) / totalHP : 0;
    const totalIA = (totalIF * totalIS) / 1000;

    // Using Max or Average for Workers (T)? Usually Average is used for annual rates.
    // Let's use Average T for annual rates if T varies.
    // However, simplistic total column usually just sums. But for Rate calculations:
    const avgT = totalT > 0 ? totalT / 12 : 0; // Rough calc if T is entered every month
    // If T is 0 in some months, we should maybe filter? 
    // Let's calculate stats based on the Sums for checking (as per standard practice).

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
                            {/* 1. ENFERMEDADES OCUPACIONALES */}
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Nº Enfermedades Ocupacionales (EO)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'EO')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('EO')}</td>
                            </tr>
                            {/* 2. ESTADOS PRE PATOLOGICOS */}
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Nº Estados Pre patológicos (EP)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'EP')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('EP')}</td>
                            </tr>
                            {/* 3. TRABAJADORES */}
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Nº Trabajadores (T)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'T')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('T')}</td>
                            </tr>
                            {/* 4. CANCER */}
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Nº Trabajadores con Cáncer Prof.</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'Cancer')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('Cancer')}</td>
                            </tr>
                            {/* 5. HORAS HOMBRE */}
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Horas hombre trabajadas (HP)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'HP')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('HP')}</td>
                            </tr>

                            {/* SEPARATOR */}
                            <tr className="bg-slate-950/30"><td colSpan={15} className="h-2"></td></tr>

                            {/* 6. ACCIDENTES LEVES */}
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Nº Accidentes Leves (AL)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'AL')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('AL')}</td>
                            </tr>
                            {/* 7. INCIDENTES LEVES */}
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Nº Incidentes Leves</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'IncLeves')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('IncLeves')}</td>
                            </tr>
                            {/* 8. INCIDENTES PELIGROSOS */}
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Nº Incidentes Peligrosos</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'IncPelig')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('IncPelig')}</td>
                            </tr>

                            {/* SEPARATOR */}
                            <tr className="bg-slate-950/30"><td colSpan={15} className="h-2"></td></tr>

                            {/* 9. ACCIDENTES INCAPACITANTES (CALCULATED) */}
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
                            {/* 10. ATT */}
                            <tr>
                                <td className="p-2 border border-slate-700 text-slate-400 pl-6 sticky left-0 bg-slate-900">Total Temporal (ATT)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'ATT')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('ATT')}</td>
                            </tr>
                            {/* 11. APP */}
                            <tr>
                                <td className="p-2 border border-slate-700 text-slate-400 pl-6 sticky left-0 bg-slate-900">Parcial Permanente (APP)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'APP')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('APP')}</td>
                            </tr>
                            {/* 12. ATP */}
                            <tr>
                                <td className="p-2 border border-slate-700 text-slate-400 pl-6 sticky left-0 bg-slate-900">Total Permanente (ATP)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'ATP')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('ATP')}</td>
                            </tr>

                            {/* 13. MORTALES */}
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900 text-red-400">Nº Accidentes Mortales (AM)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'AM')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50 text-red-500">{getTotal('AM')}</td>
                            </tr>

                            {/* 14. TOTAL DIAS PERDIDOS (ACDP) - Wait image says ACDP = AI + AM but labelled 'Total Accidentes con dias perdidos'. logic suggests ACDP = AI + AM (count) not days. TDP is days. */}
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

                            {/* 15. TDP */}
                            <tr>
                                <td className="p-2 border border-slate-700 font-medium sticky left-0 bg-slate-900">Total Días Perdidos (TDP)</td>
                                <td className="p-2 border border-slate-700 text-center text-[10px] text-slate-500">...</td>
                                {renderMonthCells('input', 'TDP')}
                                <td className="p-2 border border-slate-700 text-center font-bold bg-slate-800/50">{getTotal('TDP')}</td>
                            </tr>

                            {/* SEPARATOR INDICES */}
                            <tr className="bg-emerald-900/20"><td colSpan={15} className="h-4 border-l border-r border-slate-700"></td></tr>

                            {/* 16. INDICE FRECUENCIA */}
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

                            {/* 17. INDICE SEVERIDAD */}
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

                            {/* 18. INDICE ACCIDENTABILIDAD */}
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

                            {/* 19. TASA INCIDENCIA ENF */}
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

                            {/* 20. FREC PRE PAT */}
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

                {/* SECCIÓN: REGISTROS DE OBRAS EXTERNAS */}
                <div className="mt-12 bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                <RefreshCw className="text-blue-400" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Accidentabilidad de Obras Externas</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Registros mensuales de otros frentes de trabajo en desarrollo</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                const name = prompt("Nombre de la nueva Obra:");
                                if (name) {
                                    const newWork = { id: Date.now(), name, files: {} };
                                    const updated = [...otherWorks, newWork];
                                    setOtherWorks(updated);
                                    localStorage.setItem('other_works_accident_2026', JSON.stringify(updated));
                                }
                            }}
                            className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20 active:scale-95 border border-blue-400/20"
                        >
                            + Registrar Obra
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {otherWorks.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-slate-800/50 rounded-[2rem] bg-slate-900/20">
                                <p className="text-slate-600 text-xs font-black uppercase tracking-[0.2em] italic">No hay registros de obras externas</p>
                                <p className="text-[9px] text-slate-700 uppercase font-bold mt-2">Usa el botón superior para añadir un nuevo proyecto</p>
                            </div>
                        ) : (
                            otherWorks.map((work) => (
                                <div key={work.id} className="bg-slate-950/40 rounded-[2rem] border border-slate-800/50 p-6 hover:border-blue-500/30 transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => {
                                                if (confirm(`¿Eliminar permanentemente los registros de "${work.name}"?`)) {
                                                    const updated = otherWorks.filter(w => w.id !== work.id);
                                                    setOtherWorks(updated);
                                                    localStorage.setItem('other_works_accident_2026', JSON.stringify(updated));
                                                }
                                            }}
                                            className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                        >
                                            <RefreshCw size={14} className="rotate-45" /> 
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-wider">{work.name}</h4>
                                    </div>

                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
                                        {MONTHS.map((mName, mIdx) => (
                                            <div key={mIdx} className="flex flex-col gap-2">
                                                <span className="text-[9px] text-slate-500 font-black uppercase text-center tracking-tighter">{mName}</span>
                                                <div className="relative">
                                                    <input 
                                                        type="file" 
                                                        className="hidden" 
                                                        id={`file-${work.id}-${mIdx}`}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const updated = otherWorks.map(w => {
                                                                    if (w.id === work.id) {
                                                                        return { ...w, files: { ...w.files, [mIdx]: file.name } };
                                                                    }
                                                                    return w;
                                                                });
                                                                setOtherWorks(updated);
                                                                localStorage.setItem('other_works_accident_2026', JSON.stringify(updated));
                                                            }
                                                        }}
                                                    />
                                                    <label 
                                                        htmlFor={`file-${work.id}-${mIdx}`}
                                                        className={`w-full aspect-square rounded-2xl border flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${work.files?.[mIdx] 
                                                            ? 'bg-emerald-500/10 border-emerald-500/50 hover:bg-emerald-500/20' 
                                                            : 'bg-slate-900/50 border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50'}`}
                                                    >
                                                        {work.files?.[mIdx] ? (
                                                            <div className="flex flex-col items-center gap-1">
                                                                <Download size={14} className="text-emerald-400" />
                                                                <span className="text-[7px] text-emerald-300 font-black uppercase text-center px-1 truncate w-full">REGISTRO</span>
                                                            </div>
                                                        ) : (
                                                            <Download size={14} className="text-slate-700 group-hover:text-blue-400/50 transition-colors" />
                                                        )}
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}




