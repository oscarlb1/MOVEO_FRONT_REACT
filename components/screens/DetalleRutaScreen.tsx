import { entregaService } from '@/services/entregaService';
import { Ruta, rutaService } from '@/services/rutaService';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, MapPin, Navigation, Truck } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DetalleRutaScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [ruta, setRuta] = useState<Ruta | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (id) {
            fetchRutaDetalle(Number(id));
        }
    }, [id]);

    const fetchRutaDetalle = async (rutaId: number) => {
        try {
            const data = await rutaService.getRutaDetalle(rutaId);
            setRuta(data);
        } catch (error) {
            console.error('Error fetching route details', error);
            Alert.alert('Error', 'No se pudo cargar la ruta');
        } finally {
            setLoading(false);
        }
    };

    const handleEstadoChange = async () => {
        if (!ruta) return;

        let nuevoEstado = '';
        if (ruta.estado === 'PENDIENTE') nuevoEstado = 'EN_PROGRESO';
        else if (ruta.estado === 'EN_PROGRESO') nuevoEstado = 'COMPLETADA';
        else return;

        setActionLoading(true);
        const success = await rutaService.updateEstadoRuta(ruta.id, nuevoEstado);
        setActionLoading(false);

        if (success) {
            setRuta({ ...ruta, estado: nuevoEstado });
            Alert.alert('Éxito', `Ruta marcada como ${nuevoEstado}`);
        } else {
            Alert.alert('Error', 'No se pudo actualizar el estado de la ruta');
        }
    };

    const handleEntregaEstadoChange = async (entregaId: number, nuevoEstado: string) => {
        setActionLoading(true);
        const success = await entregaService.updateEstadoEntrega(entregaId, { Estado: nuevoEstado });
        setActionLoading(false);

        if (success) {
            setRuta(prev => {
                if (!prev || !prev.entregas) return prev;
                const updatedEntregas = prev.entregas.map(e =>
                    e.id === entregaId ? { ...e, estado: nuevoEstado } : e
                );
                return { ...prev, entregas: updatedEntregas };
            });
            Alert.alert('Éxito', 'Estado de entrega actualizado');
        } else {
            Alert.alert('Error', 'No se pudo actualizar la entrega');
        }
    };

    const openMap = () => {
        if (!ruta?.entregas || ruta.entregas.length === 0) {
            Alert.alert('Info', 'No hay entregas en esta ruta');
            return;
        }

        const sortedEntregas = [...ruta.entregas].sort((a, b) => a.ordenParada - b.ordenParada);
        const destination = encodeURIComponent(sortedEntregas[sortedEntregas.length - 1].cliente.direccion);
        const waypoints = sortedEntregas
            .slice(0, -1)
            .map(e => encodeURIComponent(e.cliente.direccion))
            .join('|');

        const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;

        Linking.openURL(url).catch(err => {
            console.error('An error occurred', err);
            Alert.alert('Error', 'No se pudo abrir el mapa');
        });
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#E67E50" />
                <Text style={styles.loadingText}>Cargando detalles...</Text>
            </View>
        );
    }

    if (!ruta) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Ruta no encontrada</Text>
                    <TouchableOpacity onPress={() => router.back()} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Ruta #{ruta.id}</Text>
                    <View style={styles.statusChip}>
                        <View style={[styles.statusDot, { backgroundColor: ruta.estado === 'COMPLETADA' ? '#10B981' : '#E67E50' }]} />
                        <Text style={styles.statusChipText}>{ruta.estado}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.mapIconButton} onPress={openMap}>
                    <Navigation color="white" size={22} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Route Info Card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Calendar size={16} color="rgba(255, 255, 255, 0.4)" />
                            <Text style={styles.infoLabel}>Fecha</Text>
                            <Text style={styles.infoValue}>{new Date(ruta.fecha).toLocaleDateString()}</Text>
                        </View>
                        <View style={styles.infoDivider} />
                        <View style={styles.infoItem}>
                            <Truck size={16} color="rgba(255, 255, 255, 0.4)" />
                            <Text style={styles.infoLabel}>Vehículo</Text>
                            <Text style={styles.infoValue}>{ruta.matriculaVehiculo || 'N/A'}</Text>
                        </View>
                    </View>
                    <View style={styles.infoRowSecondary}>
                        <Text style={styles.distanceLabel}>Distancia estimada:</Text>
                        <Text style={styles.distanceValue}>{ruta.distanciaTotalEstimada} km</Text>
                    </View>
                </View>

                {/* Main Action Button for Route */}
                {ruta.estado !== 'COMPLETADA' && ruta.estado !== 'CANCELADA' && (
                    <TouchableOpacity
                        style={[styles.mainActionButton, actionLoading && styles.disabledButton]}
                        onPress={handleEstadoChange}
                        disabled={actionLoading}
                    >
                        <LinearGradient
                            colors={['#E67E50', '#D35400']}
                            style={styles.gradientButton}
                        >
                            {actionLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Text style={styles.mainActionButtonText}>
                                        {ruta.estado === 'PENDIENTE' ? 'INICIAR RUTA' : 'FINALIZAR RUTA'}
                                    </Text>
                                    <ArrowRight color="white" size={20} />
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {/* Deliveries Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Entregas Programadas</Text>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{ruta.entregas?.length || 0}</Text>
                    </View>
                </View>

                {ruta.entregas?.map((entrega) => (
                    <View key={entrega.id} style={styles.entregaCard}>
                        <View style={styles.entregaMain}>
                            <View style={styles.orderCircle}>
                                <Text style={styles.orderNumber}>{entrega.ordenParada}</Text>
                            </View>
                            <View style={styles.entregaDetails}>
                                <Text style={styles.clientName}>{entrega.cliente.nombreEmpresa}</Text>
                                <View style={styles.addressRow}>
                                    <MapPin size={14} color="rgba(255, 255, 255, 0.3)" />
                                    <Text style={styles.addressText} numberOfLines={1}>{entrega.cliente.direccion}</Text>
                                </View>
                            </View>
                            <View style={[styles.deliveryStatusBadge,
                            entrega.estado === 'ENTREGADO' ? styles.statusSuccess :
                                entrega.estado === 'CANCELADO' ? styles.statusError : styles.statusPending]}>
                                <Text style={styles.deliveryStatusText}>{entrega.estado}</Text>
                            </View>
                        </View>

                        {entrega.estado !== 'ENTREGADO' && entrega.estado !== 'CANCELADO' && (
                            <View style={styles.deliveryActions}>
                                <TouchableOpacity
                                    style={styles.confirmBtn}
                                    onPress={() => handleEntregaEstadoChange(entrega.id, 'ENTREGADO')}
                                >
                                    <CheckCircle2 color="#E67E50" size={18} />
                                    <Text style={styles.confirmBtnText}>Marcar Entregado</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                ))}

                <View style={styles.spacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#092C4C',
    },
    loader: {
        flex: 1,
        backgroundColor: '#092C4C',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        gap: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: 'white',
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusChipText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    mapIconButton: {
        width: 44,
        height: 44,
        borderRadius: 15,
        backgroundColor: 'rgba(230, 126, 80, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E67E50',
    },
    content: {
        padding: 24,
    },
    infoCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        marginBottom: 24,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoItem: {
        flex: 1,
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 6,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    infoValue: {
        fontSize: 16,
        color: 'white',
        fontWeight: '700',
        marginTop: 2,
    },
    infoDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    infoRowSecondary: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        gap: 8,
    },
    distanceLabel: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 13,
    },
    distanceValue: {
        color: '#E67E50',
        fontSize: 13,
        fontWeight: '700',
    },
    mainActionButton: {
        height: 64,
        borderRadius: 20,
        marginBottom: 40,
        overflow: 'hidden',
        shadowColor: '#E67E50',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    gradientButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    mainActionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    disabledButton: {
        opacity: 0.7,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: 'white',
    },
    countBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: 10,
    },
    countText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    entregaCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    entregaMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    orderCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E67E50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderNumber: {
        color: 'white',
        fontWeight: '800',
        fontSize: 14,
    },
    entregaDetails: {
        flex: 1,
    },
    clientName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    addressText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
    },
    deliveryStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    deliveryStatusText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    statusSuccess: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    statusError: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    statusPending: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    deliveryActions: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    confirmBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(230, 126, 80, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(230, 126, 80, 0.2)',
    },
    confirmBtnText: {
        color: '#E67E50',
        fontSize: 14,
        fontWeight: '700',
    },
    spacer: {
        height: 60,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorText: {
        color: '#FF5252',
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#E67E50',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: '700',
    }
});
