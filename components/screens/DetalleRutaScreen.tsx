import { useLocationTracker } from '@/hooks/useLocationTracker';
import api from '@/services/api';
import { entregaService } from '@/services/entregaService';
import { Entrega, Ruta, rutaService } from '@/services/rutaService';
import { useAlert } from '@/store/alertStore';
import { formatStatus } from '@/utils/formatters';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, MapPin, Navigation, Truck } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Modal, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PodModal from '../modals/PodModal';
import ScannerModal from '../modals/ScannerModal';

export default function DetalleRutaScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [ruta, setRuta] = useState<Ruta | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [iaResult, setIaResult] = useState<{ visible: boolean; justificacion: string; success: boolean }>({ visible: false, justificacion: '', success: false });
    const { showAlert } = useAlert();

    // Delivery Modal State
    const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Location Tracking (preserved for other uses if needed)
    const { location } = useLocationTracker(
        ruta ? ruta.id : null,
        ruta?.estado === 'EN_PROGRESO'
    );

    // Delivery Flow states
    const [showQRModal, setShowQRModal] = useState(false);
    const [showPODModal, setShowPODModal] = useState(false);

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
            showAlert('Error', 'No se pudo cargar la ruta', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEstadoChange = async () => {
        if (!ruta) return;

        const estadoUpper = ruta.estado?.toUpperCase();
        let nuevoEstado = '';

        if (estadoUpper === 'PENDIENTE' || estadoUpper === 'PLANIFICADA') {
            nuevoEstado = 'EN_PROGRESO';
        } else if (estadoUpper === 'EN_PROGRESO' || estadoUpper === 'EN_CAMINO' || estadoUpper === 'EN_RUTA' || estadoUpper === 'EN_CURSO') {
            // Validar que todas las entregas estén finalizadas (ENTREGADO o CANCELADO)
            const entregasPendientes = ruta.entregas?.filter(e => {
                const entEstado = e.estado?.toUpperCase();
                return entEstado === 'PENDIENTE' || entEstado === 'EN_CAMINO' || entEstado === 'EN_PROGRESO';
            });

            if (entregasPendientes && entregasPendientes.length > 0) {
                showAlert(
                    'Entregas Pendientes',
                    'Debes realizar todas las entregas antes de finalizar la ruta.',
                    'warning'
                );
                return;
            }

            nuevoEstado = 'COMPLETADA';
        } else {
            console.warn('Estado de ruta no reconocido para cambio:', ruta.estado);
            return;
        }

        setActionLoading(true);
        try {
            const success = await rutaService.updateEstadoRuta(ruta.id, nuevoEstado);
            if (success) {
                setRuta({ ...ruta, estado: nuevoEstado });
                showAlert('Éxito', `Ruta marcada como ${nuevoEstado}`, 'success');
            } else {
                showAlert('Error', 'No se pudo actualizar el estado de la ruta', 'error');
            }
        } catch (error) {
            console.error('Error updating route state:', error);
            showAlert('Error', 'Ocurrió un error al actualizar el estado', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleOptimizeRoute = async () => {
        if (!ruta) return;
        setIsOptimizing(true);
        setActionLoading(true);
        try {
            const res = await api.post(`Ruta/${ruta.id}/optimizar-ia`, {}, { timeout: 60000 });
            const justificacion = res.data?.optimizacion?.justificacion || res.data?.justificacion || 'Ruta optimizada correctamente.';
            setIaResult({ visible: true, justificacion, success: true });
            await fetchRutaDetalle(ruta.id);
        } catch (error: any) {
            console.error('Error optimizar-ia:', error?.response?.status, JSON.stringify(error?.response?.data));
            const msg = error?.response?.data?.error || error?.message || 'No se pudo optimizar la ruta.';
            showAlert(iaResult.success ? 'Ruta Optimizada' : 'Error', msg, iaResult.success ? 'success' : 'error');
        } finally {
            setIsOptimizing(false);
            setActionLoading(false);
        }
    };

    const handleEntregaEstadoChange = async (entregaId: number, nuevoEstado: string) => {
        console.log('handleEntregaEstadoChange called', { entregaId, nuevoEstado });
        // Alert.alert('Debug', `Clic en ${nuevoEstado} para ID ${entregaId}`);

        const entrega = ruta?.entregas?.find(e => e.id === entregaId);
        if (!entrega) {
            console.warn('Entrega not found in current route');
            return;
        }

        if (nuevoEstado === 'ENTREGADO') {
            setSelectedEntrega(entrega);
            setShowQRModal(true);
            return;
        }

        // For other states (like CANCELADO), proceed directly or handle as needed
        await processEntregaUpdate(entregaId, nuevoEstado);
    };

    const handleCompleteDelivery = async (signature: string | null, notes: string) => {
        if (selectedEntrega) {
            await processEntregaUpdate(selectedEntrega.id, 'ENTREGADO', signature || undefined, notes);
        }
        setShowPODModal(false);
        setSelectedEntrega(null);
    };

    const processEntregaUpdate = async (entregaId: number, nuevoEstado: string, signature?: string, notes?: string) => {
        setActionLoading(true);
        const success = await entregaService.updateEstadoEntrega(entregaId, {
            estado: nuevoEstado,
            firmaDigitalUrl: signature
        });
        setActionLoading(false);

        if (success) {
            await fetchRutaDetalle(Number(id)); // Sincronización completa como en EntregasScreen
            showAlert('Éxito', 'Estado de entrega actualizado', 'success');
        } else {
            showAlert('Error', 'No se pudo actualizar la entrega', 'error');
        }
    };

    const openMap = () => {
        if (!ruta?.entregas || ruta.entregas.length === 0) {
            showAlert('Info', 'No hay entregas en esta ruta', 'info');
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
            showAlert('Error', 'No se pudo abrir el mapa', 'error');
        });
    };

    const handleOpenSingleMap = (direccion: string) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
        Linking.openURL(url).catch(err => {
            console.error('Error opening maps', err);
            showAlert('Error', 'No se pudo abrir el mapa', 'error');
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
                        <Text style={styles.statusChipText}>{formatStatus(ruta.estado)}</Text>
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
                        <TouchableOpacity
                            style={styles.entregaMain}
                            activeOpacity={0.6}
                            onPress={() => handleOpenSingleMap(entrega.cliente.direccion)}
                        >
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
                                <Text style={styles.deliveryStatusText}>{formatStatus(entrega.estado)}</Text>
                            </View>
                        </TouchableOpacity>

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

            {/* FLUJO DE ENTREGA UNIFICADO */}
            {selectedEntrega && (
                <>
                    <ScannerModal
                        visible={showQRModal}
                        onClose={() => setShowQRModal(false)}
                        entregaId={selectedEntrega.id}
                        expectedQr={selectedEntrega.codigoQr}
                        onSuccess={() => setShowPODModal(true)}
                    />

                    <PodModal
                        visible={showPODModal}
                        onClose={() => setShowPODModal(false)}
                        onComplete={handleCompleteDelivery}
                    />
                </>
            )}

            {/* Modal Resultado IA */}
            <Modal visible={iaResult.visible} transparent animationType="fade" onRequestClose={() => setIaResult(prev => ({ ...prev, visible: false }))}>
                <View style={styles.iaModalOverlay}>
                    <View style={styles.iaModalContent}>
                        {/* Icono */}
                        <View style={[styles.iaModalIcon, { backgroundColor: iaResult.success ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }]}>
                            <Text style={{ fontSize: 32 }}>{iaResult.success ? '🤖' : '⚠️'}</Text>
                        </View>

                        {/* Título */}
                        <Text style={styles.iaModalTitle}>
                            {iaResult.success ? 'Ruta Optimizada con IA' : 'Error al Optimizar'}
                        </Text>

                        {/* Justificación */}
                        <ScrollView style={styles.iaModalScroll} showsVerticalScrollIndicator={false}>
                            <Text style={styles.iaModalText}>{iaResult.justificacion}</Text>
                        </ScrollView>

                        {/* Botón */}
                        <TouchableOpacity
                            style={[styles.iaModalButton, { backgroundColor: iaResult.success ? '#22c55e' : '#E67E50' }]}
                            onPress={() => setIaResult(prev => ({ ...prev, visible: false }))}
                        >
                            <Text style={styles.iaModalButtonText}>{iaResult.success ? 'Entendido' : 'Cerrar'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    iaActionButton: {
        height: 56,
        borderRadius: 20,
        marginBottom: 40,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(230, 126, 80, 0.4)',
    },
    iaActionButtonText: {
        color: '#E67E50',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 1,
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
    },
    iaModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iaModalContent: {
        backgroundColor: '#1a2d42',
        borderRadius: 20,
        padding: 28,
        width: '100%',
        maxHeight: '70%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(230,126,80,0.3)',
    },
    iaModalIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    iaModalTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 16,
        textAlign: 'center',
    },
    iaModalScroll: {
        maxHeight: 200,
        width: '100%',
        marginBottom: 20,
    },
    iaModalText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
    },
    iaModalButton: {
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 14,
    },
    iaModalButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
});
