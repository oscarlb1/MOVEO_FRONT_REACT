import api from '@/services/api';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

export interface LocationState {
    latitude: number;
    longitude: number;
    accuracy: number | null;
}

export function useLocationTracker(rutaId: number | null, isActive: boolean = false) {
    const [location, setLocation] = useState<LocationState | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const intervalRef = useRef<any>(null);

    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;

        const startTracking = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                console.warn('GPS Permission denied');
                return;
            }

            console.log('GPS Permission granted, fetching initial position...');

            // Get initial position immediately
            try {
                const initial = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });
                setLocation({
                    latitude: initial.coords.latitude,
                    longitude: initial.coords.longitude,
                    accuracy: initial.coords.accuracy
                });
                console.log('Initial location received:', initial.coords);
            } catch (err) {
                console.error('Error getting initial location', err);
            }

            // Real-time listener for UI updates
            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 2000,
                    distanceInterval: 5,
                },
                (loc) => {
                    console.log('GPS Update received:', loc.coords);
                    const { latitude, longitude, accuracy } = loc.coords;
                    setLocation({ latitude, longitude, accuracy });
                }
            );

            // Periodic heartbeat to backend
            if (rutaId && isActive) {
                intervalRef.current = setInterval(async () => {
                    const currentLoc = await Location.getCurrentPositionAsync({});
                    try {
                        await api.post('Ubicacion', {
                            rutaId,
                            latitud: currentLoc.coords.latitude,
                            longitud: currentLoc.coords.longitude,
                        });
                        console.log('Location updated in backend');
                    } catch (err) {
                        console.error('Failed to update location in backend', err);
                    }
                }, 600000); // Every 10 minutes (600,000 ms)
            }
        };

        if (isActive) {
            startTracking();
        } else {
            if (subscription) {
                // subscription.remove() is the correct way but watchPosition returns a subscription
            }
        }

        return () => {
            if (subscription) (subscription as any).remove();
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [rutaId, isActive]);

    return { location, errorMsg };
}
