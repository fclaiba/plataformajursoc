import type { Materia, Catedra, Comision, User } from '../types';

export const MOCK_USERS: User[] = [
    { id: '1', name: 'Juan Perez', email: 'juan@estudiante.unlp.edu.ar' },
    { id: '2', name: 'Maria Garcia', email: 'maria@estudiante.unlp.edu.ar' },
];

import { MATERIAS_INGRESANTES, CATEDRAS_INGRESANTES, COMISIONES_INGRESANTES } from './ingresantes2026';

export const MATERIAS: Materia[] = MATERIAS_INGRESANTES;
export const CATEDRAS: Catedra[] = CATEDRAS_INGRESANTES;
export const COMISIONES: Comision[] = COMISIONES_INGRESANTES;
