import api from '@/services/api';
import { useAuth } from '@/store/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, LogOut, Mail, Phone, Save, Settings as SettingsIcon, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const { user, logout, updateUser } = useAuth();
    const router = useRouter();
    const [nombre, setNombre] = useState(user?.nombre || '');
    const [email, setEmail] = useState(user?.email || '');
    const [telefono, setTelefono] = useState(user?.telefono || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!nombre || !email) {
            Alert.alert('Error', 'Nombre y Email son requeridos');
            return;
        }

        setIsSaving(true);
        try {
            // Updated to use the api service
            await api.put('/Usuarios/me', {
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
            <StatusBar barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeft color="white" size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>Mi Perfil</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatarWrapper}>
                        <LinearGradient
                            colors={['#E67E50', '#D35400']}
                            style={styles.avatar}
                        >
                            <User color="white" size={48} />
                        </LinearGradient>
                        <TouchableOpacity style={styles.cameraButton}>
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
                            <User color="#E67E50" size={20} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                value={nombre}
                                onChangeText={setNombre}
                                placeholder="Tu nombre"
                                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Correo Electrónico</Text>
                        <View style={[styles.inputWrapper, styles.disabledInput]}>
                            <Mail color="rgba(255, 255, 255, 0.3)" size={20} style={styles.icon} />
                            <TextInput
                                style={[styles.input, styles.disabledText]}
                                value={email}
                                editable={false}
                                placeholder="tu@email.com"
                                placeholderTextColor="rgba(255, 255, 255, 0.2)"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Teléfono</Text>
                        <View style={styles.inputWrapper}>
                            <Phone color="#E67E50" size={20} style={styles.icon} />
                            <TextInput
                                style={styles.input}
                                value={telefono}
                                onChangeText={setTelefono}
                                placeholder="+34 600 000 000"
                                keyboardType="phone-pad"
                                placeholderTextColor="rgba(255, 255, 255, 0.3)"
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
                    <Text style={[styles.sectionLabel, { color: '#FF5252' }]}>Acciones de Cuenta</Text>
                    <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                        <LogOut color="#FF5252" size={20} />
                        <Text style={styles.logoutButtonText}>Cerrar Sesión Activa</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <SettingsIcon color="rgba(255, 255, 255, 0.1)" size={40} />
                    <Text style={styles.footerText}>Moveo Logistics v2.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#092C4C',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: 'white',
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
        shadowColor: '#E67E50',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    cameraButton: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        width: 38,
        height: 38,
        borderRadius: 15,
        backgroundColor: '#092C4C',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#092C4C',
    },
    userName: {
        fontSize: 24,
        fontWeight: '800',
        color: 'white',
    },
    roleBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        marginTop: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    roleText: {
        color: 'rgba(255, 255, 255, 0.5)',
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
        color: 'rgba(255, 255, 255, 0.4)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: 'white',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
        opacity: 0.8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        height: 56,
        paddingHorizontal: 16,
    },
    disabledInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderColor: 'transparent',
    },
    disabledText: {
        color: 'rgba(255, 255, 255, 0.3)',
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: '#E67E50',
        height: 56,
        borderRadius: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        gap: 12,
        shadowColor: '#E67E50',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
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
        borderColor: 'rgba(255, 82, 82, 0.2)',
        backgroundColor: 'rgba(255, 82, 82, 0.05)',
        gap: 12,
    },
    logoutButtonText: {
        color: '#FF5252',
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
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 12,
        marginTop: 10,
        fontWeight: '600',
    },
});
