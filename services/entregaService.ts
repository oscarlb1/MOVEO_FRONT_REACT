import api from './api';

export interface ActualizarEstadoEntregaDto {
    nuevoEstado: string;
    notas?: string;
    fotoUrl?: string;
    firmaDigitalUrl?: string;
}

export const entregaService = {
    // Update delivery status
    async updateEstadoEntrega(id: number, dto: ActualizarEstadoEntregaDto): Promise<boolean> {
        try {
            await api.put(`/Entregas/${id}/estado`, dto);
            return true;
        } catch (error) {
            console.error('Error updating delivery status', error);
            return false;
        }
    }
};
