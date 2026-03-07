/**
 * Formatea un string de estado de base de datos (ej: EN_PROGRESO) 
 * a un formato legible y profesional (ej: En Progreso).
 */
export const formatStatus = (status: string | undefined | null): string => {
    if (!status) return 'Pendiente';

    return status
        .toLowerCase()
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
