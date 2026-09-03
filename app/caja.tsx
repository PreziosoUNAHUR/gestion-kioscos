import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as MailComposer from 'expo-mail-composer';
import { getVentas, type Venta } from '@/lib/db';

export default function CajaScreen() {
  const router = useRouter();
  const [ventas, setVentas] = useState<Venta[]>([]);

  useFocusEffect(
    useCallback(() => {
      getVentas()
        .then(setVentas)
        .catch((err) => console.error(err));
    }, []),
  );

  const filterHoy = (all: Venta[]) => {
    const today = new Date().toISOString().slice(0, 10);
    return all.filter((v) => v.fecha.slice(0, 10) === today);
  };
  const hoy = filterHoy(ventas);
  const totalHoy = hoy.reduce((s, v) => s + v.total, 0);
  const ticketProm = hoy.length > 0 ? totalHoy / hoy.length : 0;

  const enviarReporteEmail = async () => {
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('No disponible', 'No hay app de email configurada');
      return;
    }
    const body = [
      'Reporte de Caja y Ventas',
      `Fecha: ${new Date().toLocaleDateString('es-AR')}`,
      `Total facturado: $${totalHoy.toLocaleString('es-AR')}`,
      `Tickets: ${hoy.length} · Promedio: $${ticketProm.toFixed(0)}`,
      '',
      'Detalle:',
      ...hoy.map(
        (v) =>
          `${new Date(v.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} — $${v.total}`,
      ),
    ].join('\n');
    await MailComposer.composeAsync({
      subject: `Caja ${new Date().toLocaleDateString('es-AR')} — $${totalHoy}`,
      body,
    });
  };

  const formatAmount = (n: number) => `$${n.toLocaleString('es-AR')}`;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Caja y Ventas</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Total facturado</Text>
          <Text style={styles.heroTotal}>{formatAmount(totalHoy)}</Text>
          <View style={styles.heroMetaRow}>
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaValue}>{hoy.length}</Text>
              <Text style={styles.heroMetaLabel}>Tickets</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMeta}>
              <Text style={styles.heroMetaValue}>${ticketProm.toFixed(0)}</Text>
              <Text style={styles.heroMetaLabel}>Ticket promedio</Text>
            </View>
          </View>
        </View>

        <View style={styles.breakdownRow}>
          <View style={styles.breakdownCard}>
            <View style={[styles.breakdownIcon, { backgroundColor: '#ECFDF5' }]}>
              <FontAwesome5 name="money-bill-wave" size={18} color="#10B981" />
            </View>
            <Text style={styles.breakdownLabel}>Efectivo</Text>
            <Text style={styles.breakdownValue}>{formatAmount(totalHoy)}</Text>
          </View>
          <View style={styles.breakdownCard}>
            <View style={[styles.breakdownIcon, { backgroundColor: '#E0F2FE' }]}>
              <MaterialCommunityIcons name="qrcode-scan" size={18} color="#0284C7" />
            </View>
            <Text style={styles.breakdownLabel}>Mercado Pago</Text>
            <Text style={styles.breakdownValue}>$0</Text>
          </View>
          <View style={styles.breakdownCard}>
            <View style={[styles.breakdownIcon, { backgroundColor: '#DCFCE7' }]}>
              <Feather name="smartphone" size={18} color="#16A34A" />
            </View>
            <Text style={styles.breakdownLabel}>Cuenta DNI</Text>
            <Text style={styles.breakdownValue}>$0</Text>
          </View>
        </View>

        <View style={styles.ticketsHeader}>
          <Text style={styles.ticketsTitle}>Tickets del Día</Text>
          <Text style={styles.ticketsCount}>{hoy.length} emitidos</Text>
        </View>

        {hoy.length === 0 ? (
          <Text style={styles.emptyText}>Todavía no hay ventas hoy</Text>
        ) : (
          hoy.map((v) => (
            <View key={v.id} style={styles.ticketCard}>
              <View style={styles.ticketIcon}>
                <Ionicons name="receipt-outline" size={18} color="#64748B" />
              </View>
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketTime}>
                  {new Date(v.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.ticketDate}>{new Date(v.fecha).toLocaleDateString('es-AR')}</Text>
              </View>
              <View style={styles.ticketBadge}>
                <Text style={styles.ticketBadgeText}>Efectivo</Text>
              </View>
              <Text style={styles.ticketAmount}>{formatAmount(v.total)}</Text>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.emailBtn} onPress={enviarReporteEmail}>
          <Feather name="mail" size={18} color="#FFFFFF" />
          <Text style={styles.emailBtnText}>Enviar reporte por email</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/venta' as never)}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontFamily: 'Satoshi-Bold', fontSize: 18, color: '#0F172A' },
  content: { padding: 16, paddingBottom: 100 },
  heroCard: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  heroLabel: { fontFamily: 'Satoshi-Medium', fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  heroTotal: { fontFamily: 'Satoshi-Bold', fontSize: 36, color: '#FFFFFF', marginTop: 4 },
  heroMetaRow: { flexDirection: 'row', marginTop: 14, gap: 16 },
  heroMeta: { alignItems: 'center' },
  heroMetaValue: { fontFamily: 'Satoshi-Bold', fontSize: 16, color: '#FFFFFF' },
  heroMetaLabel: { fontFamily: 'Satoshi-Regular', fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  heroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  breakdownRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  breakdownCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  breakdownIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  breakdownLabel: { fontFamily: 'Satoshi-Regular', fontSize: 11, color: '#64748B' },
  breakdownValue: { fontFamily: 'Satoshi-Bold', fontSize: 13, color: '#0F172A', marginTop: 2 },
  ticketsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  ticketsTitle: { fontFamily: 'Satoshi-Bold', fontSize: 16, color: '#0F172A' },
  ticketsCount: { fontFamily: 'Satoshi-Regular', fontSize: 12, color: '#64748B' },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  ticketIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ticketInfo: { flex: 1 },
  ticketTime: { fontFamily: 'Satoshi-Bold', fontSize: 13, color: '#0F172A' },
  ticketDate: { fontFamily: 'Satoshi-Regular', fontSize: 11, color: '#94A3B8', marginTop: 2 },
  ticketBadge: { backgroundColor: '#ECFDF5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginRight: 10 },
  ticketBadgeText: { fontFamily: 'Satoshi-Medium', fontSize: 11, color: '#10B981' },
  ticketAmount: { fontFamily: 'Satoshi-Bold', fontSize: 14, color: '#0F172A' },
  emptyText: { fontFamily: 'Satoshi-Regular', textAlign: 'center', color: '#94A3B8', paddingVertical: 24 },
  emailBtn: {
    flexDirection: 'row',
    backgroundColor: '#2547F4',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  emailBtnText: { fontFamily: 'Satoshi-Bold', color: '#FFFFFF', fontSize: 14 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2547F4',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#2547F4',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});