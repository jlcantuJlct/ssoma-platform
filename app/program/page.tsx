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
    Check,
    X,
    ExternalLink,
    Image as ImageIcon,
    Settings
} from 'lucide-react';
import { useState, useEffect, Fragment } from 'react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import SearchableSelect from '@/components/SearchableSelect';

// Definición de Objetivos y Seguimiento
const OBJECTIVES = [
    { id: 'obj1', label: 'OBJ 01: Programas de SCSST', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'obj2', label: 'OBJ 02: Capacitación', icon: GraduationCap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'obj3', label: 'OBJ 03: Inspecciones', icon: ClipboardCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'obj4', label: 'OBJ 04: Reporte A/C Inseguras', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { id: 'obj5', label: 'OBJ 05: EMO Realizados', icon: Stethoscope, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    // --- SEGUIMIENTO ---
    { id: 'obj6', label: 'SEG 01: Inspecciones de Salud', icon: HeartPulse, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { id: 'obj7', label: 'SEG 02: Formaciones de Salud', icon: UserPlus, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { id: 'obj8', label: 'SEG 03: Inspecciones M. Ambiente', icon: Leaf, color: 'text-green-400', bg: 'bg-green-500/10' },
    { id: 'obj9', label: 'SEG 04: Formaciones M. Ambiente', icon: Sprout, color: 'text-lime-400', bg: 'bg-lime-500/10' },
    { id: 'obj10', label: 'SEG 05: Control de Simulacros', icon: Settings, color: 'text-teal-400', bg: 'bg-teal-500/10' },
    { id: 'obj11', label: 'SEG 06: Brigadistas', icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10' },
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
    const [evidenceRecords, setEvidenceRecords] = useState<any[]>([]); 
    const [pmaRecords, setPmaRecords] = useState<any[]>([]); 
    const [atsRecords, setAtsRecords] = useState<any[]>([]);
    const [petarRecords, setPetarRecords] = useState<any[]>([]);
    const [detourRecords, setDetourRecords] = useState<any[]>([]);
    const [simulacroRecords, setSimulacroRecords] = useState<any[]>([]);
    const [brigadistaRecords, setBrigadistaRecords] = useState<any[]>([]);
    const [newItem, setNewItem] = useState({ date: '', description: '', status: 'Pendiente', area: 'SEGURIDAD' });
    const [editingCell, setEditingCell] = useState<{ key: string, month: number, type: 'P' | 'E' } | null>(null);
    const [editValue, setEditValue] = useState("");
    const [autoReplace, setAutoReplace] = useState(false); // Default to APPEND as requested
    const [mobileView, setMobileView] = useState<'list' | 'content'>('list');
    const [selectedRecords, setSelectedRecords] = useState<{ activity: string, month: string, records: any[] } | null>(null);
    const [sendingObs, setSendingObs] = useState<number | null>(null); // Track which record index is being observed
    const [reconfigRecord, setReconfigRecord] = useState<{ index: number, category: string, subtype: string } | null>(null);

    const RECONFIG_CATEGORIES = [
        { id: 'Control de ATS', label: 'Control de ATS' },
        { id: 'Control de PETAR', label: 'Control de PETAR' },
        { id: 'Control de HHC', label: 'Control de HHC' },
        { id: 'Control de Inspecciones', label: 'Control de Inspecciones' },
        { id: 'PMA', label: 'PMA' },
        { id: 'Desvíos', label: 'Desvíos' },
    ];

    const RECONFIG_SUBTYPES: Record<string, string[]> = {
        'Control de ATS': ['ATS'],
        'Control de PETAR': ['Caliente', 'Altura', 'Excavacion', 'Espacio Confinado', 'Izaje'],
        'Control de HHC': [
            'INDUCCIÓN (4H)',
            'IND. ESPECÍFICA (8H)',
            'CAPACITACIÓN (1H)',
            'DIFUSIÓN (30 MIN)',
            'ENTRENAMIENTO (30 MIN)',
            'CHARLA (15 MIN)'
        ],
        'Control de Inspecciones': [
            "Inspecciones y observaciones maquinaria Línea amarilla (Excavadoras, retro, cargador, tractor, moto niveladora, cisterna de agua) F-OP-015 V02 22.12.16 Maquinaria Pesada",
            "Inspecciones y observaciones vehículos (Volquetes, camionetas, camiones.) F-OP-010 V02 22.12.16 Vehiculos",
            "Inspección de Equipos de Emergencia (Extintores) F-SIG-058 Registro de inspección de equipos de seguridad o emergencia",
            "Inspección de Herramientas manuales y eléctricas (F-OP-019) Verificación de Herramientas Manuales, Eléctricas y Equipos Portátiles",
            "Inspección de generador, tableros eléctrico F-SIG-075 Inspeccion de Instalaciones Eléctricas V01",
            "Inspección de EPP básico o especifico (Cantidad refiere a la cantidad de personas) F-SIG-044 Inspección de EPP V03",
            "Inspección de Señalización Vial (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
            "Inspección de vías de acceso y bermas de seguridad plataformas de descarga de material (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
            "Inspección de Señalización de Obra (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
            "Inspección de almacenes F-SIG-028 Inspeccion Almacén V09",
            "Inspección del almacén de productos químicos F-SIG-028 Inspeccion Almacén V09",
            "Inspección de orden y limpieza de áreas de trabajo (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
            "Inspeccion de laboratorio F-SIG-077 INSPECCIÓN DE LABORATORIO",
            "Inspeccion de planta de asfalto LISTA DE CHEQUEO DE PLANTA DE ASFALTO",
            "Inspeccion de planta de concreto LISTA DE CHEQUEO DE PLANTA DE CONCRETO",
            "Inspeccion de planta de Chancado LISTA DE CHEQUEO DE PLANTA DE AGREGADOS",
            "Inspección de taller de soldadura/ mecanico F-SIG-079 Inspección de Talleres V02",
            "Inspección de escalera o andamios F-OP-001 CHECK LIST DE ANDAMIOS F-OP-018 INSPECCIÓN DE ESCALERAS",
            "Inspección de Equipo contra caídas (arnés, línea de vida, etc.) F-OP-017 INSPECCIÓN DE EQUIPOS CONTRA CAIDA",
            "Inspecciones botiquines F-SIG-030 INSPECCIÓN DE BOTIQUÍN",
            "Inspecciones Estaciones de emergencia (F-SIG-008) INSPECCIÓN DE ESTACIÒN DE PRIMEROS AUXILIOS",
            "Inspección de puntos de hidratacion (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
            "Inspección punto de proteccion solar (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
            "Inspección de lavaderos de SSHH y mano (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
            "Inspección de Cocina y comedor F-SIG-074 INSPECCIÓN DE COCINA Y COMEDOR",
            "Inspección de EPP Inspección de EPP Seguimiento de observacion medica F-SIG-044 Inspección de EPP V03",
            "Inspección de Topico (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
            "Inspección de Alcotest (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
            "Inspección de señalización de salud (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
            "Inspección de EPP Ligado a Enf. Ocupacionales F-SIG-044 Inspección de EPP V03",
            "Inspecciones de estaciones de residuos por colores (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
            "Inspecciones de almacén de acopio temporal de residuos solidos (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
            "Inspecciones de la segregacion (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
            "Inspección de controles de polucion. (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
            "Inspección de controles de ruido. (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
            "Inspección de Kit antiderrames F-SIG-076 INSPECCION DE KIT ANTIDERRAME",
            "Inspección de Señalización Medio ambiental (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
            "Inspección de trampas de grasa de talleres (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
            "Inspección de almacén de acopio temporal de residuos peligrosos (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente",
            "Inspección de limpieza de accesos y vías (F-SIG-073) Inspección Interna Seguridad, Salud en el trabajo y Medio Ambiente"
        ],
        'PMA': [
            "1. Foto de señalización SST",
            "2. Foto de señalización MA",
            "3. Foto de Delimitación de áreas y Perímetros",
            "1. Foto de baños",
            "2. Foto de limpieza de baños",
            "3. Foto de Lavado de Manos",
            "4. Foto Punto de Hidratación",
            "5. Foto de comedor",
            "6. Foto de Limpieza de Comedor",
            "7. Foto de vestuario",
            "1. Foto de segregación de residuos",
            "2. Foto del vehículo de residuos",
            "3. Foto de almacenamiento de residuos",
            "4. Foto de pesado de residuos",
            "5. Foto de estación de RRSS",
            "6. Foto de kit contra derrames",
            "1. Foto de: Las mangueras de las cisternas cuentan con cabezal.",
            "2. Foto de: Las cisternas cuentan con kit antiderrame",
            "3. Foto de: Los vehículos no ingresan al curso de agua",
            "1. Foto de bloqueado",
            "2. Foto de Uso de EPP: Tapones",
            "3. Foto de Uso de EPP: Guantes",
            "4. Foto de Uso de EPP: Lentes",
            "5. Foto de Uso de EPP: Arnés",
            "6. Foto de Uso de EPP: Respirador",
            "7. Foto de Entrega de EPP",
            "8. Foto de revisión Documentos",
            "9. Foto de Maquinarias con silenciador",
            "1. Foto de Vehículo de Emergencia",
            "2. Foto de Tópico y su especialista de Salud",
            "3. Foto de Directorio telefónico de emergencia.",
            "4. Foto de Flujograma de Comunicación de emergencia",
            "5. Foto de Flujograma de atención de emergencia"
        ],
        'Desvíos': [
            "Foto señalización según PTP Sur",
            "Foto señalización según PTP Norte",
            "Foto Vigias Día",
            "Foto Vigias Noche",
            "Foto de flecha luminosa",
            "Foto delineadores",
            "Foto Canalizadores",
            "Limpieza de señalización",
            "Foto de reposición de señalización",
            "Foto de pintado de Giba y/o líneas",
            "Foto de limpieza de desvío"
        ],
    };

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

                // 4. Load Evidence from cloud
                const evRes = await fetch('/api/evidence-records');
                const evData = await evRes.json();
                if (evData.success && evData.records.length > 0) {
                    setEvidenceRecords(evData.records);
                    localStorage.setItem('evidence_center_records', JSON.stringify(evData.records));
                } else {
                    const storedEvidence = localStorage.getItem('evidence_center_records');
                    if (storedEvidence) setEvidenceRecords(JSON.parse(storedEvidence));
                }

                // 5. Load PMA from cloud
                const pmaRes = await fetch('/api/pma-records');
                const pmaData = await pmaRes.json();
                if (pmaData.success && pmaData.records.length > 0) {
                    setPmaRecords(pmaData.records);
                    localStorage.setItem('pma_records', JSON.stringify(pmaData.records));
                }

                // 6. Load ATS from cloud
                const atsRes = await fetch('/api/ats-records');
                const atsData = await atsRes.json();
                if (atsData.success) setAtsRecords(atsData.records);

                // 7. Load PETAR from cloud
                const petarRes = await fetch('/api/petar-records');
                const petarData = await petarRes.json();
                if (petarData.success) setPetarRecords(petarData.records);

                // 8. Load Desvios from cloud
                const detourRes = await fetch('/api/desvio-records');
                const detourData = await detourRes.json();
                if (detourData.success) setDetourRecords(detourData.records);

                // 9. Load Simulacros from cloud
                const simRes = await fetch('/api/simulacro-records');
                const simData = await simRes.json();
                if (simData.success) setSimulacroRecords(simData.records);

                // 10. Load Brigadistas from cloud
                const briRes = await fetch('/api/brigadista-records');
                const briData = await briRes.json();
                if (briData.success) setBrigadistaRecords(briData.records);

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
                const storedPMA = localStorage.getItem('pma_records');
                if (storedPMA) setPmaRecords(JSON.parse(storedPMA));
            }
        };
        loadData();
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // HANDLE OBSERVATION (NO CONFORME)
    // ─────────────────────────────────────────────────────────────────────────
    const handleObserveRecord = async (rec: any, index: number) => {
        if (!selectedRecords) return;
        
        const confirmObs = window.confirm(`¿Estás seguro de marcar como NO CONFORME y alertar a ${rec.responsible || rec.responsable}?`);
        if (!confirmObs) return;

        setSendingObs(index);
        try {
            const currentObj = OBJECTIVES.find(o => o.id === selectedObjId);
            const res = await fetch('/api/program/observe-record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    responsibleName: rec.responsible || rec.responsable,
                    documentName: rec.inspectionType || rec.tema || rec.description || rec.activity || 'Documento sin nombre',
                    month: selectedRecords.month,
                    activity: selectedRecords.activity,
                    currentObjective: currentObj?.label
                })
            });

            const data = await res.json();
            if (data.success) {
                alert(`✅ Alerta enviada con éxito a ${data.sendedTo} vía WhatsApp y Correo.`);
            } else {
                alert(`❌ Error: ${data.error}`);
            }
        } catch (error) {
            console.error("Error sending observation:", error);
            alert("❌ Ocurrió un error al enviar la alerta.");
        } finally {
            setSendingObs(null);
        }
    };

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
        const grouped: Record<string, Record<string, { programmed: number[], executed: number[], executionRecords: Record<number, any[]> }>> = {};

        // Helper para normalizar strings (elimina acentos, minúsculas, espacios)
        const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const getWords = (s: string) => s.split(/\s+/).filter(w => w.length > 2);
        const isSubset = (subset: string[], superset: string[]) => {
            return subset.every(subWord => {
                return superset.some(superWord =>
                    superWord.includes(subWord) || subWord.includes(superWord)
                );
            });
        };

        const getMonthFromStr = (dateStr: any) => {
            if (!dateStr || typeof dateStr !== 'string') return -1;
            // Robust parsing YYYY-MM-DD or DD/MM/YYYY
            if (dateStr.includes('-')) {
                const parts = dateStr.split('-');
                if (parts.length >= 2) return parseInt(parts[1]) - 1;
            }
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length >= 2) return parseInt(parts[1]) - 1;
            }
            // Fallback for native Date objects stringified
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? -1 : d.getMonth();
        };

        const findMatch = (areaKey: string, searchStr: string) => {
            const tNorm = normalize(searchStr || '');
            const tWords = getWords(tNorm);
            if (tWords.length === 0) return null;

            return Object.keys(grouped[areaKey]).find(desc => {
                const dNorm = normalize(desc);
                // 1. Coincidencia Directa
                if (dNorm === tNorm) return true;

                // 2. Coincidencia por Palabras (Bidirectional Subset logic)
                const dWords = getWords(dNorm);
                if (dWords.length === 0) return false;

                return isSubset(dWords, tWords) || isSubset(tWords, dWords);
            });
        };

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
                grouped[key][item.description] = { 
                    programmed: new Array(12).fill(0), 
                    executed: new Array(12).fill(0),
                    executionRecords: {}
                };
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

        // 2. Map Executed Inspections
        executedInspections.forEach(exec => {
            const m = getMonthFromStr(exec.date);
            if (m < 0 || m > 11) return;

            for (const areaKey in grouped) {
                const match = findMatch(areaKey, exec.inspectionType);
                if (match) {
                    grouped[areaKey][match].executed[m]++;
                    if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                    grouped[areaKey][match].executionRecords[m].push({ ...exec, _type: 'INSPECTION' });
                }
            }
        });

        // 3. Map HHC Records
        hhcRecords.forEach(hhc => {
            const m = getMonthFromStr(hhc.date);
            if (m < 0 || m > 11) return;

            for (const areaKey in grouped) {
                const match = findMatch(areaKey, hhc.tema);
                if (match) {
                    grouped[areaKey][match].executed[m]++;
                    if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                    grouped[areaKey][match].executionRecords[m].push({ ...hhc, _type: 'HHC' });
                }
            }
        });

        // 4. Map Evidence Center Records (EMOs, Segregación, etc.)
        evidenceRecords.forEach(ev => {
            const currentObjLabel = currentObj?.label || '';
            const objIdNum = selectedObjId.replace('obj', '');
            const isMatch = ev.objective && (
                currentObjLabel.startsWith(ev.objective) || 
                ev.objective.includes(objIdNum.padStart(2, '0'))
            );
            if (!isMatch) return;

            const m = getMonthFromStr(ev.date);
            if (m < 0 || m > 11) return;

            for (const areaKey in grouped) {
                const match = findMatch(areaKey, ev.description || ev.activity);
                if (match) {
                    grouped[areaKey][match].executed[m]++;
                    if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                    grouped[areaKey][match].executionRecords[m].push({ ...ev, _type: 'EVIDENCE' });
                }
            }
        });

        // 5. Map PMA Records (Objective 08 - Photos)
        pmaRecords.forEach(pma => {
            const currentObjLabel = currentObj?.label || '';
            if (!currentObjLabel.includes('08')) return; // Solo para Medio Ambiente (OBJ 08 o SEG 03)

            const m = getMonthFromStr(pma.date);
            if (m < 0 || m > 11) return;

            for (const areaKey in grouped) {
                const match = findMatch(areaKey, pma.category || pma.description);
                if (match) {
                    grouped[areaKey][match].executed[m]++;
                    if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                    grouped[areaKey][match].executionRecords[m].push({ ...pma, _type: 'PMA' });
                }
            }
        });

        // 6. Map ATS Records
        atsRecords.forEach(ats => {
            const m = getMonthFromStr(ats.date);
            if (m < 0 || m > 11) return;

            for (const areaKey in grouped) {
                const match = findMatch(areaKey, 'ATS' || ats.location);
                if (match) {
                    grouped[areaKey][match].executed[m]++;
                    if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                    grouped[areaKey][match].executionRecords[m].push({ ...ats, _type: 'ATS' });
                }
            }
        });

        // 7. Map PETAR Records
        petarRecords.forEach(petar => {
            const m = getMonthFromStr(petar.date);
            if (m < 0 || m > 11) return;

            for (const areaKey in grouped) {
                const match = findMatch(areaKey, petar.type || 'PETAR');
                if (match) {
                    grouped[areaKey][match].executed[m]++;
                    if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                    grouped[areaKey][match].executionRecords[m].push({ ...petar, _type: 'PETAR' });
                }
            }
        });

        // 8. Map Desvío Records
        detourRecords.forEach(det => {
            const m = getMonthFromStr(det.date);
            if (m < 0 || m > 11) return;

            for (const areaKey in grouped) {
                const match = findMatch(areaKey, det.category || 'Desvío');
                if (match) {
                    grouped[areaKey][match].executed[m]++;
                    if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                    grouped[areaKey][match].executionRecords[m].push({ ...det, _type: 'DETOUR' });
                }
            }
        });

        // 9. Map Simulacro Records
        simulacroRecords.forEach(sim => {
            const m = getMonthFromStr(sim.date);
            if (m < 0 || m > 11) return;

            for (const areaKey in grouped) {
                const match = findMatch(areaKey, sim.type || 'Simulacro');
                if (match) {
                    grouped[areaKey][match].executed[m]++;
                    if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                    grouped[areaKey][match].executionRecords[m].push({ ...sim, _type: 'SIMULACRO' });
                }
            }
        });

        // 10. Map Brigadista Records
        brigadistaRecords.forEach(bri => {
            const m = getMonthFromStr(bri.date);
            if (m < 0 || m > 11) return;

            for (const areaKey in grouped) {
                const match = findMatch(areaKey, bri.type || 'Brigadista');
                if (match) {
                    grouped[areaKey][match].executed[m]++;
                    if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                    grouped[areaKey][match].executionRecords[m].push({ ...bri, _type: 'BRIGADISTA' });
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
            <div className={`flex-1 flex flex-col h-full bg-[url('/grid.svg')] bg-center overflow-hidden relative ${mobileView === 'content' ? 'flex' : 'hidden md:flex'}`}>
                <div className="flex flex-col h-full p-6 md:p-8 pb-4">
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
                    <div className="flex-1 overflow-auto px-6 md:px-8 pb-8 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden min-w-[1200px]">
                            {/* Grid Container ÚNICO */}
                            <div className="grid grid-cols-[25%_4%_repeat(12,1fr)] bg-slate-900/50 text-xs">

                                {/* Header Row ÚNICO */}
                                <div className="col-span-14 grid grid-cols-subgrid bg-slate-950 text-slate-400 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
                                    <div className="px-4 py-2 border-r border-slate-800 flex items-center text-[10px] sticky left-0 z-20 bg-slate-950">ACTIVIDAD</div>
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
                                            <div className="row-span-2 px-4 py-2 border-r border-b border-slate-800 font-bold text-slate-200 flex items-center bg-slate-900 sticky left-0 z-10">
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
                                                <div 
                                                    key={`e-${i}`} 
                                                    onClick={() => c > 0 && setSelectedRecords({ 
                                                        activity: desc, 
                                                        month: MONTHS[i], 
                                                        records: data.executionRecords[i] || [] 
                                                    })}
                                                    className={`h-[32px] border-r border-b border-slate-950 flex items-center justify-center font-bold transition-all ${c > 0 ? 'text-white bg-blue-500/20 hover:bg-blue-500/40 cursor-pointer' : 'text-slate-800'}`}
                                                >
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
            {/* Traceability Modal */}
            {selectedRecords && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => { setSelectedRecords(null); setReconfigRecord(null); }} />
                    <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Evidencias de Ejecución</h3>
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{selectedRecords.activity} • {selectedRecords.month}</p>
                            </div>
                            <button onClick={() => { setSelectedRecords(null); setReconfigRecord(null); }} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
                            {selectedRecords.records.map((rec, ri) => (
                                <div key={ri} className="space-y-3">
                                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex items-center justify-between group hover:border-blue-500/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <ClipboardCheck size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white capitalize">{rec.responsible || rec.responsable || 'Sin responsable'}</p>
                                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{rec.date}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        {(rec.evidencePdf || rec.pdfUrl || (rec.file_url && rec.file_type?.includes('pdf'))) && (
                                            <a 
                                                href={rec.evidencePdf || rec.pdfUrl || rec.file_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-500/20 transition-all"
                                            >
                                                <ExternalLink size={12} />
                                                VER PDF
                                            </a>
                                        )}
                                        {((rec.evidenceImgs && rec.evidenceImgs.length > 0) || (rec.images && rec.images.length > 0) || (rec.file_url && (rec.file_type?.includes('image') || rec.file_type?.includes('jpg') || rec.file_type?.includes('png')))) && (
                                            <button 
                                                onClick={() => {
                                                    const imgUrl = (rec.evidenceImgs && rec.evidenceImgs.length > 0) ? rec.evidenceImgs[0] : 
                                                                  (rec.images && rec.images.length > 0) ? rec.images[0] : rec.file_url;
                                                    window.open(imgUrl, '_blank');
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-blue-400 rounded-lg text-[10px] font-bold border border-blue-500/20 transition-all"
                                            >
                                                <ImageIcon size={12} />
                                                FOTOS {(rec.evidenceImgs || rec.images) ? `(${(rec.evidenceImgs || rec.images).length})` : ''}
                                            </button>
                                        )}
                                        <button 
                                            disabled={sendingObs === ri}
                                            onClick={() => handleObserveRecord(rec, ri)}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                                sendingObs === ri 
                                                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                                                : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
                                            }`}
                                        >
                                            {sendingObs === ri ? (
                                                <RotateCcw size={12} className="animate-spin" />
                                            ) : (
                                                <AlertTriangle size={12} />
                                            )}
                                            {sendingObs === ri ? 'ENVIANDO...' : 'NO CONFORME'}
                                        </button>

                                        {/* BOTÓN RECONFIGURAR (NUEVO) */}
                                        <button 
                                            onClick={() => setReconfigRecord(reconfigRecord?.index === ri ? null : { index: ri, category: '', subtype: '' })}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                                reconfigRecord?.index === ri
                                                ? 'bg-amber-500 text-white border-amber-400'
                                                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                                            }`}
                                        >
                                            <Settings size={12} />
                                            RECONFIGURAR
                                        </button>
                                    </div>
                                </div>

                                {/* PANEL DE RECONFIGURACIÓN (DESPLEGABLE) */}
                                {reconfigRecord?.index === ri && (
                                    <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 mt-2 animate-in slide-in-from-top-2 duration-200 min-h-[350px]">
                                        <div className="flex flex-col md:flex-row gap-4 items-end">
                                            <div className="flex-1 space-y-2">
                                                <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-1">Nueva Categoría</label>
                                                <select 
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 transition-colors"
                                                    value={reconfigRecord.category}
                                                    onChange={(e) => setReconfigRecord({ ...reconfigRecord, category: e.target.value, subtype: '' })}
                                                >
                                                    <option value="">Seleccione Categoría...</option>
                                                    {RECONFIG_CATEGORIES.map(cat => (
                                                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {reconfigRecord.category && RECONFIG_SUBTYPES[reconfigRecord.category] && (
                                                <div className="flex-1 space-y-2">
                                                    <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-1">Nuevo Tipo / Tema</label>
                                                    <SearchableSelect
                                                        options={RECONFIG_SUBTYPES[reconfigRecord.category]}
                                                        value={reconfigRecord.subtype}
                                                        onChange={(val) => setReconfigRecord({ ...reconfigRecord, subtype: val })}
                                                        placeholder="Seleccione Tipo..."
                                                        className="text-white"
                                                    />
                                                </div>
                                            )}

                                            <button 
                                                disabled={!reconfigRecord.category || (!reconfigRecord.subtype && RECONFIG_SUBTYPES[reconfigRecord.category])}
                                                className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs px-6 py-2 rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-95"
                                                onClick={async () => {
                                                    const rec = selectedRecords.records[ri];
                                                    const confirm = window.confirm(`¿Estás seguro de REDIRECCIONAR este registro a ${reconfigRecord.category} > ${reconfigRecord.subtype}?`);
                                                    if (!confirm) return;

                                                    try {
                                                        const res = await fetch('/api/reconfigure', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                record: rec,
                                                                targetCategory: reconfigRecord.category,
                                                                targetSubtype: reconfigRecord.subtype
                                                            })
                                                        });
                                                        const data = await res.json();
                                                        if (data.success) {
                                                            alert(`✅ Registro redireccionado con éxito.`);
                                                            window.location.reload(); // Simple refresh to update all states
                                                        } else {
                                                            alert(`❌ Error: ${data.error}`);
                                                        }
                                                    } catch (err) {
                                                        alert(`❌ Error de conexión`);
                                                    }
                                                    setReconfigRecord(null);
                                                }}
                                            >
                                                REDIRECCIONAR
                                            </button>
                                        </div>
                                    </div>
                                )}
                                    
                                    {!rec.evidencePdf && !rec.pdfUrl && !rec.file_url && (!rec.evidenceImgs || rec.evidenceImgs.length === 0) && (!rec.images || rec.images.length === 0) && (
                                        <div className="px-4 pb-2 text-center">
                                            <span className="text-[10px] text-slate-600 font-medium italic">Sin archivos adjuntos</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <div className="p-4 bg-slate-950 text-center border-t border-slate-800">
                            <p className="text-[10px] text-slate-500">Se muestran {selectedRecords.records.length} registros encontrados para este mes.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
