import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import api from './api';
import { storageAdapter } from './storageAdapter';

export interface User {
    id: number;
    nombre: string;
    email: string;
    rol: string;
    telefono?: string;
    imagenUrl?: string;
}

interface LoginResponse {
    tokenDeAcceso: string;
    tokenDeRefresco: string;
    // backend might confirm user data here too, but we decode it from token usually
}

export const authService = {
    async login(email: string, password: string): Promise<{ user: User; token: string }> {
        try {
            const response = await api.post<LoginResponse>('/Auth/iniciar-sesion', { email, password });
            const { tokenDeAcceso } = response.data;

            const decoded: any = jwtDecode(tokenDeAcceso);

            // Helper to find claims in different formats (full URI or short name)
            const getClaim = (obj: any, keys: string[]) => {
                const objKeys = Object.keys(obj);
                for (const k of keys) {
                    const found = objKeys.find(
                        (key) => key.toLowerCase().endsWith('/' + k.toLowerCase()) || key.toLowerCase() === k.toLowerCase()
                    );
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
                imagenUrl: getClaim(decoded, ['imagen_url']) || '',
            };

            await storageAdapter.setItem('userToken', tokenDeAcceso);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));

            return { user: userData, token: tokenDeAcceso };
        } catch (error: any) {
            console.error("Login error details:", error);
            throw error; // Re-throw to be handled by UI
        }
    },

    async logout() {
        try {
            await api.post('/Auth/cerrar-sesion', {}).catch((e) => console.log('Backend logout failed or ignored', e));
        } finally {
            await storageAdapter.deleteItem('userToken');
            await AsyncStorage.removeItem('userData');
        }
    },

    async getUserFromStorage(): Promise<{ user: User | null; token: string | null }> {
        try {
            const token = await storageAdapter.getItem('userToken');
            const userStr = await AsyncStorage.getItem('userData');
            if (token && userStr) {
                return { user: JSON.parse(userStr), token };
            }
        } catch (e) {
            console.error('Error loading auth from storage', e);
        }
        return { user: null, token: null };
    },
};
