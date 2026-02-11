import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Use 10.0.2.2 for Android Emulator to access localhost of the host machine.
// For physical devices or iOS simulator, this should be your machine's LAN IP or a public URL.
export const API_URL = 'http://10.0.2.2:5079/api';

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
            const token = await SecureStore.getItemAsync('userToken');
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
