import { AuthProvider, useAuth } from '@/store/authStore';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const firstSegment = segments[0] as string;
    const inAuthenticatedGroup = ['dashboard', 'settings', 'rutas'].includes(firstSegment);

    if (!user && inAuthenticatedGroup) {
      // Redirect to the sign-in page if the user is not signed in
      router.replace('/');
    } else if (user && firstSegment === undefined) {
      // Redirect to dashboard if signed in and at root
      router.replace('/dashboard' as any);
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#E67E50" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="rutas/index" options={{ title: 'Mis Rutas', headerShown: true, headerStyle: { backgroundColor: '#092C4C' }, headerTintColor: 'white' }} />
      <Stack.Screen name="rutas/[id]" options={{ title: 'Detalle de Ruta', headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: 'Mi Perfil', headerShown: true, headerStyle: { backgroundColor: '#092C4C' }, headerTintColor: 'white' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
      <StatusBar style="light" />
    </AuthProvider>
  );
}
