"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth, USER_LIST } from '@/lib/auth';
import { saveMonthlyProgram, getMonthlyProgram, saveInspection, getInspections, deleteInspectionRecord, syncProgramToDashboard } from '@/app/actions';
import { ChevronDown } from 'lucide-react';
import { uploadEvidence } from '@/lib/uploadClient';
import Sidebar from '@/components/Sidebar';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ComplianceGauge } from "@/components/dashboard/ComplianceGauge";
import {
    ClipboardCheck,
    Calendar,
    User,
    MapPin,
    AlertCircle,
    Search,
    Filter,
    FileText,
    Download,
    Shield,
    Activity as ActivityIcon,
    TrendingUp,
    Trash2,
    Settings,
    X,
    Image as ImageIcon
} from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { generateFilename, getInitials } from '@/lib/utils';

// Tipos de datos
type InspectionRecord = {
    id: number;
    date: string;
    responsible: string;
    inspectionType: string;
    area: 'Seguridad' | 'Salud' | 'Medioambiente';
    zone: string;
    status: 'Pendiente' | 'En Proceso' | 'Completado';
    observations: string;
    evidencePdf?: string;
    evidenceImgs?: string[];
};

// Listas de opciones
const INITIAL_RESPONSIBLES = USER_LIST.map(user => user.name);

const AREAS = [
    "Seguridad",
    "Salud",
    "Medioambiente"
];

import { SSOMA_LOCATIONS } from '@/lib/locations';

const INITIAL_ZONES = SSOMA_LOCATIONS;

// Lista de Tipos de Inspección
// Lista de Tipos de Inspección por Área
const INSPECTION_TYPES_BY_AREA = {
    "Seguridad": [
        "Inspecciones y observaciones maquinaria Línea amarilla",
        "Inspecciones y observaciones vehículos",
        "Inspección de Equipos de Emergencia (Extintores)",
        "Inspección de Herramientas manuales y eléctricas",
        "Inspección de generador, tableros eléctrico",
        "Inspección de taller de soldadura/mecanico",
        "Inspección de EPP básico o especifico",
        "Inspección de Señalización Vial",
        "Inspección de vías de acceso y bermas de seguridad",
        "Inspección de Señalización de Obra",
        "Inspección de almacenes",
        "Inspección del almacén de productos químicos MSDS",
        "Inspección de orden y limpieza de áreas de trabajo",
        "Inspección de escalera o andamios",
        "Inspección de Equipo contra caídas",
        "Inspeccion de oficinas",
        "Inspeccion de laboratorio",
        "Inspeccion de planta de asfalto",
        "Inspeccion de planta de concreto",
        "Inspeccion de planta de Chancado",
        "Inspeccion de almacen de combustible"
    ],
    "Salud": [
        "Inspecciones botiquines",
        "Inspecciones Estaciones de emergencia",
        "Inspección de puntos de hidratacion",
        "Inspección punto de proteccion solar",
        "Inspección de lavaderos de SSHH y mano",
        "Inspección de Cocina y comedor",
        "Inspección de EPP",
        "Inspección de señalización de salud",
        "Inspección de Topico",
        "Inspección de Alcotest"
    ],
    "Medioambiente": [
        "Inspecciones de estaciones de residuos por colores",
        "Inspecciones de almacén de acopio temporal de residuos sólidos",
        "Inspecciones de la segregación",
        "Inspecciones de almacén de acopio temporal de residuos peligrosos",
        "Inspección de trampas de grasas de talleres",
        "Inspección de controles de polución",
        "Inspección de controles de ruido",
        "Inspección de Kit antiderrames",
        "Inspección de Señalización Medio ambiental",
        "Inspección de limpieza de accesos y vías"
    ]
};

export default function InspectionsPage() {
    const { user } = useAuth();

    // MASTER DATA (Dynamic from Storage)
    // We use capitalized names to match existing code usage (RESPONSIBLES.map...)
    const [RESPONSIBLES, setRESPONSIBLES] = useState<string[]>(INITIAL_RESPONSIBLES);
    const [ZONES, setZONES] = useState<string[]>(INITIAL_ZONES);

    useEffect(() => {
        // Load Master Data updates
        if (typeof window !== 'undefined') {
            const storedR = localStorage.getItem('ssoma_responsibles');
            const storedZ = localStorage.getItem('ssoma_zones');
            if (storedR) setRESPONSIBLES(JSON.parse(storedR));
            if (storedZ) setZONES(JSON.parse(storedZ));
        }
    }, []);

    // Estado de Cuotas por Usuario (Inicializado en 4)
    const [userQuotas, setUserQuotas] = useState<Record<string, number>>(() => {
        const initial: Record<string, number> = {};
        INITIAL_RESPONSIBLES.forEach(r => initial[r] = 4);
        return initial;
    });

    // Sync Quotas with dynamic responsibles
    useEffect(() => {
        setUserQuotas(prev => {
            const next = { ...prev };
            RESPONSIBLES.forEach(r => {
                if (next[r] === undefined) next[r] = 4;
            });
            return next;
        });
    }, [RESPONSIBLES]);
    const [showGoals, setShowGoals] = useState(true);
    const [showQuotaSettings, setShowQuotaSettings] = useState(false);

    // Estado para el formulario
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        responsible: '',
        inspectionType: '',
        area: 'Seguridad',
        zone: '',
        observations: ''
    });

    // Estado para evidencias
    const [newEvidence, setNewEvidence] = useState<{ pdf: string, imgs: string[] }>({ pdf: '', imgs: [] });
    const [isUploading, setIsUploading] = useState(false);

    // Estado para la lista de inspecciones (Datos de ejemplo iniciales)
    const [inspections, setInspections] = useState<InspectionRecord[]>([
        {
            id: 1,
            date: '2025-01-15',
            responsible: 'Jose Galliquio',
            inspectionType: 'Inspección de EPP',
            area: 'Seguridad',
            zone: 'PAD Chinchaysullo',
            status: 'Completado',
            observations: 'Todo conforme',
            evidencePdf: '',
            evidenceImgs: []
        },
        {
            id: 2,
            date: '2025-01-16',
            responsible: 'Albert Chuquisapon',
            inspectionType: 'Inspecciones de la segregacion',
            area: 'Medioambiente',
            zone: 'Zona Industrial Sanclemente',
            status: 'Pendiente',
            observations: 'Falta señalización en contenedores'
        }
    ]);

    const [isLoaded, setIsLoaded] = useState(false);

    // Estado para el Programa Mensual (Importado)
    const [monthlyProgram, setMonthlyProgram] = useState<any[]>([]);

    // Filtro de Mes
    const MONTH_NAMES = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [showProgramModal, setShowProgramModal] = useState(false);
    const [viewingEvidence, setViewingEvidence] = useState<InspectionRecord | null>(null);

    // IMPORT LOGIC STATES
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showImportMenu, setShowImportMenu] = useState(false);
    const [importType, setImportType] = useState<string>('General');

    const triggerImport = (type: string) => {
        setImportType(type);
        setTimeout(() => fileInputRef.current?.click(), 0);
        setShowImportMenu(false);
    };

    const deleteProgramByArea = (targetArea: string) => {
        if (!confirm(`¿Eliminar programación de ${targetArea} para ${MONTH_NAMES[selectedMonth]}?`)) return;

        setMonthlyProgram(prev => {
            const newProgram = prev.filter(item => {
                const isSameMonth = item.month === selectedMonth;
                const isSameArea = item.area === targetArea;
                return !(isSameMonth && isSameArea);
            });

            if (isLoaded) {
                localStorage.setItem('monthly_inspections_program', JSON.stringify(newProgram));
            }
            return newProgram;
        });
        setShowImportMenu(false);
    };

    // PERSISTENCIA
    useEffect(() => {
        const storedQuotas = localStorage.getItem('user_quotas');
        if (storedQuotas) {
            setUserQuotas(JSON.parse(storedQuotas));
        }

        // Load Inspections from DB
        getInspections().then(res => {
            if (res.success && res.data) {
                setInspections(res.data);
            }
        });

        // Load Program from DB
        getMonthlyProgram().then(res => {
            if (res.success && res.data) {
                setMonthlyProgram(res.data);
            }
        });

        setIsLoaded(true);
    }, []);

    // DRAFT PERSISTENCE - Save current form state
    useEffect(() => {
        localStorage.setItem('inspections_form_draft_v1', JSON.stringify(formData));
    }, [formData]);

    // DRAFT LOAD
    useEffect(() => {
        const savedDraft = localStorage.getItem('inspections_form_draft_v1');
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                // Solo cargar si el formulario actual está mayormente vacío (excepto fecha por defecto)
                if (!formData.responsible && !formData.inspectionType) {
                    setFormData(prev => ({ ...prev, ...draft }));
                }
            } catch (e) {
                console.error("Error loading inspections draft", e);
            }
        }
    }, []);

    // PERSISTENCIA (Solo Quotas ahora, lo demas es DB)
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('user_quotas', JSON.stringify(userQuotas));
        }
    }, [userQuotas, isLoaded]);

    // Función para actualizar metas manuales
    const updateQuota = (responsible: string, increment: boolean) => {
        setUserQuotas(prev => {
            const current = prev[responsible] !== undefined ? prev[responsible] : 4;
            const newValue = increment ? current + 1 : Math.max(0, current - 1);
            return { ...prev, [responsible]: newValue };
        });
    };

    // Importar Programa Mensual
    const handleProgramImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const arrayBuffer = evt.target?.result;
            const wb = XLSX.read(arrayBuffer, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

            const parsedItems: any[] = [];
            const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

            // Detección de Formato
            // Buscamos si existe una columna "Responsable" en las primeras 20 filas
            let isFormatB = false; // Formato Lista (Filas=Responsables, Cols=Sedes)
            let headerRowIndex = -1;

            for (let i = 0; i < Math.min(20, data.length); i++) {
                const row = data[i];
                if (row && row.some((c: any) => c && typeof c === 'string' && c.toLowerCase().trim() === 'responsable')) {
                    isFormatB = true;
                    headerRowIndex = i;
                    break;
                }
            }

            if (isFormatB) {
                // Lógica Formato B (Lista de Responsables)
                const headerRow = data[headerRowIndex];
                const respIdx = headerRow.findIndex((c: any) => c?.toString().toLowerCase().trim() === 'responsable');
                const monthIdx = headerRow.findIndex((c: any) => c?.toString().toLowerCase().trim() === 'mes');
                const typeIdx = headerRow.findIndex((c: any) => c?.toString().toLowerCase().includes('tipo')); // Tipo de Inspección

                // Las columnas de sedes son las que NO son las anteriores y tienen contenido
                const locationIndices: number[] = [];
                for (let j = 0; j < headerRow.length; j++) {
                    if (j !== respIdx && j !== monthIdx && j !== typeIdx && headerRow[j]) {
                        locationIndices.push(j);
                    }
                }

                for (let i = headerRowIndex + 1; i < data.length; i++) {
                    const row = data[i];
                    if (!row || !row[respIdx]) continue;

                    const responsible = row[respIdx].toString().trim();
                    if (responsible.toLowerCase().includes('total')) continue;

                    const type = typeIdx !== -1 ? row[typeIdx] : 'Inspección';
                    const rawMonth = row[monthIdx]?.toString().toLowerCase().trim() || '';

                    let mIndex = monthNames.indexOf(rawMonth);
                    if (mIndex === -1) {
                        // Intentar parsear si es fecha excel
                        if (typeof row[monthIdx] === 'number') {
                            const jsDate = new Date((row[monthIdx] - (25567 + 1)) * 86400 * 1000);
                            if (!isNaN(jsDate.getTime())) mIndex = jsDate.getMonth();
                        }
                    }

                    // Calcular cantidad sumando "1"s en columnas de sedes
                    let quantity = 0;
                    locationIndices.forEach(locIdx => {
                        const val = row[locIdx];
                        if (val == 1 || val === '1' || val === true) {
                            quantity++;
                        }
                    });

                    // Añadir items individuales para que el conteo funcione
                    for (let k = 0; k < quantity; k++) {
                        parsedItems.push({
                            responsible,
                            type,
                            quantity: 1,
                            month: selectedMonth, // Force selected month as per user request
                            area: importType === 'General' ? 'General' : importType
                        });
                    }
                }

            } else {
                // Estructura para el parseo dinámico (Formato A - Matriz)
                let responsibleMap: { index: number, name: string }[] = [];
                let typeColIdx = -1;
                let dateColIdx = -1;
                let areaColIdx = -1;
                let isParsing = false;

                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    if (!row || row.length === 0) continue;

                    // 1. Detectar Nueva Sección por Encabezado
                    const typeHeaderIdx = row.findIndex((c: any) => c && typeof c === 'string' && c.toLowerCase().includes('tipo de inspección'));

                    if (typeHeaderIdx !== -1) {
                        isParsing = true;
                        typeColIdx = typeHeaderIdx;

                        // Buscar columnas relativas a este encabezado
                        dateColIdx = row.findIndex((c: any) => c && typeof c === 'string' && c.toLowerCase().includes('fecha'));
                        if (dateColIdx === -1) dateColIdx = 0;

                        areaColIdx = row.findIndex((c: any) => c && typeof c === 'string' && c.toLowerCase().includes('area'));
                        if (areaColIdx === -1) areaColIdx = 2; // Default C

                        // Mapear Responsables (Columnas a la derecha de Tipo)
                        responsibleMap = [];
                        for (let j = typeColIdx + 1; j < row.length; j++) {
                            const cellVal = row[j];
                            if (cellVal && typeof cellVal === 'string' && cellVal.trim() !== '' && !cellVal.toLowerCase().includes('total')) {
                                responsibleMap.push({ index: j, name: cellVal.trim() });
                            }
                        }
                        continue;
                    }

                    if (!isParsing) continue;

                    // 2. Parsear Fila
                    const firstCell = row[0]?.toString().toLowerCase();
                    if (firstCell && firstCell.includes('total')) continue;

                    const type = row[typeColIdx];
                    if (!type) continue;

                    // Fecha/Mes
                    const rawDate = row[dateColIdx];
                    let monthIdx = -1;
                    if (typeof rawDate === 'number') {
                        const jsDate = new Date((rawDate - (25567 + 1)) * 86400 * 1000);
                        if (!isNaN(jsDate.getTime())) monthIdx = jsDate.getMonth();
                    } else if (typeof rawDate === 'string') {
                        const parts = rawDate.split('/');
                        if (parts.length >= 2) monthIdx = parseInt(parts[1]) - 1;
                    }

                    const area = row[areaColIdx]?.toString() || (importType === 'General' ? 'General' : importType);

                    // Mapear
                    responsibleMap.forEach(r => {
                        const val = row[r.index];
                        if (val == 1 || (typeof val === 'number' && val > 0) || (typeof val === 'string' && val.trim() === '1')) {
                            parsedItems.push({
                                responsible: r.name,
                                type: type,
                                quantity: 1,
                                month: selectedMonth, // Force selected month as per user request
                                area: area
                            });
                        }
                    });
                }
            }

            // REGLA DE NEGOCIO: Si es importación de SALUD, asignar todo a Gladis Aroste force
            if (importType === 'Salud') {
                parsedItems.forEach(item => {
                    item.responsible = "Gladis Aroste";
                });
            }

            if (parsedItems.length === 0) {
                alert("⚠️ No se encontraron datos válidos. Verifique el formato del Excel.");
                return;
            }

            setMonthlyProgram(prev => {
                let newProgram;
                if (importType === 'General') {
                    // Si es importación general, reemplazamos todo
                    newProgram = parsedItems;
                } else {
                    // Si es específico (ej. Seguridad), borramos SOLO lo de esa área EN EL MES SELECCIONADO y sumamos lo nuevo
                    const others = prev.filter(p => !(p.area === importType && p.month === selectedMonth));
                    newProgram = [...others, ...parsedItems];
                }


                // SAVE TO DB
                saveMonthlyProgram(parsedItems, importType, selectedMonth)
                    .then(res => {
                        if (res.success) {
                            console.log("Guardado en Servidor");
                            // Also sync to Main Dashboard
                            syncProgramToDashboard(parsedItems).then(r => console.log("Dashboard Sincronizado:", r.success));
                        }
                        else alert("Error al sincronizar con servidor");
                    });

                if (isLoaded) {
                    localStorage.setItem('monthly_inspections_program', JSON.stringify(newProgram));
                }
                return newProgram;
            });

            alert(`✅ Programa (${importType}) importado correctamente. ${parsedItems.length} registros detectados.`);
        };
        reader.readAsArrayBuffer(file);
        e.target.value = '';
    };

    // Helper para calcular progreso con filtro de Mes
    const getProgressStats = (responsibleName: string) => {
        const currentYear = new Date().getFullYear();

        // 1. EJECUTADO: Contar registros del mes seleccionado
        const executed = inspections.filter(i => {
            const d = new Date(i.date + 'T00:00:00');
            return i.responsible === responsibleName &&
                d.getMonth() === selectedMonth &&
                d.getFullYear() === currentYear;
        }).length;

        // 2. PROGRAMADO: Filtrar del programa importado
        const programItems = monthlyProgram.filter(p => {
            // Match de Nombre (Flexible: Primer nombre o contiene)
            const nameMatch = p.responsible && (
                p.responsible.toLowerCase().includes(responsibleName.toLowerCase()) ||
                responsibleName.toLowerCase().includes(p.responsible.toLowerCase().split(' ')[0])
            );
            return nameMatch;
        });

        let planned = 0;

        // Filtramos por mes seleccionado
        const monthlySpecificItems = programItems.filter(p => p.month === selectedMonth || p.month === -1);

        if (monthlySpecificItems.length > 0) {
            const isGladis = responsibleName.toLowerCase().includes('gladis');

            const areaFiltered = monthlySpecificItems.filter(p => {
                if (!p.area) return true;
                const a = (p.area || '').toLowerCase();

                if (isGladis) {
                    // Gladis: Se le programa todo lo asignado (especialmente Salud)
                    return true;
                } else {
                    // Otros: Excluir Salud estrictamente. Solo Seguridad y Medio Ambiente.
                    if (a.includes('salud')) return false;
                    return a.includes('seguridad') || a.includes('ambiente') || a.includes('environment');
                }
            });

            planned = areaFiltered.reduce((acc, item) => acc + item.quantity, 0);
        } else {
            planned = userQuotas[responsibleName] !== undefined ? userQuotas[responsibleName] : 4; // Fallback manual
        }

        const percent = planned > 0 ? (executed / planned) * 100 : 0;

        return { executed, planned, percent };
    };

    // Efecto para asegurar que si el usuario cambia, el form se actualice (opcional pero seguro)
    useEffect(() => {
        if (user && user.role === 'user') {
            setFormData(prev => ({ ...prev, responsible: user.name }));
        }
    }, [user]);

    // Filtros
    const [filterResponsible, setFilterResponsible] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterZone, setFilterZone] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterArea, setFilterArea] = useState('Todas');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!formData.inspectionType || !formData.responsible || !formData.area || !formData.zone) {
            alert("⚠️ Por favor seleccione TIPO DE INSPECCIÓN, ÁREA, LUGAR y RESPONSABLE antes de subir el archivo para nombrarlo correctamente.");
            e.target.value = '';
            return;
        }

        try {
            setIsUploading(true);
            const url = await uploadEvidence(
                file,
                'Inspeccion',
                formData.inspectionType,
                formData.date,
                formData.responsible,
                'inspeccion', // Pasamos el tipo
                formData.area, // Pasamos el área (Seguridad, Salud, Medioambiente)
                formData.zone // Pasamos el lugar (location del form)
            );
            setNewEvidence(prev => ({ ...prev, pdf: url }));
            alert("✅ Al momento de cargar se cargó con éxito su archivo o imagen para saber que se registró");
        } catch (error: any) {
            alert(`Error al subir PDF: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        if (newEvidence.imgs.length + files.length > 5) {
            alert('⚠️ Máximo 5 imágenes permitidas.');
            return;
        }

        if (!formData.inspectionType || !formData.responsible || !formData.area || !formData.zone) {
            alert("⚠️ Por favor seleccione primero el TIPO DE INSPECCIÓN, ÁREA, LUGAR y RESPONSABLE para nombrar el archivo correctamente.");
            e.target.value = '';
            return;
        }

        setIsUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.match('image/.*')) continue;

                // Upload each file
                const url = await uploadEvidence(
                    file,
                    'Inspeccion',
                    `${formData.inspectionType}_img${i + 1}`,
                    formData.date,
                    formData.responsible,
                    'inspeccion', // Pasamos el tipo
                    formData.area, // Pasamos el área
                    formData.zone // Pasamos el lugar
                );

                setNewEvidence(prev => ({ ...prev, imgs: [...prev.imgs, url] }));
            }
            alert("✅ Al momento de cargar se cargó con éxito su archivo o imagen para saber que se registró");
        } catch (error: any) {
            alert(`Error subiendo imagen: ${error.message}`);
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const removeImage = (index: number) => {
        setNewEvidence(prev => ({ ...prev, imgs: prev.imgs.filter((_, i) => i !== index) }));
    };

    const generateInspectionPDF = (record: InspectionRecord) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(16);
        doc.setTextColor(0, 100, 0); // Dark Green
        doc.text(`REPORTE DE INSPECCIÓN: ${record.zone.toUpperCase()}`, 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Fecha: ${record.date} | Responsable: ${record.responsible}`, 20, 30);
        doc.text(`Tipo: ${record.inspectionType} | Área: ${record.area}`, 20, 35);
        doc.text(`Estado: ${record.status}`, 20, 40);

        // Reseña
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Reseña / Observaciones:", 20, 50);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        const splitText = doc.splitTextToSize(record.observations || "Sin observaciones.", 170);
        doc.text(splitText, 20, 60);

        let y = 60 + (splitText.length * 5) + 10;

        // PDF Attachment Note
        if (record.evidencePdf) {
            doc.setTextColor(0, 0, 255);
            doc.text("[ PDF Adjunto disponible en plataforma ]", 20, y);
            doc.setTextColor(0);
            y += 10;
        }

        // Images
        if (record.evidenceImgs && record.evidenceImgs.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text("Evidencia Fotográfica:", 20, y);
            y += 10;

            record.evidenceImgs.forEach((img) => {
                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }
                try {
                    doc.addImage(img, 'JPEG', 20, y, 170, 100);
                    y += 110;
                } catch (e) {
                    // Ignore image errors
                }
            });
        }

        doc.save(`Inspeccion_${record.id}.pdf`);
    };

    const generateBulkPDF = () => {
        if (filteredInspections.length === 0) {
            alert("No hay registros para exportar.");
            return;
        }

        const doc = new jsPDF();

        filteredInspections.forEach((record, index) => {
            if (index > 0) doc.addPage();

            // Header
            doc.setFontSize(16);
            doc.setTextColor(0, 100, 0);
            doc.text(`REPORTE DE INSPECCIÓN: ${record.zone.toUpperCase()}`, 105, 20, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(0);
            doc.text(`Fecha: ${record.date} | Responsable: ${record.responsible}`, 20, 30);
            doc.text(`Tipo: ${record.inspectionType} | Área: ${record.area}`, 20, 35);

            // Reseña
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Reseña / Observaciones:", 20, 50);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);

            const splitText = doc.splitTextToSize(record.observations || "Sin observaciones.", 170);
            doc.text(splitText, 20, 60);

            let y = 60 + (splitText.length * 5) + 10;

            // Images
            if (record.evidenceImgs && record.evidenceImgs.length > 0) {
                doc.setFont("helvetica", "bold");
                doc.text("Evidencia Fotográfica:", 20, y);
                y += 10;

                record.evidenceImgs.forEach((img) => {
                    if (y > 250) {
                        doc.addPage();
                        y = 20;
                    }
                    try {
                        doc.addImage(img, 'JPEG', 20, y, 170, 100);
                        y += 110;
                    } catch (e) { }
                });
            }
        });

        doc.save("Reporte_Inspecciones_Filtrado.pdf");
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isUploading) {
            alert("⏳ Por favor espere a que terminen de subir los archivos...");
            return;
        }

        if (!formData.responsible || !formData.inspectionType || !formData.zone) {
            alert("Por favor complete todos los campos obligatorios");
            return;
        }

        const newInspection: InspectionRecord = {
            id: Date.now(),
            date: formData.date,
            responsible: formData.responsible,
            inspectionType: formData.inspectionType,
            area: formData.area as any,
            zone: formData.zone,
            status: 'Pendiente',
            observations: formData.observations,
            evidencePdf: newEvidence.pdf,
            evidenceImgs: newEvidence.imgs
        };

        setInspections(prev => [newInspection, ...prev]);

        // Save to DB
        saveInspection(newInspection).then(res => {
            if (!res.success) {
                console.error("Save error:", res.error);
                alert(`Error al guardar en servidor: ${res.error || "Error desconocido"}`);
            }
        });

        // --- AUTOPILOT: ACTUALIZAR PROGRAMA ANUAL (OBJ 3) ---
        try {
            let currentProgram = JSON.parse(localStorage.getItem('annual_program_data') || '{}');
            let obj3Activities = currentProgram['obj3'] || [];

            // Buscar coincidencia en el programa del objetivo 3 (Inspecciones)
            const recordMonth = new Date(newInspection.date).getMonth();
            let foundIndex = obj3Activities.findIndex((act: any) => {
                const actDate = new Date(act.date);
                // Coincide mes Y (la descripción coincide parcialmente o es fecha exacta)
                return actDate.getMonth() === recordMonth && (
                    act.description.toLowerCase().includes(newInspection.inspectionType.toLowerCase()) ||
                    newInspection.inspectionType.toLowerCase().includes(act.description.toLowerCase())
                );
            });

            if (foundIndex !== -1) {
                obj3Activities[foundIndex] = {
                    ...obj3Activities[foundIndex],
                    status: 'Realizado',
                    compliance: 100,
                    executedDate: newInspection.date
                };
                currentProgram['obj3'] = obj3Activities;
                localStorage.setItem('annual_program_data', JSON.stringify(currentProgram));
            }
        } catch (e) {
            console.error("Error sync Obj 3", e);
        }

        // --- SINCRONIZACIÓN CON DASHBOARD GENERAL (dashboard_data_v1) ---
        try {
            const dashboardData = JSON.parse(localStorage.getItem('dashboard_data_v1') || 'null');
            if (dashboardData && dashboardData.sections) {
                let updated = false;

                // Buscar en secciones de inspecciones
                dashboardData.sections.forEach((section: any) => {
                    if (section.id === 'inspections' || section.activities) { // Check id or just act loop
                        section.activities.forEach((act: any) => {
                            const isMatch = act.name.toLowerCase().includes(newInspection.inspectionType.toLowerCase()) ||
                                newInspection.inspectionType.toLowerCase().includes(act.name.toLowerCase());

                            if (isMatch) {
                                const monthIdx = new Date(newInspection.date).getMonth();
                                if (act.data && act.data.executed) {
                                    const planVal = act.data.plan[monthIdx] || 0;
                                    const currentExec = act.data.executed[monthIdx] || 0;

                                    // SIEMPRE SUMAR: Corrección solicitada por usuario
                                    act.data.executed[monthIdx] = currentExec + 1;

                                    updated = true;
                                }
                            }
                        });
                    }
                });

                if (updated) {
                    localStorage.setItem('dashboard_data_v1', JSON.stringify(dashboardData));
                    window.dispatchEvent(new Event('storage'));
                }
            }
        } catch (e) {
            console.error("Error sync dashboard general", e);
        }

        // Reset form
        setFormData(prev => ({
            ...prev,
            inspectionType: '',
            observations: ''
        }));
        setNewEvidence({ pdf: '', imgs: [] });

        alert("Inspección registrada correctamente");
    };

    const exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(inspections);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Inspecciones");
        XLSX.writeFile(wb, "Reporte_Inspecciones.xlsx");
    };

    // Helper para calcular progreso: Eliminado (ya existe getProgressStats)


    const deleteInspection = (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return;
        setInspections(prev => prev.filter(i => i.id !== id));
        deleteInspectionRecord(id);
    };

    // Filtrado de datos
    const filteredInspections = inspections.filter(item => {
        const matchesResponsible = filterResponsible === '' || item.responsible === filterResponsible;
        const matchesType = filterType === '' || item.inspectionType === filterType;
        const matchesZone = filterZone === '' || item.zone === filterZone;
        const matchesDate = filterDate === '' || item.date === filterDate;
        const matchesArea = filterArea === 'Todas' || item.area === filterArea;

        return matchesResponsible && matchesType && matchesZone && matchesDate && matchesArea;
    });

    return (
        <div className="flex h-screen bg-slate-950 text-slate-200">

            <main className="flex-1 overflow-auto p-4 md:p-8">
                <div className="max-w-[1600px] mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm shadow-xl">
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
                                <ClipboardCheck className="text-emerald-500" size={32} />
                                Control de Inspecciones
                            </h1>
                            <p className="text-slate-400 font-medium">Panel de Registro y Seguimiento Histórico</p>
                        </div>
                        <div className="flex gap-3 flex-wrap items-center">

                            {/* Selector de Mes */}
                            <div className="relative group">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" size={16} />
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    className="pl-9 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-indigo-500 appearance-none hover:bg-slate-700 transition-colors cursor-pointer"
                                >
                                    {MONTH_NAMES.map((m, i) => (
                                        <option key={i} value={i}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Importar Programa Menu - SOLO DEV Y USER */}
                            {user?.role !== 'manager' && (
                                <div className="relative group">
                                    <button
                                        onClick={() => setShowImportMenu(!showImportMenu)}
                                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/20 active:scale-95"
                                    >
                                        <Download size={20} className="rotate-180" />
                                        Importar
                                        <ChevronDown size={14} />
                                    </button>

                                    {showImportMenu && (
                                        <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-20 flex flex-col animate-in fade-in zoom-in-95 duration-200">

                                            {/* Seguridad */}
                                            <div className="flex items-center border-b border-slate-800 p-1 group hover:bg-slate-800/50 transition-colors">
                                                <button
                                                    onClick={() => triggerImport('Seguridad')}
                                                    className="flex-1 px-3 py-2 text-left text-white text-sm font-medium flex items-center gap-3 hover:text-emerald-400 transition-colors"
                                                >
                                                    <Shield size={16} className="text-emerald-500" />
                                                    <span>Importar Seguridad ({MONTH_NAMES[selectedMonth]})</span>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteProgramByArea('Seguridad'); }}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all mr-1"
                                                    title={`Limpiar Seguridad (${MONTH_NAMES[selectedMonth]})`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {/* Medio Ambiente */}
                                            <div className="flex items-center border-b border-slate-800 p-1 group hover:bg-slate-800/50 transition-colors">
                                                <button
                                                    onClick={() => triggerImport('Medioambiente')}
                                                    className="flex-1 px-3 py-2 text-left text-white text-sm font-medium flex items-center gap-3 hover:text-amber-400 transition-colors"
                                                >
                                                    <ActivityIcon size={16} className="text-amber-500" />
                                                    <span>Importar Medio Amb. ({MONTH_NAMES[selectedMonth]})</span>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteProgramByArea('Medioambiente'); }}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all mr-1"
                                                    title={`Limpiar Medioambiente (${MONTH_NAMES[selectedMonth]})`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {/* Salud */}
                                            <div className="flex items-center p-1 group hover:bg-slate-800/50 transition-colors">
                                                <button
                                                    onClick={() => triggerImport('Salud')}
                                                    className="flex-1 px-3 py-2 text-left text-white text-sm font-medium flex items-center gap-3 hover:text-blue-400 transition-colors"
                                                >
                                                    <TrendingUp size={16} className="text-blue-500" />
                                                    <span>Importar Salud ({MONTH_NAMES[selectedMonth]})</span>
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteProgramByArea('Salud'); }}
                                                    className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all mr-1"
                                                    title={`Limpiar Salud (${MONTH_NAMES[selectedMonth]})`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        accept=".xlsx, .xls"
                                        ref={fileInputRef}
                                        onChange={handleProgramImport}
                                        className="hidden"
                                    />
                                </div>
                            )}

                            {/* Ver Programa Cargado - DISPONIBLE PARA TODOS (Deseable para ver metas) */}
                            <button
                                onClick={() => setShowProgramModal(true)}
                                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 px-3 py-3 rounded-xl font-bold transition-all border border-slate-700"
                                title="Ver datos importados"
                            >
                                <Search size={20} />
                            </button>

                            {/* Botón Configurar Metas (Manual) */}
                            {user?.role === 'developer' && (
                                <button
                                    onClick={() => { setShowQuotaSettings(!showQuotaSettings); setShowGoals(true); }}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all border ${showQuotaSettings ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                                >
                                    <Settings size={20} className={showQuotaSettings ? "animate-spin-slow" : ""} />
                                    Metas Manuales
                                </button>
                            )}

                            <button
                                onClick={() => setShowGoals(!showGoals)}
                                className="hidden md:flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-3 rounded-xl font-bold transition-all border border-slate-700"
                            >
                                <ActivityIcon size={20} className={showGoals ? "text-emerald-500" : ""} />
                                {showGoals ? 'Ocultar' : 'Ver Avance'}
                            </button>

                            {/* Exportar - SOLO NO MANAGERS (Según requerimiento: "No podra descargar") */}
                            {user?.role !== 'manager' && (
                                <>
                                    <button
                                        onClick={exportToExcel}
                                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                                    >
                                        <Download size={20} />
                                        Excel
                                    </button>
                                    <button
                                        onClick={generateBulkPDF}
                                        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-900/20 active:scale-95"
                                    >
                                        <FileText size={20} />
                                        PDF
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Modal de Detalle de Programa */}
                    {showProgramModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Calendar size={20} className="text-indigo-500" />
                                        Programa Mensual Importado
                                    </h3>
                                    <button onClick={() => setShowProgramModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="p-0 overflow-auto flex-1">
                                    {monthlyProgram.length === 0 ? (
                                        <div className="p-8 text-center text-slate-500">
                                            No hay datos importados. Sube un archivo Excel.
                                        </div>
                                    ) : (
                                        <table className="w-full text-left text-sm text-slate-300">
                                            <thead className="bg-slate-950 text-slate-500 uppercase text-xs sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3">Responsable</th>
                                                    <th className="px-4 py-3">Mes</th>
                                                    <th className="px-4 py-3 text-right">Cantidad</th>
                                                    <th className="px-4 py-3">Tipo</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800">
                                                {monthlyProgram.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-800/50">
                                                        <td className="px-4 py-2">{item.responsible}</td>
                                                        <td className="px-4 py-2 text-indigo-400">
                                                            {item.month >= 0 ? MONTH_NAMES[item.month] : 'Todos (Genérico)'}
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-mono text-emerald-400 font-bold">{item.quantity}</td>
                                                        <td className="px-4 py-2 text-slate-500 text-xs">{item.type}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                                <div className="p-4 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl flex justify-end">
                                    <button
                                        onClick={() => setMonthlyProgram([])}
                                        className="text-xs text-red-400 hover:text-red-300 underline mr-auto"
                                    >
                                        Limpiar Datos
                                    </button>
                                    <button onClick={() => setShowProgramModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-bold transition-colors">
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION: CONFIGURACIÓN DE METAS (Panel Desplegable) */}
                    {showQuotaSettings && user?.role === 'developer' && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 animate-in slide-in-from-top-4 duration-300 shadow-2xl mb-6">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <Settings size={18} className="text-emerald-500" />
                                Configuración Manual de Metas (Fallback)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {RESPONSIBLES.filter(r => r !== 'Jose Luis Cancino' && !r.toLowerCase().includes('gerencia')).map(resp => (
                                    <div key={resp} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                                        <span className="text-sm text-slate-300 font-medium">{resp}</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQuota(resp, false)}
                                                className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-400 transition-colors"
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-mono font-bold text-white">
                                                {userQuotas[resp] !== undefined ? userQuotas[resp] : 4}
                                            </span>
                                            <button
                                                onClick={() => updateQuota(resp, true)}
                                                className="w-8 h-8 flex items-center justify-center bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-lg text-slate-400 transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}



                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

                        {/* FORMULARIO DE REGISTRO (1 Columna) */}
                        {user?.role !== 'manager' && (
                            <Card className="bg-slate-900 border-slate-800 xl:col-span-1 h-fit shadow-2xl">
                                <CardHeader className="border-b border-slate-800 pb-4">
                                    <CardTitle className="text-emerald-400 flex flex-wrap items-center gap-2 text-xl">
                                        <FileText size={24} />
                                        Nueva Inspección
                                        {isUploading && (
                                            <span className="flex items-center gap-1 text-[8px] bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full animate-pulse border border-indigo-700/30">
                                                <span className="w-1 h-1 bg-indigo-400 rounded-full animate-ping"></span>
                                                SUBIENDO...
                                            </span>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <form onSubmit={handleSubmit} className="space-y-5">

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Fecha</label>
                                            <div className="relative group">
                                                <Calendar className="absolute left-3 top-3 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                                <input
                                                    type="date"
                                                    name="date"
                                                    value={formData.date}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Responsable</label>
                                            <div className="relative group">
                                                <User className="absolute left-3 top-3 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                                <select
                                                    name="responsible"
                                                    value={formData.responsible}
                                                    onChange={handleInputChange}
                                                    disabled={user?.role === 'user'}
                                                    className={`w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none ${user?.role === 'user' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    required
                                                >
                                                    <option value="">Seleccionar Responsable...</option>
                                                    {RESPONSIBLES.map(r => (
                                                        <option key={r} value={r}>{r}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Área</label>
                                            <div className="grid grid-cols-3 gap-1">
                                                {AREAS.map(area => (
                                                    <button
                                                        type="button"
                                                        key={area}
                                                        onClick={() => setFormData(prev => ({ ...prev, area: area as any }))}
                                                        className={`px-1 py-2 text-[9px] font-black uppercase rounded-lg border transition-all truncate ${formData.area === area
                                                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-900/50'
                                                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                                                            }`}
                                                        title={area}
                                                    >
                                                        {area}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Zona / Ubicación</label>
                                            <div className="relative group">
                                                <MapPin className="absolute left-3 top-3 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                                <select
                                                    name="zone"
                                                    value={formData.zone}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none"
                                                    required
                                                >
                                                    <option value="">Seleccionar Zona...</option>
                                                    {ZONES.map(z => (
                                                        <option key={z} value={z}>{z}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tipo de Inspección</label>
                                            <div className="relative group">
                                                <AlertCircle className="absolute left-3 top-3 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                                <select
                                                    name="inspectionType"
                                                    value={formData.inspectionType}
                                                    onChange={handleInputChange}
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all appearance-none truncate"
                                                    required
                                                >
                                                    <option value="">Seleccionar Tipo...</option>
                                                    {(INSPECTION_TYPES_BY_AREA[formData.area as keyof typeof INSPECTION_TYPES_BY_AREA] || INSPECTION_TYPES_BY_AREA['Seguridad']).map(type => (
                                                        <option key={type} value={type}>{type}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Evidencias */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Evidencia (PDF)</label>
                                                <div className="relative group bg-slate-950 border border-slate-800 rounded-xl p-3 border-dashed hover:border-emerald-500/50 transition-colors">
                                                    <input
                                                        type="file"
                                                        accept=".pdf"
                                                        onChange={handlePdfUpload}
                                                        className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:bg-emerald-600/10 file:text-emerald-400 cursor-pointer"
                                                    />
                                                    {newEvidence.pdf && <span className="absolute right-2 top-2 text-[10px] text-emerald-500 font-bold">✅</span>}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Imágenes (Max 5)</label>
                                                <div className="relative group bg-slate-950 border border-slate-800 rounded-xl p-3 border-dashed hover:border-emerald-500/50 transition-colors">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        onChange={handleImageUpload}
                                                        disabled={newEvidence.imgs.length >= 5}
                                                        className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:bg-blue-600/10 file:text-blue-400 cursor-pointer disabled:opacity-50"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Thumbnails */}
                                        {newEvidence.imgs.length > 0 && (
                                            <div className="flex gap-2 pb-2 overflow-x-auto">
                                                {newEvidence.imgs.map((img, idx) => (
                                                    <div key={idx} className="relative w-16 h-16 flex-shrink-0 group">
                                                        <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover rounded-lg border border-slate-700" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImage(idx)}
                                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-900/30 transition-all active:scale-[0.98] uppercase tracking-wide text-sm"
                                        >
                                            Registrar Inspección
                                        </button>

                                    </form>
                                </CardContent>
                            </Card>
                        )}

                        {/* HISTORIAL Y TABLA (4 Columnas) */}
                        <div className={`space-y-6 ${user?.role === 'manager' ? 'xl:col-span-5' : 'xl:col-span-4'}`}>

                            {/* Panel Superior de Filtros */}
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">

                                    {/* Filtro Responsable */}
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 text-slate-500" size={16} />
                                        <select
                                            value={filterResponsible}
                                            onChange={(e) => setFilterResponsible(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 appearance-none"
                                        >
                                            <option value="">Todo Responsable</option>
                                            {RESPONSIBLES.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>

                                    {/* Filtro Zona */}
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 text-slate-500" size={16} />
                                        <select
                                            value={filterZone}
                                            onChange={(e) => setFilterZone(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 appearance-none truncate"
                                        >
                                            <option value="">Toda Zona</option>
                                            {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                                        </select>
                                    </div>

                                    {/* Filtro Tipo */}
                                    <div className="relative">
                                        <AlertCircle className="absolute left-3 top-3 text-slate-500" size={16} />
                                        <select
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 appearance-none truncate"
                                        >
                                            <option value="">Todo Tipo</option>
                                            {Object.values(INSPECTION_TYPES_BY_AREA).flat().sort().map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>

                                    {/* Filtro Fecha */}
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 text-slate-500" size={16} />
                                        <input
                                            type="date"
                                            value={filterDate}
                                            onChange={(e) => setFilterDate(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>

                                    {/* Filtro Area (reset button if needed or just Area select) */}
                                    <div className="relative">
                                        <Filter className="absolute left-3 top-3 text-slate-500" size={16} />
                                        <select
                                            value={filterArea}
                                            onChange={(e) => setFilterArea(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 appearance-none"
                                        >
                                            <option value="Todas">Todas las Áreas</option>
                                            {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* PANEL DE HISTORIAL (Tabla) */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-[calc(100vh-280px)]">
                                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                                    <h2 className="font-bold text-lg text-white flex items-center gap-2">
                                        <ClipboardCheck className="text-emerald-500" />
                                        Historial de Registros
                                    </h2>
                                    <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded">
                                        Total: {filteredInspections.length}
                                    </span>
                                </div>

                                <div className="overflow-auto flex-1">
                                    <table className="w-full text-left text-sm text-slate-400">
                                        <thead className="bg-slate-950 text-xs uppercase font-black text-slate-500 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-3 py-3 tracking-wider text-xs">Fecha</th>
                                                <th className="px-3 py-3 tracking-wider text-xs">Responsable</th>
                                                <th className="px-3 py-3 tracking-wider text-xs">Tipo de Inspección</th>
                                                <th className="px-3 py-3 tracking-wider text-xs">Área / Zona</th>
                                                <th className="px-3 py-3 tracking-wider text-center text-xs">Estado</th>
                                                <th className="px-3 py-3 tracking-wider text-left text-xs">Archivo</th>
                                                <th className="px-3 py-3 tracking-wider text-center text-xs">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {filteredInspections.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-600 italic">
                                                        No se encontraron registros
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredInspections.map(item => (
                                                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                                                        <td className="px-3 py-3 whitespace-nowrap font-mono text-white text-xs">
                                                            {item.date}
                                                        </td>
                                                        <td className="px-3 py-3 max-w-[150px] truncate text-xs">
                                                            <div className="flex items-center gap-2 text-slate-300">
                                                                <User size={14} className="text-emerald-500" />
                                                                {getInitials(item.responsible)}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 font-medium text-slate-200 text-xs text-wrap max-w-[200px]">
                                                            {item.inspectionType}
                                                        </td>
                                                        <td className="px-3 py-3 text-xs">
                                                            <div className="flex flex-col gap-1">
                                                                <span className={`text-[9px] font-black uppercase w-fit px-2 py-0.5 rounded ${item.area === 'Seguridad' ? 'bg-blue-500/20 text-blue-400' :
                                                                    item.area === 'Salud' ? 'bg-rose-500/20 text-rose-400' :
                                                                        'bg-emerald-500/20 text-emerald-400'
                                                                    }`}>
                                                                    {item.area}
                                                                </span>
                                                                <span className="text-[10px] text-slate-500 flex items-center gap-1 truncate max-w-[120px]">
                                                                    <MapPin size={10} /> {item.zone}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 text-center">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.status === 'Completado' ? 'bg-emerald-500/10 text-emerald-500' :
                                                                'bg-amber-500/10 text-amber-500'
                                                                }`}>
                                                                {item.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3 text-left">
                                                            <div className="flex flex-col gap-1">
                                                                {item.evidencePdf ? (
                                                                    <span className="text-[10px] text-slate-400 truncate max-w-[100px] block" title={generateFilename(item.inspectionType, item.date, item.responsible, 'pdf', 'inspeccion', undefined, item.area)}>
                                                                        {generateFilename(item.inspectionType, item.date, item.responsible, 'pdf', 'inspeccion', undefined, item.area)}
                                                                    </span>
                                                                ) : item.evidenceImgs && item.evidenceImgs.length > 0 ? (
                                                                    <span className="text-[10px] text-slate-400 truncate max-w-[100px] block" title={generateFilename(item.inspectionType, item.date, item.responsible, 'jpg', 'inspeccion', undefined, item.area)}>
                                                                        {generateFilename(item.inspectionType, item.date, item.responsible, 'jpg', 'inspeccion', undefined, item.area)} (Img)
                                                                    </span>
                                                                ) : <span className="text-slate-600">-</span>}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 text-center">
                                                            <div className="flex justify-center gap-2">
                                                                {/* EVIDENCE BUTTONS */}
                                                                {item.evidencePdf && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const link = document.createElement('a');
                                                                            link.href = item.evidencePdf!;
                                                                            link.download = generateFilename(item.inspectionType, item.date, item.responsible, 'pdf', 'inspeccion', undefined, item.area);
                                                                            document.body.appendChild(link);
                                                                            link.click();
                                                                            document.body.removeChild(link);
                                                                        }}
                                                                        className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg transition-colors"
                                                                        title="Descargar PDF Adjunto"
                                                                    >
                                                                        <FileText size={16} />
                                                                    </button>
                                                                )}

                                                                {item.evidenceImgs && item.evidenceImgs.length > 0 && (
                                                                    <button
                                                                        onClick={() => setViewingEvidence(item)}
                                                                        className="text-emerald-400 hover:bg-emerald-500/10 p-2 rounded-lg transition-colors flex items-center gap-1"
                                                                        title="Ver Imágenes"
                                                                    >
                                                                        <ImageIcon size={16} />
                                                                        <span className="text-[10px] font-bold">{item.evidenceImgs.length}</span>
                                                                    </button>
                                                                )}

                                                                <button
                                                                    onClick={() => generateInspectionPDF(item)}
                                                                    className="text-slate-500 hover:text-emerald-400 transition-colors p-2 hover:bg-emerald-500/10 rounded-lg"
                                                                    title="Exportar PDF Individual"
                                                                >
                                                                    <Download size={16} />
                                                                </button>
                                                                {(user?.role === 'developer' || (user?.role === 'user' && user?.name === item.responsible)) && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => deleteInspection(item.id)}
                                                                        className="text-slate-500 hover:text-red-400 transition-colors p-2 hover:bg-red-500/10 rounded-lg"
                                                                        title="Eliminar registro"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION: METAS Y AVANCE (3D Gauges) - REPOSICIONADO */}
                    {showGoals && (
                        <div className="animate-in slide-in-from-top-4 duration-500 hidden md:block">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
                                    <TrendingUp className="text-emerald-500" />
                                    Avance Mensual (Objetivo 3)
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-6">
                                {RESPONSIBLES.filter(r => r !== 'Jose Luis Cancino' && !r.toLowerCase().includes('gerencia')).map(resp => {
                                    const stats = getProgressStats(resp);

                                    // Determinar Color NEON según reglas de usuario:
                                    // 0% - 80%  -> Rojo Neon (#ef4444)
                                    // 81% - 95% -> Naranja Neon (#f97316)
                                    // 96% - 100%-> Verde Neon (#22c55e)
                                    let gaugeColor = '#ef4444';
                                    if (stats.percent >= 96) {
                                        gaugeColor = '#22c55e';
                                    } else if (stats.percent >= 81) {
                                        gaugeColor = '#f97316';
                                    }

                                    return (
                                        <div key={resp} className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 rounded-[2rem] p-4 border border-slate-700/50 shadow-2xl flex flex-col items-center justify-between group hover:scale-105 transition-transform duration-300 relative overflow-hidden">
                                            {/* Spotlight Effect */}
                                            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 blur-xl pointer-events-none"></div>

                                            <ComplianceGauge
                                                title={resp}
                                                value={stats.executed}
                                                max={stats.planned}
                                                width={130}
                                                height={90}
                                                color={gaugeColor}
                                            />
                                            <div className="mt-3 w-full flex justify-between px-2 text-[10px] font-mono font-bold text-slate-500 border-t border-slate-800/50 pt-2">
                                                <span className="flex items-center gap-1">E: <span style={{ color: gaugeColor }} className="text-xs drop-shadow-md">{stats.executed}</span></span>
                                                <span className="flex items-center gap-1">P: <span className="text-slate-300 text-xs">{stats.planned}</span></span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL DE EVIDENCIA DE INSPECCIÓN */}
            {viewingEvidence && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setViewingEvidence(null)}>
                    <div className="relative bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50">
                            <div>
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <ImageIcon size={20} className="text-emerald-400" />
                                    Evidencia Fotográfica
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">
                                    {viewingEvidence.inspectionType} - {viewingEvidence.zone}
                                </p>
                            </div>
                            <button onClick={() => setViewingEvidence(null)} className="p-2 hover:bg-red-900/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto bg-black/50 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(viewingEvidence.evidenceImgs || []).map((img, idx) => (
                                    <div key={idx} className="group relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                                        <img
                                            src={img}
                                            alt={`Evidencia ${idx + 1}`}
                                            className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                                            <a
                                                href={img}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 text-xs font-bold text-white hover:text-emerald-400 transition-colors"
                                            >
                                                <Download size={14} /> Descargar Original
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {(!viewingEvidence.evidenceImgs || viewingEvidence.evidenceImgs.length === 0) && (
                                <div className="text-center py-20 text-slate-500 italic">
                                    No hay imágenes adjuntas.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
