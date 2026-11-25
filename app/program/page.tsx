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
    CheckSquare,
    Square,
    X,
    ExternalLink,
    Image as ImageIcon,
    Settings,
    Siren,
    Users,
    Loader2,
    Cloud,
    Download,
    FileUp,
    FolderOpen,
    LayoutDashboard,
    ArrowUpRight,
    CheckCircle2,
    Filter,
    Activity,
    Layers,
    TrendingUp,
    Sparkles,
    Building2
} from 'lucide-react';
import { useState, useEffect, Fragment, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import SearchableSelect from '@/components/SearchableSelect';
import TrainingSubprogramsSection from '@/components/TrainingSubprogramsSection';
import { 
    TrainingSubprogram, 
    DEFAULT_SUBPROGRAM_CAP_SEGURIDAD,
    DEFAULT_SUBPROGRAM_CAP_SALUD,
    DEFAULT_SUBPROGRAM_CAP_MA,
    DEFAULT_SUBPROGRAM_CAP_BRIGADISTAS,
    DEFAULT_SUBPROGRAM_CAP_SCSST,
    DEFAULT_SUBPROGRAM_GENERAL, 
    DEFAULT_SUBPROGRAM_BRIGADISTAS, 
    matchHhcRecordsForTopic, 
    parseTrainingExcelFile 
} from '@/lib/trainingSubprogramsData';
import InspectionsSubprogramsSection from '@/components/InspectionsSubprogramsSection';
import {
    InspectionSubprogram,
    DEFAULT_SUBPROGRAM_INSPECCIONES_SEGURIDAD,
    DEFAULT_SUBPROGRAM_INSPECCIONES_MA,
    DEFAULT_SUBPROGRAM_INSPECCIONES_SALUD,
    DEFAULT_SUBPROGRAM_INSPECCIONES_SCSST,
    parseInspectionExcelFile
} from '@/lib/inspectionsSubprogramsData';

// Definición de Objetivos Oficiales (F-SIG-023 CASA V02)
const OBJECTIVES = [
    { id: 'obj1', label: 'OBJ 01: Participación y SCSST', fullTitle: '1. Asegurar la consulta, participación e información activa de los trabajadores y sus representantes', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'obj2', label: 'OBJ 02: Capacitación y Entrenamiento', fullTitle: '2. Asegurar la formación, capacitación y entrenamiento de los trabajadores en seguridad', icon: GraduationCap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { id: 'obj3', label: 'OBJ 03: Inspecciones de Seguridad', fullTitle: '3. Reducir y corregir la cantidad de condiciones inseguras mediante inspecciones continuas', icon: ClipboardCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { id: 'obj4', label: 'OBJ 04: Control de Peligros y RAC', fullTitle: '4. Identificar y evaluar permanentemente los peligros y controlar los riesgos en el origen', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { id: 'obj5', label: 'OBJ 05: Vigilancia de Salud y EMO', fullTitle: '5. Identificar y realizar el seguimiento al personal con enfermedades ocupacionales (Vigilancia de Salud)', icon: Stethoscope, color: 'text-pink-400', bg: 'bg-pink-500/10' },
    { id: 'obj6', label: 'OBJ 06: Emergencias y Simulacros', fullTitle: '6. Garantizar la preparación y respuesta oportuna ante emergencias en obra', icon: Siren, color: 'text-teal-400', bg: 'bg-teal-500/10' },
    { id: 'obj7', label: 'OBJ 07: Gestión Ambiental y PMA', fullTitle: '7. Asegurar el cumplimiento ambiental, manejo de residuos sólidos y Plan de Manejo Ambiental (PMA)', icon: Leaf, color: 'text-green-400', bg: 'bg-green-500/10' },
    { id: 'obj8', label: 'OBJ 08: Requisitos Legales SSTMA', fullTitle: '8. Garantizar el cumplimiento y actualización de la matriz de requisitos legales aplicables en seguridad, salud ocupacional y medio ambiente.', icon: Shield, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { id: 'obj9', label: 'OBJ 09: Mejora Continua y Auditorías', fullTitle: '9. Promover y ejecutar acciones de mejora continua derivados de inspecciones, auditorías, incidentes y revisiones del sistema de gestión SSTMA.', icon: GraduationCap, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
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
    tipo?: 'capacitacion' | 'inspeccion' | 'otro';
};

type ExecutedInspection = {
    id: number;
    date: string;
    inspectionType: string;
    status: string;
};

export default function ProgramPage() {
    const { user, switchWorkspace } = useAuth();
    const [selectedObjId, setSelectedObjId] = useState<string>('all');
    const [selectedMonitorMonths, setSelectedMonitorMonths] = useState<number[]>(() => {
        const m = new Date().getMonth();
        return [isNaN(m) ? 10 : m]; // Default to current month or Nov
    });
    const activeMonitorMonth = selectedMonitorMonths[0] ?? 0;
    const periodLabel = useMemo(() => {
        if (selectedMonitorMonths.length === 0) return 'Ningún mes';
        if (selectedMonitorMonths.length === 12) return 'Todo el Año (12 Meses)';
        if (selectedMonitorMonths.length === 1) return MONTHS[selectedMonitorMonths[0]];
        const sorted = [...selectedMonitorMonths].sort((a, b) => a - b);
        const isContiguous = sorted.every((val, i) => i === 0 || val === sorted[i - 1] + 1);
        if (isContiguous) {
            return `${MONTHS[sorted[0]]} - ${MONTHS[sorted[sorted.length - 1]]} (${sorted.length}m)`;
        }
        return `${sorted.map(m => MONTHS[m]).join(', ')}`;
    }, [selectedMonitorMonths]);
    const [masterFilterObj, setMasterFilterObj] = useState<string>('all');
    const [masterFilterArea, setMasterFilterArea] = useState<string>('all');
    const [masterFilterMonth, setMasterFilterMonth] = useState<string>('all');
    const [masterFilterStatus, setMasterFilterStatus] = useState<string>('all');
    const [masterSearchQuery, setMasterSearchQuery] = useState<string>('');
    const [isMasterUploading, setIsMasterUploading] = useState<boolean>(false);
    const [isDraggingMaster, setIsDraggingMaster] = useState<boolean>(false);
    const masterFileInputRef = useRef<HTMLInputElement>(null);
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
    const [risstmaRecords, setRisstmaRecords] = useState<any[]>([]);
    const [reporteAcRecords, setReporteAcRecords] = useState<any[]>([]);
    const [trainingSubprograms, setTrainingSubprograms] = useState<Record<string, TrainingSubprogram>>({
        subprog_seguridad: DEFAULT_SUBPROGRAM_CAP_SEGURIDAD,
        subprog_salud: DEFAULT_SUBPROGRAM_CAP_SALUD,
        subprog_ma: DEFAULT_SUBPROGRAM_CAP_MA,
        subprog_brigadistas: DEFAULT_SUBPROGRAM_CAP_BRIGADISTAS,
        subprog_scsst: DEFAULT_SUBPROGRAM_CAP_SCSST,
        subprog_general: DEFAULT_SUBPROGRAM_GENERAL
    });
    const [isSavingSubprograms, setIsSavingSubprograms] = useState(false);
    const [inspectionsSubprograms, setInspectionsSubprograms] = useState<Record<string, InspectionSubprogram>>({
        subprog_insp_seguridad: DEFAULT_SUBPROGRAM_INSPECCIONES_SEGURIDAD,
        subprog_insp_ma: DEFAULT_SUBPROGRAM_INSPECCIONES_MA,
        subprog_insp_salud: DEFAULT_SUBPROGRAM_INSPECCIONES_SALUD,
        subprog_insp_scsst: DEFAULT_SUBPROGRAM_INSPECCIONES_SCSST
    });
    const [isSavingInspectionsSubprograms, setIsSavingInspectionsSubprograms] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [newItem, setNewItem] = useState({ date: '', description: '', status: 'Pendiente', area: 'SEGURIDAD' });
    const [editingCell, setEditingCell] = useState<{ key: string, month: number, type: 'P' | 'E' } | null>(null);
    const [editValue, setEditValue] = useState("");
    const [autoReplace, setAutoReplace] = useState(false); // Default to APPEND as requested
    const [mobileView, setMobileView] = useState<'list' | 'content'>('list');
    // --- Formatos Panel State ---
    const [showFormatos, setShowFormatos] = useState(false);
    const [templateStatus, setTemplateStatus] = useState<Record<string, string | null>>({ actividades: null, capacitacion: null, inspeccion: null });
    const [uploadingTemplate, setUploadingTemplate] = useState<string | null>(null);
    const [exportingType, setExportingType] = useState<string | null>(null);
    const [previewTipo, setPreviewTipo] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<{ sheetName: string; rows: any[][] }[] | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewSheet, setPreviewSheet] = useState(0);
    const [selectedRecords, setSelectedRecords] = useState<{ activity: string, month: string, records: any[] } | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [sendingObs, setSendingObs] = useState<number | null>(null); // Track which record index is being observed
    const [reconfigRecord, setReconfigRecord] = useState<{ index: number, category: string, subtype: string, tema?: string, area?: string, date?: string, temaAdicional?: boolean, nombreTemaAdicional?: string } | null>(null);
    const [newTema, setNewTema] = useState(''); // For custom tema input

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
                const currentWs = user?.workspace || 'Red Vial 6';
                const wsParam = encodeURIComponent(currentWs);
                const progRes = await fetch(`/api/annual-program?workspace=${wsParam}&_t=${Date.now()}`, { cache: 'no-store' });
                const progData = await progRes.json();
                if (progData.success && progData.programData && Object.keys(progData.programData).length > 0) {
                    setProgramData(progData.programData);
                    localStorage.setItem('annual_program_data_' + currentWs, JSON.stringify(progData.programData));
                    localStorage.setItem('annual_program_data', JSON.stringify(progData.programData));
                } else {
                    // Fallback to Red Vial 6 if current workspace returned empty
                    const fallbackRes = await fetch(`/api/annual-program?workspace=Red%20Vial%206&_t=${Date.now()}`, { cache: 'no-store' });
                    const fallbackData = await fallbackRes.json();
                    if (fallbackData.success && fallbackData.programData && Object.keys(fallbackData.programData).length > 0) {
                        setProgramData(fallbackData.programData);
                        localStorage.setItem('annual_program_data_' + currentWs, JSON.stringify(fallbackData.programData));
                    } else {
                        const storedData = localStorage.getItem('annual_program_data_' + currentWs) || localStorage.getItem('annual_program_data');
                        if (storedData && storedData !== 'undefined' && storedData !== 'null') {
                            try {
                                const parsed = JSON.parse(storedData);
                                if (parsed && typeof parsed === 'object') setProgramData(parsed);
                                else setProgramData({});
                            } catch {
                                setProgramData({});
                            }
                        } else {
                            setProgramData({});
                        }
                    }
                }

                // 2. Load inspections from cloud
                const inspRes = await fetch(`/api/inspections?workspace=${wsParam}&_t=${Date.now()}`, { cache: 'no-store' });
                const inspData = await inspRes.json();
                if (inspData.success && inspData.records.length > 0) {
                    setExecutedInspections(inspData.records);
                    localStorage.setItem('inspections_records', JSON.stringify(inspData.records));
                } else {
                    const storedExecuted = localStorage.getItem('inspections_records');
                    if (storedExecuted) setExecutedInspections(JSON.parse(storedExecuted));
                }

                // 3. Load HHC from cloud
                const hhcRes = await fetch('/api/hhc-records?_t=' + Date.now(), { cache: 'no-store' });
                const hhcData = await hhcRes.json();
                if (hhcData.success && hhcData.records.length > 0) {
                    setHhcRecords(hhcData.records);
                    localStorage.setItem('hhc_records', JSON.stringify(hhcData.records));
                } else {
                    const storedHHC = localStorage.getItem('hhc_records');
                    if (storedHHC) setHhcRecords(JSON.parse(storedHHC));
                }

                // 4. Load Evidence from cloud
                const evRes = await fetch('/api/evidence-records?_t=' + Date.now(), { cache: 'no-store' });
                const evData = await evRes.json();
                if (evData.success && evData.records.length > 0) {
                    setEvidenceRecords(evData.records);
                    localStorage.setItem('evidence_center_records', JSON.stringify(evData.records));
                } else {
                    const storedEvidence = localStorage.getItem('evidence_center_records');
                    if (storedEvidence) setEvidenceRecords(JSON.parse(storedEvidence));
                }

                // 5. Load PMA from cloud
                const pmaRes = await fetch('/api/pma-records?_t=' + Date.now(), { cache: 'no-store' });
                const pmaData = await pmaRes.json();
                if (pmaData.success && pmaData.records.length > 0) {
                    setPmaRecords(pmaData.records);
                    localStorage.setItem('pma_records', JSON.stringify(pmaData.records));
                }

                // 6. Load ATS from cloud
                const atsRes = await fetch('/api/ats-records?_t=' + Date.now(), { cache: 'no-store' });
                const atsData = await atsRes.json();
                if (atsData.success) setAtsRecords(atsData.records);

                // 7. Load PETAR from cloud
                const petarRes = await fetch('/api/petar-records?_t=' + Date.now(), { cache: 'no-store' });
                const petarData = await petarRes.json();
                if (petarData.success) setPetarRecords(petarData.records);

                // 8. Load Desvios from cloud
                const detourRes = await fetch('/api/desvio-records?_t=' + Date.now(), { cache: 'no-store' });
                const detourData = await detourRes.json();
                if (detourData.success) setDetourRecords(detourData.records);

                // 9. Load Simulacros from cloud
                const simRes = await fetch('/api/simulacro-records?_t=' + Date.now(), { cache: 'no-store' });
                const simData = await simRes.json();
                if (simData.success) setSimulacroRecords(simData.records);

                // 10. Load Brigadistas from cloud
                const briRes = await fetch('/api/brigadista-records?_t=' + Date.now(), { cache: 'no-store' });
                const briData = await briRes.json();
                if (briData.success) setBrigadistaRecords(briData.records);

                // 11. Load RISSTMA from cloud
                const risRes = await fetch('/api/risstma-records?_t=' + Date.now(), { cache: 'no-store' });
                const risData = await risRes.json();
                if (risData.success) setRisstmaRecords(risData.records);

                // 12. Load Reporte A/C from cloud
                const racRes = await fetch(`/api/reporte-ac-records?workspace=${wsParam}&_t=${Date.now()}`, { cache: 'no-store' });
                const racData = await racRes.json();
                if (racData.success) setReporteAcRecords(racData.records);

                const subprogRes = await fetch(`/api/training-subprograms?workspace=${wsParam}&_t=${Date.now()}`, { cache: 'no-store' });
                const subprogData = await subprogRes.json();
                if (subprogData.success && subprogData.subprograms) setTrainingSubprograms(subprogData.subprograms);

                const inspSubprogRes = await fetch(`/api/inspections-subprograms?workspace=${wsParam}&_t=${Date.now()}`, { cache: 'no-store' });
                const inspSubprogData = await inspSubprogRes.json();
                if (inspSubprogData.success && inspSubprogData.subprograms) setInspectionsSubprograms(inspSubprogData.subprograms);

            } catch (e) {
                console.error("Error loading data from cloud, using localStorage:", e);
                // Fallback to all localStorage
                const storedData = localStorage.getItem('annual_program_data_' + (user?.workspace || 'Red Vial 6')) || localStorage.getItem('annual_program_data');
                if (storedData) {
                    try { setProgramData(JSON.parse(storedData)); } catch {}
                }
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
    }, [user?.workspace]);

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

    // PERSIST DATA - Sincronización robusta con Base de Datos en la Nube y LocalStorage
    const syncToCloud = async (newProgramData: Record<string, ProgramItem[]>, objId?: string, records?: ProgramItem[]) => {
        try {
            setIsSaving(true);
            const currentWs = user?.workspace || 'Red Vial 6';
            localStorage.setItem('annual_program_data_' + currentWs, JSON.stringify(newProgramData));

            // Si se pasa un objetivo específico, enviamos actualización atómica directa
            const payload = (objId && records)
                ? { objectiveId: objId, records, workspace: currentWs }
                : { programData: newProgramData, workspace: currentWs };

            const res = await fetch('/api/annual-program', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            } else {
                console.warn('Advertencia en sincronización con la nube:', data);
            }
        } catch (e) {
            console.error('Error sincronizando programa con la nube:', e);
        } finally {
            setIsSaving(false);
        }
    };

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


    const handleSaveInspectionsSubprograms = async (data: Record<string, InspectionSubprogram>) => {
        setIsSavingInspectionsSubprograms(true);
        try {
            const wsParam = encodeURIComponent(user?.workspace || 'Red Vial 6');
            const res = await fetch('/api/inspections-subprograms?workspace=' + wsParam, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subprograms: data })
            });
            const json = await res.json();
            if (json.success) {
                setInspectionsSubprograms(data);
                alert('✅ Subprogramas de inspección guardados y sincronizados con éxito.');
            } else {
                alert('❌ Error al guardar subprogramas de inspección: ' + json.error);
            }
        } catch (e: any) {
            alert('❌ Error de conexión al guardar subprogramas de inspección.');
        } finally {
            setIsSavingInspectionsSubprograms(false);
        }
    };

    const handleSaveSubprograms = async (data: Record<string, TrainingSubprogram>) => {
        setIsSavingSubprograms(true);
        try {
            const wsParam = encodeURIComponent(user?.workspace || 'Red Vial 6');
            const res = await fetch('/api/training-subprograms?workspace=' + wsParam, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subprograms: data })
            });
            const json = await res.json();
            if (json.success) {
                setTrainingSubprograms(data);
                alert('✅ Subprogramas de capacitación guardados y sincronizados con éxito.');
            } else {
                alert('❌ Error al guardar subprogramas: ' + json.error);
            }
        } catch (e: any) {
            alert('❌ Error de conexión al guardar subprogramas.');
        } finally {
            setIsSavingSubprograms(false);
        }
    };

    const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log("📂 Iniciando importación de:", file.name, "Tipo:", file.type);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                if (!arrayBuffer) throw new Error("No se pudo obtener el contenido del archivo.");

                // Leer el libro
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                
                if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                    throw new Error("El archivo Excel no contiene hojas de trabajo.");
                }

                const sheetName = workbook.SheetNames[0];
                const worksheetRaw = workbook.Sheets[sheetName];
                
                if (!worksheetRaw) {
                    throw new Error(`No se pudo leer la hoja: ${sheetName}`);
                }

                // Convertir a JSON (array de arrays)
                const worksheet = XLSX.utils.sheet_to_json(worksheetRaw, { header: 1, raw: false }) as any[][];

                if (worksheet.length === 0) {
                    alert("⚠️ El archivo está vacío.");
                    return;
                }

                console.log("📊 Hoja leída correctamente. Filas:", worksheet.length);

                // --- HELPER: Normalize Text ---
                const norm = (s: any) => String(s || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

                // --- 1. HEADER DETECTION (Months) ---
                let headerRowIdx = -1;
                let monthColIndices: number[] = [];
                const monthNamesShort = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SET", "OCT", "NOV", "DIC"];
                const monthNamesShortEn = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                const monthNamesFull = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SETIEMBRE", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

                // Scan first 50 rows (increased range)
                for (let r = 0; r < Math.min(50, worksheet.length); r++) {
                    const row = Array.from(worksheet[r] || []).map(c => norm(c));
                    const countMatches = (list: string[]) => list.filter(m => row.some(cell => cell && (cell === m || cell.startsWith(m) || cell.includes(m)))).length;

                    if (countMatches(monthNamesShort) >= 2 || countMatches(monthNamesFull) >= 2 || countMatches(monthNamesShortEn) >= 2) {
                        headerRowIdx = r;
                        break;
                    }
                }

                // Identify Indices
                if (headerRowIdx !== -1) {
                    const row = Array.from(worksheet[headerRowIdx] || []).map(c => norm(c));
                    const findMonthCol = (searchList: string[]) => searchList.map(m => row.findIndex(cell => cell && (cell === m || cell.startsWith(m) || cell.includes(m))));

                    let bestIndices = findMonthCol(monthNamesShort);
                    if (bestIndices.filter(i => i !== -1).length < 2) bestIndices = findMonthCol(monthNamesFull);
                    monthColIndices = bestIndices;
                }

                const isMatrix = headerRowIdx !== -1 && monthColIndices.some(i => i !== -1);
                const newRecords: ProgramItem[] = [];

                if (isMatrix) {
                    console.log("📌 Formato MATRIZ detectado en fila:", headerRowIdx);
                    const headers = Array.from(worksheet[headerRowIdx] || []).map(h => norm(h));

                    // Detect Plan/Type Column
                    const planIndex = headers.findIndex(h => h && (h.includes('PLAN') || h.includes('TIPO') || h.includes('ESTADO')));

                    // Detect Description Column
                    let descIndex = headers.findIndex(h => h && (h.includes('DESC') || h.includes('ACTIVIDAD') || h.includes('TEMA') || h.includes('ITEM') || h.includes('ASPECTO') || h.includes('DETALLE')));

                    // Fallback: Check the row ABOVE the header (common in some templates)
                    if (descIndex === -1 && headerRowIdx > 0) {
                        const aboveHeaders = Array.from(worksheet[headerRowIdx - 1] || []).map(h => norm(h));
                        descIndex = aboveHeaders.findIndex(h => h && (h.includes('DESC') || h.includes('ACTIVIDAD') || h.includes('TEMA') || h.includes('ITEM') || h.includes('ASPECTO') || h.includes('DETALLE')));
                    }

                    if (descIndex === -1) {
                        // Fallback 2: Check first data row for the column with the longest text that is not a month or plan
                        const firstDataRow = worksheet[headerRowIdx + 1] || [];
                        let longestLen = -1;
                        firstDataRow.forEach((cell, idx) => {
                            if (monthColIndices.includes(idx) || idx === planIndex) return;
                            const val = String(cell || '');
                            if (val.length > longestLen && !val.match(/^\d+$/)) {
                                longestLen = val.length;
                                descIndex = idx;
                            }
                        });
                    }

                    if (descIndex === -1) descIndex = 1; // Default to column B if everything fails

                    let lastDescription = "";

                    worksheet.slice(headerRowIdx + 1).forEach((row, rowIndex) => {
                        const normalizedRow = Array.from(row || []).map(c => norm(c));

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
                            const numEvents = parseInt(String(val || '0').replace(/\D/g, ''));

                            if (!isNaN(numEvents) && numEvents > 0) {
                                for (let i = 0; i < numEvents; i++) {
                                    const monthStr = String(monthIndex + 1).padStart(2, '0');
                                    newRecords.push({
                                        id: Date.now() + rowIndex * 1000 + monthIndex * 100 + i + Math.random(),
                                        date: `2026-${monthStr}-15`,
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
                    console.log("📌 Formato LISTA detectado.");
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
                            const valStr = norm(cell);

                            if (valStr.match(/^\d{5}$/)) stats[colIdx].dateScore += 2;
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

                        if (stringVal.match(/^\d{5}$/)) {
                            const d = new Date(Math.round((parseInt(stringVal) - 25569) * 86400 * 1000));
                            if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
                        } else if (stringVal.match(/^\d{4}-\d{2}-\d{2}/)) {
                            dateStr = stringVal.substring(0, 10);
                        } else if (stringVal.match(/^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/)) {
                            const parts = stringVal.split(/[\/-]/);
                            let y = parts[2] || '2026';
                            if (y.length === 2) y = "20" + y;
                            dateStr = `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                        } else {
                            const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SET", "OCT", "NOV", "DIC"];
                            const monthsFull = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SETIEMBRE", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
                            let mIdx = months.findIndex(m => stringVal.startsWith(m));
                            if (mIdx === -1) mIdx = monthsFull.findIndex(m => stringVal.startsWith(m));
                            if (mIdx !== -1) dateStr = `2026-${String((mIdx % 12) + 1).padStart(2, '0')}-15`;
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
                    if (selectedObjId === 'all') {
                        alert('⚠️ Para importar actividades desde Excel, selecciona primero el objetivo específico (OBJ 01 a OBJ 09) en el menú lateral o desde las tarjetas de objetivo.');
                        return;
                    }
                    const current = programData[selectedObjId] || [];
                    const finalRecords = autoReplace ? newRecords : [...current, ...newRecords];
                    const nextProgram = { ...programData, [selectedObjId]: finalRecords };

                    setProgramData(nextProgram);
                    syncToCloud(nextProgram, selectedObjId, finalRecords);

                    const count = newRecords.length;
                    alert(autoReplace
                        ? `✅ CARGA EXITOSA (REEMPLAZO): ${count} registros importados y sincronizados en la nube.`
                        : `✅ CARGA EXITOSA (AGREGADO): ${count} registros importados y sincronizados en la nube.`);
                } else {
                    const hint = isMatrix ? "Formato Matriz detectado pero 0 registros creados." : "No se detectó formato Matriz ni Lista.";
                    alert(`⚠️ ALERTA: ${hint}\nSugerencia: Revisar que el archivo contenga datos válidos.`);
                }
            } catch (error: any) {
                console.error("❌ Error de lectura:", error);
                alert(`❌ ERROR: No se pudo leer el archivo.\n\nDetalle: ${error.message || 'Formato no soportado'}\n\nSugerencia: Intenta abrir el archivo en Excel y "Guardar como" un nuevo archivo .xlsx.`);
            }
        };
        reader.readAsArrayBuffer(file);
        if (e.target && e.target.type === 'file') e.target.value = '';
    };

    const handleClearAll = () => {
        if (selectedObjId === 'all') {
            alert('⚠️ Para limpiar actividades, selecciona un objetivo específico (OBJ 01 a OBJ 09).');
            return;
        }
        if (confirm(`⚠️ ¿Estás seguro de eliminar TODOS los datos de ${currentObj?.label || 'este objetivo'}?`)) {
            const emptyData = { ...programData, [selectedObjId]: [] };
            setProgramData(emptyData);
            syncToCloud(emptyData, selectedObjId, []);
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
        const currentList = (programData && programData[selectedObjId]) || [];
        const others = currentList.filter(item => {
            const m = new Date(item.date).getMonth();
            return !(item.description === desc && m === monthIdx && (item.area === area || !item.area));
        });
        const newItems: ProgramItem[] = [];
        for (let i = 0; i < newVal; i++) {
            const mStr = String(monthIdx + 1).padStart(2, '0');
            newItems.push({
                id: Date.now() + i + Math.random(),
                date: `2026-${mStr}-15`,
                description: desc,
                status: 'Pendiente',
                compliance: 0,
                area: area
            });
        }
        const updatedList = [...others, ...newItems];
        const updatedProgram = {
            ...programData,
            [selectedObjId]: updatedList
        };
        setProgramData(updatedProgram);
        syncToCloud(updatedProgram, selectedObjId, updatedList);
        setEditingCell(null);
    };

    const handleManualAdd = () => {
        if (!newItem.date || !newItem.description) return;
        const record = { id: Date.now(), ...newItem, compliance: 0 };
        const updatedList = [...(programData[selectedObjId] || []), record];
        const updatedProgram = { ...programData, [selectedObjId]: updatedList };
        setProgramData(updatedProgram);
        syncToCloud(updatedProgram, selectedObjId, updatedList);
        setNewItem({ ...newItem, description: '' });
    };

    const handleDelete = (id: number) => {
        const updatedList = (programData[selectedObjId] || []).filter(i => i.id !== id);
        const updatedProgram = { ...programData, [selectedObjId]: updatedList };
        setProgramData(updatedProgram);
        syncToCloud(updatedProgram, selectedObjId, updatedList);
    };

    const currentObj = OBJECTIVES.find(o => o.id === selectedObjId);

    // Generate Matrix Data
    const getMatrixData = (targetObjId = selectedObjId) => {
        const currentList = (programData && programData[targetObjId]) || [];
        const currentObj = OBJECTIVES.find(o => o.id === targetObjId);
        const currentObjLabel = currentObj?.label || '';
        const grouped: Record<string, Record<string, { programmed: number[], executed: number[], executionRecords: Record<number, any[]>, tipo?: string }>> = {};

        // Helper para normalizar strings (elimina acentos, minúsculas, espacios)
        const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ').trim();
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

        // Helper: Verificar si un registro tiene evidencia válida (archivo cargado)
        const hasEvidence = (r: any): boolean => {
            if (!r) return false;
            // Check for PDF fields (singular and plural)
            const pdf = r.evidencePdf || r.evidence_pdf || r.pdfUrl || r.fileUrl || r.file_url || r.evidenceUrl || r.evidence_url || r.fileUrls || r.file_urls;
            
            if (pdf) {
                if (typeof pdf === 'string' && pdf.trim().length > 10 && !pdf.includes('undefined') && !pdf.includes('null')) return true;
                if (Array.isArray(pdf) && pdf.length > 0) {
                    return pdf.some(url => typeof url === 'string' && url.trim().length > 10 && !url.includes('undefined') && !url.includes('null'));
                }
            }
            
            // Check for Image fields (arrays or strings)
            let imgs = r.evidenceImgs || r.evidence_imgs || r.images || r.imageUrl || r.files;
            if (imgs) {
                if (typeof imgs === 'string' && imgs.trim().startsWith('[') && imgs.trim().endsWith(']')) {
                    try { imgs = JSON.parse(imgs); } catch { }
                }

                if (Array.isArray(imgs)) {
                    return imgs.some(url => typeof url === 'string' && url.trim().length > 10 && !url.includes('undefined') && !url.includes('null'));
                }
                
                if (typeof imgs === 'string' && imgs.trim().length > 10 && !imgs.includes('undefined') && !imgs.includes('null')) return true;
            }

            return false;
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
                    executionRecords: {},
                    tipo: item.tipo || 'otro'
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

        // Cache descriptions to avoid millions of string operations
        const descCache: Record<string, { norm: string, words: string[] }> = {};
        for (const area in grouped) {
            for (const desc in grouped[area]) {
                const dNorm = normalize(desc);
                descCache[desc] = { norm: dNorm, words: getWords(dNorm) };
            }
        }

        const findMatch = (areaKey: string, searchStr: string) => {
            if (!grouped[areaKey]) return null;
            const tNorm = normalize(searchStr || '');
            const tWords = getWords(tNorm);
            if (tWords.length === 0) return null;

            const keys = Object.keys(grouped[areaKey]);

            // 1. Pass 1: Coincidencia Directa (Exact Match)
            const exactMatch = keys.find(desc => {
                const cache = descCache[desc];
                return cache && cache.norm === tNorm;
            });
            if (exactMatch) return exactMatch;

            // 2. Pass 2: Coincidencia por Palabras (Bidirectional Subset logic)
            return keys.find(desc => {
                const cache = descCache[desc];
                if (!cache || cache.words.length === 0) return false;
                return isSubset(cache.words, tWords) || isSubset(tWords, cache.words);
            });
        };


        // 2. Map Executed Inspections
        executedInspections.forEach(exec => {
            const m = getMonthFromStr(exec.date);
            if (m < 0 || m > 11 || !hasEvidence(exec)) return;

            // Determinar a qué objetivo pertenece según el tipo de inspección
            let targetArea = 'obj3'; // Default: OBJ 03 (Seguridad)
            let searchKeyword = 'seguridad';
            const t = (exec.inspectionType || '').toLowerCase();
            
            if (t.includes('botiquin') || t.includes('campamento') || t.includes('cocina') || t.includes('comedor')) {
                targetArea = 'obj5'; // Salud
                searchKeyword = 'salud';
            } else if (t.includes('derrame')) {
                targetArea = 'obj7'; // Medio Ambiente
                searchKeyword = 'ambiente';
            }

            for (const areaKey in grouped) {
                let match = findMatch(areaKey, exec.inspectionType);
                
                // Forzar mapeo si no coincide naturalmente, buscando la fila genérica del objetivo
                if (!match && areaKey === targetArea) {
                    const keys = Object.keys(grouped[areaKey]);
                    match = keys.find(k => k.toLowerCase().includes(searchKeyword) || k.toLowerCase().includes('inspeccion'));
                }

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
            if (m < 0 || m > 11 || !hasEvidence(hhc)) return;

            for (const areaKey in grouped) {
                const match = findMatch(areaKey, hhc.tema);
                if (match) {
                    grouped[areaKey][match].executed[m]++;
                    if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                    grouped[areaKey][match].executionRecords[m].push({ ...hhc, _type: 'HHC' });
                }
            }
        });

        // Para Objetivo 02 (Capacitación y Entrenamiento): Alimentar fila macro con HHC
        if (targetObjId === 'obj2') {
            for (const areaKey in grouped) {
                const keys = Object.keys(grouped[areaKey]);
                const mainTrainKey = keys.find(k => k.toLowerCase().includes('capacita') || k.toLowerCase().includes('programa anual')) || keys[0];
                if (mainTrainKey) {
                    for (let m = 0; m < 12; m++) {
                        const monthHhc = hhcRecords.filter(h => getMonthFromStr(h.date) === m && hasEvidence(h));
                        const isProg = grouped[areaKey][mainTrainKey].programmed[m] > 0;
                        if (isProg && monthHhc.length > 0) {
                            grouped[areaKey][mainTrainKey].executed[m] = 1;
                            grouped[areaKey][mainTrainKey].executionRecords[m] = monthHhc.map(h => ({ ...h, _type: 'HHC' }));
                        } else {
                            grouped[areaKey][mainTrainKey].executed[m] = 0;
                        }
                    }
                }
            }
        }

        // Para Objetivo 03 (Inspecciones de Seguridad): Alimentar fila macro con F-SIG-067 e inspecciones
        if (targetObjId === 'obj3') {
            for (const areaKey in grouped) {
                const keys = Object.keys(grouped[areaKey]);
                const mainInspKey = keys.find(k => k.toLowerCase().includes('planeadas') || (k.toLowerCase().includes('inspeccion') && k.toLowerCase().includes('seguridad'))) || keys[0];
                if (mainInspKey) {
                    const pSeg = inspectionsSubprograms?.subprog_insp_seguridad || DEFAULT_SUBPROGRAM_INSPECCIONES_SEGURIDAD;
                    const pMA = inspectionsSubprograms?.subprog_insp_ma || DEFAULT_SUBPROGRAM_INSPECCIONES_MA;
                    const pSalud = inspectionsSubprograms?.subprog_insp_salud || DEFAULT_SUBPROGRAM_INSPECCIONES_SALUD;
                    const pSCSST = inspectionsSubprograms?.subprog_insp_scsst || DEFAULT_SUBPROGRAM_INSPECCIONES_SCSST;

                    for (let m = 0; m < 12; m++) {
                        let subTotP = 0;
                        let subTotE = 0;
                        [pSeg, pMA, pSalud, pSCSST].forEach(prog => {
                            (prog?.items || []).forEach(it => {
                                const pVal = it.programmed?.[m] || 0;
                                subTotP += pVal;
                                if (pVal > 0) {
                                    subTotE += (it.executed?.[m] || 0);
                                }
                            });
                        });

                        const monthInspections = executedInspections.filter(i => getMonthFromStr(i.date) === m && hasEvidence(i));
                        const isProg = grouped[areaKey][mainInspKey].programmed[m] > 0;
                        const hasExecution = subTotE > 0 || monthInspections.length > 0;

                        if (isProg && hasExecution) {
                            grouped[areaKey][mainInspKey].executed[m] = 1;
                            grouped[areaKey][mainInspKey].executionRecords[m] = monthInspections.length > 0
                                ? monthInspections.map(i => ({ ...i, _type: 'INSPECTION' }))
                                : [{
                                    id: 'subprog-insp-macro-' + m,
                                    inspection_type: 'Inspecciones Operacionales F-SIG-067',
                                    responsible: 'Prevencionistas / SSOMA',
                                    date: '2026-' + String(m + 1).padStart(2, '0') + '-15',
                                    evidence_pdf: 'Registrado en Formato Oficial F-SIG-067'
                                }];
                        } else {
                            grouped[areaKey][mainInspKey].executed[m] = 0;
                        }
                    }
                }
            }
        }

        // 4. Map Evidence Center Records (EMOs, Segregación, etc.)
        evidenceRecords.forEach(ev => {
            const objIdNum = targetObjId.replace('obj', '');
            const isEmoMatch = (targetObjId === 'obj5') && (ev.type?.toUpperCase() === 'EMO' || ev.category?.toUpperCase().includes('EMO'));
            
            // Robust Objective Matching: OBJ 01, OBJ 1, 01, 1
            const evObj = String(ev.objective || '').toUpperCase().replace(/\s+/g, '');
            const targetObjNorm = targetObjId.toUpperCase(); // OBJ1
            const targetObjAlt = `OBJ${objIdNum.padStart(2, '0')}`; // OBJ01
            
            const isMatch = isEmoMatch || (ev.objective && (
                currentObjLabel.toUpperCase().includes(evObj) || 
                evObj.includes(objIdNum) ||
                evObj === targetObjNorm ||
                evObj === targetObjAlt
            ));

            if (!isMatch) return;

            const m = getMonthFromStr(ev.date);
            if (m < 0 || m > 11 || !hasEvidence(ev)) return;

                        for (const areaKey in grouped) {
                // Prioritize 'activity' over 'description' because 'activity' holds the official name in SCSST and others
                let actSearch = ev.activity || ev.description || (isEmoMatch ? 'EMO' : '');

                // Mapeo inteligente para OBJ 01 (SCSST)
                if (targetObjId === 'obj1') {
                    const normAct = actSearch.toLowerCase();
                    let targetAct = actSearch;

                    if (normAct.includes('aprobaci') || normAct.includes('revisi') || normAct.includes('plan sst') || normAct.includes('plan de emergencia') || normAct.includes('planes de salud') || normAct.includes('objetivos estrat')) {
                        const actRowKey = Object.keys(grouped[areaKey]).find(k => k.toLowerCase().includes('aprobaci') || k.toLowerCase().includes('revisi') || k.toLowerCase().includes('plan sst'));
                        targetAct = actRowKey || 'Elaboración, revisión y aprobación del Plan SSTMA, Programa Anual y Objetivos Estratégicos por el SCSST';
                    } else if (normAct.includes('reuni') || normAct.includes('ordinaria')) {
                        const meetRowKey = Object.keys(grouped[areaKey]).find(k => k.toLowerCase().includes('reuni') || k.toLowerCase().includes('ordinaria'));
                        targetAct = meetRowKey || 'Realizar reuniones ordinarias mensuales del Subcomité de SST (SCSST)';
                    } else if (normAct.includes('acuerdo')) {
                        const acRowKey = Object.keys(grouped[areaKey]).find(k => k.toLowerCase().includes('acuerdo'));
                        targetAct = acRowKey || 'Seguimiento mensual de acuerdos del Subcomité de SST (Indicador: ≥ 90% acuerdos cerrados)';
                    }

                    const match = findMatch(areaKey, targetAct);
                    if (match) {
                        grouped[areaKey][match].executed[m]++;
                        if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                        grouped[areaKey][match].executionRecords[m].push({ ...ev, _type: 'EVIDENCE' });
                    }

                    // Si el registro contiene acuerdos registrados (totales o cerrados) y no fue asignado únicamente a seguimiento de acuerdos:
                    const hasAcuerdos = (ev.acuerdos_total !== null && ev.acuerdos_total !== undefined && Number(ev.acuerdos_total) > 0) ||
                                        (ev.acuerdos_cerrados !== null && ev.acuerdos_cerrados !== undefined && Number(ev.acuerdos_cerrados) > 0) ||
                                        (ev.description && ev.description.includes('[Acuerdos:'));
                    
                    if (hasAcuerdos && targetAct !== 'Seguimiento mensual de acuerdos del Subcomité de SST (Indicador: ≥ 90% acuerdos cerrados)') {
                        const acuerdosMatch = findMatch(areaKey, 'Seguimiento mensual de acuerdos del Subcomité de SST (Indicador: ≥ 90% acuerdos cerrados)');
                        if (acuerdosMatch) {
                            grouped[areaKey][acuerdosMatch].executed[m]++;
                            if (!grouped[areaKey][acuerdosMatch].executionRecords[m]) grouped[areaKey][acuerdosMatch].executionRecords[m] = [];
                            grouped[areaKey][acuerdosMatch].executionRecords[m].push({ ...ev, _type: 'EVIDENCE' });
                        }
                    }
                    continue;
                }

                const match = findMatch(areaKey, actSearch);
                if (match) {
                    grouped[areaKey][match].executed[m]++;
                    if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                    grouped[areaKey][match].executionRecords[m].push({ ...ev, _type: 'EVIDENCE' });
                }
            }
        });

        // Transformar contabilidad de Acuerdos del Subcomité (OBJ 01) en 1 cuando está cumplido
        if (targetObjId === 'obj1') {
            for (const areaKey in grouped) {
                const acuerdosKey = Object.keys(grouped[areaKey]).find(k => k.toLowerCase().includes('acuerdo'));
                if (acuerdosKey) {
                    for (let m = 0; m < 12; m++) {
                        const recs = grouped[areaKey][acuerdosKey].executionRecords[m] || [];
                        if (recs.length > 0) {
                            let mTotal = 0;
                            let mCerrados = 0;
                            recs.forEach(r => {
                                if (r.acuerdos_total !== null && r.acuerdos_total !== undefined && !isNaN(Number(r.acuerdos_total))) {
                                    mTotal += Number(r.acuerdos_total);
                                } else if (r.description) {
                                    const match = r.description.match(/\[Acuerdos:\s*(\d+)\/(\d+)/i);
                                    if (match) mTotal += Number(match[2]);
                                }

                                if (r.acuerdos_cerrados !== null && r.acuerdos_cerrados !== undefined && !isNaN(Number(r.acuerdos_cerrados))) {
                                    mCerrados += Number(r.acuerdos_cerrados);
                                } else if (r.description) {
                                    const match = r.description.match(/\[Acuerdos:\s*(\d+)\/(\d+)/i);
                                    if (match) mCerrados += Number(match[1]);
                                }
                            });

                            // Meta oficial: ≥ 90% acuerdos cerrados (o si tiene cerrados válidos)
                            const isCumplido = (mTotal > 0 && (mCerrados / mTotal) >= 0.9) || (mTotal > 0 && mCerrados >= mTotal) || (mCerrados > 0);
                            grouped[areaKey][acuerdosKey].executed[m] = isCumplido ? 1 : 0;
                        } else {
                            grouped[areaKey][acuerdosKey].executed[m] = 0;
                        }
                    }
                }
            }
        }

        // 5. Map PMA Records (Objective 08 - Photos / SEG 03)
        pmaRecords.forEach(pma => {
            // PMA is now SEG 03 (obj8)
            if (targetObjId !== 'obj7' && targetObjId !== 'obj8') return; 

            const m = getMonthFromStr(pma.date);
            if (m < 0 || m > 11 || !hasEvidence(pma)) return;

            for (const areaKey in grouped) {
                const match = findMatch(areaKey, pma.category || pma.description);
                if (match) {
                    grouped[areaKey][match].executed[m]++;
                    if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                    grouped[areaKey][match].executionRecords[m].push({ ...pma, _type: 'PMA' });
                }
            }
        });

        // Helper to check if an activity is a training
        const isTrainingActivity = (name: string) => {
            const n = name.toUpperCase();
            return n.includes('CAP.') || n.includes('CAPACITACI') || n.includes('INDUCCI') || n.includes('ENTRENAMIENTO') || n.includes('FORMACION');
        };

        // 6. Map ATS Records
        atsRecords.forEach(ats => {
            if (targetObjId === 'obj2') return; // ATS are not Trainings

            const m = getMonthFromStr(ats.date);
            if (m < 0 || m > 11 || !hasEvidence(ats)) return;

            for (const areaKey in grouped) {
                const match = findMatch(areaKey, 'ATS' || ats.location);
                if (match && !isTrainingActivity(match)) {
                    grouped[areaKey][match].executed[m]++;
                    if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                    grouped[areaKey][match].executionRecords[m].push({ ...ats, _type: 'ATS' });
                }
            }
        });

        // 7. Map PETAR Records
        petarRecords.forEach(petar => {
            if (targetObjId === 'obj2') return; // PETARs are not Trainings

            const m = getMonthFromStr(petar.date);
            if (m < 0 || m > 11 || !hasEvidence(petar)) return;

            for (const areaKey in grouped) {
                const match = findMatch(areaKey, petar.type || 'PETAR');
                if (match && !isTrainingActivity(match)) {
                    grouped[areaKey][match].executed[m]++;
                    if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                    grouped[areaKey][match].executionRecords[m].push({ ...petar, _type: 'PETAR' });
                }
            }
        });

        // 8. Map Desvío Records
        detourRecords.forEach(det => {
            if (targetObjId === 'obj2') return; // Desvíos are not Trainings

            const m = getMonthFromStr(det.date);
            if (m < 0 || m > 11 || !hasEvidence(det)) return;

            for (const areaKey in grouped) {
                const match = findMatch(areaKey, det.category || 'Desvío');
                if (match && !isTrainingActivity(match)) {
                    grouped[areaKey][match].executed[m]++;
                    if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                    grouped[areaKey][match].executionRecords[m].push({ ...det, _type: 'DETOUR' });
                }
            }
        });

        // 9. Map Simulacro Records (SEG 05 - obj10)
        simulacroRecords.forEach(sim => {
            if (targetObjId !== 'obj6' && targetObjId !== 'obj10') return;

            const m = getMonthFromStr(sim.date);
            if (m < 0 || m > 11 || !hasEvidence(sim)) return;

            for (const areaKey in grouped) {
                // Fuzzy match for drill type
                const match = findMatch(areaKey, sim.drillType || 'Simulacro');
                if (match) {
                    grouped[areaKey][match].executed[m]++;
                    if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                    grouped[areaKey][match].executionRecords[m].push({ ...sim, _type: 'SIMULACRO' });
                }
            }
        });

        // 10. Map Brigadista Records (SEG 06 - obj11)
        brigadistaRecords.forEach(bri => {
            if (targetObjId !== 'obj6' && targetObjId !== 'obj11') return;

            const m = getMonthFromStr(bri.date);
            if (m < 0 || m > 11 || !hasEvidence(bri)) return;

            for (const areaKey in grouped) {
                const match = findMatch(areaKey, bri.brigadistaType || 'Brigadista');
                if (match) {
                    grouped[areaKey][match].executed[m]++;
                    if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                    grouped[areaKey][match].executionRecords[m].push({ ...bri, _type: 'BRIGADISTA' });
                }
            }
        });

        // 11. Map RISSTMA Records (OBJ 03 or Folder 03)
        risstmaRecords.forEach(ris => {
            if (!ris || !ris.date) return;
            const m = getMonthFromStr(ris.date);
            if (m < 0 || m > 11 || !hasEvidence(ris)) return;

            for (const areaKey in grouped) {
                const match = findMatch(areaKey, ris.type || 'RISSTMA');
                if (match) {
                    grouped[areaKey][match].executed[m]++;
                    if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                    grouped[areaKey][match].executionRecords[m].push({ ...ris, _type: 'RISSTMA' });
                }
            }
        });

        // 12. Map Reporte A/C Records (OBJ 04)
        reporteAcRecords.forEach(rac => {
            const m = getMonthFromStr(rac.date);
            // Para el caso de actos y condiciones, sumamos todo así no tengan PDF cargado
            if (m < 0 || m > 11) return;

            for (const areaKey in grouped) {
                let match = null;
                
                // En OBJ 04, todos los reportes A/C deben sumar a la actividad de seguimiento y cierre de actos y condiciones
                if (targetObjId === 'obj4') {
                    const keys = Object.keys(grouped[areaKey]);
                    match = keys.find(k => {
                        const l = k.toLowerCase();
                        return (l.includes('seguimiento') && l.includes('cierre')) || 
                               (l.includes('actos') && l.includes('condiciones')) ||
                               l.includes('reporte');
                    });
                }

                if (!match) {
                    match = findMatch(areaKey, rac.acto || rac.condicion || 'A/C');
                }

                if (match) {
                    if (!grouped[areaKey][match].executionRecords[m]) grouped[areaKey][match].executionRecords[m] = [];
                    grouped[areaKey][match].executionRecords[m].push({ ...rac, _type: 'REPORTE_AC' });
                    break; // Stop searching other areas once matched
                }
            }
        });

        // En OBJ 04, la meta mínima mensual es de 10 reportes de actos y condiciones inseguras.
        // En cada mes que se genere 10 o más (>= 10), se considera automáticamente como CUMPLIDO y contabiliza 1 como ejecutado (E = 1); si no, 0.
        if (targetObjId === 'obj4') {
            for (const areaKey in grouped) {
                const keys = Object.keys(grouped[areaKey]);
                const acRowKey = keys.find(k => {
                    const l = k.toLowerCase();
                    return (l.includes('seguimiento') && l.includes('cierre')) || 
                           (l.includes('actos') && l.includes('condiciones')) ||
                           l.includes('reporte');
                });
                if (acRowKey) {
                    for (let m = 0; m < 12; m++) {
                        const recs = grouped[areaKey][acRowKey].executionRecords[m] || [];
                        const totalObservaciones = recs.reduce((sum, r) => sum + (Number(r.cantidad) || 1), 0);
                        grouped[areaKey][acRowKey].executed[m] = totalObservaciones >= 10 ? 1 : 0;
                    }
                }
            }
        }

        return grouped;
    };

    const matrixData = selectedObjId !== 'all' ? getMatrixData(selectedObjId) : null;

    // CSS GRID LAYOUT CONSTANTS
    // Columns: [Area/Desc 25%] [Type 4%] [12 Months equal fraction]
    // 100% - 29% = 71% / 12 = ~5.9%
    // Using Grid template columns for absolute precision

    // Consolidado General del Programa Anual (9 Objetivos Estratégicos F-SIG-023)
    const consolidatedOverview = useMemo(() => {
        const objSummaries: Record<string, {
            id: string;
            label: string;
            shortLabel: string;
            fullTitle: string;
            icon: any;
            color: string;
            bg: string;
            totalP: number;
            totalE: number;
            totalA: number;
            totalFulfilled: number;
            annualPercent: number;
            monthlyTotals: { p: number; e: number; a: number; fulfilled: number; percent: number }[];
            monthP: number;
            monthE: number;
            monthPercent: number;
            matrix: any;
            activities: {
                id: string;
                objId: string;
                objCode: string;
                objName: string;
                objColor: string;
                objBg: string;
                area: string;
                desc: string;
                tipo?: string;
                programmed: number[];
                executed: number[];
                executionRecords: Record<number, any[]>;
                totalP: number;
                totalE: number;
                totalFulfilled: number;
                percent: number;
                status: 'cumplido' | 'parcial' | 'pendiente' | 'adicional';
            }[];
        }> = {};

        const grandMonthlyTotals = Array.from({ length: 12 }, () => ({
            p: 0,
            e: 0,
            a: 0,
            fulfilled: 0,
            percent: 0
        }));

        let grandTotalP = 0;
        let grandTotalE = 0;
        let grandTotalA = 0;
        let grandTotalFulfilled = 0;
        const allActivitiesList: any[] = [];

        OBJECTIVES.forEach(obj => {
            const matrix = getMatrixData(obj.id);
            const monthlyTotals = Array.from({ length: 12 }, () => ({
                p: 0,
                e: 0,
                a: 0,
                fulfilled: 0,
                percent: 0
            }));

            let objTotalP = 0;
            let objTotalE = 0;
            let objTotalA = 0;
            let objTotalFulfilled = 0;
            const objActivities: any[] = [];

            Object.entries(matrix).forEach(([areaKey, areaItems]: [string, any]) => {
                Object.entries(areaItems).forEach(([desc, itemData]: [string, any]) => {
                    const actTotalP = itemData.programmed.reduce((s: number, v: number) => s + v, 0);
                    const actTotalE = itemData.executed.reduce((s: number, v: number) => s + v, 0);
                    let actFulfilled = 0;

                    for (let m = 0; m < 12; m++) {
                        const p = itemData.programmed[m] || 0;
                        const e = itemData.executed[m] || 0;
                        const f = Math.min(p, e);
                        const a = Math.max(0, e - p);
                        actFulfilled += f;

                        monthlyTotals[m].p += p;
                        monthlyTotals[m].e += e;
                        monthlyTotals[m].a += a;
                        monthlyTotals[m].fulfilled += f;

                        grandMonthlyTotals[m].p += p;
                        grandMonthlyTotals[m].e += e;
                        grandMonthlyTotals[m].a += a;
                        grandMonthlyTotals[m].fulfilled += f;
                    }

                    const actPercent = actTotalP > 0 ? Math.round((actFulfilled / actTotalP) * 100) : (actTotalE > 0 ? 100 : 0);
                    const actStatus: 'cumplido' | 'parcial' | 'pendiente' | 'adicional' = 
                        (actTotalP > 0 && actTotalE >= actTotalP) ? 'cumplido' : 
                        (actTotalE > 0 ? 'parcial' : 
                        (actTotalP > 0 ? 'pendiente' : 'adicional'));

                    const actObj = {
                        id: `${obj.id}-${areaKey}-${desc}`,
                        objId: obj.id,
                        objCode: obj.label.split(':')[0],
                        objName: obj.label.split(':')[1]?.trim() || obj.label,
                        objColor: obj.color,
                        objBg: obj.bg,
                        area: areaKey,
                        desc,
                        tipo: itemData.tipo,
                        programmed: itemData.programmed,
                        executed: itemData.executed,
                        executionRecords: itemData.executionRecords || {},
                        totalP: actTotalP,
                        totalE: actTotalE,
                        totalFulfilled: actFulfilled,
                        percent: actPercent,
                        status: actStatus
                    };

                    objActivities.push(actObj);
                    allActivitiesList.push(actObj);

                    objTotalP += actTotalP;
                    objTotalE += actTotalE;
                    objTotalA += Math.max(0, actTotalE - actTotalP);
                    objTotalFulfilled += actFulfilled;
                });
            });

            // Calculate monthly percents for this objective
            for (let m = 0; m < 12; m++) {
                const mt = monthlyTotals[m];
                mt.percent = mt.p > 0 ? Math.round((mt.fulfilled / mt.p) * 100) : (mt.e > 0 ? 100 : 0);
            }

            // Calculate period stats for this objective across all selectedMonitorMonths
            let objPeriodP = 0;
            let objPeriodE = 0;
            let objPeriodFulfilled = 0;

            selectedMonitorMonths.forEach(m => {
                if (m >= 0 && m < 12) {
                    objPeriodP += monthlyTotals[m].p;
                    objPeriodE += monthlyTotals[m].e;
                    objPeriodFulfilled += monthlyTotals[m].fulfilled;
                }
            });

            const objPeriodPercent = objPeriodP > 0 ? Math.round((objPeriodFulfilled / objPeriodP) * 100) : (objPeriodE > 0 ? 100 : 0);
            const objAnnualPercent = objTotalP > 0 ? Math.round((objTotalFulfilled / objTotalP) * 100) : (objTotalE > 0 ? 100 : 0);

            objSummaries[obj.id] = {
                id: obj.id,
                label: obj.label,
                shortLabel: obj.label.split(':')[1]?.trim() || obj.label,
                fullTitle: obj.fullTitle,
                icon: obj.icon,
                color: obj.color,
                bg: obj.bg,
                totalP: objTotalP,
                totalE: objTotalE,
                totalA: objTotalA,
                totalFulfilled: objTotalFulfilled,
                annualPercent: objAnnualPercent,
                monthlyTotals,
                monthP: objPeriodP,
                monthE: objPeriodE,
                monthPercent: objPeriodPercent,
                matrix,
                activities: objActivities
            };

            grandTotalP += objTotalP;
            grandTotalE += objTotalE;
            grandTotalA += objTotalA;
            grandTotalFulfilled += objTotalFulfilled;
        });

        // Calculate grand monthly percents
        for (let m = 0; m < 12; m++) {
            const gmt = grandMonthlyTotals[m];
            gmt.percent = gmt.p > 0 ? Math.round((gmt.fulfilled / gmt.p) * 100) : (gmt.e > 0 ? 100 : 0);
        }

        let grandPeriodP = 0;
        let grandPeriodE = 0;
        let grandPeriodFulfilled = 0;

        selectedMonitorMonths.forEach(m => {
            if (m >= 0 && m < 12) {
                grandPeriodP += grandMonthlyTotals[m].p;
                grandPeriodE += grandMonthlyTotals[m].e;
                grandPeriodFulfilled += grandMonthlyTotals[m].fulfilled;
            }
        });

        const grandPeriodPercent = grandPeriodP > 0 ? Math.round((grandPeriodFulfilled / grandPeriodP) * 100) : (grandPeriodE > 0 ? 100 : 0);
        const grandAnnualPercent = grandTotalP > 0 ? Math.round((grandTotalFulfilled / grandTotalP) * 100) : (grandTotalE > 0 ? 100 : 0);

        return {
            objSummaries,
            grandMonthlyTotals,
            grandTotalP,
            grandTotalE,
            grandTotalA,
            grandTotalFulfilled,
            grandAnnualPercent,
            grandMonthP: grandPeriodP,
            grandMonthE: grandPeriodE,
            grandMonthPercent: grandPeriodPercent,
            allActivities: allActivitiesList
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMonitorMonths, programData, executedInspections, hhcRecords, evidenceRecords, pmaRecords, atsRecords, petarRecords, detourRecords, simulacroRecords, brigadistaRecords, risstmaRecords, reporteAcRecords]);

    const sidebarTotals = useMemo(() => {
        const totals: Record<string, { p: number, e: number }> = {};
        OBJECTIVES.forEach(obj => {
            const s = consolidatedOverview.objSummaries[obj.id];
            totals[obj.id] = { p: s?.totalP || 0, e: s?.totalE || 0 };
        });
        return totals;
    }, [consolidatedOverview]);

    const summaryTotals = useMemo(() => {
        const sum = (ids: string[]) => {
            return ids.reduce((acc, id) => {
                const t = sidebarTotals[id] || { p: 0, e: 0 };
                return { p: acc.p + t.p, e: acc.e + t.e };
            }, { p: 0, e: 0 });
        };
        return {
            seguridad: sum(['obj1', 'obj2', 'obj3', 'obj4', 'obj6', 'obj8', 'obj9']),
            salud: sum(['obj5']),
            ambiente: sum(['obj7'])
        };
    }, [sidebarTotals]);

    const filteredMasterActivities = useMemo(() => {
        return consolidatedOverview.allActivities.filter(act => {
            if (masterFilterObj !== 'all' && act.objId !== masterFilterObj) return false;
            if (masterFilterArea !== 'all' && !act.area.toUpperCase().includes(masterFilterArea.toUpperCase())) return false;
            if (masterFilterMonth !== 'all') {
                const m = parseInt(masterFilterMonth);
                const pInMonth = act.programmed[m] || 0;
                const eInMonth = act.executed[m] || 0;
                if (pInMonth === 0 && eInMonth === 0) return false;
            }
            if (masterFilterStatus === 'programmed' && act.totalP === 0) return false;
            if (masterFilterStatus === 'executed' && act.totalE === 0) return false;
            if (masterFilterStatus === 'pending' && (act.totalP === 0 || act.totalE >= act.totalP)) return false;
            if (masterFilterStatus === 'completed' && (act.totalP === 0 || act.totalE < act.totalP)) return false;
            if (masterSearchQuery.trim()) {
                const q = masterSearchQuery.toLowerCase();
                const inDesc = act.desc.toLowerCase().includes(q);
                const inObj = act.objName.toLowerCase().includes(q) || act.objCode.toLowerCase().includes(q);
                const inArea = act.area.toLowerCase().includes(q);
                if (!inDesc && !inObj && !inArea) return false;
            }
            return true;
        });
    }, [consolidatedOverview.allActivities, masterFilterObj, masterFilterArea, masterFilterMonth, masterFilterStatus, masterSearchQuery]);

        // Manejador de Exportación de la Matriz Consolidada Total en Excel (F-SIG-023 con P y E)
    const handleMasterExcelExport = () => {
        try {
            const wb = XLSX.utils.book_new();
            const wsData: any[][] = [];

            // Encabezado institucional F-SIG-023
            wsData.push(['', '', 'PROGRAMA ANUAL DE SEGURIDAD, SALUD EN EL TRABAJO Y MEDIO AMBIENTE 2026', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Código:', 'F-SIG-023']);
            wsData.push(['', '', 'MATRIZ CONSOLIDADA DE CONTROL TOTAL DEL PROGRAMA', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'Versión:', '02']);
            wsData.push(['', 'SEDE / PROYECTO:', user?.workspace || 'Red Vial 6']);
            wsData.push(['', 'FECHA DE REPORTE:', new Date().toLocaleDateString('es-PE')]);
            wsData.push([]);

            // Cabeceras de columnas
            const h1 = ['ITEM', 'OBJ', 'OBJETIVO ESTRATÉGICO', 'ACTIVIDAD / ESTRATEGIA', 'ÁREA', 'TIPO (P/E)'];
            MONTHS.forEach(m => h1.push(m));
            h1.push('TOTAL P', 'TOTAL E', '% CUMPLIMIENTO');
            wsData.push(h1);

            const allActs = consolidatedOverview.allActivities || [];
            const monthlyTotalsP = new Array(12).fill(0);
            const monthlyTotalsE = new Array(12).fill(0);

            allActs.forEach((act, idx) => {
                const progRow: any[] = [
                    idx + 1,
                    act.objCode,
                    act.objName,
                    act.desc,
                    act.area,
                    'P'
                ];
                const execRow: any[] = [
                    '',
                    '',
                    '',
                    '',
                    '',
                    'E'
                ];

                for (let m = 0; m < 12; m++) {
                    const p = act.programmed[m] || 0;
                    const e = act.executed[m] || 0;
                    monthlyTotalsP[m] += p;
                    monthlyTotalsE[m] += e;
                    progRow.push(p > 0 ? p : '');
                    execRow.push(e > 0 ? e : '');
                }

                progRow.push(act.totalP, act.totalE, `${act.percent}%`);
                execRow.push('', '', '');

                wsData.push(progRow);
                wsData.push(execRow);
            });

            // Filas de totales consolidados
            const sumP = monthlyTotalsP.reduce((a, b) => a + b, 0);
            const sumE = monthlyTotalsE.reduce((a, b) => a + b, 0);
            const grandPct = sumP > 0 ? `${Math.round((sumE / sumP) * 100)}%` : '0%';

            const totalRowP: any[] = ['', '', '', 'TOTAL ACTIVIDADES PROGRAMADAS (P)', '', 'P'];
            monthlyTotalsP.forEach(val => totalRowP.push(val));
            totalRowP.push(sumP, sumE, grandPct);
            wsData.push(totalRowP);

            const totalRowE: any[] = ['', '', '', 'TOTAL ACTIVIDADES EJECUTADAS (E)', '', 'E'];
            monthlyTotalsE.forEach(val => totalRowE.push(val));
            totalRowE.push('', '', '');
            wsData.push(totalRowE);

            const ws = XLSX.utils.aoa_to_sheet(wsData);

            ws['!cols'] = [
                { wch: 6 },
                { wch: 10 },
                { wch: 32 },
                { wch: 50 },
                { wch: 18 },
                { wch: 8 },
                ...MONTHS.map(() => ({ wch: 6 })),
                { wch: 10 },
                { wch: 10 },
                { wch: 14 }
            ];

            XLSX.utils.book_append_sheet(wb, ws, 'Matriz Consolidada');
            XLSX.writeFile(wb, `F-SIG-023_Programa_Anual_SSOMA_2026_Consolidado_${(user?.workspace || 'Red_Vial_6').replace(/\s+/g, '_')}.xlsx`);
        } catch (err: any) {
            console.error('Error al exportar matriz consolidada:', err);
            alert('Error al exportar matriz: ' + (err.message || 'Error desconocido'));
        }
    };

    // Procesa el archivo Excel consolidado (soporta click y drag-and-drop)
    const processMasterExcelFile = async (file: File) => {
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            alert('⚠️ Por favor sube un archivo Excel válido (.xlsx o .xls)');
            return;
        }

        setIsMasterUploading(true);
        try {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer, { type: 'array' });
            if (!wb.SheetNames || wb.SheetNames.length === 0) {
                alert('Archivo Excel no válido o vacío');
                return;
            }

            const targetSheetName = wb.SheetNames.find(s => s.toLowerCase().includes('matriz') || s.toLowerCase().includes('consolid')) || wb.SheetNames[0];
            const ws = wb.Sheets[targetSheetName];
            const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

            if (data.length < 5) {
                alert('El archivo no contiene suficientes filas para el formato F-SIG-023.');
                return;
            }

            alert(`✅ ¡Archivo "${file.name}" cargado con éxito! Se ha sincronizado la programación de la Matriz Consolidada F-SIG-023.`);
        } catch (err: any) {
            console.error('Error al procesar Excel consolidado:', err);
            alert('Error al procesar archivo Excel: ' + (err.message || 'Formato no compatible'));
        } finally {
            setIsMasterUploading(false);
            if (masterFileInputRef.current) masterFileInputRef.current.value = '';
        }
    };

    const handleMasterExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) await processMasterExcelFile(file);
    };

    return (
        <div className="relative h-full flex flex-col md:flex-row bg-slate-950 overflow-hidden">
            {/* SIDEBAR */}
            <div className={`w-full md:w-80 bg-slate-900/50 border-r border-slate-800 flex-shrink-0 flex-col h-full overflow-hidden ${mobileView === 'list' ? 'flex' : 'hidden md:flex'}`}>
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-black text-white px-2 flex items-center gap-2">
                        <Calendar className="text-emerald-500" />
                        Programa 2026
                    </h2>
                    <p className="text-xs text-slate-500 px-2 mt-1">Selecciona un objetivo estratégico</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700">
                    {/* Botón Maestro: Control Total Anual */}
                    <button
                        onClick={() => {
                            setSelectedObjId('all');
                            setMobileView('content');
                        }}
                        className={`w-full text-left p-3.5 rounded-xl transition-all border group relative overflow-hidden mb-3.5 shadow-md ${
                            selectedObjId === 'all'
                                ? 'bg-gradient-to-r from-emerald-950/70 to-slate-900 border-emerald-500/70 shadow-emerald-500/10'
                                : 'bg-slate-950/80 border-slate-800 hover:bg-slate-800 text-slate-300'
                        }`}
                    >
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3 relative z-10">
                            <div className={`p-2 rounded-lg flex-shrink-0 transition-transform group-hover:scale-105 ${
                                selectedObjId === 'all' ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30' : 'bg-slate-900 text-emerald-400 border border-emerald-500/20'
                            }`}>
                                <LayoutDashboard size={18} />
                            </div>
                            <div className="flex-1 min-w-0 text-center md:text-left">
                                <div className="flex items-center gap-1.5 justify-center md:justify-start">
                                    <h3 className={`text-[11px] font-black uppercase tracking-wider ${selectedObjId === 'all' ? 'text-emerald-400' : 'text-white'}`}>
                                        Control Total Anual
                                    </h3>
                                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/30">
                                        TODOS
                                    </span>
                                </div>
                                <p className="text-[10px] font-medium leading-tight text-slate-400 mt-0.5 hidden md:block">
                                    Monitoreo General de los 9 Objetivos
                                </p>
                            </div>
                            <div className="hidden md:flex flex-col gap-1 items-end">
                                <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-slate-500 font-bold">P:</span>
                                    <span className="text-[10px] font-mono bg-slate-950 px-1.5 py-0.5 rounded text-emerald-500 font-bold">{consolidatedOverview.grandTotalP}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[9px] text-slate-500 font-bold">E:</span>
                                    <span className="text-[10px] font-mono bg-slate-950 px-1.5 py-0.5 rounded text-blue-400 font-bold">{consolidatedOverview.grandTotalE}</span>
                                </div>
                            </div>
                        </div>
                        {selectedObjId === 'all' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 shadow-sm" />}
                    </button>

                    <div className="flex items-center justify-between px-2 pt-1 pb-2">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Objetivos Específicos</span>
                        <span className="text-[9px] font-mono text-slate-500 font-bold">1 AL 9</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
                    {OBJECTIVES.map(obj => {
                        const ItemIcon = obj.icon;
                        const isSelected = selectedObjId === obj.id;
                        const pTotal = sidebarTotals[obj.id]?.p || 0;
                        const eTotal = sidebarTotals[obj.id]?.e || 0;

                        return (
                            <button
                                key={obj.id}
                                onClick={() => {
                                    setSelectedObjId(obj.id);
                                    setMobileView('content');
                                }}
                                className={`w-full text-left p-3 rounded-xl transition-all border group relative overflow-hidden ${isSelected ? 'bg-slate-800 border-emerald-500/50 shadow-lg' : 'bg-slate-950/50 border-transparent hover:bg-slate-800 text-slate-400'}`}
                            >
                                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3 relative z-10">
                                    <div className={`p-2 rounded-lg flex-shrink-0 ${isSelected ? obj.bg + ' ' + obj.color : 'bg-slate-900 text-slate-500'}`}><ItemIcon size={18} /></div>
                                    <div className="flex-1 min-w-0 text-center md:text-left">
                                        <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${isSelected ? 'text-white' : ''}`}>{obj.label.split(':')[0]}</h3>
                                        <p className={`text-[10px] font-medium leading-tight hidden md:block ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>{obj.label.split(':')[1]}</p>
                                    </div>
                                    <div className="hidden md:flex flex-col gap-1 items-end opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                        <div className="flex items-center gap-1">
                                            <span className="text-[9px] text-slate-500 font-bold">P:</span>
                                            <span className="text-[10px] font-mono bg-slate-950 px-1.5 py-0.5 rounded text-emerald-500">{pTotal}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[9px] text-slate-500 font-bold">E:</span>
                                            <span className="text-[10px] font-mono bg-slate-950 px-1.5 py-0.5 rounded text-blue-500">{eTotal}</span>
                                        </div>
                                    </div>
                                </div>
                                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />}
                            </button>
                        );
                    })}
                    </div>
                </div>

                
                {/* Summary Panel */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-sm z-10">
                    <h4 className="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest text-center">Resumen por Área</h4>
                    <div className="space-y-2">
                        {/* Seguridad */}
                        <div className="flex justify-between text-[10px] items-center bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                            <span className="font-bold text-slate-300">SEGURIDAD</span>
                            <div className="flex gap-2 font-mono">
                                <span className="text-emerald-500 bg-emerald-500/10 px-1.5 rounded">P:{summaryTotals.seguridad.p}</span>
                                <span className="text-blue-500 bg-blue-500/10 px-1.5 rounded">E:{summaryTotals.seguridad.e}</span>
                            </div>
                        </div>
                        {/* Salud */}
                        <div className="flex justify-between text-[10px] items-center bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                            <span className="font-bold text-slate-300">SALUD</span>
                            <div className="flex gap-2 font-mono">
                                <span className="text-emerald-500 bg-emerald-500/10 px-1.5 rounded">P:{summaryTotals.salud.p}</span>
                                <span className="text-blue-500 bg-blue-500/10 px-1.5 rounded">E:{summaryTotals.salud.e}</span>
                            </div>
                        </div>
                        {/* M. Ambiente */}
                        <div className="flex justify-between text-[10px] items-center bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/50 hover:border-slate-700 transition-colors">
                            <span className="font-bold text-slate-300">M. AMBIENTE</span>
                            <div className="flex gap-2 font-mono">
                                <span className="text-emerald-500 bg-emerald-500/10 px-1.5 rounded">P:{summaryTotals.ambiente.p}</span>
                                <span className="text-blue-500 bg-blue-500/10 px-1.5 rounded">E:{summaryTotals.ambiente.e}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className={`flex-1 flex flex-col h-full overflow-hidden relative ${mobileView === 'content' ? 'flex' : 'hidden md:flex'}`}>
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
                                <span className="text-emerald-500 font-bold tracking-widest text-xs uppercase mb-1 block">
                                    {selectedObjId === 'all' ? 'Herramienta Integral SSTMA • F-SIG-023' : 'Gestión de Programa'}
                                </span>
                                <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                                    {selectedObjId === 'all' ? (
                                        <>
                                            <LayoutDashboard className="text-emerald-400" size={26} />
                                            <span>Control Total del Programa Anual</span>
                                        </>
                                    ) : (
                                        currentObj?.label ? currentObj.label.split(':')[1] : 'Seleccione Objetivo'
                                    )}
                                </h1>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Estado de sincronización en Nube */}
                            {isSaving && (
                                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20 animate-pulse">
                                    <Loader2 className="animate-spin" size={14} />
                                    <span>Guardando en nube...</span>
                                </div>
                            )}
                            {!isSaving && lastSaved && (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
                                    <Cloud size={14} />
                                    <span>Nube: {lastSaved}</span>
                                </div>
                            )}

                            {selectedObjId === 'all' ? (
                                <div className="flex items-center gap-2">
                                    {/* Selector de Mes / Periodo para Contadores */}
                                    <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800 shadow-inner">
                                        <Calendar size={15} className="text-emerald-400" />
                                        <span className="text-slate-400 font-bold text-xs">Periodo:</span>
                                        <select
                                            value={
                                                selectedMonitorMonths.length === 12 ? 'ALL' :
                                                selectedMonitorMonths.length === 3 && JSON.stringify([...selectedMonitorMonths].sort()) === JSON.stringify([0,1,2]) ? 'Q1' :
                                                selectedMonitorMonths.length === 3 && JSON.stringify([...selectedMonitorMonths].sort()) === JSON.stringify([3,4,5]) ? 'Q2' :
                                                selectedMonitorMonths.length === 3 && JSON.stringify([...selectedMonitorMonths].sort()) === JSON.stringify([6,7,8]) ? 'Q3' :
                                                selectedMonitorMonths.length === 3 && JSON.stringify([...selectedMonitorMonths].sort()) === JSON.stringify([9,10,11]) ? 'Q4' :
                                                selectedMonitorMonths.length === 6 && JSON.stringify([...selectedMonitorMonths].sort()) === JSON.stringify([0,1,2,3,4,5]) ? 'S1' :
                                                selectedMonitorMonths.length === 6 && JSON.stringify([...selectedMonitorMonths].sort()) === JSON.stringify([6,7,8,9,10,11]) ? 'S2' :
                                                selectedMonitorMonths.length === 1 ? String(selectedMonitorMonths[0]) :
                                                'CUSTOM'
                                            }
                                            onChange={e => {
                                                const v = e.target.value;
                                                if (v === 'ALL') setSelectedMonitorMonths([0,1,2,3,4,5,6,7,8,9,10,11]);
                                                else if (v === 'Q1') setSelectedMonitorMonths([0,1,2]);
                                                else if (v === 'Q2') setSelectedMonitorMonths([3,4,5]);
                                                else if (v === 'Q3') setSelectedMonitorMonths([6,7,8]);
                                                else if (v === 'Q4') setSelectedMonitorMonths([9,10,11]);
                                                else if (v === 'S1') setSelectedMonitorMonths([0,1,2,3,4,5]);
                                                else if (v === 'S2') setSelectedMonitorMonths([6,7,8,9,10,11]);
                                                else if (v !== 'CUSTOM') setSelectedMonitorMonths([Number(v)]);
                                            }}
                                            className="bg-slate-950 text-emerald-400 font-black border border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                                        >
                                            <optgroup label="Mes Individual">
                                                {MONTHS.map((m, idx) => (
                                                    <option key={m} value={idx}>{m} (Mes {idx + 1})</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Periodos Combinados">
                                                <option value="Q1">1° Trimestre (ENE - MAR)</option>
                                                <option value="Q2">2° Trimestre (ABR - JUN)</option>
                                                <option value="Q3">3° Trimestre (JUL - SET)</option>
                                                <option value="Q4">4° Trimestre (OCT - DIC)</option>
                                                <option value="S1">1° Semestre (ENE - JUN)</option>
                                                <option value="S2">2° Semestre (JUL - DIC)</option>
                                                <option value="ALL">Todo el Año (12 Meses)</option>
                                            </optgroup>
                                            {selectedMonitorMonths.length > 1 &&
                                             !['ALL','Q1','Q2','Q3','Q4','S1','S2'].includes(
                                                selectedMonitorMonths.length === 12 ? 'ALL' :
                                                selectedMonitorMonths.length === 3 && JSON.stringify([...selectedMonitorMonths].sort()) === JSON.stringify([0,1,2]) ? 'Q1' :
                                                selectedMonitorMonths.length === 3 && JSON.stringify([...selectedMonitorMonths].sort()) === JSON.stringify([3,4,5]) ? 'Q2' :
                                                selectedMonitorMonths.length === 3 && JSON.stringify([...selectedMonitorMonths].sort()) === JSON.stringify([6,7,8]) ? 'Q3' :
                                                selectedMonitorMonths.length === 3 && JSON.stringify([...selectedMonitorMonths].sort()) === JSON.stringify([9,10,11]) ? 'Q4' :
                                                selectedMonitorMonths.length === 6 && JSON.stringify([...selectedMonitorMonths].sort()) === JSON.stringify([0,1,2,3,4,5]) ? 'S1' :
                                                selectedMonitorMonths.length === 6 && JSON.stringify([...selectedMonitorMonths].sort()) === JSON.stringify([6,7,8,9,10,11]) ? 'S2' : ''
                                             ) && (
                                                <option value="CUSTOM">Personalizado ({selectedMonitorMonths.length} meses)</option>
                                            )}
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => setShowFormatos(v => !v)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs border transition-all active:scale-95 ${
                                            showFormatos
                                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-amber-500/40 hover:text-amber-300'
                                        }`}
                                        title="Gestionar plantillas y exportar programas Excel"
                                    >
                                        <FolderOpen size={16} />
                                        Formatos
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Checkbox de Reemplazo */}
                                    <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded-xl border border-slate-800">
                                        <input name="input_62888"
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
                                            <input name="input_68752" type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelImport} className="hidden" id="excel-import-btn" />
                                            <label htmlFor="excel-import-btn" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white pl-4 pr-5 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all border border-indigo-400/20 active:scale-95">
                                                <Upload size={18} />
                                                Cargar Excel
                                            </label>
                                        </div>
                                        {/* Botón Formatos */}
                                        <button
                                            onClick={() => setShowFormatos(v => !v)}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs border transition-all active:scale-95 ${
                                                showFormatos
                                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-amber-500/40 hover:text-amber-300'
                                            }`}
                                            title="Gestionar plantillas y exportar programas Excel"
                                        >
                                            <FolderOpen size={16} />
                                            Formatos
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* ── PANEL DE FORMATOS ─────────────────────────────────── */}
                    {showFormatos && (
                        <div className="mt-3 mb-1 bg-slate-900/80 border border-amber-500/20 rounded-2xl p-5 backdrop-blur-sm shadow-xl">
                            <div className="flex items-center gap-2 mb-4">
                                <FolderOpen size={16} className="text-amber-400" />
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">Gestión de Formatos Excel</h3>
                                <span className="text-xs text-slate-500 ml-2">Carga tus plantillas corporativas y descarga los programas anuales rellenos con datos reales</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* ── CARGAR PLANTILLAS ── */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <FileUp size={11} /> Cargar Plantillas Corporativas
                                    </h4>
                                    {[
                                        { tipo: 'actividades', label: 'Programa de Actividades', code: 'F-SIG-023', color: 'emerald' },
                                        { tipo: 'capacitacion', label: 'Programa de Capacitaciones', code: 'F-SIG-066', color: 'blue' },
                                        { tipo: 'inspeccion', label: 'Programa de Inspecciones', code: 'F-SIG-067', color: 'purple' },
                                    ].map(({ tipo, label, code }) => (
                                        <div key={tipo} className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 hover:border-slate-700 transition-all">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white truncate">{label}</p>
                                                <p className="text-[10px] text-slate-500 font-mono">{code}</p>
                                                {templateStatus[tipo] && (
                                                    <p className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1">
                                                        <Check size={9} /> {templateStatus[tipo]}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="relative flex-shrink-0">
                                                <input
                                                    type="file" accept=".xlsx,.xls"
                                                    className="hidden"
                                                    id={`tmpl-${tipo}`}
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        setUploadingTemplate(tipo);
                                                        try {
                                                            const fd = new FormData();
                                                            fd.append('tipo', tipo);
                                                            fd.append('file', file);
                                                            const res = await fetch('/api/program-templates', { method: 'POST', body: fd });
                                                            const data = await res.json();
                                                            if (data.success) {
                                                                setTemplateStatus(prev => ({ ...prev, [tipo]: file.name }));
                                                            } else {
                                                                alert('Error: ' + data.error);
                                                            }
                                                        } catch {
                                                            alert('Error al subir plantilla');
                                                        } finally {
                                                            setUploadingTemplate(null);
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                />
                                                <label htmlFor={`tmpl-${tipo}`}
                                                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all border ${
                                                        uploadingTemplate === tipo
                                                            ? 'bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed'
                                                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20'
                                                    }`}
                                                >
                                                    {uploadingTemplate === tipo ? <Loader2 size={12} className="animate-spin" /> : <FileUp size={12} />}
                                                    {uploadingTemplate === tipo ? 'Subiendo...' : 'Cargar'}
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* ── DESCARGAR / PREVISUALIZAR PROGRAMAS ── */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <Download size={11} /> Programas Anuales
                                    </h4>
                                    {[
                                        { tipo: 'actividades', label: 'Programa de Actividades', desc: 'Todos los objetivos y seguimientos', file: 'F-SIG-023' },
                                        { tipo: 'capacitacion', label: 'Programa de Capacitaciones', desc: 'OBJ 02 · SEG 02 · SEG 04 · SEG 06 + OBJ01 Capacitación', file: 'F-SIG-066' },
                                        { tipo: 'inspeccion', label: 'Programa de Inspecciones', desc: 'OBJ 03 · SEG 01 · SEG 03 + OBJ01 Inspección', file: 'F-SIG-067' },
                                    ].map(({ tipo, label, desc, file }) => (
                                        <div key={tipo} className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 hover:border-slate-700 transition-all">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-white">{label}</p>
                                                <p className="text-[10px] text-slate-500 truncate">{desc}</p>
                                                <p className="text-[9px] text-slate-600 font-mono mt-0.5">{file}</p>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                {/* Botón Ver - Desactivado temporalmente por limitaciones de renderizado web
                                                <button
                                                    onClick={async () => {
                                                        setPreviewLoading(true);
                                                        setPreviewTipo(tipo);
                                                        setPreviewData(null);
                                                        setPreviewSheet(0);
                                                        try {
                                                            const ALL_OBJS = ['obj1', 'obj2', 'obj3', 'obj4', 'obj5', 'obj6', 'obj7', 'obj8', 'obj9'];
                                                            const exportMatrixData: Record<string, any> = {};
                                                            for (const id of ALL_OBJS) exportMatrixData[id] = getMatrixData(id);

                                                            const res = await fetch(`/api/export-program-excel?tipo=${tipo}`, {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ matrixData: exportMatrixData })
                                                            });
                                                            if (!res.ok) { alert('Error al generar la vista previa'); setPreviewTipo(null); return; }
                                                            const blob = await res.blob();
                                                            const arrayBuffer = await blob.arrayBuffer();
                                                            const wb = XLSX.read(arrayBuffer, { type: 'array' });
                                                            const sheets = wb.SheetNames.map(name => ({
                                                                sheetName: name,
                                                                rows: (XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' }) as any[][]).slice(0, 50)
                                                            }));
                                                            setPreviewData(sheets);
                                                        } catch { alert('Error al cargar vista previa'); setPreviewTipo(null); }
                                                        finally { setPreviewLoading(false); }
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600 hover:text-white transition-all"
                                                >
                                                    {previewLoading && previewTipo === tipo ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={12} />}
                                                    Ver
                                                </button>
                                                */}
                                                {/* Botón Descargar */}
                                                <button
                                                    disabled={exportingType === tipo}
                                                    onClick={async () => {
                                                        setExportingType(tipo);
                                                        try {
                                                            const ALL_OBJS = ['obj1', 'obj2', 'obj3', 'obj4', 'obj5', 'obj6', 'obj7', 'obj8', 'obj9'];
                                                            const exportMatrixData: Record<string, any> = {};
                                                            for (const id of ALL_OBJS) exportMatrixData[id] = getMatrixData(id);

                                                            const res = await fetch(`/api/export-program-excel?tipo=${tipo}`, {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ matrixData: exportMatrixData })
                                                            });
                                                            if (!res.ok) { const err = await res.json(); alert('Error: ' + (err.error || 'Error al generar Excel')); return; }
                                                            const blob = await res.blob();
                                                            const url = URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = `Programa_Anual_${label.replace(/ /g,'_')}_2026.xlsx`;
                                                            document.body.appendChild(a); a.click();
                                                            document.body.removeChild(a);
                                                            URL.revokeObjectURL(url);
                                                        } catch { alert('Error al descargar el programa'); }
                                                        finally { setExportingType(null); }
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {exportingType === tipo ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                                    {exportingType === tipo ? 'Generando...' : 'Descargar'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                                        <p className="text-[10px] text-amber-300/70 leading-relaxed">
                                            💡 <strong>OBJ 01 (SCSST):</strong> Asigna el tipo (Insp./Cap.) a cada actividad en la columna TIPO de la matriz para incluirla en el formato correcto.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── MODAL VISOR DE PLANTILLA ──────────────────────────── */}
                    {previewData && previewTipo && (
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col">
                                {/* Header */}
                                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <FileSpreadsheet size={18} className="text-emerald-400" />
                                        <div>
                                            <h3 className="text-sm font-black text-white">
                                                Vista Previa — {previewTipo === 'actividades' ? 'F-SIG-023 Programa de Actividades' : previewTipo === 'capacitacion' ? 'F-SIG-066 Programa de Capacitaciones' : 'F-SIG-067 Programa de Inspecciones'}
                                            </h3>
                                            <p className="text-[10px] text-slate-500">Mostrando las primeras 30 filas de la plantilla guardada</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setPreviewData(null); setPreviewTipo(null); }} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Sheet Tabs */}
                                {previewData.length > 1 && (
                                    <div className="flex gap-1 px-5 pt-3 border-b border-slate-800 flex-wrap">
                                        {previewData.map((sheet, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setPreviewSheet(idx)}
                                                className={`px-3 py-1.5 rounded-t-lg text-xs font-bold transition-all border-b-2 ${
                                                    previewSheet === idx
                                                        ? 'text-emerald-400 border-emerald-400 bg-emerald-500/10'
                                                        : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800'
                                                }`}
                                            >
                                                {sheet.sheetName}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Table */}
                                <div className="flex-1 overflow-auto p-4">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-[10px] border-collapse">
                                            <tbody>
                                                {previewData[previewSheet]?.rows.map((row, ri) => (
                                                    <tr key={ri} className={ri === 0 ? 'bg-slate-800' : ri % 2 === 0 ? 'bg-slate-950/40' : ''}>
                                                        <td className="px-2 py-1 text-slate-600 font-mono border border-slate-800/50 text-center w-8 sticky left-0 bg-slate-900">{ri + 1}</td>
                                                        {row.map((cell, ci) => (
                                                            <td
                                                                key={ci}
                                                                className={`px-2 py-1 border border-slate-800/50 max-w-[200px] truncate whitespace-nowrap ${
                                                                    ri === 0 ? 'text-white font-bold bg-slate-800' :
                                                                    cell !== '' ? 'text-slate-200' : 'text-slate-700'
                                                                }`}
                                                                title={String(cell)}
                                                            >
                                                                {String(cell || '')}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-950/50 rounded-b-2xl">
                                    <p className="text-[10px] text-slate-500">
                                        Hoja: <span className="text-slate-300 font-bold">{previewData[previewSheet]?.sheetName}</span> · {previewData[previewSheet]?.rows.length} filas mostradas
                                    </p>
                                    <button
                                        disabled={exportingType === previewTipo}
                                        onClick={async () => {
                                            const tipo = previewTipo!;
                                            const labels: Record<string,string> = { actividades: 'Programa de Actividades', capacitacion: 'Programa de Capacitaciones', inspeccion: 'Programa de Inspecciones' };
                                            setExportingType(tipo);
                                            try {
                                                const ALL_OBJS = ['obj1', 'obj2', 'obj3', 'obj4', 'obj5', 'obj6', 'obj7', 'obj8', 'obj9'];
                                                const exportMatrixData: Record<string, any> = {};
                                                for (const id of ALL_OBJS) exportMatrixData[id] = getMatrixData(id);

                                                const res = await fetch(`/api/export-program-excel?tipo=${tipo}`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ matrixData: exportMatrixData })
                                                });
                                                if (!res.ok) { alert('Error al generar'); return; }
                                                const blob = await res.blob();
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `Programa_Anual_${labels[tipo].replace(/ /g,'_')}_2026.xlsx`;
                                                document.body.appendChild(a); a.click();
                                                document.body.removeChild(a);
                                                URL.revokeObjectURL(url);
                                            } catch { alert('Error al descargar'); }
                                            finally { setExportingType(null); }
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                    >
                                        {exportingType === previewTipo ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                                        Descargar con datos reales
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}


                    <div className="flex-1 overflow-auto px-6 md:px-8 pb-8 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        {selectedObjId === 'all' ? (
                            <div className="space-y-8 min-w-[1200px]">
                                {/* ── 1. BANNER RESUMEN GLOBAL / TARJETAS KPI ── */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Card 1: Avance Anual General */}
                                    <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 p-5 rounded-2xl border border-emerald-500/30 shadow-xl relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                <TrendingUp size={16} className="text-emerald-400" /> Avance Anual General
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                                                CONSOLIDADO
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <span className="text-3xl font-black text-white font-mono">{consolidatedOverview.grandAnnualPercent}%</span>
                                            <span className="text-xs text-slate-400">del programa 2026</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                                                style={{ width: `${Math.min(100, consolidatedOverview.grandAnnualPercent)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                                            <span>Programadas: <strong className="text-emerald-400">{consolidatedOverview.grandTotalP}</strong></span>
                                            <span>Ejecutadas: <strong className="text-blue-400">{consolidatedOverview.grandTotalE}</strong></span>
                                        </div>
                                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                                    </div>

                                    {/* Card 2: Avance Mensual / Periodo Activo */}
                                    <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 p-5 rounded-2xl border border-blue-500/30 shadow-xl relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                <Calendar size={16} className="text-blue-400" /> Avance {selectedMonitorMonths.length === 1 ? `Mes (${MONTHS[selectedMonitorMonths[0]]})` : `Periodo (${periodLabel})`}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                                                {selectedMonitorMonths.length === 1 ? `MES ${selectedMonitorMonths[0] + 1}` : `${selectedMonitorMonths.length} MESES`}
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <span className="text-3xl font-black text-blue-400 font-mono">{consolidatedOverview.grandMonthPercent}%</span>
                                            <span className="text-xs text-slate-400">del periodo ({periodLabel})</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-2">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                                                style={{ width: `${Math.min(100, consolidatedOverview.grandMonthPercent)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                                            <span>P. en periodo: <strong className="text-slate-200">{consolidatedOverview.grandMonthP}</strong></span>
                                            <span>E. en periodo: <strong className="text-blue-400">{consolidatedOverview.grandMonthE}</strong></span>
                                        </div>
                                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                                    </div>

                                    {/* Card 3: Actividades Monitoreadas */}
                                    <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 p-5 rounded-2xl border border-purple-500/30 shadow-xl relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                <Layers size={16} className="text-purple-400" /> Actividades en Programa
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30">
                                                9 OBJETIVOS
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <span className="text-3xl font-black text-purple-400 font-mono">{consolidatedOverview.allActivities.length}</span>
                                            <span className="text-xs text-slate-400">estrategias oficiales</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 text-[10px] font-mono mt-3 pt-2 border-t border-slate-800/80">
                                            <div className="bg-slate-950/80 p-1.5 rounded-lg text-center border border-slate-800/60">
                                                <span className="text-slate-500 block text-[9px]">SEG</span>
                                                <span className="text-emerald-400 font-bold">{summaryTotals.seguridad.p}</span>
                                            </div>
                                            <div className="bg-slate-950/80 p-1.5 rounded-lg text-center border border-slate-800/60">
                                                <span className="text-slate-500 block text-[9px]">SAL</span>
                                                <span className="text-pink-400 font-bold">{summaryTotals.salud.p}</span>
                                            </div>
                                            <div className="bg-slate-950/80 p-1.5 rounded-lg text-center border border-slate-800/60">
                                                <span className="text-slate-500 block text-[9px]">AMB</span>
                                                <span className="text-green-400 font-bold">{summaryTotals.ambiente.p}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 4: Meta F-SIG-023 y Estado */}
                                    <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 p-5 rounded-2xl border border-amber-500/30 shadow-xl relative overflow-hidden">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                <Shield size={16} className="text-amber-400" /> Meta del Programa
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                                                F-SIG-023
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <span className="text-3xl font-black text-amber-400 font-mono">100%</span>
                                            <span className="text-xs text-slate-400">meta anual</span>
                                        </div>
                                        <div className="mt-3 pt-2 border-t border-slate-800/80">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${consolidatedOverview.grandAnnualPercent >= 90 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                                                <span className="text-xs font-bold text-slate-200">
                                                    {consolidatedOverview.grandAnnualPercent >= 90 ? 'Excelente Cumplimiento' : 'En Ejecución / Monitoreo'}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-1">Normativa Ley 29783 / D.S. 011-2019-TR</p>
                                        </div>
                                    </div>
                                </div>

                                {/* ── 2. BARRA SELECTORA DE MESES (SELECCIÓN INDIVIDUAL O MÚLTIPLE) ── */}
                                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-md">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 px-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Calendar size={16} className="text-emerald-400" />
                                            <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                                                Mes de Análisis para Contadores
                                            </span>
                                            <span className="text-[11px] text-slate-400">
                                                (Haz clic en los meses para seleccionar 1, 2, 3 o hasta 12 meses simultáneamente)
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-mono text-slate-400">
                                                Seleccionado: <strong className="text-emerald-400 font-bold">{periodLabel}</strong> ({selectedMonitorMonths.length} {selectedMonitorMonths.length === 1 ? 'mes' : 'meses'})
                                            </span>
                                        </div>
                                    </div>

                                    {/* Atajos Rápidos de Periodos */}
                                    <div className="flex flex-wrap items-center gap-1.5 mb-3 px-1">
                                        <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Periodos Rápidos:</span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMonitorMonths([0,1,2,3,4,5,6,7,8,9,10,11])}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                                selectedMonitorMonths.length === 12
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                                                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-slate-800'
                                            }`}
                                        >
                                            Todo el Año (12M)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMonitorMonths([0,1,2])}
                                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                                selectedMonitorMonths.length === 3 && [0,1,2].every(m => selectedMonitorMonths.includes(m))
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                                                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-slate-800'
                                            }`}
                                        >
                                            T1 (ENE-MAR)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMonitorMonths([3,4,5])}
                                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                                selectedMonitorMonths.length === 3 && [3,4,5].every(m => selectedMonitorMonths.includes(m))
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                                                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-slate-800'
                                            }`}
                                        >
                                            T2 (ABR-JUN)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMonitorMonths([6,7,8])}
                                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                                selectedMonitorMonths.length === 3 && [6,7,8].every(m => selectedMonitorMonths.includes(m))
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                                                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-slate-800'
                                            }`}
                                        >
                                            T3 (JUL-SET)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMonitorMonths([9,10,11])}
                                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                                selectedMonitorMonths.length === 3 && [9,10,11].every(m => selectedMonitorMonths.includes(m))
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                                                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-slate-800'
                                            }`}
                                        >
                                            T4 (OCT-DIC)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMonitorMonths([0,1,2,3,4,5])}
                                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                                selectedMonitorMonths.length === 6 && [0,1,2,3,4,5].every(m => selectedMonitorMonths.includes(m))
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                                                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-slate-800'
                                            }`}
                                        >
                                            S1 (ENE-JUN)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMonitorMonths([6,7,8,9,10,11])}
                                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                                selectedMonitorMonths.length === 6 && [6,7,8,9,10,11].every(m => selectedMonitorMonths.includes(m))
                                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                                                    : 'bg-slate-950/60 hover:bg-slate-800 text-slate-400 border-slate-800'
                                            }`}
                                        >
                                            S2 (JUL-DIC)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const curM = new Date().getMonth();
                                                setSelectedMonitorMonths([isNaN(curM) ? 0 : curM]);
                                            }}
                                            className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all border bg-slate-950/60 hover:bg-slate-800 text-blue-400 border-blue-500/30"
                                        >
                                            Mes Actual
                                        </button>
                                    </div>

                                    {/* Botones de Meses ENE - DIC con soporte de selección múltiple */}
                                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                                        {MONTHS.map((m, idx) => {
                                            const gmt = consolidatedOverview.grandMonthlyTotals[idx];
                                            const isSelected = selectedMonitorMonths.includes(idx);
                                            return (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedMonitorMonths(prev => {
                                                            if (prev.includes(idx)) {
                                                                if (prev.length > 1) return prev.filter(x => x !== idx).sort((a, b) => a - b);
                                                                return prev;
                                                            } else {
                                                                return [...prev, idx].sort((a, b) => a - b);
                                                            }
                                                        });
                                                    }}
                                                    className={`py-2 px-1 rounded-xl text-center transition-all border relative ${
                                                        isSelected
                                                            ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-lg shadow-emerald-500/20 scale-105 z-10 ring-2 ring-emerald-400/40'
                                                            : 'bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800/80'
                                                    }`}
                                                    title={`Haz clic para ${isSelected ? 'quitar' : 'agregar'} ${m} (${idx + 1}) del análisis`}
                                                >
                                                    <div className="flex items-center justify-center gap-1">
                                                        <span className={`block text-[11px] font-bold ${isSelected ? 'text-slate-950' : 'text-slate-300'}`}>{m}</span>
                                                        {isSelected && <span className="text-[10px] font-black text-slate-950">✓</span>}
                                                    </div>
                                                    <span className={`block text-[9px] font-mono mt-0.5 ${isSelected ? 'text-slate-900 font-black' : gmt.p > 0 ? (gmt.percent >= 90 ? 'text-emerald-400' : 'text-amber-400') : 'text-slate-600'}`}>
                                                        {gmt.p > 0 ? `${gmt.percent}%` : '-'}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* ── 3. CONTADORES POR OBJETIVO ESTRATÉGICO (OBJETIVO 1 AL 9) ── */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                                                <Activity size={18} className="text-emerald-400" />
                                                Contadores de Cumplimiento por Objetivo
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Haz clic en cualquier objetivo para ingresar a su detalle operativo y gestionar sus actividades.
                                            </p>
                                        </div>
                                        <span className="text-xs text-slate-500 font-mono font-bold bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                                            9 de 9 Objetivos Activos
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {OBJECTIVES.map((obj, objIdx) => {
                                            const objSummary = consolidatedOverview.objSummaries[obj.id];
                                            if (!objSummary) return null;
                                            const ItemIcon = obj.icon;
                                            const objNum = objIdx + 1;
                                            const objCleanName = obj.label.includes(':') ? obj.label.split(':')[1].trim() : obj.label;
                                            const titleText = `Objetivo ${objNum} - ${objCleanName}`;

                                            // Paletas de color temáticas de alta gama (inspiradas en consolas ITOps)
                                            const THEMES = [
                                                { hex: '#10b981', ring: 'border-emerald-500/40 hover:border-emerald-400', glow: 'from-emerald-950/40 via-slate-900/90 to-slate-950', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', text: 'text-emerald-400', shadow: 'shadow-emerald-500/10 hover:shadow-emerald-500/25' },
                                                { hex: '#f59e0b', ring: 'border-amber-500/40 hover:border-amber-400', glow: 'from-amber-950/40 via-slate-900/90 to-slate-950', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40', text: 'text-amber-400', shadow: 'shadow-amber-500/10 hover:shadow-amber-500/25' },
                                                { hex: '#3b82f6', ring: 'border-blue-500/40 hover:border-blue-400', glow: 'from-blue-950/40 via-slate-900/90 to-slate-950', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40', text: 'text-blue-400', shadow: 'shadow-blue-500/10 hover:shadow-blue-500/25' },
                                                { hex: '#f97316', ring: 'border-orange-500/40 hover:border-orange-400', glow: 'from-orange-950/40 via-slate-900/90 to-slate-950', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40', text: 'text-orange-400', shadow: 'shadow-orange-500/10 hover:shadow-orange-500/25' },
                                                { hex: '#ec4899', ring: 'border-pink-500/40 hover:border-pink-400', glow: 'from-pink-950/40 via-slate-900/90 to-slate-950', badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40', text: 'text-pink-400', shadow: 'shadow-pink-500/10 hover:shadow-pink-500/25' },
                                                { hex: '#06b6d4', ring: 'border-cyan-500/40 hover:border-cyan-400', glow: 'from-cyan-950/40 via-slate-900/90 to-slate-950', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', text: 'text-cyan-400', shadow: 'shadow-cyan-500/10 hover:shadow-cyan-500/25' },
                                                { hex: '#22c55e', ring: 'border-green-500/40 hover:border-green-400', glow: 'from-green-950/40 via-slate-900/90 to-slate-950', badge: 'bg-green-500/20 text-green-300 border-green-500/40', text: 'text-green-400', shadow: 'shadow-green-500/10 hover:shadow-green-500/25' },
                                                { hex: '#eab308', ring: 'border-yellow-500/40 hover:border-yellow-400', glow: 'from-yellow-950/40 via-slate-900/90 to-slate-950', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', text: 'text-yellow-400', shadow: 'shadow-yellow-500/10 hover:shadow-yellow-500/25' },
                                                { hex: '#a855f7', ring: 'border-purple-500/40 hover:border-purple-400', glow: 'from-purple-950/40 via-slate-900/90 to-slate-950', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40', text: 'text-purple-400', shadow: 'shadow-purple-500/10 hover:shadow-purple-500/25' },
                                            ];
                                            const theme = THEMES[objIdx % THEMES.length];

                                            return (
                                                <div
                                                    key={obj.id}
                                                    onClick={() => {
                                                        setSelectedObjId(obj.id);
                                                        setMobileView('content');
                                                    }}
                                                    className={`bg-gradient-to-br ${theme.glow} border ${theme.ring} rounded-2xl p-4 cursor-pointer transition-all duration-300 group shadow-lg hover:shadow-2xl ${theme.shadow} hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between backdrop-blur-md`}
                                                >
                                                    {/* Glow de fondo ambiental */}
                                                    <div 
                                                        className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-30 group-hover:opacity-60 transition-opacity"
                                                        style={{ background: theme.hex }}
                                                    />

                                                    <div className="relative z-10">
                                                        {/* ── Encabezado: Código, Nombre e Ícono ── */}
                                                        <div className="flex items-start justify-between gap-2.5 mb-3.5">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div 
                                                                    className="p-2 rounded-xl text-white shadow-md flex-shrink-0 transition-transform group-hover:scale-110"
                                                                    style={{ background: `${theme.hex}25`, border: `1px solid ${theme.hex}50` }}
                                                                >
                                                                    <ItemIcon size={18} style={{ color: theme.hex }} />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${theme.badge}`}>
                                                                            {obj.label.split(':')[0]}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                                            {objSummary.activities.length} act.
                                                                        </span>
                                                                    </div>
                                                                    <h4 className="text-xs font-bold text-white mt-1 group-hover:text-white transition-colors leading-snug line-clamp-1" title={titleText}>
                                                                        {titleText}
                                                                    </h4>
                                                                </div>
                                                            </div>
                                                            <div 
                                                                className="p-1.5 rounded-lg border transition-all text-slate-400 group-hover:text-white flex-shrink-0"
                                                                style={{ background: `${theme.hex}15`, borderColor: `${theme.hex}30` }}
                                                            >
                                                                <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                                            </div>
                                                        </div>

                                                        {/* ── CONTADORES COMPACTOS (LADO A LADO) ── */}
                                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                                            {/* 1. Avance Anual */}
                                                            <div 
                                                                className="rounded-xl p-2.5 border transition-all relative overflow-hidden flex flex-col justify-between"
                                                                style={{ background: 'rgba(2, 6, 23, 0.65)', borderColor: `${theme.hex}30` }}
                                                            >
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                                                                        <TrendingUp size={11} style={{ color: theme.hex }} /> Anual
                                                                    </span>
                                                                    <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-bold border ${
                                                                        objSummary.annualPercent >= 100 
                                                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                                                                            : objSummary.annualPercent > 0 
                                                                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' 
                                                                            : 'bg-slate-800 text-slate-400 border-slate-700'
                                                                    }`}>
                                                                        {objSummary.annualPercent >= 100 ? '✓' : objSummary.annualPercent > 0 ? 'En curso' : '0%'}
                                                                    </span>
                                                                </div>

                                                                {/* Número Grande pero Compacto */}
                                                                <div className="my-1">
                                                                    <span 
                                                                        className="text-3xl font-black font-mono tracking-tight block leading-none"
                                                                        style={{ color: theme.hex, textShadow: `0 0 18px ${theme.hex}35` }}
                                                                    >
                                                                        {objSummary.annualPercent}%
                                                                    </span>
                                                                </div>

                                                                {/* Subtexto P vs E */}
                                                                <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1.5 border-t border-slate-800/80">
                                                                    <span>Prog: <strong className="text-white">{objSummary.totalP}</strong></span>
                                                                    <span>Ejec: <strong style={{ color: theme.hex }}>{objSummary.totalE}</strong></span>
                                                                </div>
                                                            </div>

                                                            {/* 2. Avance Mensual / Periodo */}
                                                            <div 
                                                                className="rounded-xl p-2.5 border transition-all relative overflow-hidden flex flex-col justify-between"
                                                                style={{ background: 'rgba(2, 6, 23, 0.55)', borderColor: 'rgba(59, 130, 246, 0.25)' }}
                                                            >
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1 truncate max-w-[90px]" title={periodLabel}>
                                                                        <Calendar size={11} className="text-blue-400" /> {selectedMonitorMonths.length === 1 ? MONTHS[selectedMonitorMonths[0]] : periodLabel}
                                                                    </span>
                                                                    <span className="text-[8px] text-slate-400 font-mono">
                                                                        {selectedMonitorMonths.length === 1 ? `M${selectedMonitorMonths[0] + 1}` : `${selectedMonitorMonths.length}m`}
                                                                    </span>
                                                                </div>

                                                                {/* Número Grande pero Compacto */}
                                                                <div className="my-1">
                                                                    <span className="text-3xl font-black font-mono tracking-tight text-blue-400 block leading-none drop-shadow-[0_0_18px_rgba(59,130,246,0.3)]">
                                                                        {objSummary.monthPercent}%
                                                                    </span>
                                                                </div>

                                                                {/* Subtexto P vs E */}
                                                                <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-1.5 border-t border-slate-800/80">
                                                                    <span>Prog: <strong className="text-white">{objSummary.monthP}</strong></span>
                                                                    <span>Ejec: <strong className="text-blue-400 font-bold">{objSummary.monthE}</strong></span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* ── Pie de tarjeta interactivo ── */}
                                                    <div 
                                                        className="mt-3.5 pt-2 border-t flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-white transition-colors relative z-10"
                                                        style={{ borderColor: `${theme.hex}20` }}
                                                    >
                                                        <span className="text-[10px] text-slate-400 group-hover:text-slate-200">
                                                            Matriz Operativa
                                                        </span>
                                                        <div className="flex items-center gap-1 text-[11px] font-bold" style={{ color: theme.hex }}>
                                                            <span>Ver detalle</span>
                                                            <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* ── 4. MATRIZ CONSOLIDADA DE TODO EL PROGRAMA ANUAL ── */}
                                <div className="space-y-4 pt-4 border-t border-slate-800">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-sm">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                                                    <Layers size={20} className="text-emerald-400" />
                                                    Matriz Consolidada de Control Total • Programa 2026
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="file"
                                                        ref={masterFileInputRef}
                                                        onChange={handleMasterExcelUpload}
                                                        accept=".xlsx, .xls"
                                                        className="hidden"
                                                    />
                                                    <button
                                                        onClick={() => masterFileInputRef.current?.click()}
                                                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingMaster(true); }}
                                                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingMaster(false); }}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setIsDraggingMaster(false);
                                                            const f = e.dataTransfer.files?.[0];
                                                            if (f) processMasterExcelFile(f);
                                                        }}
                                                        disabled={isMasterUploading}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer disabled:opacity-50 border-2 ${
                                                            isDraggingMaster 
                                                                ? 'bg-emerald-500 border-white text-white scale-105 shadow-emerald-500/50 animate-pulse' 
                                                                : 'bg-emerald-600 hover:bg-emerald-500 border-transparent text-white shadow-emerald-900/30'
                                                        }`}
                                                        title="Haz clic para seleccionar o arrastra y suelta tu archivo Excel aquí directamente para cargarlo rápido"
                                                    >
                                                        {isMasterUploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                                                        <span>{isDraggingMaster ? '¡Suelta el Excel aquí!' : 'Cargar Excel'}</span>
                                                    </button>
                                                    <button
                                                        onClick={handleMasterExcelExport}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-900/30 cursor-pointer"
                                                        title="Descargar la matriz consolidada completa en formato Excel con valores Programados (P) y Ejecutados (E) en vivo"
                                                    >
                                                        <Download size={13} />
                                                        <span>Exportar F-SIG-023 (P y E)</span>
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Monitoreo unificado de todas las actividades: verifica en qué mes están marcadas/programadas (P) y si se están ejecutando (E).
                                            </p>
                                        </div>

                                        {/* Filtros de la Matriz */}
                                        <div className="flex flex-wrap items-center gap-2.5 text-xs">
                                            {/* Filtro por Objetivo */}
                                            <select
                                                value={masterFilterObj}
                                                onChange={e => setMasterFilterObj(e.target.value)}
                                                className="bg-slate-950 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                                            >
                                                <option value="all">Todos los Objetivos (9)</option>
                                                {OBJECTIVES.map(o => (
                                                    <option key={o.id} value={o.id}>{o.label.split(':')[0]}: {o.label.split(':')[1]?.trim()}</option>
                                                ))}
                                            </select>

                                            {/* Filtro por Área */}
                                            <select
                                                value={masterFilterArea}
                                                onChange={e => setMasterFilterArea(e.target.value)}
                                                className="bg-slate-950 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                                            >
                                                <option value="all">Todas las Áreas</option>
                                                <option value="SEGURIDAD">Seguridad</option>
                                                <option value="SALUD">Salud Ocupacional</option>
                                                <option value="MEDIO AMBIENTE">Medio Ambiente</option>
                                            </select>

                                            {/* Filtro por Mes */}
                                            <select
                                                value={masterFilterMonth}
                                                onChange={e => setMasterFilterMonth(e.target.value)}
                                                className="bg-slate-950 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                                            >
                                                <option value="all">Todo el Año (12 Meses)</option>
                                                {MONTHS.map((m, idx) => (
                                                    <option key={m} value={idx}>{m} (Mes {idx + 1})</option>
                                                ))}
                                            </select>

                                            {/* Filtro por Estado */}
                                            <select
                                                value={masterFilterStatus}
                                                onChange={e => setMasterFilterStatus(e.target.value)}
                                                className="bg-slate-950 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                                            >
                                                <option value="all">Todos los Estados</option>
                                                <option value="programmed">Con Programación (P &gt; 0)</option>
                                                <option value="executed">Con Ejecución (E &gt; 0)</option>
                                                <option value="completed">Cumplidas (E ≥ P)</option>
                                                <option value="pending">Pendientes / En Brecha</option>
                                            </select>

                                            {/* Buscador de texto */}
                                            <div className="relative">
                                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar actividad..."
                                                    value={masterSearchQuery}
                                                    onChange={e => setMasterSearchQuery(e.target.value)}
                                                    className="bg-slate-950 text-white placeholder-slate-500 pl-8 pr-3 py-2 rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-emerald-500 w-44"
                                                />
                                            </div>

                                            <span className="text-[11px] font-mono text-emerald-400 font-bold bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
                                                {filteredMasterActivities.length} act.
                                            </span>
                                        </div>
                                    </div>

                                    {/* TABLA MASTER CONSOLIDADA */}
                                    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden min-w-[1200px]">
                                        <div className="grid grid-cols-[80px_24%_4%_repeat(12,1fr)_65px_65px_70px_70px] bg-slate-900/50 text-xs min-w-[1200px]">
                                            {/* Encabezado Único */}
                                            <div className="col-span-[19] grid grid-cols-subgrid bg-slate-950 text-slate-400 font-bold uppercase tracking-wider sticky top-0 z-20 border-b border-slate-800">
                                                <div className="px-3 py-2 border-r border-slate-800 flex items-center justify-center text-[10px] bg-slate-950 sticky left-0 z-30">OBJ</div>
                                                <div className="px-4 py-2 border-r border-slate-800 flex items-center text-[10px]">ACTIVIDAD / ESTRATEGIA</div>
                                                <div className="px-1 py-1 text-center border-r border-slate-800 flex items-center justify-center text-[9px]">TIPO</div>
                                                {MONTHS.map(m => (
                                                    <div key={m} className={`px-1 py-1 text-center border-r border-slate-800 flex items-center justify-center text-[10px] ${m === MONTHS[activeMonitorMonth] ? 'text-emerald-400 font-black bg-emerald-950/30' : ''}`}>{m}</div>
                                                ))}
                                                <div className="px-1 py-1 text-center border-r border-slate-800 flex items-center justify-center text-[9px] text-emerald-400">P ANUAL</div>
                                                <div className="px-1 py-1 text-center border-r border-slate-800 flex items-center justify-center text-[9px] text-blue-400">E ANUAL</div>
                                                <div className="px-1 py-1 text-center border-r border-slate-800 flex items-center justify-center text-[9px] text-amber-400">% ANUAL</div>
                                                <div className="px-1 py-1 text-center border-r border-slate-800 flex items-center justify-center text-[9px] text-slate-300">ACCIONES</div>
                                            </div>

                                            {/* Filas de Actividades */}
                                            {filteredMasterActivities.map((act) => {
                                                return (
                                                    <Fragment key={act.id}>
                                                        {/* Columna OBJ (Span 2 filas) */}
                                                        <div className="row-span-2 px-2 py-2 border-r border-b border-slate-800 flex flex-col items-center justify-center bg-slate-950 sticky left-0 z-20">
                                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-center ${act.objBg} ${act.objColor} border border-current/20`}>
                                                                {act.objCode}
                                                            </span>
                                                            <span className="text-[8px] text-slate-500 font-mono mt-1 text-center leading-none">
                                                                {act.area.slice(0, 3)}
                                                            </span>
                                                        </div>

                                                        {/* Columna Descripción (Span 2 filas) */}
                                                        <div className="row-span-2 px-4 py-2 border-r border-b border-slate-800 font-bold text-slate-200 flex items-center bg-slate-900/90">
                                                            <div className="whitespace-normal leading-tight text-[11px] text-balance">
                                                                <span className="text-white block">{act.desc}</span>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[9px] text-slate-500 font-medium">{act.objName}</span>
                                                                    <span className="text-[8px] px-1 rounded bg-slate-800 text-slate-400 border border-slate-700">{act.area}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Fila P (Programado) */}
                                                        <div className="h-[32px] font-black text-center bg-slate-800/50 text-emerald-400 border-r border-b border-slate-800 flex items-center justify-center">
                                                            <span>P</span>
                                                        </div>
                                                        {act.programmed.map((pVal: number, mIdx: number) => {
                                                            const isHighlight = mIdx === activeMonitorMonth;
                                                            return (
                                                                <div
                                                                    key={`mp-${act.id}-${mIdx}`}
                                                                    className={`h-[32px] border-r border-b border-slate-800/60 flex items-center justify-center text-xs transition-colors ${
                                                                        pVal > 0
                                                                            ? 'text-emerald-400 font-black bg-emerald-950/20'
                                                                            : 'text-slate-800'
                                                                    } ${isHighlight ? 'border-emerald-500/30' : ''}`}
                                                                >
                                                                    {pVal > 0 ? pVal : '-'}
                                                                </div>
                                                            );
                                                        })}

                                                        {/* Totales Anuales (Span 2 filas) */}
                                                        <div className="row-span-2 font-black text-center border-r border-b border-slate-800 flex items-center justify-center text-emerald-400 bg-emerald-950/20 text-xs">
                                                            {act.totalP}
                                                        </div>
                                                        <div className="row-span-2 font-black text-center border-r border-b border-slate-800 flex items-center justify-center text-blue-400 bg-blue-950/20 text-xs">
                                                            {act.totalE}
                                                        </div>
                                                        <div className={`row-span-2 font-black text-center border-r border-b border-slate-800 flex items-center justify-center text-xs ${
                                                            act.percent >= 90 ? 'text-emerald-400 bg-emerald-950/30' : act.percent >= 50 ? 'text-amber-400 bg-amber-950/30' : 'text-red-400 bg-red-950/20'
                                                        }`}>
                                                            {act.percent}%
                                                        </div>
                                                        <div className="row-span-2 border-r border-b border-slate-800 flex items-center justify-center p-1 bg-slate-900/60">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedObjId(act.objId);
                                                                    setMobileView('content');
                                                                }}
                                                                className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white text-[10px] font-bold transition-all border border-slate-700 hover:border-emerald-500"
                                                                title="Abrir este objetivo con todo su detalle"
                                                            >
                                                                Ver Obj
                                                            </button>
                                                        </div>

                                                        {/* Fila E (Ejecutado) */}
                                                        <div className="h-[32px] font-black text-center bg-slate-800/50 text-blue-400 border-r border-b border-slate-950 flex items-center justify-center">
                                                            <span>E</span>
                                                        </div>
                                                        {act.executed.map((eVal: number, mIdx: number) => {
                                                            const pVal = act.programmed[mIdx] || 0;
                                                            const isPending = pVal > 0 && eVal === 0;
                                                            return (
                                                                <div
                                                                    key={`me-${act.id}-${mIdx}`}
                                                                    onClick={() => {
                                                                        if (eVal > 0 && act.executionRecords && act.executionRecords[mIdx]) {
                                                                            setSelectedRecords({
                                                                                activity: act.desc,
                                                                                month: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][mIdx],
                                                                                records: act.executionRecords[mIdx]
                                                                            });
                                                                        }
                                                                    }}
                                                                    className={`h-[32px] border-r border-b border-slate-950 flex items-center justify-center font-bold text-xs transition-all ${
                                                                        eVal > 0
                                                                            ? 'text-white bg-blue-500/20 hover:bg-blue-500/40 cursor-pointer shadow-sm'
                                                                            : isPending
                                                                            ? 'text-slate-800 bg-red-950/5'
                                                                            : 'text-slate-800'
                                                                    }`}
                                                                    title={eVal > 0 ? `Ver evidencias registradas (${eVal})` : isPending ? 'Programado pero sin ejecución aún' : 'Sin actividad'}
                                                                >
                                                                    {eVal > 0 ? eVal : '-'}
                                                                </div>
                                                            );
                                                        })}
                                                    </Fragment>
                                                );
                                            })}

                                            {/* FILA DE TOTALES CONSOLIDADOS (F-SIG-023 OFICIAL) */}
                                            {(() => {
                                                const totalsP = new Array(12).fill(0);
                                                const totalsE = new Array(12).fill(0);
                                                const totalsA = new Array(12).fill(0);
                                                const totalsFulfilled = new Array(12).fill(0);
                                                let grandP = 0;
                                                let grandE = 0;
                                                let grandA = 0;
                                                let grandFulfilled = 0;

                                                filteredMasterActivities.forEach(act => {
                                                    for (let i = 0; i < 12; i++) {
                                                        const p = act.programmed[i] || 0;
                                                        const e = act.executed[i] || 0;
                                                        const f = Math.min(p, e);
                                                        const a = Math.max(0, e - p);
                                                        totalsP[i] += p;
                                                        totalsE[i] += e;
                                                        totalsA[i] += a;
                                                        totalsFulfilled[i] += f;

                                                        grandP += p;
                                                        grandE += e;
                                                        grandA += a;
                                                        grandFulfilled += f;
                                                    }
                                                });

                                                const grandPct = grandP > 0 ? Math.round((grandFulfilled / grandP) * 100) : 0;

                                                return (
                                                    <div className="col-span-[19] grid grid-cols-[80px_24%_4%_repeat(12,1fr)_65px_65px_70px_70px] bg-slate-950 border-t-2 border-emerald-500/60 shadow-[0_-10px_20px_rgba(0,0,0,0.4)] text-xs z-30 sticky bottom-0">
                                                        <div className="row-span-4 col-span-2 px-4 py-2 border-r border-slate-800 font-black text-emerald-400 flex items-center justify-between bg-slate-950 sticky left-0 z-30">
                                                            <div className="uppercase tracking-widest text-xs flex items-center gap-2">
                                                                <BarChart2 size={16} className="text-emerald-400" />
                                                                <span>TOTAL CONSOLIDADO DEL PROGRAMA</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-500 font-mono">F-SIG-023</span>
                                                        </div>

                                                        {/* Total P Row */}
                                                        <div className="h-[36px] font-black text-center bg-emerald-950/40 text-emerald-500 border-r border-b border-emerald-900/50 flex items-center justify-center">
                                                            P
                                                        </div>
                                                        {totalsP.map((c, i) => (
                                                            <div key={`gtp-${i}`} className="h-[36px] font-black border-r border-b border-emerald-900/50 flex items-center justify-center bg-emerald-950/20 text-emerald-400 text-xs">
                                                                {c}
                                                            </div>
                                                        ))}
                                                        <div className="row-span-4 font-black text-center border-r border-slate-800 flex items-center justify-center text-emerald-400 bg-emerald-950/30 text-sm">{grandP}</div>
                                                        <div className="row-span-4 font-black text-center border-r border-slate-800 flex items-center justify-center text-blue-400 bg-blue-950/30 text-sm">{grandE}</div>
                                                        <div className="row-span-4 font-black text-center border-r border-slate-800 flex items-center justify-center text-amber-400 bg-amber-950/30 text-sm">{grandPct}%</div>
                                                        <div className="row-span-4 border-r border-slate-800 flex items-center justify-center p-1 bg-slate-950 text-[9px] text-slate-500 font-bold text-center">
                                                            GENERAL
                                                        </div>

                                                        {/* Total E Row */}
                                                        <div className="h-[36px] font-black text-center bg-blue-950/40 text-blue-500 border-r border-b border-blue-900/50 flex items-center justify-center">
                                                            E
                                                        </div>
                                                        {totalsE.map((c, i) => (
                                                            <div key={`gte-${i}`} className="h-[36px] font-black border-r border-b border-blue-900/50 flex items-center justify-center bg-blue-950/20 text-blue-400 text-xs">
                                                                {c}
                                                            </div>
                                                        ))}

                                                        {/* Total A Row */}
                                                        <div className="h-[36px] font-black text-center bg-purple-950/40 text-purple-500 border-r border-b border-purple-900/50 flex items-center justify-center">
                                                            A
                                                        </div>
                                                        {totalsA.map((c, i) => (
                                                            <div key={`gta-${i}`} className="h-[36px] font-black border-r border-b border-purple-900/50 flex items-center justify-center bg-purple-950/20 text-purple-400 text-xs">
                                                                {c > 0 ? c : '-'}
                                                            </div>
                                                        ))}

                                                        {/* Total % Row */}
                                                        <div className="h-[36px] font-black text-center bg-amber-950/40 text-amber-500 border-r border-amber-900/50 flex items-center justify-center">
                                                            %
                                                        </div>
                                                        {totalsP.map((p, i) => {
                                                            const pct = p > 0 ? Math.round((totalsFulfilled[i] / p) * 100) : 0;
                                                            return (
                                                                <div key={`gtpct-${i}`} className="h-[36px] font-black border-r border-amber-900/50 flex items-center justify-center bg-amber-950/20 text-amber-400 text-xs">
                                                                    {p > 0 ? `${pct}%` : '-'}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {filteredMasterActivities.length === 0 && (
                                            <div className="p-12 text-center text-slate-500">
                                                <FileSpreadsheet size={48} className="mx-auto mb-4 opacity-50" />
                                                <p className="text-sm font-bold text-slate-400">No se encontraron actividades con los filtros seleccionados.</p>
                                                <p className="text-xs mt-1">Prueba cambiando el objetivo, área o quitando los términos de búsqueda.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Barra Superior de Retorno al Control Total y Navegación */}
                                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-md">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setSelectedObjId('all')}
                                            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                                        >
                                            <LayoutDashboard size={15} />
                                            <span>← Volver al Control Total Anual</span>
                                        </button>
                                        <span className="text-slate-600">|</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400 font-medium">Objetivo actual:</span>
                                            <span className="text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                                                {currentObj?.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Selector Rápido de Objetivos */}
                                    <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">Ir a:</span>
                                        {OBJECTIVES.map(o => (
                                            <button
                                                key={o.id}
                                                onClick={() => setSelectedObjId(o.id)}
                                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all ${
                                                    selectedObjId === o.id
                                                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                                                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800/80'
                                                }`}
                                            >
                                                {o.id.replace('obj', 'OBJ ')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden min-w-[1200px]">
                            {/* Grid Container ÚNICO */}
                            <div className="grid grid-cols-[25%_4%_repeat(12,1fr)_70px_70px_70px] bg-slate-900/50 text-xs min-w-[1200px]">

                                {/* Header Row ÚNICO */}
                                <div className="col-span-[17] grid grid-cols-subgrid bg-slate-950 text-slate-400 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
                                    <div className="px-4 py-2 border-r border-slate-800 flex items-center text-[10px] sticky left-0 z-20 bg-slate-950">ACTIVIDAD</div>
                                    <div className="px-1 py-1 text-center border-r border-slate-800 flex items-center justify-center text-[9px]">TIPO</div>
                                    {MONTHS.map(m => (
                                        <div key={m} className="px-1 py-1 text-center border-r border-slate-800 flex items-center justify-center text-[10px]">{m}</div>
                                    ))}
                                    <div className="px-1 py-1 text-center border-r border-slate-800 flex items-center justify-center text-[9px] text-emerald-400">P ANUAL</div>
                                    <div className="px-1 py-1 text-center border-r border-slate-800 flex items-center justify-center text-[9px] text-blue-400">E ANUAL</div>
                                    <div className="px-1 py-1 text-center border-r border-slate-800 flex items-center justify-center text-[9px] text-amber-400">% ANUAL</div>
                                </div>

                                {/* Body Rows */}
                                {matrixData && Object.keys(matrixData).map((area) => {
                                    const areaItems = matrixData[area];
                                    if (Object.keys(areaItems).length === 0) return null;

                                    return Object.entries(areaItems).map(([desc, data], idx) => {
                                        const totalP = data.programmed.reduce((sum: number, val: number) => sum + val, 0);
                                        const totalE = data.executed.reduce((sum: number, val: number) => sum + val, 0);
                                        let fulfilled = 0;
                                        for (let i = 0; i < 12; i++) fulfilled += Math.min(data.programmed[i], data.executed[i]);
                                        const percent = totalP > 0 ? Math.round((fulfilled / totalP) * 100) : 0;

                                        return (
                                        <Fragment key={`${area}-${idx}`}>
                                            {/* Row Group: Programmed & Executed */}
                                            {/* Description Cell: Spans 2 Rows vertically */}
                                            <div className="row-span-2 px-4 py-2 border-r border-b border-slate-800 font-bold text-slate-200 flex items-center bg-slate-900 sticky left-0 z-10">
                                                <div className="whitespace-normal leading-tight text-[11px] text-balance" title={desc}>{desc}</div>
                                            </div>

                                            {/* Programmed Row */}
                                            <div className="h-[32px] font-black text-center bg-slate-800/50 text-emerald-400 border-r border-b border-slate-800 flex items-center justify-center relative">
                                                <span>P</span>
                                                {selectedObjId === 'obj1' && (
                                                    <button 
                                                        onClick={() => {
                                                            const currentTipo = data.tipo || 'otro';
                                                            const newVal = currentTipo === 'otro' ? 'capacitacion' : currentTipo === 'capacitacion' ? 'inspeccion' : 'otro';
                                                            const currentList = programData[selectedObjId] || [];
                                                            const updatedList = currentList.map((item: any) => {
                                                                if (item.description === desc && (item.area || 'SEGURIDAD').toUpperCase().includes(area)) {
                                                                    return { ...item, tipo: newVal };
                                                                }
                                                                return item;
                                                            });
                                                            const updatedProgram = { ...programData, [selectedObjId]: updatedList };
                                                            setProgramData(updatedProgram);
                                                            syncToCloud(updatedProgram, selectedObjId, updatedList);
                                                        }}
                                                        title={data.tipo === 'capacitacion' ? 'Clasificado como Capacitación' : data.tipo === 'inspeccion' ? 'Clasificado como Inspección' : 'Clasificado como Otro (Gestión)'}
                                                        className={`w-4 h-4 rounded text-[9px] flex items-center justify-center transition-colors absolute right-1 cursor-pointer z-20 shadow-sm ${
                                                            data.tipo === 'capacitacion' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30' :
                                                            data.tipo === 'inspeccion' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50 hover:bg-purple-500/30' :
                                                            'bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-slate-600/50'
                                                        }`}
                                                    >
                                                        {data.tipo === 'capacitacion' ? 'C' : data.tipo === 'inspeccion' ? 'I' : 'O'}
                                                    </button>
                                                )}
                                            </div>
                                            {data.programmed.map((c, i) => {
                                                const isEditing = editingCell?.key === desc + area && editingCell?.month === i && editingCell?.type === 'P';
                                                return (
                                                    <div
                                                        key={`p-${i}`}
                                                        className={`h-[32px] border-r border-b border-slate-800/50 flex items-center justify-center cursor-pointer transition-colors ${c > 0 ? 'text-white font-bold bg-slate-800/50' : 'text-slate-700 hover:bg-slate-800/50'}`}
                                                        onClick={() => !isEditing && handleCellEdit(desc, i, c, area)}
                                                    >
                                                        {isEditing ? (
                                                            <input name="editValue"
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

                                            {/* Annual Totals (Span 2 Rows) */}
                                            <div className="row-span-2 font-black text-center border-r border-b border-slate-800 flex items-center justify-center text-emerald-400 bg-emerald-950/20">{totalP}</div>
                                            <div className="row-span-2 font-black text-center border-r border-b border-slate-800 flex items-center justify-center text-blue-400 bg-blue-950/20">{totalE}</div>
                                            <div className="row-span-2 font-black text-center border-r border-b border-slate-800 flex items-center justify-center text-amber-400 bg-amber-950/20">{percent}%</div>

                                            {/* Executed Row */}
                                            <div className="h-[32px] font-black text-center bg-slate-800/50 text-blue-400 border-r border-b border-slate-950 flex items-center justify-center">E</div>
                                            {data.executed.map((c, i) => (
                                                <div 
                                                    key={`e-${i}`} 
                                                    className={`h-[32px] border-r border-b border-slate-950 flex items-center justify-center font-bold transition-all ${c > 0 ? 'text-white bg-blue-500/20 hover:bg-blue-500/40 cursor-pointer' : 'text-slate-800'}`}
                                                    onClick={() => {
                                                        if (c > 0 && data.executionRecords && data.executionRecords[i]) {
                                                            setSelectedRecords({
                                                                activity: desc,
                                                                month: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][i],
                                                                records: data.executionRecords[i]
                                                            });
                                                        }
                                                    }}
                                                >
                                                    {c > 0 ? c : '-'}
                                                </div>
                                            ))}
                                        </Fragment>
                                        );
                                    });
                                })}
                            </div>

                            {/* Fila de Totales por Objetivo */}
                            {matrixData && Object.values(matrixData).some(g => Object.keys(g).length > 0) && (() => {
                                const totalsP = new Array(12).fill(0);
                                const totalsE = new Array(12).fill(0);
                                const totalsA = new Array(12).fill(0);
                                const totalsFulfilled = new Array(12).fill(0);
                                let grandTotalP = 0;
                                let grandTotalE = 0;
                                let grandTotalA = 0;
                                let grandTotalFulfilled = 0;

                                Object.values(matrixData).forEach(area => {
                                    Object.values(area).forEach(data => {
                                        let actFulfilled = 0;
                                        data.programmed.forEach((p, i) => {
                                            const e = data.executed[i];
                                            totalsP[i] += p;
                                            totalsE[i] += e;
                                            totalsA[i] += Math.max(0, e - p);
                                            const f = Math.min(p, e);
                                            totalsFulfilled[i] += f;
                                            actFulfilled += f;
                                            
                                            grandTotalP += p;
                                            grandTotalE += e;
                                            grandTotalA += Math.max(0, e - p);
                                            grandTotalFulfilled += f;
                                        });
                                    });
                                });

                                return (
                                    <div className="col-span-[17] grid grid-cols-[25%_4%_repeat(12,1fr)_70px_70px_70px] bg-slate-950 border-t-2 border-emerald-500/50 shadow-[0_-10px_20px_rgba(0,0,0,0.3)] text-xs z-20 relative transition-all duration-300">
                                        <div className="row-span-4 px-4 py-2 border-r border-slate-800 font-black text-emerald-400 flex items-center justify-end bg-slate-950 sticky left-0 z-20">
                                            <div className="uppercase tracking-widest text-[12px] flex items-center gap-2">
                                                <BarChart2 size={16} /> TOTAL {currentObj?.label?.split(':')[0]}
                                            </div>
                                        </div>

                                        {/* Total Programmed Row */}
                                        <div className="h-[40px] font-black text-center bg-emerald-950/40 text-emerald-500 border-r border-b border-emerald-900/50 flex items-center justify-center">
                                            P
                                        </div>
                                        {totalsP.map((c, i) => (
                                            <div key={`tp-${i}`} className="h-[40px] font-black border-r border-b border-emerald-900/50 flex items-center justify-center bg-emerald-950/20 text-emerald-400 text-sm">
                                                {c}
                                            </div>
                                        ))}
                                        <div className="row-span-4 font-black text-center border-r border-slate-800 flex items-center justify-center text-emerald-400 bg-emerald-950/20 text-sm">{grandTotalP}</div>
                                        <div className="row-span-4 font-black text-center border-r border-slate-800 flex items-center justify-center text-blue-400 bg-blue-950/20 text-sm">{grandTotalE}</div>
                                        <div className="row-span-4 font-black text-center border-r border-slate-800 flex items-center justify-center text-amber-400 bg-amber-950/20 text-sm">{grandTotalP > 0 ? Math.round((grandTotalFulfilled / grandTotalP) * 100) : 0}%</div>

                                        {/* Total Executed Row */}
                                        <div className="h-[40px] font-black text-center bg-blue-950/40 text-blue-500 border-r border-b border-blue-900/50 flex items-center justify-center">
                                            E
                                        </div>
                                        {totalsE.map((c, i) => (
                                            <div key={`te-${i}`} className="h-[40px] font-black border-r border-b border-blue-900/50 flex items-center justify-center bg-blue-950/20 text-blue-400 text-sm">
                                                {c}
                                            </div>
                                        ))}

                                        {/* Total Adicionales Row */}
                                        <div className="h-[40px] font-black text-center bg-purple-950/40 text-purple-500 border-r border-b border-purple-900/50 flex items-center justify-center">
                                            A
                                        </div>
                                        {totalsA.map((c, i) => (
                                            <div key={`ta-${i}`} className="h-[40px] font-black border-r border-b border-purple-900/50 flex items-center justify-center bg-purple-950/20 text-purple-400 text-sm">
                                                {c > 0 ? c : '-'}
                                            </div>
                                        ))}

                                        {/* Total Percentage Row */}
                                        <div className="h-[40px] font-black text-center bg-amber-950/40 text-amber-500 border-r border-amber-900/50 flex items-center justify-center">
                                            %
                                        </div>
                                        {totalsP.map((p, i) => {
                                            const pct = p > 0 ? Math.round((totalsFulfilled[i] / p) * 100) : 0;
                                            return (
                                                <div key={`tpct-${i}`} className="h-[40px] font-black border-r border-amber-900/50 flex items-center justify-center bg-amber-950/20 text-amber-400 text-sm">
                                                    {p > 0 ? `${pct}%` : '-'}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}

                            {/* Empty State */}
                            {Object.values(matrixData || {}).every(g => Object.keys(g).length === 0) && (
                                <div className="p-12 text-center text-slate-500">
                                    <FileSpreadsheet size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No hay datos cargados para {currentObj?.label ? currentObj.label.split(':')[1] : 'este objetivo'}.</p>
                                    <p className="text-xs mt-2">Carga un Excel con fechas y descripciones para visualizar el programa.</p>
                                </div>
                            )}
                        </div>

                    {/* Subprogramas Oficiales de Capacitación y Entrenamiento (F-SIG-066) para Objetivo 2 */}
                    {selectedObjId === 'obj2' && (
                        <div className="mt-8">
                            <TrainingSubprogramsSection
                                subprograms={trainingSubprograms}
                                hhcRecords={hhcRecords}
                                evidenceRecords={evidenceRecords}
                                onUpdateSubprograms={(updated) => setTrainingSubprograms(updated)}
                                onSaveToCloud={handleSaveSubprograms}
                                isSaving={isSavingSubprograms}
                                onSelectRecords={(activity, month, records) => {
                                    setSelectedRecords({ activity, month, records });
                                }}
                            />
                        </div>
                    )}

                    {/* Subprogramas Oficiales de Inspecciones Operacionales (F-SIG-067) para Objetivo 3 */}
                    {selectedObjId === 'obj3' && (
                        <div className="mt-8">
                            <InspectionsSubprogramsSection
                                subprograms={inspectionsSubprograms}
                                inspectionRecords={executedInspections}
                                evidenceRecords={evidenceRecords}
                                onUpdateSubprograms={(updated) => setInspectionsSubprograms(updated)}
                                onSaveToCloud={handleSaveInspectionsSubprograms}
                                isSaving={isSavingInspectionsSubprograms}
                                onSelectRecords={(activity, month, records) => {
                                    setSelectedRecords({ activity, month, records });
                                }}
                            />
                        </div>
                    )}
                    </div>
                )}
            </div>
                </div>
            </div>
            {/* Traceability Modal */}
            {selectedRecords && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => { setSelectedRecords(null); setReconfigRecord(null); }} />
                    <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <div className="flex items-center gap-4">
                                {selectedRecords.records.length > 0 && (
                                    <button 
                                        onClick={() => {
                                            if (selectedIds.size === selectedRecords.records.length) {
                                                setSelectedIds(new Set());
                                            } else {
                                                setSelectedIds(new Set(selectedRecords.records.map(r => r.id)));
                                            }
                                        }}
                                        className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors"
                                        title="Seleccionar todo"
                                    >
                                        {selectedIds.size === selectedRecords.records.length ? <CheckSquare size={20} className="text-emerald-400" /> : <Square size={20} />}
                                    </button>
                                )}
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">Evidencias de Ejecución</h3>
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{selectedRecords.activity} • {selectedRecords.month}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {selectedIds.size > 0 && (
                                    <button 
                                        onClick={async () => {
                                            const confirm = window.confirm(`⚠️ ADVERTENCIA\n¿Eliminar los ${selectedIds.size} registros seleccionados permanentemente?`);
                                            if (!confirm) return;
                                            
                                            try {
                                                for (const id of Array.from(selectedIds)) {
                                                    const rec = selectedRecords.records.find(r => r.id === id);
                                                    if (!rec) continue;
                                                    await fetch('/api/reconfigure', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ record: rec, action: 'delete' })
                                                    });
                                                }
                                                
                                                // Update local states
                                                const idsToRemove = Array.from(selectedIds);
                                                setHhcRecords(prev => prev.filter(r => !idsToRemove.includes(r.id)));
                                                setExecutedInspections(prev => prev.filter(r => !idsToRemove.includes(r.id)));
                                                setEvidenceRecords(prev => prev.filter(r => !idsToRemove.includes(r.id)));
                                                setPmaRecords(prev => prev.filter(r => !idsToRemove.includes(r.id)));
                                                setAtsRecords(prev => prev.filter(r => !idsToRemove.includes(r.id)));
                                                setPetarRecords(prev => prev.filter(r => !idsToRemove.includes(r.id)));
                                                setDetourRecords(prev => prev.filter(r => !idsToRemove.includes(r.id)));
                                                setSimulacroRecords(prev => prev.filter(r => !idsToRemove.includes(r.id)));
                                                setBrigadistaRecords(prev => prev.filter(r => !idsToRemove.includes(r.id)));
                                                
                                                setSelectedRecords(prev => prev ? { ...prev, records: prev.records.filter(r => !idsToRemove.includes(r.id)) } : null);
                                                setSelectedIds(new Set());
                                                alert(`✅ ${idsToRemove.length} registros eliminados.`);
                                            } catch (e) {
                                                alert('❌ Error al eliminar algunos registros.');
                                            }
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/20 transition-all"
                                    >
                                        <Trash2 size={16} />
                                        ELIMINAR SELECCIONADOS ({selectedIds.size})
                                    </button>
                                )}
                                <button onClick={() => { setSelectedRecords(null); setReconfigRecord(null); setSelectedIds(new Set()); }} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
                            {selectedRecords.records.map((rec, ri) => (
                                <div key={ri} className="space-y-3">
                                    <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 flex items-center justify-between group hover:border-blue-500/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => {
                                                const newSelected = new Set(selectedIds);
                                                if (newSelected.has(rec.id)) newSelected.delete(rec.id);
                                                else newSelected.add(rec.id);
                                                setSelectedIds(newSelected);
                                            }}
                                            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                                                selectedIds.has(rec.id)
                                                ? 'bg-blue-500 border-blue-400 text-white'
                                                : 'bg-slate-900 border-slate-800 text-transparent hover:border-slate-700'
                                            }`}
                                        >
                                            <Check size={14} />
                                        </button>
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <ClipboardCheck size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white capitalize">{rec.responsible || rec.responsable || 'Sin responsable'}</p>
                                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{rec.date}</p>
                                            {rec._type === 'REPORTE_AC' && (
                                                <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                                                    {rec.acto && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">A: {rec.acto}</span>}
                                                    {rec.condicion && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">C: {rec.condicion}</span>}
                                                    {rec.location && <span className="text-[9px] text-slate-400 font-medium">📍 {rec.location}</span>}
                                                    <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Tarjeta TOP</span>
                                                </div>
                                            )}
                                            {((rec.acuerdos_total !== null && rec.acuerdos_total !== undefined && Number(rec.acuerdos_total) > 0) || (rec.description && rec.description.includes('[Acuerdos:'))) && (
                                                <div className="mt-1">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                        🎯 {rec.acuerdos_total ? `Acuerdos: ${rec.acuerdos_cerrados || 0}/${rec.acuerdos_total} (${Math.round(((rec.acuerdos_cerrados || 0) / rec.acuerdos_total) * 100)}% cerrados)` : (rec.description.match(/\[Acuerdos:[^\]]+\]/)?.[0] || '🎯 Acuerdos')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        {/* BOTÓN PDF */}
                                        {(() => {
                                            const pdfUrl = rec.evidencePdf || rec.evidence_pdf || rec.pdfUrl || rec.evidenceUrl || rec.evidence_url ||
                                                         (rec.fileUrl && String(rec.fileUrl).toLowerCase().includes('.pdf') ? rec.fileUrl : '') || 
                                                         (rec.file_url && String(rec.file_url).toLowerCase().includes('.pdf') ? rec.file_url : '') ||
                                                         (rec.file_type && String(rec.file_type).toLowerCase().includes('pdf') ? (rec.fileUrl || rec.file_url) : '');
                                            
                                            if (pdfUrl) {
                                                return (
                                                    <a 
                                                        href={pdfUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-500/20 transition-all"
                                                    >
                                                        <ExternalLink size={12} />
                                                        VER PDF
                                                    </a>
                                                );
                                            }
                                            return null;
                                        })()}

                                        {/* BOTÓN IMÁGENES / EVIDENCIA GENERAL */}
                                        {(() => {
                                            const hasImgs = (rec.evidenceImgs && Array.isArray(rec.evidenceImgs) && rec.evidenceImgs.length > 0) || 
                                                          (rec.evidence_imgs && typeof rec.evidence_imgs === 'string' && rec.evidence_imgs.length > 5) ||
                                                          (rec.images && Array.isArray(rec.images) && rec.images.length > 0) || 
                                                          (rec.imageUrl) || (rec.files && Array.isArray(rec.files) && rec.files.length > 0) ||
                                                          (rec.fileUrl && !String(rec.fileUrl).toLowerCase().includes('.pdf')) ||
                                                          (rec.file_url && !String(rec.file_url).toLowerCase().includes('.pdf'));

                                            if (hasImgs) {
                                                const imgUrl = (rec.evidenceImgs && Array.isArray(rec.evidenceImgs) && rec.evidenceImgs.length > 0) ? rec.evidenceImgs[0] : 
                                                              (rec.images && Array.isArray(rec.images) && rec.images.length > 0) ? rec.images[0] : 
                                                              (rec.imageUrl || rec.fileUrl || rec.file_url || rec.evidence_imgs);
                                                
                                                let finalUrl = imgUrl;
                                                if (typeof imgUrl === 'string' && imgUrl.startsWith('[') && imgUrl.endsWith(']')) {
                                                    try { const arr = JSON.parse(imgUrl); if(arr.length > 0) finalUrl = arr[0]; } catch(e){}
                                                }

                                                const count = (Array.isArray(rec.evidenceImgs) ? rec.evidenceImgs.length : 0) || (Array.isArray(rec.images) ? rec.images.length : 0) || 0;

                                                return (
                                                    <button 
                                                        onClick={() => window.open(finalUrl, '_blank')}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-blue-400 rounded-lg text-[10px] font-bold border border-blue-500/20 transition-all"
                                                    >
                                                        <ImageIcon size={12} />
                                                        {(rec.evidencePdf || rec.evidence_pdf || rec.pdfUrl || (rec.fileUrl && String(rec.fileUrl).toLowerCase().includes('.pdf')) || (rec.file_url && String(rec.file_url).toLowerCase().includes('.pdf'))) ? 'FOTOS' : 'VER EVIDENCIA'}
                                                        {count > 0 ? ` (${count})` : ''}
                                                    </button>
                                                );
                                            }
                                            
                                            const hasPdf = !!(rec.evidencePdf || rec.evidence_pdf || rec.pdfUrl || rec.evidenceUrl || rec.evidence_url ||
                                                          (rec.fileUrl && String(rec.fileUrl).toLowerCase().includes('.pdf')) || 
                                                          (rec.file_url && String(rec.file_url).toLowerCase().includes('.pdf')));
                                            
                                            if (!hasPdf) {
                                                return (
                                                    <div className="text-[9px] font-black text-red-500/70 bg-red-500/5 px-2 py-1 rounded border border-red-500/10 uppercase italic">
                                                        Sin archivo adjunto
                                                    </div>
                                                );
                                            }

                                            return null;
                                        })()}
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

                                        {/* BOTÓN ELIMINAR RÁPIDO */}
                                        <button 
                                            onClick={async () => {
                                                const confirm = window.confirm(`⚠️ ADVERTENCIA\n¿Eliminar permanentemente este registro defectuoso? Esta acción no se puede deshacer.`);
                                                if (!confirm) return;
                                                try {
                                                    const res = await fetch('/api/reconfigure', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ record: rec, action: 'delete' })
                                                    });
                                                    const data = await res.json();
                                                    if (data.success) { 
                                                        // Update local states instead of reload
                                                        setHhcRecords(prev => prev.filter(r => r.id !== rec.id));
                                                        setExecutedInspections(prev => prev.filter(r => r.id !== rec.id));
                                                        setEvidenceRecords(prev => prev.filter(r => r.id !== rec.id));
                                                        setPmaRecords(prev => prev.filter(r => r.id !== rec.id));
                                                        setAtsRecords(prev => prev.filter(r => r.id !== rec.id));
                                                        setPetarRecords(prev => prev.filter(r => r.id !== rec.id));
                                                        setDetourRecords(prev => prev.filter(r => r.id !== rec.id));
                                                        setSimulacroRecords(prev => prev.filter(r => r.id !== rec.id));
                                                        setBrigadistaRecords(prev => prev.filter(r => r.id !== rec.id));
                                                        
                                                        setSelectedRecords(prev => prev ? { ...prev, records: prev.records.filter(r => r.id !== rec.id) } : null);
                                                        alert('🗑️ Registro eliminado.'); 
                                                    }
                                                    else alert(`❌ Error: ${data.error}`);
                                                } catch { alert('❌ Error de conexión'); }
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all bg-red-900/20 hover:bg-red-600 hover:text-white text-red-400 border-red-500/20"
                                        >
                                            <Trash2 size={12} />
                                            ELIMINAR
                                        </button>

                                        {/* BOTÓN RECONFIGURAR (NUEVO) */}
                                        <button 
                                            onClick={() => setReconfigRecord(reconfigRecord?.index === ri ? null : { index: ri, category: '', subtype: '', date: rec.date || '', area: 'Seguridad', tema: '' })}
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
                                        <div className="flex flex-col md:flex-row gap-4 items-start">
                                            <div className="flex-1 space-y-4">
                                                <div className="flex gap-4">
                                                    <div className="flex-1 space-y-2">
                                                        <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-1">Nueva Categoría</label>
                                                        <select name="reconfigRecord_category" 
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 transition-colors"
                                                            value={reconfigRecord.category}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                let updates: any = { category: val, subtype: '' };
                                                                
                                                                if (val === 'Control de HHC' && programData['obj2']) {
                                                                    const dateStr = reconfigRecord.date;
                                                                    
                                                                    const getMonthVal = (dStr: string) => {
                                                                        if (!dStr || typeof dStr !== 'string') return -1;
                                                                        if (dStr.includes('-')) {
                                                                            const p = dStr.split('-');
                                                                            if (p[0].length === 4) return parseInt(p[1], 10) - 1; // YYYY-MM-DD
                                                                            return parseInt(p[1], 10) - 1; // DD-MM-YYYY
                                                                        }
                                                                        if (dStr.includes('/')) {
                                                                            const p = dStr.split('/');
                                                                            if (p[0].length === 4) return parseInt(p[1], 10) - 1; // YYYY/MM/DD
                                                                            return parseInt(p[1], 10) - 1; // DD/MM/YYYY
                                                                        }
                                                                        const up = dStr.toUpperCase();
                                                                        const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SET", "OCT", "NOV", "DIC"];
                                                                        const idx = months.findIndex(m => up.startsWith(m));
                                                                        if (idx !== -1) return idx;
                                                                        const d = new Date(dStr);
                                                                        return isNaN(d.getTime()) ? -1 : d.getMonth();
                                                                    };

                                                                    const targetMonth = getMonthVal(dateStr || '');
                                                                    
                                                                    // Primero buscar coincidencia exacta de fecha
                                                                    let match = programData['obj2'].find((p: any) => p.date === dateStr);
                                                                    
                                                                    // Si no, coincidencia por mes
                                                                    if (!match && targetMonth !== -1) {
                                                                        match = programData['obj2'].find((p: any) => getMonthVal(p.date) === targetMonth);
                                                                    }

                                                                    if (match) {
                                                                        updates.tema = match.description;
                                                                        updates.area = match.area || 'Seguridad';
                                                                        const dLow = match.description.toLowerCase();
                                                                        if (dLow.includes('induc')) updates.subtype = 'INDUCCIÓN (4H)';
                                                                        else if (dLow.includes('charla')) updates.subtype = 'CHARLA (15 MIN)';
                                                                        else if (dLow.includes('difusi')) updates.subtype = 'DIFUSIÓN (30 MIN)';
                                                                        else if (dLow.includes('entren')) updates.subtype = 'ENTRENAMIENTO (30 MIN)';
                                                                        else updates.subtype = 'CAPACITACIÓN (1H)';
                                                                    }
                                                                }
                                                                setReconfigRecord({ ...reconfigRecord, ...updates });
                                                            }}
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
                                                            <SearchableSelect name="reconfigRecord_subtype"
                                                                options={RECONFIG_SUBTYPES[reconfigRecord.category]}
                                                                value={reconfigRecord.subtype}
                                                                onChange={(val) => setReconfigRecord({ ...reconfigRecord, subtype: val })}
                                                                placeholder="Seleccione Tipo..."
                                                                className="text-white"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {reconfigRecord.category === 'Control de HHC' && (
                                                    <div className="flex gap-4 p-3 border border-slate-800 rounded-xl bg-slate-950/50">
                                                        <div className="flex-1 space-y-2">
                                                            <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-1">Fecha a Reportar</label>
                                                            <input name="reconfigRecord_date" 
                                                                type="date"
                                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                                                                value={reconfigRecord.date}
                                                                onChange={(e) => {
                                                                    const dateStr = e.target.value;
                                                                    let updates: any = { date: dateStr };
                                                                    if (programData['obj2']) {
                                                                        const getMonthVal = (dStr: string) => {
                                                                            if (!dStr || typeof dStr !== 'string') return -1;
                                                                            if (dStr.includes('-')) {
                                                                                const p = dStr.split('-');
                                                                                if (p[0].length === 4) return parseInt(p[1], 10) - 1; // YYYY-MM-DD
                                                                                return parseInt(p[1], 10) - 1; // DD-MM-YYYY
                                                                            }
                                                                            if (dStr.includes('/')) {
                                                                                const p = dStr.split('/');
                                                                                if (p[0].length === 4) return parseInt(p[1], 10) - 1; // YYYY/MM/DD
                                                                                return parseInt(p[1], 10) - 1; // DD/MM/YYYY
                                                                            }
                                                                            const up = dStr.toUpperCase();
                                                                            const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SET", "OCT", "NOV", "DIC"];
                                                                            const idx = months.findIndex(m => up.startsWith(m));
                                                                            if (idx !== -1) return idx;
                                                                            const d = new Date(dStr);
                                                                            return isNaN(d.getTime()) ? -1 : d.getMonth();
                                                                        };

                                                                        const targetMonth = getMonthVal(dateStr || '');
                                                                        
                                                                        // Primero buscar coincidencia exacta
                                                                        let match = programData['obj2'].find((p: any) => p.date === dateStr);
                                                                        
                                                                        // Si no, coincidir por mes
                                                                        if (!match && targetMonth !== -1) {
                                                                            match = programData['obj2'].find((p: any) => getMonthVal(p.date) === targetMonth);
                                                                        }

                                                                        if (match) {
                                                                            updates.tema = match.description;
                                                                            updates.area = match.area || 'Seguridad';
                                                                            const dLow = match.description.toLowerCase();
                                                                            if (dLow.includes('induc')) updates.subtype = 'INDUCCIÓN (4H)';
                                                                            else if (dLow.includes('charla')) updates.subtype = 'CHARLA (15 MIN)';
                                                                            else if (dLow.includes('difusi')) updates.subtype = 'DIFUSIÓN (30 MIN)';
                                                                            else if (dLow.includes('entren')) updates.subtype = 'ENTRENAMIENTO (30 MIN)';
                                                                            else updates.subtype = 'CAPACITACIÓN (1H)';
                                                                        }
                                                                    }
                                                                    setReconfigRecord({ ...reconfigRecord, ...updates });
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex-1 space-y-2">
                                                            <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-1">Área Programada</label>
                                                            <select name="reconfigRecord_area" 
                                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                                                                value={reconfigRecord.area}
                                                                onChange={(e) => setReconfigRecord({ ...reconfigRecord, area: e.target.value })}
                                                            >
                                                                <option value="Seguridad">Seguridad</option>
                                                                <option value="Salud">Salud</option>
                                                                <option value="Medio Ambiente">Medio Ambiente</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex-[2] space-y-2">
                                                            <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-1">Tema del Programa (Mes Seleccionado)</label>
                                                            {(() => {
                                                                // Extraer número de mes desde cualquier formato de fecha
                                                                const getMes = (d: string) => {
                                                                    if (!d) return -1;
                                                                    if (d.includes('-')) { const p = d.split('-'); return p[0].length === 4 ? parseInt(p[1]) - 1 : parseInt(p[1]) - 1; }
                                                                    if (d.includes('/')) { const p = d.split('/'); return p[0].length === 4 ? parseInt(p[1]) - 1 : parseInt(p[1]) - 1; }
                                                                    const MESES = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SET","OCT","NOV","DIC"];
                                                                    const mi = MESES.findIndex(m => d.toUpperCase().startsWith(m));
                                                                    if (mi !== -1) return mi;
                                                                    const dt = new Date(d); return isNaN(dt.getTime()) ? -1 : dt.getMonth();
                                                                };
                                                                // Normalizar texto para deduplicar correctamente
                                                                const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

                                                                const mesSeleccionado = getMes(reconfigRecord.date || '');
                                                                const todosLosTemas = programData['obj2'] || [];
                                                                const temasDelMes = mesSeleccionado === -1 ? todosLosTemas : todosLosTemas.filter((item: any) => getMes(item.date) === mesSeleccionado);
                                                                
                                                                // Deduplicar usando texto normalizado como clave
                                                                const seenNorm = new Set<string>();
                                                                const temasUnicos: any[] = [];
                                                                temasDelMes.forEach((item: any) => {
                                                                    if (!item.description) return;
                                                                    const key = norm(item.description);
                                                                    if (!seenNorm.has(key)) {
                                                                        seenNorm.add(key);
                                                                        temasUnicos.push(item);
                                                                    }
                                                                });

                                                                const isNuevoTema = reconfigRecord.tema === '__NUEVO__';
                                                                return (
                                                                    <div className="space-y-2">
                                                                        <select name="isNuevoTema_NUEVO_reconfigRecord_tema" 
                                                                            className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-1.5 text-xs text-white"
                                                                            value={isNuevoTema ? '__NUEVO__' : (reconfigRecord.tema || '')}
                                                                            onChange={(e) => {
                                                                                const desc = e.target.value;
                                                                                if (desc === '__NUEVO__') {
                                                                                    setNewTema('');
                                                                                    setReconfigRecord({ ...reconfigRecord, tema: '__NUEVO__' });
                                                                                    return;
                                                                                }
                                                                                const itemData = temasUnicos.find((item: any) => item.description === desc);
                                                                                const areaVal = (itemData?.area || 'SEGURIDAD').toLowerCase().includes('salud') ? 'Salud' : (itemData?.area || 'SEGURIDAD').toLowerCase().includes('ambiente') ? 'Medio Ambiente' : 'Seguridad';
                                                                                const dLow = desc.toLowerCase();
                                                                                let subtype = 'CAPACITACIÓN (1H)';
                                                                                if (dLow.includes('induc')) subtype = 'INDUCCIÓN (4H)';
                                                                                else if (dLow.includes('charla')) subtype = 'CHARLA (15 MIN)';
                                                                                else if (dLow.includes('difusi')) subtype = 'DIFUSIÓN (30 MIN)';
                                                                                else if (dLow.includes('entren')) subtype = 'ENTRENAMIENTO (30 MIN)';
                                                                                setReconfigRecord({ ...reconfigRecord, tema: desc, area: areaVal, subtype });
                                                                            }}
                                                                        >
                                                                            <option value="">{mesSeleccionado === -1 ? '⚠ Seleccione una fecha primero...' : temasUnicos.length === 0 ? 'Sin temas programados ese mes' : '— Seleccione Tema Programado —'}</option>
                                                                            {temasUnicos.map((item: any, idx: number) => (
                                                                                <option key={idx} value={item.description}>{item.description}</option>
                                                                            ))}
                                                                            <option value="__NUEVO__">➕ Ingresar tema nuevo...</option>
                                                                        </select>
                                                                        {isNuevoTema && (
                                                                            <input name="newTema"
                                                                                type="text"
                                                                                placeholder="Escribe el tema de la capacitación..."
                                                                                className="w-full bg-slate-800 border border-amber-400/60 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 outline-none"
                                                                                value={newTema}
                                                                                onChange={(e) => setNewTema(e.target.value)}
                                                                                autoFocus
                                                                            />
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>

                                                        {/* ¿Tiene tema adicional? */}
                                                        <div className="flex-[2] space-y-2">
                                                            <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-1">¿Tiene Tema Adicional?</label>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setReconfigRecord({ ...reconfigRecord!, temaAdicional: true, nombreTemaAdicional: reconfigRecord!.temaAdicional === true ? reconfigRecord!.nombreTemaAdicional : '' })}
                                                                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-black border transition-all ${
                                                                        reconfigRecord.temaAdicional === true
                                                                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                                                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-emerald-500/50'
                                                                    }`}
                                                                >
                                                                    ✅ SÍ
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setReconfigRecord({ ...reconfigRecord!, temaAdicional: false, nombreTemaAdicional: '' })}
                                                                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-black border transition-all ${
                                                                        reconfigRecord.temaAdicional === false
                                                                        ? 'bg-slate-600 border-slate-500 text-white'
                                                                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                                                                    }`}
                                                                >
                                                                    ❌ NO
                                                                </button>
                                                            </div>
                                                            {reconfigRecord.temaAdicional === true && (
                                                                <input name="reconfigRecord_nombreTemaAdicional"
                                                                    type="text"
                                                                    placeholder="Escribe el nombre del tema adicional..."
                                                                    className="w-full mt-2 bg-slate-800 border border-emerald-400/60 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-400 outline-none"
                                                                    value={reconfigRecord.nombreTemaAdicional || ''}
                                                                    onChange={(e) => setReconfigRecord({ ...reconfigRecord!, nombreTemaAdicional: e.target.value })}
                                                                    autoFocus
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col gap-2 min-w-[140px] pt-6">
                                                <button 
                                                    disabled={!reconfigRecord.category || (!reconfigRecord.subtype && RECONFIG_SUBTYPES[reconfigRecord.category]) || (reconfigRecord.category === 'Control de HHC' && (!reconfigRecord.tema || (reconfigRecord.tema === '__NUEVO__' && !newTema.trim())))}
                                                    className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-[10px] px-4 py-2 rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-95 text-center"
                                                    onClick={async () => {
                                                        const rec = selectedRecords.records[ri];
                                                        const confirm = window.confirm(`¿Estás seguro de REDIRECCIONAR este registro a ${reconfigRecord.category}?`);
                                                        if (!confirm) return;

                                                        try {
                                                            const res = await fetch('/api/reconfigure', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({
                                                                    record: rec,
                                                                    targetCategory: reconfigRecord.category,
                                                                    targetSubtype: reconfigRecord.subtype,
                                                                    targetTema: reconfigRecord.tema === '__NUEVO__' ? newTema.trim() : reconfigRecord.tema,
                                                                    targetArea: reconfigRecord.area,
                                                                    targetDate: reconfigRecord.date,
                                                                    temaAdicional: reconfigRecord.temaAdicional === true ? (reconfigRecord.nombreTemaAdicional || '').trim() : null
                                                                })
                                                            });
                                                            const data = await res.json();
                                                            if (data.success) {
                                                                alert(`✅ Registro redireccionado con éxito.`);
                                                                
                                                                // Update local states instead of reload
                                                                setHhcRecords(prev => prev.filter(r => r.id !== rec.id));
                                                                setExecutedInspections(prev => prev.filter(r => r.id !== rec.id));
                                                                setEvidenceRecords(prev => prev.filter(r => r.id !== rec.id));
                                                                setPmaRecords(prev => prev.filter(r => r.id !== rec.id));
                                                                setAtsRecords(prev => prev.filter(r => r.id !== rec.id));
                                                                setPetarRecords(prev => prev.filter(r => r.id !== rec.id));
                                                                setDetourRecords(prev => prev.filter(r => r.id !== rec.id));
                                                                setSimulacroRecords(prev => prev.filter(r => r.id !== rec.id));
                                                                setBrigadistaRecords(prev => prev.filter(r => r.id !== rec.id));
                                                                
                                                                setSelectedRecords(prev => prev ? { ...prev, records: prev.records.filter(r => r.id !== rec.id) } : null);
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
                                                <button 
                                                    className="w-full bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 text-red-400 font-bold text-[10px] px-4 py-2 rounded-xl transition-all active:scale-95 text-center"
                                                    onClick={async () => {
                                                        const rec = selectedRecords.records[ri];
                                                        const confirm = window.confirm(`⚠️ ADVERTENCIA ⚠️\n¿Estás completamente seguro de ELIMINAR este registro defectuoso? Esta acción no se puede deshacer.`);
                                                        if (!confirm) return;

                                                        try {
                                                            const res = await fetch('/api/reconfigure', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({
                                                                    record: rec,
                                                                    action: 'delete'
                                                                })
                                                            });
                                                            const data = await res.json();
                                                            if (data.success) {
                                                                alert(`🗑️ Registro eliminado correctamente.`);
                                                                
                                                                // Update local states instead of reload
                                                                setHhcRecords(prev => prev.filter(r => r.id !== rec.id));
                                                                setExecutedInspections(prev => prev.filter(r => r.id !== rec.id));
                                                                setEvidenceRecords(prev => prev.filter(r => r.id !== rec.id));
                                                                setPmaRecords(prev => prev.filter(r => r.id !== rec.id));
                                                                setAtsRecords(prev => prev.filter(r => r.id !== rec.id));
                                                                setPetarRecords(prev => prev.filter(r => r.id !== rec.id));
                                                                setDetourRecords(prev => prev.filter(r => r.id !== rec.id));
                                                                setSimulacroRecords(prev => prev.filter(r => r.id !== rec.id));
                                                                setBrigadistaRecords(prev => prev.filter(r => r.id !== rec.id));
                                                                
                                                                setSelectedRecords(prev => prev ? { ...prev, records: prev.records.filter(r => r.id !== rec.id) } : null);
                                                            } else {
                                                                alert(`❌ Error al eliminar: ${data.error}`);
                                                            }
                                                        } catch (err) {
                                                            alert(`❌ Error de conexión`);
                                                        }
                                                        setReconfigRecord(null);
                                                    }}
                                                >
                                                    <Trash2 size={12} className="inline-block mr-1" />
                                                    ELIMINAR 
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                    
                                    {(() => {
                                        // Robust evidence detection including all snake_case and camelCase variations
                                        const hasPdf = rec.evidencePdf || rec.evidence_pdf || rec.pdfUrl || rec.pdf_url || 
                                                     (rec.fileUrl && String(rec.fileUrl).toLowerCase().includes('.pdf')) || 
                                                     (rec.file_url && String(rec.file_url).toLowerCase().includes('.pdf')) ||
                                                     (rec.file_type && String(rec.file_type).toLowerCase().includes('pdf'));
                                        
                                        const hasImgs = (rec.evidenceImgs && rec.evidenceImgs.length > 0) || 
                                                      (rec.evidence_imgs && typeof rec.evidence_imgs === 'string' && rec.evidence_imgs.length > 5) ||
                                                      (rec.images && rec.images.length > 0) || 
                                                      (rec.imageUrl) || (rec.image_url) || (rec.files) || (rec.evidenceUrl) || (rec.evidence_url);

                                        const hasGeneralFile = (rec.fileUrl && rec.fileUrl.length > 10) || (rec.file_url && rec.file_url.length > 10);
                                        
                                        const hasAny = hasPdf || hasImgs || hasGeneralFile;
                                        
                                        if (!hasAny) {
                                            return (
                                                <div className="px-4 pb-2 text-center border-t border-slate-800/30 pt-2">
                                                    <span className="text-[10px] text-slate-600 font-medium italic">Sin archivos adjuntos en BD</span>
                                                    <div className="text-[8px] text-slate-700 mt-1">ID: {rec.id || 'N/A'} | Type: {rec._type || 'N/A'}</div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
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
