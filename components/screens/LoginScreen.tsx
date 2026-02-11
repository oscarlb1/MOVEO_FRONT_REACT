import { Colors } from '@/constants/theme';
import { useAuth } from '@/store/authStore';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Truck } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor, rellena todos los campos');
            return;
        }

        setIsSubmitting(true);
        try {
            await login(email, password);
        } catch (error: any) {
            Alert.alert('Error de acceso', error.message || 'Credenciales incorrectas');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <LinearGradient
            colors={Colors.dark.backgroundGradient as any}
            style={styles.container}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.innerContainer}
            >
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Truck color="#white" size={32} />
                    </View>
                    <Text style={styles.brandName}>Moveo</Text>
                    <Text style={styles.welcomeText}>Bienvenido de vuelta</Text>
                    <Text style={styles.subtitle}>Inicia sesión para acceder a tu panel de control</Text>
                </View>

                <BlurView intensity={20} tint="light" style={styles.loginCard}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Correo electrónico</Text>
                        <View style={styles.inputWrapper}>
                            <Mail color="#9BA1A6" size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="tu@empresa.com"
                                placeholderTextColor="#9BA1A6"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Contraseña</Text>
                        <View style={styles.inputWrapper}>
                            <Lock color="#9BA1A6" size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="#9BA1A6"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeIcon}
                            >
                                {showPassword ? <EyeOff color="#9BA1A6" size={20} /> : <Eye color="#9BA1A6" size={20} />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, isSubmitting && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <>
                                <Text style={styles.loginButtonText}>Iniciar sesión</Text>
                                <ArrowRight color="white" size={20} />
                            </>
                        )}
                    </TouchableOpacity>
                </BlurView>

                <View style={styles.footer}>
                    <TouchableOpacity>
                        <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                    </TouchableOpacity>

                    <View style={styles.contactCard}>
                        <Text style={styles.contactTitle}>¿Nuevo en Moveo?</Text>
                        <Text style={styles.contactSubtitle}>Solicita tu acceso corporativo</Text>
                        <TouchableOpacity style={styles.contactButton}>
                            <Text style={styles.contactButtonText}>Contactar con soporte</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 60,
        height: 60,
        backgroundColor: '#E67E50',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#E67E50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    brandName: {
        fontSize: 28,
        fontWeight: '700',
        color: 'white',
        marginBottom: 8,
    },
    welcomeText: {
        fontSize: 24,
        color: 'white',
        fontWeight: '600',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#9BA1A6',
        textAlign: 'center',
    },
    loginCard: {
        borderRadius: 24,
        padding: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: 'white',
        fontSize: 14,
        marginBottom: 8,
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
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 16,
    },
    eyeIcon: {
        padding: 8,
    },
    loginButton: {
        backgroundColor: '#E67E50',
        height: 56,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        gap: 10,
        shadowColor: '#E67E50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        marginTop: 30,
        alignItems: 'center',
    },
    forgotText: {
        color: '#E67E50',
        fontSize: 14,
        marginBottom: 24,
    },
    contactCard: {
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    contactTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    contactSubtitle: {
        color: '#9BA1A6',
        fontSize: 12,
        marginBottom: 16,
    },
    contactButton: {
        width: '100%',
        height: 48,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    contactButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    }
});
