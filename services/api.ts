import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { storageAdapter } from './storageAdapter';

// --- CONFIGURATION ---
// If you are using ngrok, paste the URL here (e.g., 'https://xxxx.ngrok-free.app')
const NGROK_URL: string = 'http://ac1bd7145f9ec47afb4863b9832a1355-811568931.us-east-1.elb.amazonaws.com';
// ---------------------

const getApiUrl = () => {
    // Priority 1: Manual Ngrok URL
    if (NGROK_URL) {
        const cleanUrl = NGROK_URL.endsWith('/') ? NGROK_URL.slice(0, -1) : NGROK_URL;
        return `${cleanUrl}/api`;
    }

    if (Platform.OS === 'web') return 'https://localhost:7085/api';

    // Android Emulator specific configuration
    if (Platform.OS === 'android' && !Device.isDevice) {
        return 'https://10.0.2.2:7085/api';
    }

    // dynamic IP for physical devices (development in same Wi-Fi)
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(':')[0];

    if (localhost && !localhost.includes('exp.direct')) {
        // Usamos el puerto HTTP (5079) para dispositivos físicos para evitar problemas de certificados SSL
        return `http://${localhost}:5079/api`;
    }

    // Fallback (Physical Android & iOS devices)
    return 'http://10.90.202.44:5079/api';
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
        try {
            if (error.response?.status === 401) {
                console.warn('Sesión caducada o no autorizada. Limpiando almacenamiento...');
                await storageAdapter.deleteItem('userToken');
                await AsyncStorage.removeItem('userToken_temp');
                await AsyncStorage.removeItem('userData');
                await AsyncStorage.removeItem('rememberSession');

                console.warn('Session cleared successfully. Redirecting will happen via state change.');
            }
        } catch (e) {
            console.error('Error clearing session on 401', e);
        }

        return Promise.reject(error);
    }
);


export default api;
