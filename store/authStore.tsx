import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { createContext, useContext, useEffect, useState } from 'react';

const API_URL = 'http://10.0.2.2:5079/api';

interface User {
    id: number;
    nombre: string;
    email: string;
    rol: string;
    telefono?: string;
    imagenUrl?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStoredData();
    }, []);

    async function loadStoredData() {
        try {
            const storedToken = await SecureStore.getItemAsync('userToken');
            const storedUser = await AsyncStorage.getItem('userData');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            }
        } catch (e) {
            console.error('Error loading auth data', e);
        } finally {
            setIsLoading(false);
        }
    }

    async function login(email: string, password: string) {
        try {
            const response = await axios.post(`${API_URL}/Auth/iniciar-sesion`, { email, password });
            const { tokenDeAcceso } = response.data;

            const decoded: any = jwtDecode(tokenDeAcceso);

            // Helper to find claims in different formats (full URI or short name)
            const getClaim = (obj: any, keys: string[]) => {
                const objKeys = Object.keys(obj);
                for (const k of keys) {
                    const found = objKeys.find(key => key.toLowerCase().endsWith('/' + k.toLowerCase()) || key.toLowerCase() === k.toLowerCase());
                    if (found) return obj[found];
                }
                return null;
            };

            const rol = getClaim(decoded, ['role']) || decoded.role;
            if (rol !== 'REPARTIDOR') {
                throw new Error('Acceso denegado: Se requiere rol de REPARTIDOR');
            }

            const userData: User = {
                id: parseInt(getClaim(decoded, ['nameidentifier', 'sub']) || '0'),
                nombre: getClaim(decoded, ['name', 'unique_name', 'given_name']) || decoded.name || 'Usuario',
                email: getClaim(decoded, ['emailaddress', 'email']) || email,
                rol: rol,
                telefono: getClaim(decoded, ['mobilephone', 'telefono', 'phone']) || '',
                imagenUrl: getClaim(decoded, ['imagen_url']) || ''
            };

            console.log('Decoded Token:', decoded);
            console.log('Parsed User:', userData);

            await SecureStore.setItemAsync('userToken', tokenDeAcceso);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));

            setToken(tokenDeAcceso);
            setUser(userData);
            axios.defaults.headers.common['Authorization'] = `Bearer ${tokenDeAcceso}`;
        } catch (e: any) {
            throw e;
        }
    }

    async function logout() {
        try {
            if (token) {
                // Option to call backend logout
                await axios.post(`${API_URL}/Auth/cerrar-sesion`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                }).catch(e => console.log('Backend logout failed', e));
            }
        } finally {
            await SecureStore.deleteItemAsync('userToken');
            await AsyncStorage.removeItem('userData');
            setToken(null);
            setUser(null);
            delete axios.defaults.headers.common['Authorization'];
        }
    }

    async function updateUser(data: Partial<User>) {
        if (!user) return;
        const updatedUser = { ...user, ...data };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        setUser(updatedUser);
    }

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
