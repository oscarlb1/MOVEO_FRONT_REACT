import api from './api';

export interface EstadisticaHoy {
    entregasTotales: number;
    entregasCompletadas: number;
    eficiencia: number;
    tiempoEnRuta: string;
}

export const statsService = {
    getMisEstadisticasHoy: async (): Promise<EstadisticaHoy> => {
        const response = await api.get<EstadisticaHoy>('Estadisticas/me/hoy');
        return response.data;
    }
};
