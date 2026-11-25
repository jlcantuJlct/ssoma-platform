import * as XLSX from 'xlsx';

export interface SubprogramItem {
    item: number;
    tema: string;
    sede?: string;
    dirigido?: string;
    tipo?: string;
    modalidad?: string;
    horas?: number;
    costo?: number;
    capacitador?: string;
    fechaCumplimiento?: string;
    evaluacion?: string;
    programmed: number[]; // 12 months
    executed: number[];   // 12 months
}

export interface TrainingSubprogram {
    id: string;
    code: string;
    version: string;
    title: string;
    sede: string;
    fechaActualizacion: string;
    elaboradoPor: string;
    tipoParticipantes: string;
    items: SubprogramItem[];
}

// ── 1. SUBPROGRAMA DE CAPACITACIONES DE SEGURIDAD (12 Temas Oficiales F-SIG-066) ──
export const DEFAULT_SUBPROGRAM_CAP_SEGURIDAD: TrainingSubprogram = {
    id: 'subprog_seguridad',
    code: 'F-SIG-066',
    version: '01',
    title: 'PROGRAMA ANUAL DE CAPACITACIÓN DE SEGURIDAD',
    sede: 'Red Vial 6 (Obras Nuevas - Zona Industrial Pisco)',
    fechaActualizacion: '29 de Noviembre 2026',
    elaboradoPor: 'Jose Luis Cancino Tueros',
    tipoParticipantes: 'Personal General / Obras Nuevas',
    items: [
        {
            item: 1,
            tema: 'CAP. OBLIGATORIA: Uso obligatorio de EPP',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 2,
            tema: 'CAP. OBLIGATORIA: Análisis de Trabajo Seguro (ATS)',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 3,
            tema: 'CAP. OBLIGATORIA: IPERC Identificación de Peligros y Evaluación de Riesgos',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 4,
            tema: 'CAP. OBLIGATORIA: Manejo Defensivo u operación segura',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 5,
            tema: 'CAP. OBLIGATORIA: Ergonomía',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 6,
            tema: 'Notificación de investigación  y reporte de accidente',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 7,
            tema: 'Primeros auxilios',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 8,
            tema: 'Trabajos en Caliente',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 9,
            tema: 'Excavación de zanja',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 10,
            tema: 'Trabajos en Altura',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 11,
            tema: 'Sistema de bloqueo rotulado y etiquetado',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 12,
            tema: 'Izaje de Carga',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
    ]
};

// ── 2. SUBPROGRAMA DE CAPACITACIONES DE SALUD OCUPACIONAL (9 Temas) ──
export const DEFAULT_SUBPROGRAM_CAP_SALUD: TrainingSubprogram = {
    id: 'subprog_salud',
    code: 'F-SIG-066',
    version: '01',
    title: 'PROGRAMA ANUAL DE CAPACITACIÓN DE SALUD OCUPACIONAL',
    sede: 'Red Vial 6 (Obras Nuevas - Zona Industrial Pisco)',
    fechaActualizacion: '29 de Noviembre 2026',
    elaboradoPor: 'Jose Luis Cancino Tueros',
    tipoParticipantes: 'Personal General / Obras Nuevas',
    items: [
        {
            item: 1,
            tema: 'COVID 19  - RM022/MINSA',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 2,
            tema: 'Efectos de la radiación Solar',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 3,
            tema: 'Cuidado la audicion Hipoacusia',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 4,
            tema: 'Habitos saludables prevencion de las enfermedados cardivasculares',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 5,
            tema: 'Higuiene del sueño',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 6,
            tema: 'Riesgos de salud el Ruido, polvo, humo, radiasion solar, vapores y sus cuidados e impactos en la salud. (enfermedades ocupacionales)',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 7,
            tema: 'Dia mundial de la vision cuidado con los ojos',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 8,
            tema: 'Dia mundial de la diabetes',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 9,
            tema: 'Infecciones de trasmision sexual',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Capacitacion',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
    ]
};

// ── 3. SUBPROGRAMA DE CAPACITACIONES DE MEDIO AMBIENTE (10 Temas) ──
export const DEFAULT_SUBPROGRAM_CAP_MA: TrainingSubprogram = {
    id: 'subprog_ma',
    code: 'F-SIG-066',
    version: '01',
    title: 'PROGRAMA ANUAL DE CAPACITACIÓN DE MEDIO AMBIENTE',
    sede: 'Red Vial 6 (Obras Nuevas - Zona Industrial Pisco)',
    fechaActualizacion: '29 de Noviembre 2026',
    elaboradoPor: 'Jose Luis Cancino Tueros',
    tipoParticipantes: 'Personal General / Obras Nuevas',
    items: [
        {
            item: 1,
            tema: 'Medidas de prevención y/o mitigación de impactos ambientales durante la etapa de mejoramiento de la carretera proyectada',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Difusion MA',
            modalidad: 'Interna',
            horas: 0.15,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Periodico',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 2,
            tema: 'Estandares de Calidad ambiental. Protección y conservación de la diversidad y los recursos naturales especies protegidos de flora y fauna',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Difusion MA',
            modalidad: 'Interna',
            horas: 0.15,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Periodico',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 3,
            tema: 'Prevención de derrames y medidas de respuesta ante ocurrencia.',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Difusion MA',
            modalidad: 'Interna',
            horas: 0.15,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Periodico',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 4,
            tema: 'Manejo Ambiental de las áreas auxiliares',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Difusion MA',
            modalidad: 'Interna',
            horas: 0.15,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Periodico',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 5,
            tema: 'Transporte y disposición de residuos industriales en forma apropiada.',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Difusion MA',
            modalidad: 'Interna',
            horas: 0.15,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Periodico',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 6,
            tema: 'Restauración de áreas alteradas y abandono de obra',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Difusion MA',
            modalidad: 'Interna',
            horas: 0.15,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Periodico',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 7,
            tema: 'Normas de tránsito.',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Difusion MA',
            modalidad: 'Interna',
            horas: 0.15,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Periodico',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 8,
            tema: 'Señalizaciones permanentes y temporales.',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Difusion MA',
            modalidad: 'Interna',
            horas: 0.15,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Periodico',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 9,
            tema: 'Lugares de riesgo de accidentes por actividades de la obra. -',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Difusion MA',
            modalidad: 'Interna',
            horas: 0.15,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Periodico',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 10,
            tema: 'Lugares de mayor incidencia de accidentes de tránsito en la vía.',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'PAD y Zonas Industriales',
            tipo: 'Difusion MA',
            modalidad: 'Interna',
            horas: 0.15,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Periodico',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
    ]
};

// ── 4. SUBPROGRAMA DE ENTRENAMIENTO DE BRIGADISTAS (5 Temas) ──
export const DEFAULT_SUBPROGRAM_CAP_BRIGADISTAS: TrainingSubprogram = {
    id: 'subprog_brigadistas',
    code: 'F-SIG-066',
    version: '01',
    title: 'PROGRAMA ANUAL DE ENTRENAMIENTO DE BRIGADISTAS',
    sede: 'Red Vial 6 (Obras nuevas)',
    fechaActualizacion: '16 de enero 2026',
    elaboradoPor: 'Jose Luis Cancino Tueros',
    tipoParticipantes: 'Brigadistas',
    items: [
        {
            item: 1,
            tema: 'Prevencion por sismo, Tsunamis, inundacion',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'Brigadistas',
            tipo: 'Entrenamiento',
            modalidad: 'Interna',
            horas: 2,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Periodica',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 2,
            tema: 'Prevencion por Incendio',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'Brigadistas',
            tipo: 'Entrenamiento',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Periodica',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 3,
            tema: 'Prevencion por primeros auxilios',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'Brigadistas',
            tipo: 'Entrenamiento',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Periodica',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 4,
            tema: 'Prevencion por derrames',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'Brigadistas',
            tipo: 'Entrenamiento',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Periodica',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 5,
            tema: 'Prevencion por robos',
            sede: 'PAD y Zonas Industriales',
            dirigido: 'Brigadistas',
            tipo: 'Entrenamiento',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Periodica',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
    ]
};

// ── 5. SUBPROGRAMA DE CAPACITACIÓN DEL SUBCOMITÉ DE SST (SCSST - 4 Temas) ──
export const DEFAULT_SUBPROGRAM_CAP_SCSST: TrainingSubprogram = {
    id: 'subprog_scsst',
    code: 'F-SIG-066',
    version: '01',
    title: 'PROGRAMA ANUAL DE CAPACITACIÓN DEL SUBCOMITÉ DE SST (SCSST)',
    sede: 'Red Vial 6 (Obras Nuevas - Zona Industrial Pisco)',
    fechaActualizacion: '29 de Noviembre 2026',
    elaboradoPor: 'Jose Luis Cancino Tueros',
    tipoParticipantes: 'SCSST',
    items: [
        {
            item: 1,
            tema: 'Capacitaciones Inspecciones de Seguridad y salud en el trabajo  (SCSST).',
            sede: 'Campamento',
            dirigido: 'SCSST',
            tipo: 'Difusion MA',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: '2026-05-25',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 2,
            tema: 'Capacitaciones Notificación, investigación y reporte de incidentes (SCSST).',
            sede: 'Campamento',
            dirigido: 'SCSST',
            tipo: 'Difusion MA',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: '2026-03-27',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 3,
            tema: 'Capacitaciones Funciones, facultades y responsabilidades del Subcomité de SST.',
            sede: 'Campamento',
            dirigido: 'SCSST',
            tipo: 'Difusion MA',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            item: 4,
            tema: 'Capacitaciones IPERC (SCSST).',
            sede: 'Campamento',
            dirigido: 'SCSST',
            tipo: 'Difusion MA',
            modalidad: 'Interna',
            horas: 1,
            costo: 0,
            capacitador: 'Area SSTMA',
            fechaCumplimiento: 'Permanente',
            evaluacion: 'Por Examen/Certificado Aprobado',
            programmed: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
            executed:   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
    ]
};

// Aliases para compatibilidad con código existente
export const DEFAULT_SUBPROGRAM_GENERAL: TrainingSubprogram = {
    id: 'subprog_general',
    code: 'F-SIG-066',
    version: '01',
    title: 'PROGRAMA ANUAL DE CAPACITACIÓN DE SEGURIDAD, SALUD EN EL TRABAJO Y MEDIOAMBIENTE',
    sede: 'Red Vial 6 (Obras Nuevas - Zona Industrial Pisco)',
    fechaActualizacion: '29 de Noviembre 2026',
    elaboradoPor: 'Jose Luis Cancino Tueros',
    tipoParticipantes: 'Personal General / Obras Nuevas',
    items: [
        ...DEFAULT_SUBPROGRAM_CAP_SEGURIDAD.items,
        ...DEFAULT_SUBPROGRAM_CAP_SALUD.items.map((it, idx) => ({ ...it, item: 12 + idx + 1 })),
        ...DEFAULT_SUBPROGRAM_CAP_MA.items.map((it, idx) => ({ ...it, item: 21 + idx + 1 }))
    ]
};

export const DEFAULT_SUBPROGRAM_BRIGADISTAS: TrainingSubprogram = DEFAULT_SUBPROGRAM_CAP_BRIGADISTAS;

/**
 * Normaliza cadenas para comparación insensible a tildes, caracteres raros y mayúsculas
 */
function normalize(str: string): string {
    return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

/**
 * Vincula registros de Control de HHC (asistencias a capacitaciones) con el tema programado
 */
export function matchHhcRecordsForTopic(
    topicTema: string,
    topicItem: number,
    isBrig: boolean,
    monthIdx: number,
    hhcRecords: any[]
): any[] {
    if (!hhcRecords || hhcRecords.length === 0) return [];

    const normTopic = normalize(topicTema);

    return hhcRecords.filter(hhc => {
        const rawDate = hhc.date || hhc.fecha || hhc.created_at;
        if (!rawDate) return false;
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return false;
        if (d.getMonth() !== monthIdx) return false;

        const hayTema = normalize(hhc.tema || hhc.topic || hhc.capacitacion || hhc.actividad || '');
        if (!hayTema) return false;

        if (normTopic.includes(hayTema) || hayTema.includes(normTopic)) return true;

        // Coincidencias temáticas inteligentes
        if (normTopic.includes('epp') && hayTema.includes('epp')) return true;
        if (normTopic.includes('ats') && hayTema.includes('ats')) return true;
        if (normTopic.includes('iperc') && hayTema.includes('iperc')) return true;
        if (normTopic.includes('defensivo') && (hayTema.includes('defensivo') || hayTema.includes('manejo'))) return true;
        if (normTopic.includes('ergonomia') && hayTema.includes('ergonom')) return true;
        if (normTopic.includes('caliente') && hayTema.includes('caliente')) return true;
        if (normTopic.includes('altura') && hayTema.includes('altura')) return true;
        if (normTopic.includes('zanja') && hayTema.includes('zanja')) return true;
        if (normTopic.includes('bloqueo') && (hayTema.includes('bloqueo') || hayTema.includes('loto'))) return true;
        if (normTopic.includes('izaje') && hayTema.includes('izaje')) return true;
        if (normTopic.includes('covid') && hayTema.includes('covid')) return true;
        if (normTopic.includes('solar') && (hayTema.includes('solar') || hayTema.includes('radiacion'))) return true;
        if (normTopic.includes('audicion') && (hayTema.includes('auditi') || hayTema.includes('ruido') || hayTema.includes('hipoacusia'))) return true;
        if (normTopic.includes('cardiovascular') && hayTema.includes('cardio')) return true;
        if (normTopic.includes('sueno') && hayTema.includes('sueno')) return true;
        if (normTopic.includes('vision') && (hayTema.includes('vision') || hayTema.includes('ojos'))) return true;
        if (normTopic.includes('diabetes') && hayTema.includes('diabetes')) return true;
        if (normTopic.includes('sexual') && hayTema.includes('sexual')) return true;
        if (normTopic.includes('derrame') && hayTema.includes('derrame')) return true;
        if (normTopic.includes('residuo') && hayTema.includes('residuo')) return true;
        if (normTopic.includes('sismo') && (hayTema.includes('sismo') || hayTema.includes('tsunami') || hayTema.includes('evacuacion'))) return true;
        if (normTopic.includes('incendio') && (hayTema.includes('incendio') || hayTema.includes('fuego') || hayTema.includes('extintor'))) return true;
        if (normTopic.includes('auxilios') && hayTema.includes('auxilio')) return true;

        return false;
    });
}

/**
 * Vincula registros de CONTROL SCSST (evidence_center_records) con las capacitaciones del Subcomité
 */
export function matchScsstTrainingRecords(
    topicTema: string,
    topicItem: number,
    monthIdx: number,
    evidenceRecords: any[]
): any[] {
    if (!evidenceRecords || evidenceRecords.length === 0) return [];
    const normTopic = normalize(topicTema);

    return evidenceRecords.filter(rec => {
        if (!rec) return false;
        const rawDate = rec.date || rec.fecha || rec.created_at;
        if (!rawDate) return false;

        let m = -1;
        if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
            m = parseInt(rawDate.split('-')[1], 10) - 1;
        } else {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) m = d.getMonth();
        }
        if (m !== monthIdx) return false;

        const isScsstObj = String(rec.objective || '').toUpperCase().includes('OBJ 01') || String(rec.objective || '').toUpperCase().includes('OBJ 1');
        const act = normalize(rec.activity || rec.description || '');

        if (!isScsstObj && !act.includes('scsst') && !act.includes('subcomite')) return false;

        // Debe ser obligatoriamente una capacitación del subcomité (excluye actas ordinarias, informes o inspecciones)
        if (!act.includes('capacitac')) return false;

        if (normTopic.includes('inspecci') && act.includes('inspecci')) return true;
        if ((normTopic.includes('notificaci') || normTopic.includes('incidente') || normTopic.includes('investiga')) &&
            (act.includes('notificaci') || act.includes('incidente') || act.includes('investiga'))) return true;
        if ((normTopic.includes('funciones') || normTopic.includes('facultad') || normTopic.includes('responsab')) &&
            (act.includes('funciones') || act.includes('facultad') || act.includes('responsab') || act.includes('ley 29783'))) return true;
        if ((normTopic.includes('iperc') || normTopic.includes('peligro') || normTopic.includes('riesgo')) &&
            (act.includes('iperc') || act.includes('peligro') || act.includes('riesgo'))) return true;

        return false;
    });
}

/**
 * Parser inteligente de archivos Excel oficiales F-SIG-066
 */
export function parseTrainingExcelFile(buffer: ArrayBuffer): {
    seguridad?: TrainingSubprogram;
    salud?: TrainingSubprogram;
    medioAmbiente?: TrainingSubprogram;
    brigadistas?: TrainingSubprogram;
    scsst?: TrainingSubprogram;
    general?: TrainingSubprogram;
    totalItems: number;
} {
    const wb = XLSX.read(buffer, { type: 'array' });
    let totalItems = 0;

    let seguridadResult: TrainingSubprogram | undefined;
    let saludResult: TrainingSubprogram | undefined;
    let maResult: TrainingSubprogram | undefined;
    let brigadistasResult: TrainingSubprogram | undefined;
    let scsstResult: TrainingSubprogram | undefined;

    wb.SheetNames.forEach(sheetName => {
        const ws = wb.Sheets[sheetName];
        if (!ws) return;
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (data.length < 5) return;

        const sLower = sheetName.toLowerCase();
        let targetType: 'seguridad' | 'salud' | 'ma' | 'brigadistas' | 'scsst' | null = null;

        if (sLower.includes('scsst')) {
            const first15RowsText = JSON.stringify(data.slice(0, 15)).toLowerCase();
            if (first15RowsText.includes('sismo') || first15RowsText.includes('brigadista')) {
                targetType = 'brigadistas';
            } else {
                targetType = 'scsst';
            }
        } else if (sLower.includes('brigad')) {
            targetType = 'brigadistas';
        } else if (sLower.includes('salud') || sLower.includes('medico')) {
            targetType = 'salud';
        } else if (sLower.includes('ma') || sLower.includes('medio') || sLower.includes('ambient')) {
            targetType = 'ma';
        } else if (sLower.includes('seguridad')) {
            targetType = 'seguridad';
        }

        let headerRowIdx = -1;
        let monthColMap: { [m: number]: { p: number; e: number } } = {};

        for (let r = 0; r < Math.min(data.length, 25); r++) {
            const row = data[r] || [];
            for (let c = 0; c < row.length; c++) {
                const cell = String(row[c] || '').trim().toUpperCase();
                if (cell === 'ENE' || cell.startsWith('ENERO')) {
                    headerRowIdx = r;
                    break;
                }
            }
            if (headerRowIdx !== -1) break;
        }

        if (headerRowIdx !== -1) {
            const subRow = data[headerRowIdx + 1] || [];
            const pCols: number[] = [];
            for (let c = 0; c < subRow.length; c++) {
                if (String(subRow[c] || '').trim().toUpperCase() === 'P') {
                    pCols.push(c);
                }
            }
            if (pCols.length >= 12) {
                pCols.slice(0, 12).forEach((pCol, idx) => {
                    monthColMap[idx] = { p: pCol, e: pCol + 1 };
                });
            }
        }

        if (Object.keys(monthColMap).length < 12) return;

        const parsedItems: SubprogramItem[] = [];
        for (let r = headerRowIdx + 2; r < data.length; r++) {
            const row = data[r];
            if (!row || row.length === 0) continue;

            const firstStr = String(row[0] || row[1] || '').trim().toUpperCase();
            if (firstStr.includes('TOTAL') || firstStr.includes('PORCENTAJE')) break;

            let itemNum: number | null = null;
            let tema = '';
            let sede = 'PAD y Zonas Industriales';
            let dirigido = 'PAD y Zonas Industriales';
            let tipo = 'Capacitacion';
            let modalidad = 'Interna';

            for (let c = 0; c < 3; c++) {
                const val = Number(row[c]);
                if (!isNaN(val) && val > 0 && Number.isInteger(val)) {
                    itemNum = val;
                    tema = String(row[c + 1] || '').trim();
                    sede = String(row[c + 2] || 'PAD y Zonas Industriales').trim();
                    dirigido = String(row[c + 3] || 'PAD y Zonas Industriales').trim();
                    tipo = String(row[c + 4] || 'Capacitacion').trim();
                    modalidad = String(row[c + 5] || 'Interna').trim();
                    break;
                }
            }

            if (!itemNum || !tema) continue;

            const prog: number[] = new Array(12).fill(0);
            const exec: number[] = new Array(12).fill(0);

            for (let m = 0; m < 12; m++) {
                const pCol = monthColMap[m]?.p;
                const eCol = monthColMap[m]?.e;
                if (pCol !== undefined) {
                    const rawP = Number(row[pCol]);
                    prog[m] = !isNaN(rawP) ? rawP : 0;
                }
                if (eCol !== undefined) {
                    const rawE = Number(row[eCol]);
                    exec[m] = !isNaN(rawE) ? rawE : 0;
                }
            }

            parsedItems.push({
                item: itemNum,
                tema,
                sede,
                dirigido,
                tipo,
                modalidad,
                horas: targetType === 'ma' ? 0.15 : (targetType === 'brigadistas' && itemNum === 1 ? 2 : 1),
                costo: 0,
                capacitador: 'Area SSTMA',
                fechaCumplimiento: 'Permanente según ingreso de personal nuevo',
                evaluacion: 'Por Examen/Certificado Aprobado',
                programmed: prog,
                executed: exec
            });
        }

        if (parsedItems.length > 0) {
            totalItems += parsedItems.length;
            const subprogram: TrainingSubprogram = {
                id: targetType === 'scsst' ? 'subprog_scsst'
                    : targetType === 'brigadistas' ? 'subprog_brigadistas'
                    : targetType === 'salud' ? 'subprog_salud'
                    : targetType === 'ma' ? 'subprog_ma'
                    : 'subprog_seguridad',
                code: 'F-SIG-066',
                version: '01',
                title: `PROGRAMA ANUAL DE CAPACITACIÓN — ${(targetType || 'GENERAL').toUpperCase()}`,
                sede: 'Red Vial 6 (Obras Nuevas - Zona Industrial Pisco)',
                fechaActualizacion: '29 de Noviembre 2026',
                elaboradoPor: 'Jose Luis Cancino Tueros',
                tipoParticipantes: targetType === 'scsst' ? 'SCSST' : targetType === 'brigadistas' ? 'Brigadistas' : 'Personal General / Obras Nuevas',
                items: parsedItems
            };

            if (targetType === 'seguridad') seguridadResult = subprogram;
            else if (targetType === 'salud') saludResult = subprogram;
            else if (targetType === 'ma') maResult = subprogram;
            else if (targetType === 'brigadistas') brigadistasResult = subprogram;
            else if (targetType === 'scsst') scsstResult = subprogram;
        }
    });

    const generalItems: SubprogramItem[] = [
        ...(seguridadResult?.items || DEFAULT_SUBPROGRAM_CAP_SEGURIDAD.items),
        ...(saludResult?.items || DEFAULT_SUBPROGRAM_CAP_SALUD.items).map((it, idx) => ({ ...it, item: 12 + idx + 1 })),
        ...(maResult?.items || DEFAULT_SUBPROGRAM_CAP_MA.items).map((it, idx) => ({ ...it, item: 21 + idx + 1 }))
    ];

    const generalResult: TrainingSubprogram = {
        id: 'subprog_general',
        code: 'F-SIG-066',
        version: '01',
        title: 'PROGRAMA ANUAL DE CAPACITACIÓN DE SEGURIDAD, SALUD EN EL TRABAJO Y MEDIOAMBIENTE',
        sede: 'Red Vial 6 (Obras Nuevas - Zona Industrial Pisco)',
        fechaActualizacion: '29 de Noviembre 2026',
        elaboradoPor: 'Jose Luis Cancino Tueros',
        tipoParticipantes: 'Personal General / Obras Nuevas',
        items: generalItems
    };

    return {
        seguridad: seguridadResult,
        salud: saludResult,
        medioAmbiente: maResult,
        brigadistas: brigadistasResult,
        scsst: scsstResult,
        general: generalResult,
        totalItems
    };
}

/**
 * Genera el libro Excel oficial F-SIG-066 con todas las hojas correspondientes,
 * integrando las cantidades en P y en E según la plataforma y Control SCSST / HHC
 */
export function generateTrainingExcelWorkbook(
    subprograms: Record<string, TrainingSubprogram>,
    hhcRecords: any[] = [],
    evidenceRecords: any[] = []
): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'];

    const targets: { key: string; name: string; defaultProg: TrainingSubprogram; isBrig: boolean; isScsst: boolean }[] = [
        { key: 'subprog_seguridad', name: 'Capac. Seguridad', defaultProg: DEFAULT_SUBPROGRAM_CAP_SEGURIDAD, isBrig: false, isScsst: false },
        { key: 'subprog_salud', name: 'Capac. Salud', defaultProg: DEFAULT_SUBPROGRAM_CAP_SALUD, isBrig: false, isScsst: false },
        { key: 'subprog_ma', name: 'Capac. Medio Ambiente', defaultProg: DEFAULT_SUBPROGRAM_CAP_MA, isBrig: false, isScsst: false },
        { key: 'subprog_brigadistas', name: 'Entren. Brigadistas', defaultProg: DEFAULT_SUBPROGRAM_CAP_BRIGADISTAS, isBrig: true, isScsst: false },
        { key: 'subprog_scsst', name: 'Capac. Subcomite SCSST', defaultProg: DEFAULT_SUBPROGRAM_CAP_SCSST, isBrig: false, isScsst: true }
    ];

    targets.forEach(({ key, name, defaultProg, isBrig, isScsst }) => {
        const prog = subprograms[key] || defaultProg;
        const wsData: any[][] = [];

        wsData.push(['', '', '', '', 'PROGRAMA ANUAL DE CAPACITACIÓN DE SEGURIDAD, SALUD EN EL TRABAJO Y MEDIOAMBIENTE', '', '', '', '', '', '', '', '', '', '', 'Código:', 'F-SIG-066']);
        wsData.push([]);
        wsData.push(['', 'SEDE / PROYECTO:', '', '', prog.sede || 'Red Vial 6 (Obras Nuevas - Zona Industrial Pisco)']);
        wsData.push(['', 'FECHA DE ACTUALIZACIÓN:', '', '', prog.fechaActualizacion || '29 de Noviembre 2026']);
        wsData.push([]);

        const h1 = ['', 'ITEM', 'TEMAS DE CAPACITACIÓN', '', 'LUGAR/SEDE', 'PARTICIPANTES DIRIGIDO A:', 'TIPO DE CAPACITACIÓN', 'CAPACITACIÓN (Interna o Externa)', 'AÑO 2026'];
        for (let i = 0; i < 23; i++) h1.push('');
        h1.push('TOTAL HORAS', 'COSTO', 'CAPACITADOR', 'FECHA CUMPLIMIENTO', 'EVALUACIÓN');
        wsData.push(h1);

        const h2 = ['', '', '', '', '', '', '', ''];
        months.forEach(m => {
            h2.push(m, '');
        });
        h2.push('TOT P', 'TOT E', '% CUMPLIMIENTO');
        wsData.push(h2);

        const h3 = ['', '', '', '', '', '', '', ''];
        months.forEach(() => {
            h3.push('P', 'E');
        });
        h3.push('', '', '');
        wsData.push(h3);

        const monthlyTotalsP = new Array(12).fill(0);
        const monthlyTotalsE = new Array(12).fill(0);

        (prog.items || []).forEach(it => {
            const row: any[] = [
                '',
                it.item,
                it.tema,
                '',
                it.sede || 'PAD y Zonas Industriales',
                it.dirigido || 'PAD y Zonas Industriales',
                it.tipo || 'Capacitacion',
                it.modalidad || 'Interna'
            ];

            let totP = 0;
            let totE = 0;

            for (let m = 0; m < 12; m++) {
                const p = (it.programmed && it.programmed[m]) || 0;
                let e = 0;

                if (p > 0) {
                    if (isScsst) {
                        const matchedScsst = matchScsstTrainingRecords(it.tema, it.item, m, evidenceRecords);
                        e = matchedScsst.length > 0 ? matchedScsst.length : ((it.executed && it.executed[m]) || 0);
                    } else {
                        const matchedHhc = matchHhcRecordsForTopic(it.tema, it.item, isBrig, m, hhcRecords);
                        e = matchedHhc.length > 0 ? matchedHhc.length : ((it.executed && it.executed[m]) || 0);
                    }
                }

                totP += p;
                totE += e;
                monthlyTotalsP[m] += p;
                monthlyTotalsE[m] += e;

                row.push(p > 0 ? p : '', e > 0 ? e : '');
            }

            const pct = totP > 0 ? Math.round((totE / totP) * 100) + '%' : '-';
            row.push(totP, totE, pct, it.horas || 1, it.costo || 0, it.capacitador || 'Area SSTMA', it.fechaCumplimiento || '', it.evaluacion || '');
            wsData.push(row);
        });

        // Totales al pie de página
        const sumTotalP = monthlyTotalsP.reduce((a, b) => a + b, 0);
        const sumTotalE = monthlyTotalsE.reduce((a, b) => a + b, 0);

        const totRowP: any[] = ['', '', 'TOTAL DE CAPACITACIONES PROGRAMADAS POR MES', '', '', '', '', ''];
        months.forEach((_, m) => {
            totRowP.push(monthlyTotalsP[m], '');
        });
        totRowP.push(sumTotalP, '', '100%');
        wsData.push(totRowP);

        const totRowE: any[] = ['', '', 'TOTAL DE CAPACITACIONES EJECUTADAS POR MES', '', '', '', '', ''];
        months.forEach((_, m) => {
            totRowE.push('', monthlyTotalsE[m]);
        });
        totRowE.push('', sumTotalE, sumTotalP > 0 ? Math.round((sumTotalE / sumTotalP) * 100) + '%' : '0%');
        wsData.push(totRowE);

        const pctRow: any[] = ['', '', 'PORCENTAJE DE CUMPLIMIENTO', '', '', '', '', ''];
        months.forEach((_, m) => {
            const p = monthlyTotalsP[m];
            const e = monthlyTotalsE[m];
            const pct = p > 0 ? Math.round((e / p) * 100) + '%' : '-';
            pctRow.push(pct, '');
        });
        pctRow.push('', '', sumTotalP > 0 ? Math.round((sumTotalE / sumTotalP) * 100) + '%' : '0%');
        wsData.push(pctRow);

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, name);
    });

    return wb;
}
