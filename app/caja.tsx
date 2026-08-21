import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from 'react-native-paper';
import * as MailComposer from 'expo-mail-composer';

import { getVentas, registrarVenta, getProductos, actualizarStock, type Venta, type Producto } from '@/lib/db';

export default function CajaScreen() {
  const router = useRouter();
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [total, setTotal] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getVentas()
        .then(setVentas)
        .catch((err) => console.error(err));
    }, []),
  );

  const totalFacturado = ventas.reduce((sum, v) => sum + v.total, 0);

  const registrarCobro = async () => {
    const id = parseInt(productoId, 10);
    const qty = parseInt(cantidad, 10);
    const monto = parseFloat(total.replace(',', '.'));

    if (Number.isNaN(id) || Number.isNaN(qty) || Number.isNaN(monto)) {
      Alert.alert('Datos inválidos', 'Completá ID, cantidad y total');
      return;
    }

    setSaving(true);
    try {
      const productos = await getProductos();
      const producto = productos.find((p: Producto) => p.id === id);
      if (!producto) {
        Alert.alert('Producto no encontrado', `No existe el producto con ID ${id}`);
        return;
      }
      if (producto.stock < qty) {
        Alert.alert('Stock insuficiente', `Solo quedan ${producto.stock} unidades`);
        return;
      }

      await registrarVenta(monto);
      await actualizarStock(id, producto.stock - qty);

      setProductoId('');
      setCantidad('');
      setTotal('');
      const updated = await getVentas();
      setVentas(updated);
      Alert.alert('Venta registrada', 'Se descontó el stock correctamente');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo registrar la venta');
    } finally {
      setSaving(false);
    }
  };

  const formatAmount = (n: number) => `$${n.toLocaleString('es-AR')}`;

  const enviarReporteEmail = async () => {
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('No disponible', 'No hay app de email configurada en el dispositivo');
      return;
    }
    const body = [
      'Reporte de Caja',
      `Fecha: ${new Date().toLocaleDateString('es-AR')}`,
      `Total facturado: ${formatAmount(totalFacturado)}`,
      `Cantidad de ventas: ${ventas.length}`,
      '',
      'Detalle:',
      ...ventas.map(
        (v) =>
          `${new Date(v.fecha).toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          })} — ${formatAmount(v.total)}`,
      ),
    ].join('\n');

    await MailComposer.composeAsync({
      subject: `Reporte de caja ${new Date().toLocaleDateString('es-AR')}`,
      body,
      isHtml: false,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#212529" />
      </TouchableOpacity>

      <Text style={styles.title}>Caja</Text>

      {/* Registrar cobro */}
      <View style={styles.registerCard}>
        <Text style={styles.registerTitle}>Registrar venta</Text>
        <TextInput
          style={styles.input}
          placeholder="ID del producto"
          placeholderTextColor="#ADB5BD"
          keyboardType="numeric"
          value={productoId}
          onChangeText={setProductoId}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Cantidad"
            placeholderTextColor="#ADB5BD"
            keyboardType="numeric"
            value={cantidad}
            onChangeText={setCantidad}
          />
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Total ($)"
            placeholderTextColor="#ADB5BD"
            keyboardType="decimal-pad"
            value={total}
            onChangeText={setTotal}
          />
        </View>
        <Button
          mode="contained"
          buttonColor="#00B894"
          textColor="#FFFFFF"
          icon="cart"
          style={styles.registerButton}
          contentStyle={styles.registerContent}
          loading={saving}
          disabled={saving}
          onPress={registrarCobro}>
          Registrar cobro y descontar stock
        </Button>
      </View>

      {/* Total facturado hoy */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total facturado hoy</Text>
        <Text style={styles.totalValue}>{formatAmount(totalFacturado)}</Text>
        <Text style={styles.totalCount}>{ventas.length} ventas</Text>
      </View>

      {/* Historial */}
      <Text style={styles.sectionTitle}>Ventas del día</Text>
      {ventas.length === 0 ? (
        <Text style={styles.emptyText}>Todavía no hay ventas registradas</Text>
      ) : (
        ventas.map((venta) => (
          <View style={styles.saleRow} key={venta.id}>
            <View style={styles.saleIcon}>
              <Ionicons name="receipt" size={20} color="#6C757D" />
            </View>
            <Text style={styles.saleTime}>
              {new Date(venta.fecha).toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <Text style={styles.saleAmount}>{formatAmount(venta.total)}</Text>
          </View>
        ))
      )}

      {/* Email reporte */}
      <View style={styles.emailSection}>
        <Button
          mode="contained"
          buttonColor="#0984E3"
          textColor="#FFFFFF"
          icon="email"
          style={styles.emailButton}
          contentStyle={styles.emailContent}
          onPress={enviarReporteEmail}>
          Enviar reporte por email
        </Button>
      </View>

      <View style={styles.endSpace} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  content: {
    paddingBottom: 80,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: -1,
    marginBottom: 20,
  },
  registerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  registerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#212529',
    marginBottom: 14,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#212529',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  inputHalf: {
    flex: 1,
  },
  registerButton: {
    borderRadius: 14,
    marginTop: 4,
  },
  registerContent: {
    paddingVertical: 6,
  },
  totalCard: {
    backgroundColor: '#6C5CE7',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 6,
  },
  totalValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  totalCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6C757D',
    marginBottom: 12,
  },
  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  saleIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#F0F1F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  saleTime: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#212529',
  },
  saleAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#212529',
  },
  emptyText: {
    textAlign: 'center',
    color: '#ADB5BD',
    fontSize: 15,
    marginVertical: 20,
  },
  emailSection: {
    marginTop: 10,
  },
  emailButton: {
    borderRadius: 16,
    marginBottom: 15,
  },
  emailContent: {
    paddingVertical: 8,
  },
  endSpace: {
    height: 40,
  },
});