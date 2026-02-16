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
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

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
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#092C4C', '#061A2D']}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative Background Elements */}
            <View style={[styles.circle, { top: -50, right: -50, backgroundColor: 'rgba(230, 126, 80, 0.1)' }]} />
            <View style={[styles.circle, { bottom: -100, left: -100, backgroundColor: 'rgba(230, 126, 80, 0.05)' }]} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.innerContainer}
            >
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Truck color="white" size={36} strokeWidth={2.5} />
                    </View>
                    <Text style={styles.brandName}>MOVEO</Text>
                    <View style={styles.divider} />
                    <Text style={styles.welcomeText}>Gestión Logística</Text>
                    <Text style={styles.subtitle}>Inicia sesión con tus credenciales de repartidor</Text>
                </View>

                <BlurView intensity={30} tint="dark" style={styles.loginCard}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <View style={styles.inputWrapper}>
                            <Mail color="#E67E50" size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="usuario@moveo.com"
                                placeholderTextColor="rgba(255, 255, 255, 0.3)"
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
                            <Lock color="#E67E50" size={20} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeIcon}
                            >
                                {showPassword ? <EyeOff color="rgba(255, 255, 255, 0.5)" size={20} /> : <Eye color="rgba(255, 255, 255, 0.5)" size={20} />}
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
                                <Text style={styles.loginButtonText}>ACCEDER</Text>
                                <ArrowRight color="white" size={20} />
                            </>
                        )}
                    </TouchableOpacity>
                </BlurView>

                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>Moveo Logistics System v2.0</Text>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#092C4C',
    },
    innerContainer: {
        flex: 1,
        paddingHorizontal: 30,
        justifyContent: 'center',
    },
    circle: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
    },
    header: {
        alignItems: 'center',
        marginBottom: 50,
    },
    logoContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#E67E50',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#E67E50',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 10,
    },
    brandName: {
        fontSize: 32,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 4,
    },
    divider: {
        width: 40,
        height: 4,
        backgroundColor: '#E67E50',
        marginVertical: 12,
        borderRadius: 2,
    },
    welcomeText: {
        fontSize: 18,
        color: 'white',
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.5)',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    loginCard: {
        borderRadius: 30,
        padding: 25,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        color: 'white',
        fontSize: 14,
        marginBottom: 10,
        fontWeight: '600',
        opacity: 0.9,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        height: 60,
        paddingHorizontal: 20,
    },
    inputIcon: {
        marginRight: 15,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 16,
    },
    eyeIcon: {
        padding: 5,
    },
    loginButton: {
        backgroundColor: '#E67E50',
        height: 60,
        borderRadius: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 15,
        gap: 12,
        shadowColor: '#E67E50',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 2,
    },
    footerContainer: {
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: 12,
        fontWeight: '500',
    }
});
