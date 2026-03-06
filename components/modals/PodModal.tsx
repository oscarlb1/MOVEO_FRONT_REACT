import { Camera, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SignatureScreen from 'react-native-signature-canvas';

const COLORS = {
    background: '#0d1d35',
    card: '#1e2d3d',
    cardBorder: 'rgba(255,255,255,0.1)',
    primary: '#E67E50',
    primaryDark: '#d66d42',
    text: '#FFFFFF',
    textSecondary: '#9ca3af',
    success: '#22c55e',
    warning: '#eab308',
    danger: '#ef4444',
    info: '#3b82f6',
    accent: '#4FD1C5',
};

interface PodModalProps {
    visible: boolean;
    onClose: () => void;
    onComplete: (signature: string | null, notes: string) => void;
}

export default function PodModal({ visible, onClose, onComplete }: PodModalProps) {
    const signatureRef = useRef<any>(null);
    const [signature, setSignature] = useState<string | null>(null);
    const [podNotes, setPodNotes] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);

    // Reiniciar el modal cada vez que se abre
    useEffect(() => {
        if (visible) {
            setSignature(null);
            setPodNotes('');
            setIsInputFocused(false);
            if (signatureRef.current) signatureRef.current.clearSignature();
        }
    }, [visible]);

    const handleSignatureOK = (signatureBg: string) => {
        setSignature(signatureBg);
    };

    const handleConfirm = () => {
        onComplete(signature, podNotes);
    };

    const handleClose = () => {
        setSignature(null);
        setPodNotes('');
        setIsInputFocused(false);
        if (signatureRef.current) signatureRef.current.clearSignature();
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
            <SafeAreaView style={styles.fullScreenModal}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={handleClose}
                    >
                        <X size={24} color="white" />
                    </TouchableOpacity>

                    <ScrollView
                        contentContainerStyle={{ padding: 24, paddingTop: 15, flexGrow: 1 }}
                        scrollEnabled={isInputFocused}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={styles.sectionHeader}>Firma del Cliente</Text>
                        <View style={styles.signatureContainer}>
                            <SignatureScreen
                                ref={signatureRef}
                                onOK={handleSignatureOK}
                                webStyle={`.m-signature-pad--footer {display: none; margin: 0px;}`}
                                autoClear={false}
                                imageType="image/png"
                            />
                            {/* Overlay button to clear manually if standard UI hidden */}
                            <TouchableOpacity
                                style={styles.clearSignatureBtn}
                                onPress={() => signatureRef.current?.clearSignature()}
                            >
                                <Text style={styles.clearSignatureText}>Limpiar</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.sectionHeader}>Foto (Opcional)</Text>
                        <TouchableOpacity
                            style={styles.photoUploadBtn}
                            onPress={() => Alert.alert('Foto', 'Función decorativa por ahora. En futuras versiones se abrirá la cámara aquí.')}
                        >
                            <Camera size={24} color={COLORS.textSecondary} />
                            <Text style={styles.photoText}>Tomar Foto del Paquete</Text>
                        </TouchableOpacity>

                        <Text style={styles.sectionHeader}>Notas</Text>
                        <TextInput
                            style={styles.textArea}
                            multiline
                            numberOfLines={4}
                            placeholder="Ej: Entregado en portería..."
                            placeholderTextColor={COLORS.textSecondary}
                            value={podNotes}
                            onChangeText={setPodNotes}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                        />

                        <TouchableOpacity style={[styles.btnPrimary, { marginTop: 32 }]} onPress={handleConfirm}>
                            <Text style={styles.btnPrimaryText}>Confirmar Entrega</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    fullScreenModal: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    closeBtn: {
        position: 'absolute',
        top: 5,
        right: 20,
        zIndex: 10,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginBottom: 12,
        marginTop: 24,
    },
    signatureContainer: {
        backgroundColor: 'white',
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        position: 'relative',
    },
    clearSignatureBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        zIndex: 10,
    },
    clearSignatureText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    photoUploadBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        borderStyle: 'dashed',
        borderRadius: 16,
        padding: 24,
        gap: 12,
    },
    photoText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    textArea: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 16,
        color: 'white',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        minHeight: 120,
        textAlignVertical: 'top',
        fontSize: 15,
    },
    btnPrimary: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    btnPrimaryText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
