import { entregaService } from '@/services/entregaService';
import { useAlert } from '@/store/alertStore';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ScannerModalProps {
    visible: boolean;
    onClose: () => void;
    entregaId: number;
    expectedQr?: string;
    onSuccess: () => void;
}

const COLORS = {
    primary: '#E67E50',
    background: 'rgba(0,0,0,0.9)',
};

export default function ScannerModal({ visible, onClose, entregaId, expectedQr, onSuccess }: ScannerModalProps) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [validating, setValidating] = useState(false);
    const isProcessing = useRef(false);
    const { showAlert } = useAlert();

    // Request permissions dynamically if modal opens and they aren't granted
    React.useEffect(() => {
        if (visible) {
            // Reset state for new scan
            setScanned(false);
            setValidating(false);
            isProcessing.current = false;

            if (!permission || !permission.granted) {
                requestPermission();
            }
        }
    }, [visible]);

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (isProcessing.current) return;
        isProcessing.current = true;
        setScanned(true);
        setValidating(true);

        try {
            const result = await entregaService.validarQrEntrega(entregaId, data);
            console.log("RESPUESTA DEL SERVIDOR:", result);
            if (result.success) {
                // Cerramos primero el modal del escáner
                onClose();
                
                // Damos un breve respiro para que termine la animación de cierre
                // antes de mostrar la alerta, que a su vez es otro Modal.
                setTimeout(() => {
                    showAlert('¡Éxito!', result.message || 'Paquete validado correctamente.', 'success', () => {
                        onSuccess();
                    });
                }, 400);
            } else {
                showAlert('Error', result.message || 'El código QR es incorrecto o no pertenece a esta entrega.', 'error', () => {
                    setScanned(false);
                    isProcessing.current = false;
                });
            }
        } catch (error) {
            showAlert('Error', 'No se pudo conectar con el servicio de validación.', 'error', () => {
                setScanned(false);
                isProcessing.current = false;
            });
        } finally {
            setValidating(false);
        }
    };

    const handleClose = () => {
        setScanned(false);
        isProcessing.current = false;
        onClose();
    };

    if (!permission) {
        return null;
    }

    if (!permission.granted && visible) {
        return (
            <Modal visible={visible} animationType="fade" onRequestClose={handleClose}>
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={styles.text}>Se necesita permiso de cámara para escanear.</Text>
                    <TouchableOpacity style={styles.btn} onPress={requestPermission}>
                        <Text style={styles.btnText}>Conceder Permiso</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btn, { marginTop: 20, backgroundColor: 'transparent' }]} onPress={handleClose}>
                        <Text style={styles.btnText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="fade" onRequestClose={handleClose}>
            <View style={styles.container}>
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr"],
                    }}
                />

                <View style={styles.overlay} pointerEvents="none">
                    <Text style={styles.title}>Escanea el código del paquete</Text>
                    <View style={styles.qrFrame}>
                        <View style={styles.scanLine} />
                    </View>

                    {validating ? (
                        <View style={styles.statusBox}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text style={styles.statusText}>Validando paquete...</Text>
                        </View>
                    ) : (
                        <View style={styles.hintBox}>
                            <Text style={styles.hintText}>
                                Esperando código: {expectedQr || '...'}
                            </Text>
                        </View>
                    )}
                </View>

                <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                    <X size={32} color="white" />
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        color: 'white',
        fontSize: 18,
        marginBottom: 30,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        fontWeight: '700',
    },
    qrFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderRadius: 24,
        backgroundColor: 'rgba(230, 126, 80, 0.1)',
        overflow: 'hidden',
    },
    scanLine: {
        height: 2,
        backgroundColor: COLORS.primary,
        width: '100%',
        position: 'absolute',
        top: '50%',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    statusBox: {
        marginTop: 30,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 20,
        borderRadius: 16,
    },
    statusText: {
        color: 'white',
        marginTop: 12,
        fontWeight: '600',
    },
    hintBox: {
        marginTop: 30,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    hintText: {
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: 14,
    },
    closeBtn: {
        position: 'absolute',
        top: 50,
        right: 25,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 25,
    },
    text: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        paddingHorizontal: 40,
    },
    btn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 12,
    },
    btnText: {
        color: 'white',
        fontWeight: '700',
    },
});
