import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function CierreCajaScreen() {
  const router = useRouter();
  const [efectivo, setEfectivo] = useState('');
  const [mercadoPago, setMercadoPago] = useState('');
  const [cuentaDni, setCuentaDni] = useState('');

  const handleCerrarTurno = () => {
    if (!efectivo && !mercadoPago && !cuentaDni) {
      Alert.alert('Arqueo vacío', 'Ingresá al menos un valor para cerrar el turno');
      return;
    }
    const total =
      (parseFloat(efectivo.replace(',', '.')) || 0) +
      (parseFloat(mercadoPago.replace(',', '.')) || 0) +
      (parseFloat(cuentaDni.replace(',', '.')) || 0);
    Alert.alert(
      'Turno cerrado',
      `Total arqueado: $${total.toLocaleString('es-AR')}\n` +
        `Efectivo: $${efectivo || '0'}\nMP: $${mercadoPago || '0'}\nCuenta DNI: $${cuentaDni || '0'}`,
      [{ text: 'OK', onPress: () => router.back() }],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#0F172A" />
      </TouchableOpacity>
      <Text style={styles.title}>Cierre de Turno</Text>
      <Text style={styles.subtitle}>Ingresa el arqueo de valores al cierre</Text>

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

      <TouchableOpacity style={styles.submitBtn} activeOpacity={0.85} onPress={handleCerrarTurno}>
        <Text style={styles.submitText}>Cerrar Turno e Imprimir Resumen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 100 },
  backButton: { marginBottom: 16 },
  title: { fontFamily: 'Satoshi-Bold', fontSize: 24, fontWeight: '800', color: '#0F172A' },
  subtitle: { fontFamily: 'Satoshi-Regular', fontSize: 14, color: '#64748B', marginBottom: 20 },
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