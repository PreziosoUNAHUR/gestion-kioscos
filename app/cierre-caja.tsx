import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getVentasPendientes, confirmarCierre, type Venta } from '@/lib/db';

export default function CierreCajaScreen() {
  const router = useRouter();
  const [efectivo, setEfectivo] = useState('');
  const [mercadoPago, setMercadoPago] = useState('');
  const [cuentaDni, setCuentaDni] = useState('');
  const [pendientes, setPendientes] = useState<Venta[]>([]);
  const [closing, setClosing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getVentasPendientes()
        .then(setPendientes)
        .catch((e) => console.error(e));
    }, []),
  );

  const filterHoy = (all: Venta[]) => {
    const today = new Date().toISOString().slice(0, 10);
    return all.filter((v) => v.fecha.slice(0, 10) === today);
  };
  const hoy = filterHoy(pendientes);
  const totalPendiente = hoy.reduce((s, v) => s + v.total, 0);
  const totalEfectivo = hoy.filter((v) => !v.metodo_pago || v.metodo_pago === 'billete' || v.metodo_pago === 'efectivo').reduce((s, v) => s + v.total, 0);
  const totalMP = hoy.filter((v) => v.metodo_pago === 'mercadopago' || v.metodo_pago === 'mp').reduce((s, v) => s + v.total, 0);
  const totalDNI = hoy.filter((v) => v.metodo_pago === 'cuentadni' || v.metodo_pago === 'dni').reduce((s, v) => s + v.total, 0);

  const handleCerrarTurno = async () => {
    if (pendientes.length === 0) {
      Alert.alert('Sin ventas pendientes', 'No hay ventas del día para cerrar');
      return;
    }
    setClosing(true);
    try {
      const { movidas, total } = await confirmarCierre();
      const arqueoTotal =
        (parseFloat(efectivo.replace(',', '.')) || 0) +
        (parseFloat(mercadoPago.replace(',', '.')) || 0) +
        (parseFloat(cuentaDni.replace(',', '.')) || 0);
      const diff = arqueoTotal > 0 ? `Arqueo: $${arqueoTotal.toLocaleString('es-AR')} (dif. $${(arqueoTotal - total).toLocaleString('es-AR')})` : '';
      Alert.alert(
        'Caja cerrada',
        `${movidas} ventas por $${total.toLocaleString('es-AR')} registradas en Caja y Estadísticas.\n${diff}`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo cerrar la caja');
    } finally {
      setClosing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#0F172A" />
      </TouchableOpacity>
      <Text style={styles.title}>Cierre de caja</Text>
      <Text style={styles.subtitle}>Desglose real del día — se registrará al cerrar</Text>

      <View style={styles.resumenCard}>
        <Text style={styles.resumenTitle}>Ventas pendientes hoy</Text>
        <Text style={styles.resumenTotal}>${totalPendiente.toLocaleString('es-AR')}</Text>
        <Text style={styles.resumenCount}>{hoy.length} tickets pendientes</Text>
        <View style={styles.resumenBreakdown}>
          <View style={styles.breakdownChip}>
            <Text style={styles.chipLabel}>Efectivo</Text>
            <Text style={styles.chipValue}>${totalEfectivo.toLocaleString('es-AR')}</Text>
          </View>
          <View style={styles.breakdownChip}>
            <Text style={styles.chipLabel}>Mercado Pago</Text>
            <Text style={styles.chipValue}>${totalMP.toLocaleString('es-AR')}</Text>
          </View>
          <View style={styles.breakdownChip}>
            <Text style={styles.chipLabel}>Cuenta DNI</Text>
            <Text style={styles.chipValue}>${totalDNI.toLocaleString('es-AR')}</Text>
          </View>
        </View>
        {hoy.length === 0 && <Text style={styles.emptyText}>No hay ventas pendientes hoy</Text>}
      </View>

      <Text style={styles.sectionTitle}>Arqueo de cierre (opcional)</Text>

      <View style={styles.inputCard}>
        <View style={styles.iconWrapper}>
          <FontAwesome5 name="money-bill-wave" size={24} color="#10B981" />
        </View>
        <View style={styles.inputBody}>
          <Text style={styles.label}>Billetes (Efectivo en Caja)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="$ 0.00"
            placeholderTextColor="#94A3B8"
            value={efectivo}
            onChangeText={setEfectivo}
          />
        </View>
      </View>

      <View style={styles.inputCard}>
        <View style={[styles.iconWrapper, { backgroundColor: '#E0F2FE' }]}>
          <MaterialCommunityIcons name="qrcode-scan" size={24} color="#0284C7" />
        </View>
        <View style={styles.inputBody}>
          <Text style={styles.label}>Mercado Pago</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="$ 0.00"
            placeholderTextColor="#94A3B8"
            value={mercadoPago}
            onChangeText={setMercadoPago}
          />
        </View>
      </View>

      <View style={styles.inputCard}>
        <View style={[styles.iconWrapper, { backgroundColor: '#DCFCE7' }]}>
          <MaterialCommunityIcons name="cellphone-check" size={24} color="#16A34A" />
        </View>
        <View style={styles.inputBody}>
          <Text style={styles.label}>Cuenta DNI</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="$ 0.00"
            placeholderTextColor="#94A3B8"
            value={cuentaDni}
            onChangeText={setCuentaDni}
          />
        </View>
      </View>

      <TouchableOpacity style={[styles.submitBtn, closing && { opacity: 0.6 }]} activeOpacity={0.85} onPress={handleCerrarTurno} disabled={closing}>
        <Text style={styles.submitText}>{closing ? 'Cerrando...' : 'Cerrar Caja e Imprimir Resumen'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  backButton: { marginBottom: 16 },
  title: { fontFamily: 'Satoshi-Bold', fontSize: 24, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontFamily: 'Satoshi-Regular', fontSize: 14, color: '#64748B', marginBottom: 16 },
  resumenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  resumenTitle: { fontFamily: 'Satoshi-Bold', fontSize: 14, color: '#0F172A' },
  resumenTotal: { fontFamily: 'Satoshi-Bold', fontSize: 28, color: '#0F172A', marginTop: 4 },
  resumenCount: { fontFamily: 'Satoshi-Regular', fontSize: 12, color: '#64748B', marginTop: 2 },
  resumenBreakdown: { flexDirection: 'row', gap: 8, marginTop: 12 },
  breakdownChip: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, alignItems: 'center' },
  chipLabel: { fontFamily: 'Satoshi-Regular', fontSize: 11, color: '#64748B' },
  chipValue: { fontFamily: 'Satoshi-Bold', fontSize: 12, color: '#0F172A', marginTop: 2 },
  emptyText: { fontFamily: 'Satoshi-Regular', textAlign: 'center', color: '#94A3B8', marginTop: 12 },
  sectionTitle: { fontFamily: 'Satoshi-Bold', fontSize: 13, color: '#475569', marginBottom: 10, marginTop: 4 },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  inputBody: { flex: 1 },
  label: { fontFamily: 'Satoshi-Medium', fontSize: 13, fontWeight: '600', color: '#475569' },
  input: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingVertical: 4,
  },
  submitBtn: {
    backgroundColor: '#2547F4',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 20,
    elevation: 4,
  },
  submitText: { fontFamily: 'Satoshi-Bold', color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});