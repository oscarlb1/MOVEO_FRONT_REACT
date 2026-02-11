import { Ruta, rutaService } from '@/services/rutaService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Map as MapIcon, MapPin } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DetalleRutaScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [ruta, setRuta] = useState<Ruta | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (id) { 
            fetchRutaDetalle(Number(id));
        }
    }, [id]);

    const fetchRutaDetalle = async (rutaId: number) => {
        try {
            const data = await rutaService.getRutaDetalle(rutaId);
            setRuta(data);
        } catch (error) {
            console.error('Error fetching route details', error);
            Alert.alert('Error', 'No se pudo cargar la ruta');
        } finally {
            setLoading(false);
        }
    };

    const handleEstadoChange = async () => {
        if (!ruta) return;

        let nuevoEstado = '';
        if (ruta.estado === 'PENDIENTE') nuevoEstado = 'EN_PROGRESO';
        else if (ruta.estado === 'EN_PROGRESO') nuevoEstado = 'COMPLETADA';
        else return;

        setActionLoading(true);
        const success = await rutaService.updateEstadoRuta(ruta.id, nuevoEstado);
        setActionLoading(false);

        if (success) {
            setRuta({ ...ruta, estado: nuevoEstado });
            Alert.alert('Éxito', `Ruta marcada como ${nuevoEstado}`);
        } else {
            Alert.alert('Error', 'No se pudo actualizar el estado de la ruta');
        }
    };

    const openMap = () => {
        if (!ruta?.entregas || ruta.entregas.length === 0) {
            Alert.alert('Info', 'No hay entregas en esta ruta');
            return;
        }

        // Sort deliveries just in case, though they should be sorted by ordenParada
        const sortedEntregas = [...ruta.entregas].sort((a, b) => a.ordenParada - b.ordenParada);

        // Construct the URL
        const destination = encodeURIComponent(sortedEntregas[sortedEntregas.length - 1].cliente.direccion);
        const waypoints = sortedEntregas
            .slice(0, -1)
            .map(e => encodeURIComponent(e.cliente.direccion))
            .join('|');

        // Universal Google Maps URL structure
        // drive, walk, bicycle are modes. driving is default.
        const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;

        Linking.openURL(url).catch(err => {
            console.error('An error occurred', err);
            Alert.alert('Error', 'No se pudo abrir el mapa');
        });
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#E67E50" />
            </View>
        );
    }

    if (!ruta) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Ruta no encontrada</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>Ruta #{ruta.id}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.infoCard}>
                    <View style={styles.row}>
                        <Text style={styles.label}>Estado:</Text>
                        <Text style={styles.value}>{ruta.estado}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Fecha:</Text>
                        <Text style={styles.value}>{new Date(ruta.fecha).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>Vehículo:</Text>
                        <Text style={styles.value}>{ruta.vehiculo?.marcaModelo || 'N/A'}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.mapButton} onPress={openMap}>
                    <MapIcon color="white" size={20} />
                    <Text style={styles.mapButtonText}>Ver Ruta en Mapa</Text>
                </TouchableOpacity>

                {/* Deliveries List */}
                <Text style={styles.sectionTitle}>Entregas ({ruta.entregas?.length || 0})</Text>

                {ruta.entregas?.map((entrega) => (
                    <View key={entrega.id} style={styles.entregaCard}>
                        <View style={styles.entregaHeader}>
                            <View style={styles.orderBadge}>
                                <Text style={styles.orderText}>{entrega.ordenParada}</Text>
                            </View>
                            <Text style={styles.clientName}>{entrega.cliente.nombreEmpresa}</Text>
                        </View>

                        <View style={styles.addressRow}>
                            <MapPin size={16} color="#9BA1A6" />
                            <Text style={styles.addressText}>{entrega.cliente.direccion}</Text>
                        </View>

                        <View style={[styles.statusBadge, { alignSelf: 'flex-start', marginTop: 8 }]}>
                            <Text style={styles.statusTextSmall}>{entrega.estado}</Text>
                        </View>
                    </View>
                ))}

                {/* Action Button */}
                {ruta.estado !== 'COMPLETADA' && ruta.estado !== 'CANCELADA' && (
                    <TouchableOpacity
                        style={[styles.actionButton, actionLoading && styles.disabledButton]}
                        onPress={handleEstadoChange}
                        disabled={actionLoading}
                    >
                        {actionLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.actionButtonText}>
                                {ruta.estado === 'PENDIENTE' ? 'Iniciar Ruta' : 'Finalizar Ruta'}
                            </Text>
                        )}
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#092C4C',
    },
    loader: {
        flex: 1,
        backgroundColor: '#092C4C',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    backButton: {
        marginRight: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        padding: 16,
    },
    errorText: {
        color: 'white',
        textAlign: 'center',
        marginTop: 20,
    },
    infoCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        color: '#9BA1A6',
        fontSize: 14,
    },
    value: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 16,
    },
    entregaCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    entregaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderBadge: {
        backgroundColor: '#E67E50',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    orderText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    clientName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    addressText: {
        color: '#9BA1A6',
        fontSize: 14,
        flex: 1,
    },
    statusBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusTextSmall: {
        color: '#9BA1A6',
        fontSize: 10,
        fontWeight: 'bold',
    },
    actionButton: {
        backgroundColor: '#E67E50',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 40,
    },
    disabledButton: {
        opacity: 0.7,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    mapButton: {
        backgroundColor: 'rgba(230, 126, 80, 0.2)',
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 8,
        borderWidth: 1,
        borderColor: '#E67E50',
    },
    mapButtonText: {
        color: '#E67E50',
        fontSize: 16,
        fontWeight: '600',
    },
});
