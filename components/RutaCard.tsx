import { Ruta } from '@/services/rutaService';
import { ArrowRight, MapPin, Truck } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RutaCardProps {
    ruta: Ruta;
    onPress: () => void;
}

export default function RutaCard({ ruta, onPress }: RutaCardProps) {
    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDIENTE': return '#E67E50';
            case 'EN_PROGRESO': return '#3B82F6';
            case 'COMPLETADA': return '#10B981';
            case 'CANCELADA': return '#EF4444';
            default: return '#9BA1A6';
        }
    };

    const statusColor = getStatusColor(ruta.estado);

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.header}>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{ruta.estado}</Text>
                </View>
                <Text style={styles.dateText}>
                    {new Date(ruta.fecha).toLocaleDateString()}
                </Text>
            </View>

            <View style={styles.infoRow}>
                <Truck size={16} color="#9BA1A6" />
                <Text style={styles.infoText}>
                    Vehículo: {ruta.vehiculo ? `${ruta.vehiculo.marcaModelo} (${ruta.vehiculo.matricula})` : 'Sin asignar'}
                </Text>
            </View>

            <View style={styles.infoRow}>
                <MapPin size={16} color="#9BA1A6" />
                <Text style={styles.infoText}>Distancia: {ruta.distanciaTotalEstimada} km</Text>
            </View>

            <View style={styles.footer}>
                <Text style={styles.detailsText}>Ver detalles</Text>
                <ArrowRight size={16} color="#E67E50" />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    dateText: {
        color: '#9BA1A6',
        fontSize: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    infoText: {
        color: '#E67E50',
        fontSize: 14,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 8,
        gap: 4,
    },
    detailsText: {
        color: '#E67E50',
        fontSize: 14,
        fontWeight: '600',
    },
});
