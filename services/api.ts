import axios from 'axios';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { storageAdapter } from './storageAdapter';

// --- CONFIGURATION ---
// If you are using ngrok, paste the URL here (e.g., 'https://xxxx.ngrok-free.app')
const NGROK_URL: string = 'https://distinguishably-busiest-brayan.ngrok-free.dev';
// ---------------------

// Dynamic API URL determination
const getApiUrl = () => {
    // Priority 1: Manual Ngrok URL
    if (NGROK_URL) {
        return NGROK_URL.endsWith('/') ? `${NGROK_URL}api/` : `${NGROK_URL}/api/`;
    }

    if (Platform.OS === 'web') return 'http://localhost:5079/api/';

    // Android Emulator specific configuration
    if (Platform.OS === 'android' && !Device.isDevice) {
        return 'http://10.0.2.2:5079/api/';
    }

    // dynamic IP for physical devices (development in same Wi-Fi)
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(':')[0];

    if (localhost && !localhost.includes('exp.direct')) {
        return `http://${localhost}:5079/api/`;
    }

    // Fallback (Physical Android & iOS devices)
    return 'http://172.17.21.174:5079/api/';
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
                const { storageAdapter } = await import('./storageAdapter');
                const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
                const { Alert } = await import('react-native');

                await storageAdapter.deleteItem('userToken');
                await AsyncStorage.removeItem('userData');

                Alert.alert(
                    'Sesión Expirada',
                    'Tu sesión ha caducado. Por favor, inicia sesión de nuevo.',
                    [{ text: 'OK' }]
                );
            } catch (e) {
                console.error('Error clearing session on 401', e);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
