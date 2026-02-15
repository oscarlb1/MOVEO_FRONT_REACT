import { Entrega, rutaService } from '@/services/rutaService';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Package, Search } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, RefreshControl, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EntregasScreen() {
    // ... (rest of states remain same)
    const [entregas, setEntregas] = useState<Entrega[]>([]);
    const [filteredEntregas, setFilteredEntregas] = useState<Entrega[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const router = useRouter();

    const handleOpenMaps = (direccion: string) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
        Linking.openURL(url).catch(err => {
            console.error('Error opening maps', err);
            Alert.alert('Error', 'No se pudo abrir el mapa');
        });
    };

    const fetchData = async () => {
        // ... (fetchData implementation remains same)
        try {
            const rutas = await rutaService.getMisRutas();
            const allEntregas: Entrega[] = [];
            const detailPromises = rutas.map(r => rutaService.getRutaDetalle(r.id));
            const detailedRutas = await Promise.all(detailPromises);

            detailedRutas.forEach(r => {
                if (r.entregas) {
                    allEntregas.push(...r.entregas);
                }
            });

            setEntregas(allEntregas);
            setFilteredEntregas(allEntregas);
        } catch (error) {
            console.error('Error fetching deliveries', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredEntregas(entregas);
        } else {
            const filtered = entregas.filter(e =>
                e.cliente.nombreEmpresa.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.cliente.direccion.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredEntregas(filtered);
        }
    }, [searchQuery, entregas]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const renderEntrega = ({ item }: { item: Entrega }) => {
        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => handleOpenMaps(item.cliente.direccion)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.iconBox}>
                        <Package color="#E67E50" size={20} />
                    </View>
                    <View style={[styles.statusBadge,
                    item.estado === 'ENTREGADO' ? styles.statusSuccess :
                        item.estado === 'CANCELADO' ? styles.statusError : styles.statusPending]}>
                        <Text style={styles.statusText}>{item.estado}</Text>
                    </View>
                </View>

                <Text style={styles.clientName}>{item.cliente.nombreEmpresa}</Text>

                <View style={styles.addressRow}>
                    <MapPin size={14} color="rgba(255, 255, 255, 0.4)" />
                    <Text style={styles.addressText}>{item.cliente.direccion}</Text>
                </View>

                <View style={styles.footer}>
                    <View style={styles.footerContent}>
                        <Text style={styles.stopText}>Parada #{item.ordenParada}</Text>
                        <Text style={styles.mapHint}>Toca para ver en Google Maps</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>Mis Entregas</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Search color="rgba(255, 255, 255, 0.3)" size={20} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar por cliente o dirección..."
                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#E67E50" />
                </View>
            ) : (
                <FlatList
                    data={filteredEntregas}
                    renderItem={renderEntrega}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E67E50" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Package size={48} color="rgba(255, 255, 255, 0.1)" />
                            <Text style={styles.emptyText}>No se encontraron entregas</Text>
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
        backgroundColor: '#092C4C',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        gap: 15,
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: 'white',
    },
    searchContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 50,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: 'white',
        fontSize: 15,
    },
    listContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(230, 126, 80, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
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
    clientName: {
        fontSize: 17,
        fontWeight: '700',
        color: 'white',
        marginBottom: 8,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    addressText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.4)',
        flex: 1,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
        paddingTop: 12,
    },
    footerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stopText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#E67E50',
    },
    mapHint: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.2)',
        fontStyle: 'italic',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
        gap: 16,
    },
    emptyText: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 16,
        fontWeight: '600',
    },
});
