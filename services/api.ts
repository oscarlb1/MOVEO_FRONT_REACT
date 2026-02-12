import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storageAdapter } from './storageAdapter';

// Dynamic API URL determination
const getApiUrl = () => {
    if (Platform.OS === 'web') return 'http://localhost:5079/api';

    // For Android Emulator (10.0.2.2 points to host's localhost)
    if (Platform.OS === 'android') return 'http://10.0.2.2:5079/api';

    // dynamic IP for physical devices (development)
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(':')[0];

    if (localhost) {
        return `http://${localhost}:5079/api`;
    }

    // Fallback
    return 'http://localhost:5079/api';
};

export const API_URL = getApiUrl();

console.log('API_URL configured as:', API_URL);

const api = axios.create({
    baseURL: API_URL,
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

export default api;
