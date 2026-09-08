import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button, Dialog, Portal } from 'react-native-paper';
import { realizarVenta, getClientes, actualizarDeuda, type Producto, type Cliente } from '@/lib/db';

type CartLine = { producto: Producto; qty: number };

export default function VentaCheckoutScreen() {
  const router = useRouter();
  const { cart: cartParam } = useLocalSearchParams<{ cart?: string; total?: string }>();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [metodo, setMetodo] = useState<'efectivo' | 'mp' | 'dni'>('efectivo');
  const [montoPagado, setMontoPagado] = useState('');
  const [showFiado, setShowFiado] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cartParam) {
      try {
        setLines(JSON.parse(cartParam));
      } catch {}
    }
  }, [cartParam]);

  const total = lines.reduce((s, l) => s + l.producto.precio_venta * l.qty, 0);

  const setQty = (id: number, qty: number) => {
    if (qty <= 0) {
      setLines((prev) => prev.filter((l) => l.producto.id !== id));
    } else {
      setLines((prev) => prev.map((l) => (l.producto.id === id ? { ...l, qty } : l)));
    }
  };

  const confirmar = async () => {
    if (lines.length === 0) {
      Alert.alert('Carrito vacío', 'No hay productos');
      return;
    }
    for (const line of lines) {
      if (line.qty > line.producto.stock) {
        Alert.alert('Stock insuficiente', `Solo quedan ${line.producto.stock} de ${line.producto.nombre}`);
        return;
      }
    }
    const pagado = parseFloat(montoPagado.replace(',', '.')) || 0;
    if (pagado < total) {
      const falta = total - pagado;
      Alert.alert(
        'Pago incompleto',
        `Faltan $${falta.toLocaleString('es-AR')}. ¿Querés cargarlo a fiado?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cargar a fiado',
            onPress: async () => {
              const lista = await getClientes();
              setClientes(lista);
              setShowFiado(true);
            },
          },
        ],
      );
      return;
    }
    await finalizarVenta();
  };

  const finalizarVenta = async (clienteFiado?: Cliente) => {
    setSaving(true);
    try {
      const pagado = parseFloat(montoPagado.replace(',', '.')) || total;
      const falta = Math.max(0, total - pagado);
      await realizarVenta(
        lines.map((l) => ({
          productoId: l.producto.id,
          cantidad: l.qty,
          subtotal: l.producto.precio_venta * l.qty,
          nuevoStock: l.producto.stock - l.qty,
        })),
      );
      if (falta > 0 && clienteFiado) {
        await actualizarDeuda(clienteFiado.id, clienteFiado.deuda + falta);
        Alert.alert('Venta y fiado registrados', `Fiado $${falta} a ${clienteFiado.nombre}`, [
          { text: 'OK', onPress: () => router.replace('/(tabs)' as never) },
        ]);
      } else {
        Alert.alert('Venta registrada', `Total $${total} cobrado con ${metodo}`, [
          { text: 'OK', onPress: () => router.replace('/(tabs)' as never) },
        ]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo completar la venta');
    } finally {
      setSaving(false);
    }
  };

  const elegirClienteFiado = async (cliente: Cliente) => {
    setShowFiado(false);
    const pagado = parseFloat(montoPagado.replace(',', '.')) || 0;
    const falta = total - pagado;
    await finalizarVentaConFiado(cliente, falta);
  };

  const finalizarVentaConFiado = async (cliente: Cliente, falta: number) => {
    setSaving(true);
    try {
      await realizarVenta(
        lines.map((l) => ({
          productoId: l.producto.id,
          cantidad: l.qty,
          subtotal: l.producto.precio_venta * l.qty,
          nuevoStock: l.producto.stock - l.qty,
        })),
      );
      await actualizarDeuda(cliente.id, cliente.deuda + falta);
      Alert.alert('Venta y fiado registrados', `Fiado $${falta} a ${cliente.nombre}`, [
        { text: 'OK', onPress: () => router.replace('/(tabs)' as never) },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo completar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.title}>Confirmar Venta</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={lines}
          keyExtractor={(item) => String(item.producto.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.producto.nombre}
                </Text>
                <Text style={styles.cardPrice}>${item.producto.precio_venta} x {item.qty}</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity style={styles.stepperBtn} onPress={() => setQty(item.producto.id, item.qty - 1)}>
                  <Feather name="minus" size={16} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.stepperQty}>{item.qty}</Text>
                <TouchableOpacity style={[styles.stepperBtn, styles.stepperBtnAdd]} onPress={() => setQty(item.producto.id, item.qty + 1)}>
                  <Feather name="plus" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListHeaderComponent={
            <View>
              <Text style={styles.sectionTitle}>¿Cómo te están pagando?</Text>
              <View style={styles.pagoRow}>
                {[
                  { id: 'efectivo', label: 'Efectivo' },
                  { id: 'mp', label: 'Mercado Pago' },
                  { id: 'dni', label: 'Cuenta DNI' },
                ].map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.pagoBtn, metodo === m.id && styles.pagoBtnActive]}
                    onPress={() => setMetodo(m.id as any)}>
                    <Text style={[styles.pagoText, metodo === m.id && styles.pagoTextActive]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder={`Monto pagado (total $${total})`}
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                value={montoPagado}
                onChangeText={setMontoPagado}
              />
              <Text style={styles.totalText}>Total: ${total.toLocaleString('es-AR')}</Text>
            </View>
          }
        />

        <View style={styles.footer}>
          <Button
            mode="contained"
            buttonColor="#2547F4"
            textColor="#FFFFFF"
            style={styles.confirmButton}
            contentStyle={styles.confirmContent}
            loading={saving}
            disabled={saving}
            onPress={confirmar}>
            Confirmar venta
          </Button>
        </View>
      </View>

      <Portal>
        <Dialog visible={showFiado} onDismiss={() => setShowFiado(false)}>
          <Dialog.Title style={styles.dialogTitle}>Elegí el cliente para fiado</Dialog.Title>
          <Dialog.Content>
            {clientes.length === 0 ? (
              <Text style={styles.emptyText}>No hay clientes cargados</Text>
            ) : (
              clientes.map((c) => (
                <TouchableOpacity key={c.id} style={styles.clienteRow} onPress={() => elegirClienteFiado(c)}>
                  <Text style={styles.clienteName}>{c.nombre}</Text>
                  <Text style={styles.clienteDeuda}>Debe ${c.deuda}</Text>
                </TouchableOpacity>
              ))
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowFiado(false)}>Cancelar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontFamily: 'Satoshi-Bold', fontSize: 20, color: '#0F172A' },
  listContent: { paddingBottom: 160 },
  sectionTitle: { fontFamily: 'Satoshi-Bold', fontSize: 14, color: '#0F172A', marginBottom: 10, marginTop: 8 },
  pagoRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  pagoBtn: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  pagoBtnActive: { backgroundColor: '#2547F4', borderColor: '#2547F4' },
  pagoText: { fontFamily: 'Satoshi-Medium', fontSize: 12, color: '#475569' },
  pagoTextActive: { color: '#FFFFFF' },
  input: {
    fontFamily: 'Satoshi-Regular',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  totalText: { fontFamily: 'Satoshi-Bold', fontSize: 16, color: '#0F172A', textAlign: 'right', marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: 'Satoshi-Bold', fontSize: 14, color: '#0F172A' },
  cardPrice: { fontFamily: 'Satoshi-Regular', fontSize: 12, color: '#64748B', marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  stepperBtnAdd: { backgroundColor: '#2547F4' },
  stepperQty: { fontFamily: 'Satoshi-Bold', fontSize: 14, color: '#0F172A', minWidth: 16, textAlign: 'center' },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 6,
  },
  confirmButton: { borderRadius: 12 },
  confirmContent: { paddingVertical: 6 },
  dialogTitle: { fontFamily: 'Satoshi-Bold' },
  emptyText: { fontFamily: 'Satoshi-Regular', color: '#94A3B8', textAlign: 'center' },
  clienteRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  clienteName: { fontFamily: 'Satoshi-Bold', fontSize: 14, color: '#0F172A' },
  clienteDeuda: { fontFamily: 'Satoshi-Regular', fontSize: 13, color: '#EF4444' },
});