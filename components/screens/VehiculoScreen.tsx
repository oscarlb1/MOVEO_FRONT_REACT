import api from '@/services/api';
import { useAlert } from '@/store/alertStore';
import { useAuth } from '@/store/authStore';
import { formatStatus } from '@/utils/formatters';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    Calendar,
    CheckCircle,
    ChevronRight,
    Circle,
    FileText,
    Fuel,
    Gauge,
    MapPin,
    Package,
    Phone,
    RotateCw,
    Truck,
    Wrench
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Tipos para los datos
interface VehiculoData {
    id: number;
    matricula: string;
    marcaModelo: string;
    estado: string;
    capacidadCarga: number;
    consumoMedio: number;
    kilometrajeActual: number;
    fechaUltimaRevision: string | null;
}

interface MantenimientoData {
    id: number;
    vehiculoId: number;
    fechaServicio: string;
    tipoMantenimiento: string;
    kilometrajeServicio: number;
    coste: number;
}

interface ChecklistItem {
    id: number;
    item: string;
    checked: boolean;
}

const COLORS = {
    background: '#0d1d35',
    headerStart: '#092C4C',
    headerMid: '#0d1d35',
    headerEnd: '#092C4C',
    accent: '#E67E50',
    card: '#1e2d3d',
    cardBorder: '#2a3f54',
    text: '#FFFFFF',
    textSecondary: '#9ca3af',
    success: '#22c55e',
    warning: '#eab308',
    danger: '#ef4444',
    info: '#3b82f6',
    purple: '#a855f7',
};

export default function VehiculoScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [vehiculo, setVehiculo] = useState<VehiculoData | null>(null);
    const [mantenimientos, setMantenimientos] = useState<MantenimientoData[]>([]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [checklistCompleted, setChecklistCompleted] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const { showAlert } = useAlert();

    const [checklist, setChecklist] = useState<ChecklistItem[]>([
        { id: 1, item: "Luces funcionando", checked: false },
        { id: 2, item: "Frenos operativos", checked: false },
        { id: 3, item: "Neumáticos en buen estado", checked: false },
        { id: 4, item: "Nivel de aceite correcto", checked: false },
        { id: 5, item: "Espejos retrovisores ajustados", checked: false },
        { id: 6, item: "Documentación en regla", checked: false }
    ]);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            else setRefreshing(true);
            // 1. Obtener ruta activa para saber el vehículo
            const rutasRes = await api.get('Ruta/me');
            const rutas = rutasRes.data;

            // Buscar cualquier ruta que no esté cancelada para mostrar el vehículo
            const rutaActiva = rutas.find((r: any) =>
                ['PENDIENTE', 'PLANIFICADA', 'EN_PROGRESO', 'EN_CAMINO', 'EN_RUTA', 'EN_CURSO', 'COMPLETADA'].includes(r.estado?.toUpperCase())
            );

            if (rutaActiva && rutaActiva.vehiculoId) {
                // 2. Obtener detalles del vehículo
                const vehiculoRes = await api.get(`Vehiculos/${rutaActiva.vehiculoId}`);
                setVehiculo(vehiculoRes.data);

                // 3. Obtener mantenimientos (independiente, no bloquea la carga del vehículo)
                try {
                    const mantRes = await api.get(`Mantenimientos/vehiculo/${rutaActiva.vehiculoId}`);
                    console.log('Mantenimientos cargados:', mantRes.data?.length || 0);
                    setMantenimientos(Array.isArray(mantRes.data) ? mantRes.data : []);
                } catch (mantError) {
                    console.log('Error cargando mantenimientos (puede no haber):', mantError);
                    setMantenimientos([]);
                }
            }
        } catch (error) {
            console.error('Error cargando datos del vehículo:', error);
            showAlert('Error', 'No se pudo cargar la información del vehículo.', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        cargarDatos(false);
    };

    const toggleCheckItem = (id: number) => {
        setChecklist(prev =>
            prev.map(item =>
                item.id === id ? { ...item, checked: !item.checked } : item
            )
        );
    };

    const handleCompleteChecklist = () => {
        setChecklistCompleted(true);
        showAlert('Inspección Completada', 'El registro se ha guardado correctamente.', 'success');
    };

    const allChecked = checklist.every(item => item.checked);

    if (loading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
        );
    }

    if (!vehiculo) {
        return (
            <View style={[styles.container, styles.center]}>
                <Truck size={64} color={COLORS.textSecondary} />
                <Text style={[styles.textSecondary, { marginTop: 16 }]}>No tienes un vehículo asignado hoy.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => cargarDatos()}>
                    <Text style={styles.retryText}>Reintentar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.headerStart} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={COLORS.accent}
                        colors={[COLORS.accent]}
                    />
                }
            >

                {/* Header */}
                <LinearGradient
                    colors={[COLORS.headerStart, COLORS.headerMid, COLORS.headerEnd]}
                    style={styles.header}
                >
                    <SafeAreaView edges={['top']}>
                        <View style={styles.headerTopActions}>
                            <TouchableOpacity
                                style={styles.refreshIconDetail}
                                onPress={handleRefresh}
                                disabled={refreshing}
                            >
                                {refreshing ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <RotateCw color="white" size={20} />
                                )}
                            </TouchableOpacity>
                        </View>
                        <View style={styles.headerContent}>
                            <View style={styles.truckIconContainer}>
                                <Truck color="white" size={40} />
                            </View>

                            <Text style={styles.vehicleModel}>{vehiculo.marcaModelo}</Text>

                            <View style={styles.plateContainer}>
                                <Text style={styles.plateText}>{vehiculo.matricula}</Text>
                            </View>

                            <View style={[styles.statusBadge, {
                                backgroundColor: vehiculo.estado === 'DISPONIBLE' || vehiculo.estado === 'EN_RUTA' ?
                                    `${COLORS.success}20` : `${COLORS.warning}20`,
                                borderColor: vehiculo.estado === 'DISPONIBLE' || vehiculo.estado === 'EN_RUTA' ?
                                    `${COLORS.success}40` : `${COLORS.warning}40`
                            }]}>
                                <Text style={[styles.statusText, {
                                    color: (vehiculo.estado === 'DISPONIBLE' || vehiculo.estado === 'EN_RUTA') ?
                                        COLORS.success : COLORS.warning
                                }]}>
                                    {(vehiculo.estado === 'DISPONIBLE' || vehiculo.estado === 'EN_RUTA') ? `✓ ${formatStatus(vehiculo.estado)}` : `⚠ ${formatStatus(vehiculo.estado)}`}
                                </Text>
                            </View>
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                <View style={styles.content}>

                    {/* Grid Métricas */}
                    <View style={styles.metricsCard}>
                        <Text style={styles.sectionTitle}>Ficha Técnica</Text>
                        <View style={styles.metricsGrid}>
                            <MetricItem
                                icon={<Gauge size={20} color={COLORS.accent} />}
                                label="Kilometraje"
                                value={vehiculo.kilometrajeActual.toLocaleString()}
                                unit="km"
                            />
                            <MetricItem
                                icon={<Fuel size={20} color={COLORS.accent} />}
                                label="Consumo"
                                value={vehiculo.consumoMedio.toString()}
                                unit="L/100km"
                            />
                            <MetricItem
                                icon={<Package size={20} color={COLORS.accent} />}
                                label="Capacidad"
                                value={vehiculo.capacidadCarga.toString()}
                                unit="kg"
                            />
                            <MetricItem
                                icon={<Calendar size={20} color={COLORS.accent} />}
                                label="Última Rev."
                                value={vehiculo.fechaUltimaRevision ? new Date(vehiculo.fechaUltimaRevision).toLocaleDateString() : 'N/A'}
                                unit="Fecha"
                            />
                        </View>
                    </View>

                    {/* Estado y Documentación */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Estado y Documentación</Text>

                        <InfoCard
                            icon={<FileText size={20} color={COLORS.info} />}
                            iconBg={`${COLORS.info}20`}
                            title="Próxima ITV"
                            subtitle="20 Mar 2026"
                            rightText="60 días"
                            rightColor={COLORS.info}
                        />
                        <InfoCard
                            icon={<CheckCircle size={20} color={COLORS.success} />}
                            iconBg={`${COLORS.success}20`}
                            title="Seguro"
                            subtitle="Vence 10 Jun 2026"
                            rightText="Vigente"
                            rightColor={COLORS.success}
                        />
                        <InfoCard
                            icon={<MapPin size={20} color={COLORS.purple} />}
                            iconBg={`${COLORS.purple}20`}
                            title="Ubicación"
                            subtitle="Parking Central - Plaza 12"
                            showArrow
                        />
                    </View>

                    {/* Inspección Diaria */}
                    <View style={styles.checklistCard}>
                        <View style={styles.checklistHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <CheckCircle size={20} color={COLORS.accent} />
                                <Text style={styles.cardTitle}>Inspección Diaria</Text>
                            </View>
                            {checklistCompleted && (
                                <Text style={{ color: COLORS.success, fontSize: 12, fontWeight: '600' }}>Completada</Text>
                            )}
                        </View>

                        <View style={styles.checklistItems}>
                            {checklist.map(item => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.checkItem, item.checked && styles.checkItemActive]}
                                    onPress={() => toggleCheckItem(item.id)}
                                    activeOpacity={0.8}
                                >
                                    {item.checked ?
                                        <CheckCircle size={20} color={COLORS.text} /> :
                                        <Circle size={20} color={COLORS.textSecondary} />
                                    }
                                    <Text style={[styles.checkText, item.checked && { color: 'white' }]}>{item.item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {allChecked && !checklistCompleted && (
                            <TouchableOpacity style={styles.confirmButton} onPress={handleCompleteChecklist}>
                                <CheckCircle size={20} color="white" />
                                <Text style={styles.confirmButtonText}>Confirmar Inspección</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Historial Mantenimiento */}
                    <View style={styles.section}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <Wrench size={20} color={COLORS.accent} />
                            <Text style={styles.sectionTitle}>Historial de Mantenimiento</Text>
                        </View>

                        {mantenimientos.length > 0 ? (
                            mantenimientos.map(mant => (
                                <View key={mant.id} style={styles.historyItem}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
                                        <View>
                                            <Text style={styles.historyType}>{mant.tipoMantenimiento}</Text>
                                            <Text style={styles.historyDate}>{mant.fechaServicio ? new Date(mant.fechaServicio).toLocaleDateString('es-ES') : 'Sin fecha'}</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.historyBadge, { backgroundColor: `${COLORS.accent}20` }]}>
                                        <Text style={[styles.historyBadgeText, { color: COLORS.accent }]}>{mant.coste}€</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.textSecondary}>No hay mantenimientos recientes.</Text>
                        )}
                    </View>

                    <TouchableOpacity style={styles.contactButton} activeOpacity={0.9}>
                        <Phone size={20} color={COLORS.accent} />
                        <Text style={styles.contactButtonText}>Contactar con Central</Text>
                    </TouchableOpacity>

                    <Text style={styles.footerNote}>Vehículo asignado a la ruta de hoy</Text>
                </View>
            </ScrollView>

        </View>
    );
}

const MetricItem = ({ icon, label, value, unit }: any) => (
    <View style={styles.metricItem}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            {icon}
            <Text style={styles.metricLabel}>{label}</Text>
        </View>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricUnit}>{unit}</Text>
    </View>
);

const InfoCard = ({ icon, iconBg, title, subtitle, rightText, rightColor, showArrow }: any) => (
    <View style={styles.infoCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[styles.infoIcon, { backgroundColor: iconBg }]}>
                {icon}
            </View>
            <View>
                <Text style={styles.infoTitle}>{title}</Text>
                <Text style={styles.infoSubtitle}>{subtitle}</Text>
            </View>
        </View>
        {rightText && <Text style={[styles.infoRight, { color: rightColor }]}>{rightText}</Text>}
        {showArrow && <ChevronRight size={20} color={COLORS.textSecondary} />}
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        paddingBottom: 60,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerContent: {
        alignItems: 'center',
        paddingTop: 10,
    },
    headerTopActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 24,
        paddingTop: 10,
    },
    refreshIconDetail: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    truckIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 24,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    vehicleModel: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    plateContainer: {
        backgroundColor: '#0a1628',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        marginBottom: 16,
    },
    plateText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: 2,
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        padding: 24,
        marginTop: -30,
    },
    metricsCard: {
        backgroundColor: '#162335', // Un poco más claro que inputBg
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        marginBottom: 24,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    metricItem: {
        width: '48%', // Aprox
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 16,
    },
    metricLabel: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    metricValue: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 4,
    },
    metricUnit: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    section: {
        marginBottom: 24,
    },
    infoCard: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    infoIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoTitle: {
        color: 'white',
        fontSize: 15,
        fontWeight: '600',
    },
    infoSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 13,
    },
    infoRight: {
        fontSize: 13,
        fontWeight: '600',
    },
    checklistCard: {
        backgroundColor: 'rgba(230, 126, 80, 0.05)',
        borderColor: 'rgba(230, 126, 80, 0.2)',
        borderWidth: 1,
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
    },
    checklistHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    checklistItems: {
        gap: 8,
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 12,
        backgroundColor: 'rgba(13, 29, 53, 0.5)',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    checkItemActive: {
        backgroundColor: 'rgba(230, 126, 80, 0.2)',
        borderColor: 'rgba(230, 126, 80, 0.4)',
    },
    checkText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    confirmButton: {
        backgroundColor: COLORS.accent,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 14,
        marginTop: 16,
        gap: 8,
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    historyItem: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    historyType: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    historyDate: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    historyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    historyBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    reportButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)', // red with opacity
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderRadius: 16,
        padding: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    reportButtonText: {
        color: COLORS.danger,
        fontSize: 16,
        fontWeight: '700',
    },
    contactButton: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        borderRadius: 16,
        padding: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginBottom: 24,
    },
    contactButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    footerNote: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        fontSize: 12,
        marginBottom: 24,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    modalTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    modalDescription: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: 20,
    },
    modalInput: {
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        borderRadius: 16,
        padding: 16,
        color: 'white',
        height: 120,
        marginBottom: 24,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalCancel: {
        flex: 1,
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    modalCancelText: {
        color: 'white',
        fontWeight: '600',
    },
    modalSend: {
        flex: 1,
        backgroundColor: COLORS.accent,
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    modalSendText: {
        color: 'white',
        fontWeight: 'bold',
    },
    // Utils styles
    textSecondary: {
        color: COLORS.textSecondary,
    },
    retryButton: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: COLORS.accent,
        borderRadius: 8,
    },
    retryText: {
        color: 'white',
        fontWeight: 'bold',
    }
});
