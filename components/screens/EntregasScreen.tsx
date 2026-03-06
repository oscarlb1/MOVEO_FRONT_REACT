import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    AlertCircle,
    Box,
    CheckCircle,
    ChevronRight,
    Clock,
    MapPin,
    Navigation,
    Phone,
    Scan,
    Search,
    X
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Path, Stop, LinearGradient as SvgGradient, Text as SvgText } from 'react-native-svg';

// Componentes
import PodModal from '../modals/PodModal';

// Servicios
import api from '@/services/api';
import { useAlert } from '@/store/alertStore';
import { useAuth } from '@/store/authStore';
import { entregaService } from '../../services/entregaService';
import { Entrega, Ruta, rutaService } from '../../services/rutaService';

const { width } = Dimensions.get('window');
const AnimatedPath = Animated.createAnimatedComponent(Path);

const COLORS = {
    background: '#0d1d35',
    card: '#1e2d3d',
    cardBorder: 'rgba(255,255,255,0.1)',
    primary: '#E67E50',
    primaryDark: '#d66d42',
    text: '#FFFFFF',
    textSecondary: '#9ca3af',
    success: '#22c55e',
    warning: '#eab308',
    danger: '#ef4444',
    info: '#3b82f6',
    accent: '#4FD1C5',
};

export default function EntregasScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(true);
    const [entregas, setEntregas] = useState<Entrega[]>([]);
    const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, failed: 0 });
    const [rutaActiva, setRutaActiva] = useState<Ruta | null>(null);

    // Profile & Global Modal
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showGlobalModal, setShowGlobalModal] = useState(false);
    const [globalReportMsg, setGlobalReportMsg] = useState('');
    const { showAlert } = useAlert();

    // Camera stats
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [validatingQr, setValidatingQr] = useState(false);
    const isProcessingQr = useRef(false);

    // Animación del mapa
    const pathProgress = useSharedValue(0);

    // Modals state
    const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showPODModal, setShowPODModal] = useState(false);
    const [showFailModal, setShowFailModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState(false);

    // Fail state
    const [failReason, setFailReason] = useState<string | null>(null);
    const failReasons = [
        "Cliente ausente",
        "Dirección incorrecta",
        "Cliente rechazó el paquete",
        "Acceso denegado",
        "Horario no disponible",
        "Otro motivo"
    ];

    useEffect(() => {
        cargarDatos();
        pathProgress.value = withDelay(500, withTiming(1, { duration: 2500 }));
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const rutas = await rutaService.getMisRutas();

            if (rutas && rutas.length > 0) {
                // Buscamos preferentemente una ruta que tenga entregas o esté en progreso
                // Para esto necesitamos iterarlas y pedir el detalle, o coger la de estado EN_PROGRESO/PENDIENTE
                let rutaSeleccionada = rutas[0];
                let detalleSeleccionado = await rutaService.getRutaDetalle(rutaSeleccionada.id);

                // Si la primera no tiene entregas, intentamos buscar una que sí tenga
                if (!detalleSeleccionado.entregas || detalleSeleccionado.entregas.length === 0) {
                    for (let i = 1; i < rutas.length; i++) {
                        const testDetalle = await rutaService.getRutaDetalle(rutas[i].id);
                        if (testDetalle.entregas && testDetalle.entregas.length > 0) {
                            detalleSeleccionado = testDetalle;
                            rutaSeleccionada = rutas[i];
                            break;
                        }
                    }
                }

                setRutaActiva(detalleSeleccionado);

                if (detalleSeleccionado.entregas) {
                    // Ordenar por orden de parada
                    const ordenadas = [...detalleSeleccionado.entregas].sort((a, b) => a.ordenParada - b.ordenParada);
                    setEntregas(ordenadas);
                    calcularEstadisticas(ordenadas);
                }
            } else {
                setEntregas([]);
                setStats({ total: 0, completed: 0, pending: 0, failed: 0 });
            }
        } catch (error) {
            console.error('Error cargando entregas:', error);
            showAlert('Error', 'No se pudieron cargar las entregas del servidor.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const calcularEstadisticas = (data: Entrega[]) => {
        setStats({
            total: data.length,
            completed: data.filter(e => e.estado === 'ENTREGADO').length,
            pending: data.filter(e => e.estado !== 'ENTREGADO' && e.estado !== 'FALLIDO').length,
            failed: data.filter(e => e.estado === 'FALLIDO').length,
        });
    };

    const handleSelectEntrega = (entrega: Entrega) => {
        setSelectedEntrega(entrega);
        setShowDetailModal(true);
    };

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (!selectedEntrega || isProcessingQr.current) return;

        // Bloqueo síncrono para evitar 10 escaneos en el primer frame
        isProcessingQr.current = true;
        setScanned(true);
        setValidatingQr(true);

        const idEntrega = selectedEntrega.id;
        try {
            const isValid = await entregaService.validarQrEntrega(idEntrega, data);

            if (isValid) {
                setShowQRModal(false);
                showAlert('¡Éxito!', 'Paquete validado correctamente. Procediendo a captura de firma.', 'success', () => {
                    isProcessingQr.current = false;
                    setTimeout(() => setShowPODModal(true), 500);
                });
            } else {
                showAlert('Error', 'El código QR es incorrecto o no pertenece a esta entrega.', 'error', () => {
                    setScanned(false);
                    isProcessingQr.current = false;
                });
            }
        } catch (error) {
            showAlert('Error', 'No se pudo validar el código QR.', 'error', () => {
                setScanned(false);
                isProcessingQr.current = false;
            });
        } finally {
            setValidatingQr(false);
        }
    };

    // Acciones
    const handleNavigationLocal = (lat?: number, lng?: number) => {
        if (lat && lng) {
            const url = Platform.select({
                ios: `maps:0,0?q=${lat},${lng}`,
                android: `geo:0,0?q=${lat},${lng}`
            });
            Linking.openURL(url!);
        } else {
            showAlert('Ubicación no disponible', 'Esta entrega no tiene coordenadas GPS válidas.', 'warning');
        }
    };
    const handleCall = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const handleCompleteDelivery = async (signatureBg: string | null, finalNotes: string) => {
        if (selectedEntrega) {
            try {
                setLoading(true);
                const success = await entregaService.updateEstadoEntrega(selectedEntrega.id, {
                    Estado: 'ENTREGADO',
                    Notas: finalNotes,
                    FirmaDigitalUrl: signatureBg || undefined
                });

                if (success) {
                    await cargarDatos(); // Recargar todo para sincronizar
                    showAlert('¡Éxito!', 'Entrega confirmada correctamente.', 'success');
                } else {
                    showAlert('Error', 'No se pudo actualizar el estado en el servidor.', 'error');
                }
            } catch (error) {
                showAlert('Error', 'Falló la conexión al completar entrega.', 'error');
            } finally {
                setLoading(false);
            }
        }
        setShowPODModal(false);
        setShowDetailModal(false);
    };

    const handleFailDelivery = async () => {
        if (selectedEntrega && failReason) {
            try {
                setLoading(true);
                const success = await entregaService.updateEstadoEntrega(selectedEntrega.id, {
                    Estado: 'FALLIDO',
                    Notas: `Motivo: ${failReason}`
                });

                if (success) {
                    await cargarDatos();
                } else {
                    showAlert('Error', 'No se pudo registrar el fallo.', 'error');
                }
            } catch (error) {
                showAlert('Error', 'Falló la conexión al registrar fallo.', 'error');
            } finally {
                setLoading(false);
            }
        }
        setShowFailModal(false);
        setShowDetailModal(false);
    };

    const handleSendGlobalReport = async () => {
        if (!globalReportMsg.trim()) return;
        try {
            setLoading(true);
            await api.post('Notificaciones/incidencia', {
                Titulo: 'ALERTA DE REPARTIDOR',
                Mensaje: globalReportMsg
            });
            setGlobalReportMsg('');
            setShowGlobalModal(false);
            showAlert('Incidencia Enviada', 'Tu equipo ha sido notificado.', 'success');
        } catch (e) {
            console.error('Error enviando reporte global', e);
            showAlert('Error', 'No se pudo enviar el reporte.', 'error');
        } finally {
            setLoading(false);
        }
    };
    const animatedPathProps = useAnimatedProps(() => ({
        strokeDashoffset: 400 * (1 - pathProgress.value),
    }));

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* ENCABEZADO CON MAPA SIMULADO */}
            <LinearGradient
                colors={[COLORS.background, '#0a1628']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.topRow}>
                        <View>
                            <Text style={styles.headerSubtitle}>Hola, {user?.nombre || rutaActiva?.nombreConductor || 'Conductor'}</Text>
                            <Text style={styles.headerTitle}>Tu Ruta de Hoy</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <TouchableOpacity onPress={() => setShowGlobalModal(true)} style={styles.alertBtn}>
                                <AlertCircle size={24} color="#ef4444" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.avatarBtn} onPress={() => setShowProfileMenu(true)}>
                                <View style={styles.badgeOnline} />
                                <View style={styles.avatarPlaceholder}>
                                    {user?.imagenUrl ? (
                                        <Image source={{ uri: user.imagenUrl }} style={{ width: '100%', height: '100%', borderRadius: 22 }} />
                                    ) : (
                                        <Text style={{ color: 'white' }}>{(user?.nombre || 'JD').substring(0, 2).toUpperCase()}</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Mapa SVG Animado */}
                    <View style={styles.mapContainer}>
                        <Svg height="120" width={width - 48} viewBox="0 0 300 120">
                            <Defs>
                                <SvgGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <Stop offset="0%" stopColor={COLORS.accent} />
                                    <Stop offset="100%" stopColor={COLORS.primary} />
                                </SvgGradient>
                            </Defs>
                            {/* Ruta trazada */}
                            <AnimatedPath
                                d="M20,60 Q60,20 100,60 T180,60 T280,60"
                                stroke="url(#grad)"
                                strokeWidth="3"
                                fill="none"
                                strokeDasharray="400"
                                animatedProps={animatedPathProps}
                            />
                            {/* Puntos de entrega */}
                            <Circle cx="20" cy="60" r="4" fill={COLORS.accent} />
                            <Circle cx="100" cy="60" r="4" fill="white" />
                            <Circle cx="180" cy="60" r="4" fill="white" />
                            <Circle cx="280" cy="60" r="4" fill={COLORS.primary} />

                            <SvgText x="10" y="80" fill={COLORS.textSecondary} fontSize="10" fontWeight="bold">Origen</SvgText>
                            <SvgText x="260" y="80" fill={COLORS.textSecondary} fontSize="10" fontWeight="bold">Destino</SvgText>
                        </Svg>
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats.total}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        <View style={[styles.statCard, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)' }]}>
                            <Text style={[styles.statValue, { color: COLORS.success }]}>{stats.completed}</Text>
                            <Text style={styles.statLabel}>Éxito</Text>
                        </View>
                        <View style={[styles.statCard, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.1)' }]}>
                            <Text style={[styles.statValue, { color: COLORS.primary }]}>{stats.pending}</Text>
                            <Text style={styles.statLabel}>Pend.</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            {/* Listado */}
            <View style={styles.searchBarContainer}>
                <View style={styles.searchBar}>
                    <Search size={18} color={COLORS.textSecondary} />
                    <TextInput
                        placeholder="Buscar entrega o cliente..."
                        placeholderTextColor={COLORS.textSecondary}
                        style={styles.searchInput}
                    />
                </View>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>Entregas Programadas</Text>
                    <TouchableOpacity onPress={cargarDatos}>
                        <Text style={{ color: COLORS.accent, fontSize: 12 }}>Actualizar</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
                ) : entregas.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Box size={48} color={COLORS.cardBorder} />
                        <Text style={styles.emptyText}>No hay entregas asignadas para hoy.</Text>
                    </View>
                ) : (
                    entregas.map((entrega, index) => {
                        const isLast = index === entregas.length - 1;
                        const isCurrent = entrega.estado === 'EN_CAMINO' || (index === 0 && stats.completed === 0);

                        return (
                            <View key={entrega.id} style={styles.timelineWrapper}>
                                <View style={styles.timelineSidebar}>
                                    <View style={[
                                        styles.dot,
                                        entrega.estado === 'ENTREGADO' ? styles.dotSuccess :
                                            entrega.estado === 'FALLIDO' ? styles.dotDanger :
                                                isCurrent ? styles.dotCurrent : styles.dotPending
                                    ]}>
                                        {entrega.estado === 'ENTREGADO' ? <CheckCircle size={12} color="white" /> :
                                            entrega.estado === 'FALLIDO' ? <X size={12} color="white" /> :
                                                <Text style={styles.dotNum}>{index + 1}</Text>}
                                    </View>
                                    {!isLast && <View style={styles.line} />}
                                </View>

                                <TouchableOpacity
                                    style={[styles.card, isCurrent && styles.cardActive]}
                                    onPress={() => handleSelectEntrega(entrega)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.cardInfo}>
                                        <View style={styles.cardHeader}>
                                            <Text style={styles.clientName}>{entrega.cliente.nombreEmpresa}</Text>
                                            <View style={[styles.statusTag, { backgroundColor: getStatusColor(entrega.estado) + '20' }]}>
                                                <Text style={[styles.statusText, { color: getStatusColor(entrega.estado) }]}>
                                                    {entrega.estado}
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={styles.infoRow}>
                                            <MapPin size={14} color={COLORS.textSecondary} />
                                            <Text style={styles.addressText} numberOfLines={1}>{entrega.cliente.direccion}</Text>
                                        </View>

                                        <View style={styles.cardFooter}>
                                            <View style={styles.footerItem}>
                                                <Clock size={14} color={COLORS.textSecondary} />
                                                <Text style={styles.footerText}>{entrega.horaEstimada || '--:--'}</Text>
                                            </View>
                                            <View style={styles.footerItem}>
                                                <Box size={14} color={COLORS.textSecondary} />
                                                <Text style={styles.footerText}>{entrega.paquetes} bultos</Text>
                                            </View>
                                            <ChevronRight size={18} color={COLORS.textSecondary} />
                                        </View>
                                    </View>

                                    {isCurrent && (
                                        <LinearGradient
                                            colors={[COLORS.primary, COLORS.primaryDark]}
                                            style={styles.actionBanner}
                                        >
                                            <TouchableOpacity
                                                style={styles.bannerBtn}
                                                onPress={() => handleNavigationLocal(entrega.cliente.latitud, entrega.cliente.longitud)}
                                            >
                                                <Navigation size={16} color="white" />
                                                <Text style={styles.bannerBtnText}>Navegar</Text>
                                            </TouchableOpacity>
                                            <View style={styles.bannerDivider} />
                                            <TouchableOpacity
                                                style={styles.bannerBtn}
                                                onPress={() => handleCall(entrega.cliente.telefono)}
                                            >
                                                <Phone size={16} color="white" />
                                                <Text style={styles.bannerBtnText}>Llamar</Text>
                                            </TouchableOpacity>
                                        </LinearGradient>
                                    )}
                                </TouchableOpacity>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            {/* MODAL DETALLE */}
            <Modal
                visible={showDetailModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDetailModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Detalle de Entrega</Text>
                            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                                <X size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {selectedEntrega && (
                            <>
                                <View style={styles.detailInfo}>
                                    <Text style={styles.detailName}>{selectedEntrega.cliente.nombreEmpresa}</Text>
                                    <Text style={styles.detailAddress}>{selectedEntrega.cliente.direccion}</Text>

                                    <View style={styles.detailBadges}>
                                        <View style={styles.badge}>
                                            <Clock size={14} color={COLORS.textSecondary} />
                                            <Text style={styles.badgeText}>{selectedEntrega.horaEstimada || 'Pendiente'}</Text>
                                        </View>
                                        <View style={styles.badge}>
                                            <Box size={14} color={COLORS.textSecondary} />
                                            <Text style={styles.badgeText}>{selectedEntrega.paquetes} Paquetes</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Quick Actions Grid */}
                                <View style={styles.quickActions}>
                                    <TouchableOpacity
                                        style={styles.quickBtn}
                                        onPress={() => handleNavigationLocal(selectedEntrega.cliente.latitud, selectedEntrega.cliente.longitud)}
                                    >
                                        <Navigation size={24} color={COLORS.primary} />
                                        <Text style={styles.quickBtnText}>Navegar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.quickBtn}
                                        onPress={() => handleCall(selectedEntrega.cliente.telefono)}
                                    >
                                        <Phone size={24} color={COLORS.info} />
                                        <Text style={styles.quickBtnText}>Llamar</Text>
                                    </TouchableOpacity>
                                    {selectedEntrega.estado !== 'ENTREGADO' && selectedEntrega.estado !== 'FALLIDO' && (
                                        <TouchableOpacity
                                            style={styles.quickBtn}
                                            onPress={async () => {
                                                setShowDetailModal(false);
                                                if (!permission?.granted) {
                                                    const res = await requestPermission();
                                                    if (!res.granted) {
                                                        showAlert('Permiso denegado', 'Se necesita acceso a la cámara para escanear el QR.', 'warning');
                                                        return;
                                                    }
                                                }
                                                isProcessingQr.current = false;
                                                setScanned(false);
                                                setShowQRModal(true);
                                            }}
                                        >
                                            <Scan size={24} color={COLORS.warning} />
                                            <Text style={styles.quickBtnText}>Scan QR</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                {/* Status Actions */}
                                {selectedEntrega.estado !== 'ENTREGADO' && selectedEntrega.estado !== 'FALLIDO' && (
                                    <View style={styles.statusActions}>
                                        <TouchableOpacity
                                            style={styles.btnPrimary}
                                            onPress={() => { setShowDetailModal(false); setShowPODModal(true); }}
                                        >
                                            <Text style={styles.btnPrimaryText}>Completar Entrega</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.btnDanger}
                                            onPress={() => { setShowDetailModal(false); setShowFailModal(true); }}
                                        >
                                            <Text style={styles.btnDangerText}>Marcar como Fallida</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* MODAL POD (Extraído a componente) */}
            <PodModal
                visible={showPODModal}
                onClose={() => setShowPODModal(false)}
                onComplete={handleCompleteDelivery}
            />

            {/* MODAL FALLO */}
            <Modal visible={showFailModal} transparent animationType="fade" onRequestClose={() => setShowFailModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Reportar Entrega Fallida</Text>
                        <Text style={styles.modalSubtitle}>Selecciona el motivo:</Text>

                        <ScrollView style={{ maxHeight: 300 }}>
                            {failReasons.map((reason) => (
                                <TouchableOpacity
                                    key={reason}
                                    style={[styles.reasonItem, failReason === reason && styles.reasonItemActive]}
                                    onPress={() => setFailReason(reason)}
                                >
                                    <Text style={[styles.reasonText, failReason === reason && { color: COLORS.danger }]}>{reason}</Text>
                                    {failReason === reason && <AlertCircle size={20} color={COLORS.danger} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                            <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowFailModal(false)}>
                                <Text style={styles.btnSecondaryText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.btnDanger, { flex: 1 }]}
                                disabled={!failReason}
                                onPress={handleFailDelivery}
                            >
                                <Text style={styles.btnDangerText}>Confirmar Fallo</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal >

            {/* MODAL QR */}
            < Modal visible={showQRModal} animationType="fade" onRequestClose={() => setShowQRModal(false)}>
                <View style={{ flex: 1, backgroundColor: 'black' }}>
                    {permission?.granted ? (
                        <CameraView
                            style={StyleSheet.absoluteFillObject}
                            facing="back"
                            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                            barcodeScannerSettings={{
                                barcodeTypes: ["qr"],
                            }}
                        />
                    ) : (
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ color: 'white' }}>Solicitando permisos de cámara...</Text>
                        </View>
                    )}

                    <View style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
                        <Text style={{ color: 'white', fontSize: 18, marginBottom: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
                            Escanea el código del paquete
                        </Text>
                        <View style={styles.qrFrame}>
                            <View style={styles.scanLine} />
                        </View>
                        {validatingQr ? (
                            <View style={{ marginTop: 20, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 15, borderRadius: 8 }}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={{ color: 'white', marginTop: 10 }}>Validando paquete...</Text>
                            </View>
                        ) : (
                            <Text style={{ color: COLORS.primary, marginTop: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                                Esperando: {selectedEntrega?.codigoQr || '...'}
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={{ position: 'absolute', top: 40, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 }}
                        onPress={() => setShowQRModal(false)}
                    >
                        <X size={32} color="white" />
                    </TouchableOpacity>
                </View>
            </Modal>
            {/* MODAL GLOBAL (Incidencia) */}
            <Modal
                visible={showGlobalModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowGlobalModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { minHeight: 350 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Reportar Incidencia Global</Text>
                            <TouchableOpacity onPress={() => setShowGlobalModal(false)}>
                                <X size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            Este mensaje será enviado a todos los administradores y aparecerá en el panel de control.
                        </Text>

                        <TextInput
                            style={[styles.textArea, { height: 120, marginBottom: 20 }]}
                            placeholder="Describe la incidencia o emergencia..."
                            placeholderTextColor={COLORS.textSecondary}
                            multiline
                            value={globalReportMsg}
                            onChangeText={setGlobalReportMsg}
                        />

                        <TouchableOpacity
                            style={[styles.btnPrimary, { backgroundColor: COLORS.danger }]}
                            onPress={handleSendGlobalReport}
                            disabled={!globalReportMsg.trim()}
                        >
                            <Text style={styles.btnPrimaryText}>Enviar Incidencia</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* MENÚ DE PERFIL */}
            {showProfileMenu && (
                <TouchableOpacity
                    style={styles.profileMenuOverlay}
                    activeOpacity={1}
                    onPress={() => setShowProfileMenu(false)}
                >
                    <View style={styles.profileMenu}>
                        <TouchableOpacity
                            style={styles.profileMenuItem}
                            onPress={() => {
                                setShowProfileMenu(false);
                                router.push('/(tabs)/perfil');
                            }}
                        >
                            <Text style={styles.profileMenuText}>Configuración</Text>
                        </TouchableOpacity>
                        <View style={{ height: 1, backgroundColor: COLORS.cardBorder, marginHorizontal: 8 }} />
                        <TouchableOpacity
                            style={styles.profileMenuItem}
                            onPress={() => {
                                setShowProfileMenu(false);
                                logout();
                            }}
                        >
                            <Text style={[styles.profileMenuText, { color: COLORS.danger }]}>Cerrar Sesión</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            )}


        </SafeAreaView >
    );
}

const getStatusColor = (estado: string) => {
    switch (estado) {
        case 'ENTREGADO': return COLORS.success;
        case 'FALLIDO': return COLORS.danger;
        case 'EN_CAMINO': return COLORS.primary;
        default: return COLORS.textSecondary;
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'android' ? 10 : 10,
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerContent: {},
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    alertBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    avatarBtn: {
        position: 'relative',
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.card,
        borderWidth: 2,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeOnline: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.success,
        borderWidth: 2,
        borderColor: COLORS.background,
        zIndex: 1,
    },
    profileMenuOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 100,
    },
    profileMenu: {
        position: 'absolute',
        top: 100,
        right: 24,
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 8,
        width: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    profileMenuItem: {
        padding: 16,
    },
    profileMenuText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    mapContainer: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 12,
        marginBottom: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    mapLabel: {
        position: 'absolute',
        color: COLORS.textSecondary,
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    statsGrid: {
        flexDirection: 'row',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 16,
        paddingVertical: 12,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    searchBarContainer: {
        paddingHorizontal: 24,
        marginTop: -25,
    },
    searchBar: {
        backgroundColor: '#1E2D3D',
        height: 50,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        color: 'white',
        fontSize: 14,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 32,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    timelineWrapper: {
        flexDirection: 'row',
        minHeight: 120,
    },
    timelineSidebar: {
        width: 40,
        alignItems: 'center',
    },
    dot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.cardBorder,
        zIndex: 2,
    },
    dotNum: { color: COLORS.textSecondary, fontSize: 12, fontWeight: 'bold' },
    dotCurrent: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    dotSuccess: { backgroundColor: COLORS.success, borderColor: COLORS.success },
    dotDanger: { backgroundColor: COLORS.danger, borderColor: COLORS.danger },
    line: {
        flex: 1,
        width: 2,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 4,
    },
    card: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        overflow: 'hidden',
    },
    cardActive: {
        borderColor: COLORS.primary + '40',
        backgroundColor: '#25354a',
    },
    cardInfo: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    clientName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        flex: 1,
        marginRight: 8,
    },
    statusTag: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    addressText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    actionBanner: {
        flexDirection: 'row',
        height: 44,
    },
    bannerBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    bannerBtnText: {
        color: 'white',
        fontSize: 13,
        fontWeight: 'bold',
    },
    bannerDivider: {
        width: 1,
        height: '60%',
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'center',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        color: COLORS.textSecondary,
        marginTop: 16,
        textAlign: 'center',
    },
    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        minHeight: 500,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'android' ? 20 : 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    modalSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 12,
    },
    detailInfo: {
        marginBottom: 32,
    },
    detailName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    detailAddress: {
        fontSize: 16,
        color: COLORS.textSecondary,
        lineHeight: 24,
    },
    detailBadges: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    badgeText: {
        color: 'white',
        fontSize: 13,
    },
    quickActions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 40,
    },
    quickBtn: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 20,
        paddingVertical: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    quickBtnText: {
        color: 'white',
        fontSize: 12,
        marginTop: 8,
        fontWeight: 'bold',
    },
    statusActions: {
        gap: 12,
    },
    btnPrimary: {
        backgroundColor: COLORS.primary,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    btnPrimaryText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    btnDanger: {
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.danger + '40',
    },
    btnDangerText: {
        color: COLORS.danger,
        fontSize: 14,
        fontWeight: 'bold',
    },
    btnSecondary: {
        height: 50,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        paddingHorizontal: 20,
    },
    btnSecondaryText: {
        color: 'white',
        fontSize: 14,
    },
    signatureContainer: {
        height: 300,
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 24,
    },
    clearSignatureBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.1)',
        padding: 8,
        borderRadius: 8,
    },
    clearSignatureText: {
        fontSize: 12,
        color: '#666',
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 12,
        marginTop: 12,
    },
    textArea: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        color: 'white',
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    fullScreenModal: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    reasonItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.card,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    reasonItemActive: {
        borderColor: COLORS.danger,
        backgroundColor: 'rgba(239,68,68,0.1)',
    },
    reasonText: {
        color: 'white',
        fontSize: 14,
    },
    qrFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanLine: {
        height: 2,
        backgroundColor: COLORS.primary,
        width: '100%',
        shadowColor: COLORS.primary,
        shadowRadius: 10,
        shadowOpacity: 1,
    },
    closeQR: {
        position: 'absolute',
        bottom: 50,
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 16,
        borderRadius: 30,
    },
    dotPending: {
        backgroundColor: COLORS.card,
        borderColor: COLORS.cardBorder,
    },
    photoUploadBtn: {
        height: 100,
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
    },
    photoText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
});
