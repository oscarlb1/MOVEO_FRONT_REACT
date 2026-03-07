import api from '@/services/api';
import { Ruta, rutaService } from '@/services/rutaService';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    Calendar,
    CheckCircle2,
    ChevronRight,
    MapPin,
    Package,
    RefreshCw,
    Truck
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatStatus } from '@/utils/formatters';

const COLORS = {
    background: '#0a1628',
    card: '#1e2d3d',
    cardBorder: 'rgba(255,255,255,0.08)',
    primary: '#E67E50',
    primaryDark: '#d66d42',
    text: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.5)',
    success: '#22c55e',
    warning: '#eab308',
    danger: '#ef4444',
    info: '#3b82f6',
};

const getEstadoConfig = (estado: string) => {
    switch (estado) {
        case 'COMPLETADA': return { color: COLORS.success, label: formatStatus(estado), icon: '✓', bg: 'rgba(34,197,94,0.15)' };
        case 'EN_PROGRESO': return { color: COLORS.primary, label: formatStatus(estado), icon: '●', bg: 'rgba(230,126,80,0.15)' };
        case 'CANCELADA': return { color: COLORS.danger, label: formatStatus(estado), icon: '✕', bg: 'rgba(239,68,68,0.15)' };
        default: return { color: COLORS.warning, label: formatStatus(estado), icon: '◎', bg: 'rgba(234,179,8,0.15)' };
    }
};

export default function ListaRutasScreen() {
    const router = useRouter();
    const [rutas, setRutas] = useState<Ruta[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [optimizingId, setOptimizingId] = useState<number | null>(null);
    const [iaResult, setIaResult] = useState<{ visible: boolean; justificacion: string; success: boolean }>({
        visible: false, justificacion: '', success: false,
    });

    const fetchRutas = useCallback(async () => {
        try {
            const data = await rutaService.getMisRutas();
            setRutas(data);
        } catch (error) {
            console.error('Error cargando rutas:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchRutas(); }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRutas();
    };

    const handleOptimize = async (rutaId: number) => {
        setOptimizingId(rutaId);
        try {
            const res = await api.post(`Ruta/${rutaId}/optimizar-ia`, {}, { timeout: 60000 });
            const justificacion = res.data?.optimizacion?.justificacion || res.data?.justificacion || 'Ruta optimizada correctamente.';
            setIaResult({ visible: true, justificacion, success: true });
            await fetchRutas(); // Recargar datos
        } catch (error: any) {
            const msg = error?.response?.data?.error || 'No se pudo optimizar la ruta.';
            setIaResult({ visible: true, justificacion: msg, success: false });
        } finally {
            setOptimizingId(null);
        }
    };

    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });

    // Separar rutas activas de completadas
    const rutasActivas = rutas.filter(r => r.estado !== 'COMPLETADA' && r.estado !== 'CANCELADA');
    const rutasFinalizadas = rutas.filter(r => r.estado === 'COMPLETADA' || r.estado === 'CANCELADA');

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ color: COLORS.textSecondary, marginTop: 16, fontWeight: '600' }}>Cargando rutas...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={styles.dateBadge}>
                            <Calendar size={12} color={COLORS.primary} />
                            <Text style={styles.dateText}>{today}</Text>
                        </View>
                        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                            <RefreshCw size={18} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.headerTitle}>Mis Rutas</Text>
                    <Text style={styles.headerSubtitle}>{rutas.length} ruta{rutas.length !== 1 ? 's' : ''} asignada{rutas.length !== 1 ? 's' : ''}</Text>
                </View>

                {/* Summary Stats */}
                {rutas.length > 0 && (
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{rutasActivas.length}</Text>
                            <Text style={styles.statLabel}>Activas</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statValue, { color: COLORS.success }]}>{rutasFinalizadas.filter(r => r.estado === 'COMPLETADA').length}</Text>
                            <Text style={styles.statLabel}>Completadas</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statValue, { color: COLORS.primary }]}>
                                {rutas.reduce((sum, r) => sum + (r.distanciaTotalEstimada || 0), 0).toFixed(1)} km
                            </Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                    </View>
                )}

                {/* Rutas Activas */}
                {rutasActivas.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Rutas Activas</Text>
                        {rutasActivas.map(ruta => {
                            const config = getEstadoConfig(ruta.estado);
                            const entregasTotal = ruta.entregas?.length || 0;
                            const entregasCompletadas = ruta.entregas?.filter(e => e.estado === 'ENTREGADO').length || 0;

                            return (
                                <TouchableOpacity
                                    key={ruta.id}
                                    style={styles.routeCard}
                                    activeOpacity={0.85}
                                    onPress={() => router.push({ pathname: '/rutas/[id]', params: { id: ruta.id.toString() } })}
                                >
                                    <LinearGradient colors={['#1e2d3d', '#152232']} style={styles.routeCardGradient}>
                                        {/* Top Row */}
                                        <View style={styles.routeCardTop}>
                                            <View style={styles.routeIdContainer}>
                                                <Truck size={16} color={COLORS.primary} />
                                                <Text style={styles.routeId}>Ruta #{ruta.id}</Text>
                                            </View>
                                            <View style={[styles.estadoBadge, { backgroundColor: config.bg }]}>
                                                <Text style={[styles.estadoText, { color: config.color }]}>{config.label}</Text>
                                            </View>
                                        </View>

                                        {/* Info Row */}
                                        <View style={styles.infoRow}>
                                            <View style={styles.infoItem}>
                                                <Calendar size={14} color={COLORS.textSecondary} />
                                                <Text style={styles.infoText}>{new Date(ruta.fecha).toLocaleDateString('es-ES')}</Text>
                                            </View>
                                            <View style={styles.infoItem}>
                                                <MapPin size={14} color={COLORS.textSecondary} />
                                                <Text style={styles.infoText}>{ruta.distanciaTotalEstimada} km</Text>
                                            </View>
                                            <View style={styles.infoItem}>
                                                <Package size={14} color={COLORS.textSecondary} />
                                                <Text style={styles.infoText}>{entregasCompletadas}/{entregasTotal}</Text>
                                            </View>
                                        </View>

                                        {/* Vehicle */}
                                        {ruta.matriculaVehiculo && (
                                            <View style={styles.vehicleBadge}>
                                                <Truck size={12} color={COLORS.primary} />
                                                <Text style={styles.vehicleText}>{ruta.matriculaVehiculo}</Text>
                                            </View>
                                        )}

                                        {/* Progress Bar */}
                                        {entregasTotal > 0 && (
                                            <View style={styles.progressContainer}>
                                                <View style={styles.progressBar}>
                                                    <View style={[styles.progressFill, { width: `${(entregasCompletadas / entregasTotal) * 100}%` }]} />
                                                </View>
                                                <Text style={styles.progressText}>{Math.round((entregasCompletadas / entregasTotal) * 100)}%</Text>
                                            </View>
                                        )}

                                        {/* Actions */}
                                        <View style={styles.routeActions}>

                                            <View style={styles.detailBtn}>
                                                <Text style={styles.detailBtnText}>Ver Detalle</Text>
                                                <ChevronRight size={16} color={COLORS.primary} />
                                            </View>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Rutas Finalizadas */}
                {rutasFinalizadas.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Finalizadas</Text>
                        {rutasFinalizadas.map(ruta => {
                            const config = getEstadoConfig(ruta.estado);
                            return (
                                <TouchableOpacity
                                    key={ruta.id}
                                    style={styles.finishedCard}
                                    activeOpacity={0.85}
                                    onPress={() => router.push({ pathname: '/rutas/[id]', params: { id: ruta.id.toString() } })}
                                >
                                    <View style={styles.finishedLeft}>
                                        <CheckCircle2 size={20} color={config.color} />
                                        <View>
                                            <Text style={styles.finishedTitle}>Ruta #{ruta.id}</Text>
                                            <Text style={styles.finishedMeta}>
                                                {new Date(ruta.fecha).toLocaleDateString('es-ES')} • {ruta.distanciaTotalEstimada} km • {ruta.entregas?.length || 0} entregas
                                            </Text>
                                        </View>
                                    </View>
                                    <ChevronRight size={18} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                {/* Empty State */}
                {rutas.length === 0 && (
                    <View style={styles.emptyState}>
                        <Truck size={64} color={COLORS.textSecondary} />
                        <Text style={styles.emptyTitle}>No tienes rutas asignadas</Text>
                        <Text style={styles.emptySubtitle}>Cuando se te asigne una ruta aparecerá aquí</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
                            <RefreshCw size={16} color="white" />
                            <Text style={styles.retryText}>Actualizar</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Modal Resultado IA */}
            <Modal visible={iaResult.visible} transparent animationType="fade" onRequestClose={() => setIaResult(prev => ({ ...prev, visible: false }))}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={[styles.modalIcon, { backgroundColor: iaResult.success ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }]}>
                            <Text style={{ fontSize: 32 }}>{iaResult.success ? '🤖' : '⚠️'}</Text>
                        </View>
                        <Text style={styles.modalTitle}>
                            {iaResult.success ? 'Ruta Optimizada con IA' : 'Error al Optimizar'}
                        </Text>
                        <ScrollView style={{ maxHeight: 200, width: '100%', marginBottom: 20 }} showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalText}>{iaResult.justificacion}</Text>
                        </ScrollView>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: iaResult.success ? COLORS.success : COLORS.primary }]}
                            onPress={() => setIaResult(prev => ({ ...prev, visible: false }))}
                        >
                            <Text style={styles.modalButtonText}>{iaResult.success ? 'Entendido' : 'Cerrar'}</Text>
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
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    dateText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    refreshBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: 'white',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 12,
        marginBottom: 28,
    },
    statCard: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: 'white',
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginTop: 4,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: 'white',
        marginBottom: 16,
    },
    routeCard: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    routeCardGradient: {
        padding: 20,
    },
    routeCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    routeIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    routeId: {
        fontSize: 18,
        fontWeight: '800',
        color: 'white',
    },
    estadoBadge: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
    },
    estadoText: {
        fontSize: 12,
        fontWeight: '700',
    },
    infoRow: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 14,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    vehicleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(230,126,80,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        alignSelf: 'flex-start',
        marginBottom: 14,
    },
    vehicleText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '700',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.primary,
        minWidth: 36,
        textAlign: 'right',
    },
    routeActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    optimizeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(230,126,80,0.1)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
    },
    optimizeBtnText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: '700',
    },
    detailBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    detailBtnText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: '700',
    },
    finishedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    finishedLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    finishedTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: 'white',
    },
    finishedMeta: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 80,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
        marginTop: 20,
    },
    emptySubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 14,
        marginTop: 24,
    },
    retryText: {
        color: 'white',
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#1a2d42',
        borderRadius: 20,
        padding: 28,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(230,126,80,0.3)',
    },
    modalIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
    },
    modalButton: {
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 14,
    },
    modalButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
});
