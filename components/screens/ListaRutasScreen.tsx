import RutaCard from '@/components/RutaCard';
import { Ruta, rutaService } from '@/services/rutaService';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ListaRutasScreen() {
    const router = useRouter();
    const [rutas, setRutas] = useState<Ruta[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRutas = async () => {
        try {
            const data = await rutaService.getMisRutas();
            setRutas(data);
        } catch (error) {
            console.error('Error fetching routes', error);
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
            <View style={styles.header}>
                <Text style={styles.title}>Mis Rutas</Text>
            </View>

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#E67E50" />
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
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No tienes rutas asignadas.</Text>
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
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 24,
    },
    emptyText: {
        color: '#9BA1A6',
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
    },
});
