import api from './api';

export interface Ruta {
    id: number;
    fecha: string;
    conductorId: number;
    vehiculoId: number;
    estado: string; // "PENDIENTE", "EN_PROGRESO", "COMPLETADA", "CANCELADA"
    distanciaTotalEstimada: number;
    // Expanded with specific fields if needed
    vehiculo?: {
        matricula: string;
        marcaModelo: string;
    };
    entregas?: Entrega[];
}

export interface Entrega {
    id: number;
    estado: string;
    ordenParada: number;
    cliente: {
        nombreEmpresa: string;
        alamat: string; // Backend might use 'direccion', need to check DTO match
        direccion: string;
        telefono: string;
    };
}

export const rutaService = {
    // Get routes for the logged-in user
    async getMisRutas(): Promise<Ruta[]> {
        const response = await api.get<Ruta[]>('/Ruta/me');
        return response.data;
    },

    // Get specific route details
    async getRutaDetalle(id: number): Promise<Ruta> {
        const response = await api.get<Ruta>(`/Ruta/${id}`);
        return response.data;
    },

    // Update route status
    async updateEstadoRuta(id: number, nuevoEstado: string): Promise<boolean> {
        try {
            await api.patch(`/Ruta/${id}/estado`, { nuevoEstado });
            return true;
        } catch (error) {
            console.error('Error updating route status', error);
            return false;
        }
    }
};
