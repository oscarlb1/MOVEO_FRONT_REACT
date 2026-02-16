import { WebColors } from '@/constants/theme';
import { entregaService } from '@/services/entregaService';
import { Entrega } from '@/services/rutaService';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Camera, Check, MapPin, Phone, Truck, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const theme = WebColors.dark;

export default function DetalleEntregaScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [entrega, setEntrega] = useState<Entrega | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [fotoUri, setFotoUri] = useState<string | null>(null);

    const deliveryId = typeof id === 'string' ? parseInt(id, 10) : 0;

    useEffect(() => {
        fetchEntrega();
    }, [id]);

    const fetchEntrega = async () => {
        if (!deliveryId) return;
        try {
            setLoading(true);
            const data = await entregaService.getEntregaById(deliveryId);
            setEntrega(data);
            setSelectedStatus(data.estado);
        } catch (error) {
            console.error('Error fetching delivery details', error);
            Alert.alert('Error', 'No se pudo cargar la entrega');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenMaps = () => {
        if (!entrega) return;
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entrega.cliente.direccion)}`;
        Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo abrir el mapa'));
    };

    const handleCall = () => {
        if (!entrega) return;
        const url = `tel:${entrega.cliente.telefono}`;
        Linking.openURL(url).catch(() => Alert.alert('Error', 'No se pudo realizar la llamada'));
    };

    const takePhoto = async () => {
        // Request permission
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert('Permiso denegado', 'Se requiere permiso para usar la cámara');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setFotoUri(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!selectedStatus) {
            Alert.alert('Falta estado', 'Por favor selecciona un estado para la entrega');
            return;
        }

        // Confirmation before logic
        if (selectedStatus === entrega?.estado && !fotoUri) {
            Alert.alert('Sin cambios', 'El estado es el mismo y no has añadido foto.');
            return;
        }

        try {
            setSubmitting(true);

            // NOTE: Here we would typically upload the image first to get a URL
            // For this MVP, we are sending the local URI or just status if no upload endpoint exists.
            // Assuming we just send status for now, or the backend treats FotoUrl as optional.

            await entregaService.updateEstadoEntrega(deliveryId, {
                Estado: selectedStatus,
                FotoUrl: fotoUri || undefined,
                // FirmaDigitalUrl: ... (Signature not implemented yet per minimalism preference)
            });

            Alert.alert('Éxito', 'Entrega actualizada correctamente', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Error updating delivery', error);
            Alert.alert('Error', 'No se pudo actualizar la entrega');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!entrega) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: 'white' }}>Entrega no encontrada</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={theme.background} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>Detalle Entrega #{entrega.id}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Status Selection */}
                <Text style={styles.sectionTitle}>Estado</Text>
                <View style={styles.statusButtonsRow}>
                    {['ENTREGADO', 'AUSENTE', 'RECHAZADO'].map((status) => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.statusButton,
                                selectedStatus === status && styles.statusButtonActive,
                                selectedStatus === status && status === 'ENTREGADO' && { backgroundColor: theme.success },
                                selectedStatus === status && status === 'AUSENTE' && { backgroundColor: theme.warning },
                                selectedStatus === status && status === 'RECHAZADO' && { backgroundColor: theme.danger },
                            ]}
                            onPress={() => setSelectedStatus(status)}
                        >
                            <Text style={[
                                styles.statusButtonText,
                                selectedStatus === status && styles.statusButtonTextActive
                            ]}>
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Customer Info Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Truck color={theme.primary} size={20} />
                        <Text style={styles.cardTitle}>Información del Cliente</Text>
                    </View>

                    <Text style={styles.label}>Nombre / Empresa</Text>
                    <Text style={styles.value}>{entrega.cliente.nombreEmpresa}</Text>

                    <Text style={styles.label}>Dirección</Text>
                    <View style={styles.actionRow}>
                        <Text style={[styles.value, { flex: 1 }]}>{entrega.cliente.direccion}</Text>
                        <TouchableOpacity style={styles.iconButton} onPress={handleOpenMaps}>
                            <MapPin color={theme.primary} size={20} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Teléfono</Text>
                    <View style={styles.actionRow}>
                        <Text style={[styles.value, { flex: 1 }]}>{entrega.cliente.telefono}</Text>
                        <TouchableOpacity style={styles.iconButton} onPress={handleCall}>
                            <Phone color={theme.primary} size={20} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Proof of Delivery */}
                <Text style={styles.sectionTitle}>Prueba de Entrega (Opcional)</Text>

                <View style={styles.proofContainer}>
                    <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                        <Camera color={fotoUri ? 'white' : theme.textSecondary} size={24} />
                        <Text style={[styles.photoText, fotoUri && { color: 'white' }]}>
                            {fotoUri ? 'Cambiar Foto' : 'Tomar Foto'}
                        </Text>
                    </TouchableOpacity>

                    {fotoUri && (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: fotoUri }} style={styles.imagePreview} />
                            <TouchableOpacity
                                style={styles.removeImageButton}
                                onPress={() => setFotoUri(null)}
                            >
                                <X color="white" size={16} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Check color="white" size={20} style={{ marginRight: 8 }} />
                            <Text style={styles.submitButtonText}>Confirmar Entrega</Text>
                        </>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: theme.cardBorder,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.textSecondary,
        marginTop: 20,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: theme.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        marginBottom: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 10,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
    label: {
        fontSize: 12,
        color: theme.textSecondary,
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: theme.text,
        marginBottom: 16,
        fontWeight: '500',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: `${theme.primary}20`,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusButtonsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    statusButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        alignItems: 'center',
    },
    statusButtonActive: {
        borderColor: 'transparent',
    },
    statusButtonText: {
        color: theme.textSecondary,
        fontWeight: '600',
        fontSize: 12,
    },
    statusButtonTextActive: {
        color: 'white',
        fontWeight: '800',
    },
    proofContainer: {
        flexDirection: 'row',
        gap: 15,
        alignItems: 'center',
        marginBottom: 30,
    },
    photoButton: {
        flex: 1,
        height: 100,
        backgroundColor: theme.card,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: theme.cardBorder,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    photoText: {
        color: theme.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    imagePreviewContainer: {
        width: 100,
        height: 100,
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 16,
    },
    removeImageButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: theme.danger,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.background,
    },
    submitButton: {
        backgroundColor: theme.primary,
        paddingVertical: 16,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
        marginTop: 10,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
});
