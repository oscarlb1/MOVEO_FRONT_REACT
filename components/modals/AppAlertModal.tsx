import { WebColors } from '@/constants/theme';
import { useAlert } from '@/store/alertStore';
import { BlurView } from 'expo-blur';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react-native';
import React from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const theme = WebColors.dark;

const COLORS = {
    success: '#22c55e',
    error: '#ef4444',
    warning: '#eab308',
    info: '#3b82f6',
    primary: '#E67E50',
};

export default function AppAlertModal() {
    const { alert, hideAlert } = useAlert();

    if (!alert.visible) return null;

    const getIcon = () => {
        switch (alert.type) {
            case 'success': return <CheckCircle size={32} color={COLORS.success} />;
            case 'error': return <AlertCircle size={32} color={COLORS.error} />;
            case 'warning': return <AlertTriangle size={32} color={COLORS.warning} />;
            default: return <Info size={32} color={COLORS.info} />;
        }
    };

    const getBtnColor = () => {
        switch (alert.type) {
            case 'success': return COLORS.success;
            case 'error': return COLORS.error;
            case 'warning': return COLORS.warning;
            default: return COLORS.primary;
        }
    };

    const handleConfirm = () => {
        if (alert.onConfirm) {
            alert.onConfirm();
        }
        hideAlert();
    };

    return (
        <Modal
            visible={alert.visible}
            transparent
            animationType="fade"
            onRequestClose={hideAlert}
        >
            <View style={styles.overlay}>
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

                <View style={styles.card}>
                    <TouchableOpacity style={styles.closeBtn} onPress={hideAlert}>
                        <X size={20} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>

                    <View style={[styles.iconContainer, { backgroundColor: `${getBtnColor()}20` }]}>
                        {getIcon()}
                    </View>

                    <Text style={styles.title}>{alert.title}</Text>
                    <Text style={styles.message}>{alert.message}</Text>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: getBtnColor() }]}
                        onPress={handleConfirm}
                    >
                        <Text style={styles.buttonText}>Entendido</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#1e2d3d',
        borderRadius: 28,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 8,
    },
    message: {
        fontSize: 15,
        color: '#9ca3af',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    button: {
        width: '100%',
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
