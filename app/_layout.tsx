import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { initDatabase } from '@/lib/db';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .then(() => setIsReady(true))
      .catch((err) => {
        console.error('DB init failed', err);
        setIsReady(true);
      });
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#6C5CE7" />
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