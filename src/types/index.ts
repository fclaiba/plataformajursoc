export interface Enrollment {
    materiaId: string;
    catedraId: string;
    comisionId: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    reputation?: number; // 0-5
    reviewsCount?: number;
    reviews?: Review[];
    documents?: string[];
    enrollments?: Enrollment[];
    approvedSubjects?: string[]; // List of materiaIds
}

export interface Message {
    id: string;
    senderId: string;
    receiverId: string; // or chatId
    requestId: string;
    content: string;
    timestamp: Date;
    read: boolean;
    type?: 'text' | 'image';
    mediaUrl?: string; // For simulation, this might be a blob URL or mock URL
}

export interface Review {
    id: string;
    reviewerId: string;
    targetUserId: string;
    requestId: string;
    rating: number; // 1-5
    comment: string;
    createdAt: Date;
}

export interface Materia {
    id: string;
    nombre: string;
    anio: number;
}

export interface Catedra {
    id: string;
    materiaId: string;
    nombre: string; // "Cátedra 1", "Cátedra 2"
}

export interface Comision {
    id: string;
    numero: number;
    catedraId: string;
    materiaId: string;
    profesor: string;
    horarios: Horario[];
    cuposTotales: number;
    cuposDisponibles: number;
}

export interface Horario {
    dia: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';
    inicio: string;
    fin: string;
}

export type RequestStatus = 'PENDING' | 'MATCHED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface ExchangeRequest {
    id: string;
    userId: string;
    materiaId: string;
    comisionOrigenId: string; // La que tiene
    comisionesDestino: {
        comisionId: string;
        prioridad: number; // 1, 2, 3...
    }[];
    status: RequestStatus;
    createdAt: Date;
    chatId?: string; // Link to conversation
    matchedRequestId?: string; // Linked request ID
    finalizedBy?: string[]; // User IDs who finalized
}
