import type { Materia, Catedra, Comision, User } from '../types';

export const MOCK_USERS: User[] = [
    { id: '1', name: 'Juan Perez', email: 'juan@estudiante.unlp.edu.ar' },
    { id: '2', name: 'Maria Garcia', email: 'maria@estudiante.unlp.edu.ar' },
];

export const MATERIAS: Materia[] = [
    // PRIMER MATERIA INGRESANTES (Nivel 0)
    { id: 'intro-cs-soc-1', nombre: 'Introducción al estudio de las Ciencias Sociales - Cátedra I', anio: 0 },
    { id: 'intro-cs-soc-2', nombre: 'Introducción al estudio de las Ciencias Sociales - Cátedra II', anio: 0 },
    { id: 'taller-lecto', nombre: 'Taller de lectoescritura académica', anio: 0 },

    // PRIMER AÑO (Nivel 1)
    { id: 'intro-cs-soc', nombre: 'Introducción a las Ciencias Sociales', anio: 1 },
    { id: 'intro-der', nombre: 'Introducción al Derecho', anio: 1 },
    { id: 'hist-const', nombre: 'Historia Constitucional', anio: 1 },
    { id: 'intro-soc', nombre: 'Introducción a la Sociología', anio: 1 },
    { id: 'intro-pens-cient', nombre: 'Introducción al Pensamiento Científico', anio: 1 },
    { id: 'der-rom', nombre: 'Derecho Romano', anio: 1 },
    { id: 'der-pol', nombre: 'Derecho Político', anio: 1 },

    // SEGUNDO AÑO (Nivel 2)
    { id: 'taller-idioma-1', nombre: 'Taller de Lecto-Comprensión de Idioma I', anio: 2 },
    { id: 'taller-idioma-2', nombre: 'Taller de Lecto-Comprensión de Idioma II', anio: 2 },
    { id: 'der-priv-1', nombre: 'Derecho Privado I', anio: 2 },
    { id: 'der-priv-2', nombre: 'Derecho Privado II', anio: 2 },
    { id: 'der-pen-1', nombre: 'Derecho Penal I', anio: 2 },
    { id: 'der-const', nombre: 'Derecho Constitucional', anio: 2 },
    { id: 'ddhh', nombre: 'Derechos Humanos', anio: 2 },
    { id: 'teoria-conf', nombre: 'Teoría del Conflicto', anio: 2 },

    // TERCER AÑO (Nivel 3)
    { id: 'der-priv-4', nombre: 'Derecho Privado IV', anio: 3 },
    { id: 'der-priv-3', nombre: 'Derecho Privado III', anio: 3 },
    { id: 'der-proc-1', nombre: 'Derecho Procesal I', anio: 3 },
    { id: 'econ-pol', nombre: 'Economía Política', anio: 3 },
    { id: 'der-pen-2', nombre: 'Derecho Penal II', anio: 3 },
    { id: 'der-pub-prov', nombre: 'Derecho Público Provincial y Municipal', anio: 3 },
    { id: 'adapt-proc-pen', nombre: 'Adaptación Profesional en Procedimientos Penales', anio: 3 },
    { id: 'der-int-pub', nombre: 'Derecho Internacional Público', anio: 3 },

    // CUARTO AÑO (Nivel 4)
    { id: 'der-admin-1', nombre: 'Derecho Administrativo I', anio: 4 },
    { id: 'der-priv-5', nombre: 'Derecho Privado V', anio: 4 },
    { id: 'der-proc-2', nombre: 'Derecho Procesal II', anio: 4 },
    { id: 'der-soc-trab-6', nombre: 'Derecho Social del Trabajo (Plan 6)', anio: 4 },
    { id: 'mediacion', nombre: 'Mediación y Medios de Resolución de Conflictos', anio: 4 },
    { id: 'der-agr', nombre: 'Derecho Agrario', anio: 4 },
    { id: 'filosofia', nombre: 'Filosofía del Derecho', anio: 4 },
    { id: 'adapt-proc-civ', nombre: 'Adaptación Profesional de Proc. Civiles y Comerciales', anio: 4 },
    { id: 'der-com-2', nombre: 'Derecho Comercial II - Derecho Privado VI', anio: 4 },
    { id: 'der-soc-trab-5', nombre: 'Derecho Social del Trabajo y la previsión (Plan 5)', anio: 4 },

    // QUINTO AÑO (Nivel 5)
    { id: 'der-admin-2', nombre: 'Derecho Administrativo II', anio: 5 },
    { id: 'der-fam', nombre: 'Derecho de Familia', anio: 5 },
    { id: 'der-nav', nombre: 'Derecho de la Navegación', anio: 5 },
    { id: 'der-col-trab', nombre: 'Derecho Colectivo del Trabajo y de la Seguridad Social (Plan 6)', anio: 5 },
    { id: 'der-min', nombre: 'Derecho de Minería y Energía', anio: 5 },
    { id: 'soc-jur', nombre: 'Sociología Jurídica', anio: 5 },
    { id: 'der-int-priv', nombre: 'Derecho Internacional Privado', anio: 5 },
    { id: 'der-suc', nombre: 'Derecho de las Sucesiones', anio: 5 },
    { id: 'der-not', nombre: 'Derecho Notarial y Registral', anio: 5 },
    { id: 'finanzas', nombre: 'Finanzas y Derecho Financiero', anio: 5 },
    { id: 'der-civ-5', nombre: 'Derecho Civil V', anio: 5 },

    // EXTRAS (Nivel 6)
    { id: 'tutorias', nombre: 'TUTORIAS', anio: 6 },
    { id: 'orient-doc', nombre: 'Orientación Profesional - DOCENCIA E INVESTIGACIÓN', anio: 6 },
    { id: 'orient-des', nombre: 'Orientación Profesional - DERECHO, ESTADO Y SOCIEDAD', anio: 6 },
    { id: 'orient-priv', nombre: 'Orientación Profesional - DERECHO PRIVADO', anio: 6 },
    { id: 'orient-pub', nombre: 'Orientación Profesional - DERECHO PÚBLICO', anio: 6 },
    { id: 'sem-2025', nombre: 'SEMINARIOS 2025', anio: 7 },
    { id: 'sem-2024', nombre: 'SEMINARIOS 2024', anio: 7 },
    { id: 'sem-ver-23', nombre: 'SEMINARIOS DE VERANO 2023', anio: 7 },
    { id: 'sem-1c-23', nombre: 'SEMINARIOS PRIMER CUATRIMESTRE 2023', anio: 7 },
    { id: 'sem-2c-23', nombre: 'SEMINARIOS SEGUNDO CUATRIMESTRE 2023', anio: 7 },
    { id: 'pps', nombre: 'PRACTICAS PRE PROFESIONALES SUPERVISADAS', anio: 7 },
];

// Generate Mock Catedras and Comisiones for ALL Materias
export const CATEDRAS: Catedra[] = MATERIAS.flatMap(m => [
    { id: `cat1-${m.id}`, materiaId: m.id, nombre: 'Cátedra 1' },
    { id: `cat2-${m.id}`, materiaId: m.id, nombre: 'Cátedra 2' },
]);

// Helper to generate schedule
const getHorarios = (num: number) => {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const time = num % 2 === 0 ? '08:00 - 12:00' : '16:00 - 20:00';
    const day = days[num % 5];
    return [{ dia: day as any, inicio: time.split(' - ')[0], fin: time.split(' - ')[1] }];
};

export const COMISIONES: Comision[] = CATEDRAS.flatMap((c, idx) => [
    {
        id: `com1-${c.id}`,
        numero: parseInt(`${idx}01`),
        catedraId: c.id,
        materiaId: c.materiaId,
        profesor: idx % 2 === 0 ? 'Dr. Titular' : 'Dr. Adjunto',
        horarios: getHorarios(idx),
        cuposTotales: 60,
        cuposDisponibles: Math.floor(Math.random() * 10)
    },
    {
        id: `com2-${c.id}`,
        numero: parseInt(`${idx}02`),
        catedraId: c.id,
        materiaId: c.materiaId,
        profesor: 'Dra. Auxiliar',
        horarios: getHorarios(idx + 1),
        cuposTotales: 60,
        cuposDisponibles: Math.floor(Math.random() * 10)
    }
]);
