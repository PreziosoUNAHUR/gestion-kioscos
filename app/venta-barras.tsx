import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from 'react-native-paper';

import { getProductos, realizarVenta, type Producto } from '@/lib/db';

type CartLine = { producto: Producto; qty: number };

export default function VentaBarrasScreen() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [code, setCode] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getProductos()
        .then(setProductos)
        .catch((err) => console.error(err));
    }, []),
  );

  const total = cart.reduce((s, l) => s + l.producto.precio_venta * l.qty, 0);

  const agregar = () => {
    const id = parseInt(code.trim(), 10);
    if (Number.isNaN(id)) {
      Alert.alert('Código inválido', 'Ingresá un código de producto válido');
      return;
    }
    const producto = productos.find((p) => p.id === id);
    if (!producto) {
      Alert.alert('No encontrado', `No existe el producto con código ${id}`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((l) => l.producto.id === id);
      if (existing) {
        return prev.map((l) =>
          l.producto.id === id ? { ...l, qty: l.qty + 1 } : l,
        );
      }
      return [...prev, { producto, qty: 1 }];
    });
    setCode('');
  };

  const setQty = (id: number, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((l) => l.producto.id !== id));
      return;
    }
    setCart((prev) => prev.map((l) => (l.producto.id === id ? { ...l, qty } : l)));
  };

  const confirmar = async () => {
    if (cart.length === 0) {
      Alert.alert('Carrito vacío', 'Escaneá o ingresá un producto primero');
      return;
    }
    for (const line of cart) {
      if (line.qty > line.producto.stock) {
        Alert.alert('Stock insuficiente', `Solo quedan ${line.producto.stock} de ${line.producto.nombre}`);
        return;
      }
    }

    setSaving(true);
    try {
      await realizarVenta(
        cart.map((l) => ({
          productoId: l.producto.id,
          cantidad: l.qty,
          subtotal: l.producto.precio_venta * l.qty,
          nuevoStock: l.producto.stock - l.qty,
        })),
      );
      setCart([]);
      Alert.alert('¡Venta registrada!', `Total: $${total}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo completar la venta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#212529" />
      </TouchableOpacity>

      <Text style={styles.title}>Venta por Barras</Text>

      <View style={styles.scanBox}>
        <Ionicons name="barcode-outline" size={26} color="#00B894" />
        <TextInput
          style={styles.scanInput}
          placeholder="Ingresá o escaneá el código"
          placeholderTextColor="#ADB5BD"
          keyboardType="numeric"
          value={code}
          onChangeText={setCode}
          onSubmitEditing={agregar}
          autoFocus
        />
        <TouchableOpacity style={styles.scanBtn} onPress={agregar}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item) => String(item.producto.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="barcode" size={40} color="#DEE2E6" />
            <Text style={styles.emptyText}>El carrito está vacío</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.producto.nombre}
              </Text>
              <Text style={styles.cardPrice}>${item.producto.precio_venta}</Text>
            </View>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setQty(item.producto.id, item.qty - 1)}>
                <Ionicons name="remove" size={20} color="#00B894" />
              </TouchableOpacity>
              <Text style={styles.stepperQty}>{item.qty}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setQty(item.producto.id, item.qty + 1)}>
                <Ionicons name="add" size={20} color="#00B894" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total}</Text>
        </View>
        <Button
          mode="contained"
          buttonColor="#00B894"
          textColor="#FFFFFF"
          icon="checkmark-done"
          style={styles.confirmButton}
          contentStyle={styles.confirmContent}
          loading={saving}
          disabled={saving}
          onPress={confirmar}>
          Confirmar venta
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: -1,
    marginBottom: 15,
  },
  scanBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scanInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginLeft: 12,
  },
  scanBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingBottom: 220,
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#ADB5BD',
    marginTop: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#212529',
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#00B894',
    marginTop: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E2F5EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQty: {
    fontSize: 18,
    fontWeight: '800',
    color: '#212529',
    minWidth: 24,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6C757D',
  },
  totalValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#212529',
  },
  confirmButton: {
    borderRadius: 14,
  },
  confirmContent: {
    paddingVertical: 6,
  },
});