import { WebColors } from '@/constants/theme';
import { notificacionService } from '@/services/notificacionService';
import { EstadisticaHoy, statsService } from '@/services/statsService';
import { useAuth } from '@/store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, Calendar, ChevronRight, LogOut, MapPin, Package, RefreshCw, Truck, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificacionesModal from '../modals/NotificacionesModal';

const theme = WebColors.dark;

export default function DashboardScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<EstadisticaHoy | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifModalVisible, setNotifModalVisible] = useState(false);

    const fetchStats = async () => {
        try {
            const [statsData, count] = await Promise.all([
                statsService.getMisEstadisticasHoy(),
                notificacionService.getUnreadCount()
            ]);
            setStats(statsData);
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching dashboard data', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const count = await notificacionService.getUnreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching unread count', error);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const menuItems = [
        { title: 'Entregas', icon: Package, color: theme.primary, subtitle: stats ? `${stats.entregasTotales} asignadas` : 'Cargando...', onPress: () => router.push('/entregas' as any) },
        { title: 'Rutas', icon: MapPin, color: theme.primary, subtitle: 'Ver ruta de hoy', onPress: () => router.push('/rutas' as any) },
        { title: 'Vehículo', icon: Truck, color: theme.primary, subtitle: 'Estado: Óptimo' },
        { title: 'Mi Perfil', icon: User, color: theme.primary, subtitle: 'Configurar cuenta', onPress: () => router.push('/settings' as any) },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={theme.background} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            >

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>Hola,</Text>
                        <Text style={styles.userNameText}>{user?.nombre || 'Conductor'}</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.headerIconButton}
                            onPress={() => setNotifModalVisible(true)}
                        >
                            <Bell color="white" size={22} />
                            {unreadCount > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.badgeText}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.profileIcon}
                            onPress={() => router.push('/settings' as any)}
                        >
                            <User color="white" size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Stats Card */}
                <LinearGradient
                    colors={[theme.card, theme.card]} // Solid for now, or subtle gradient
                    style={styles.statsCard}
                >
                    <View style={styles.statsHeader}>
                        <View style={styles.statsIconBox}>
                            <Calendar color={theme.primary} size={20} />
                        </View>
                        <Text style={styles.statsTitle}>Tu Actividad Hoy</Text>
                        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                            {loading ? (
                                <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                                <RefreshCw color={theme.textSecondary} size={16} />
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats?.entregasCompletadas ?? 0}</Text>
                            <Text style={styles.statLabel}>Entregas</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats?.eficiencia ?? 0}%</Text>
                            <Text style={styles.statLabel}>Eficiencia</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats?.tiempoEnRuta ?? '0h 0m'}</Text>
                            <Text style={styles.statLabel}>En Ruta</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Menu Section */}
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={item.onPress}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.menuIconContainer, { backgroundColor: `${theme.primary}15` }]}>
                                <item.icon color={theme.primary} size={22} />
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={styles.menuTitle}>{item.title}</Text>
                                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                            </View>
                            <ChevronRight color={theme.textSecondary} size={20} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Quick Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <LogOut color={theme.danger || '#ef4444'} size={18} />
                    <Text style={styles.logoutText}>Finalizar Turno</Text>
                </TouchableOpacity>
                <Text style={styles.versionText}>Moveo App v2.1.0</Text>
            </ScrollView>

            <NotificacionesModal
                visible={notifModalVisible}
                onClose={() => setNotifModalVisible(false)}
                onRefreshCount={fetchUnreadCount}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerIconButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: theme.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.cardBorder,
    },
    notificationBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#E67E50',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#092C4C',
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '800',
    },
    welcomeText: {
        fontSize: 14,
        color: theme.textSecondary,
        fontWeight: '500',
    },
    userNameText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text,
        marginTop: 2,
    },
    profileIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsCard: {
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        marginBottom: 32,
        backgroundColor: theme.card,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    statsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    statsIconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: `${theme.primary}20`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    statsTitle: {
        fontSize: 16,
        color: theme.text,
        fontWeight: '600',
        flex: 1,
    },
    refreshButton: {
        padding: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: theme.textSecondary,
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: theme.cardBorder,
    },
    menuContainer: {
        gap: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.cardBorder,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 2,
    },
    menuSubtitle: {
        fontSize: 13,
        color: theme.textSecondary,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 32,
        padding: 16,
        gap: 10,
        backgroundColor: `${theme.danger}10`, // 10% opacity danger color
        borderRadius: 12,
        borderWidth: 1,
        borderColor: `${theme.danger}20`,
    },
    logoutText: {
        color: theme.danger,
        fontSize: 15,
        fontWeight: '600',
    },
    versionText: {
        textAlign: 'center',
        color: theme.textSecondary,
        fontSize: 11,
        marginTop: 24,
        opacity: 0.5,
    }
});
