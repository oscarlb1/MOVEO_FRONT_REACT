import api from '@/services/api';
import { useAlert } from '@/store/alertStore';
import { useAuth } from '@/store/authStore';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Camera, ChevronRight, Mail, Phone, Save, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Colores específicos del nuevo diseño
const COLORS = {
    background: '#0d1d35', // Fondo general oscuro
    headerStart: '#092C4C',
    headerMid: '#0d1d35',
    headerEnd: '#092C4C',
    accent: '#E67E50', // Naranja Moveo
    inputBg: '#0d1d35',
    inputBorder: '#2a3f54',
    text: '#FFFFFF',
    textSecondary: '#9ca3af', // Gray-400
    danger: '#ef4444',
};

export default function SettingsScreen() {
    const { user, logout, updateUser } = useAuth();
    const router = useRouter();
    const [nombre, setNombre] = useState(user?.nombre || '');
    const [email, setEmail] = useState(user?.email || '');
    const [telefono, setTelefono] = useState(user?.telefono || '');
    const [isSaving, setIsSaving] = useState(false);
    const [image, setImage] = useState<string | null>(null); // solo para fotos nuevas de la galería
    const { showAlert } = useAlert();

    // Cargar imagen real del backend al abrir la pantalla
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('Usuarios/me');
                const data = res.data;
                if (data.imagenUrl) {
                    setImage(data.imagenUrl);
                }
                if (data.nombre) setNombre(data.nombre);
                if (data.telefono) setTelefono(data.telefono);
                if (data.email) setEmail(data.email);
            } catch (e) {
                console.log('Error fetching profile:', e);
            }
        };
        fetchProfile();
    }, []);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showAlert('Permiso denegado', 'Se necesita acceso a la galería para cambiar la foto.', 'warning');
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
        if (!nombre) {
            showAlert('Error', 'El nombre es requerido', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('Nombre', nombre);
            formData.append('Telefono', telefono);

            if (image && !image.startsWith('http')) {
                const filename = image.split('/').pop() || 'avatar.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;

                formData.append('Imagen', {
                    uri: image,
                    name: filename,
                    type,
                } as any);
            }

            const res = await api.put('Usuarios/me', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            await updateUser({ nombre, telefono, imagenUrl: res.data.imagenUrl });
            showAlert('Éxito', 'Perfil actualizado correctamente', 'success');
        } catch (e: any) {
            console.error('Save failed', e);
            showAlert('Error', 'No se pudo actualizar el perfil', 'error');
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.headerStart} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Header Section */}
                <LinearGradient
                    colors={[COLORS.headerStart, COLORS.headerMid, COLORS.headerEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.header}
                >
                    <SafeAreaView edges={['top']}>

                        <View style={styles.profileInfo}>
                            {/* Avatar */}
                            <View style={styles.avatarContainer}>
                                <View style={styles.avatarFrame}>
                                    {(image || user?.imagenUrl) ? (
                                        <Image source={{ uri: image || user?.imagenUrl || '' }} style={styles.avatarImage} />
                                    ) : (
                                        <User color="white" size={64} />
                                    )}
                                </View>
                                <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                                    <Camera color="white" size={20} />
                                </TouchableOpacity>
                            </View>

                            {/* Name Badge */}
                            <View style={styles.nameBadge}>
                                <Text style={styles.nameText}>
                                    {(nombre || 'Usuario').split(' ')[0].toLowerCase()}
                                </Text>
                            </View>

                            <Text style={styles.roleText}>{user?.rol || 'REPARTIDOR'}</Text>
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                {/* Content Section */}
                <View style={styles.content}>

                    {/* Personal Info */}
                    <Text style={styles.sectionTitle}>INFORMACIÓN PERSONAL</Text>

                    {/* Nombre Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nombre Completo</Text>
                        <View style={styles.inputContainer}>
                            <User color={COLORS.accent} size={20} />
                            <TextInput
                                style={styles.input}
                                value={nombre}
                                onChangeText={setNombre}
                                placeholder="Ingresa tu nombre completo"
                                placeholderTextColor="#6b7280"
                            />
                        </View>
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Correo Electrónico</Text>
                        <View style={styles.inputContainer}>
                            <Mail color={COLORS.accent} size={20} />
                            <TextInput
                                style={styles.input}
                                value={email}
                                editable={false} // Email suele ser inmutable o requiere proceso aparte
                                placeholder="correo@ejemplo.com"
                                placeholderTextColor="#6b7280"
                            />
                        </View>
                    </View>

                    {/* Teléfono Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Teléfono</Text>
                        <View style={styles.inputContainer}>
                            <Phone color={COLORS.accent} size={20} />
                            <TextInput
                                style={styles.input}
                                value={telefono}
                                onChangeText={setTelefono}
                                placeholder="600000011"
                                keyboardType="phone-pad"
                                placeholderTextColor="#6b7280"
                            />
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={[styles.saveButton, isSaving && styles.disabledButton]}
                        onPress={handleSave}
                        disabled={isSaving}
                        activeOpacity={0.9}
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

                    {/* Security Section */}
                    <Text style={[styles.sectionTitle, { marginTop: 32 }]}>SEGURIDAD</Text>

                    <TouchableOpacity style={styles.securityButton}>
                        <Text style={styles.securityButtonText}>Cambiar Contraseña</Text>
                        <ChevronRight color="#6b7280" size={20} />
                    </TouchableOpacity>

                    {/* Logout Button */}
                    <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
                        <Text style={styles.logoutText}>Cerrar Sesión</Text>
                    </TouchableOpacity>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Moveo Driver v2.1.0</Text>
                        <Text style={styles.footerSubText}>© 2026 Moveo Logistics</Text>
                    </View>

                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background, // Usar el fondo oscuro general
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 32,
        paddingTop: 10,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        alignSelf: 'flex-start',
    },
    backText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginLeft: 8,
    },
    profileInfo: {
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 24,
    },
    avatarFrame: {
        width: 128,
        height: 128,
        borderRadius: 32, // Rounded-[2rem] approx
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 32,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: COLORS.headerStart,
        borderWidth: 2,
        borderColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    nameBadge: {
        backgroundColor: '#0a1628',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2a3f54',
        marginBottom: 8,
    },
    nameText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    roleText: {
        color: COLORS.accent,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    content: {
        paddingHorizontal: 24,
        marginTop: 24,
    },
    sectionTitle: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBg,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        borderRadius: 12, // rounded-xl
        paddingHorizontal: 16,
        height: 56,
        gap: 12,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: COLORS.accent,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 24,
        gap: 8,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    disabledButton: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    securityButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.inputBg,
        borderWidth: 1,
        borderColor: COLORS.inputBorder,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    securityButtonText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '500',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e2d3d',
        borderWidth: 2,
        borderColor: 'rgba(239, 68, 68, 0.3)', // red-500/30
        borderRadius: 12,
        height: 56,
        marginBottom: 24,
    },
    logoutText: {
        color: COLORS.danger,
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    footerText: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginBottom: 4,
    },
    footerSubText: {
        color: '#4b5563', // gray-600
        fontSize: 12,
    },
});
