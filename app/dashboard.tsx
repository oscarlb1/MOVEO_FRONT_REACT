import { useAuth } from '@/store/authStore';
import { useRouter } from 'expo-router';
import { LogOut, MapPin, Package, Truck, User } from 'lucide-react-native';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DashboardScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const menuItems = [
        { title: 'Mis Entregas', icon: Package, color: '#E67E50' },
        { title: 'Rutas de Hoy', icon: MapPin, color: '#E67E50' },
        { title: 'Vehículo', icon: Truck, color: '#E67E50' },
        { title: 'Mi Perfil', icon: User, color: '#E67E50', onPress: () => router.push('/settings' as any) },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>¡Hola!</Text>
                        <Text style={styles.userNameText}>{user?.nombre || 'Usuario'}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.profileIcon}
                        onPress={() => router.push('/settings' as any)}
                    >
                        <User color="white" size={24} />
                    </TouchableOpacity>
                </View>

                <View style={styles.statsCard}>
                    <Text style={styles.statsTitle}>Resumen del Día</Text>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>12</Text>
                            <Text style={styles.statLabel}>Entregas</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>85%</Text>
                            <Text style={styles.statLabel}>Completado</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Módulos</Text>
                <View style={styles.grid}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.card}
                            onPress={item.onPress}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                                <item.icon color={item.color} size={28} />
                            </View>
                            <Text style={styles.cardTitle}>{item.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <LogOut color="#FF4444" size={20} />
                    <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </TouchableOpacity>
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    welcomeText: {
        fontSize: 18,
        color: '#9BA1A6',
    },
    userNameText: {
        fontSize: 28,
        fontWeight: '700',
        color: 'white',
    },
    profileIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E67E50',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 32,
    },
    statsTitle: {
        fontSize: 16,
        color: 'white',
        fontWeight: '600',
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#E67E50',
    },
    statLabel: {
        fontSize: 12,
        color: '#9BA1A6',
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: 'white',
        marginBottom: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    card: {
        width: '48%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        padding: 16,
        gap: 8,
    },
    logoutText: {
        color: '#FF4444',
        fontSize: 16,
        fontWeight: '600',
    },
});
