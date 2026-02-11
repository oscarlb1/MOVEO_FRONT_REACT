import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const storageAdapter = {
    async setItem(key: string, value: string): Promise<void> {
        if (isWeb) {
            await AsyncStorage.setItem(key, value);
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    },

    async getItem(key: string): Promise<string | null> {
        if (isWeb) {
            return await AsyncStorage.getItem(key);
        } else {
            return await SecureStore.getItemAsync(key);
        }
    },

    async deleteItem(key: string): Promise<void> {
        if (isWeb) {
            await AsyncStorage.removeItem(key);
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    }
};
