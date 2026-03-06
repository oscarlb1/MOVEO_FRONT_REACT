import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, Send, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

interface IncidenciasModalProps {
    visible: boolean;
    onClose: () => void;
    onSend: (message: string) => Promise<void>;
}

const COLORS = {
    background: '#0d1d35',
    card: '#1e2d3d',
    cardBorder: 'rgba(255,255,255,0.1)',
    primary: '#E67E50',
    text: '#FFFFFF',
    textSecondary: '#9ca3af',
    danger: '#ef4444',
};

const IncidenciasModal: React.FC<IncidenciasModalProps> = ({ visible, onClose, onSend }) => {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!message.trim() || isSending) return;

        setIsSending(true);
        try {
            await onSend(message);
            setMessage('');
            onClose();
        } catch (error) {
            console.error('Error sending incidence:', error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardView}
                    >
                        <View style={styles.container}>
                            <LinearGradient
                                colors={['#1e2d3d', '#111b27']}
                                style={styles.card}
                            >
                                <View style={styles.header}>
                                    <View style={styles.iconContainer}>
                                        <AlertCircle size={24} color={COLORS.danger} />
                                    </View>
                                    <View style={styles.headerText}>
                                        <Text style={styles.title}>Reportar Incidencia</Text>
                                        <Text style={styles.subtitle}>Avisa al centro de control de cualquier emergencia o retraso.</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={onClose}
                                        activeOpacity={0.7}
                                    >
                                        <X size={20} color={COLORS.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.textArea}
                                        multiline
                                        numberOfLines={4}
                                        placeholder="Describe brevemente lo ocurrido..."
                                        placeholderTextColor={COLORS.textSecondary}
                                        value={message}
                                        onChangeText={setMessage}
                                        textAlignVertical="top"
                                    />
                                </View>

                                <View style={styles.footer}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={onClose}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.cancelText}>Cancelar</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.sendButton,
                                            (!message.trim() || isSending) && styles.sendButtonDisabled
                                        ]}
                                        onPress={handleSend}
                                        disabled={!message.trim() || isSending}
                                        activeOpacity={0.8}
                                    >
                                        {isSending ? (
                                            <ActivityIndicator size="small" color="white" />
                                        ) : (
                                            <>
                                                <Text style={styles.sendText}>Enviar Aviso</Text>
                                                <Send size={16} color="white" />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </LinearGradient>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 20,
    },
    keyboardView: {
        width: '100%',
        alignItems: 'center',
    },
    container: {
        width: '100%',
        maxWidth: 400,
    },
    card: {
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    closeButton: {
        padding: 4,
    },
    inputWrapper: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        marginBottom: 24,
        overflow: 'hidden',
    },
    textArea: {
        padding: 16,
        color: 'white',
        fontSize: 15,
        height: 120,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cancelButton: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 14,
    },
    cancelText: {
        color: COLORS.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
    sendButton: {
        flex: 1,
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
    },
    sendButtonDisabled: {
        opacity: 0.5,
        backgroundColor: COLORS.card,
    },
    sendText: {
        color: 'white',
        fontSize: 15,
        fontWeight: 'bold',
    },
});

export default IncidenciasModal;
