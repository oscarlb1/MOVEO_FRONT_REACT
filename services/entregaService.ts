import api from './api';

export interface ActualizarEstadoEntregaDto {
    estado: string;
    notas?: string;
    fotoUrl?: string;
    firmaDigitalUrl?: string;
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

    async validarQrEntrega(idEntrega: number, codigoQr: string): Promise<{ success: boolean; message?: string }> {
        console.log(`[MOBILE] Llamando a validar-qr para entrega ${idEntrega} en: ${api.defaults.baseURL}/Entregas/${idEntrega}/validar-qr`);
        try {
            const response = await api.post(`Entregas/${idEntrega}/validar-qr`, { codigoQr });
            return {
                success: response.status === 200,
                message: response.data?.message
            };
        } catch (error: any) {
            console.error('Error al validar el código QR:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Error de conexión con el servidor.'
            };
        }
    }
};
