import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storageAdapter } from './storageAdapter';

// Dynamic API URL determination
const getApiUrl = () => {
    if (Platform.OS === 'web') return 'http://localhost:5079/api/';
    if (Platform.OS === 'android') return 'http://10.0.2.2:5079/api/';

    // dynamic IP for physical devices (development)
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(':')[0];

    if (localhost) {
        return `http://${localhost}:5079/api/`;
    }

    // Fallback
    return 'http://localhost:5079/api/';
};

export const API_URL = getApiUrl();

console.log('API_URL configured as:', API_URL);

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the auth token to every request
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await storageAdapter.getItem('userToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error attaching token to request', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle common errors (like 401)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            console.warn('Sesión caducada o no autorizada. Limpiando almacenamiento...');
            try {
                // We use dynamic imports to avoid circular dependencies if any
                const { storageAdapter } = await import('./storageAdapter');
                const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;

                await storageAdapter.deleteItem('userToken');
                await AsyncStorage.removeItem('userData');

                // Note: The UI will react to this if it uses useAuth and we trigger a state update
                // or just redirect on next app start / route change.
            } catch (e) {
                console.error('Error clearing session on 401', e);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
