import { WebColors } from '@/constants/theme';
import api from '@/services/api';
import { useAuth } from '@/store/authStore';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Camera, LogOut, Mail, Phone, Save, Settings as SettingsIcon, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const theme = WebColors.dark;

export default function SettingsScreen() {
    const { user, logout, updateUser } = useAuth();
    const router = useRouter();
    const [nombre, setNombre] = useState(user?.nombre || '');
    const [email, setEmail] = useState(user?.email || '');
    const [telefono, setTelefono] = useState(user?.telefono || '');
    const [isSaving, setIsSaving] = useState(false);
    const [image, setImage] = useState<string | null>(null);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Se necesita acceso a la galería para cambiar la foto.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!nombre || !email) {
            Alert.alert('Error', 'Nombre y Email son requeridos');
            return;
        }

        setIsSaving(true);
        try {
            await api.put('Usuarios/me', {
                nombre,
                telefono,
            });

            await updateUser({ nombre, telefono });
            Alert.alert('Éxito', 'Perfil actualizado correctamente');
        } catch (e: any) {
            console.error('Save failed', e);
            Alert.alert('Error', 'No se pudo actualizar el perfil');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={theme.background} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Mi Perfil</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatarWrapper}>
                        <LinearGradient
                            colors={[theme.primary, theme.primary]}
                            style={styles.avatar}
                        >
                            {image ? (
                                <Image source={{ uri: image }} style={styles.avatarImage} />
                            ) : (
                                <User color="white" size={48} />
                            )}
                        </LinearGradient>
                        <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                            <Camera color="white" size={18} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{user?.nombre || 'Usuario'}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{user?.rol || 'REPARTIDOR'}</Text>
                    </View>
                </View>

                <View style={styles.formSection}>
                    <Text style={styles.sectionLabel}>Información Personal</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nombre Completo</Text>
                        <View style={styles.inputWrapper}>
                            <User color={theme.primary} size={20} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                value={nombre}
                                onChangeText={setNombre}
                                placeholder="Tu nombre"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Correo Electrónico</Text>
                        <View style={[styles.inputWrapper, styles.disabledInput]}>
                            <Mail color={theme.textSecondary} size={20} style={styles.icon} />
                            <TextInput
                                style={[styles.input, styles.disabledText]}
                                value={email}
                                editable={false}
                                placeholder="tu@email.com"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Teléfono</Text>
                        <View style={styles.inputWrapper}>
                            <Phone color={theme.primary} size={20} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                value={telefono}
                                onChangeText={setTelefono}
                                placeholder="+34 600 000 000"
                                keyboardType="phone-pad"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, isSaving && styles.buttonDisabled]}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Save color="white" size={20} />
                                <Text style={styles.saveButtonText}>Guardar Perfil</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.dangerZone}>
                    <Text style={[styles.sectionLabel, { color: theme.danger }]}>Acciones de Cuenta</Text>
                    <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                        <LogOut color={theme.danger} size={20} />
                        <Text style={styles.logoutButtonText}>Cerrar Sesión Activa</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <SettingsIcon color={theme.cardBorder} size={40} />
                    <Text style={styles.footerText}>Moveo Logistics v2.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: theme.card,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.cardBorder,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: theme.text,
    },
    profileHeader: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 40,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 20,
    },
    avatar: {
        width: 110,
        height: 110,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    cameraButton: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        width: 38,
        height: 38,
        borderRadius: 15,
        backgroundColor: theme.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: theme.background,
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.text,
    },
    roleBadge: {
        backgroundColor: `${theme.primary}15`,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        marginTop: 8,
        borderWidth: 1,
        borderColor: `${theme.primary}20`,
    },
    roleText: {
        color: theme.primary,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    formSection: {
        paddingHorizontal: 24,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: theme.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: theme.text,
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
        opacity: 0.8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.card,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: theme.cardBorder,
        height: 56,
        paddingHorizontal: 16,
    },
    disabledInput: {
        opacity: 0.6,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    disabledText: {
        color: theme.textSecondary,
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: theme.text,
        fontSize: 16,
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: theme.primary,
        height: 56,
        borderRadius: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        gap: 12,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
    dangerZone: {
        marginTop: 40,
        paddingHorizontal: 24,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: `${theme.danger}20`,
        backgroundColor: `${theme.danger}05`,
        gap: 12,
    },
    logoutButtonText: {
        color: theme.danger,
        fontSize: 15,
        fontWeight: '700',
    },
    footer: {
        marginTop: 60,
        marginBottom: 40,
        alignItems: 'center',
        opacity: 0.5,
    },
    footerText: {
        color: theme.textSecondary,
        fontSize: 12,
        marginTop: 10,
        fontWeight: '600',
    },
});
