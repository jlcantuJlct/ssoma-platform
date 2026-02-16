"use client";

import { useAuth } from '@/lib/auth';
import {
    Calendar,
    Trash2,
    Shield,
    GraduationCap,
    ClipboardCheck,
    AlertTriangle,
    Stethoscope,
    HeartPulse,
    UserPlus,
    Leaf,
    Sprout,
    Recycle,
    FileSpreadsheet,
    ChevronRight,
    Search,
    Upload,
    Plus,
    BarChart2,
    Save,
    RotateCcw,
    Edit2,
    Check
} from 'lucide-react';
import { useState, useEffect, Fragment } from 'react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Definición de Objetivos (sin cambios)
const OBJECTIVES = [
    { id: 'obj1', label: 'OBJ 01: Programas de SCSST', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'obj2', label: 'OBJ 02: Capacitación', icon: GraduationCap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'obj3', label: 'OBJ 03: Inspecciones', icon: ClipboardCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'obj4', label: 'OBJ 04: Reporte A/C Inseguras', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { id: 'obj5', label: 'OBJ 05: EMO Realizados', icon: Stethoscope, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { id: 'obj6', label: 'OBJ 06: Inspecciones de Salud', icon: HeartPulse, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { id: 'obj7', label: 'OBJ 07: Formaciones de Salud', icon: UserPlus, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { id: 'obj8', label: 'OBJ 08: Inspecciones M. Ambiente', icon: Leaf, color: 'text-green-400', bg: 'bg-green-500/10' },
    { id: 'obj9', label: 'OBJ 09: Formaciones M. Ambiente', icon: Sprout, color: 'text-lime-400', bg: 'bg-lime-500/10' },
    { id: 'obj10', label: 'OBJ 10: Control Segregación RRSS', icon: Recycle, color: 'text-teal-400', bg: 'bg-teal-500/10' },
    { id: 'obj11', label: 'OBJ 11: Control Acopios Temporales', icon: Trash2, color: 'text-amber-400', bg: 'bg-amber-500/10' },
];

const MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SET", "OCT", "NOV", "DIC"];

type ProgramItem = {
    id: number;
    date: string;
    description: string;
    status: string;
    compliance: number;
    responsible?: string;
    area?: string;
};

type ExecutedInspection = {
    id: number;
    date: string;
    inspectionType: string;
    status: string;
};

export default function ProgramPage() {
    const { user } = useAuth();
    const [selectedObjId, setSelectedObjId] = useState<string>('obj1');
    const [programData, setProgramData] = useState<Record<string, ProgramItem[]>>({});
    const [executedInspections, setExecutedInspections] = useState<ExecutedInspection[]>([]);
    const [hhcRecords, setHhcRecords] = useState<any[]>([]);
    const [evidenceRecords, setEvidenceRecords] = useState<any[]>([]); // New state for Evidence Center records
    const [newItem, setNewItem] = useState({ date: '', description: '', status: 'Pendiente', area: 'SEGURIDAD' });
    const [editingCell, setEditingCell] = useState<{ key: string, month: number, type: 'P' | 'E' } | null>(null);
    const [editValue, setEditValue] = useState("");
    const [autoReplace, setAutoReplace] = useState(false); // Default to APPEND as requested
    const [mobileView, setMobileView] = useState<'list' | 'content'>('list');

    // Carga inicial - Cloud first, then localStorage fallback
    useEffect(() => {
        const loadData = async () => {
            try {
                // 1. Load annual program from cloud
                const progRes = await fetch('/api/annual-program');
                const progData = await progRes.json();
                if (progData.success && Object.keys(progData.programData).length > 0) {
                    setProgramData(progData.programData);
                    localStorage.setItem('annual_program_data', JSON.stringify(progData.programData));
                } else {
                    const storedData = localStorage.getItem('annual_program_data');
                    if (storedData) setProgramData(JSON.parse(storedData));
                }

                // 2. Load inspections from cloud
                const inspRes = await fetch('/api/inspections');
                const inspData = await inspRes.json();
                if (inspData.success && inspData.records.length > 0) {
                    setExecutedInspections(inspData.records);
                    localStorage.setItem('inspections_records', JSON.stringify(inspData.records));
                } else {
                    const storedExecuted = localStorage.getItem('inspections_records');
                    if (storedExecuted) setExecutedInspections(JSON.parse(storedExecuted));
                }

                // 3. Load HHC from cloud
                const hhcRes = await fetch('/api/hhc-records');
                const hhcData = await hhcRes.json();
                if (hhcData.success && hhcData.records.length > 0) {
                    setHhcRecords(hhcData.records);
                    localStorage.setItem('hhc_records', JSON.stringify(hhcData.records));
                } else {
                    const storedHHC = localStorage.getItem('hhc_records');
                    if (storedHHC) setHhcRecords(JSON.parse(storedHHC));
                }

                // 4. Load Evidence (still localStorage only for now)
                const storedEvidence = localStorage.getItem('evidence_center_records');
                if (storedEvidence) setEvidenceRecords(JSON.parse(storedEvidence));

            } catch (e) {
                console.error("Error loading data from cloud, using localStorage:", e);
                // Fallback to all localStorage
                const storedData = localStorage.getItem('annual_program_data');
                if (storedData) setProgramData(JSON.parse(storedData));
                const storedExecuted = localStorage.getItem('inspections_records');
                if (storedExecuted) setExecutedInspections(JSON.parse(storedExecuted));
                const storedHHC = localStorage.getItem('hhc_records');
                if (storedHHC) setHhcRecords(JSON.parse(storedHHC));
                const storedEvidence = localStorage.getItem('evidence_center_records');
                if (storedEvidence) setEvidenceRecords(JSON.parse(storedEvidence));
            }
        };
        loadData();
    }, []);

    // PERSIST DATA - Local + Cloud sync
    useEffect(() => {
        const hasDataInMemory = Object.keys(programData).length > 0;

        if (hasDataInMemory) {
            localStorage.setItem('annual_program_data', JSON.stringify(programData));
            // Sync to cloud (fire and forget)
            fetch('/api/annual-program', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ programData })
            }).catch(e => console.warn('Annual program cloud sync failed:', e));
        }
    }, [programData]);

    // Listener para actualizaciones externas (Sincronización entre pestañas)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'inspections_records' && e.newValue) setExecutedInspections(JSON.parse(e.newValue));
            if (e.key === 'annual_program_data' && e.newValue) setProgramData(JSON.parse(e.newValue));
            if (e.key === 'hhc_records' && e.newValue) setHhcRecords(JSON.parse(e.newValue));
            if (e.key === 'evidence_center_records' && e.newValue) setEvidenceRecords(JSON.parse(e.newValue));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);


    const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                // KEY FIX: raw: false ensures we get displayed text (e.g. "ENE" from a date, or "1" from a number)
                const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false }) as any[][];

                if (worksheet.length === 0) return;

                // --- HELPER: Normalize Text ---
                const norm = (s: any) => String(s || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

                // --- 1. HEADER DETECTION (Months) ---
                let headerRowIdx = -1;
                let monthColIndices: number[] = [];
                const monthNamesShort = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SET", "OCT", "NOV", "DIC"];
                const monthNamesShortEn = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                const monthNamesFull = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SETIEMBRE", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

                // Scan first 30 rows
                for (let r = 0; r < Math.min(30, worksheet.length); r++) {
                    const row = worksheet[r].map(c => norm(c));
                    const countMatches = (list: string[]) => list.filter(m => row.some(cell => cell === m || cell.startsWith(m) || cell.includes(m))).length;

                    if (countMatches(monthNamesShort) >= 2 || countMatches(monthNamesFull) >= 2 || countMatches(monthNamesShortEn) >= 2) {
                        headerRowIdx = r;
                        break;
                    }
                }

                // Identify Indices
                if (headerRowIdx !== -1) {
                    const row = worksheet[headerRowIdx].map(c => norm(c));
                    const findMonthCol = (searchList: string[]) => searchList.map(m => row.findIndex(cell => cell === m || cell.startsWith(m) || cell.includes(m)));

                    let bestIndices = findMonthCol(monthNamesShort);
                    if (bestIndices.filter(i => i !== -1).length < 2) bestIndices = findMonthCol(monthNamesFull);
                    monthColIndices = bestIndices;
                }

                const isMatrix = headerRowIdx !== -1 && monthColIndices.some(i => i !== -1);
                const newRecords: ProgramItem[] = [];

                if (isMatrix) {
                    const headers = worksheet[headerRowIdx].map(h => norm(h));

                    // Detect Plan/Type Column
                    const planIndex = headers.findIndex(h => h.includes('PLAN') || h.includes('TIPO') || h.includes('ESTADO'));

                    // Detect Description Column
                    let descIndex = headers.findIndex(h => h.includes('DESC') || h.includes('ACTIVIDAD') || h.includes('TEMA') || h.includes('ITEM') || h.includes('ASPECTO'));

                    if (descIndex === -1) {
                        if (planIndex !== -1 && planIndex <= 1) descIndex = planIndex === 0 ? 1 : 0;
                        else descIndex = 0;
                    }

                    let lastDescription = "";

                    worksheet.slice(headerRowIdx + 1).forEach((row, rowIndex) => {
                        const normalizedRow = row.map(c => norm(c));

                        // A) Filter out "Executed" rows
                        if (planIndex !== -1 && row[planIndex]) {
                            const typeVal = normalizedRow[planIndex];
                            if (typeVal.includes('EJECUTADO') || typeVal.includes('REAL') || typeVal === 'E' || typeVal.includes('CUMPLI')) return;
                        }

                        // B) Get Description
                        let description = row[descIndex];
                        if (description && String(description).trim().length > 1 && !norm(description).match(/^\d+$/)) {
                            lastDescription = String(description).trim();
                        } else if (lastDescription) {
                            description = lastDescription;
                        }

                        if (!description || String(description).trim() === "") return;

                        const descUpper = norm(description);
                        let area = 'SEGURIDAD';
                        if (descUpper.includes('SALUD') || descUpper.includes('MEDICO') || descUpper.includes('ERGONO') || descUpper.includes('PSICOSOCIAL')) area = 'SALUD';
                        else if (descUpper.includes('AMBIENTE') || descUpper.includes('RESIDUO') || descUpper.includes('COMBUSTIBLE')) area = 'MEDIO AMBIENTE';

                        // D) Read Month Data
                        monthColIndices.forEach((colIdx, monthIndex) => {
                            if (colIdx === -1) return;
                            const val = row[colIdx];
                            // Parse int from the specific cell string
                            const numEvents = parseInt(String(val || '0').replace(/\D/g, ''));

                            if (!isNaN(numEvents) && numEvents > 0) {
                                for (let i = 0; i < numEvents; i++) {
                                    const monthStr = String(monthIndex + 1).padStart(2, '0');
                                    newRecords.push({
                                        id: Date.now() + rowIndex * 1000 + monthIndex * 100 + i + Math.random(),
                                        date: `2025-${monthStr}-15`,
                                        description: String(description).trim(),
                                        status: 'Pendiente',
                                        compliance: 0,
                                        area: area
                                    });
                                }
                            }
                        });
                    });

                } else {
                    // --- 2. HEURISTIC LIST LOGIC ---
                    const stats: { dateScore: number, textScore: number }[] = [];
                    const maxCols = 20;
                    for (let i = 0; i < maxCols; i++) stats[i] = { dateScore: 0, textScore: 0 };
                    const sampleSize = Math.min(worksheet.length, 50);

                    for (let r = 0; r < sampleSize; r++) {
                        const row = worksheet[r];
                        if (!row) continue;
                        row.forEach((cell, colIdx) => {
                            if (colIdx >= maxCols) return;
                            if (cell === undefined || cell === null) return;
                            const valStr = norm(cell); // now checking string representation

                            if (valStr.match(/^\d{5}$/)) stats[colIdx].dateScore += 2; // Excel serial as string
                            else if (valStr.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/)) stats[colIdx].dateScore += 2;
                            else if (valStr.match(/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/)) stats[colIdx].dateScore += 2;
                            else if (["ENE", "FEB", "MAR", "APR", "DEC", "JAN", "AUG"].some(m => valStr.startsWith(m))) stats[colIdx].dateScore += 1;

                            if (!valStr.match(/^\d+$/) && valStr.length > 5 && valStr.length < 200) stats[colIdx].textScore++;
                        });
                    }

                    let bestDateCol = -1, maxDateScore = 0;
                    stats.forEach((s, i) => { if (s.dateScore > maxDateScore) { maxDateScore = s.dateScore; bestDateCol = i; } });

                    let bestDescCol = -1, maxDescScore = 0;
                    stats.forEach((s, i) => { if (i !== bestDateCol && s.textScore > maxDescScore) { maxDescScore = s.textScore; bestDescCol = i; } });

                    let dateColIdx = bestDateCol !== -1 ? bestDateCol : 0;
                    let descColIdx = bestDescCol !== -1 ? bestDescCol : 1;
                    if (dateColIdx === descColIdx) descColIdx = dateColIdx + 1;

                    worksheet.forEach((row, index) => {
                        if (index < 5 && bestDateCol !== -1) {
                            const val = row[dateColIdx];
                            if (val && !String(val).match(/\d/)) return;
                        }
                        const dateVal = row[dateColIdx];
                        const descVal = row[descColIdx];
                        if (!descVal) return;

                        let dateStr = "";
                        const stringVal = norm(dateVal);

                        // Handle stringified dates/numbers
                        if (stringVal.match(/^\d{5}$/)) { // Serial
                            const d = new Date(Math.round((parseInt(stringVal) - 25569) * 86400 * 1000));
                            if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
                        } else if (stringVal.match(/^\d{4}-\d{2}-\d{2}/)) {
                            dateStr = stringVal.substring(0, 10);
                        } else if (stringVal.match(/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/)) {
                            const parts = stringVal.split(/[\/-]/);
                            let y = parts[2] || '2025';
                            if (y.length === 2) y = "20" + y;
                            dateStr = `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                        } else {
                            const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SET", "OCT", "NOV", "DIC"];
                            const monthsFull = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SETIEMBRE", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
                            let mIdx = months.findIndex(m => stringVal.startsWith(m));
                            if (mIdx === -1) mIdx = monthsFull.findIndex(m => stringVal.startsWith(m));
                            if (mIdx !== -1) dateStr = `2025-${String((mIdx % 12) + 1).padStart(2, '0')}-15`;
                        }

                        if (dateStr && String(descVal).trim()) {
                            let area = 'SEGURIDAD';
                            const dUp = norm(descVal);
                            if (dUp.includes('SALUD') || dUp.includes('MEDICO') || dUp.includes('ERGONOM') || dUp.includes('PSICOSOCIAL')) area = 'SALUD';
                            else if (dUp.includes('AMBIENTE') || dUp.includes('RESIDUO') || dUp.includes('COMBUSTIBLE')) area = 'MEDIO AMBIENTE';

                            newRecords.push({
                                id: Date.now() + index + Math.random(),
                                date: dateStr,
                                description: String(descVal).trim(),
                                status: 'Pendiente',
                                compliance: 0,
                                area: area
                            });
                        }
                    });
                }

                if (newRecords.length > 0) {
                    setProgramData(prev => {
                        if (autoReplace) {
                            return { ...prev, [selectedObjId]: newRecords.sort((a, b) => a.date.localeCompare(b.date)) };
                        } else {
                            const current = prev[selectedObjId] || [];
                            return { ...prev, [selectedObjId]: [...current, ...newRecords].sort((a, b) => a.date.localeCompare(b.date)) };
                        }
                    });
                    const count = newRecords.length;
                    alert(autoReplace
                        ? `✅ CARGA EXITOSA (REEMPLAZO): ${count} registros importados.`
                        : `✅ CARGA EXITOSA (AGREGADO): ${count} registros importados.`);
                } else {
                    const hint = isMatrix ? "Formato Matriz detectado pero 0 registros creados." : "No se detectó formato Matriz ni Lista.";
                    alert(`⚠️ ALERTA: ${hint}\nSugerencia: Revisar que los meses tengan valores numéricos y la columna 'Plan' no diga 'Ejecutado' en todas las filas.`);
                }
            } catch (error) {
                console.error(error);
                alert("❌ ERROR: El archivo no pudo ser leído. Guarde como CSV UTF-8 o Excel Estándar.");
            }
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    const handleClearAll = () => {
        if (confirm('⚠️ ¿Estás seguro de eliminar TODOS los datos de este objetivo?')) {
            const emptyData = { ...programData, [selectedObjId]: [] };
            setProgramData(emptyData);
            localStorage.setItem('annual_program_data', JSON.stringify(emptyData));
        }
    };

    const handleCellEdit = (desc: string, monthIdx: number, currentVal: number, area: string) => {
        setEditingCell({ key: desc + area, month: monthIdx, type: 'P' });
        setEditValue(String(currentVal));
    };

    const saveCellEdit = (desc: string, monthIdx: number, area: string) => {
        const newVal = parseInt(editValue);
        if (isNaN(newVal) || newVal < 0) {
            setEditingCell(null);
            return;
        }
        // Calculation logic...
        const currentList = programData[selectedObjId] || [];
        const others = currentList.filter(item => {
            const m = new Date(item.date).getMonth();
            return !(item.description === desc && m === monthIdx && (item.area === area || !item.area));
        });
        const newItems: ProgramItem[] = [];
        for (let i = 0; i < newVal; i++) {
            const mStr = String(monthIdx + 1).padStart(2, '0');
            newItems.push({
                id: Date.now() + i + Math.random(),
                date: `2025-${mStr}-15`,
                description: desc,
                status: 'Pendiente',
                compliance: 0,
                area: area
            });
        }
        setProgramData(prev => ({
            ...prev,
            [selectedObjId]: [...others, ...newItems].sort((a, b) => a.date.localeCompare(b.date))
        }));
        setEditingCell(null);
    };

    const handleManualAdd = () => {
        if (!newItem.date || !newItem.description) return;
        const record = { id: Date.now(), ...newItem, compliance: 0 };
        setProgramData(prev => ({ ...prev, [selectedObjId]: [...(prev[selectedObjId] || []), record].sort((a, b) => a.date.localeCompare(b.date)) }));
        setNewItem({ ...newItem, description: '' });
    };
    const handleDelete = (id: number) => setProgramData(prev => ({ ...prev, [selectedObjId]: prev[selectedObjId].filter(i => i.id !== id) }));

    const currentObj = OBJECTIVES.find(o => o.id === selectedObjId);

    // Generate Matrix Data
    const getMatrixData = () => {
        const currentList = programData[selectedObjId] || [];
        const grouped: Record<string, Record<string, { programmed: number[], executed: number[] }>> = {};

        // Pre-initialize preferred order
        const baseAreas = ['SEGURIDAD', 'MEDIO AMBIENTE', 'SALUD'];
        baseAreas.forEach(a => grouped[a] = {});

        currentList.forEach(item => {
            let area = (item.area || 'SEGURIDAD').toUpperCase();

            // Map to base area or fallback to OTROS
            let key = baseAreas.find(a => area.includes(a));
            if (!key) {
                key = 'OTROS';
                if (!grouped['OTROS']) grouped['OTROS'] = {};
            }

            if (!grouped[key][item.description]) {
                grouped[key][item.description] = { programmed: new Array(12).fill(0), executed: new Array(12).fill(0) };
            }

            // Robust Month Parsing (Expects YYYY-MM-DD)
            let m = -1;
            if (item.date && typeof item.date === 'string' && item.date.includes('-')) {
                const parts = item.date.split('-'); // [YYYY, MM, DD]
                if (parts.length === 3) {
                    m = parseInt(parts[1]) - 1;
                }
            }
            // Fallback for Date objects or other formats
            if (m === -1) {
                try {
                    const d = new Date(item.date);
                    if (!isNaN(d.getTime())) m = d.getMonth();
                } catch (e) { }
            }

            if (m >= 0 && m <= 11) grouped[key][item.description].programmed[m]++;
        });

        executedInspections.forEach(exec => {
            const m = new Date(exec.date).getMonth();
            if (m < 0 || m > 11) return;
            // Add executed counts to matching descriptions across all areas
            for (const areaKey in grouped) {
                if (grouped[areaKey][exec.inspectionType]) {
                    grouped[areaKey][exec.inspectionType].executed[m]++;
                }
            }
        });

        // 3. Map HHC Records (Data from Control HHC - Obj 2 mostly)
        hhcRecords.forEach(hhc => {
            const m = new Date(hhc.date).getMonth();
            if (m < 0 || m > 11) return;

            // Try to find matching program entry
            for (const areaKey in grouped) {
                // Check if hhc.tema matches any description
                const match = Object.keys(grouped[areaKey]).find(desc => {
                    const d = desc.toLowerCase();
                    const t = (hhc.tema || '').toLowerCase();
                    return d === t || d.includes(t) || t.includes(d);
                });

                if (match) {
                    grouped[areaKey][match].executed[m]++;
                }
            }
        });

        // 4. Map Evidence Center Records (NEW)
        evidenceRecords.forEach(ev => {
            // Filter by current objective (e.g. "OBJ 01")
            const currentObjLabel = currentObj?.label || '';
            // ev.objective is like "OBJ 01", label is like "OBJ 01: ..."
            if (!ev.objective || !currentObjLabel.startsWith(ev.objective)) return;

            let m = -1;
            // Parse date "YYYY-MM-DD"
            if (ev.date && typeof ev.date === 'string') {
                const parts = ev.date.split('-');
                if (parts.length === 3) m = parseInt(parts[1]) - 1;
                else {
                    const d = new Date(ev.date);
                    if (!isNaN(d.getTime())) m = d.getMonth();
                }
            }

            if (m < 0 || m > 11) return;

            // Helper para normalizar strings (elimina acentos, minúsculas, espacios)
            const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

            for (const areaKey in grouped) {
                // Match Activity (ev.description) with Matrix Description
                const match = Object.keys(grouped[areaKey]).find(desc => {
                    const dNorm = normalize(desc);
                    const tNorm = normalize(ev.description || '');

                    // 1. Coincidencia Directa
                    if (dNorm === tNorm) return true;

                    // 2. Coincidencia por Palabras (Bidirectional Subset logic)
                    // Ignoramos palabras cortas <= 2 letras para filtrar "de", "el", "y" (pero manteniendo "emo", "epp", etc si son > 2)
                    // Usamos Set para palabras únicas
                    const getWords = (s: string) => s.split(/\s+/).filter(w => w.length > 2);

                    const dWords = getWords(dNorm);
                    const tWords = getWords(tNorm);

                    if (dWords.length === 0 || tWords.length === 0) return false;

                    // Función para verificar si un set de palabras está contenido en otro (fuzzy)
                    const isSubset = (subset: string[], superset: string[]) => {
                        return subset.every(subWord => {
                            // subWord debe coincidir con alguna palabra del superset
                            return superset.some(superWord =>
                                superWord.includes(subWord) || subWord.includes(superWord)
                            );
                        });
                    };

                    // MATCH si Program contiene a Evidence (o viceversa)
                    // Esto maneja:
                    // - Singular/Plural ("Examen" contenido en "Examenes")
                    // - Palabras extra ("Examen Medico" contenido en "Examen Medico Anual")
                    // - PERO falla si hay palabras conflictivas ("RRSS" no está en "RRPP")
                    return isSubset(dWords, tWords) || isSubset(tWords, dWords);
                });

                if (match) {
                    grouped[areaKey][match].executed[m]++;
                }
            }
        });

        return grouped;
    };

    const matrixData = getMatrixData();

    // CSS GRID LAYOUT CONSTANTS
    // Columns: [Area/Desc 25%] [Type 4%] [12 Months equal fraction]
    // 100% - 29% = 71% / 12 = ~5.9%
    // Using Grid template columns for absolute precision

    return (
        <div className="relative h-full flex flex-col md:flex-row bg-slate-950 overflow-hidden">
            {/* SIDEBAR */}
            <div className={`w-full md:w-80 bg-slate-900/50 border-r border-slate-800 flex-shrink-0 flex-col h-full overflow-hidden ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}`}>
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-black text-white px-2 flex items-center gap-2">
                        <Calendar className="text-emerald-500" />
                        Programa 2025
                    </h2>
                    <p className="text-xs text-slate-500 px-2 mt-1">Selecciona un objetivo estratégico</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
                    {OBJECTIVES.map(obj => {
                        const ItemIcon = obj.icon;
                        const isSelected = selectedObjId === obj.id;
                        const count = (programData[obj.id] || []).length;
                        return (
                            <button
                                key={obj.id}
                                onClick={() => {
                                    setSelectedObjId(obj.id);
                                    setMobileView('content');
                                }}
                                className={`w-full text-left p-3 rounded-xl transition-all border group relative overflow-hidden ${isSelected ? 'bg-slate-800 border-emerald-500/50 shadow-lg' : 'bg-slate-950/50 border-transparent hover:bg-slate-800 text-slate-400'}`}
                            >
                                <div className="flex items-start gap-3 relative z-10">
                                    <div className={`p-2 rounded-lg ${isSelected ? obj.bg + ' ' + obj.color : 'bg-slate-900 text-slate-500'}`}><ItemIcon size={18} /></div>
                                    <div className="flex-1">
                                        <h3 className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${isSelected ? 'text-white' : ''}`}>{obj.label.split(':')[0]}</h3>
                                        <p className={`text-[11px] font-medium leading-tight ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>{obj.label.split(':')[1]}</p>
                                    </div>
                                    {count > 0 && <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 rounded text-slate-500">{count}</span>}
                                </div>
                                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className={`flex-1 flex-col h-full bg-[url('/grid.svg')] bg-center overflow-hidden relative ${mobileView === 'content' ? 'flex' : 'hidden md:flex'}`}>
                <div className="p-6 md:p-8 pb-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setMobileView('list')}
                                className="md:hidden p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white border border-slate-700"
                            >
                                <ChevronRight className="rotate-180" size={20} />
                            </button>
                            <div>
                                <span className="text-emerald-500 font-bold tracking-widest text-xs uppercase mb-1 block">Gestión de Programa</span>
                                <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                                    {currentObj?.label.split(':')[1]}
                                </h1>
                            </div>
                            <div className="flex items-center gap-4">
                                {/* Checkbox de Reemplazo */}
                                <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-800">
                                    <input
                                        type="checkbox"
                                        id="replace-mode"
                                        checked={autoReplace}
                                        onChange={e => setAutoReplace(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-offset-0 focus:ring-emerald-500 bg-slate-800 cursor-pointer"
                                    />
                                    <label htmlFor="replace-mode" className="text-xs text-slate-400 cursor-pointer select-none font-medium">
                                        Reemplazar datos al cargar
                                    </label>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleClearAll}
                                        className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2.5 rounded-xl font-bold text-xs border border-red-500/20 transition-all active:scale-95"
                                    >
                                        <RotateCcw size={16} />
                                        Limpiar
                                    </button>
                                    <div className="relative">
                                        <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelImport} className="hidden" id="excel-import-btn" />
                                        <label htmlFor="excel-import-btn" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white pl-4 pr-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all border border-indigo-400/20 active:scale-95">
                                            <Upload size={18} />
                                            Cargar Excel
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* VISTA MATRIZ UNIVERSAL - GRID LAYOUT */}
                    <div className="flex-1 overflow-auto px-6 md:px-8 pb-8">
                        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden min-w-[1000px]">
                            {/* Grid Container ÚNICO */}
                            <div className="grid grid-cols-[25%_4%_repeat(12,1fr)] bg-slate-900/50 text-xs">

                                {/* Header Row ÚNICO */}
                                <div className="col-span-14 grid grid-cols-subgrid bg-slate-950 text-slate-400 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
                                    <div className="px-4 py-2 border-r border-slate-800 flex items-center text-[10px]">ACTIVIDAD</div>
                                    <div className="px-1 py-1 text-center border-r border-slate-800 flex items-center justify-center text-[9px]">TIPO</div>
                                    {MONTHS.map(m => (
                                        <div key={m} className="px-1 py-1 text-center border-r border-slate-800 flex items-center justify-center text-[10px]">{m}</div>
                                    ))}
                                </div>

                                {/* Body Rows */}
                                {matrixData && Object.keys(matrixData).map((area) => {
                                    const areaItems = matrixData[area];
                                    if (Object.keys(areaItems).length === 0) return null;

                                    return Object.entries(areaItems).map(([desc, data], idx) => (
                                        <Fragment key={`${area}-${idx}`}>
                                            {/* Row Group: Programmed & Executed */}
                                            {/* Description Cell: Spans 2 Rows vertically */}
                                            <div className="row-span-2 px-4 py-2 border-r border-b border-slate-800 font-bold text-slate-200 flex items-center bg-slate-900/30">
                                                <div className="whitespace-normal leading-tight text-[11px] text-balance" title={desc}>{desc}</div>
                                            </div>

                                            {/* Programmed Row */}
                                            <div className="h-[32px] font-black text-center bg-slate-800/50 text-emerald-400 border-r border-b border-slate-800 flex items-center justify-center">P</div>
                                            {data.programmed.map((c, i) => {
                                                const isEditing = editingCell?.key === desc + area && editingCell?.month === i && editingCell?.type === 'P';
                                                return (
                                                    <div
                                                        key={`p-${i}`}
                                                        className={`h-[32px] border-r border-b border-slate-800/50 flex items-center justify-center cursor-pointer transition-colors ${c > 0 ? 'text-white font-bold bg-slate-800/50' : 'text-slate-700 hover:bg-slate-800/50'}`}
                                                        onClick={() => !isEditing && handleCellEdit(desc, i, c, area)}
                                                    >
                                                        {isEditing ? (
                                                            <input
                                                                autoFocus
                                                                className="w-full h-full bg-slate-950 text-white text-center border border-emerald-500 rounded-none text-[10px] focus:outline-none"
                                                                value={editValue}
                                                                onChange={e => setEditValue(e.target.value)}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') saveCellEdit(desc, i, area);
                                                                    if (e.key === 'Escape') setEditingCell(null);
                                                                }}
                                                                onBlur={() => saveCellEdit(desc, i, area)}
                                                            />
                                                        ) : (c > 0 ? c : '-')}
                                                    </div>
                                                );
                                            })}

                                            {/* Executed Row */}
                                            <div className="h-[32px] font-black text-center bg-slate-800/50 text-blue-400 border-r border-b border-slate-950 flex items-center justify-center">E</div>
                                            {data.executed.map((c, i) => (
                                                <div key={`e-${i}`} className={`h-[32px] border-r border-b border-slate-950 flex items-center justify-center font-bold ${c > 0 ? 'text-white bg-blue-500/20' : 'text-slate-800'}`}>
                                                    {c > 0 ? c : '-'}
                                                </div>
                                            ))}
                                        </Fragment>
                                    ));
                                })}
                            </div>

                            {/* Empty State */}
                            {Object.values(matrixData || {}).every(g => Object.keys(g).length === 0) && (
                                <div className="p-12 text-center text-slate-500">
                                    <FileSpreadsheet size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No hay datos cargados para {currentObj?.label.split(':')[1]}.</p>
                                    <p className="text-xs mt-2">Carga un Excel con fechas y descripciones para visualizar el programa.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
