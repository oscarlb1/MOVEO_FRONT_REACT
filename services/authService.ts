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
    async login(email: string, password: string, rememberMe: boolean = true): Promise<{ user: User; token: string }> {
        try {
            const response = await api.post<LoginResponse>('Auth/iniciar-sesion', { email, password });
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
            const rolUpper = (rol || '').toUpperCase();
            if (rolUpper !== 'REPARTIDOR') {
                const isAdmin = rolUpper === 'ADMINISTRADOR' || rolUpper === 'ADMIN';
                const adminError = new Error(
                    isAdmin
                        ? 'Los administradores deben acceder a través de la página web.'
                        : 'Esta aplicación es de uso exclusivo para repartidores.'
                );
                (adminError as any).code = isAdmin ? 'ADMIN_NOT_ALLOWED' : 'ROLE_NOT_ALLOWED';
                throw adminError;
            }

            const userData: User = {
                id: parseInt(getClaim(decoded, ['nameidentifier', 'sub']) || '0'),
                nombre: getClaim(decoded, ['name', 'unique_name', 'given_name']) || decoded.name || 'Usuario',
                email: getClaim(decoded, ['emailaddress', 'email']) || email,
                rol: rol,
                telefono: getClaim(decoded, ['mobilephone', 'telefono', 'phone']) || '',
                imagenUrl: getClaim(decoded, ['imagen_url']) || '',
            };

            // Senior Logic: We always save to SecureStore so the API interceptor works seamlessly.
            // But we use 'rememberSession' flag to decide if we auto-login on startup.
            await storageAdapter.setItem('userToken', tokenDeAcceso);
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            await AsyncStorage.setItem('rememberSession', rememberMe ? 'true' : 'false');

            return { user: userData, token: tokenDeAcceso };
        } catch (error: any) {
            // Only log non-role errors to avoid the red error bar for expected access restrictions
            if (error.code !== 'ADMIN_NOT_ALLOWED' && error.code !== 'ROLE_NOT_ALLOWED') {
                console.error("Login error details:", error);
            }
            throw error; // Re-throw to be handled by UI
        }
    },

    async logout() {
        try {
            await api.post('Auth/cerrar-sesion', {}).catch((e) => console.log('Backend logout failed or ignored', e));
        } finally {
            await storageAdapter.deleteItem('userToken');
            await AsyncStorage.removeItem('userData');
            await AsyncStorage.removeItem('rememberSession');
        }
    },

    async getUserFromStorage(): Promise<{ user: User | null; token: string | null }> {
        try {
            const remember = await AsyncStorage.getItem('rememberSession');
            if (remember !== 'true') {
                return { user: null, token: null };
            }

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
