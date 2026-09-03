import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getProductos, getVentas, getClientes, getProveedores } from '@/lib/db';

export default function AccionesScreen() {
  const router = useRouter();
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

  const modules = [
    {
      route: '/inventario',
      label: 'Inventario',
      subtitle: `${counts.productos} productos`,
      badge: counts.lowStock > 0 ? `${counts.lowStock} alertas` : null,
      icon: 'cube' as const,
      color: '#EF4444',
      bg: '#FEF2F2',
    },
    {
      route: '/caja',
      label: 'Caja y Ventas',
      subtitle: `${counts.ventas} tickets hoy`,
      badge: null,
      icon: 'receipt' as const,
      color: '#10B981',
      bg: '#ECFDF5',
    },
    {
      route: '/cierre-caja',
      label: 'Cierre de Turno',
      subtitle: 'Arqueo y balance',
      badge: null,
      icon: 'cash' as const,
      color: '#2547F4',
      bg: '#EEF2FF',
    },
    {
      route: '/gestor-proveedores',
      label: 'Proveedores',
      subtitle: `${counts.proveedores} proveedores`,
      badge: null,
      icon: 'storefront' as const,
      color: '#F59E0B',
      bg: '#FFFBEB',
    },
    {
      route: '/clientes',
      label: 'Fiados y Clientes',
      subtitle: `${counts.clientes} cuentas`,
      badge: null,
      icon: 'people' as const,
      color: '#06B6D4',
      bg: '#ECFEFF',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Acciones</Text>
      <Text style={styles.subtitle}>Hub Central — 5 ejes operativos</Text>

      <View style={styles.grid}>
        {modules.map((m) => (
          <TouchableOpacity
            key={m.route}
            style={styles.gridCard}
            onPress={() => router.push(m.route as never)}
            activeOpacity={0.8}>
            <View style={[styles.gridIcon, { backgroundColor: m.bg }]}>
              <Ionicons name={m.icon} size={26} color={m.color} />
            </View>
            <Text style={styles.gridLabel}>{m.label}</Text>
            <Text style={styles.gridSubtitle}>{m.subtitle}</Text>
            {m.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{m.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.dbPanel}>
        <View style={styles.dbIcon}>
          <Feather name="database" size={20} color="#2547F4" />
        </View>
        <View style={styles.dbInfo}>
          <Text style={styles.dbTitle}>Base de Datos Local</Text>
          <Text style={styles.dbSubtitle}>SQLite · 100% Offline · Almacenamiento en dispositivo</Text>
        </View>
        <View style={styles.dbDot} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingHorizontal: 16, paddingTop: 60, paddingBottom: 100 },
  title: { fontFamily: 'Satoshi-Bold', fontSize: 28, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontFamily: 'Satoshi-Regular', fontSize: 14, color: '#64748B', marginBottom: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
  gridLabel: { fontFamily: 'Satoshi-Bold', fontSize: 14, color: '#0F172A', marginBottom: 4 },
  gridSubtitle: { fontFamily: 'Satoshi-Regular', fontSize: 12, color: '#64748B' },
  badge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: 'Satoshi-Bold', fontSize: 11, color: '#EF4444' },
  dbPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  dbIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dbInfo: { flex: 1 },
  dbTitle: { fontFamily: 'Satoshi-Bold', fontSize: 13, color: '#0F172A' },
  dbSubtitle: { fontFamily: 'Satoshi-Regular', fontSize: 11, color: '#64748B', marginTop: 2 },
  dbDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
});