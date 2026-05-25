"use client";

import { useEffect, useState } from "react";
import { Download, Save, RefreshCw, Upload, FileText, Calendar, User, MapPin, X, Trash2, Folder, Plus } from "lucide-react";
import * as XLSX from 'xlsx';
import { useAuth, USER_LIST } from '@/lib/auth';
import { uploadEvidence } from '@/lib/uploadClient';
import { SSOMA_LOCATIONS } from '@/lib/locations';
import SearchableSelect from '@/components/SearchableSelect';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getDriveViewerUrl, generateFilename } from "@/lib/utils";
import PreviewCarouselModal from "@/components/PreviewCarouselModal";
import BatchDownloadZip from "@/components/BatchDownloadZip";

// Constants
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const FULL_MONTHS = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
const EVENT_TYPES = ["Accidente Leve", "Incidente Leve", "Incidente Peligroso", "Accidente Incapacitante", "Accidente Mortal", "Enfermedad Ocupacional"];

// Types
type MonthlyData = {
    [key: string]: number[]; // array of 12 numbers
};

export default function ReportsPage() {
    const { user } = useAuth();
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
    const [selectedExtYear, setSelectedExtYear] = useState<number>(new Date().getFullYear());
    const [externalFiles, setExternalFiles] = useState<Record<string, string>>({});

    // Documents State
    const [docs, setDocs] = useState<any[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [isAddingDoc, setIsAddingDoc] = useState(false);
    const [isSavingDoc, setIsSavingDoc] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const currentMonthIndex = new Date().getMonth();
    
    const [viewingEvidence, setViewingEvidence] = useState<any>(null);
    
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        month: FULL_MONTHS[currentMonthIndex],
        type: '',
        description: '',
        responsable: user?.name || 'Usuario SSOMA',
        zona: SSOMA_LOCATIONS[0],
    });

    // Load from LocalStorage and DB
    useEffect(() => {
        const saved = localStorage.getItem(`accidentability_stats_${selectedExtYear}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setData({ ...initialData, ...parsed });
            } catch (e) {
                console.error("Error parsing stats", e);
            }
        } else {
             setData(initialData);
        }
        
        const savedWorks = localStorage.getItem('other_works_list_v4');
        if (savedWorks) {
            try { setOtherWorks(JSON.parse(savedWorks)); } catch (e) {}
        }

        const savedFiles = localStorage.getItem('other_works_files_v4');
        if (savedFiles) {
            try { setExternalFiles(JSON.parse(savedFiles)); } catch (e) {}
        }

        fetchDocs();
        setIsLoaded(true);
    }, [selectedExtYear]);

    const fetchDocs = async () => {
        setLoadingDocs(true);
        try {
            const res = await fetch('/api/accidentabilidad-records');
            const data = await res.json();
            if (data.success) {
                setDocs(data.records);
            }
        } catch (e) {}
        setLoadingDocs(false);
    };

    // Save Data
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(`accidentability_stats_${selectedExtYear}`, JSON.stringify(data));
            localStorage.setItem('other_works_list_v4', JSON.stringify(otherWorks));
            localStorage.setItem('other_works_files_v4', JSON.stringify(externalFiles));
        }
    }, [data, otherWorks, externalFiles, isLoaded, selectedExtYear]);

    const handleChange = (key: string, monthIndex: number, value: string) => {
        const numVal = Number(value) || 0;
        setData(prev => {
            const newData = { ...prev };
            newData[key] = [...prev[key]];
            newData[key][monthIndex] = numVal;
            return newData;
        });
    };

    const handleSaveDoc = async () => {
        if (!formData.month || !formData.type || uploadedFiles.length === 0) {
            alert('Por favor complete todos los campos y cargue el documento.');
            return;
        }

        setIsSavingDoc(true);
        try {
            const newRecord = {
                id: Date.now(),
                ...formData,
                fileUrls: uploadedFiles,
            };

            const allRecords = [...docs, newRecord];
            
            const res = await fetch('/api/accidentabilidad-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: allRecords })
            });

            if (res.ok) {
                setIsAddingDoc(false);
                setFormData({ ...formData, description: '', type: '' });
                setUploadedFiles([]);
                fetchDocs();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSavingDoc(false);
        }
    };

    const handleDeleteDoc = async (id: any) => {
        if (!confirm('¿Eliminar registro?')) return;
        try {
            const updated = docs.filter(r => r.id !== id);
            await fetch('/api/accidentabilidad-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: updated })
            });
            fetchDocs();
        } catch (error) {}
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

        const AI = ATT + APP + ATP;
        const ACDP = AI + AM;

        const IF = HP > 0 ? (ACDP * 1000000) / HP : 0;
        const IS = HP > 0 ? (TDP * 1000000) / HP : 0;
        const IA = (IF * IS) / 1000;
        const TasaIncidencia = T > 0 ? (EO * 1000) / T : 0;
        const FreqPrePat = T > 0 ? (EP * 1000) / T : 0;

        return { AI, ACDP, IF, IS, IA, TasaIncidencia, FreqPrePat };
    };

    // Accumulators
    const getTotal = (key: string) => (data[key] || []).reduce((a, b) => a + b, 0);

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
        XLSX.writeFile(wb, `Estadistica_Accidentabilidad_${selectedExtYear}.xlsx`);
    };

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
                <div className="flex items-center gap-4">
                    <select 
                        value={selectedExtYear}
                        onChange={(e) => setSelectedExtYear(Number(e.target.value))}
                        className="bg-slate-950 border border-slate-800 text-white font-bold text-sm outline-none px-4 py-2 rounded-xl"
                    >
                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <button
                        onClick={handleExport}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/20"
                    >
                        <Download size={16} /> Exportar Excel
                    </button>
                    <BatchDownloadZip 
                        records={docs}
                        getUrls={(r) => r.fileUrls || []}
                        getFilename={(r, i, total) => {
                            const ext = r.fileUrls[i].toLowerCase().includes('pdf') ? 'pdf' : 'jpg';
                            return generateFilename(r.type || 'Registro', r.date, r.responsable, ext, 'accidente', r.zona, 'SEGURIDAD').replace(/\.[^/.]+$/, "") + (total > 1 ? `_parte${i+1}` : "") + `.${ext}`;
                        }}
                        zipName={`Registros_Accidentabilidad_${selectedExtYear}.zip`}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg hover:shadow-blue-500/20"
                    />
                </div>
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

                {/* SECCIÓN: CARGA DE DOCUMENTOS DE ACCIDENTES */}
                <div className="mt-12 bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/5 blur-[120px] rounded-full -mr-32 -mt-32"></div>
                    
                    <div className="flex flex-col lg:flex-row items-center justify-between mb-10 gap-6 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-900/40">
                                <FileText className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Registro de Accidentes / Incidentes</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Soporte documental para la matriz estadística</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => setIsAddingDoc(!isAddingDoc)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center gap-2"
                        >
                            {isAddingDoc ? <X size={20} /> : <Plus size={20} />}
                            {isAddingDoc ? 'Cancelar' : 'Subir Registro'}
                        </button>
                    </div>

                    {isAddingDoc && (
                        <Card className="bg-slate-900 border-slate-800 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden rounded-3xl mb-8">
                            <CardHeader className="border-b border-slate-800 bg-slate-800/30">
                                <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <Upload size={18} className="text-emerald-500" />
                                    Nuevo Registro de Evento
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Mes del Evento</label>
                                        <SearchableSelect 
                                            options={FULL_MONTHS}
                                            value={formData.month}
                                            onChange={(val) => setFormData({...formData, month: val})}
                                            placeholder="Seleccione el mes..."
                                        />
                                    </div>

                                    <div className="space-y-2 lg:col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Tipo de Evento</label>
                                        <SearchableSelect 
                                            options={EVENT_TYPES}
                                            value={formData.type}
                                            onChange={(val) => setFormData({...formData, type: val})}
                                            placeholder="Seleccione tipo..."
                                        />
                                    </div>

                                    <div className="space-y-2 lg:col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Ubicación / Proyecto</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-3 top-3 text-emerald-500/50" size={16} />
                                            <select 
                                                value={formData.zona}
                                                onChange={(e) => setFormData({...formData, zona: e.target.value})}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-emerald-500 outline-none"
                                            >
                                                <option value="">Seleccionar Lugar...</option>
                                                {SSOMA_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Fecha del Suceso</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-3 text-slate-500" size={16} />
                                            <input 
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-3 space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                                            Archivo de Registro (Arrastra PDFs)
                                        </label>
                                        <div 
                                            onDragOver={(e) => { e.preventDefault(); if (!isUploading) setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={async (e) => {
                                                e.preventDefault();
                                                setIsDragging(false);
                                                if (isUploading) return;
                                                
                                                const files = Array.from(e.dataTransfer.files);
                                                if (files.length === 0) return;

                                                setIsUploading(true);
                                                try {
                                                    for (const file of files) {
                                                        const url = await uploadEvidence(
                                                            file, 'Accidentabilidad', formData.type || 'ACCIDENTE', formData.date, formData.responsable, 'ACCIDENTES', 'SEGURIDAD', formData.zona, 'DOCS'
                                                        );
                                                        setUploadedFiles(prev => [...prev, url]);
                                                    }
                                                } catch (err: any) {
                                                    alert(`Error al subir: ${err.message}`);
                                                } finally {
                                                    setIsUploading(false);
                                                }
                                            }}
                                            className={`relative border-2 border-dashed rounded-3xl p-10 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group ${
                                                isUploading ? 'border-amber-500 bg-amber-500/5' :
                                                isDragging ? 'border-emerald-500 bg-emerald-500/10' : 
                                                uploadedFiles.length > 0 ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700'
                                            }`}
                                        >
                                            <input 
                                                type="file" multiple disabled={isUploading}
                                                onChange={async (e) => {
                                                    const files = Array.from(e.target.files || []);
                                                    if (files.length === 0) return;
                                                    
                                                    setIsUploading(true);
                                                    try {
                                                        for (const file of files) {
                                                            const url = await uploadEvidence(
                                                                file, 'Accidentabilidad', formData.type || 'ACCIDENTE', formData.date, formData.responsable, 'ACCIDENTES', 'SEGURIDAD', formData.zona, 'DOCS'
                                                            );
                                                            setUploadedFiles(prev => [...prev, url]);
                                                        }
                                                    } catch (err: any) {
                                                        alert(`Error al subir: ${err.message}`);
                                                    } finally {
                                                        setIsUploading(false);
                                                    }
                                                }}
                                                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-wait"
                                            />
                                            <div className={`p-4 rounded-2xl ${isUploading ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 group-hover:text-emerald-400'}`}>
                                                {isUploading ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={32} />}
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-black uppercase text-white">{isUploading ? `SUBIENDO... ${uploadProgress.total > 1 ? `(${uploadProgress.current}/${uploadProgress.total})` : ''}` : 'ARRASTRA O HAZ CLIC AQUÍ'}</p>
                                            </div>
                                        </div>

                                        {/* Preview files */}
                                        {uploadedFiles.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-4">
                                                {uploadedFiles.map((url, idx) => (
                                                    <div key={idx} className="bg-slate-950 px-3 py-2 rounded-2xl border border-slate-800 flex items-center gap-3">
                                                        <FileText size={14} className="text-emerald-400" />
                                                        <span className="text-[10px] font-bold text-slate-300">Archivo #{idx + 1}</span>
                                                        <button onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))} className="text-slate-600 hover:text-red-400">
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Descripción / Notas</label>
                                        <textarea 
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-emerald-500 outline-none h-20 resize-none mt-2"
                                        />
                                    </div>

                                    <div className="md:col-span-3 flex justify-end pt-4">
                                        <button 
                                            disabled={isSavingDoc || isUploading}
                                            onClick={handleSaveDoc}
                                            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                        >
                                            {isSavingDoc ? 'Guardando...' : 'Registrar Evento'}
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {docs.length === 0 ? (
                                <div className="col-span-full text-center py-10 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                    No hay registros documentales subidos
                                </div>
                            ) : docs.map(rec => (
                                <Card key={rec.id} className="bg-slate-950 border-slate-800 hover:border-emerald-500/30 transition-all">
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 font-black flex items-center justify-center text-xs">
                                                    <FileText size={16} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-sm">{rec.type || 'Registro'}</h3>
                                                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                        <Calendar size={10} /> {rec.month} - {rec.date}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button 
                                                    onClick={() => setViewingEvidence(rec)}
                                                    className="p-1.5 bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-lg transition-all"
                                                >
                                                    <FileText size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteDoc(rec.id)}
                                                    className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mb-2">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-600 uppercase">Responsable</p>
                                                <p className="text-[10px] text-slate-300 truncate">{rec.responsable}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-600 uppercase">Zona</p>
                                                <p className="text-[10px] text-slate-300 truncate">{rec.zona}</p>
                                            </div>
                                        </div>
                                        {rec.description && (
                                            <div className="pt-2 border-t border-slate-800/50">
                                                <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Descripción</p>
                                                <p className="text-[10px] text-slate-400 line-clamp-2">{rec.description}</p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
            {viewingEvidence && (
                <PreviewCarouselModal
                    isOpen={!!viewingEvidence}
                    onClose={() => setViewingEvidence(null)}
                    fileUrls={viewingEvidence.fileUrls || []}
                    title={`Evidencias - ${viewingEvidence.type || 'Registro'}`}
                    recordId={viewingEvidence.id}
                    tableName="accidentabilidad-records"
                    onUpdateUrls={async (newUrls) => {
                        const updatedDocs = docs.map((d: any) => 
                            d.id === viewingEvidence.id ? { ...d, fileUrls: newUrls } : d
                        );
                        setDocs(updatedDocs);
                        setViewingEvidence({ ...viewingEvidence, fileUrls: newUrls });
                        await fetch('/api/accidentabilidad-records', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ records: updatedDocs })
                        });
                    }}
                />
            )}
        </div>
    );
}
