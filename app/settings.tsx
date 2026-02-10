import { useAuth } from '@/store/authStore';
import axios from 'axios';
import { LogOut, Mail, Phone, Save, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const API_URL = 'http://10.0.2.2:5079/api';

export default function SettingsScreen() {
    const { user, logout, updateUser } = useAuth();
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
            // API call to update own profile
            await axios.put(`${API_URL}/Usuarios/me`, {
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
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                    <User color="white" size={40} />
                </View>
                <Text style={styles.userName}>{user?.nombre}</Text>
                <Text style={styles.userRole}>{user?.rol}</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nombre Completo</Text>
                    <View style={styles.inputWrapper}>
                        <User color="#9BA1A6" size={20} style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            value={nombre}
                            onChangeText={setNombre}
                            placeholder="Tu nombre"
                            placeholderTextColor="#9BA1A6"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Correo Electrónico</Text>
                    <View style={[styles.inputWrapper, styles.inputDisabled]}>
                        <Mail color="#666" size={20} style={styles.icon} />
                        <TextInput
                            style={[styles.input, { color: '#666' }]}
                            value={email}
                            editable={false}
                            placeholder="tu@email.com"
                            keyboardType="email-address"
                            placeholderTextColor="#666"
                        />
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Teléfono</Text>
                    <View style={styles.inputWrapper}>
                        <Phone color="#9BA1A6" size={20} style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            value={telefono}
                            onChangeText={setTelefono}
                            placeholder="+34 600 000 000"
                            keyboardType="phone-pad"
                            placeholderTextColor="#9BA1A6"
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
                            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <LogOut color="#FF4444" size={20} />
                    <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#092C4C',
    },
    content: {
        padding: 24,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#E67E50',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: 'white',
    },
    userRole: {
        fontSize: 14,
        color: '#9BA1A6',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        height: 56,
        paddingHorizontal: 16,
    },
    inputDisabled: {
        opacity: 0.5,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: '#E67E50',
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        gap: 10,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: 10,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF4444',
        gap: 10,
    },
    logoutButtonText: {
        color: '#FF4444',
        fontSize: 16,
        fontWeight: '600',
    },
});
