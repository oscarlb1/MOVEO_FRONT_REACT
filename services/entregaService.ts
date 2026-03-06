import api from './api';

export interface ActualizarEstadoEntregaDto {
    Estado: string;
    Notas?: string;
    FotoUrl?: string;
    FirmaDigitalUrl?: string;
}

export const entregaService = {
    // Update delivery status
    async updateEstadoEntrega(id: number, dto: ActualizarEstadoEntregaDto): Promise<boolean> {
        try {
            await api.put(`Entregas/${id}/estado`, dto);
            return true;
        } catch (error) {
            console.error('Error updating delivery status', error);
            return false;
        }
    },

    async validarQrEntrega(idEntrega: number, codigoQr: string): Promise<boolean> {
        try {
            const response = await api.post(`Entregas/${idEntrega}/validar-qr`, { codigoQr });
            return response.status === 200;
        } catch (error) {
            console.error('Error al validar el código QR:', error);
            return false;
        }
    }
};
