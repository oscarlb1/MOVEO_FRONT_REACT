import { WebColors } from '@/constants/theme';
import { Tabs } from 'expo-router';
import { MapPin, Package, Truck, User } from 'lucide-react-native';
import { Platform } from 'react-native';

const theme = WebColors.dark;

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.card,
                    borderTopColor: theme.cardBorder,
                    height: Platform.OS === 'ios' ? 98 : 70, // Increased height
                    paddingBottom: Platform.OS === 'ios' ? 32 : 12, // Increased padding
                    paddingTop: 10,
                },
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.textSecondary,
                tabBarLabelStyle: {
                    fontSize: 13, // Increased font size
                    fontWeight: '600',
                    marginBottom: 4,
                },
            }}
        >
            <Tabs.Screen
                name="entregas"
                options={{
                    title: 'Entregas',
                    tabBarIcon: ({ color }) => <Package size={28} color={color} />, // Increased icon size
                }}
            />
            <Tabs.Screen
                name="rutas"
                options={{
                    title: 'Rutas',
                    tabBarIcon: ({ color }) => <MapPin size={28} color={color} />,
                }}
            />
            <Tabs.Screen
                name="vehiculo"
                options={{
                    title: 'Mi Vehículo',
                    tabBarIcon: ({ color }) => <Truck size={28} color={color} />,
                }}
            />
            <Tabs.Screen
                name="perfil"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color }) => <User size={28} color={color} />,
                }}
            />
        </Tabs>
    );
}
