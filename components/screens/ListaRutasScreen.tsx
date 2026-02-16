import RutaCard from '@/components/RutaCard';
import { WebColors } from '@/constants/theme';
import { Ruta, rutaService } from '@/services/rutaService';
import { useRouter } from 'expo-router';
import { ArrowLeft, RefreshCw, Search } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const theme = WebColors.dark;

export default function ListaRutasScreen() {
    const router = useRouter();
    const [rutas, setRutas] = useState<Ruta[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRutas = async () => {
        try {
            setError(null);
            const data = await rutaService.getMisRutas();
            setRutas(data);
        } catch (error) {
            console.error('Error fetching routes', error);
            setError('No se pudieron cargar las rutas. Verifica tu conexión.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchRutas();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRutas();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={theme.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Mis Rutas</Text>
                    <Text style={styles.subtitle}>{rutas.length} Rutas Asignadas</Text>
                </View>
                <TouchableOpacity onPress={onRefresh} style={styles.headerAction}>
                    <RefreshCw color="white" size={20} />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchWrapper}>
                    <Search color={theme.textSecondary} size={20} />
                    <TextInput
                        placeholder="Buscar por ID o matrícula..."
                        placeholderTextColor={theme.textSecondary}
                        style={styles.searchInput}
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={styles.loadingText}>Cargando rutas...</Text>
                </View>
            ) : error ? (
                <View style={styles.centerContent}>
                    <View style={styles.errorIconBox}>
                        <Text style={styles.errorEmoji}>⚠️</Text>
                    </View>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchRutas}>
                        <Text style={styles.retryButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={rutas}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <RutaCard
                            ruta={item}
                            onPress={() => router.push(`/rutas/${item.id}` as any)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyEmoji}>📦</Text>
                            <Text style={styles.emptyText}>No hay rutas asignadas para hoy.</Text>
                            <Text style={styles.emptySubtext}>Las rutas aparecerán aquí cuando el administrador las asigne.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
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
        borderRadius: 12,
        backgroundColor: theme.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.cardBorder,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.text,
    },
    subtitle: {
        fontSize: 12,
        color: theme.textSecondary,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    headerAction: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: theme.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.cardBorder,
    },
    searchContainer: {
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card,
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 52,
        borderWidth: 1,
        borderColor: theme.cardBorder,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: theme.text,
        fontSize: 15,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        color: theme.textSecondary,
        fontWeight: '600',
    },
    listContent: {
        padding: 24,
        paddingTop: 0,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        paddingHorizontal: 40,
    },
    emptyEmoji: {
        fontSize: 50,
        marginBottom: 20,
        opacity: 0.5,
    },
    emptyText: {
        color: theme.text,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '700',
    },
    emptySubtext: {
        color: theme.textSecondary,
        textAlign: 'center',
        marginTop: 10,
        fontSize: 14,
        lineHeight: 20,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorIconBox: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${theme.danger}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    errorEmoji: {
        fontSize: 32,
    },
    errorText: {
        color: theme.danger,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: theme.primary,
        paddingHorizontal: 30,
        paddingVertical: 14,
        borderRadius: 12,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});
