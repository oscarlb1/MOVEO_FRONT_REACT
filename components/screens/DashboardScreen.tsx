import { EstadisticaHoy, statsService } from '@/services/statsService';
import { useAuth } from '@/store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Bell, Calendar, LogOut, MapPin, Package, RefreshCw, Truck, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DashboardScreen() {
    // ... rest of the component
    const { user, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<EstadisticaHoy | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = async () => {
        try {
            const data = await statsService.getMisEstadisticasHoy();
            setStats(data);
        } catch (error) {
            console.error('Error fetching dashboard stats', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
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
        { title: 'Mis Entregas', icon: Package, color: '#E67E50', subtitle: stats ? `Gestionadas: ${stats.entregasTotales}` : 'Cargando...', onPress: () => router.push('/entregas' as any) },
        { title: 'Mis Rutas', icon: MapPin, color: '#E67E50', subtitle: 'Ver rutas hoy', onPress: () => router.push('/rutas' as any) },
        { title: 'Mi Vehículo', icon: Truck, color: '#E67E50', subtitle: 'Estado: Óptimo' },
        { title: 'Mi Perfil', icon: User, color: '#E67E50', subtitle: 'Configurar cuenta', onPress: () => router.push('/settings' as any) },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E67E50" />
                }
            >

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>Panel de Control</Text>
                        <Text style={styles.userNameText}>{user?.nombre || 'Repartidor'}</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.headerIconButton}>
                            <Bell color="white" size={22} />
                            <View style={styles.notificationBadge} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.profileIcon}
                            onPress={() => router.push('/settings' as any)}
                        >
                            <User color="white" size={24} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Stats Card */}
                <LinearGradient
                    colors={['rgba(230, 126, 80, 0.2)', 'rgba(230, 126, 80, 0.05)']}
                    style={styles.statsCard}
                >
                    <View style={styles.statsHeader}>
                        <View style={styles.statsIconBox}>
                            <Calendar color="#E67E50" size={20} />
                        </View>
                        <Text style={styles.statsTitle}>Actividad de Hoy</Text>
                        <TouchableOpacity onPress={onRefresh}>
                            {loading ? (
                                <ActivityIndicator size="small" color="#E67E50" />
                            ) : (
                                <RefreshCw color="rgba(255, 255, 255, 0.4)" size={18} />
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

                {/* Modules Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Servicios Principales</Text>
                </View>

                <View style={styles.grid}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.card}
                            onPress={item.onPress}
                            activeOpacity={0.7}
                        >
                            <View style={styles.cardContent}>
                                <View style={[styles.iconContainer, { backgroundColor: 'rgba(230, 126, 80, 0.1)' }]}>
                                    <item.icon color={item.color} size={26} />
                                </View>
                                <View style={styles.cardTextContainer}>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Quick Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <LogOut color="#FF5252" size={20} />
                    <Text style={styles.logoutText}>Finalizar Turno / Salir</Text>
                </TouchableOpacity>
                <Text style={styles.versionText}>Moveo Logistics v2.0.4</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#092C4C',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 10,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    headerIconButton: {
        width: 45,
        height: 45,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    notificationBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E67E50',
        borderWidth: 1,
        borderColor: '#092C4C',
    },
    welcomeText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '500',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    userNameText: {
        fontSize: 26,
        fontWeight: '800',
        color: 'white',
        marginTop: 4,
    },
    profileIcon: {
        width: 50,
        height: 50,
        borderRadius: 18,
        backgroundColor: '#E67E50',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#E67E50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    statsCard: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(230, 126, 80, 0.3)',
        marginBottom: 35,
    },
    statsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    statsIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(230, 126, 80, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statsTitle: {
        fontSize: 16,
        color: 'white',
        fontWeight: '700',
        flex: 1,
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
        fontSize: 20,
        fontWeight: '800',
        color: 'white',
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 4,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    sectionHeader: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 0.5,
    },
    grid: {
        gap: 16,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: 'white',
    },
    cardSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 4,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        padding: 16,
        gap: 12,
        backgroundColor: 'rgba(255, 82, 82, 0.05)',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 82, 82, 0.1)',
    },
    logoutText: {
        color: '#FF5252',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    versionText: {
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.15)',
        fontSize: 11,
        marginTop: 20,
        fontWeight: '500',
    }
});
