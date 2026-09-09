import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';
import 'react-native-reanimated';

import { initDatabase } from '@/lib/db';
import { ThemeProviderCustom, useAppTheme } from '@/context/ThemeContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutInner() {
  const { colorScheme, isDark } = useAppTheme();
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#2547F4" />
      </View>
    );
  }

  const paperTheme = isDark ? MD3DarkTheme : MD3LightTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="inventario" options={{ headerShown: false }} />
          <Stack.Screen name="caja" options={{ headerShown: false }} />
          <Stack.Screen name="venta" options={{ headerShown: false }} />
          <Stack.Screen name="venta-manual" options={{ headerShown: false }} />
          <Stack.Screen name="venta-barras" options={{ headerShown: false }} />
          <Stack.Screen name="venta-checkout" options={{ headerShown: false }} />
          <Stack.Screen name="agregar-stock" options={{ headerShown: false }} />
          <Stack.Screen name="agregar-lector" options={{ headerShown: false }} />
          <Stack.Screen name="nueva-carga" options={{ headerShown: false }} />
          <Stack.Screen name="cierre-caja" options={{ headerShown: false }} />
          <Stack.Screen name="gestor-proveedores" options={{ headerShown: false }} />
          <Stack.Screen name="proveedor-detalle" options={{ headerShown: false }} />
          <Stack.Screen name="clientes" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </ThemeProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProviderCustom>
      <RootLayoutInner />
    </ThemeProviderCustom>
  );
}