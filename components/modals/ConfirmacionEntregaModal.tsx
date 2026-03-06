import { useAlert } from '@/store/alertStore';
import { BlurView } from 'expo-blur';
import { Check, MapPin, Trash2, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import SignatureCanvas from 'react-native-signature-canvas';

interface ConfirmacionEntregaModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (signature: string) => Promise<void>;
    clienteCoords?: { latitud?: number; longitud?: number };
    userCoords: { latitude: number; longitude: number } | null;
}

export default function ConfirmacionEntregaModal({
    visible,
    onClose,
    onConfirm,
    clienteCoords,
    userCoords,
}: ConfirmacionEntregaModalProps) {
    const signatureRef = useRef<any>(null);
    const [loading, setLoading] = useState(false);
    const { showAlert } = useAlert();
    const [signatureCaptured, setSignatureCaptured] = useState(false);

    const handleConfirm = async (signature: string) => {
        setLoading(true);
        try {
            await onConfirm(signature);
            onClose();
        } catch (error) {
            showAlert('Error', 'No se pudo guardar la entrega', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        signatureRef.current?.clearSignature();
        setSignatureCaptured(false);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                <View style={styles.modalContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Confirmar Entrega</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X color="white" size={20} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <View style={styles.mapBox}>
                            <MapView
                                provider={PROVIDER_GOOGLE}
                                style={styles.map}
                                initialRegion={{
                                    latitude: clienteCoords?.latitud || userCoords?.latitude || 40.4168,
                                    longitude: clienteCoords?.longitud || userCoords?.longitude || -3.7038,
                                    latitudeDelta: 0.005,
                                    longitudeDelta: 0.005,
                                }}
                            >
                                {clienteCoords?.latitud !== undefined && clienteCoords?.longitud !== undefined && (
                                    <Marker
                                        coordinate={{ latitude: clienteCoords.latitud, longitude: clienteCoords.longitud }}
                                        title="Punto de Entrega"
                                        pinColor="#E67E50"
                                    />
                                )}
                                {userCoords && (
                                    <Marker
                                        coordinate={{ latitude: userCoords.latitude, longitude: userCoords.longitude }}
                                        title="Tu Ubicación"
                                        pinColor="#3498db"
                                    />
                                )}
                            </MapView>
                        </View>

                        <View style={styles.proximityStatus}>
                            <MapPin size={16} color={userCoords ? '#10B981' : '#EF4444'} />
                            <Text style={styles.statusText}>
                                {userCoords ? 'Ubicación registrada' : 'Buscando GPS...'}
                            </Text>
                        </View>

                        <Text style={styles.label}>Firma del Cliente</Text>
                        <View style={styles.signatureBox}>
                            <SignatureCanvas
                                ref={signatureRef}
                                onEnd={() => setSignatureCaptured(true)}
                                onOK={handleConfirm}
                                descriptionText="Firme aquí"
                                clearText="Limpiar"
                                confirmText="Confirmar"
                                webStyle={`.m-signature-pad--footer {display: none; margin: 0;}`}
                                autoClear={false}
                            />
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                                <Trash2 color="rgba(255, 255, 255, 0.4)" size={18} />
                                <Text style={styles.clearBtnText}>Limpiar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.confirmBtn, (!signatureCaptured || loading) && styles.disabledBtn]}
                                onPress={() => signatureRef.current?.readSignature()}
                                disabled={!signatureCaptured || loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <>
                                        <Check color="white" size={18} />
                                        <Text style={styles.confirmBtnText}>Finalizar Entrega</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContainer: {
        width: '100%',
        backgroundColor: '#0F3456',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: 'white',
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        padding: 20,
    },
    proximityStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        marginTop: -10, // Adjust to overlap slightly or stick to map
    },
    mapBox: {
        height: 150,
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    statusText: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 13,
        fontWeight: '600',
    },
    label: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 12,
    },
    signatureBox: {
        height: 250,
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
    },
    actions: {
        flexDirection: 'row',
        marginTop: 24,
        gap: 12,
    },
    clearBtn: {
        flex: 1,
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    clearBtnText: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontWeight: '700',
    },
    confirmBtn: {
        flex: 2,
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 16,
        backgroundColor: '#E67E50',
    },
    confirmBtnText: {
        color: 'white',
        fontWeight: '800',
    },
    disabledBtn: {
        opacity: 0.5,
    },
});
