
export interface EstadisticaHoy {
    entregasTotales: number;
    entregasCompletadas: number;
    eficiencia: number;
    tiempoEnRuta: string;
}

export const statsService = {
    getMisEstadisticasHoy: async (): Promise<EstadisticaHoy> => {
        // Mock data to bypass 404 error until backend endpoint is confirmed
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    entregasTotales: 15,
                    entregasCompletadas: 12,
                    eficiencia: 80,
                    tiempoEnRuta: "4h 30m"
                });
            }, 500);
        });
        // const response = await api.get<EstadisticaHoy>('Estadisticas/me/hoy');
        // return response.data;
    }
};
