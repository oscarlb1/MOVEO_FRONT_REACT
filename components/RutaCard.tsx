import { Ruta } from '@/services/rutaService';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Calendar, Clock, MapPin, Truck } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RutaCardProps {
    ruta: Ruta;
    onPress: () => void;
}

export default function RutaCard({ ruta, onPress }: RutaCardProps) {
    const getStatusConfig = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDIENTE': return { color: '#E67E50', label: 'Pendiente' };
            case 'EN_PROGRESO': return { color: '#3B82F6', label: 'En Progreso' };
            case 'COMPLETADA': return { color: '#10B981', label: 'Completada' };
            case 'CANCELADA': return { color: '#EF4444', label: 'Cancelada' };
            default: return { color: '#9BA1A6', label: status };
        }
    };

    const status = getStatusConfig(ruta.estado);

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.header}>
                <View style={[styles.statusBadge, { backgroundColor: `${status.color}15` }]}>
                    <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
                <View style={styles.dateContainer}>
                    <Calendar size={14} color="rgba(255, 255, 255, 0.4)" />
                    <Text style={styles.dateText}>
                        {new Date(ruta.fecha).toLocaleDateString()}
                    </Text>
                </View>
            </View>

            <View style={styles.body}>
                <View style={styles.mainInfo}>
                    <Text style={styles.routeId}>Ruta #{ruta.id}</Text>
                    <View style={styles.infoRow}>
                        <Truck size={16} color="rgba(255, 255, 255, 0.4)" />
                        <Text style={styles.infoText}>
                            Vehículo: <Text style={styles.highlightText}>{ruta.matriculaVehiculo || 'N/A'}</Text>
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <MapPin size={16} color="rgba(255, 255, 255, 0.4)" />
                        <Text style={styles.infoText}>
                            Distancia: <Text style={styles.highlightText}>{ruta.distanciaTotalEstimada} km</Text>
                        </Text>
                    </View>
                </View>

                <LinearGradient
                    colors={['#E67E50', '#D35400']}
                    style={styles.actionButton}
                >
                    <ArrowRight size={20} color="white" />
                </LinearGradient>
            </View>

            <View style={styles.footer}>
                <Clock size={14} color="rgba(255, 255, 255, 0.3)" />
                <Text style={styles.footerText}>Actualizado hace poco</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dateText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 13,
        fontWeight: '500',
    },
    body: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    mainInfo: {
        flex: 1,
    },
    routeId: {
        fontSize: 20,
        fontWeight: '800',
        color: 'white',
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 8,
    },
    infoText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 14,
        fontWeight: '500',
    },
    highlightText: {
        color: 'white',
        fontWeight: '600',
    },
    actionButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#E67E50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        gap: 6,
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 11,
        fontWeight: '500',
    },
});
