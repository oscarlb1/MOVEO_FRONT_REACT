import { Notificacion, notificacionService } from '@/services/notificacionService';
import { BlurView } from 'expo-blur';
import { Bell, Check, Clock, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface NotificacionesModalProps {
    visible: boolean;
    onClose: () => void;
    onRefreshCount?: () => void;
}

export default function NotificacionesModal({ visible, onClose, onRefreshCount }: NotificacionesModalProps) {
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotificaciones = async () => {
        setLoading(true);
        try {
            const data = await notificacionService.getMisNotificaciones();
            // Sort by date descending
            const sortedData = data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
            setNotificaciones(sortedData);
        } catch (error) {
            console.error('Error fetching notifications', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (visible) {
            fetchNotificaciones();
        }
    }, [visible]);

    const handleMarcarLeida = async (id: number) => {
        try {
            await notificacionService.marcarComoLeida(id);
            setNotificaciones(prev =>
                prev.map(n => n.id === id ? { ...n, leido: true } : n)
            );
            onRefreshCount?.();
        } catch (error) {
            console.error('Error marking as read', error);
        }
    };

    const handleMarcarTodasLeidas = async () => {
        try {
            await notificacionService.marcarTodasComoLeidas();
            setNotificaciones(prev =>
                prev.map(n => ({ ...n, leido: true }))
            );
            onRefreshCount?.();
        } catch (error) {
            console.error('Error marking all as read', error);
        }
    };

    const handleEliminar = async (id: number) => {
        try {
            await notificacionService.eliminar(id);
            setNotificaciones(prev => prev.filter(n => n.id !== id));
            onRefreshCount?.();
        } catch (error) {
            console.error('Error deleting notification', error);
        }
    };

    const formatFecha = (fechaStr: string) => {
        const fecha = new Date(fechaStr);
        const hoy = new Date();
        const esHoy = fecha.toDateString() === hoy.toDateString();

        if (esHoy) {
            return `Hoy, ${fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }

        return fecha.toLocaleDateString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const renderItem = ({ item }: { item: Notificacion }) => (
        <View style={[styles.notificacionCard, !item.leido && styles.unreadCard]}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, !item.leido ? styles.unreadIconBox : styles.readIconBox]}>
                    <Bell size={18} color={!item.leido ? '#E67E50' : '#rgba(255, 255, 255, 0.4)'} />
                </View>
                <View style={styles.titleContainer}>
                    <Text style={[styles.titulo, !item.leido && styles.unreadText]}>{item.titulo}</Text>
                    <View style={styles.dateContainer}>
                        <Clock size={12} color="rgba(255, 255, 255, 0.3)" />
                        <Text style={styles.fecha}>{formatFecha(item.fecha)}</Text>
                    </View>
                </View>
                {!item.leido && (
                    <TouchableOpacity
                        style={styles.markReadButton}
                        onPress={() => handleMarcarLeida(item.id)}
                        accessibilityLabel="Marcar como leída"
                    >
                        <Check size={16} color="#E67E50" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleEliminar(item.id)}
                >
                    <Trash2 size={16} color="rgba(255, 82, 82, 0.5)" />
                </TouchableOpacity>
            </View>
            <Text style={styles.mensaje}>{item.mensaje}</Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <BlurView intensity={30} tint="dark" style={styles.modalOverlay}>
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.headerTitle}>Notificaciones</Text>
                                <Text style={styles.headerSubtitle}>
                                    {notificaciones.filter(n => !n.leido).length} pendientes
                                </Text>
                            </View>
                            <View style={styles.headerActions}>
                                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                                    <X color="white" size={24} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Subheader with Mark All Action */}
                        <View style={styles.subHeader}>
                            <Text style={styles.headerSubtitle}>
                                {notificaciones.filter(n => !n.leido).length} pendientes
                            </Text>
                            {notificaciones.some(n => !n.leido) && (
                                <TouchableOpacity
                                    style={styles.markAllButton}
                                    onPress={handleMarcarTodasLeidas}
                                >
                                    <Text style={styles.markAllText}>Marcar todo como leído</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* List */}
                        {loading ? (
                            <View style={styles.centerContainer}>
                                <ActivityIndicator size="large" color="#E67E50" />
                            </View>
                        ) : notificaciones.length > 0 ? (
                            <FlatList
                                data={notificaciones}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={renderItem}
                                contentContainerStyle={styles.listContent}
                                showsVerticalScrollIndicator={false}
                            />
                        ) : (
                            <View style={styles.centerContainer}>
                                <View style={styles.emptyIconBox}>
                                    <Bell size={40} color="rgba(255, 255, 255, 0.1)" />
                                </View>
                                <Text style={styles.emptyTitle}>Sin novedades</Text>
                                <Text style={styles.emptySubtitle}>Te avisaremos cuando haya algo nuevo para ti.</Text>
                            </View>
                        )}
                    </View>
                </SafeAreaView>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
    },
    modalContainer: {
        flex: 1,
    },
    modalContent: {
        flex: 1,
        backgroundColor: '#092C4C',
        marginTop: 20,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: 'white',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.4)',
        marginTop: 2,
        fontWeight: '500',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    subHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    markAllButton: {
        backgroundColor: 'rgba(230, 126, 80, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(230, 126, 80, 0.2)',
    },
    markAllText: {
        color: '#E67E50',
        fontSize: 12,
        fontWeight: '700',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 40,
    },
    notificacionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    unreadCard: {
        backgroundColor: 'rgba(230, 126, 80, 0.04)',
        borderColor: 'rgba(230, 126, 80, 0.2)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    unreadIconBox: {
        backgroundColor: 'rgba(230, 126, 80, 0.15)',
    },
    readIconBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    titleContainer: {
        flex: 1,
    },
    titulo: {
        fontSize: 15,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.7)',
    },
    unreadText: {
        color: 'white',
        fontWeight: '700',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    fecha: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.3)',
    },
    markReadButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(230, 126, 80, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    deleteButton: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 82, 82, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    mensaje: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
        lineHeight: 20,
        marginLeft: 48,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    emptyIconBox: {
        width: 80,
        height: 80,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.3)',
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
