"use client";

import { Activity, MONTHS } from "@/lib/types";
import { ComplianceGauge } from "./ComplianceGauge";
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Rectangle, ComposedChart, Area, AreaChart, LabelList, ReferenceLine } from 'recharts';
import { TrendingUp, Target, Award, ShieldCheck, Activity as ActivityIcon, Leaf, Users, Clock, Calculator, HardHat, Trash2, Edit, History, Plus, PlusCircle, PieChart as PieChartIcon, CheckCircle2, UploadCloud, Loader2 } from 'lucide-react';
import { categorizeActivitiesByObjective, OBJECTIVES_CONFIG } from "@/lib/objective-categorization";
import { calculateObjectiveMonthlyStats } from '@/lib/program-utils';
import { USER_LIST, useAuth } from "@/lib/auth";
import { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import { FileText, Image as ImageIcon, Download, Eye, X, ClipboardCheck, Calendar, Search, Shield, ChevronDown, BookOpen } from 'lucide-react';
import { generateFilename, getInitials, getDriveViewerUrl } from '@/lib/utils';
import { SSOMA_LOCATIONS } from "@/lib/locations";
import SearchableSelect from "@/components/SearchableSelect";
import { AlertCircle } from 'lucide-react';


interface DashboardChartsProps {
    activities: Activity[];
    mode?: 'general' | 'hhc';
    activeManagement?: string;
    currentMonth?: number;
    currentYear?: number;
}

const FORMATION_DURATIONS: Record<string, number> = {
    'induccion_gen': 4,
    'induccion_esp': 8,
    'capacitacion': 1,
    'difusion': 0.5,
    'entrenamiento': 0.5,
    'charla': 0.25
};

export function DashboardCharts({ 
    activities, 
    mode = 'general', 
    activeManagement = 'todos',
    currentMonth = -1, 
    currentYear = 2026 
}: DashboardChartsProps) {


    // --- DATA LOADING FOR ANNUAL PROGRAM ---
    const [programData, setProgramData] = useState<Record<string, any[]>>({});
    const [annualTotals, setAnnualTotals] = useState<Record<string, { p: number, e: number }>>({});
    const [executedInspections, setExecutedInspections] = useState<any[]>([]);
    const [hhcRecords, setHhcRecords] = useState<any[]>([]);
    const [evidenceRecords, setEvidenceRecords] = useState<any[]>([]);
    const [pmaRecords, setPmaRecords] = useState<any[]>([]);
    const [atsRecords, setAtsRecords] = useState<any[]>([]);
    const [petarRecords, setPetarRecords] = useState<any[]>([]);
    const [detourRecords, setDetourRecords] = useState<any[]>([]);
    const [simulacroRecords, setSimulacroRecords] = useState<any[]>([]);
    const [brigadistaRecords, setBrigadistaRecords] = useState<any[]>([]);
    const [risstmaRecords, setRisstmaRecords] = useState<any[]>([]);
    const [manifiestoRecords, setManifiestoRecords] = useState<any[]>([]);
    const [residuosRecords, setResiduosRecords] = useState<any[]>([]);
    const [reporteAcRecords, setReporteAcRecords] = useState<any[]>([]);

    // --- AUTH CONTEXT ---
    const { user } = useAuth();
    const isDeveloper = true;

    const [selectedArea, setSelectedArea] = useState<'todos' | 'seguridad' | 'salud' | 'ambiente'>('todos');
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [showProgramModal, setShowProgramModal] = useState(false);
    const [trainingProgram, setTrainingProgram] = useState<any[]>([]);
    const [complianceGoal, setComplianceGoal] = useState(95);

    const [isSyncing, setIsSyncing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [filters, setFilters] = useState({ responsable: '', tema: '', startDate: '', endDate: '', type: 'todos', lugar: '' });
    const [viewingImages, setViewingImages] = useState<{tema: string, imgs: string[]} | null>(null);
    const [programMonthFilter, setProgramMonthFilter] = useState<number>(new Date().getMonth());

    // --- TEMARIO MENSUAL LOGIC (PROGRAMA) ---
    const [monthlyTemarioUrl, setMonthlyTemarioUrl] = useState<string | null>(null);
    const [isUploadingTemario, setIsUploadingTemario] = useState(false);
    const [isDraggingTemario, setIsDraggingTemario] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch(`/api/monthly-temarios?month=${programMonthFilter}&year=${currentYear}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setMonthlyTemarioUrl(data.url);
                } else {
                    setMonthlyTemarioUrl(null);
                }
            })
            .catch(err => {
                console.error("Error fetching temario:", err);
                setMonthlyTemarioUrl(null);
            });
    }, [programMonthFilter, currentYear]);

    const processTemarioUpload = async (file: File) => {
        setIsUploadingTemario(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderName', `Temarios_Mensuales/${currentYear}/${programMonthFilter}`);
        formData.append('fileName', `Temario_${MONTHS[programMonthFilter]}_${currentYear}.pdf`);

        try {
            const uploadRes = await fetch('/api/upload-evidence', {
                method: 'POST',
                body: formData
            });
            
            if (!uploadRes.ok) {
                const errText = await uploadRes.text();
                if (uploadRes.status === 413) throw new Error("El archivo es demasiado grande (Límite Vercel: 4.5MB). Por favor, comprímelo.");
                if (uploadRes.status === 504) throw new Error("El servidor tardó demasiado (Timeout). El PDF podría ser muy pesado para subirse a Drive desde Vercel.");
                
                try {
                    const errJson = JSON.parse(errText);
                    throw new Error(errJson.error || `Error HTTP ${uploadRes.status}`);
                } catch {
                    throw new Error(`Error de servidor (${uploadRes.status}): ${errText.substring(0,100)}`);
                }
            }
            
            const uploadData = await uploadRes.json();

            if (uploadData.success || uploadData.path) {
                const driveUrl = uploadData.path;
                const saveRes = await fetch('/api/monthly-temarios', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ month: programMonthFilter, year: currentYear, url: driveUrl })
                });
                
                if (!saveRes.ok) {
                    const saveErrText = await saveRes.text();
                    try {
                        const saveErrJson = JSON.parse(saveErrText);
                        throw new Error("Base de datos: " + (saveErrJson.error || `HTTP ${saveRes.status}`));
                    } catch {
                        throw new Error(`Error guardando URL en BD (${saveRes.status})`);
                    }
                }
                
                const saveData = await saveRes.json();
                
                if (saveData.success) {
                    setMonthlyTemarioUrl(driveUrl);
                    alert('✅ Temario mensual subido y guardado exitosamente.');
                } else {
                    alert('⚠️ Error al guardar la URL del temario: ' + saveData.error);
                }
            } else {
                alert('⚠️ Error subiendo el PDF a Drive: ' + uploadData.error);
            }
        } catch (err: any) {
            console.error(err);
            alert(`⚠️ Fallo en la subida: ${err.message || 'Error de red o conexión'}`);
        } finally {
            setIsUploadingTemario(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleUploadTemario = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processTemarioUpload(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingTemario(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingTemario(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingTemario(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type === "application/pdf") {
            processTemarioUpload(file);
        } else if (file) {
            alert("⚠️ Solo se permiten archivos en formato PDF.");
        }
    };

    const handleDeleteTemario = async () => {
        if (!window.confirm('¿Estás seguro de ELIMINAR el temario de este mes?')) return;
        
        try {
            const res = await fetch(`/api/monthly-temarios?month=${programMonthFilter}&year=${currentYear}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setMonthlyTemarioUrl(null);
                alert('✅ Temario eliminado correctamente.');
            } else {
                alert('⚠️ Error al eliminar el temario.');
            }
        } catch (err) {
            console.error(err);
            alert('⚠️ Error de conexión al intentar eliminar.');
        }
    };


    const [newProgram, setNewProgram] = useState({ date: '', tema: '', area: 'seguridad' as const, tipo: 'capacitacion' as const });
    const [isDraggingHhcPdf, setIsDraggingHhcPdf] = useState(false);
    const [isDraggingHhcImgs, setIsDraggingHhcImgs] = useState(false);
    const [isPdfExporting, setIsPdfExporting] = useState(false);
    const [pdfProgress, setPdfProgress] = useState(0);
    const [pdfExportStatus, setPdfExportStatus] = useState('Iniciando descarga...');

    // --- ACCIDENTABILITY STATS ---
    const [accidentabilityStats, setAccidentabilityStats] = useState({ IF: 0, IS: 0, IA: 0, TasaInc: 0, FreqPrePat: 0, totalHHT: 0 });
    useEffect(() => {
        const saved = localStorage.getItem(`accidentability_stats_${currentYear}`);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                const getTotal = (key: string) => (data[key] || []).reduce((a: number, b: number) => a + b, 0);

                const totalHP = getTotal('HP');
                const totalT = getTotal('T');
                const avgT = totalT > 0 ? totalT / 12 : 0;

                const totalACDP = getTotal('ATT') + getTotal('APP') + getTotal('ATP') + getTotal('AM');
                const totalTDP = getTotal('TDP');
                const totalEO = getTotal('EO');
                const totalEP = getTotal('EP');

                const IF = totalHP > 0 ? (totalACDP * 1000000) / totalHP : 0;
                const IS = totalHP > 0 ? (totalTDP * 1000000) / totalHP : 0;
                const IA = (IF * IS) / 1000;

                const TasaInc = avgT > 0 ? (totalEO * 1000) / avgT : 0;
                const FreqPrePat = avgT > 0 ? (totalEP * 1000) / avgT : 0;

                setAccidentabilityStats({
                    IF: Number(IF.toFixed(2)),
                    IS: Number(IS.toFixed(2)),
                    IA: Number(IA.toFixed(2)),
                    TasaInc: Number(TasaInc.toFixed(2)),
                    FreqPrePat: Number(FreqPrePat.toFixed(2)),
                    totalHHT: totalHP
                });
            } catch (e) {
                console.error(e);
            }
        }
    }, [mode, currentYear]);

    const [deactivatedUsers, setDeactivatedUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        const saved = localStorage.getItem('deactivated_dashboard_users');
        if (saved) {
            try {
                setDeactivatedUsers(new Set(JSON.parse(saved)));
            } catch (e) {
                console.error('Error parsing deactivated users', e);
            }
        }
    }, []);

    const toggleParticipation = (username: string) => {
        const newSet = new Set(deactivatedUsers);
        if (newSet.has(username)) {
            newSet.delete(username);
        } else {
            newSet.add(username);
        }
        setDeactivatedUsers(newSet);
        localStorage.setItem('deactivated_dashboard_users', JSON.stringify(Array.from(newSet)));
    };


    const [performanceDetail, setPerformanceDetail] = useState<{
        userName: string,
        executedItems: any[],
        pendingItems: any[]
    } | null>(null);

    // LOAD ALL RECORDS - Consolidated
    useEffect(() => {
        const loadAllRecords = async () => {
            try {
                const [
                    progRes, inspRes, hhcRes, evRes, pmaRes, 
                    atsRes, petarRes, detourRes, simRes, briRes, risRes, trainingRes, racRes
                ] = await Promise.all([
                    fetch('/api/annual-program').then(r => r.json()).catch(() => ({ programData: {} })),
                    fetch('/api/inspections').then(r => r.json()).catch(() => ({ records: [] })),
                    fetch('/api/hhc-records').then(r => r.json()).catch(() => ({ records: [] })),
                    fetch('/api/evidence-records').then(r => r.json()).catch(() => ({ records: [] })),
                    fetch('/api/pma-records').then(r => r.json()).catch(() => ({ records: [] })),
                    fetch('/api/ats-records').then(r => r.json()).catch(() => ({ records: [] })),
                    fetch('/api/petar-records').then(r => r.json()).catch(() => ({ records: [] })),
                    fetch('/api/desvio-records').then(r => r.json()).catch(() => ({ records: [] })),
                    fetch('/api/simulacro-records').then(r => r.json()).catch(() => ({ records: [] })),
                    fetch('/api/brigadista-records').then(r => r.json()).catch(() => ({ records: [] })),
                    fetch('/api/risstma-records').then(r => r.json()).catch(() => ({ records: [] })),
                    fetch('/api/training-program').then(r => r.json()).catch(() => ({ records: [] })),
                    fetch('/api/reporte-ac-records').then(r => r.json()).catch(() => ({ records: [] }))
                ]);

                setProgramData(progRes.programData || {});
                setExecutedInspections(inspRes.records || []);
                setHhcRecords(hhcRes.records || []);
                setEvidenceRecords(evRes.records || []);
                setPmaRecords(pmaRes.records || []);
                setAtsRecords(atsRes.records || []);
                setPetarRecords(petarRes.records || []);
                setDetourRecords(detourRes.records || []);
                setSimulacroRecords(simRes.records || []);
                setBrigadistaRecords(briRes.records || []);
                setRisstmaRecords(risRes.records || []);
                setTrainingProgram(trainingRes.records || []);
                setReporteAcRecords(racRes.records || []);

                // Load localStorage-only records (manifiesto + residuos)
                try {
                    const mStored = localStorage.getItem('manifest_records_v1');
                    if (mStored) setManifiestoRecords(JSON.parse(mStored));
                    const rStored = localStorage.getItem('waste_weight_records_v1');
                    if (rStored) setResiduosRecords(JSON.parse(rStored));
                    const totalsStored = localStorage.getItem('annual_program_totals');
                    if (totalsStored) setAnnualTotals(JSON.parse(totalsStored));
                } catch (e) { console.error('Error loading localStorage records', e); }
                
                setIsLoaded(true);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        };
        loadAllRecords();
    }, []);

    // --- HHC DRAFT LOGIC ---
    const [newHHC, setNewHHC] = useState({
        responsable: '', date: '', hhc: '', hht: '', hombres: '', mujeres: '', area: 'seguridad' as any, tipo: 'capacitacion' as any, tema: '', evidenceImgs: [] as string[], evidencePdf: '', lugar: '',
        isAdditionalTopic: false, customTopic: ''
    });

    useEffect(() => {
        if (editingIndex === null) {
            localStorage.setItem('hhc_draft_v1', JSON.stringify(newHHC));
        }
    }, [newHHC, editingIndex]);

    useEffect(() => {
        const savedDraft = localStorage.getItem('hhc_draft_v1');
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                if (!newHHC.tema && !newHHC.hhc) {
                    setNewHHC(prev => ({ ...prev, ...draft }));
                }
            } catch (e) {
                console.error("Error loading HHC draft", e);
            }
        }
    }, []);

    // AUTO-SET RESPONSIBLE
    useEffect(() => {
        if (user && !newHHC.responsable) {
            setNewHHC(prev => ({ ...prev, responsable: user.name }));
        }
    }, [user]);

    // --- CALCULATE FUNCTIONS ---
    const memoizedCategorizedActivities = useMemo(() => {
        return categorizeActivitiesByObjective(activities);
    }, [activities]);

    // Helper: parse month index (0-11) from YYYY-MM-DD or DD/MM/YYYY strings
    const getMonthFromDateStr = (dateStr: any): number => {
        if (!dateStr || typeof dateStr !== 'string') return -1;
        if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            if (parts.length >= 2) return parseInt(parts[1]) - 1;
        }
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length >= 2) return parseInt(parts[1]) - 1;
        }
        try {
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? -1 : d.getMonth();
        } catch { return -1; }
    };

    // Helper: Verify if a record has at least one evidence file (URL or non-empty array)
    const hasEvidence = (r: any): boolean => {
        if (!r) return false;
        // Check for PDF fields
        const pdf = r.evidencePdf || r.evidence_pdf || r.pdfUrl || r.fileUrl || r.file_url || r.evidenceUrl || r.evidence_url;
        if (pdf && typeof pdf === 'string' && pdf.trim().length > 10 && !pdf.includes('undefined') && !pdf.includes('null')) return true;
        
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

    // ── FUZZY MATCHING HELPERS (identical to Programa Anual getMatrixData logic) ──
    const normStr = (s: string) =>
        (s || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const getWords = (s: string) => s.split(/\s+/).filter(w => w.length > 2);
    const isWordSubset = (subset: string[], superset: string[]) =>
        subset.every(sw => superset.some(pw => pw.includes(sw) || sw.includes(pw)));


    // Build a fuzzy-matcher function for all descriptions of a given objective
    const buildMatcher = (objId: string) => {
        const list = (programData[objId] || []) as any[];
        const descSet = new Set<string>(list.map((i: any) => i.description || '').filter(Boolean));
        const cache: Record<string, { norm: string; words: string[] }> = {};
        descSet.forEach(d => {
            const dn = normStr(d);
            cache[d] = { norm: dn, words: getWords(dn) };
        });
        return (searchStr: string): boolean => {
            const sn = normStr(searchStr || '');
            const sw = getWords(sn);
            if (sw.length === 0) return false;
            for (const d of descSet) {
                const c = cache[d];
                if (!c) continue;
                if (c.norm === sn) return true;
                if (c.words.length > 0 && (isWordSubset(c.words, sw) || isWordSubset(sw, c.words))) return true;
            }
            return false;
        };
    };

    // Compute P/E per month using programData + fuzzy-matched real records
    // E matches the EXACT same totals shown in the Programa Anual sidebar
    const getObjectiveMonthlyStats = (objId?: string) => {
        const monthlyData = Array(12).fill(0).map((_, i) => ({ name: MONTHS[i], P: 0, E: 0 }));

        const normalizedId = objId
            ? (objId.includes('-') ? objId.replace('obj-', 'obj') : objId)
            : null;

        // ── PROGRAMADO (P) ────────────────────────────────────────────────────
        if (normalizedId && programData[normalizedId]) {
            (programData[normalizedId] as any[]).forEach((item: any) => {
                const m = getMonthFromDateStr(item.date);
                if (m >= 0 && m <= 11) monthlyData[m].P++;
            });
        } else if (!normalizedId) {
            Object.values(programData).forEach((items: any) => {
                (items as any[]).forEach((item: any) => {
                    const m = getMonthFromDateStr(item.date);
                    if (m >= 0 && m <= 11) monthlyData[m].P++;
                });
            });
        }

        // ── EJECUTADO (E) via shared logic mirroring app/program/page.tsx ──
        const objsToProcess = normalizedId
            ? [normalizedId]
            : ['obj1','obj2','obj3','obj4','obj5','obj6','obj7','obj8','obj9','obj10','obj11'];

        objsToProcess.forEach(id => {
            const rawMonthly = calculateObjectiveMonthlyStats(
                id,
                programData,
                OBJECTIVES_LIST,
                executedInspections,
                hhcRecords,
                evidenceRecords,
                pmaRecords,
                atsRecords,
                petarRecords,
                detourRecords,
                simulacroRecords,
                brigadistaRecords,
                risstmaRecords,
                reporteAcRecords
            );
            for (let i = 0; i < 12; i++) {
                monthlyData[i].E += rawMonthly[i].E;
            }
        });

        return monthlyData;
    };


    const calculateTrainingIndex = () => {
        if (currentMonth === -1 && annualTotals['obj2']) {
            const totalP = annualTotals['obj2'].p;
            const totalE = annualTotals['obj2'].e;
            return totalP === 0 ? 0 : Math.round((totalE / totalP) * 100);
        }

        const stats = getObjectiveMonthlyStats('obj2');
        const totalP = stats.reduce((acc, curr) => acc + curr.P, 0);
        const totalE = stats.reduce((acc, curr) => acc + curr.E, 0);
        return totalP === 0 ? 0 : Math.round((totalE / totalP) * 100);
    };

    const OBJECTIVES_LIST = [
        { id: 'obj1', label: 'OBJ 01: SCSST' },
        { id: 'obj2', label: 'OBJ 02: Capacitación' },
        { id: 'obj3', label: 'OBJ 03: Inspecciones Seguridad' },
        { id: 'obj4', label: 'OBJ 04: Reporte A/C Inseguras' },
        { id: 'obj5', label: 'OBJ 05: EMO Realizados' },
        { id: 'obj6', label: 'SEG 01: Inspecciones de Salud' },
        { id: 'obj7', label: 'SEG 02: Formaciones de Salud' },
        { id: 'obj8', label: 'SEG 03: Inspecciones M. Ambiente' },
        { id: 'obj9', label: 'SEG 04: Formaciones M. Ambiente' },
        { id: 'obj10', label: 'SEG 05: Control de Simulacros' },
        { id: 'obj11', label: 'SEG 06: Control de Brigadistas' },
    ];

    // --- IMPORT / EXPORT LOGIC ---
    const [importMenuOpen, setImportMenuOpen] = useState(false);

    const handleDeleteMonthHhc = () => {
        setHhcRecords(prev => prev.filter(r => {
            const d = new Date(r.date);
            // Keep record IF year is diff OR month is diff
            return !(d.getFullYear() === currentYear && d.getMonth() === hhcMonthFilter);
        }));
        alert(`✅ Registros de ${MONTHS[hhcMonthFilter]} eliminados correctamente.`);
    };

    const handleHhcExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

                if (worksheet.length === 0) return;

                const newRecords: any[] = [];
                const targetMonthIndex = hhcMonthFilter;

                worksheet.forEach((row: any) => {
                    // Mapeo básico
                    // Intentar usar la fecha del Excel si existe, pero FORZAR el mes si no coincide o si se pide
                    // Regla: Asignar al día 15 del mes seleccionado si no tiene fecha, 
                    // O si tiene fecha, moverla al mes seleccionado conservando el día.

                    let dateStr = row['Fecha'] || row['Date'] || row['FECHA'] || '';
                    let finalDate = '';

                    // Construir fecha en el mes seleccionado
                    if (dateStr) {
                        // Parse logic (simplified)
                        // Si ya viene con fecha, intentamos respetar el día
                        let day = 15;
                        if (String(dateStr).includes('-')) {
                            const parts = String(dateStr).split('-');
                            // parts[2] usually day in YYYY-MM-DD
                            if (parts.length === 3) day = parseInt(parts[2]);
                        }
                        // Force Year/Month
                        finalDate = `${currentYear}-${String(targetMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    } else {
                        finalDate = `${currentYear}-${String(targetMonthIndex + 1).padStart(2, '0')}-15`;
                    }

                    // Mapping
                    newRecords.push({
                        date: finalDate,
                        hhc: Number(row['H. Cap'] || row['HHC'] || row['H.Cap'] || 0),
                        hht: Number(row['H. Trab'] || row['HHT'] || row['H.Trab'] || 0),
                        hombres: Number(row['Hombres'] || row['Males'] || 0),
                        mujeres: Number(row['Mujeres'] || row['Females'] || 0),
                        area: (row['Area'] || row['AREA'] || 'seguridad').toLowerCase(),
                        tipo: (row['Tipo'] || row['TIPO'] || 'capacitacion').toLowerCase(),
                        tema: row['Tema'] || row['TEMA'] || 'Actividad Importada',
                        responsable: row['Responsable'] || row['RESPONSABLE'] || 'Importado',
                        evidenceImgs: [],
                        evidencePdf: ''
                    });
                });

                // REPLACE or APPEND?
                // User said "maintained in time".
                // Usually import implies "Adding these records".
                // But if re-importing same month?
                // "Delete by month" is separate.
                // So we Append. But we first REMOVE existing records for this month to avoid duplicates if user is re-importing?
                // The Inspections logic was "Replace for this Area+Month".
                // Here we don't separate by Area as strictly in storage.
                // Let's safe-replace: Remove old for this month, Insert new.
                // "solo se eliminara el calendario si yo lo realizo" (only delete if I do it).
                // This implies IMPORT should APPEND, not replace. 
                // Wait, in Inspections I did Replace. User seemed happy.
                // But the text "solo se eliminara... si yo lo realizo" implies "Don't auto-delete".
                // So I will APPEND. User can use "Delete Month" button to clear first if they want.

                // BULK IMPORT ACTION
                const performBulkImport = async () => {
                    try {
                        const res = await fetch('/api/hhc-records', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'bulk-create', data: newRecords })
                        });

                        if (res.ok) {
                            // Recargar todo para tener IDs correctos
                            const verify = await fetch('/api/hhc-records');
                            const vData = await verify.json();
                            if (vData.success) {
                                setHhcRecords(vData.records);
                                localStorage.setItem('hhc_records', JSON.stringify(vData.records));
                            } else {
                                // Fallback: append local w/o IDs (will fix on next reload)
                                setHhcRecords(prev => [...prev, ...newRecords]);
                            }
                            alert(`✅ ${newRecords.length} registros importados a ${MONTHS[hhcMonthFilter]}.`);
                        } else {
                            throw new Error("Server error");
                        }
                    } catch (e) {
                        console.error(e);
                        alert("❌ Error al guardar importación en la nube.");
                        // Fallback local
                        setHhcRecords(prev => [...prev, ...newRecords]);
                    }
                };
                performBulkImport();

            } catch (error) {
                console.error(error);
                alert("❌ Error al leer el archivo Excel.");
            }



        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };



    // --- STATE FOR NEW HHC INDEX LOGIC ---
    
    const [hhcMonthFilter, setHhcMonthFilter] = useState<number>(new Date().getMonth());
    
    // Store manually input HHT, Empleados, Obreros per month "YYYY-M" -> value
    const [monthlyHHTInputs, setMonthlyHHTInputs] = useState<Record<string, number>>({});
    const [monthlyEmpleadosInputs, setMonthlyEmpleadosInputs] = useState<Record<string, number>>({});
    const [monthlyObrerosInputs, setMonthlyObrerosInputs] = useState<Record<string, number>>({});

    useEffect(() => {
        const savedAccidentStats = localStorage.getItem(`accidentability_stats_${currentYear}`);
        const hhtFromAcc: Record<string, number> = {};
        if (savedAccidentStats) {
            try {
                const parsed = JSON.parse(savedAccidentStats);
                if (parsed.HP) {
                    parsed.HP.forEach((val: number, idx: number) => {
                        hhtFromAcc[`${currentYear}-${idx}`] = val;
                    });
                }
            } catch (e) {}
        }

        const savedHHT = localStorage.getItem('monthly_hht_inputs');
        const hhtFromLocal = savedHHT ? JSON.parse(savedHHT) : {};
        setMonthlyHHTInputs({ ...hhtFromLocal, ...hhtFromAcc });
        
        const savedEmp = localStorage.getItem('monthly_empleados_inputs');
        if (savedEmp) try { setMonthlyEmpleadosInputs(JSON.parse(savedEmp)); } catch (e) {}

        const savedObr = localStorage.getItem('monthly_obreros_inputs');
        if (savedObr) try { setMonthlyObrerosInputs(JSON.parse(savedObr)); } catch (e) {}
    }, [currentYear, mode]);

    const handleMonthlyInputChange = (key: 'hht' | 'empleados' | 'obreros', val: string) => {
        const numericVal = Number(val);
        const monthKey = `${currentYear}-${hhcMonthFilter}`;
        
        if (key === 'hht') {
            const updated = { ...monthlyHHTInputs, [monthKey]: numericVal };
            setMonthlyHHTInputs(updated);
            localStorage.setItem('monthly_hht_inputs', JSON.stringify(updated));

            // Sync with accidentability storage
            const savedAccidentStats = localStorage.getItem(`accidentability_stats_${currentYear}`);
            let stats = savedAccidentStats ? JSON.parse(savedAccidentStats) : { HP: Array(12).fill(0) };
            if (!stats.HP) stats.HP = Array(12).fill(0);
            stats.HP[hhcMonthFilter] = numericVal;
            localStorage.setItem(`accidentability_stats_${currentYear}`, JSON.stringify(stats));

        } else if (key === 'empleados') {
            const updated = { ...monthlyEmpleadosInputs, [monthKey]: numericVal };
            setMonthlyEmpleadosInputs(updated);
            localStorage.setItem('monthly_empleados_inputs', JSON.stringify(updated));
        } else if (key === 'obreros') {
            const updated = { ...monthlyObrerosInputs, [monthKey]: numericVal };
            setMonthlyObrerosInputs(updated);
            localStorage.setItem('monthly_obreros_inputs', JSON.stringify(updated));
        }
    };

    // Calculate Accumulated HHC/HHT for the selected month
    const monthlyHHCStats = useMemo(() => {
        let accHHT = 0;
        for (let i = 0; i <= hhcMonthFilter; i++) {
            accHHT += Number(monthlyHHTInputs[`${currentYear}-${i}`]) || 0;
        }

        const accumulatedRecords = hhcRecords.filter(r => {
            if (!r || !r.date) return false;
            try {
                const dateParts = String(r.date).split('-');
                if (dateParts.length < 2) return false;
                const rYear = parseInt(dateParts[0]);
                const rMonth = parseInt(dateParts[1]) - 1;
                return rYear === currentYear && rMonth <= hhcMonthFilter;
            } catch (e) { return false; }
        });

        const totalHHCSum = accumulatedRecords.reduce((acc, r) => {
            const total = (Number(r.hombres) || 0) + (Number(r.mujeres) || 0);
            const duration = FORMATION_DURATIONS[r.tipo] || 0;
            return acc + (total * duration);
        }, 0);

        const index = accHHT > 0 ? ((totalHHCSum / accHHT) * 100).toFixed(2) : "0.00";

        return {
            totalHHC: totalHHCSum.toFixed(1),
            totalHHTAccumulated: accHHT,
            index: index
        };
    }, [hhcRecords, currentYear, hhcMonthFilter, monthlyHHTInputs]);

    const indiceHHCValue = monthlyHHCStats.index;
    const totalHHCMonth = monthlyHHCStats.totalHHC;

    // Calculate Training Index for the selected month/area
    const trainingIndexValue = useMemo(() => {
        const getTrainingStatsForArea = (area: string) => {
            if (area === 'health') return getObjectiveMonthlyStats('obj7');
            if (area === 'environment') return getObjectiveMonthlyStats('obj9');
            if (area === 'safety') return getObjectiveMonthlyStats('obj2');
            
            const s2 = getObjectiveMonthlyStats('obj2');
            const s7 = getObjectiveMonthlyStats('obj7');
            const s9 = getObjectiveMonthlyStats('obj9');
            
            return s2.map((m, i) => ({
                P: m.P + s7[i].P + s9[i].P,
                E: m.E + s7[i].E + s9[i].E
            }));
        };

        const stats = getTrainingStatsForArea(activeManagement);
        let p = 0;
        let e = 0;

        if (currentMonth === -1) {
            if (activeManagement === 'todos' && annualTotals['obj2'] && annualTotals['obj7'] && annualTotals['obj9']) {
                p = annualTotals['obj2'].p + annualTotals['obj7'].p + annualTotals['obj9'].p;
                e = annualTotals['obj2'].e + annualTotals['obj7'].e + annualTotals['obj9'].e;
            } else if (activeManagement === 'health' && annualTotals['obj7']) {
                p = annualTotals['obj7'].p; e = annualTotals['obj7'].e;
            } else if (activeManagement === 'environment' && annualTotals['obj9']) {
                p = annualTotals['obj9'].p; e = annualTotals['obj9'].e;
            } else if (activeManagement === 'safety' && annualTotals['obj2']) {
                p = annualTotals['obj2'].p; e = annualTotals['obj2'].e;
            } else {
                p = stats.reduce((acc, curr) => acc + curr.P, 0);
                e = stats.reduce((acc, curr) => acc + curr.E, 0);
            }
        } else {
            p = stats[currentMonth]?.P || 0;
            e = stats[currentMonth]?.E || 0;
        }

        return p > 0 ? Math.round((e / p) * 100) : (e > 0 ? 100 : 0);
    }, [programData, activeManagement, currentMonth, hhcRecords]); // Add deps

    const annualIndex = trainingIndexValue; // Alias for compatibility with the gauge usage

    const responsibleStats = useMemo(() => {
        const counts: Record<string, number> = {};
        hhcRecords.forEach(r => {
            const name = r.responsable || 'Sin Asignar';
            counts[name] = (counts[name] || 0) + (Number(r.hhc) || 0);
        });
        return Object.entries(counts)
            .map(([name, val]) => ({ name, value: val }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 7);
    }, [hhcRecords]);

    const areaStatsChart = useMemo(() => {
        const counts = { seguridad: 0, salud: 0, ambiente: 0 };
        hhcRecords.forEach(r => {
            const area = r.area?.toLowerCase() || 'seguridad';
            if (area.includes('seguridad')) counts.seguridad += Number(r.hhc);
            else if (area.includes('salud')) counts.salud += Number(r.hhc);
            else if (area.includes('ambiente')) counts.ambiente += Number(r.hhc);
            else counts.seguridad += Number(r.hhc);
        });
        return [
            { name: 'Seguridad', value: counts.seguridad, fill: '#10b981' },
            { name: 'Salud', value: counts.salud, fill: '#ec4899' },
            { name: 'Ambiente', value: counts.ambiente, fill: '#3b82f6' }
        ];
    }, [hhcRecords]);

    const trainingTopicsByArea = useMemo(() => {
        const mapping: Record<string, string[]> = {
            'seguridad': (programData['obj2'] || []).map((i: any) => i.description).filter(Boolean),
            'salud': (programData['obj7'] || []).map((i: any) => i.description).filter(Boolean),
            'ambiente': (programData['obj9'] || []).map((i: any) => i.description).filter(Boolean),
        };
        // Unique and sorted
        mapping.seguridad = Array.from(new Set(mapping.seguridad)).sort();
        mapping.salud = Array.from(new Set(mapping.salud)).sort();
        mapping.ambiente = Array.from(new Set(mapping.ambiente)).sort();
        return mapping;
    }, [programData]);


    const bufferToBase64 = (buffer: ArrayBuffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    const fetchProxiedFile = async (url: string) => {
        try {
            const response = await fetch(`/api/proxy-file?url=${encodeURIComponent(url)}`);
            if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
            return await response.arrayBuffer();
        } catch (e) {
            console.error("Error fetching proxied file:", e);
            return null;
        }
    };

    const generateRecordPDF = async (targetRecord: any) => {
        // Encontrar todos los registros de la misma fecha
        const dailyRecords = hhcRecords.filter(r => r.date === targetRecord.date);
        const finalPdfDoc = await PDFDocument.create();
        const doc = new jsPDF();
        let y = 20;

        setIsPdfExporting(true);
        setPdfProgress(5);
        setPdfExportStatus('Generando reporte diario...');

        // Encabezado de Fecha
        doc.setFillColor(30, 64, 175);
        doc.rect(20, y, 170, 12, 'F');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text(`REPORTE DIARIO DE FORMACIÓN: ${targetRecord.date || 'S/F'}`, 105, y + 8, { align: "center" });
        y += 20;

        // Listar todos los registros de ese día
        for (let idx = 0; idx < dailyRecords.length; idx++) {
            const record = dailyRecords[idx];
            
            doc.setFontSize(11);
            doc.setTextColor(30, 64, 175);
            doc.setFont("helvetica", "bold");
            doc.text(`ACTIVIDAD ${idx + 1}: ${record.tema || 'Sin Tema'}`, 20, y);
            y += 6;

            doc.setFontSize(9);
            doc.setTextColor(60);
            doc.setFont("helvetica", "normal");
            const tipoStr = (record.tipo || 'actividad').toUpperCase().replace('_', ' ');
            const resena = `Tipo: ${tipoStr} | Área: ${record.area?.toUpperCase()} | Resp: ${record.responsable} | Lugar: ${record.lugar || 'N/A'}`;
            doc.text(resena, 20, y);
            y += 5;
            const totalPers = (Number(record.hombres)||0)+(Number(record.mujeres)||0);
            const hhcCalc = (totalPers * (FORMATION_DURATIONS[record.tipo] || 0)).toFixed(1);
            doc.text(`Participantes: ${record.hombres}H / ${record.mujeres}M | Total: ${totalPers} | Cant. HHC: ${hhcCalc}`, 20, y);
            y += 10;

            if (y > 270) { doc.addPage(); y = 20; }
        }

        doc.setDrawColor(200);
        doc.line(20, y, 190, y);
        y += 10;

        // Evidencia Imágenes del Día
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.setFont("helvetica", "bold");
        doc.text("Evidencia Fotográfica:", 20, y);
        y += 10;

        setPdfProgress(30);
        setPdfExportStatus('Cargando evidencias fotográficas...');

        const totalImgs = dailyRecords.reduce((acc, r) => acc + (r.evidenceImgs?.length || 0), 0);
        let imgLoaded = 0;
        for (const record of dailyRecords) {
            if (record.evidenceImgs && record.evidenceImgs.length > 0) {
                for (const imgUrl of record.evidenceImgs) {
                    const driveIdMatch = imgUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                    const fetchUrl = driveIdMatch ? `https://drive.google.com/uc?export=download&id=${driveIdMatch[1]}` : getDriveViewerUrl(imgUrl, true);
                    const buffer = await fetchProxiedFile(fetchUrl);
                    imgLoaded++;
                    if (totalImgs > 0) setPdfProgress(30 + Math.round((imgLoaded / totalImgs) * 30));
                    
                    if (buffer) {
                        try {
                            const base64 = `data:image/jpeg;base64,${bufferToBase64(buffer)}`;
                            if (y > 210) { doc.addPage(); y = 20; }
                            doc.addImage(base64, 'JPEG', 40, y, 130, 75);
                            y += 85;
                        } catch (e) {}
                    }
                }
            }
        }

        setPdfProgress(65);
        setPdfExportStatus('Unificando documentos PDF...');

        // Convertir JS-PDF a PDF-Lib y añadir
        const pagePdfBytes = doc.output('arraybuffer');
        const pagePdfDoc = await PDFDocument.load(pagePdfBytes);
        const copiedPages = await finalPdfDoc.copyPages(pagePdfDoc, pagePdfDoc.getPageIndices());
        copiedPages.forEach(p => finalPdfDoc.addPage(p));

        // Anexar PDFs de evidencia del día
        const evidencePdfs = dailyRecords.filter(r => r.evidencePdf);
        for (let i = 0; i < evidencePdfs.length; i++) {
            const record = evidencePdfs[i];
            setPdfProgress(65 + Math.round(((i + 1) / Math.max(evidencePdfs.length, 1)) * 20));
            setPdfExportStatus(`Adjuntando evidencia PDF ${i + 1} de ${evidencePdfs.length}...`);
            if (record.evidencePdf) {
                const driveIdMatch = record.evidencePdf.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                const fetchUrl = driveIdMatch ? `https://drive.google.com/uc?export=download&id=${driveIdMatch[1]}` : record.evidencePdf;
                const evidenceBuffer = await fetchProxiedFile(fetchUrl);
                if (evidenceBuffer) {
                    try {
                        const evidencePdfDoc = await PDFDocument.load(evidenceBuffer);
                        const evidencePages = await finalPdfDoc.copyPages(evidencePdfDoc, evidencePdfDoc.getPageIndices());
                        evidencePages.forEach(p => finalPdfDoc.addPage(p));
                    } catch (e) { console.error("Error merging daily evidence PDF", e); }
                }
            }
        }

        setPdfProgress(90);
        setPdfExportStatus('Guardando PDF...');

        const mergedPdfBytes = await finalPdfDoc.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_Diario_HHC_${targetRecord.date || 'S_F'}.pdf`;
        link.click();

        setPdfProgress(100);
        setPdfExportStatus('¡Descarga completada!');
        setTimeout(() => {
            setIsPdfExporting(false);
            setPdfProgress(0);
        }, 1800);
    };

    const generateBulkHHCPDF = async () => {
        if (finalFilteredHistory.length === 0) {
            alert("⚠️ No hay registros filtrados para exportar.");
            return;
        }

        const recordsWithPdf = finalFilteredHistory.filter(r => r.evidencePdf);
        
        if (recordsWithPdf.length === 0) {
            alert("⚠️ Ninguno de los registros filtrados tiene un PDF adjunto.");
            return;
        }

        setIsPdfExporting(true);
        setPdfProgress(5);
        setPdfExportStatus(`Preparando ${recordsWithPdf.length} documento(s)...`);

        // Usaremos PDF-Lib como motor principal para el masivo para facilitar uniones constantes
        const finalPdfDoc = await PDFDocument.create();

        // Anexar todos los PDFs de evidencia
        for (let i = 0; i < recordsWithPdf.length; i++) {
            const record = recordsWithPdf[i];
            const progressPct = 5 + Math.round(((i + 1) / recordsWithPdf.length) * 80);
            setPdfProgress(progressPct);
            setPdfExportStatus(`Procesando evidencia ${i + 1} de ${recordsWithPdf.length}...`);

            const driveIdMatch = record.evidencePdf.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
            const fetchUrl = driveIdMatch ? `https://drive.google.com/uc?export=download&id=${driveIdMatch[1]}` : record.evidencePdf;
            const evidenceBuffer = await fetchProxiedFile(fetchUrl);
            if (evidenceBuffer) {
                try {
                    const evidencePdfDoc = await PDFDocument.load(evidenceBuffer);
                    const evidencePages = await finalPdfDoc.copyPages(evidencePdfDoc, evidencePdfDoc.getPageIndices());
                    evidencePages.forEach(p => finalPdfDoc.addPage(p));
                } catch (e) { console.error("Error merging evidence PDF", e); }
            }
        }

        setPdfProgress(90);
        setPdfExportStatus('Guardando PDF final...');

        const filename = (filters.startDate || filters.endDate) 
            ? `Evidencias_HHC_Filtradas_${filters.startDate || ''}_${filters.endDate || ''}.pdf`
            : "Evidencias_HHC_Completas.pdf";

        const mergedPdfBytes = await finalPdfDoc.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        setPdfProgress(100);
        setPdfExportStatus('¡Descarga completada!');
        setTimeout(() => {
            setIsPdfExporting(false);
            setPdfProgress(0);
        }, 1800);
    };




    const filteredRecords = hhcRecords.filter(r => selectedArea === 'todos' || r.area === selectedArea);

    const finalFilteredHistory = useMemo(() => {
        return filteredRecords.filter(r => {
            const matchResp = !filters.responsable || (r.responsable || '').toLowerCase().includes(filters.responsable.toLowerCase());
            const matchLugar = !filters.lugar || (r.lugar || '').toLowerCase().includes(filters.lugar.toLowerCase());
            const matchTema = !filters.tema || (r.tema || '').toLowerCase().includes(filters.tema.toLowerCase());
            const matchDateStart = !filters.startDate || (r.date || '') >= filters.startDate;
            const matchDateEnd = !filters.endDate || (r.date || '') <= filters.endDate;
            const matchType = filters.type === 'todos' || r.tipo === filters.type; // Nota: r.tipo no r.type based on table mapping

            // OCULTAR "ACTIVIDAD IMPORTADA" PARA OPTIMIZAR ESPACIO VISUAL
            const notImported = (r.tema || '') !== 'Actividad Importada';

            return matchResp && matchLugar && matchTema && matchDateStart && matchDateEnd && matchType && notImported;
        });
    }, [filteredRecords, filters]);

    // Helper para obtener el lunes de la semana (Lunes a Domingo)
    const getWeekMonday = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T12:00:00');
        const day = date.getDay(); // 0 (Dom) a 6 (Sab)
        const diff = date.getDate() - (day === 0 ? 6 : day - 1); // Ajustar para que lunes sea el inicio
        const monday = new Date(date.setDate(diff));
        return monday.toISOString().split('T')[0];
    };

    const latestDate = filteredRecords.length > 0
        ? [...filteredRecords].sort((a, b) => b.date.localeCompare(a.date))[0].date
        : null;
    const latestWeekMonday = latestDate ? getWeekMonday(latestDate) : null;

    const latestRecord = filteredRecords.length > 0 ? filteredRecords[filteredRecords.length - 1] : null;

    // Acumulado Semanal (de la última semana calendario registrada para el área)
    const weeklyStats = filteredRecords
        .filter(r => latestWeekMonday && getWeekMonday(r.date) === latestWeekMonday)
        .reduce((acc, curr) => ({ hhc: acc.hhc + curr.hhc, hht: acc.hht + curr.hht }), { hhc: 0, hht: 0 });

    // Acumulado Mensual (del mes seleccionado o el último con datos)
    const targetMonth = currentMonth === -1 && latestRecord ? parseInt((latestRecord.date || '0000-00').substring(5, 7)) - 1 : currentMonth;
    const monthlyStats = filteredRecords
        .filter(r => {
            if (!r.date) return false;
            const rYear = parseInt(r.date.substring(0, 4));
            const rMonth = parseInt(r.date.substring(5, 7)) - 1;
            return rYear === currentYear && (targetMonth === -1 || rMonth === targetMonth);
        })
        .reduce((acc, curr) => ({ hhc: acc.hhc + (Number(curr.hhc) || 0), hht: acc.hht + (Number(curr.hht) || 0) }), { hhc: 0, hht: 0 });

    // Acumulado Anual
    const annualStats = filteredRecords
        .filter(r => r.date && parseInt(r.date.substring(0, 4)) === currentYear)
        .reduce((acc, curr) => ({ hhc: acc.hhc + (Number(curr.hhc) || 0), hht: acc.hht + (Number(curr.hht) || 0) }), { hhc: 0, hht: 0 });

    // --- CÁLCULO DE INDICES SEGÚN NUEVA REGLA ---
    // Indice Diario = (Asistentes / Planilla) * 100
    // Asumimos que r.hht es la "Planilla" ingresada por el usuario

    // 1. Helper para calcular Indice Diario de un registro
    const getRecordIndex = (r: any) => {
        const assistants = (Number(r.hombres) || 0) + (Number(r.mujeres) || 0);
        const planilla = Number(r.hht) || 0;
        return planilla > 0 ? (assistants / planilla) * 100 : 0;
    };

    // 2. Acumulado Semanal: Promedio de indices diarios de la semana
    const weeklyRecords = filteredRecords.filter(r => latestWeekMonday && getWeekMonday(r.date) === latestWeekMonday);
    const sumWeeklyIndices = weeklyRecords.reduce((acc, r) => acc + getRecordIndex(r), 0);
    const weeklyIndex = weeklyRecords.length > 0 ? (sumWeeklyIndices / weeklyRecords.length).toFixed(2) : "0";

    // 3. Acumulado Mensual: Promedio de indices diarios del mes (Actualizado: Suma Asistentes / Suma Planilla del Mes)
    const monthlyRecordsForIndex = hhcRecords.filter(r => {
        if (!r || !r.date) return false;
        try {
            const dateParts = String(r.date).split('-');
            if (dateParts.length < 2) return false;
            const rYear = parseInt(dateParts[0]);
            const rMonth = parseInt(dateParts[1]) - 1;
            return rYear === currentYear && rMonth === hhcMonthFilter;
        } catch (e) { return false; }
    });

    const sumAssistantsMonth = monthlyRecordsForIndex.reduce((acc, r) => acc + (Number(r.hombres) || 0) + (Number(r.mujeres) || 0), 0);
    const sumPlanillaMonth = monthlyRecordsForIndex.reduce((acc, r) => acc + (Number(r.hht) || 0), 0);

    const monthlyIndex = sumPlanillaMonth > 0 ? ((sumAssistantsMonth / sumPlanillaMonth) * 100).toFixed(2) : "0.00";

    // 4. Indice Anual: Sumatoria de porcentajes de los meses / 12
    // Primero calculamos el indice de CADA mes del año con la NUEVA FORMULA
    let sumMonthIndicesNew = 0;
    for (let m = 0; m < 12; m++) {
        const recsInMonth = hhcRecords.filter(r => {
            const d = new Date(r.date);
            return d.getFullYear() === currentYear && d.getMonth() === m;
        });

        if (recsInMonth.length > 0) {
            const sumAssistants = recsInMonth.reduce((acc, r) => acc + (Number(r.hombres) || 0) + (Number(r.mujeres) || 0), 0);
            const sumPlanilla = recsInMonth.reduce((acc, r) => acc + (Number(r.hht) || 0), 0);

            const mIndex = sumPlanilla > 0 ? (sumAssistants / sumPlanilla) * 100 : 0;
            sumMonthIndicesNew += mIndex;
        }
    }
    const hhcAnnualIndexValue = (sumMonthIndicesNew / 12).toFixed(2);

    // Cálculos por Tipo (para el área seleccionada)
    const getStatsByType = () => {
        const types = ['induccion_gen', 'induccion_esp', 'capacitacion', 'difusion', 'entrenamiento', 'charla'];
        return types.map(t => {
            const stats = filteredRecords
                .filter(r => r.tipo === t && r.date && parseInt(r.date.substring(0, 4)) === currentYear && (targetMonth === -1 || parseInt(r.date.substring(5, 7)) - 1 === targetMonth))
                .reduce((acc, curr) => ({ hhc: acc.hhc + (Number(curr.hhc) || 0), hht: acc.hht + (Number(curr.hht) || 0) }), { hhc: 0, hht: 0 });
            return {
                baseType: t,
                label: t.replace('_', ' ').toUpperCase(),
                hhc: stats.hhc,
                hht: stats.hht,
                index: stats.hht > 0 ? ((stats.hhc / stats.hht) * 100).toFixed(2) : "0" // Mantener logica anterior para tipo por ahora, o actualizar si el usuario lo pide
            };
        });
    };

    const handleAddHHCRecord = () => {
        // STRICT VALIDATION
        const effectiveTema = newHHC.isAdditionalTopic ? newHHC.customTopic : newHHC.tema;
        if (!newHHC.date || !newHHC.area || !newHHC.tipo || !effectiveTema || !newHHC.responsable || !newHHC.lugar) {
            alert("⚠️ ALERTA DE REGISTRO\n\nPara guardar, debe completar TODOS los campos:\n\n- Fecha\n- Responsable\n- Área y Tipo\n- Lugar\n- Tema / Actividad");
            return;
        }

        const newRecord = {
            date: newHHC.date,
            hhc: Number(newHHC.hhc),
            hht: Number(newHHC.hht),
            hombres: Number(newHHC.hombres) || 0,
            mujeres: Number(newHHC.mujeres) || 0,
            area: newHHC.area,
            tipo: newHHC.tipo,
            tema: effectiveTema,
            responsable: newHHC.responsable,
            evidenceImgs: newHHC.evidenceImgs || [],
            evidencePdf: newHHC.evidencePdf || '',
            lugar: newHHC.lugar
        };

        // --- AUTOPILOT: ACTUALIZAR PROGRAMA ANUAL (OBJ 2) Y GRÁFICAS ---
        // 1. Cargamos el programa actual
        let currentProgram = JSON.parse(localStorage.getItem('annual_program_data') || '{}');
        let obj2Activities = currentProgram['obj2'] || [];

        // 2. Buscamos si existe una actividad programada coincidente (Mismo Mes y Tema similar)
        let foundIndex = -1;
        const recordMonth = new Date(newRecord.date).getMonth();

        // Buscamos coincidencia aproximada por tema o fecha exacta
        foundIndex = obj2Activities.findIndex((act: any) => {
            const actDate = new Date(act.date);
            // Coincide mes Y (Coincide tema O es misma fecha exacta)
            return actDate.getMonth() === recordMonth && (
                act.description.toLowerCase().includes(newRecord.tema.toLowerCase()) ||
                act.date === newRecord.date
            );
        });

        // 3. Si encontramos la actividad programada, la actualizamos
        if (foundIndex !== -1) {
            obj2Activities[foundIndex] = {
                ...obj2Activities[foundIndex],
                status: 'Realizado',
                compliance: 100,
                executedDate: newRecord.date
            };
        } else {
            // OPCIONAL: Si no existe, ¿La agregamos como no programada? 
            // Por ahora solo validamos el cumplimiento de lo programado.
            // O podemos agregarla al historial como cumplimiento extra.
        }

        // 4. Guardamos la actualización
        currentProgram['obj2'] = obj2Activities;
        localStorage.setItem('annual_program_data', JSON.stringify(currentProgram));
        setProgramData(currentProgram);

        // SYNC ANNUAL PROGRAM (OBJ2) TO CLOUD
        fetch('/api/annual-program', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ programData: { 'obj2': obj2Activities } })
        }).catch(e => console.warn("Failed to sync Annual Program update:", e));

        // --- SINCRONIZACIÓN CON DASHBOARD GENERAL (dashboard_data_v1) ---
        try {
            const dashboardData = JSON.parse(localStorage.getItem('dashboard_data_v1') || 'null');
            if (dashboardData && dashboardData.sections) {
                let updated = false;

                // Barrer todas las secciones relevantes (training, scsst, health, etc.)
                dashboardData.sections.forEach((section: any) => {
                    if (section.activities) {
                        section.activities.forEach((act: any) => {
                            // Coincidencia laxa: Si el nombre de la actividad contiene el tema registrado
                            // O si es especificamente una induccion/capacitacion general
                            const isMatch = act.name.toLowerCase().includes(newRecord.tema.toLowerCase()) ||
                                (newRecord.tipo.includes('induccion') && act.name.toLowerCase().includes('inducción'));

                            if (isMatch) {
                                // Actualizar el mes correspondiente
                                const monthIdx = new Date(newRecord.date).getMonth();
                                if (act.data && act.data.executed) {
                                    // Asumimos cumplimiento al 100% si se registra
                                    // O sumamos? Para simplificar, si hay registro, marcamos cumplimiento.
                                    // Pero idealmente debería ser aditivo si es contador, o 100% si es hito.
                                    // Dado que el dashboard general suele usar porcentajes de cumplimiento o conteos:

                                    // Estrategia: Si el plan es > 0, ponemos executed = plan (cumplimiento total)
                                    // Si plan es 0, simplemente incrementamos executed (actividad no programada pero realizada)
                                    const planVal = act.data.plan[monthIdx] || 0;
                                    const currentExec = act.data.executed[monthIdx] || 0;

                                    if (planVal > 0) {
                                        act.data.executed[monthIdx] = planVal; // Cumplió la meta
                                    } else {
                                        act.data.executed[monthIdx] = currentExec + 1; // Registro adicional
                                    }
                                    updated = true;
                                }
                            }
                        });
                    }
                });

                if (updated) {
                    localStorage.setItem('dashboard_data_v1', JSON.stringify(dashboardData));
                    // Disparar evento para que DashboardClient se entere si está montado
                    window.dispatchEvent(new Event('storage'));
                }
            }
        } catch (e) {
            console.error("Error sincronizando con dashboard general", e);
        }
        // --- FIN SINCRONIZACIÓN ---

        // --- FIN AUTOPILOT ---

        // --- CRUD ACTIONS ---
        const performSave = async () => {
            setIsSyncing(true);
            try {
                if (editingIndex !== null) {
                    // UDPATE
                    const recordToUpdate = hhcRecords[editingIndex];
                    if (!recordToUpdate.id) {
                        alert("⚠️ Error: No se puede editar un registro sin ID sincronizado.");
                        return;
                    }

                    const res = await fetch('/api/hhc-records', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'update', id: recordToUpdate.id, data: newRecord })
                    });

                    if (res.ok) {
                        setHhcRecords(prev => {
                            const updated = [...prev];
                            updated[editingIndex] = { ...newRecord, id: recordToUpdate.id }; // Mantener ID
                            return updated;
                        });
                        setEditingIndex(null);
                        alert("✅ Registro actualizado correctamente.");
                    } else {
                        throw new Error("Error al actualizar en servidor");
                    }

                } else {
                    // CREATE
                    const res = await fetch('/api/hhc-records', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'create', data: newRecord })
                    });

                    const json = await res.json();

                    if (res.ok && json.success) {
                        // Usar el ID retornado por el servidor
                        const createdRecord = { ...newRecord, id: json.id };
                        setHhcRecords(prev => [createdRecord, ...prev]); // Agregar al principio o final? Mejor principio para ver reciente
                        alert("✅ Registro guardado correctamente.");
                    } else {
                        // Incluir el error detallado del servidor
                        const serverError = json.error || `HTTP ${res.status}`;
                        throw new Error(`Error del servidor: ${serverError}`);
                    }
                }

                // Limpiar formulario solo si todo salió bien
                setNewHHC({ responsable: '', date: '', hhc: '', hht: '', hombres: '', mujeres: '', area: 'seguridad' as any, tipo: 'capacitacion' as any, tema: '', evidenceImgs: [], evidencePdf: '', lugar: '' });

            } catch (error: any) {
                console.error('Error guardando registro HHC:', error);
                const errorMsg = error?.message || 'Error desconocido';
                alert(`❌ Error de conexión al guardar.\n\nDetalles: ${errorMsg}\n\n💡 Sugerencias:\n- Verifique su conexión a internet\n- Espere unos segundos e intente nuevamente\n- Si el problema persiste, contacte al administrador`);
            } finally {
                setIsSyncing(false);
            }
        };

        performSave();
    };








    // Helper to upload images/PDFs and get URLs
    const handleFileUpload = async (file: File, type: 'IMAGE' | 'PDF'): Promise<string> => {
        // Validar que el contexto esté completo para el renombrado
        if (!newHHC.area || !newHHC.tipo || !newHHC.tema || !newHHC.responsable || !newHHC.lugar || !newHHC.date) {
            alert("⚠️ ALERTA DE CARGA\n\nAntes de subir evidencia (Imagen o PDF), debe llenar la información previa para clasificar el archivo correctamente:\n\n- Fecha\n- Responsable\n- Área y Tipo\n- Lugar\n- Tema");
            return '';
        }

        try {
            const { uploadEvidence } = await import('@/lib/uploadClient');

            // Usar la utilidad de carga que incluye compresión para imágenes
            const url = await uploadEvidence(
                file,
                'Actividad',
                newHHC.tema || 'Actividad_Pisco',
                newHHC.date || new Date().toISOString().split('T')[0],
                newHHC.responsable || user?.name || 'Supervisor',
                newHHC.tipo, // Pasamos el tipo
                newHHC.area, // Pasamos el área (seguridad, salud, etc.)
                newHHC.lugar // Pasamos el lugar
            );

            if (url) {
                alert("✅ Al momento de cargar se cargó con éxito su archivo o imagen para saber que se registró");
            }

            return url;
        } catch (e: any) {
            console.error("Error en carga de archivo:", e);
            alert(`❌ Error subiendo archivo: ${e.message}`);
            return '';
        }
    };

    const processHhcImages = async (files: File[] | FileList) => {
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        if (fileArray.length + newHHC.evidenceImgs.length > 4) {
            alert("⚠️ Máximo 4 imágenes permitidas por registro.");
            return;
        }

        setIsUploading(true);
        try {
            for (const file of fileArray) {
                if (!file.type.match('image/.*')) continue;
                const url = await handleFileUpload(file, 'IMAGE');
                if (url) {
                    setNewHHC(prev => ({
                        ...prev,
                        evidenceImgs: [...prev.evidenceImgs, url]
                    }));
                }
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) await processHhcImages(files);
        e.target.value = ''; // Reset input
    };

    const processHhcPdf = async (file: File) => {
        if (!file) return;
        if (file.type !== 'application/pdf') {
            alert("⚠️ Solo se permiten archivos PDF.");
            return;
        }

        setIsUploading(true);
        try {
            const url = await handleFileUpload(file, 'PDF');
            if (url) {
                setNewHHC(prev => ({ ...prev, evidencePdf: url }));
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) await processHhcPdf(file);
        e.target.value = ''; // Reset input
    };

    // --- HHC DRAG AND DROP HANDLERS ---
    const handleHhcDragOver = (e: React.DragEvent, type: 'pdf' | 'imgs') => {
        e.preventDefault();
        e.stopPropagation();
        if (type === 'pdf') setIsDraggingHhcPdf(true);
        else setIsDraggingHhcImgs(true);
    };

    const handleHhcDragLeave = (e: React.DragEvent, type: 'pdf' | 'imgs') => {
        e.preventDefault();
        e.stopPropagation();
        if (type === 'pdf') setIsDraggingHhcPdf(false);
        else setIsDraggingHhcImgs(false);
    };

    const handleHhcDrop = async (e: React.DragEvent, type: 'pdf' | 'imgs') => {
        e.preventDefault();
        e.stopPropagation();
        if (type === 'pdf') setIsDraggingHhcPdf(false);
        else setIsDraggingHhcImgs(false);

        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;

        if (type === 'pdf') {
            const pdfFile = Array.from(files).find(f => f.type === 'application/pdf');
            if (pdfFile) await processHhcPdf(pdfFile);
            else alert("⚠️ Por favor suelta un archivo PDF válido.");
        } else {
            const imgFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
            if (imgFiles.length > 0) await processHhcImages(imgFiles);
            else alert("⚠️ Por favor suelta archivos de imagen válidos.");
        }
    };

    const handleDeleteHHC = async (globalIndex: number) => {
        if (globalIndex === -1) return;

        const record = hhcRecords[globalIndex];
        // const isOwner = record.responsable === user?.name;

        // if (!isDeveloper && !isOwner) {
        //     alert("⛔ No tienes permiso para eliminar registros de otros usuarios.");
        //     return;
        // }

        if (!window.confirm("¿Estás seguro de eliminar este registro?")) return;

        if (!record.id) {
            // Si es local y no tiene ID, solo borrar del estado
            setHhcRecords(prev => prev.filter((_, i) => i !== globalIndex));
            return;
        }

        try {
            const res = await fetch('/api/hhc-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id: record.id })
            });

            if (res.ok) {
                setHhcRecords(prev => prev.filter((_, i) => i !== globalIndex));
                if (editingIndex === globalIndex) setEditingIndex(null);
                alert("🗑️ Registro eliminado.");
            } else {
                alert("❌ Error al eliminar en servidor.");
            }
        } catch (e) {
            console.error(e);
            alert("❌ Error de conexión.");
        }
    };

    const handleEditHHC = (index: number) => {
        const record = hhcRecords[index];
        const isOwner = record.responsable === user?.name;

        if (!isDeveloper && !isOwner) {
            alert("⛔ No tienes permiso para editar registros de otros usuarios.");
            return;
        }

        setEditingIndex(index);
        setNewHHC({
            date: record.date,
            hhc: String(record.hhc),
            hht: String(record.hht),
            hombres: String(record.hombres),
            mujeres: String(record.mujeres),
            area: record.area,
            tipo: record.tipo,
            tema: record.tema,
            evidenceImgs: record.evidenceImgs || (record.evidence ? [record.evidence] : []) || [],
            evidencePdf: record.evidencePdf || '',
            responsable: record.responsable || '',
            lugar: record.lugar || ''
        });
    };

    // Agrupación de datos HHC por MES para el Gráfico
    const getMonthlyHHCData = () => {
        const monthlyApi: Record<string, { hhc: number, hht: number, date: string }> = {};

        hhcRecords.forEach(rec => {
            if (!rec || !rec.date) return;
            const monthKey = String(rec.date).substring(0, 7); // "2025-01"
            if (!monthlyApi[monthKey]) {
                monthlyApi[monthKey] = { hhc: 0, hht: 0, date: monthKey };
            }
            monthlyApi[monthKey].hhc += (Number(rec.hhc) || 0);
            monthlyApi[monthKey].hht += (Number(rec.hht) || 0);
        });

        // Convertir a array y calcular índice
        return Object.values(monthlyApi)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(m => ({
                ...m,
                index: m.hht > 0 ? ((m.hhc / m.hht) * 100).toFixed(2) : 0
            }));
    };


    const handleDateChange = (selectedDate: string) => {
        const programMatch = trainingProgram.find(p => p.date === selectedDate);

        // Si es inducción, respetamos la selección manual y NO sobrescribimos con el programa
        if (newHHC.tipo.includes('induccion')) {
            setNewHHC(prev => ({ ...prev, date: selectedDate }));
            return;
        }

        if (programMatch) {
            setNewHHC(prev => ({
                ...prev,
                date: selectedDate,
                tema: programMatch.tema,
                area: programMatch.area,
                tipo: programMatch.tipo
            }));
        } else {
            setNewHHC(prev => ({ ...prev, date: selectedDate }));
        }
    };

    const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                if (!event.target?.result) throw new Error("No se pudo leer el archivo.");

                const data = new Uint8Array(event.target.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                if (!workbook.SheetNames.length) throw new Error("El archivo no tiene hojas.");
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

                if (!jsonData || jsonData.length === 0) throw new Error("La hoja está vacía.");

                const importedProgram: any[] = [];

                // --- HELPER: Parseo de Fechas ---
                const parseDate = (val: any) => {
                    if (!val) return null;
                    try {
                        // Excel serial number
                        if (typeof val === 'number') {
                            let dateVal = val;
                            // En caso de que se haya leído de forma incorrecta como string/number mixto
                            const date = XLSX.SSF.parse_date_code(dateVal);
                            if (date) return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
                        }
                        // String dates
                        if (typeof val === 'string') {
                            const txt = val.trim();
                            // DD/MM/YYYY or DD-MM-YYYY
                            if (txt.includes('/') || txt.includes('-')) {
                                const separator = txt.includes('/') ? '/' : '-';
                                const parts = txt.split(separator).slice(0, 3);
                                if (parts.length === 3) {
                                    // YYYY-MM-DD
                                    if (parts[0].length === 4) {
                                        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].substring(0, 2).padStart(2, '0')}`;
                                    }
                                    // DD/MM/YYYY
                                    let year = parts[2];
                                    if (year.length > 4) year = year.substring(0, 4); // Strip time if exists
                                    return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                                }
                            }
                        }
                    } catch (e) { return null; }
                    return null;
                };

                const mapArea = (val: any): 'seguridad' | 'salud' | 'ambiente' => {
                    const s = String(val || '').toLowerCase();
                    if (s.includes('salud')) return 'salud';
                    if (s.includes('ambiente') || s.includes('ambi')) return 'ambiente';
                    return 'seguridad';
                };

                const mapType = (val: any): any => {
                    const s = String(val || '').toLowerCase();
                    if (s.includes('charla')) return 'charla';
                    if (s.includes('difusion') || s.includes('difusión')) return 'difusion';
                    if (s.includes('entra') || s.includes('entrenamiento')) return 'entrenamiento';
                    if (s.includes('induc')) return s.includes('espec') ? 'induccion_esp' : 'induccion_gen';
                    return 'capacitacion';
                };

                // --- ESTRATEGIA: LISTA VERTICAL ---
                // Buscamos la fila de encabezados
                let headerIndex = -1;
                let colMap = { date: -1, theme: -1, type: -1, area: -1 };

                // Buscar encabezados en las primeras 20 filas
                for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
                    const row = jsonData[i].map(c => String(c || '').toLowerCase().trim());

                    if (row.some(c => c.includes('fecha')) && row.some(c => c.includes('tema'))) {
                        headerIndex = i;
                        colMap.date = row.findIndex(c => c.includes('fecha'));
                        colMap.theme = row.findIndex(c => c.includes('tema'));
                        colMap.type = row.findIndex(c => c.includes('tipo'));
                        colMap.area = row.findIndex(c => c.includes('area') || c.includes('área'));
                        break;
                    }
                }

                if (headerIndex !== -1) {
                    // Iterar desde la fila siguiente a los encabezados
                    for (let i = headerIndex + 1; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        if (!Array.isArray(row) || row.length === 0) continue;

                        const valTema = row[colMap.theme];
                        // Ignorar filas vacías, "No programado" o "Sin actividad"
                        if (!valTema || String(valTema).toLowerCase().includes('no programado') || String(valTema).toLowerCase().includes('sin actividad') || String(valTema).trim() === '-') continue;

                        const valDate = row[colMap.date];
                        const dateStr = parseDate(valDate);

                        if (dateStr) {
                            importedProgram.push({
                                date: dateStr,
                                tema: String(valTema).trim(),
                                area: colMap.area !== -1 ? mapArea(row[colMap.area]) : 'seguridad',
                                tipo: colMap.type !== -1 ? mapType(row[colMap.type]) : 'capacitacion'
                            });
                        }
                    }

                    if (importedProgram.length > 0) {
                        // CLOUD SYNC: BULK CREATE
                        const performImport = async () => {
                            try {
                                const res = await fetch('/api/training-program', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'bulk-create', data: importedProgram })
                                });

                                if (res.ok) {
                                    // Reload to ensure sync
                                    const verify = await fetch('/api/training-program');
                                    const vData = await verify.json();
                                    if (vData.success) {
                                        setTrainingProgram(vData.records);
                                    } else {
                                        // Fallback
                                        setTrainingProgram(prev => [...prev, ...importedProgram]);
                                    }
                                    alert(`✅ IMPORTACIÓN EXITOSA\n\nSe cargaron ${importedProgram.length} actividades y se sincronizaron con la nube.`);
                                } else {
                                    throw new Error("Cloud error");
                                }
                            } catch (e) {
                                console.error(e);
                                alert("⚠️ Importación local exitosa, pero falló la sincronización en la nube.");
                                setTrainingProgram(prev => [...prev, ...importedProgram]);
                            }
                        };
                        performImport();
                    } else {
                        alert('⚠️ NO SE IMPORTARON DATOS\n\nSe encontró la estructura pero ninguna fila contenía datos válidos (quizás todos eran "No programado" o fechas inválidas).');
                    }

                } else {
                    alert('⚠️ ESTRUCTURA NO RECONOCIDA\n\nNo se encontró la fila de encabezados.\n\nAsegúrese de que la primera fila de la tabla contenga:\n"Fecha", "Tema", "Tipo", "Área"');
                }

            } catch (error: any) {
                console.error(error);
                alert(`❌ ERROR DE LECTURA: ${error.message}`);
            }

        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    const handleDeleteProgramMonth = async () => {
        if (!window.confirm(`⚠️ PELIGRO: ¿Estás seguro de ELIMINAR TODAS las actividades programadas para ${MONTHS[programMonthFilter]} del ${currentYear}?\n\nEsta acción no se puede deshacer.`)) return;

        try {
            const res = await fetch('/api/training-program', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'delete-month',
                    data: { month: programMonthFilter, year: currentYear }
                })
            });

            if (res.ok) {
                // Update local state by removing items of that month
                setTrainingProgram(prev => prev.filter(p => {
                    const d = new Date(p.date + 'T12:00:00'); // Safe parse
                    return !(d.getMonth() === programMonthFilter && d.getFullYear() === currentYear);
                }));
                alert(`✅ Se eliminaron las actividades de ${MONTHS[programMonthFilter]}.`);
            } else {
                throw new Error("Server error");
            }
        } catch (e) {
            console.error(e);
            alert("❌ Error al eliminar en la nube.");
        }
    };



    const removeImage = (index: number) => {
        setNewHHC(prev => ({
            ...prev,
            evidenceImgs: prev.evidenceImgs.filter((_, i) => i !== index)
        }));
    };

    const updateStat = (key: string, value: string) => {
        setNewHHC(prev => {
            const updated = { ...prev, [key]: value };

            // AUTOPILOT: Tema automático para inducciones
            if (key === 'tipo') {
                if (value === 'induccion_gen') updated.tema = 'Inducción Hombre Nuevo';
                else if (value === 'induccion_esp') updated.tema = 'Inducción Específica';
            }

            // Recalcular H. Capacitadas automáticamente
            if (['tipo', 'hombres', 'mujeres'].includes(key)) {
                const totalPersonnel = (Number(updated.hombres) || 0) + (Number(updated.mujeres) || 0);
                const duration = FORMATION_DURATIONS[updated.tipo as string] || 0;
                updated.hhc = String(totalPersonnel * duration);
            }

            return updated;
        });
    };

    // Data por Objetivo
    // Data por Objetivo (Asegurando visualizar TODOS, incluso con 0 data)
    // Data por Objetivo (CONECTADO AL PROGRAMA ANUAL)
    const objectivesData = OBJECTIVES_LIST.map(obj => {
        const stats = getObjectiveMonthlyStats(obj.id);
        let totalPlan = 0;
        let totalExec = 0;

        if (currentMonth === -1) {
            if (annualTotals[obj.id]) {
                totalPlan = annualTotals[obj.id].p;
                totalExec = annualTotals[obj.id].e;
            } else {
                totalPlan = stats.reduce((acc, curr) => acc + curr.P, 0);
                totalExec = stats.reduce((acc, curr) => acc + curr.E, 0);
            }
        } else {
            if (stats[currentMonth]) {
                totalPlan = stats[currentMonth].P;
                totalExec = stats[currentMonth].E;
            }
        }

        let percent = 0;
        if (totalPlan > 0) {
            percent = Math.round((totalExec / totalPlan) * 100);
        } else if (totalExec > 0) {
            percent = 100;
        }

        let fill = '#10b981'; 
        const labelLower = obj.label.toLowerCase();
        if (labelLower.includes('salud') || labelLower.includes('emo')) fill = '#ec4899';
        else if (labelLower.includes('ambiente') || labelLower.includes('rrss') || labelLower.includes('residuos')) fill = '#3b82f6';
        if (obj.id === 'obj10' || obj.id === 'obj11') fill = '#3b82f6';

        const NAME_MAPPING: Record<string, string> = {
            'obj1': 'OBJ 01', 'obj-1': 'OBJ 01',
            'obj2': 'OBJ 02', 'obj-2': 'OBJ 02',
            'obj3': 'OBJ 03', 'obj-3': 'OBJ 03',
            'obj4': 'OBJ 04', 'obj-4': 'OBJ 04',
            'obj5': 'OBJ 05', 'obj-5': 'OBJ 05',
            'obj6': 'SEG 01', 'obj-6': 'SEG 01',
            'obj7': 'SEG 02', 'obj-7': 'SEG 02',
            'obj8': 'SEG 03', 'obj-8': 'SEG 03',
            'obj9': 'SEG 04', 'obj-9': 'SEG 04',
            'obj10': 'SEG 05', 'obj-10': 'SEG 05',
            'obj11': 'SEG 06', 'obj-11': 'SEG 06',
        };

        const configId = obj.id.includes('-') ? obj.id : `obj-${obj.id.replace('obj', '')}`;
        return {
            id: obj.id,
            name: NAME_MAPPING[obj.id] || obj.id,
            fullName: obj.label,
            percent: percent > 100 ? 100 : percent,
            fill: fill,
            plan: totalPlan,
            exec: totalExec,
            area: OBJECTIVES_CONFIG.find(c => c.id === configId)?.area || 'safety'
        };
    });

    const mgmtData = objectivesData.filter(obj => 
        ['obj1', 'obj2', 'obj3', 'obj4', 'obj5', 'obj-1', 'obj-2', 'obj-3', 'obj-4', 'obj-5'].includes(obj.id) &&
        (activeManagement === 'todos' || obj.area === activeManagement)
    );
    const followupData = objectivesData.filter(obj => 
        !['obj1', 'obj2', 'obj3', 'obj4', 'obj5', 'obj-1', 'obj-2', 'obj-3', 'obj-4', 'obj-5'].includes(obj.id) &&
        (activeManagement === 'todos' || obj.area === activeManagement)
    );

    // Custom Bar Shape for 3D Effect
    const CustomBar = (props: any) => {
        const { fill, x, y, width, height } = props;
        return (
            <g>
                <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} ry={4} style={{ filter: 'drop-shadow(4px 4px 6px rgba(0,0,0,0.3))' }} />
                <rect x={x} y={y} width={width} height={height} fill="url(#gloss)" opacity={0.3} rx={4} ry={4} />
            </g>
        );
    };

    // Calculate monthly data by management area
    const calculateMonthlyData = () => {
        const monthsToProcess = currentMonth === -1 ? MONTHS : [MONTHS[currentMonth]];

        const monthlyData = monthsToProcess.map((month, mIdx) => {
            const actualIdx = currentMonth === -1 ? mIdx : currentMonth;
            const safety = { plan: 0, exec: 0 };
            const health = { plan: 0, exec: 0 };
            const environment = { plan: 0, exec: 0 };

            activities.forEach(activity => {
                const area = activity.managementArea || 'safety';
                const plan = activity.data.plan[actualIdx] || 0;
                const exec = activity.data.executed[actualIdx] || 0;

                if (area === 'safety') {
                    safety.plan += plan;
                    safety.exec += exec;
                } else if (area === 'health') {
                    health.plan += plan;
                    health.exec += exec;
                } else if (area === 'environment') {
                    environment.plan += plan;
                    environment.exec += exec;
                }
            });

            return {
                month,
                seguridad: safety.plan > 0 ? Math.round((safety.exec / safety.plan) * 100) : 0,
                salud: health.plan > 0 ? Math.round((health.exec / health.plan) * 100) : 0,
                ambiente: environment.plan > 0 ? Math.round((environment.exec / environment.plan) * 100) : 0,
            };
        });

        return monthlyData;
    };

    // Helper: filter records by month or all year
    const matchesMonth = (dateStr: string) => {
        const m = getMonthFromDateStr(dateStr);
        return currentMonth === -1 ? m >= 0 : m === currentMonth;
    };

    // Count ProgramData items for given objIds filtered by month
    const countProgramItems = (objIds: string[]) =>
        objIds.reduce((sum, id) =>
            sum + (programData[id] || []).filter((item: any) => matchesMonth(item.date)).length
        , 0);

    // Count real records filtered by month (with optional predicate)
    const countRecords = (records: any[], pred?: (r: any) => boolean) =>
        records.filter(r => matchesMonth(r.date) && hasEvidence(r) && (!pred || pred(r))).length;

    // Calculate overall achievement by area using programData + real records
    // ─── SEGURIDAD: OBJ01+OBJ02+OBJ03+OBJ04 + SEG05(obj10)+SEG06(obj11) + RISSTMA + Desvío
    // ─── SALUD:     OBJ05(obj5) + SEG01(obj6) + SEG02(obj7)
    // ─── AMBIENTE:  SEG03(obj8) + SEG04(obj9)
    const calculateOverallAchievement = () => {
        // Read the exact totals from the Annual Program so that the gauges match exactly the Resumen por Área
        let programTotals: Record<string, { p: number, e: number }> = {};
        try {
            if (typeof window !== 'undefined') {
                const stored = localStorage.getItem('annual_program_totals');
                if (stored) {
                    programTotals = JSON.parse(stored);
                }
            }
        } catch (e) {
            console.warn("Could not read annual_program_totals", e);
        }

        const sumTotals = (ids: string[]) => {
            return ids.reduce((acc, id) => {
                const t = programTotals[id] || { p: 0, e: 0 };
                return { p: acc.p + t.p, e: acc.e + t.e };
            }, { p: 0, e: 0 });
        };

        const safety = sumTotals(['obj1', 'obj2', 'obj3', 'obj4', 'obj10', 'obj11']);
        const health = sumTotals(['obj5', 'obj6', 'obj7']);
        const env = sumTotals(['obj8', 'obj9']);

        return [
            {
                name: 'Seguridad',
                value: safety.p > 0 ? Math.min(100, Math.round((safety.e / safety.p) * 100)) : (safety.e > 0 ? 100 : 0),
                color: '#10b981',
                plan: safety.p,
                exec: safety.e
            },
            {
                name: 'Salud',
                value: health.p > 0 ? Math.min(100, Math.round((health.e / health.p) * 100)) : (health.e > 0 ? 100 : 0),
                color: '#ec4899',
                plan: health.p,
                exec: health.e
            },
            {
                name: 'Medio Ambiente',
                value: env.p > 0 ? Math.min(100, Math.round((env.e / env.p) * 100)) : (env.e > 0 ? 100 : 0),
                color: '#3b82f6',
                plan: env.p,
                exec: env.e
            }
        ];
    };

    // --- RENDERING HELPERS ---
    const renderObjectiveList = (data: any[]) => {
        return (
            <div className="flex gap-4 overflow-x-auto pb-6 px-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent snap-x snap-mandatory">
                {data.map((obj, idx) => {
                    const donutData = [
                        { name: 'Cumplimiento', value: obj.percent, fill: obj.fill },
                        { name: 'Pendiente', value: 100 - obj.percent, fill: '#f1f5f9' }
                    ];
                    let Icon = Target;
                    if (obj.fill === '#10b981') Icon = ShieldCheck;
                    if (obj.fill === '#ec4899') Icon = ActivityIcon;
                    if (obj.fill === '#3b82f6') Icon = Leaf;

                    return (
                        <div key={idx} className="min-w-[200px] w-[200px] bg-white rounded-[2rem] p-5 shadow-lg border border-slate-100 flex flex-col items-center relative overflow-hidden h-[240px] flex-shrink-0 snap-center">
                            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100">
                                <div className="h-full transition-all duration-1000" style={{ width: `${obj.percent}%`, backgroundColor: obj.fill }}></div>
                            </div>
                            <div className="text-center mb-1 z-10 w-full px-1">
                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider flex items-center justify-center gap-1 truncate">
                                    <Icon size={12} style={{ color: obj.fill }} />
                                    {obj.name}
                                </h4>
                                <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 truncate max-w-full" title={obj.fullName}>{obj.fullName}</p>
                            </div>
                            <div className="flex-1 w-full relative flex items-center justify-center">
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <span className="text-2xl font-black text-slate-800 tracking-tighter leading-none">{obj.percent}%</span>
                                        <div className="flex items-center justify-center gap-1.5 mt-0.5">
                                            <span className="text-[9px] font-bold text-slate-400">P: {obj.plan}</span>
                                            <span className="text-[9px] font-bold text-emerald-600">E: {obj.exec}</span>
                                        </div>
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={donutData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={60}
                                            startAngle={90}
                                            endAngle={-270}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {donutData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (!activities || activities.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px] p-6">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl text-center shadow-2xl">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Cargando datos del sistema...</p>
                </div>
            </div>
        );
    }



    const monthlyData = calculateMonthlyData();

    // Calculate Overall Achievement for General Dashboard (used below)
    const overallAchievement = calculateOverallAchievement().filter(area => {
        if (activeManagement === 'todos') return true;
        if (activeManagement === 'safety' && area.name === 'Seguridad') return true;
        if (activeManagement === 'health' && area.name === 'Salud') return true;
        if (activeManagement === 'environment' && area.name === 'Medio Ambiente') return true;
        return false;
    });

    // --- INSPECTION GAUGE CALC (DYNAMIC BY AREA) ---
    const getInspStatsForArea = (area: string) => {
        if (area === 'health') return getObjectiveMonthlyStats('obj6');
        if (area === 'environment') return getObjectiveMonthlyStats('obj8');
        if (area === 'safety') return getObjectiveMonthlyStats('obj3');
        
        // 'todos' -> combine obj3, obj6, obj8
        const s3 = getObjectiveMonthlyStats('obj3');
        const s6 = getObjectiveMonthlyStats('obj6');
        const s8 = getObjectiveMonthlyStats('obj8');
        
        return s3.map((m, i) => ({
            P: m.P + s6[i].P + s8[i].P,
            E: m.E + s6[i].E + s8[i].E
        }));
    };

    const totalGlobalP = overallAchievement.reduce((acc, curr) => acc + curr.plan, 0);
    const totalGlobalE = overallAchievement.reduce((acc, curr) => acc + curr.exec, 0);
    const globalIndex = totalGlobalP > 0 ? Math.round((totalGlobalE / totalGlobalP) * 100) : 0;

    // --- ACCIDENTABILITY STATS LOGIC ---

    return (
        <div className="space-y-8 p-2 md:p-6" >

            {/* PDF EXPORT PROGRESS TOAST */}
            {isPdfExporting && (
                <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className={`relative bg-slate-900/95 backdrop-blur-xl border rounded-2xl shadow-2xl p-5 min-w-[320px] max-w-[380px] overflow-hidden ${pdfProgress === 100 ? 'border-emerald-500/60' : 'border-red-500/40'}`}>
                        {/* Glow background */}
                        <div className={`absolute inset-0 rounded-2xl opacity-10 ${pdfProgress === 100 ? 'bg-emerald-500' : 'bg-red-600'}`} />

                        {/* Header */}
                        <div className="relative flex items-center gap-3 mb-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${pdfProgress === 100 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                {pdfProgress === 100 ? (
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-red-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                    </svg>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-[11px] font-black uppercase tracking-widest ${pdfProgress === 100 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {pdfProgress === 100 ? 'PDF Exportado' : 'Exportando PDF'}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{pdfExportStatus}</p>
                            </div>
                            <span className={`text-xs font-black tabular-nums ${pdfProgress === 100 ? 'text-emerald-400' : 'text-white'}`}>{pdfProgress}%</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="relative w-full h-2 bg-slate-700/80 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ease-out ${
                                    pdfProgress === 100
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                        : 'bg-gradient-to-r from-red-600 via-orange-500 to-red-500'
                                }`}
                                style={{ width: `${pdfProgress}%` }}
                            />
                            {pdfProgress < 100 && (
                                <div
                                    className="absolute inset-0 rounded-full opacity-60"
                                    style={{
                                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                                        backgroundSize: '200% 100%',
                                        animation: 'shimmer 1.5s linear infinite',
                                        width: `${pdfProgress}%`
                                    }}
                                />
                            )}
                        </div>

                        {/* Step dots */}
                        <div className="relative flex items-center justify-between mt-2 px-0.5">
                            {[20, 40, 60, 80, 100].map(step => (
                                <div
                                    key={step}
                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                                        pdfProgress >= step
                                            ? (pdfProgress === 100 ? 'bg-emerald-400 scale-125' : 'bg-red-400')
                                            : 'bg-slate-600'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {mode === 'general' && (
                <div className="flex flex-col gap-6 animate-in fade-in zoom-in duration-500">
                    {/* 1. TOP ROW: GAUGES + OVERALL SUMMARY */}
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                        {/* KPI VELOCÍMETRO - PROGRAMA ANUAL (ENLARGED) */}
                        <div className="xl:col-span-2 h-full min-h-[300px] bg-slate-900/40 backdrop-blur-md rounded-[2rem] border border-slate-700/50 p-6 shadow-2xl">
                            <ComplianceGauge
                                value={globalIndex}
                                title="AVANCE GLOBAL DEL PROGRAMA ANUAL"
                                height={240}
                            />
                        </div>

                        {/* OVERALL CARDS - Centered & Premium Design */}
                        <div className="xl:col-span-2 h-full">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                                {overallAchievement.map((area, idx) => (
                                    <div key={idx} className="bg-slate-900 border border-slate-800 rounded-[2rem] p-4 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center group hover:border-slate-600 hover:scale-[1.02] transition-all duration-300">
                                        {/* Background Glow */}
                                        <div className="absolute top-0 w-full h-full bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full opacity-20 transition-all group-hover:opacity-40" style={{ backgroundColor: area.color }}></div>

                                        <div className="relative z-10 flex flex-col items-center gap-3 w-full">
                                            {/* Icon with Glow Ring */}
                                            <div className="relative">
                                                <div className="absolute inset-0 blur-lg opacity-40 animate-pulse" style={{ backgroundColor: area.color }}></div>
                                                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl relative z-10">
                                                    {idx === 0 && <ShieldCheck size={24} style={{ color: area.color }} />}
                                                    {idx === 1 && <ActivityIcon size={24} style={{ color: area.color }} />}
                                                    {idx === 2 && <Leaf size={24} style={{ color: area.color }} />}
                                                </div>
                                            </div>

                                            {/* Text Content */}
                                            <div className="text-center space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{area.name}</p>
                                                <div className="flex items-baseline justify-center gap-0.5">
                                                    <span className="text-4xl font-black text-white tracking-tighter" style={{ textShadow: `0 0 20px ${area.color}40` }}>
                                                        {area.value}
                                                    </span>
                                                    <span className="text-sm font-bold text-slate-600">%</span>
                                                </div>
                                                <div className="flex items-center justify-center gap-3 mt-1">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] text-slate-500 font-bold uppercase leading-none">Prog.</span>
                                                        <span className="text-xs font-black text-white">{area.plan}</span>
                                                    </div>
                                                    <div className="w-px h-6 bg-slate-800"></div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] text-emerald-500 font-bold uppercase leading-none">Ejec.</span>
                                                        <span className="text-xs font-black text-emerald-400">{area.exec}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800 mt-2">
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]"
                                                    style={{ width: `${area.value}%`, backgroundColor: area.color, color: area.color }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* --- SECCIÓN DE ESTADÍSTICAS DE ACCIDENTABILIDAD (KPIs) --- */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-700 relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className="p-3 bg-rose-500/20 rounded-2xl">
                                <ActivityIcon size={24} className="text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Indicadores de Accidentabilidad</h3>
                                <p className="text-sm text-slate-400 font-bold">Resumen Estadístico Anual 2026</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 relative z-10">
                            {[
                                { label: 'HHT Acumuladas', val: accidentabilityStats.totalHHT.toLocaleString(), color: 'text-indigo-400', sub: 'Horas Hombre Totales' },
                                { label: 'Índice Frecuencia (IF)', val: accidentabilityStats.IF, color: 'text-emerald-400', sub: 'Accidentes / Horas Hombre' },
                                { label: 'Índice Severidad (IS)', val: accidentabilityStats.IS, color: 'text-blue-400', sub: 'Días Perdidos / Horas Hombre' },
                                { label: 'Índice Accidentabilidad (IA)', val: accidentabilityStats.IA, color: 'text-purple-400', sub: '(IF x IS) / 1000' },
                                { label: 'Tasa Incidencia Enf.', val: accidentabilityStats.TasaInc, color: 'text-orange-400', sub: 'Enfermedades / Trabajadores' },
                                { label: 'Freq. Estados Pre-Pat.', val: accidentabilityStats.FreqPrePat, color: 'text-rose-400', sub: 'Estados Pre-Pat. / Trabajadores' },
                            ].map((kpi, idx) => (
                                <div key={idx} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-colors group">
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-2">{kpi.label}</p>
                                    <div className="flex items-end gap-2">
                                        <span className={`text-3xl font-black ${kpi.color} group-hover:scale-105 transition-transform`}>{kpi.val}</span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-mono mt-2 truncate" title={kpi.sub}>{kpi.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 2. OBJECTIVES CHARTS (OBJ 01-05) */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 px-4">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <Target size={18} className="text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Objetivos de Gestión (OBJ 01 - 05)</h3>
                        </div>
                        {renderObjectiveList(mgmtData)}
                    </div>

                    {/* 3. FOLLOW-UP CHARTS (SEG 01-06) */}
                    <div className="space-y-4 mt-8">
                        <div className="flex items-center gap-3 px-4">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <ClipboardCheck size={18} className="text-blue-500" />
                            </div>
                            <h3 className="text-lg font-black text-white uppercase tracking-tight">Seguimientos (SEG 01 - 06)</h3>
                        </div>
                        {renderObjectiveList(followupData)}
                    </div>

                    {/* 3. PERFORMANCE BY RESPONSIBLE (PREMIUM EXECUTIVE SECTION) */}
                    <div className="bg-[#0f172a] rounded-[3rem] p-10 shadow-2xl border border-slate-800/50 relative overflow-hidden mt-10 group">
                        {/* Executive Background Decoration */}
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none group-hover:bg-indigo-500/15 transition-colors duration-700"></div>
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] -ml-20 -mb-20 pointer-events-none"></div>

                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl shadow-2xl shadow-indigo-500/20 ring-1 ring-white/20">
                                    <Users size={28} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                                        Rendimiento por Responsable
                                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 font-bold uppercase tracking-widest">Executive Dashboard</span>
                                    </h3>
                                    <p className="text-slate-400 font-medium mt-1">Eficacia de Ejecución (Ejecutado / Programado) · Año {currentYear}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-slate-800">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Actualizado en Tiempo Real</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 relative z-10 w-full">
                            {USER_LIST.filter(u => u.username !== 'jose.cancino' && u.username !== 'gerencia').map((userObj, idx) => {
                                const user = userObj.name;
                                const isDeactivated = deactivatedUsers.has(userObj.username);
                                
                                const uName = user.toLowerCase();
                                const uFirst = uName.split(' ')[0];

                                const isUserMatch = (rName1: any, rName2: any) => {
                                    const rNameStr = String(rName1 || rName2 || '').toLowerCase().trim();
                                    if (!rNameStr) return false;
                                    
                                    const nUser = normStr(uName);
                                    let nRecord = normStr(rNameStr);

                                    // Normalize common variations/typos (v/b, s/z, accents handled by normStr)
                                    const normalizeTypos = (s: string) => s.replace(/v/g, 'b').replace(/z/g, 's').replace(/j/g, 'g').replace(/y/g, 'i');
                                    const nUserT = normalizeTypos(nUser);
                                    const nRecordT = normalizeTypos(nRecord);
                                    
                                    // 1. Exact or inclusive match
                                    if (nUserT.includes(nRecordT) || nRecordT.includes(nUserT)) return true;
                                    
                                    // 2. Fuzzy word match
                                    const uWords = getWords(nUserT);
                                    const rWords = getWords(nRecordT);
                                    
                                    // If at least 2 words match (or all words if only 1-2 words total)
                                    const matches = uWords.filter(uw => rWords.some(rw => rw.includes(uw) || uw.includes(rw)));
                                    if (matches.length >= Math.min(2, uWords.length, rWords.length) && matches.length > 0) return true;
                                    
                                    // 3. Special case for Gladis
                                    if ((uFirst === 'gladis' || uFirst === 'gladys') && nRecord.includes('glad')) return true;
                                    
                                    return false;
                                };
                                

                                // Dynamic Calculation for this user based on their specific responsibilities
                                let planned = 0;
                                let executed = 0;

                                // Define objective mapping for groups
                                // Group 1 (General): OBJ 02, OBJ 03, OBJ 04, SEG 03, SEG 04, SEG 05, SEG 06
                                const group1Ids = ['obj2', 'obj-2', 'obj3', 'obj-3', 'obj4', 'obj-4', 'obj8', 'obj-8', 'obj9', 'obj-9', 'obj10', 'obj-10', 'obj11', 'obj-11'];
                                // Group 2 (Health - Gladis): OBJ 05, SEG 01, SEG 02
                                const group2Ids = ['obj5', 'obj-5', 'obj6', 'obj-6', 'obj7', 'obj-7'];
                                
                                const isGladis = userObj.username === 'gladis.aroste';
                                
                                // Filter allowed objectives for this specific user
                                const allowedObjIds = isGladis ? group2Ids : group1Ids;

                                // 1. Calculate P and E from Annual Program
                                // For P, we sum ALL items in the assigned objectives (team goal)
                                // For E, we only sum if they are specifically assigned as responsible in the program
                                OBJECTIVES_CONFIG.forEach(obj => {
                                    // Check both hyphenated and non-hyphenated versions
                                    const idNoHyphen = obj.id.replace('-', '');
                                    const idWithHyphen = obj.id.includes('-') ? obj.id : `obj-${obj.id.replace('obj', '')}`;
                                    
                                    if (!allowedObjIds.includes(idNoHyphen) && !allowedObjIds.includes(idWithHyphen)) return;
                                    
                                    const items = [...(programData[idNoHyphen] || []), ...(programData[idWithHyphen] || [])];
                                    
                                    // Special handling for OBJ 05: Count as 1 unit per month as requested
                                    if (obj.id === 'obj5' || obj.id === 'obj-5') {
                                        const monthsWithPlanned = new Set();
                                        const monthsWithExecuted = new Set();
                                        
                                        items.forEach(item => {
                                            const d = new Date(item.date);
                                            const itemYear = d.getFullYear();
                                            const itemMonth = d.getMonth();
                                            const descLower = (item.description || '').toLowerCase();
                                            
                                            if (descLower.includes('inducción') || descLower.includes('induccion')) return;
                                            
                                            const isYearMatch = itemYear === currentYear || itemYear === 2025;
                                            if (isYearMatch && (currentMonth === -1 || itemMonth === currentMonth)) {
                                                monthsWithPlanned.add(itemMonth);
                                                // La ejecución la tomamos sólo si hay match (aunque luego se sobrescribe)
                                                if (item.status === 'Realizado' || (Number(item.compliance) || 0) > 0) {
                                                    monthsWithExecuted.add(itemMonth);
                                                }
                                            }
                                        });
                                        planned += monthsWithPlanned.size;
                                        executed += monthsWithExecuted.size;
                                        return;
                                    }

                                    items.forEach(item => {
                                        const d = new Date(item.date);
                                        const itemYear = d.getFullYear();
                                        const descLower = (item.description || '').toLowerCase();
                                        
                                        // Exclude Inductions as requested
                                        if (descLower.includes('inducción') || descLower.includes('induccion')) return;
                                        
                                        // Exclude RAC Implementation from OBJ 04
                                        if (descLower.includes('implementación') && (obj.id === 'obj4' || obj.id === 'obj-4')) return;

                                        // Support both 2026 (current target) and 2025 (legacy/template)
                                        const isYearMatch = itemYear === currentYear || itemYear === 2025;
                                        
                                        if (isYearMatch && (currentMonth === -1 || d.getMonth() === currentMonth)) {
                                            // P is the team total for their assigned objectives
                                            planned++;
                                            if (item.status === 'Realizado' || (Number(item.compliance) || 0) > 0) {
                                                executed++;
                                            }
                                        }
                                    });
                                });

                                // 2. Consolidated Real Records logic for this user
                                const getMyRecords = (recs: any[]) => recs.filter(r => {
                                    if (!r.date) return false;
                                    // Use T12:00:00 to avoid timezone shifts for dates like "2026-02-01"
                                    const d = new Date(r.date.includes('T') ? r.date : r.date + 'T12:00:00');
                                    const descLower = (r.description || r.tema || r.activity || r.inspectionType || '').toLowerCase();
                                    
                                    // Exclude Inductions
                                    if (descLower.includes('inducción') || descLower.includes('induccion')) return false;
                                    
                                    // Exclude RAC Implementation from OBJ 04
                                    if (descLower.includes('implementación') && descLower.includes('rac')) return false;

                                    // MUST have an attached file/evidence to count as executed
                                    if (!hasEvidence(r)) return false;

                                    return isUserMatch(r.responsible, r.responsable) && 
                                           (d.getFullYear() === currentYear || d.getFullYear() === 2025) && 
                                           (currentMonth === -1 || d.getMonth() === currentMonth);
                                });

                                // Gather ONLY relevant program-related records for this user (exclude daily operational forms like ATS, PETAR, etc.)
                                const allMyRecords = [
                                    ...getMyRecords(hhcRecords).map(r => ({...r, recType: 'HHC', desc: r.tema, isHealth: String(r.area || '').toLowerCase().includes('salud')})),
                                    ...getMyRecords(executedInspections).map(r => ({...r, recType: 'INSP', desc: r.inspectionType, isHealth: (t => t.includes('salud') || t.includes('medico') || t.includes('médico') || t.includes('health'))(String(r.inspectionType || '').toLowerCase())})),
                                    ...getMyRecords(simulacroRecords).map(r => ({...r, recType: 'SIMULACRO', desc: r.drillType || 'Simulacro'})),
                                    ...getMyRecords(brigadistaRecords).map(r => ({...r, recType: 'BRIGADISTA', desc: r.brigadistaType || 'Brigadista'})),
                                    ...getMyRecords(evidenceRecords).map(r => ({...r, recType: 'EVIDENCIA', desc: r.description || r.activity, isHealth: (d => d.includes('salud') || d.includes('médico') || d.includes('emo'))((r.description || r.activity || '').toLowerCase())}))
                                ];

                                // Filter records based on user's group responsibilities
                                // Note: Individual performance always counts all work registered by the user
                                let filteredMyRecords = allMyRecords;
                                if (!isGladis) {
                                    filteredMyRecords = allMyRecords.filter(r => !r.isHealth);
                                } else {
                                    filteredMyRecords = allMyRecords.filter(r => r.isHealth || r.recType === 'EVIDENCIA');
                                }

                                // Helper to get the lists for the modal with linking logic
                                const getProgramLists = () => {
                                    const allPending: any[] = [];
                                    const allExecuted: any[] = [];
                                    const uniquePendingKeys = new Set<string>();
                                    const usedRecordIndices = new Set<number>();

                                    // A. Process Programmed items and link with real records
                                    OBJECTIVES_CONFIG.forEach(obj => {
                                        const idNoHyphen = obj.id.replace('-', '');
                                        const idWithHyphen = obj.id.includes('-') ? obj.id : `obj-${obj.id.replace('obj', '')}`;
                                        if (!allowedObjIds.includes(idNoHyphen) && !allowedObjIds.includes(idWithHyphen)) return;
                                        
                                        const items = [...(programData[idNoHyphen] || []), ...(programData[idWithHyphen] || [])];
                                        items.forEach(item => {
                                            const d = new Date(item.date);
                                            if ((d.getFullYear() === currentYear || d.getFullYear() === 2025) && (currentMonth === -1 || d.getMonth() === currentMonth)) {
                                                const descLower = (item.description || '').toLowerCase();
                                                if (descLower.includes('inducción') || descLower.includes('induccion')) return;
                                                if (descLower.includes('implementación') && (obj.id === 'obj4' || obj.id === 'obj-4')) return;

                                                const formattedItem = { ...item, objectiveName: obj.title, description: item.description || item.tema };
                                                const isDoneInProgram = item.status === 'Realizado' || (Number(item.compliance) || 0) > 0;
                                                
                                                // Fuzzy Match with Month Constraint
                                                const sn = normStr(item.description || item.tema || '');
                                                const sw = getWords(sn);
                                                let matchIdx = -1;
                                                if (sw.length > 0) {
                                                    matchIdx = filteredMyRecords.findIndex((r, idx) => {
                                                        if (usedRecordIndices.has(idx)) return false;

                                                        // Enforce same month and year
                                                        const rDate = new Date(r.date.includes('T') ? r.date : r.date + 'T12:00:00');
                                                        const pDate = new Date(item.date);
                                                        if (rDate.getMonth() !== pDate.getMonth() || rDate.getFullYear() !== pDate.getFullYear()) {
                                                            return false;
                                                        }

                                                        const rn = normStr(r.desc || '');
                                                        const rw = getWords(rn);
                                                        
                                                        // Exact or inclusive
                                                        if (rn === sn || rn.includes(sn) || sn.includes(rn)) return true;
                                                        
                                                        // Partial word match (at least 2 words or 1 if very short)
                                                        const matchesCount = sw.filter(w => rw.some(rwk => rwk.includes(w) || w.includes(rwk))).length;
                                                        const minMatches = Math.min(2, sw.length, rw.length);
                                                        return matchesCount >= minMatches && matchesCount > 0;
                                                    });
                                                }

                                                // Solamente tomamos como ejecutado si ELLOS subieron el archivo (matchIdx !== -1)
                                                if (matchIdx !== -1) {
                                                    allExecuted.push({ ...formattedItem, realRecord: filteredMyRecords[matchIdx] });
                                                    usedRecordIndices.add(matchIdx);
                                                } else {
                                                    const key = `${formattedItem.objectiveName}-${formattedItem.description}`.toLowerCase();
                                                    if (!uniquePendingKeys.has(key)) {
                                                        uniquePendingKeys.add(key);
                                                        allPending.push(formattedItem);
                                                    }
                                                }
                                            }
                                        });
                                    });

                                    // Removed "B. Add all remaining real records as extra activities"
                                    // To strictly calculate Execution Efficiency based ONLY on the Annual Program.

                                    return { allPending, allExecuted };
                                };

                                // Calculate the count for the gauge
                                const modalData = getProgramLists();
                                executed = modalData.allExecuted.length;
                                // Special case for Group 2 (EMO OBJ 05): Correct the total executed if needed (EMOs as 1 per month)
                                if (isGladis) {
                                    // The count above might be higher if multiple EMOs exist, but we stick to the modal total for consistency
                                    // unless we want to keep the "1 per month" rule strictly for the gauge.
                                    // Let's stick to the modal total so the gauge and modal match perfectly.
                                }

                                const performance = planned > 0 ? Math.round((executed / planned) * 100) : (executed > 0 ? 100 : 0);

                                return (
                                    <div 
                                        key={idx} 
                                        className={`group/card relative bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-5 border transition-all duration-500 flex flex-col items-center hover:scale-[1.03] hover:shadow-2xl shadow-black/40 ${isDeactivated ? 'opacity-40 grayscale border-slate-800' : 'border-slate-700/50 hover:border-indigo-500/50'}`}
                                    >
                                        {/* Status Glow */}
                                        {!isDeactivated && (
                                            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity rounded-[2.5rem]"></div>
                                        )}

                                        {/* Top Actions: Toggle Participation */}
                                        <div className="flex items-center justify-between w-full mb-4 z-10">
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => toggleParticipation(userObj.username)}
                                                    className={`w-10 h-5 rounded-full relative transition-colors duration-300 flex items-center px-1 ${isDeactivated ? 'bg-slate-700' : 'bg-emerald-500'}`}
                                                    title={isDeactivated ? "Activar participación" : "Desactivar participación"}
                                                >
                                                    <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform duration-300 ${isDeactivated ? 'translate-x-0' : 'translate-x-5'}`}></div>
                                                </button>
                                                <span className={`text-[8px] font-black uppercase tracking-widest ${isDeactivated ? 'text-slate-500' : 'text-emerald-400'}`}>
                                                    {isDeactivated ? 'Inactivo' : 'Activo'}
                                                </span>
                                            </div>
                                            {!isDeactivated && performance >= 90 && (
                                                <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-500 animate-bounce">
                                                    <Award size={14} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Profile Avatar & Info */}
                                        <div className="flex flex-col items-center gap-3 mb-6 relative z-10 w-full">
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-black border-2 transition-all duration-500 ${isDeactivated ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-slate-950 border-indigo-500/30 text-white group-hover/card:border-indigo-500 shadow-xl group-hover/card:shadow-indigo-500/20'}`}>
                                                {getInitials(user)}
                                            </div>
                                            <div className="text-center overflow-hidden w-full">
                                                <h4 className="text-xs font-black text-white tracking-tight truncate px-2" title={user}>{user}</h4>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Líder SSOMA</p>
                                            </div>
                                        </div>

                                        {/* Gauge Premium Rendering */}
                                        <div className={`flex justify-center mb-6 py-2 transition-all duration-500 ${isDeactivated ? 'blur-[2px]' : ''}`}>
                                            <ComplianceGauge 
                                                value={performance} 
                                                width={140} 
                                                height={80} 
                                                title="" 
                                                color={isDeactivated ? '#475569' : (performance >= 90 ? '#10b981' : performance >= 75 ? '#f59e0b' : '#ef4444')} 
                                            />
                                        </div>

                                        {/* Footer Metrics - Executive Table Style */}
                                        <div 
                                            onClick={() => {
                                                setPerformanceDetail({ 
                                                    userName: user, 
                                                    executedItems: modalData.allExecuted, 
                                                    pendingItems: modalData.allPending 
                                                });
                                            }}
                                            className={`w-full grid grid-cols-3 gap-px bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700/50 backdrop-blur-md relative z-10 cursor-pointer group/footer hover:border-indigo-500/50 transition-all ${isDeactivated ? 'bg-slate-900/80' : ''}`}
                                        >
                                            <div className="bg-slate-900/80 p-3 flex flex-col items-center justify-center gap-1 group-hover/footer:bg-slate-800 transition-colors">
                                                <span className="text-[8px] text-blue-500/70 font-black uppercase tracking-tighter group-hover/footer:text-blue-400 transition-colors">Programado</span>
                                                <span className="text-sm font-black text-blue-400 tabular-nums">{planned}</span>
                                            </div>
                                            <div className="bg-slate-900/80 p-3 flex flex-col items-center justify-center gap-1 group-hover/footer:bg-slate-800 transition-colors border-l border-slate-800/50">
                                                <span className="text-[8px] text-emerald-500/70 font-black uppercase tracking-tighter group-hover/footer:text-emerald-400 transition-colors">Ejecutado</span>
                                                <span className="text-sm font-black text-emerald-400 tabular-nums">{executed}</span>
                                            </div>
                                            <div className="bg-slate-900/80 p-3 flex flex-col items-center justify-center gap-1 group-hover/footer:bg-slate-800 transition-colors border-l border-slate-800/50">
                                                <span className="text-[8px] text-amber-500/70 font-black uppercase tracking-tighter group-hover/footer:text-amber-400 transition-colors">Pendiente</span>
                                                <span className="text-sm font-black text-amber-400 tabular-nums">{Math.max(0, planned - executed)}</span>
                                            </div>
                                        </div>

                                        {/* Progress Bar (Subtle) */}
                                        {!isDeactivated && (
                                            <div className="w-full h-1 bg-slate-950 rounded-full mt-4 overflow-hidden border border-white/5">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-1000"
                                                    style={{ width: `${performance}%` }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            )}
            {/* INDICADORES DE GESTIÓN (PERSONAL & HHC AVANZADO) */}
            {mode === 'hhc' && (
                <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-700 relative">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 relative z-10 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
                                <Calculator size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">Centro de Control HHC</h3>
                                <p className="text-xs text-slate-400 font-medium">Gestión de Horas Hombre Capacitadas e Indicadores</p>
                            </div>
                        </div>

                        </div>

                    {/* 1. KPIs RESUMEN - REDISEÑO UNIFORME PREMIUM */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-12 gap-4 relative z-10">
                            
                            {/* Card 1: Total HHC (EMERALD) */}
                            <div className="group relative bg-slate-900/40 backdrop-blur-md p-4 rounded-[2rem] border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 xl:col-span-2 flex flex-col justify-between shadow-2xl shadow-emerald-500/5">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                                            <Clock size={12} />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Total HHC</p>
                                    </div>
                                    <select
                                        value={hhcMonthFilter}
                                        onChange={(e) => setHhcMonthFilter(Number(e.target.value))}
                                        className="bg-slate-950 border border-slate-800 text-[8px] text-emerald-400 font-bold rounded-lg px-1.5 py-0.5 outline-none focus:border-emerald-500 cursor-pointer"
                                    >
                                        {MONTHS.map((m, i) => <option key={i} value={i}>{m.substring(0, 3).toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div className="mt-4">
                                    <div className="flex items-end gap-2">
                                        <span className="text-5xl font-black text-white tracking-tighter drop-shadow-md">{totalHHCMonth}</span>
                                        <span className="text-[10px] text-slate-500 mb-2 font-bold uppercase">Horas</span>
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">Indice: {indiceHHCValue}%</span>
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                    </div>
                                </div>

                                {/* Tooltip */}
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none z-50 scale-90 group-hover:scale-100 group-hover:-translate-y-2">
                                    <div className="bg-slate-950/95 border border-emerald-500/30 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
                                        <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mb-1">Cálculo de Capacitación</p>
                                        <p className="text-[11px] text-white font-medium whitespace-nowrap">Σ (Personal × Horas por Tipo)</p>
                                        <p className="text-[9px] text-slate-500 mt-1 border-t border-white/5 pt-1">Eficiencia: (HHC / HHT) × 100</p>
                                    </div>
                                    <div className="w-3 h-3 bg-slate-950 border-b border-r border-emerald-500/30 rotate-45 mx-auto -mt-1.5"></div>
                                </div>
                            </div>

                            {/* Card 2: Cant. de Trabajadores Personal (PINK) */}
                            <div className="group relative bg-slate-900/40 backdrop-blur-md p-4 rounded-[2rem] border border-slate-700/50 hover:border-pink-500/50 transition-all duration-300 xl:col-span-3 flex flex-col justify-between shadow-2xl shadow-pink-500/5">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-pink-500/10 rounded-lg text-pink-400">
                                            <Users size={12} />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Cant. de Trabajadores</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-1.5 bg-slate-950/50 px-2 py-1 rounded-lg border border-white/5">
                                            <span className="text-[7px] text-pink-500 font-black uppercase tracking-tighter">Empleados</span>
                                            <input
                                                type="number"
                                                value={monthlyEmpleadosInputs[`${currentYear}-${hhcMonthFilter}`] || ''}
                                                onChange={(e) => handleMonthlyInputChange('empleados', e.target.value)}
                                                className="w-10 bg-transparent text-[10px] text-white font-black outline-none"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-slate-950/50 px-2 py-1 rounded-lg border border-white/5">
                                            <span className="text-[7px] text-blue-500 font-black uppercase tracking-tighter">Obrero</span>
                                            <input
                                                type="number"
                                                value={monthlyObrerosInputs[`${currentYear}-${hhcMonthFilter}`] || ''}
                                                onChange={(e) => handleMonthlyInputChange('obreros', e.target.value)}
                                                className="w-10 bg-transparent text-[10px] text-white font-black outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="flex items-end gap-2">
                                        <span className="text-5xl font-black text-white tracking-tighter drop-shadow-md">
                                            {(Number(monthlyEmpleadosInputs[`${currentYear}-${hhcMonthFilter}`]) || 0) + 
                                             (Number(monthlyObrerosInputs[`${currentYear}-${hhcMonthFilter}`]) || 0)}
                                        </span>
                                        <span className="text-[10px] text-slate-500 mb-2 font-bold uppercase">Trabajadores</span>
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[11px] font-black text-pink-400 uppercase tracking-wider">Suma de Trabajadores</span>
                                        <div className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.5)]"></div>
                                    </div>
                                </div>

                                {/* Tooltip */}
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none z-50 scale-90 group-hover:scale-100 group-hover:-translate-y-2">
                                    <div className="bg-slate-950/95 border border-pink-500/30 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl ring-1 ring-white/10 text-center">
                                        <p className="text-[9px] text-pink-400 font-black uppercase tracking-widest mb-1">Población Laboral</p>
                                        <p className="text-[11px] text-white font-medium whitespace-nowrap">Empleados + Obreros registrados en el mes</p>
                                    </div>
                                    <div className="w-3 h-3 bg-slate-950 border-b border-r border-pink-500/30 rotate-45 mx-auto -mt-1.5"></div>
                                </div>
                            </div>

                            {/* Card 3: HHT Acumulado (CYAN) */}
                            <div className="group relative bg-slate-900/40 backdrop-blur-md p-4 rounded-[2rem] border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 xl:col-span-3 flex flex-col justify-between shadow-2xl shadow-cyan-500/5">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400">
                                            <TrendingUp size={12} />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">HHT del Año</p>
                                    </div>
                                    <div className="bg-slate-950/50 px-2 py-1 rounded-lg border border-cyan-500/20">
                                        <span className="text-[8px] text-cyan-400 font-black">EDITAR VALOR</span>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="flex items-center gap-6">
                                        <span className="text-5xl font-black text-white tracking-tighter drop-shadow-md">
                                            {monthlyHHCStats.totalHHTAccumulated || 0}
                                        </span>
                                        <div className="flex-1">
                                            <input
                                                type="number"
                                                placeholder="Editar HHT..."
                                                value={monthlyHHTInputs[`${currentYear}-${hhcMonthFilter}`] || ''}
                                                onChange={(e) => handleMonthlyInputChange('hht', e.target.value)}
                                                className="w-full bg-slate-950/80 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-cyan-400 font-black outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all text-center"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
                                        <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider">HHT Acumulado</span>
                                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce shadow-[0_0_8px_rgba(6,182,212,0.5)]"></div>
                                    </div>
                                </div>

                                {/* Tooltip */}
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none z-50 scale-90 group-hover:scale-100 group-hover:-translate-y-2">
                                    <div className="bg-slate-950/95 border border-cyan-500/30 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl ring-1 ring-white/10 text-center">
                                        <p className="text-[9px] text-cyan-400 font-black uppercase tracking-widest mb-1">Cálculo de HHT</p>
                                        <p className="text-[11px] text-white font-medium whitespace-nowrap">Horas Hombre Trabajadas totales en el proyecto</p>
                                    </div>
                                    <div className="w-3 h-3 bg-slate-950 border-b border-r border-cyan-500/30 rotate-45 mx-auto -mt-1.5"></div>
                                </div>
                            </div>

                            {/* Card 4: % Mensual (BLUE) */}
                            <div className="group relative bg-slate-900/40 backdrop-blur-md p-4 rounded-[2rem] border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 xl:col-span-2 flex flex-col justify-between shadow-2xl shadow-blue-500/5">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
                                        <Target size={12} />
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">% Mensual</p>
                                </div>
                                <div className="mt-4">
                                    <div className="flex items-end gap-2">
                                        <span className={`text-5xl font-black tracking-tighter drop-shadow-md ${Number(monthlyIndex) >= complianceGoal ? 'text-emerald-400' : 'text-blue-400'}`}>{monthlyIndex}%</span>
                                        <span className="text-[10px] text-slate-500 mb-2 font-bold uppercase">{MONTHS[hhcMonthFilter].substring(0,3)}</span>
                                    </div>
                                    <div className="w-full bg-slate-950 h-2 mt-4 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                        <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-1000 rounded-full" style={{ width: `${monthlyIndex}%` }}></div>
                                    </div>
                                </div>

                                {/* Tooltip */}
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none z-50 scale-90 group-hover:scale-100 group-hover:-translate-y-2">
                                    <div className="bg-slate-950/95 border border-blue-500/30 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl ring-1 ring-white/10 text-center">
                                        <p className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-1">Avance del Mes</p>
                                        <p className="text-[11px] text-white font-medium whitespace-nowrap">(Ejecutado / Programado) × 100</p>
                                    </div>
                                    <div className="w-3 h-3 bg-slate-950 border-b border-r border-blue-500/30 rotate-45 mx-auto -mt-1.5"></div>
                                </div>
                            </div>

                        </div>

                        <div className="flex flex-col xl:flex-row gap-6 items-start">
                            {/* 2. PANEL DE REGISTRO (35%) */}
                            <div className="w-full xl:w-[35%] bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 shadow-xl">
                                <div className="flex flex-col gap-4 mb-4">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                        <h4 className="text-emerald-400 font-bold flex items-center gap-2 text-sm">
                                            <Edit size={16} /> Panel de Registro
                                            {isSyncing && (
                                                <span className="flex items-center gap-1 text-[8px] bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full animate-pulse border border-blue-700/30">
                                                    <span className="w-1 h-1 bg-blue-400 rounded-full animate-ping"></span>
                                                    SINCRONIZANDO...
                                                </span>
                                            )}
                                        </h4>
                                        <button
                                            onClick={() => {
                                                setEditingIndex(null);
                                                setNewHHC({ responsable: '', date: '', hhc: '', hht: '', hombres: '', mujeres: '', area: 'seguridad', tipo: 'capacitacion', tema: '', evidenceImgs: [], evidencePdf: '', lugar: '', isAdditionalTopic: false, customTopic: '' });
                                            }}
                                            className="bg-slate-700/50 hover:bg-slate-600 text-white text-[10px] font-bold px-4 py-2 rounded-xl transition-all border border-slate-600/50 hover:border-slate-500 w-full sm:w-auto active:scale-95"
                                        >
                                            Limpiar Formulario
                                        </button>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3 relative">
                                        {/* IMPORT MENU */}
                                        <div className="relative flex-1 group w-full">
                                            <button
                                                onClick={() => setImportMenuOpen(!importMenuOpen)}
                                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black px-4 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-95"
                                            >
                                                📊 GESTIÓN DE DATOS
                                            </button>

                                            {importMenuOpen && (
                                                <div className="absolute top-full left-0 mt-2 w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                    {/* Option 1: Import for current month */}
                                                    <div className="relative border-b border-slate-800 hover:bg-slate-800 transition-colors">
                                                        <input
                                                            type="file"
                                                            accept=".xlsx,.xls"
                                                            onChange={(e) => {
                                                                handleHhcExcelImport(e);
                                                                setImportMenuOpen(false);
                                                            }}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        />
                                                        <div className="px-4 py-3 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Download size={14} className="text-emerald-400" />
                                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                                    Importar {MONTHS[hhcMonthFilter]}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Option 2: Delete current month */}
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm(`⚠️ ¿Estás seguro de ELIMINAR todos los registros de ${MONTHS[hhcMonthFilter]} del año ${currentYear}?`)) {
                                                                handleDeleteMonthHhc();
                                                            }
                                                            setImportMenuOpen(false);
                                                        }}
                                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800 transition-colors text-left"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Trash2 size={14} className="text-red-400" />
                                                            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                                                                Limpiar {MONTHS[hhcMonthFilter]}
                                                            </span>
                                                        </div>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <button onClick={() => setShowProgramModal(true)} className="flex-1 w-full bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-black px-4 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700 active:scale-95">
                                            📅 CALENDARIO
                                        </button>
                                    </div>
                                </div>
                                {/* Backdrop for menu */}
                                {importMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setImportMenuOpen(false)}></div>}

                                <div className="grid grid-cols-1 gap-3 mb-4">
                                    <div>
                                        <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Fecha</label>
                                        <input name="reg_fecha" type="date" value={newHHC.date} onChange={(e) => handleDateChange(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs font-bold outline-none focus:border-emerald-500" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Responsable</label>
                                        <select
                                            name="reg_responsable"
                                            value={newHHC.responsable}
                                            onChange={(e) => setNewHHC({ ...newHHC, responsable: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs font-bold outline-none focus:border-emerald-500"
                                        >
                                            <option value="">-- Seleccione --</option>
                                            {USER_LIST.map(u => (
                                                <option key={u.username} value={u.name}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Area</label>
                                            <select name="reg_area" value={newHHC.area} onChange={(e) => updateStat('area', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs font-bold outline-none focus:border-emerald-500">
                                                <option value="seguridad">SEGURIDAD</option>
                                                <option value="salud">SALUD</option>
                                                <option value="ambiente">MEDIO AMBIENTE</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Tipo</label>
                                            <select name="reg_tipo" value={newHHC.tipo} onChange={(e) => updateStat('tipo', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-[10px] font-bold outline-none focus:border-emerald-500">
                                                <option value="induccion_gen">INDUCCIÓN (4H)</option>
                                                <option value="induccion_esp">IND. ESPECÍFICA (8H)</option>
                                                <option value="capacitacion">CAPACITACIÓN (1H)</option>
                                                <option value="difusion">DIFUSIÓN (30 MIN)</option>
                                                <option value="entrenamiento">ENTRENAMIENTO (30 MIN)</option>
                                                <option value="charla">CHARLA (15 MIN)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Lugar</label>
                                        <select
                                            name="reg_lugar"
                                            value={newHHC.lugar || ''}
                                            onChange={(e) => setNewHHC({ ...newHHC, lugar: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-xs font-bold outline-none focus:border-emerald-500"
                                        >
                                            <option value="">-- Seleccione --</option>
                                            {SSOMA_LOCATIONS.map(loc => (
                                                <option key={loc} value={loc}>{loc}</option>
                                            ))}

                                        </select>
                                    </div>
                                    <div className="space-y-4 p-4 bg-slate-900/80 rounded-2xl border border-white/5 shadow-inner">
                                        <div className="flex items-center justify-between gap-4">
                                            <label className="text-[11px] text-emerald-400 font-black uppercase tracking-widest leading-tight">¿Tema fuera del programa?</label>
                                            <div className="flex bg-slate-950 rounded-xl p-1 border border-white/10 shadow-lg">
                                                <button 
                                                    onClick={() => setNewHHC(prev => ({ ...prev, isAdditionalTopic: true }))}
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${newHHC.isAdditionalTopic ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'text-slate-500 hover:text-slate-400'}`}
                                                >
                                                    SÍ
                                                </button>
                                                <button 
                                                    onClick={() => setNewHHC(prev => ({ ...prev, isAdditionalTopic: false, customTopic: '' }))}
                                                    className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${!newHHC.isAdditionalTopic ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-400'}`}
                                                >
                                                    NO
                                                </button>
                                            </div>
                                        </div>

                                        {newHHC.isAdditionalTopic ? (
                                            <div className="animate-in fade-in slide-in-from-top-3 duration-500">
                                                <label className="text-[10px] text-emerald-400 font-black uppercase block mb-2 tracking-widest">NOMBRE DEL TEMA ADICIONAL</label>
                                                <div className="relative group">
                                                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-500 transition-colors" size={16} />
                                                    <input 
                                                        name="reg_tema_custom"
                                                        type="text" 
                                                        placeholder="Escriba el nombre del tema..."
                                                        value={newHHC.customTopic}
                                                        onChange={(e) => setNewHHC(prev => ({ ...prev, customTopic: e.target.value }))}
                                                        className="w-full bg-slate-950 border border-emerald-500/20 group-focus-within:border-emerald-500/50 rounded-xl pl-10 pr-4 py-3 text-white text-xs font-bold outline-none transition-all shadow-inner"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <SearchableSelect
                                                    name="reg_tema"
                                                    label="TEMA DEL PROGRAMA ANUAL"
                                                    options={trainingTopicsByArea[newHHC.area] || []}
                                                    value={newHHC.tema}
                                                    onChange={(val) => updateStat('tema', val)}
                                                    placeholder="Seleccionar capacitación..."
                                                    icon={<BookOpen size={16} className="text-emerald-500" />}
                                                />
                                                {!newHHC.tema && (
                                                    <div className="flex items-center gap-2 px-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                                                        <p className="text-[9px] text-amber-500/80 font-bold italic tracking-wide">
                                                            * Elija un tema programado para computar el avance (E).
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 mb-4">
                                    <div>
                                        <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">H. Cap (Auto)</label>
                                        <input type="number" readOnly placeholder="HHC" value={newHHC.hhc} className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2 text-blue-400 text-xs font-black outline-none cursor-not-allowed" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] text-slate-400 font-black uppercase block mb-1 tracking-widest">Hombres</label>
                                            <div className="relative group">
                                                <Users className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                                                <input name="reg_hombres" type="number" placeholder="0" value={newHHC.hombres} onChange={(e) => updateStat('hombres', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-6 pr-1 py-3 text-white text-sm font-bold outline-none focus:border-emerald-500 transition-all" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] text-slate-400 font-black uppercase block mb-1 tracking-widest">Mujeres</label>
                                            <div className="relative group">
                                                <Users className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                                                <input name="reg_mujeres" type="number" placeholder="0" value={newHHC.mujeres} onChange={(e) => updateStat('mujeres', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-6 pr-1 py-3 text-white text-sm font-bold outline-none focus:border-emerald-500 transition-all" />
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                <div className="space-y-4 mb-4">
                                </div>

                                <div className="space-y-4 mb-4">
                                    {/* Carga de Archivos */}
                                    <div className="col-span-2">
                                        <label className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Evidencias</label>
                                        <div className="flex flex-col gap-2">
                                            {/* Barra de progreso de carga - visible en móvil */}
                                            {isUploading && (
                                                <div className="w-full">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] text-indigo-400 font-black animate-pulse flex items-center gap-1">
                                                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-ping inline-block"></span>
                                                            Subiendo archivo... por favor espera
                                                        </span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full animate-[progress_1.5s_ease-in-out_infinite] bg-[length:200%_100%]"
                                                            style={{ animation: 'shimmer 1.5s linear infinite', backgroundSize: '200% 100%' }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                id="img-upload-hhc"
                                            />
                                            <label
                                                htmlFor="img-upload-hhc"
                                                onDragOver={(e) => handleHhcDragOver(e, 'imgs')}
                                                onDragLeave={(e) => handleHhcDragLeave(e, 'imgs')}
                                                onDrop={(e) => handleHhcDrop(e, 'imgs')}
                                                className={`flex flex-col items-center justify-center gap-1 bg-slate-800 border ${
                                                    isUploading ? 'border-indigo-500/50 opacity-60 cursor-wait' :
                                                    isDraggingHhcImgs ? 'border-blue-500 bg-blue-500/10 scale-[1.05]' :
                                                    (newHHC.evidenceImgs.length >= 4 ? 'border-slate-700 text-slate-500 cursor-not-allowed' : 'border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 cursor-pointer')
                                                } rounded-xl p-3 transition-all flex-1 text-center min-h-[56px]`}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    {isUploading ? (
                                                        <span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                                                    ) : newHHC.evidenceImgs.length > 0 ? (
                                                        <CheckCircle2 size={16} className="text-emerald-400 animate-in zoom-in duration-300" />
                                                    ) : (
                                                        <ImageIcon size={16} />
                                                    )}
                                                    <span className={`text-[10px] font-bold ${newHHC.evidenceImgs.length > 0 ? 'text-emerald-400' : ''}`}>
                                                        {isUploading ? 'SUBIENDO...' : `FOTOS (${newHHC.evidenceImgs.length}/4)`}
                                                    </span>
                                                </div>
                                                {isDraggingHhcImgs && <span className="text-[7px] text-blue-400 font-black animate-pulse uppercase">¡Suelta fotos!</span>}
                                            </label>

                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                onChange={handlePdfUpload}
                                                className="hidden"
                                                id="pdf-upload-hhc"
                                            />
                                            <label
                                                htmlFor="pdf-upload-hhc"
                                                onDragOver={(e) => handleHhcDragOver(e, 'pdf')}
                                                onDragLeave={(e) => handleHhcDragLeave(e, 'pdf')}
                                                onDrop={(e) => handleHhcDrop(e, 'pdf')}
                                                className={`flex flex-col items-center justify-center gap-1 bg-slate-800 border ${
                                                    isUploading ? 'border-indigo-500/50 opacity-60 cursor-wait' :
                                                    isDraggingHhcPdf ? 'border-emerald-500 bg-emerald-500/10 scale-[1.05]' :
                                                    (newHHC.evidencePdf ? 'border-emerald-500 text-emerald-400' : 'border-slate-600 text-slate-400 hover:border-slate-500')
                                                } rounded-xl p-3 transition-all flex-1 cursor-pointer text-center min-h-[56px]`}
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    {isUploading ? (
                                                        <span className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                                                    ) : newHHC.evidencePdf ? (
                                                        <CheckCircle2 size={16} className="text-emerald-400 animate-in zoom-in duration-300" />
                                                    ) : (
                                                        <FileText size={16} />
                                                    )}
                                                    <span className={`text-[10px] font-bold ${newHHC.evidencePdf ? 'text-emerald-400' : ''}`}>
                                                        {isUploading ? 'PROCESANDO...' : (newHHC.evidencePdf ? 'PDF ✓' : 'PDF')}
                                                    </span>
                                                </div>
                                                {isDraggingHhcPdf && <span className="text-[7px] text-emerald-400 font-black animate-pulse uppercase">¡Suelta PDF!</span>}
                                            </label>
                                            </div>
                                        </div>

                                        {/* Thumbnails */}
                                        {newHHC.evidenceImgs.length > 0 && (
                                            <div className="flex gap-2 mt-2">
                                                {newHHC.evidenceImgs.map((img, idx) => (
                                                    <div key={idx} className="relative w-10 h-10 group">
                                                        <div className="w-full h-full flex items-center justify-center bg-slate-800 rounded border border-slate-600">
                                                            <ImageIcon size={16} className="text-blue-400" />
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={8} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button 
                                    onClick={handleAddHHCRecord} 
                                    disabled={isUploading}
                                    className={`w-full text-white font-black uppercase text-xs py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95 ${
                                        isUploading ? 'bg-slate-700 cursor-wait opacity-80' : 
                                        (editingIndex !== null ? 'bg-gradient-to-r from-orange-600 to-amber-500 hover:shadow-orange-500/20' : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:shadow-emerald-500/20')
                                    }`}
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Subiendo Archivos...
                                        </>
                                    ) : (
                                        <>
                                            {editingIndex !== null ? <Edit size={18} /> : <PlusCircle size={18} />}
                                            {editingIndex !== null ? 'Actualizar Registro' : 'Registrar Actividad'}
                                        </>
                                    )}
                                </button>

                            </div>

                            {/* 3. HISTORIAL (65%) */}
                            <div className="w-full xl:w-[65%]">

                                {/* 3. HISTORIAL */}
                                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                                    <div className="flex flex-col gap-4 mb-6">
                                        <h4 className="text-white font-bold flex items-center gap-2 text-sm">
                                            <History size={18} className="text-blue-400" /> Rastro de Formación
                                        </h4>
                                        <div className="flex flex-col sm:flex-row gap-3 ml-auto w-full sm:w-auto">
                                            {(filters.responsable || filters.lugar || filters.startDate || filters.endDate || filters.tema || filters.type !== 'todos') && (
                                                <button 
                                                    onClick={() => setFilters({ responsable: '', tema: '', startDate: '', endDate: '', type: 'todos', lugar: '' })}
                                                    className="bg-slate-800/80 hover:bg-slate-700 text-red-400 text-[10px] font-black px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700 hover:border-red-500/40 w-full sm:w-auto uppercase tracking-widest"
                                                >
                                                    <X size={14} /> Limpiar Filtros
                                                </button>
                                            )}
                                            <button
                                                onClick={generateBulkHHCPDF}
                                                disabled={isPdfExporting}
                                                className={`text-white text-[10px] font-black px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl w-full sm:w-auto uppercase tracking-widest ${
                                                    isPdfExporting
                                                        ? 'bg-red-800/70 cursor-wait opacity-80 shadow-red-900/20'
                                                        : 'bg-red-600 hover:bg-red-500 shadow-red-900/30'
                                                }`}
                                            >
                                                {isPdfExporting ? (
                                                    <>
                                                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Generando...
                                                    </>
                                                ) : (
                                                    <><Download size={14} /> Exportar PDF</>
                                                )}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                                            <div className="md:col-span-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="text-[9px] text-slate-500 font-bold uppercase block">Responsable</label>
                                                    {filters.responsable && (
                                                        <button onClick={() => setFilters(prev => ({ ...prev, responsable: '' }))} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                            <X size={10} />
                                                        </button>
                                                    )}
                                                </div>
                                                <SearchableSelect 
                                                    name="filtro_responsable"
                                                    options={USER_LIST.map(u => u.name)}
                                                    value={filters.responsable}
                                                    onChange={(val) => setFilters(prev => ({ ...prev, responsable: val }))}
                                                    placeholder="Buscar..."
                                                    className="w-full text-xs"
                                                />
                                            </div>
                                            <div className="md:col-span-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="text-[9px] text-slate-500 font-bold uppercase block">Lugar</label>
                                                    {filters.lugar && (
                                                        <button onClick={() => setFilters(prev => ({ ...prev, lugar: '' }))} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                            <X size={10} />
                                                        </button>
                                                    )}
                                                </div>
                                                <SearchableSelect 
                                                    options={SSOMA_LOCATIONS}
                                                    value={filters.lugar}
                                                    onChange={(val) => setFilters(prev => ({ ...prev, lugar: val }))}
                                                    placeholder="Buscar lugar..."
                                                    className="w-full text-xs"
                                                />
                                            </div>
                                            <div className="md:col-span-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="text-[9px] text-slate-500 font-bold uppercase block">Desde</label>
                                                    {filters.startDate && (
                                                        <button onClick={() => setFilters(prev => ({ ...prev, startDate: '' }))} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                            <X size={10} />
                                                        </button>
                                                    )}
                                                </div>
                                                <input type="date" value={filters.startDate} onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none" />
                                            </div>
                                            <div className="md:col-span-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="text-[9px] text-slate-500 font-bold uppercase block">Hasta</label>
                                                    {filters.endDate && (
                                                        <button onClick={() => setFilters(prev => ({ ...prev, endDate: '' }))} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                            <X size={10} />
                                                        </button>
                                                    )}
                                                </div>
                                                <input type="date" value={filters.endDate} onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none" />
                                            </div>
                                            <div className="md:col-span-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="text-[9px] text-slate-500 font-bold uppercase block">Tema</label>
                                                    {filters.tema && (
                                                        <button onClick={() => setFilters(prev => ({ ...prev, tema: '' }))} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                            <X size={10} />
                                                        </button>
                                                    )}
                                                </div>
                                                <input type="text" placeholder="Buscar tema..." value={filters.tema} onChange={(e) => setFilters(prev => ({ ...prev, tema: e.target.value }))} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white placeholder:text-slate-600 focus:border-blue-500 outline-none" />
                                            </div>
                                            <div className="md:col-span-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="text-[9px] text-slate-500 font-bold uppercase block">Tipo</label>
                                                    {filters.type !== 'todos' && (
                                                        <button onClick={() => setFilters(prev => ({ ...prev, type: 'todos' }))} className="text-[9px] text-red-400 hover:text-red-300 transition-colors">
                                                            <X size={10} />
                                                        </button>
                                                    )}
                                                </div>
                                                <select value={filters.type} onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none">
                                                    <option value="todos">TODOS</option>
                                                    <option value="induccion_gen">INDUCCIÓN GENERAL</option>
                                                    <option value="induccion_esp">INDUCCIÓN ESPECÍFICA</option>
                                                    <option value="capacitacion">CAPACITACIÓN</option>
                                                    <option value="difusion">DIFUSIÓN</option>
                                                    <option value="entrenamiento">ENTRENAMIENTO</option>
                                                    <option value="charla">CHARLA</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                        <table className="w-full text-left text-xs text-slate-400 relative border-collapse">
                                            <thead>
                                                <tr className="text-slate-500 border-b border-slate-800 text-[10px] uppercase font-bold">
                                                    <th className="sticky top-0 bg-slate-900 z-10 pb-3 pl-4 pr-2 w-[110px] text-left pt-2">Fecha</th>
                                                    <th className="sticky top-0 bg-slate-900 z-10 pb-3 px-2 text-left w-[150px] pt-2">Responsable</th>
                                                    <th className="sticky top-0 bg-slate-900 z-10 pb-3 px-2 text-left w-[80px] pt-2">Area</th>
                                                    <th className="sticky top-0 bg-slate-900 z-10 pb-3 px-2 text-left w-[100px] pt-2">Lugar</th>
                                                    <th className="sticky top-0 bg-slate-900 z-10 pb-3 px-2 text-left w-auto min-w-[220px] pt-2">Tema / Actividad</th>
                                                    <th className="sticky top-0 bg-slate-900 z-10 pb-3 px-2 text-center w-[120px] pt-2">Tipo</th>
                                                    <th className="sticky top-0 bg-slate-900 z-10 pb-3 px-2 text-right w-[80px] pt-2">Pers. Cap.</th>
                                                    <th className="sticky top-0 bg-slate-900 z-10 pb-3 px-2 text-right w-[80px] pt-2">Cant. HHC</th>
                                                    <th className="sticky top-0 bg-slate-900 z-10 pb-3 px-2 text-left w-[120px] pt-2">Archivo</th>
                                                    <th className="sticky top-0 bg-slate-900 z-10 pb-3 pl-2 pr-4 text-right pt-2">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {finalFilteredHistory
                                                    
                                                    .map((r, i) => {
                                                        const realRecordIndex = hhcRecords.findIndex(rec => rec === r);
                                                        return (
                                                            <tr key={i} className="hover:bg-slate-800/50 transition-colors group text-[11px]">
                                                                <td className="py-2 pl-4 pr-2 font-medium text-slate-300 w-[110px] whitespace-nowrap">{r.date}</td>
                                                                <td className="py-2 px-2 max-w-[150px] truncate text-slate-400" title={r.responsable || 'Sin asignar'}>{getInitials(r.responsable) || '-'}</td>
                                                                <td className="py-2 px-2 text-slate-500 uppercase text-[9px] font-bold max-w-[80px]">{r.area}</td>
                                                                <td className="py-2 px-2 text-slate-400 max-w-[100px] truncate" title={r.lugar || 'N/A'}>{r.lugar || '-'}</td>
                                                                <td className="py-2 px-2 font-medium text-white max-w-[220px] truncate" title={r.tema}>{r.tema}</td>
                                                                <td className="py-2 px-2 text-center w-[120px]">
                                                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${r.tipo === 'charla' ? 'bg-slate-700 text-slate-300' : 'bg-blue-900/40 text-blue-300 border border-blue-800/30'}`}>
                                                                        {(r.tipo || '').replace('_', ' ')}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2 px-2 text-right text-blue-400 font-bold font-mono text-[10px] w-[80px]">{(Number(r.hombres) || 0) + (Number(r.mujeres) || 0)}</td>
                                                                <td className="py-2 px-2 text-right text-indigo-400 font-bold font-mono text-[10px] w-[80px]">
                                                                    {(() => {
                                                                        const total = (Number(r.hombres) || 0) + (Number(r.mujeres) || 0);
                                                                        const duration = FORMATION_DURATIONS[r.tipo] || 0;
                                                                        return (total * duration).toFixed(1);
                                                                    })()}
                                                                </td>
                                                                <td className="py-2 px-2 text-left w-[120px]">
                                                                    <div className="flex flex-col gap-1">
                                                                        {r.evidencePdf ? (
                                                                            <span className="text-[9px] text-slate-400 truncate w-[110px] block" title={generateFilename(r.tema, r.date, r.responsable, 'pdf', r.tipo, undefined, r.area)}>
                                                                                {generateFilename(r.tema, r.date, r.responsable, 'pdf', r.tipo, undefined, r.area)}
                                                                            </span>
                                                                        ) : r.evidenceImgs && r.evidenceImgs.length > 0 ? (
                                                                            <span className="text-[9px] text-slate-400 truncate w-[110px] block" title={generateFilename(r.tema, r.date, r.responsable, 'jpg', r.tipo, undefined, r.area)}>
                                                                                {generateFilename(r.tema, r.date, r.responsable, 'jpg', r.tipo, undefined, r.area)} (Img)
                                                                            </span>
                                                                        ) : <span className="text-slate-600 text-[9px]">-</span>}
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 text-right pr-2">
                                                                    <div className="flex justify-end gap-2 transition-opacity">
                                                                        {/* PDF EVIDENCE DOWNLOAD */}
                                                                        {r.evidencePdf && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    const link = document.createElement('a');
                                                                                    link.href = r.evidencePdf;
                                                                                    link.download = generateFilename(r.tema, r.date, r.responsable, 'pdf', r.tipo, undefined, r.area);
                                                                                    document.body.appendChild(link);
                                                                                    link.click();
                                                                                    document.body.removeChild(link);
                                                                                }}
                                                                                className="text-red-400 hover:bg-red-500/10 p-1 rounded" title="Descargar Evidencia PDF"
                                                                            >
                                                                                <FileText size={14} />
                                                                            </button>
                                                                        )}
                                                                        {/* IMG EVIDENCE VIEW */}
                                                                        {r.evidenceImgs && r.evidenceImgs.length > 0 && (
                                                                            <button
                                                                                onClick={() => setViewingImages({tema: r.tema || '', imgs: r.evidenceImgs})}
                                                                                className="text-purple-400 hover:bg-purple-500/10 p-1 rounded" title="Ver Imágenes"
                                                                            >
                                                                                <ImageIcon size={14} />
                                                                            </button>
                                                                        )}

                                                                        <button onClick={() => generateRecordPDF(r)} className="text-emerald-400 hover:bg-emerald-500/10 p-1 rounded" title="Exportar PDF"><Download size={14} /></button>

                                                                        <button type="button" onClick={() => handleEditHHC(realRecordIndex)} className="text-blue-400 hover:bg-blue-500/10 p-1 rounded" title="Editar"><Edit size={14} /></button>
                                                                        <button type="button" onClick={() => handleDeleteHHC(realRecordIndex)} className="text-red-400 hover:bg-red-500/10 p-1 rounded" title="Eliminar"><Trash2 size={14} /></button>
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
                        </div>
                        {/* Modal de Programa Mensual */}
                        {showProgramModal && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-3xl w-full max-w-[calc(100vw-2rem)] md:max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                                    <div className="p-6 border-b border-slate-700">
                                        <div className="flex justify-between items-start md:items-center">
                                            <h3 className="text-lg md:text-xl font-black text-white pr-4">📅 Programa Mensual de Capacitaciones</h3>
                                            <button
                                                onClick={() => setShowProgramModal(false)}
                                                className="text-slate-400 hover:text-white transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2">Gestiona las actividades programadas para autocompletar el registro</p>
                                    </div>

                                    <div className="p-4 md:p-6 overflow-y-auto overflow-x-hidden flex-1 min-w-0">
                                        {isDeveloper && (
                                            <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700">
                                                <h4 className="text-sm font-bold text-emerald-400 mb-3">Agregar Actividad Programada</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Fecha</label>
                                                        <input
                                                            type="date"
                                                            value={newProgram.date}
                                                            onChange={(e) => setNewProgram({ ...newProgram, date: e.target.value })}
                                                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Tema</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Nombre del tema..."
                                                            value={newProgram.tema}
                                                            onChange={(e) => setNewProgram({ ...newProgram, tema: e.target.value })}
                                                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Área</label>
                                                        <select
                                                            value={newProgram.area}
                                                            onChange={(e) => setNewProgram({ ...newProgram, area: e.target.value as any })}
                                                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500"
                                                        >
                                                            <option value="seguridad">SEGURIDAD</option>
                                                            <option value="salud">SALUD</option>
                                                            <option value="ambiente">MEDIO AMBIENTE</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Tipo</label>
                                                        <select
                                                            value={newProgram.tipo}
                                                            onChange={(e) => setNewProgram({ ...newProgram, tipo: e.target.value as any })}
                                                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-emerald-500"
                                                        >
                                                            <option value="induccion_gen">INDUCCIÓN GENERAL</option>
                                                            <option value="induccion_esp">INDUCCIÓN ESPECÍFICA</option>
                                                            <option value="capacitacion">CAPACITACIÓN</option>
                                                            <option value="difusion">DIFUSIÓN</option>
                                                            <option value="entrenamiento">ENTRENAMIENTO</option>
                                                            <option value="charla">CHARLA</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 mt-3">
                                                    <div>
                                                        <input
                                                            type="file"
                                                            accept=".xlsx,.xls"
                                                            onChange={handleExcelImport}
                                                            className="hidden"
                                                            id="excel-upload"
                                                        />
                                                        <label
                                                            htmlFor="excel-upload"
                                                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            📊 Importar Excel
                                                        </label>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (newProgram.date && newProgram.tema) {
                                                                setTrainingProgram([...trainingProgram, newProgram].sort((a, b) => a.date.localeCompare(b.date)));
                                                                setNewProgram({ date: '', tema: '', area: 'seguridad', tipo: 'capacitacion' });
                                                            }
                                                        }}
                                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-lg transition-colors"
                                                    >
                                                        ➕ Agregar Manual
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 mb-3">
                                                <h4 className="text-sm font-bold text-blue-400">Actividades Programadas</h4>

                                                {/* FILTER CONTROLS */}
                                                <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                                                {/* BOTÓN DE TEMARIO MENSUAL (PROGRAMA) */}
                                                <div className="flex flex-wrap items-center gap-2 md:ml-4 border-l border-slate-700 md:pl-4">
                                                    <input 
                                                        type="file" 
                                                        accept="application/pdf" 
                                                        className="hidden" 
                                                        ref={fileInputRef} 
                                                        onChange={handleUploadTemario} 
                                                    />
                                                    {monthlyTemarioUrl ? (
                                                        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-indigo-500/50 shadow-inner">
                                                            {/* VER */}
                                                            <a href={monthlyTemarioUrl} target="_blank" rel="noopener noreferrer" title="Ver Temario" className="flex items-center gap-1.5 text-[10px] text-white font-bold px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 rounded transition-colors shadow-lg shadow-indigo-500/20">
                                                                <Eye size={12} /> Ver
                                                            </a>
                                                            
                                                            {/* DESCARGAR */}
                                                            <a href={monthlyTemarioUrl.replace('/view?usp=drivesdk', '/export?format=pdf').replace('/view', '/export?format=pdf')} target="_blank" rel="noopener noreferrer" title="Descargar PDF" className="text-slate-400 hover:text-emerald-400 p-1.5 rounded hover:bg-slate-700 transition-colors">
                                                                <Download size={12} />
                                                            </a>

                                                            {/* ACTUALIZAR */}
                                                            <button 
                                                                onClick={() => fileInputRef.current?.click()} 
                                                                disabled={isUploadingTemario}
                                                                className="text-slate-400 hover:text-blue-400 p-1.5 rounded hover:bg-slate-700 transition-colors"
                                                                title="Actualizar Temario"
                                                            >
                                                                <UploadCloud size={12} className={isUploadingTemario ? "animate-pulse" : ""} />
                                                            </button>

                                                            {/* ELIMINAR */}
                                                            <button 
                                                                onClick={handleDeleteTemario} 
                                                                disabled={isUploadingTemario}
                                                                className="text-slate-400 hover:text-red-400 p-1.5 rounded hover:bg-slate-700 transition-colors"
                                                                title="Eliminar Temario"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div 
                                                            onDragOver={handleDragOver}
                                                            onDragLeave={handleDragLeave}
                                                            onDrop={handleDrop}
                                                            className={`flex items-center transition-all ${isDraggingTemario ? 'scale-105 opacity-90' : ''}`}
                                                        >
                                                            <button 
                                                                onClick={() => fileInputRef.current?.click()}
                                                                disabled={isUploadingTemario}
                                                                className={`flex items-center gap-1.5 text-[10px] text-white font-bold px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border ${isDraggingTemario ? 'border-emerald-500 shadow-emerald-500/50' : 'border-indigo-500/30 hover:border-indigo-500/60 shadow-indigo-500/10'} rounded transition-all shadow-lg disabled:opacity-50`}
                                                            >
                                                                {isUploadingTemario ? <Loader2 className="animate-spin" size={12} /> : <UploadCloud size={12} className={isDraggingTemario ? "text-emerald-400" : "text-indigo-400"} />}
                                                                {isUploadingTemario ? "Cargando..." : (isDraggingTemario ? "Suelta el PDF aquí" : "Cargar Temario")}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                    <select
                                                        value={programMonthFilter}
                                                        onChange={(e) => setProgramMonthFilter(Number(e.target.value))}
                                                        className="bg-slate-900 border border-slate-600 text-[10px] text-white rounded px-2 py-1 outline-none focus:border-blue-500"
                                                    >
                                                        {MONTHS.map((m, i) => <option key={i} value={i}>{m.toUpperCase()}</option>)}
                                                    </select>

                                                    {isDeveloper && (
                                                        <button
                                                            onClick={handleDeleteProgramMonth}
                                                            className="bg-red-900/50 hover:bg-red-900 text-red-400 border border-red-800/50 rounded px-2 py-1 transition-colors group"
                                                            title="Eliminar todo el mes seleccionado"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="overflow-x-auto w-full max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                                                <table className="w-full text-left text-[10px] min-w-[400px]">
                                                    <thead>
                                                        <tr className="text-slate-500 border-b border-slate-700">
                                                            <th className="pb-2">MES</th>
                                                            <th className="pb-2">FECHA</th>
                                                            <th className="pb-2">TEMA</th>
                                                            <th className="pb-2">ÁREA</th>
                                                            <th className="pb-2">TIPO</th>
                                                            <th className="pb-2 text-right">ACCIÓN</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-slate-300">
                                                        {trainingProgram
                                                            .filter(prog => {
                                                                // Filter by selected month
                                                                const d = new Date(prog.date + 'T12:00:00');
                                                                return d.getMonth() === programMonthFilter && d.getFullYear() === currentYear;
                                                            })
                                                            .map((prog, idx) => (
                                                                <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30 group">
                                                                    <td className="py-2 text-xs font-bold text-slate-400">
                                                                        {new Date(prog.date + 'T12:00:00').toLocaleString('es-ES', { month: 'long' }).toUpperCase()}
                                                                    </td>
                                                                    <td className="py-2 font-bold">{prog.date}</td>
                                                                    <td className="py-2">{prog.tema}</td>
                                                                    <td className="py-2">
                                                                        <span className={`text-[8px] uppercase px-1 rounded-sm ${prog.area === 'seguridad' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                            prog.area === 'salud' ? 'bg-pink-500/20 text-pink-400' :
                                                                                'bg-blue-500/20 text-blue-400'
                                                                            }`}>{prog.area}</span>
                                                                    </td>
                                                                    <td className="py-2 text-slate-400">{prog.tipo.replace('_', ' ').toUpperCase()}</td>
                                                                    <td className="py-2 text-right">
                                                                        {/* Note: Delete single item not yet implemented in API efficiently for lists, showing only bulk delete for month is safer for now or local delete */}
                                                                        {isDeveloper && (
                                                                            <button
                                                                                onClick={() => {
                                                                                    // TODO: Implement single delete API if needed
                                                                                    // For now local delete:
                                                                                    setTrainingProgram(prev => prev.filter(p => p !== prog));
                                                                                }}
                                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-400 transition-opacity"
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
            )}

            {/* PREVIEW MODAL PARA IMAGENES DE FORMACION */}
            {viewingImages && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setViewingImages(null)}>
                    <div className="relative bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50">
                            <h3 className="text-white font-bold flex items-center gap-2">
                                <ImageIcon size={20} className="text-blue-400" />
                                Evidencia Fotográfica: {viewingImages.tema}
                            </h3>
                            <button onClick={() => setViewingImages(null)} className="p-2 hover:bg-red-900/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto bg-black/50 flex flex-col items-center p-4 gap-4">
                            {viewingImages.imgs.map((img: string, idx: number) => (
                                <iframe 
                                    key={idx} 
                                    src={getDriveViewerUrl(img, false)} 
                                    title={`Evidencia ${idx + 1}`} 
                                    className="w-full h-full min-h-[60vh] object-contain rounded-lg shadow-2xl border border-slate-800" 
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {/* Performance Detail Modal */}
            {performanceDetail && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setPerformanceDetail(null)} />
                    <div className="relative w-full max-w-5xl bg-slate-900/90 border border-slate-800 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-300">
                        {/* Header */}
                        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl shadow-xl">
                                    <ClipboardCheck size={32} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white">
                                        Seguimiento de Rendimiento 
                                        <span className="text-indigo-400 ml-2">
                                            - {currentMonth !== -1 ? MONTHS[currentMonth].toUpperCase() : `AÑO ${currentYear}`}
                                        </span>
                                    </h3>
                                    <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Responsable: {performanceDetail.userName}</p>
                                </div>
                            </div>
                            <button onClick={() => setPerformanceDetail(null)} className="p-3 hover:bg-slate-800 rounded-2xl text-slate-400 transition-all hover:rotate-90">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Three Column Content */}
                        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                            {/* Column 1: Programmed (Left) */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/40 scrollbar-thin scrollbar-thumb-slate-700">
                                <div className="flex items-center gap-2 mb-4 px-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Programadas ({performanceDetail.pendingItems.length + performanceDetail.executedItems.filter((i:any) => !i.isExtra).length})</h4>
                                </div>
                                {(() => {
                                    const programmedItems = [...performanceDetail.pendingItems, ...performanceDetail.executedItems.filter((i:any) => !i.isExtra)].sort((a:any, b:any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
                                    return programmedItems.length === 0 ? (
                                        <div className="py-10 text-center text-slate-600 border border-dashed border-slate-800 rounded-2xl">
                                            <p className="text-[10px] font-bold">Sin actividades programadas</p>
                                        </div>
                                    ) : (
                                        programmedItems.map((item:any, idx:number) => (
                                            <div key={idx} className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3 hover:border-blue-500/30 transition-all">
                                                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">{item.objectiveName}</p>
                                                <h5 className="text-[10px] font-bold text-white line-clamp-2">{item.description}</h5>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-[8px] text-slate-500 flex items-center gap-1 font-bold">
                                                        <Calendar size={10} /> {item.date}
                                                    </span>
                                                    <span className="text-[8px] font-black text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase">Programado</span>
                                                </div>
                                            </div>
                                        ))
                                    );
                                })()}
                            </div>

                            {/* Column 2: Executed (Middle) */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-800 scrollbar-thin scrollbar-thumb-slate-700">
                                <div className="flex items-center gap-2 mb-4 px-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                    <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Realizadas ({performanceDetail.executedItems.length})</h4>
                                </div>
                                
                                {performanceDetail.executedItems.length === 0 ? (
                                    <div className="py-10 text-center text-slate-600 border border-dashed border-slate-800 rounded-2xl">
                                        <p className="text-[10px] font-bold">Sin registros ejecutados</p>
                                    </div>
                                ) : (
                                    [...performanceDetail.executedItems].sort((a:any, b:any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).map((item:any, idx:number) => {
                                        const r = item.realRecord || {};
                                        const fileLink = r.pdfUrl || r.evidenceUrl || r.fileUrl || r.evidencePdf || (r.images && r.images[0]) || (r.evidenceImgs && r.evidenceImgs[0]) || (r.fileUrls && r.fileUrls[0]) || null;
                                        
                                        return (
                                            <div key={idx} className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-3 hover:border-emerald-500/30 transition-all">
                                                <div className="flex items-start justify-between">
                                                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">{item.objectiveName}</p>
                                                    {fileLink && (
                                                        <a href={fileLink} target="_blank" rel="noopener noreferrer" className="text-[8px] font-black text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-full transition-colors border border-emerald-500/20" title="Ver archivo adjunto">
                                                            🔗 Evidencia
                                                        </a>
                                                    )}
                                                </div>
                                                <h5 className="text-[10px] font-bold text-white line-clamp-2 mt-1">{item.description}</h5>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-[8px] text-slate-500 flex items-center gap-1 font-bold">
                                                        <Calendar size={10} /> {item.date}
                                                    </span>
                                                    <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">Completado</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Column 3: Pending (Right) */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/20 scrollbar-thin scrollbar-thumb-slate-700">
                                <div className="flex items-center gap-2 mb-4 px-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Pendientes ({performanceDetail.pendingItems.length})</h4>
                                </div>

                                {performanceDetail.pendingItems.length === 0 ? (
                                    <div className="py-10 text-center text-slate-600 border border-dashed border-slate-800 rounded-2xl">
                                        <p className="text-[10px] font-bold">¡Todo al día!</p>
                                    </div>
                                ) : (
                                    [...performanceDetail.pendingItems].sort((a:any, b:any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).map((item:any, idx:number) => (
                                        <div key={idx} className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3 hover:border-amber-500/30 transition-all">
                                            <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">{item.objectiveName}</p>
                                            <h5 className="text-[10px] font-bold text-white line-clamp-2">{item.description}</h5>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[8px] text-slate-500 flex items-center gap-1 font-bold">
                                                    <Calendar size={10} /> {item.date}
                                                </span>
                                                <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase">Pendiente</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        
                        {/* Footer Summary */}
                        <div className="p-5 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center px-8">
                            <div className="flex gap-4 md:gap-6 flex-wrap">
                                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                                    Programadas: {performanceDetail.executedItems.length + performanceDetail.pendingItems.length}
                                </span>
                                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                                    Ejecutadas: {performanceDetail.executedItems.length}
                                </span>
                                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">
                                    Pendientes: {performanceDetail.pendingItems.length}
                                </span>
                                <span className="text-[10px] text-white bg-indigo-500/20 px-2 py-0.5 rounded-md font-black uppercase tracking-widest ml-2">
                                    Eficacia: {Math.round((performanceDetail.executedItems.length / (performanceDetail.executedItems.length + performanceDetail.pendingItems.length || 1)) * 100)}%
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-indigo-500/10 px-4 py-1.5 rounded-xl border border-indigo-500/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Visión Ejecutiva 2026</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}







