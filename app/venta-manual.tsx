import { useCallback, useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from 'react-native-paper';

import { getProductos, realizarVenta, type Producto } from '@/lib/db';

export default function VentaManualScreen() {
  const router = useRouter();
  const { preloadId } = useLocalSearchParams<{ preloadId?: string }>();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cantidades, setCantidades] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getProductos()
        .then((list) => {
          setProductos(list);
          const init: Record<number, number> = {};
          list.forEach((p) => (init[p.id] = 0));
          setCantidades(init);
        })
        .catch((err) => console.error(err));
    }, []),
  );

  useEffect(() => {
    if (preloadId) {
      const id = parseInt(preloadId, 10);
      if (!Number.isNaN(id)) {
        setCantidades((prev) => ({ ...prev, [id]: 1 }));
      }
    }
  }, [preloadId]);

  const lines = productos
    .map((p) => ({ producto: p, qty: cantidades[p.id] ?? 0 }))
    .filter((l) => l.qty > 0);

  const total = lines.reduce((s, l) => s + l.producto.precio_venta * l.qty, 0);

  const setQty = (id: number, qty: number) => {
    setCantidades((prev) => ({ ...prev, [id]: Math.max(0, qty) }));
  };

  const confirmar = async () => {
    if (lines.length === 0) {
      Alert.alert('Venta vacía', 'Seleccioná productos para vender');
      return;
    }
    for (const line of lines) {
      if (line.qty > line.producto.stock) {
        Alert.alert(
          'Stock insuficiente',
          `Solo quedan ${line.producto.stock} de ${line.producto.nombre}`,
        );
        return;
      }
    }

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

      <Text style={styles.title}>Venta Manual</Text>

      <FlatList
        data={productos}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay productos cargados</Text>
        }
        renderItem={({ item }) => {
          const qty = cantidades[item.id] ?? 0;
          return (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.nombre}
                </Text>
                <Text style={styles.cardPrice}>${item.precio_venta}</Text>
                <Text style={styles.cardStock}>
                  Stock: {item.stock} · subtotal: ${item.precio_venta * qty}
                </Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setQty(item.id, qty - 1)}>
                  <Ionicons name="remove" size={20} color="#6C5CE7" />
                </TouchableOpacity>
                <Text style={styles.stepperQty}>{qty}</Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setQty(item.id, qty + 1)}>
                  <Ionicons name="add" size={20} color="#6C5CE7" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total}</Text>
        </View>
        <Button
          mode="contained"
          buttonColor="#6C5CE7"
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
  listContent: {
    paddingBottom: 220,
  },
  emptyText: {
    textAlign: 'center',
    color: '#ADB5BD',
    marginTop: 40,
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
    color: '#6C5CE7',
    marginTop: 2,
  },
  cardStock: {
    fontSize: 12,
    color: '#ADB5BD',
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
    backgroundColor: '#EDE9FB',
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