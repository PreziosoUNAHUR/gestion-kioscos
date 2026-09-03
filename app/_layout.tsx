import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import 'react-native-reanimated';

import { initDatabase } from '@/lib/db';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [dbReady, setDbReady] = useState(false);
  const [fontsLoaded] = useFonts({
    'Satoshi-Regular': require('../assets/fonts/Satoshi-Regular.otf'),
    'Satoshi-Medium': require('../assets/fonts/Satoshi-Medium.otf'),
    'Satoshi-Bold': require('../assets/fonts/Satoshi-Bold.otf'),
  });

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((err) => {
        console.error('DB init failed', err);
        setDbReady(true);
      });
  }, []);

  if (!fontsLoaded || !dbReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#2547F4" />
      </View>
    );
  }

  return (
    <PaperProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="inventario" options={{ headerShown: false }} />
          <Stack.Screen name="caja" options={{ headerShown: false }} />
          <Stack.Screen name="venta" options={{ headerShown: false }} />
          <Stack.Screen name="venta-manual" options={{ headerShown: false }} />
          <Stack.Screen name="venta-barras" options={{ headerShown: false }} />
          <Stack.Screen name="agregar-stock" options={{ headerShown: false }} />
          <Stack.Screen name="agregar-lector" options={{ headerShown: false }} />
          <Stack.Screen name="nueva-carga" options={{ headerShown: false }} />
          <Stack.Screen name="cierre-caja" options={{ headerShown: false }} />
          <Stack.Screen name="gestor-proveedores" options={{ headerShown: false }} />
          <Stack.Screen name="clientes" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </PaperProvider>
  );
}