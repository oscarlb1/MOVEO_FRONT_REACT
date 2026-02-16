import { WebColors } from '@/constants/theme';
import { useAuth } from '@/store/authStore';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    BarChart3,
    CheckCircle2,
    Clock,
    MapPin as MapIcon,
    Navigation,
    Package,
    Phone,
    RefreshCw,
    TrendingUp,
    Zap
} from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    useAnimatedProps,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path, Pattern, Rect, Text as SvgText } from 'react-native-svg';

const theme = WebColors.dark;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function ListaRutasScreen() {
    const { user } = useAuth();
    const router = useRouter();

    // Animation Values
    const pathLength = useSharedValue(0);
    const pulse = useSharedValue(1);
    const progress = useSharedValue(0);

    useEffect(() => {
        // Trigger animations on mount
        pathLength.value = withTiming(1, { duration: 2500 });
        pulse.value = withRepeat(
            withSequence(
                withTiming(1.2, { duration: 1000 }),
                withTiming(1, { duration: 1000 })
            ),
            -1,
            true
        );
        progress.value = withDelay(500, withTiming(0.6, { duration: 1500 }));
    }, []);

    const animatedPathProps = useAnimatedProps(() => ({
        strokeDashoffset: 400 * (1 - pathLength.value),
    }));

    const progressBarStyle = useAnimatedProps(() => ({
        width: `${progress.value * 100}%`,
    }) as any);

    const markers = [
        { x: 50, y: 180, completed: true },
        { x: 100, y: 160, completed: true },
        { x: 130, y: 140, completed: true },
        { x: 180, y: 110, completed: false, active: true },
        { x: 230, y: 70, completed: false }
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#0a1628" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Header Section */}
                <LinearGradient
                    colors={['#0a1628', '#0d1d35']}
                    style={styles.header}
                >
                    <Text style={styles.headerTitle}>Mis Rutas</Text>
                    <Text style={styles.headerSubtitle}>Optimizadas con IA • Actualizado hace 2 min</Text>
                </LinearGradient>

                {/* Map Preview Section */}
                <View style={styles.mapContainer}>
                    <LinearGradient
                        colors={['#1e2d3d', '#0d1d35', '#0a1628']}
                        style={StyleSheet.absoluteFill}
                    />

                    {/* SVG Map Illustration */}
                    <Svg width="100%" height="100%" viewBox="0 0 300 250">
                        <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <Path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" opacity="0.1" />
                        </Pattern>
                        <Rect width="100%" height="100%" fill="url(#grid)" />

                        {/* Route Line Animation */}
                        <AnimatedPath
                            d="M 50,180 Q 80,140 100,160 T 130,140 T 180,110 T 230,70"
                            stroke={theme.primary}
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray="400"
                            animatedProps={animatedPathProps}
                        />

                        {/* Stop Markers */}
                        {markers.map((point, i) => (
                            <G key={i}>
                                {point.active && (
                                    <Circle
                                        cx={point.x}
                                        cy={point.y}
                                        r="12"
                                        fill="none"
                                        stroke={theme.primary}
                                        strokeWidth="2"
                                        opacity="0.5"
                                    />
                                )}
                                <Circle
                                    cx={point.x}
                                    cy={point.y}
                                    r="8"
                                    fill={point.completed ? "#374B54" : point.active ? theme.primary : "#2a3f54"}
                                    stroke="white"
                                    strokeWidth="2"
                                />
                                <SvgText
                                    x={point.x}
                                    y={point.y + 4}
                                    fill="white"
                                    fontSize="10"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                >
                                    {i + 1}
                                </SvgText>
                            </G>
                        ))}
                    </Svg>

                    {/* Quality Badges */}
                    <View style={styles.mapTopBadges}>
                        <BlurView intensity={30} tint="dark" style={styles.glassBadge}>
                            <View style={styles.row}>
                                <View style={styles.statusDot} />
                                <Text style={styles.badgeText}>Ruta activa - Centro</Text>
                            </View>
                        </BlurView>
                        <BlurView intensity={30} tint="dark" style={styles.glassBadge}>
                            <View style={styles.row}>
                                <Zap size={14} color={theme.primary} />
                                <Text style={styles.badgeTextOrange}>Optimizada</Text>
                            </View>
                        </BlurView>
                    </View>

                    {/* Map Navigation Button */}
                    <TouchableOpacity style={styles.mapNavButton} activeOpacity={0.8}>
                        <Navigation size={22} color="white" />
                    </TouchableOpacity>

                    {/* Bottom Stats Overlay */}
                    <View style={styles.mapBottomStats}>
                        <BlurView intensity={30} tint="dark" style={styles.statPill}>
                            <Text style={styles.statValue}>12.5 km</Text>
                            <Text style={styles.statLabel}>Distancia</Text>
                        </BlurView>
                        <BlurView intensity={30} tint="dark" style={styles.statPill}>
                            <Text style={styles.statValueOrange}>45 min</Text>
                            <Text style={styles.statLabel}>ETA</Text>
                        </BlurView>
                        <BlurView intensity={30} tint="dark" style={styles.statPill}>
                            <Text style={styles.statValue}>5</Text>
                            <Text style={styles.statLabel}>Paradas</Text>
                        </BlurView>
                    </View>
                </View>

                {/* Progress Card Section */}
                <View style={styles.contentPadding}>
                    <LinearGradient
                        colors={['#1e2d3d', '#0a1628']}
                        style={styles.progressCard}
                    >
                        <View style={styles.progressHeader}>
                            <View>
                                <Text style={styles.cardTitle}>Progreso de ruta</Text>
                                <Text style={styles.cardSubtitle}>3 de 5 completadas</Text>
                            </View>
                            <Text style={styles.percentText}>60%</Text>
                        </View>

                        <View style={styles.progressBarWrapper}>
                            <Animated.View style={[styles.progressBarFill, progressBarStyle]}>
                                <View style={styles.progressHandle} />
                            </Animated.View>
                        </View>

                        <View style={styles.statsGrid}>
                            <View style={styles.gridItem}>
                                <Text style={styles.gridValue}>7.5 km</Text>
                                <Text style={styles.gridLabel}>Recorridos</Text>
                            </View>
                            <View style={styles.gridItem}>
                                <Text style={styles.gridValue}>5.0 km</Text>
                                <Text style={styles.gridLabel}>Restantes</Text>
                            </View>
                            <View style={styles.gridItem}>
                                <Text style={styles.gridValueGreen}>-18%</Text>
                                <Text style={styles.gridLabel}>vs. Manual</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Timeline Section */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Secuencia de paradas</Text>
                        <TouchableOpacity style={styles.reoptimizeBtn}>
                            <RefreshCw size={14} color={theme.primary} />
                            <Text style={styles.reoptimizeText}>Reoptimizar</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.timeline}>
                        {/* Stop 1 - COMPLETED */}
                        <View style={styles.timelineNode}>
                            <View style={styles.nodeLeft}>
                                <View style={styles.circleDone}>
                                    <CheckCircle2 size={18} color="white" />
                                </View>
                                <View style={styles.verticalLine} />
                            </View>
                            <View style={styles.stopCardInactive}>
                                <View style={styles.stopCardHeader}>
                                    <View style={styles.row}>
                                        <Text style={styles.stopId}>#DEL-1240</Text>
                                        <View style={styles.doneBadge}>
                                            <Text style={styles.doneBadgeText}>Completada</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.timeText}>10:30</Text>
                                </View>
                                <Text style={styles.clientName}>Pedro Sánchez</Text>
                                <Text style={styles.addressText}>Ronda Sant Pere 34, 2ºA</Text>
                            </View>
                        </View>

                        {/* Stop 2 - ACTIVE */}
                        <View style={styles.timelineNode}>
                            <View style={styles.nodeLeft}>
                                <Animated.View style={[styles.circleActive, { transform: [{ scale: pulse }] }]}>
                                    <Text style={styles.activeNumber}>4</Text>
                                </Animated.View>
                                <View style={styles.verticalLineActive} />
                            </View>
                            <LinearGradient
                                colors={[theme.primary, '#d66d42']}
                                style={styles.stopCardActive}
                            >
                                <View style={styles.stopCardHeader}>
                                    <View style={styles.tagRow}>
                                        <Text style={styles.stopIdLight}>#DEL-1247</Text>
                                        <View style={styles.activeTag}>
                                            <View style={styles.liveDot} />
                                            <Text style={styles.tagText}>En curso</Text>
                                        </View>
                                        <View style={styles.activeTag}>
                                            <Zap size={10} color="white" />
                                            <Text style={styles.tagText}>Urgente</Text>
                                        </View>
                                    </View>
                                </View>
                                <Text style={styles.clientNameLarge}>Ana García Martínez</Text>
                                <Text style={styles.addressTextLight}>Calle Mayor 45, 3º B</Text>

                                <View style={styles.activeMetrics}>
                                    <View style={styles.activeMetricItem}>
                                        <Clock size={14} color="white" opacity={0.8} />
                                        <Text style={styles.activeMetricValue}>8 min</Text>
                                    </View>
                                    <View style={styles.activeMetricItem}>
                                        <Package size={14} color="white" opacity={0.8} />
                                        <Text style={styles.activeMetricValue}>2 paq.</Text>
                                    </View>
                                    <View style={styles.activeMetricItem}>
                                        <Navigation size={14} color="white" opacity={0.8} />
                                        <Text style={styles.activeMetricValue}>1.2 km</Text>
                                    </View>
                                </View>

                                <View style={styles.actionGrid}>
                                    <TouchableOpacity style={styles.secondaryBtn}>
                                        <Phone size={18} color="white" />
                                        <Text style={styles.btnText}>Llamar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.primaryBtn}>
                                        <Navigation size={18} color={theme.primary} />
                                        <Text style={styles.primaryBtnText}>Navegar</Text>
                                    </TouchableOpacity>
                                </View>
                            </LinearGradient>
                        </View>

                        {/* Stop 3 - PENDING */}
                        <View style={styles.timelineNode}>
                            <View style={styles.nodeLeft}>
                                <View style={styles.circlePending}>
                                    <Text style={styles.pendingNumber}>5</Text>
                                </View>
                            </View>
                            <View style={styles.stopCardPending}>
                                <View style={styles.stopCardHeader}>
                                    <View style={styles.row}>
                                        <Text style={styles.stopId}>#DEL-1248</Text>
                                        <View style={styles.pendingBadge}>
                                            <Text style={styles.pendingBadgeText}>Pendiente</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.timeTextOrange}>16:00</Text>
                                </View>
                                <Text style={styles.clientName}>Luis Rodríguez</Text>
                                <Text style={styles.addressText}>Av. Constitución 89, Bajo A</Text>
                            </View>
                        </View>
                    </View>

                    {/* AI Optimization Insight */}
                    <View style={styles.aiInsightCard}>
                        <View style={styles.aiHeader}>
                            <View style={styles.aiIconWrapper}>
                                <Zap size={22} color={theme.primary} />
                            </View>
                            <View style={styles.flex1}>
                                <Text style={styles.aiTitle}>Ruta optimizada con IA</Text>
                                <Text style={styles.aiDescription}>
                                    Considerando tráfico en tiempo real, ventanas horarias y prioridades.
                                </Text>
                            </View>
                        </View>
                        <View style={styles.aiResultsRow}>
                            <View style={styles.aiResultPill}>
                                <TrendingUp size={14} color={theme.success} />
                                <Text style={styles.aiResultValue}>-18%</Text>
                                <Text style={styles.aiResultLabel}>Tiempo</Text>
                            </View>
                            <View style={styles.aiResultPill}>
                                <TrendingUp size={14} color={theme.success} />
                                <Text style={styles.aiResultValue}>-3.2 km</Text>
                                <Text style={styles.aiResultLabel}>Distancia</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.fullAnalysisBtn}>
                            <BarChart3 size={18} color="white" />
                            <Text style={styles.fullAnalysisText}>Ver análisis completo</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Alternative Routes List */}
                    <Text style={styles.sectionSubTitle}>Rutas alternativas</Text>
                    <TouchableOpacity style={styles.altCard}>
                        <View style={styles.altCardContent}>
                            <MapIcon size={18} color={theme.textSecondary} />
                            <View style={styles.flex1}>
                                <Text style={styles.altTitle}>Ruta más rápida</Text>
                                <Text style={styles.altMeta}>14.2 km • Evita tráfico centro</Text>
                            </View>
                            <Text style={styles.altTime}>42 min</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.altCard}>
                        <View style={styles.altCardContent}>
                            <MapIcon size={18} color={theme.textSecondary} />
                            <View style={styles.flex1}>
                                <Text style={styles.altTitle}>Ruta más corta</Text>
                                <Text style={styles.altMeta}>11.8 km • Menor distancia</Text>
                            </View>
                            <Text style={styles.altTime}>48 min</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 30,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '900',
        color: 'white',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: 6,
    },
    mapContainer: {
        height: 280,
        marginHorizontal: 24,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: '#0d1d35',
    },
    mapTopBadges: {
        position: 'absolute',
        top: 20,
        left: 20,
        flexDirection: 'row',
        gap: 8,
    },
    glassBadge: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.success,
        marginRight: 8,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    badgeTextOrange: {
        color: theme.primary,
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
    mapNavButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        width: 44,
        height: 44,
        backgroundColor: theme.primary,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    mapBottomStats: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        flexDirection: 'row',
        gap: 8,
    },
    statPill: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 14,
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    statValue: {
        color: 'white',
        fontSize: 14,
        fontWeight: '800',
    },
    statValueOrange: {
        color: theme.primary,
        fontSize: 14,
        fontWeight: '800',
    },
    statLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 10,
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    contentPadding: {
        paddingHorizontal: 24,
        marginTop: 24,
    },
    progressCard: {
        borderRadius: 28,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 32,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: 'white',
    },
    cardSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: 4,
    },
    percentText: {
        fontSize: 32,
        fontWeight: '900',
        color: theme.primary,
    },
    progressBarWrapper: {
        height: 12,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 6,
        marginBottom: 24,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: theme.primary,
        borderRadius: 6,
    },
    progressHandle: {
        position: 'absolute',
        right: -4,
        top: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'white',
        borderWidth: 3,
        borderColor: theme.primary,
    },
    statsGrid: {
        flexDirection: 'row',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
    },
    gridItem: {
        flex: 1,
    },
    gridValue: {
        fontSize: 18,
        fontWeight: '800',
        color: 'white',
    },
    gridValueGreen: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.success,
    },
    gridLabel: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 4,
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: 'white',
    },
    reoptimizeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(230, 126, 80, 0.1)',
        borderRadius: 10,
    },
    reoptimizeText: {
        color: theme.primary,
        fontSize: 13,
        fontWeight: '700',
    },
    timeline: {
        paddingLeft: 4,
    },
    timelineNode: {
        flexDirection: 'row',
        gap: 20,
    },
    nodeLeft: {
        alignItems: 'center',
        width: 44,
    },
    circleDone: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#374B54',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    circleActive: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
        zIndex: 10,
        elevation: 8,
        shadowColor: theme.primary,
        shadowOpacity: 0.6,
        shadowRadius: 10,
    },
    activeNumber: {
        color: 'white',
        fontSize: 20,
        fontWeight: '900',
    },
    circlePending: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1e2d3d',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    pendingNumber: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 18,
        fontWeight: '800',
    },
    verticalLine: {
        width: 2,
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: 4,
    },
    verticalLineActive: {
        width: 3,
        flex: 1,
        backgroundColor: theme.primary,
        marginVertical: 4,
    },
    stopCardInactive: {
        flex: 1,
        backgroundColor: 'rgba(30, 45, 61, 0.4)',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    stopCardActive: {
        flex: 1,
        borderRadius: 28,
        padding: 24,
        marginBottom: 24,
    },
    stopCardPending: {
        flex: 1,
        backgroundColor: '#1e2d3d',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    stopCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    stopIdText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 11,
        fontWeight: '600',
    },
    stopIdLight: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 11,
        fontWeight: '700',
    },
    activeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 4,
    },
    tagText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '800',
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'white',
    },
    doneBadge: {
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginLeft: 8,
    },
    doneBadgeText: {
        color: theme.success,
        fontSize: 10,
        fontWeight: '800',
    },
    pendingBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginLeft: 8,
    },
    pendingBadgeText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 10,
        fontWeight: '800',
    },
    timeText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
        fontWeight: '700',
    },
    timeTextOrange: {
        color: theme.primary,
        fontSize: 13,
        fontWeight: '800',
    },
    clientName: {
        fontSize: 18,
        fontWeight: '800',
        color: 'white',
        marginBottom: 4,
    },
    clientNameLarge: {
        fontSize: 22,
        fontWeight: '900',
        color: 'white',
        marginBottom: 6,
    },
    addressText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
    },
    addressTextLight: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    activeMetrics: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 20,
        marginBottom: 24,
    },
    activeMetricItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    activeMetricValue: {
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
    },
    actionGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    secondaryBtn: {
        flex: 1,
        height: 52,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    primaryBtn: {
        flex: 1,
        height: 52,
        backgroundColor: 'white',
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    btnText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 15,
    },
    primaryBtnText: {
        color: theme.primary,
        fontWeight: '800',
        fontSize: 15,
    },
    aiInsightCard: {
        backgroundColor: 'rgba(230, 126, 80, 0.05)',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(230, 126, 80, 0.2)',
        marginBottom: 40,
    },
    aiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    aiIconWrapper: {
        width: 48,
        height: 48,
        backgroundColor: 'rgba(230, 126, 80, 0.15)',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    aiTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: theme.primary,
    },
    aiDescription: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: 4,
        lineHeight: 18,
    },
    aiResultsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 24,
        marginBottom: 20,
    },
    aiResultPill: {
        flex: 1,
        backgroundColor: '#0a1628',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    aiResultValue: {
        color: theme.success,
        fontSize: 18,
        fontWeight: '900',
    },
    aiResultLabel: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 11,
        fontWeight: '700',
    },
    fullAnalysisBtn: {
        height: 56,
        backgroundColor: theme.primary,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    fullAnalysisText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
    },
    sectionSubTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: 'white',
        marginBottom: 16,
    },
    altCard: {
        backgroundColor: '#1e2d3d',
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    altCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        gap: 16,
    },
    altTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
    altMeta: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 2,
    },
    altTime: {
        fontSize: 15,
        fontWeight: '800',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    flex1: {
        flex: 1,
    },
    stopId: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 11,
        fontWeight: '600',
    },
});
