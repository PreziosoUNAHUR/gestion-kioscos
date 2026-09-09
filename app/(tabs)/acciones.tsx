import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getProductos, getVentas, getClientes, getProveedores } from '@/lib/db';
import { useAppTheme } from '@/context/ThemeContext';

export default function AccionesScreen() {
  const router = useRouter();
  const { isDark, toggleTheme } = useAppTheme();
  const [counts, setCounts] = useState({ productos: 0, ventas: 0, clientes: 0, proveedores: 0, lowStock: 0 });

  useFocusEffect(
    useCallback(() => {
      Promise.all([getProductos(), getVentas(), getClientes(), getProveedores()]).then(
        ([prod, ventas, cli, prov]) => {
          setCounts({
            productos: prod.length,
            ventas: ventas.length,
            clientes: cli.length,
            proveedores: prov.length,
            lowStock: prod.filter((p) => p.stock <= 5).length,
          });
        },
      );
    }, []),
  );

  const bg = isDark ? '#0F172A' : '#F8FAFC';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardBorder = isDark ? '#334155' : '#F1F5F9';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';

  const modules = [
    {
      route: '/venta',
      label: 'Venta',
      subtitle: 'Venta rápida',
      badge: null,
      icon: 'cart' as const,
      color: '#2547F4',
      bg: isDark ? '#1E293B' : '#EEF2FF',
    },
    {
      route: '/inventario',
      label: 'Inventario',
      subtitle: `${counts.productos} productos`,
      badge: counts.lowStock > 0 ? `${counts.lowStock} alertas` : null,
      icon: 'cube' as const,
      color: '#EF4444',
      bg: isDark ? '#2D1B1B' : '#FEF2F2',
    },
    {
      route: '/caja',
      label: 'Caja y Ventas',
      subtitle: `${counts.ventas} tickets hoy`,
      badge: null,
      icon: 'receipt' as const,
      color: '#10B981',
      bg: isDark ? '#0F2F23' : '#ECFDF5',
    },
    {
      route: '/cierre-caja',
      label: 'Cierre de caja',
      subtitle: 'Arqueo y balance',
      badge: null,
      icon: 'cash' as const,
      color: '#2547F4',
      bg: isDark ? '#1E293B' : '#EEF2FF',
    },
    {
      route: '/gestor-proveedores',
      label: 'Proveedores',
      subtitle: `${counts.proveedores} proveedores`,
      badge: null,
      icon: 'storefront' as const,
      color: '#F59E0B',
      bg: isDark ? '#2F2310' : '#FFFBEB',
    },
    {
      route: '/clientes',
      label: 'Fiado',
      subtitle: `${counts.clientes} cuentas`,
      badge: null,
      icon: 'people' as const,
      color: '#06B6D4',
      bg: isDark ? '#0F2A2E' : '#ECFEFF',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Text style={[styles.title, { color: textPrimary }]}>Acciones</Text>
      <Text style={[styles.subtitle, { color: textSecondary }]}>Hub Central — 6 ejes operativos</Text>

      <View style={styles.grid}>
        {modules.map((m) => (
          <TouchableOpacity
            key={m.route}
            style={[styles.gridCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
            onPress={() => router.push(m.route as never)}
            activeOpacity={0.8}>
            <View style={[styles.gridIcon, { backgroundColor: m.bg }]}>
              <Ionicons name={m.icon} size={26} color={m.color} />
            </View>
            <Text style={[styles.gridLabel, { color: textPrimary }]}>{m.label}</Text>
            <Text style={[styles.gridSubtitle, { color: textSecondary }]}>{m.subtitle}</Text>
            {m.badge && (
              <View style={[styles.badge, { backgroundColor: isDark ? '#2D1B1B' : '#FEF2F2' }]}>
                <Text style={styles.badgeText}>{m.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.themeRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.themeLabelWrap}>
          <Feather name={isDark ? 'moon' : 'sun'} size={20} color={isDark ? '#F59E0B' : '#64748B'} />
          <Text style={[styles.themeLabel, { color: textPrimary }]}>{isDark ? 'Modo Oscuro' : 'Modo Claro'}</Text>
        </View>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: '#E2E8F0', true: '#1E293B' }}
          thumbColor={isDark ? '#F59E0B' : '#FFFFFF'}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 100 },
  title: { fontFamily: 'Satoshi-Bold', fontSize: 28, fontWeight: '800' },
  subtitle: { fontFamily: 'Satoshi-Regular', fontSize: 14, marginBottom: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  gridCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  gridIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gridLabel: { fontFamily: 'Satoshi-Bold', fontSize: 14, marginBottom: 4 },
  gridSubtitle: { fontFamily: 'Satoshi-Regular', fontSize: 12 },
  badge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: 'Satoshi-Bold', fontSize: 11, color: '#EF4444' },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  themeLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  themeLabel: { fontFamily: 'Satoshi-Medium', fontSize: 14 },
});