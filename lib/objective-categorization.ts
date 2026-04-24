
import { Activity } from "./types";

export interface ObjectiveGroup {
    id: string;
    title: string;
    description: string;
    area: 'safety' | 'health' | 'environment';
    activities: Activity[];
}

export const OBJECTIVES_CONFIG: (Omit<ObjectiveGroup, 'activities'> & { keywords?: string[], excludeKeywords?: string[] })[] = [
    // --- GESTIÓN DE SEGURIDAD (OBJ) ---
    {
        id: 'obj-1',
        title: 'OBJ 01: SCSST',
        description: 'Conformación, reuniones e inspecciones del SCSST y cumplimiento normativo.',
        area: 'safety',
        keywords: [
            "subcomité", "scsst", "29783", "iperc", "informes trimestrales",
            "reunión ordinaria", "mantenimiento legal"
        ]
    },
    {
        id: 'obj-2',
        title: 'OBJ 02: CAPACITACIÓN',
        description: 'Asegurar la participación, información y capacitación.',
        area: 'safety',
        keywords: [
            "inducción", "manos", "epp", "bloqueo", "etiquetado",
            "trabajo en altura", "caliente", "confinado", "izaje", "eléctrico",
            "excavaciones", "herramientas", "fuego", "defensivo", "tormentas",
            "investigación y reporte", "análisis de trabajo seguro", "ast", "art. 54",
            "excavación", "radiación solar", "radiación ultravioleta", "ultravioleta",
            "ats", "materiales y químicos", "cinturón",
            "difusión del passt", "passt"
        ],
        excludeKeywords: ["inspección"] 
    },
    {
        id: 'obj-3',
        title: 'OBJ 03: INSPECCIONES SEGURIDAD',
        description: 'Identificar y evaluar permanentemente los peligros y controlar los riesgos.',
        area: 'safety',
        keywords: [
            "maquinaria", "línea amarilla", "retro", "perforadora", "cargador",
            "tractor", "estacionar", "pre-uso", "inspección de herramientas",
            "inspección de epp", "inspección de extintores", "inspección de botiquines",
            "vehículos", "volquetes", "camionetas", "camiones", "señalización", "vial",
            "vías de acceso", "bermas", "orden y limpieza", "procedimientos de trabajo",
            "escalera", "equipo contra caídas", "arnés", "línea de vida", "alto riesgo",
            "extintores", "generador", "tableros", "tablero eléctrico",
            "almacén de productos químicos", "msds", "hoja msds"
        ],
        excludeKeywords: ["ambulancia", "hidratación", "botiquines", "salud", "ambiental"]
    },
    {
        id: 'obj-4',
        title: 'OBJ 04: REPORTE A/C INSEGURAS',
        description: 'Elaborar reporte de actos y condiciones inseguras para la reducción de accidentes.',
        area: 'safety',
        keywords: ["rac", "actos y condiciones", "sistema de rac", "observación preventiva"]
    },
    {
        id: 'obj-5',
        title: 'OBJ 05: EMO REALIZADOS',
        description: 'Vigilancia de la salud y exámenes médicos ocupacionales.',
        area: 'health',
        keywords: [
            "emo", "exámenes médicos", "certificado", "resultados",
            "aptitud", "clínica"
        ]
    },

    // --- SEGUIMIENTO (SEG) ---
    {
        id: 'obj-6',
        title: 'SEG 01: INSPECCIONES DE SALUD',
        description: 'Inspecciones de infraestructura y recursos de salud.',
        area: 'health',
        keywords: ["ambulancia", "hidratación", "comedor", "vestuarios", "servicios higiénicos", "botiquines", "estaciones de emergencia", "sshh", "lava manos", "lavamanos", "inspección de salud"]
    },
    {
        id: 'obj-7',
        title: 'SEG 02: FORMACIONES DE SALUD',
        description: 'Capacitación para reducir enfermedades ocupacionales.',
        area: 'health',
        keywords: [
            "salud del paso", "hipoacusia", "respiratoria", "visual", "piel",
            "primeros auxilios", "vida saludable", "pausas activas",
            "estrés", "vih", "sida", "cuidado de ojo", "ojos",
            "mental", "ley 30947", "30947", "monitoreo", "agentes", "psicosociales", "físico", "ergonómicos"
        ]
    },
    {
        id: 'obj-8',
        title: 'SEG 03: INSPECCIONES M. AMBIENTE',
        description: 'Inspecciones y reducción de riesgos ambientales.',
        area: 'environment',
        keywords: ["inspecciones medio ambiente", "inspección ambiental", "residuos", "segregación", "kit antiderrames", "trampas de grasa"]
    },
    {
        id: 'obj-9',
        title: 'SEG 04: FORMACIONES M. AMBIENTE',
        description: 'Formación en riesgos ambientales.',
        area: 'environment',
        keywords: ["polvo", "ambiental", "flora", "fauna", "capacitación ambiental"]
    },
    {
        id: 'obj-10',
        title: 'SEG 05: CONTROL DE SIMULACROS',
        description: 'Planificación y ejecución de simulacros de emergencia.',
        area: 'safety',
        keywords: ["simulacro", "drill", "ensayo de emergencia", "sismo", "incendio"]
    },
    {
        id: 'obj-11',
        title: 'SEG 06: CONTROL DE BRIGADISTAS',
        description: 'Capacitación y operatividad de las brigadas de emergencia.',
        area: 'safety',
        keywords: ["brigada", "brigadista", "primeros auxilios", "evacuación", "rescate"]
    }
];pecciones medio ambiente", "inspección ambiental"]
    }
];

export function categorizeActivitiesByObjective(activities: Activity[]): ObjectiveGroup[] {
    // Inicializar grupos con actividades vacías
    const groups = OBJECTIVES_CONFIG.map(obj => ({
        ...obj,
        activities: [] as Activity[]
    }));

    // Grupo por defecto para "Otros"
    const otherGroup: ObjectiveGroup = {
        id: 'other',
        title: 'OTRAS ACTIVIDADES',
        description: 'Actividades generales no categorizadas.',
        area: 'safety',
        activities: []
    };

    activities.forEach(activity => {
        const nameLower = activity.name.toLowerCase();
        let matched = false;

        for (const group of groups) {
            // Check inclusions
            const hasKeyword = group.keywords?.some(k => nameLower.includes(k));

            // Check exclusions if any
            // @ts-ignore
            const hasExclusion = group.excludeKeywords?.some(k => nameLower.includes(k));

            if (hasKeyword && !hasExclusion) {
                group.activities.push({
                    ...activity,
                    managementArea: group.area // Asegurar que el área coincida con el objetivo
                });
                matched = true;
                break; // Asignar al primer match encontrado (prioridad por orden en OBJECTIVES_CONFIG)
            }
        }

        if (!matched) {
            // Intentar asignar por area si ya viene pre-definida
            if (activity.managementArea === 'health') {
                const healthGen = groups.find(g => g.id === 'obj-5');
                if (healthGen) { healthGen.activities.push(activity); matched = true; }
            } else if (activity.managementArea === 'environment') {
                const envGen = groups.find(g => g.id === 'obj-8');
                if (envGen) { envGen.activities.push(activity); matched = true; }
            }

            if (!matched) {
                // FALLBACK GLOBAL
                if (activity.managementArea === 'health') {
                    const healthGen = groups.find(g => g.id === 'obj-5');
                    if (healthGen) healthGen.activities.push(activity);
                } else if (activity.managementArea === 'environment') {
                    const envGen = groups.find(g => g.id === 'obj-8');
                    if (envGen) envGen.activities.push(activity);
                } else {
                    // Default Safety -> Obj 2
                    const safetyGen = groups.find(g => g.id === 'obj-2');
                    if (safetyGen) safetyGen.activities.push(activity);
                }
            }
        }
    });

    // Retornar solo grupos con actividades
    return groups.filter(g => g.activities.length > 0);
}
