import api from './api';

export interface Notificacion {
    id: number;
    usuarioId: number;
    nombreUsuario: string;
    titulo: string;
    mensaje: string;
    leido: boolean;
    fecha: string;
}

class NotificacionService {
    async getMisNotificaciones(): Promise<Notificacion[]> {
        const response = await api.get<Notificacion[]>('Notificaciones');
        return response.data;
    }

    async getUnreadCount(): Promise<number> {
        const response = await api.get<number>('Notificaciones/unread-count');
        return response.data;
    }

    async marcarComoLeida(id: number): Promise<void> {
        await api.put(`Notificaciones/${id}/read`);
    }

    async marcarTodasComoLeidas(): Promise<void> {
        await api.put('Notificaciones/read-all');
    }

    async eliminar(id: number): Promise<void> {
        await api.delete(`Notificaciones/${id}`);
    }
}

export const notificacionService = new NotificacionService();
