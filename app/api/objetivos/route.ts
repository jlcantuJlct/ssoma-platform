export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

async function ensureTable() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS objetivos_anuales (
            id SERIAL PRIMARY KEY,
            workspace VARCHAR(100) NOT NULL,
            data_json TEXT,
            fecha_actualizacion VARCHAR(100) DEFAULT '16 de enero 2026',
            fecha_revision VARCHAR(100) DEFAULT 'Mensual',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

// Datos predeterminados oficiales CASA
export const DEFAULT_CASA_OBJECTIVES = [
    {
        id: 'casa_obj_1',
        codigo: 'OBJ 01',
        objetivo_estrategico: 'Asegurar la consulta, participación e información activa de los trabajadores y sus representantes',
        perspectiva_casa: 'Dar cumplimiento al Art. 19 de la Ley 29783 y Art. 34 del D.S. 011-2019-TR. Se realiza seguimiento mensual a los acuerdos del SCSST para resolver y asegurar la participación de los trabajadores.',
        responsable: 'Jefe de SSOMA / SCSST',
        indicador: 'Cumplimiento de acuerdos del SCSST',
        formula: '% Acu. = (N° Acuerdos realizados / N° Acuerdos programados) * 100',
        meta: '≥ 90%',
        frecuencia: 'Mensual',
        estrategia_acciones: 'Seguimiento y cierre mensual de acuerdos asentados en el libro de actas del Subcomité de SST; atención prioritaria a reportes de campo.',
        matchedProgramId: 'obj1'
    },
    {
        id: 'casa_obj_2',
        codigo: 'OBJ 02',
        objetivo_estrategico: 'Asegurar la formación, capacitación y entrenamiento de los trabajadores en seguridad',
        perspectiva_casa: 'Cumplir con el programa de capacitaciones (Art. 27 y 35 Ley 29783; Art. 18 inc. h y Art. 19 D.S. 011-2019-TR) para fortalecer las competencias operativas y la prevención en obra.',
        responsable: 'Jefe de SSOMA',
        indicador: 'Cumplimiento del Plan de Capacitación',
        formula: '% Cap. = (N° Cap. ejecutadas / N° Cap. programadas) * 100',
        meta: '100%',
        frecuencia: 'Mensual',
        estrategia_acciones: 'Ejecución de capacitaciones normativas.',
        matchedProgramId: 'obj2'
    },
    {
        id: 'casa_obj_3',
        codigo: 'OBJ 03',
        objetivo_estrategico: 'Reducir y corregir la cantidad de condiciones inseguras mediante inspecciones continuas',
        perspectiva_casa: 'Art. 32 inc. f de Ley 29783 y Art. 18 inc. c y f de D.S. 011-2019-TR. Implementar el plan de inspección y reporte para eliminar o reducir lesiones e incidentes en los frentes de trabajo.',
        responsable: 'Prevencionista SST / Residente de Obra',
        indicador: 'Inspecciones de Seguridad Operacional',
        formula: '% Insp. = (N° Insp. realizadas / N° Insp. programadas) * 100',
        meta: '100%',
        frecuencia: 'Mensual',
        estrategia_acciones: 'Inspecciones de campo planificadas e inopinadas (equipos pesados, herramientas manuales, señalización y EPP) con levantamiento oportuno de observaciones.',
        matchedProgramId: 'obj3'
    },
    {
        id: 'casa_obj_4',
        codigo: 'OBJ 04',
        objetivo_estrategico: 'Identificar y evaluar permanentemente los peligros y controlar los riesgos en el origen',
        perspectiva_casa: 'Art. 19 y 50 de la Ley 29783 y Art. 17 y 18 del D.S. 011-2019-TR. Aplicación estricta de la jerarquía de controles, matriz IPERC continua y Análisis de Trabajo Seguro (ATS).',
        responsable: 'Jefe de SSOMA / Capataces',
        indicador: 'Cierre de Actos y Condiciones Inseguras',
        formula: '% Cierre = (N° Actos y Cond. corregidos / N° Actos y Cond. reportados) * 100',
        meta: '≥ 90%',
        frecuencia: 'Mensual',
        estrategia_acciones: 'Monitorear la elaboración del ATS previo a trabajos de alto riesgo, entrega de reportes de actos/condiciones y seguimiento hasta su cierre efectivo.',
        matchedProgramId: 'obj4'
    },
    {
        id: 'casa_obj_5',
        codigo: 'OBJ 05',
        objetivo_estrategico: 'Identificar y realizar el seguimiento al personal con enfermedades ocupacionales (Vigilancia de Salud)',
        perspectiva_casa: 'Art. 49 inc. d de Ley 29783 y Art. 18 inc. k de D.S. 011-2019-TR. Realizar exámenes médicos ocupacionales para identificar observaciones médicas y hacer seguimiento preventivo.',
        responsable: 'Médico Ocupacional / Jefe de SSOMA',
        indicador: 'Cobertura de EMO y Vigilancia de la Salud',
        formula: '% EMO = (N° EMO realizados / N° Personal en planilla) * 100',
        meta: '100%',
        frecuencia: 'Mensual',
        estrategia_acciones: 'Verificar vigencia de EMO de ingreso y periódicos, control epidemiológico y seguimiento a trabajadores con restricciones o condiciones de salud preexistentes.',
        matchedProgramId: 'obj5'
    },
    {
        id: 'casa_obj_6',
        codigo: 'SEG 05',
        objetivo_estrategico: 'Garantizar la preparación y respuesta oportuna ante emergencias en obra',
        perspectiva_casa: 'Art. 32 y 83 de Ley 29783 y Art. 18 inc. j del D.S. 011-2019-TR. Disponer de brigadas capacitadas, medios de rescate y protocolos de contingencia en obra civil.',
        responsable: 'Jefe de SSOMA / Brigadistas',
        indicador: 'Cumplimiento del Plan de Emergencias',
        formula: '% Sim. = (N° Simulacros realizados / N° Simulacros programados) * 100',
        meta: '100%',
        frecuencia: 'Trimestral',
        estrategia_acciones: 'Entrenamiento a las brigadas de primeros auxilios, evacuación y lucha contra incendios; inspección operativa de extintores, camillas y botiquines.',
        matchedProgramId: 'obj10'
    },
    {
        id: 'casa_obj_7',
        codigo: 'SEG 03',
        objetivo_estrategico: 'Asegurar el cumplimiento ambiental, manejo de residuos sólidos y Plan de Manejo Ambiental (PMA)',
        perspectiva_casa: 'Perspectiva CASA SSOMA: Controles ambientales en frentes de trabajo, acopio y disposición final según normativa ambiental y PMA del proyecto.',
        responsable: 'Jefe de SSOMA',
        indicador: 'Evidencia e Informes de Gestión Ambiental',
        formula: '% Env. = (N° Evidencias realizadas / N° Evidencias programadas) * 100',
        meta: '100%',
        frecuencia: 'Mensual',
        estrategia_acciones: 'Generar informes mensuales con registro fotográfico de acopio temporal de residuos peligrosos y no peligrosos, y verificar cumplimiento del PMA.',
        matchedProgramId: 'obj8'
    },
    {
        id: 'casa_obj_8',
        codigo: 'LEG 01',
        objetivo_estrategico: 'Garantizar el cumplimiento y actualización de la matriz de requisitos legales aplicables en seguridad, salud ocupacional y medio ambiente.',
        perspectiva_casa: 'Objetivo específico: Se realizará la revisión, evaluación y seguimiento periódico de la matriz de requisitos legales y normativos aplicables al proyecto.',
        responsable: 'Jefe SSTMA',
        indicador: 'Cumplimiento de Requisitos Legales',
        formula: '% Cumpl. = (N° Requisitos ejecutados en el mes / N° Requisitos programado en el mes) * 100',
        meta: '100%',
        frecuencia: 'Mensual',
        estrategia_acciones: 'Verificación y seguimiento mensual de la matriz de requisitos legales.',
        matchedProgramId: undefined
    },
    {
        id: 'casa_obj_9',
        codigo: 'MEJ 01',
        objetivo_estrategico: 'Promover y ejecutar acciones de mejora continua derivados de inspecciones, auditorías, incidentes y revisiones del sistema de gestión SSTMA.',
        perspectiva_casa: 'Objetivo específico: Se implementará el seguimiento y cierre oportuno de las acciones correctivas, preventivas y oportunidades de mejora identificadas.',
        responsable: 'Jefe SSTMA',
        indicador: 'Eficacia de Mejora Continua',
        formula: '% Mejora = (N° Acciones de mejora cerradas / N° Acciones programadas) * 100',
        meta: '90%',
        frecuencia: 'Mensual',
        estrategia_acciones: 'Seguimiento mensual del plan de acción y mejora continua.',
        matchedProgramId: undefined
    }
];

// GET - Obtener los objetivos del año para el workspace activo
export async function GET(req: NextRequest) {
    try {
        await ensureTable();
        const cookieWs = req.cookies.get('ssoma_workspace')?.value;
        const queryWs = req.nextUrl.searchParams.get('workspace');
        const workspace = queryWs || (cookieWs ? decodeURIComponent(cookieWs) : 'Red Vial 6');

        const record = await db.fetchOne('SELECT * FROM objetivos_anuales WHERE workspace = ? ORDER BY id DESC LIMIT 1', [workspace]);

        let objetivos: any[] = DEFAULT_CASA_OBJECTIVES;
        let fecha_actualizacion = '16 de enero 2026';
        let fecha_revision = 'Mensual';

        if (record && record.data_json) {
            try {
                const parsed = JSON.parse(record.data_json);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    objetivos = parsed;
                }
                if (record.fecha_actualizacion) fecha_actualizacion = record.fecha_actualizacion;
                if (record.fecha_revision) fecha_revision = record.fecha_revision;
            } catch (e) {
                objetivos = DEFAULT_CASA_OBJECTIVES;
            }
        }

        return NextResponse.json({ 
            success: true, 
            workspace, 
            fecha_actualizacion,
            fecha_revision,
            objetivos 
        });
    } catch (error: any) {
        console.error('Error fetching objetivos anuales:', error);
        return NextResponse.json({ 
            success: true, 
            workspace: 'Red Vial 6', 
            fecha_actualizacion: '16 de enero 2026',
            fecha_revision: 'Mensual',
            objetivos: DEFAULT_CASA_OBJECTIVES 
        });
    }
}

// POST - Guardar o actualizar la lista de objetivos del año
export async function POST(req: NextRequest) {
    try {
        await ensureTable();
        const body = await req.json();
        const cookieWs = req.cookies.get('ssoma_workspace')?.value;
        const workspace = body.workspace || (cookieWs ? decodeURIComponent(cookieWs) : 'Red Vial 6');
        const objetivos = Array.isArray(body.objetivos) ? body.objetivos : [];
        const fecha_actualizacion = body.fecha_actualizacion || '16 de enero 2026';
        const fecha_revision = body.fecha_revision || 'Mensual';

        const existing = await db.fetchOne('SELECT id FROM objetivos_anuales WHERE workspace = ?', [workspace]);
        const dataJson = JSON.stringify(objetivos);

        if (existing) {
            await db.execute(
                'UPDATE objetivos_anuales SET data_json = ?, fecha_actualizacion = ?, fecha_revision = ?, updated_at = CURRENT_TIMESTAMP WHERE workspace = ?',
                [dataJson, fecha_actualizacion, fecha_revision, workspace]
            );
        } else {
            await db.execute(
                'INSERT INTO objetivos_anuales (workspace, data_json, fecha_actualizacion, fecha_revision) VALUES (?, ?, ?, ?)',
                [workspace, dataJson, fecha_actualizacion, fecha_revision]
            );
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Objetivos guardados exitosamente', 
            count: objetivos.length 
        });
    } catch (error: any) {
        console.error('Error saving objetivos anuales:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
