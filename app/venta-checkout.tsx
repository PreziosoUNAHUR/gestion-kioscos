import {
  etiquetaMetodo,
  getClientes,
  parseMonto,
  realizarVenta,
  redondearDinero,
  StockInsuficienteError,
  toCents,
  VentaInvalidaError,
  type Cliente,
  type MetodoPago,
  type Producto,
} from '@/lib/db';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Button, Dialog, Portal } from 'react-native-paper';

type CartLine = { producto: Producto; qty: number };

export default function VentaCheckoutScreen() {
  const router = useRouter();
  const { cart: cartParam } = useLocalSearchParams<{ cart?: string; total?: string }>();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);
  const [montoPagado, setMontoPagado] = useState('');
  const [faltaFiado, setFaltaFiado] = useState(0);
  const [showFiado, setShowFiado] = useState(false);
  const [showPago, setShowPago] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [saving, setSaving] = useState(false);

  // Guard síncrono anti doble toque y flag de venta ya completada
  const busyRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!cartParam) return;
    try {
      const parsed = JSON.parse(cartParam);
      if (Array.isArray(parsed)) {
        setLines(
          parsed.filter(
            (l): l is CartLine =>
              l &&
              typeof l.qty === 'number' &&
              l.qty > 0 &&
              l.producto &&
              typeof l.producto.id === 'number',
          ),
        );
      }
    } catch (err) {
      console.error('Error al leer el carrito:', err);
      Alert.alert('Error', 'No se pudo cargar el carrito de la venta.');
    }
  }, [cartParam]);

  // Cálculo del total en centavos para evitar el bug de punto flotante (ej. 33.7 * 3 = 101.10000000000001)
  const total = useMemo(() => {
    const totalCents = lines.reduce(
      (sumCents, l) => sumCents + toCents(l.producto.precio_venta) * l.qty,
      0,
    );
    return redondearDinero(totalCents / 100);
  }, [lines]);

  // Cálculo en vivo de vuelto o monto inválido para ayudar al kiosquero
  const estadoMonto = useMemo(() => {
    const raw = montoPagado.trim();
    if (!raw) return { valido: true, pagado: total, vuelto: 0, falta: 0 };
    const parsed = parseMonto(raw);
    if (parsed === null) return { valido: false, pagado: 0, vuelto: 0, falta: 0 };
    const diffCents = toCents(parsed) - toCents(total);
    return {
      valido: true,
      pagado: redondearDinero(parsed),
      vuelto: diffCents > 0 ? redondearDinero(diffCents / 100) : 0,
      falta: diffCents < 0 ? redondearDinero(Math.abs(diffCents) / 100) : 0,
    };
  }, [montoPagado, total]);

  const setQty = useCallback((id: number, qty: number) => {
    if (busyRef.current || completedRef.current) return;
    if (qty <= 0) {
      setLines((prev) => prev.filter((l) => l.producto.id !== id));
    } else {
      setLines((prev) => prev.map((l) => (l.producto.id === id ? { ...l, qty } : l)));
    }
  }, []);

  const runExclusive = async (fn: () => Promise<void>) => {
    if (busyRef.current || completedRef.current) return;
    busyRef.current = true;
    setSaving(true);
    try {
      await fn();
    } finally {
      // Si la venta ya se completó, mantenemos bloqueado el botón mientras está el Alert en pantalla
      if (!completedRef.current) {
        busyRef.current = false;
        setSaving(false);
      }
    }
  };

  const mostrarErrorVenta = (err: unknown) => {
    console.error(err);
    if (err instanceof StockInsuficienteError || err instanceof VentaInvalidaError) {
      Alert.alert('No se pudo registrar la venta', err.message);
      return;
    }
    if (err instanceof Error && err.message) {
      Alert.alert('Error', err.message);
      return;
    }
    Alert.alert('Error', 'No se pudo completar la venta.');
  };

  const onConfirmarPress = () => {
    if (busyRef.current || completedRef.current) return;
    if (lines.length === 0) {
      Alert.alert('Carrito vacío', 'No hay productos en la venta.');
      return;
    }
    if (!estadoMonto.valido) {
      Alert.alert('Monto inválido', 'Ingresá un monto pagado válido (o dejalo vacío para cobrar el total).');
      return;
    }
    for (const line of lines) {
      if (line.qty > line.producto.stock) {
        Alert.alert('Stock insuficiente', `Solo quedan ${line.producto.stock} de ${line.producto.nombre}`);
        return;
      }
    }
    setShowPago(true);
  };

  const onPagoSelect = async (m: MetodoPago) => {
    if (busyRef.current || completedRef.current) return;
    setMetodo(m);
    setShowPago(false);
    await confirmar(m);
  };

  const confirmar = async (metodoElegido: MetodoPago = metodo || 'billete') => {
    if (!estadoMonto.valido) {
      Alert.alert('Monto inválido', 'Revisá el monto ingresado antes de continuar.');
      return;
    }

    if (estadoMonto.falta > 0) {
      const falta = estadoMonto.falta;
      Alert.alert(
        'Pago incompleto',
        `Faltan $${falta.toLocaleString('es-AR')}. ¿Querés cargarlo a fiado?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Cargar a fiado',
            onPress: async () => {
              try {
                const lista = await getClientes();
                setFaltaFiado(falta);
                setClientes(lista);
                setShowFiado(true);
              } catch (err) {
                mostrarErrorVenta(err);
              }
            },
          },
        ],
      );
      return;
    }

    await runExclusive(() => finalizarVenta(metodoElegido, estadoMonto.vuelto));
  };

  const finalizarVenta = async (metodoFinal: MetodoPago = metodo || 'billete', vuelto = 0) => {
    try {
      await realizarVenta(
        lines.map((l) => ({
          productoId: l.producto.id,
          cantidad: l.qty,
        })),
        metodoFinal,
      );
      completedRef.current = true;
      const detalleVuelto = vuelto > 0 ? `\nVuelto: $${vuelto.toLocaleString('es-AR')}` : '';
      Alert.alert(
        'Venta registrada',
        `Total $${total.toLocaleString('es-AR')} cobrado con ${etiquetaMetodo(metodoFinal)}${detalleVuelto}`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)' as never) }],
        { cancelable: false },
      );
    } catch (err) {
      mostrarErrorVenta(err);
    }
  };

  const elegirClienteFiado = async (cliente: Cliente) => {
    if (busyRef.current || completedRef.current) return;
    setShowFiado(false);
    const falta = faltaFiado > 0 ? faltaFiado : estadoMonto.falta;
    if (falta <= 0) return;
    await runExclusive(() => finalizarVentaConFiado(cliente, falta));
  };

  const finalizarVentaConFiado = async (cliente: Cliente, falta: number) => {
    const metodoFinal: MetodoPago = metodo || 'billete';
    try {
      await realizarVenta(
        lines.map((l) => ({
          productoId: l.producto.id,
          cantidad: l.qty,
        })),
        metodoFinal,
        { clienteId: cliente.id, monto: falta },
      );
      completedRef.current = true;
      const cobradoHoy = redondearDinero(total - falta);
      Alert.alert(
        'Venta y fiado registrados',
        `Cobrado: $${cobradoHoy.toLocaleString('es-AR')} (${etiquetaMetodo(metodoFinal)})\nFiado a ${cliente.nombre}: $${falta.toLocaleString('es-AR')}`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)' as never) }],
        { cancelable: false },
      );
    } catch (err) {
      mostrarErrorVenta(err);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.header}>
          <TouchableOpacity disabled={saving} onPress={() => router.back()}>
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
                <Text style={styles.cardPrice}>
                  ${item.producto.precio_venta.toLocaleString('es-AR')} x {item.qty}
                </Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  disabled={saving}
                  onPress={() => setQty(item.producto.id, item.qty - 1)}>
                  <Feather name="minus" size={16} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.stepperQty}>{item.qty}</Text>
                <TouchableOpacity
                  style={[styles.stepperBtn, styles.stepperBtnAdd]}
                  disabled={saving}
                  onPress={() => setQty(item.producto.id, item.qty + 1)}>
                  <Feather name="plus" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListHeaderComponent={
            <View>
              {metodo && (
                <View style={styles.metodoBadge}>
                  <Text style={styles.metodoBadgeText}>Pagando con: {etiquetaMetodo(metodo)}</Text>
                </View>
              )}
              <TextInput
                style={[styles.input, !estadoMonto.valido && styles.inputError]}
                placeholder={`Monto pagado (total $${total.toLocaleString('es-AR')}) — vacío = total completo`}
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
                editable={!saving}
                value={montoPagado}
                onChangeText={setMontoPagado}
              />
              {!estadoMonto.valido && (
                <Text style={styles.helperError}>Ingresá un número válido mayor o igual a 0</Text>
              )}
              {estadoMonto.valido && estadoMonto.vuelto > 0 && (
                <Text style={styles.vueltoText}>
                  Vuelto a entregar: ${estadoMonto.vuelto.toLocaleString('es-AR')}
                </Text>
              )}
              {estadoMonto.valido && estadoMonto.falta > 0 && (
                <Text style={styles.faltaText}>
                  Restan ${estadoMonto.falta.toLocaleString('es-AR')} (se cargará a fiado)
                </Text>
              )}
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
            disabled={saving || lines.length === 0}
            onPress={onConfirmarPress}>
            Finalizar
          </Button>
        </View>
      </View>

      <Portal>
        <Dialog
          style={{ backgroundColor: '#FFFFFF' }}
          visible={showPago}
          onDismiss={() => !saving && setShowPago(false)}>
          <Dialog.Title style={[styles.dialogTitle, { color: '#0F172A' }]}>
            ¿Cómo te están pagando?
          </Dialog.Title>
          <Dialog.Content>
            <TouchableOpacity
              style={styles.pagoOption}
              disabled={saving}
              onPress={() => onPagoSelect('billete')}>
              <Ionicons name="cash-outline" size={22} color="#10B981" />
              <Text style={styles.pagoOptionText}>Billete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pagoOption}
              disabled={saving}
              onPress={() => onPagoSelect('mercadopago')}>
              <Ionicons name="qr-code-outline" size={22} color="#0284C7" />
              <Text style={styles.pagoOptionText}>Mercado Pago</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.pagoOption}
              disabled={saving}
              onPress={() => onPagoSelect('cuentadni')}>
              <Ionicons name="phone-portrait-outline" size={22} color="#16A34A" />
              <Text style={styles.pagoOptionText}>Cuenta DNI</Text>
            </TouchableOpacity>
          </Dialog.Content>
          <Dialog.Actions>
            <Button disabled={saving} onPress={() => setShowPago(false)}>
              <Text style={{ color: '#0F172A', fontFamily: 'Satoshi-Medium' }}>Cancelar</Text>
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          style={{ backgroundColor: '#FFFFFF' }}
          visible={showFiado}
          onDismiss={() => !saving && setShowFiado(false)}>
          <Dialog.Title style={[styles.dialogTitle, { color: '#0F172A' }]}>
            Elegí el cliente para fiado
          </Dialog.Title>
          <Dialog.Content>
            {clientes.length === 0 ? (
              <Text style={styles.emptyText}>No hay clientes cargados</Text>
            ) : (
              clientes.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.clienteRow}
                  disabled={saving}
                  onPress={() => elegirClienteFiado(c)}>
                  <Text style={styles.clienteName}>{c.nombre}</Text>
                  <Text style={styles.clienteDeuda}>Debe ${c.deuda.toLocaleString('es-AR')}</Text>
                </TouchableOpacity>
              ))
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button disabled={saving} onPress={() => setShowFiado(false)}>
              <Text style={{ color: '#0F172A', fontFamily: 'Satoshi-Medium' }}>Cancelar</Text>
            </Button>
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
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  helperError: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 12,
    color: '#EF4444',
    marginBottom: 8,
  },
  vueltoText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#16A34A',
    textAlign: 'right',
    marginBottom: 4,
  },
  faltaText: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: '#D97706',
    textAlign: 'right',
    marginBottom: 4,
  },
  totalText: { fontFamily: 'Satoshi-Bold', fontSize: 16, color: '#0F172A', textAlign: 'right', marginBottom: 12 },
  metodoBadge: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  metodoBadgeText: { fontFamily: 'Satoshi-Bold', fontSize: 13, color: '#2547F4' },
  pagoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pagoOptionText: { fontFamily: 'Satoshi-Medium', fontSize: 15, color: '#0F172A' },
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