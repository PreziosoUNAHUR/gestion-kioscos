import { useCallback, useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, TextInput, Image } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from 'react-native-paper';
import { getProductos, type Producto } from '@/lib/db';

export default function VentaManualScreen() {
  const router = useRouter();
  const { preloadId } = useLocalSearchParams<{ preloadId?: string }>();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [query, setQuery] = useState('');
  const [cantidades, setCantidades] = useState<Record<number, number>>({});

  useFocusEffect(
    useCallback(() => {
      getProductos()
        .then((list) => {
          setProductos(list);
          const init: Record<number, number> = {};
          list.forEach((p) => (init[p.id] = 0));
          setCantidades((prev) => {
            const next = { ...init };
            Object.keys(prev).forEach((k) => {
              const id = Number(k);
              if (init[id] !== undefined && prev[id] > 0) next[id] = prev[id];
            });
            return next;
          });
        })
        .catch((err) => console.error(err));
    }, []),
  );

  useEffect(() => {
    if (preloadId) {
      const id = parseInt(preloadId, 10);
      if (!Number.isNaN(id)) setCantidades((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
    }
  }, [preloadId]);

  const filtered = productos.filter((p) => p.nombre.toLowerCase().includes(query.trim().toLowerCase()));

  const lines = productos.map((p) => ({ producto: p, qty: cantidades[p.id] ?? 0 })).filter((l) => l.qty > 0);
  const total = lines.reduce((s, l) => s + l.producto.precio_venta * l.qty, 0);

  const setQty = (id: number, qty: number) => {
    setCantidades((prev) => ({ ...prev, [id]: Math.max(0, qty) }));
  };

  const irACheckout = () => {
    if (lines.length === 0) {
      Alert.alert('Venta vacía', 'Tocá los productos para agregarlos');
      return;
    }
    for (const line of lines) {
      if (line.qty > line.producto.stock) {
        Alert.alert('Stock insuficiente', `Solo quedan ${line.producto.stock} de ${line.producto.nombre}`);
        return;
      }
    }
    router.push({
      pathname: '/venta-checkout',
      params: { cart: JSON.stringify(lines), total: String(total) },
    } as never);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Venta Manual</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchBox}>
        <Feather name="search" size={18} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar producto..."
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay productos</Text>}
        renderItem={({ item }) => {
          const qty = cantidades[item.id] ?? 0;
          const selected = qty > 0;
          return (
            <TouchableOpacity
              style={[styles.gridCard, selected && styles.gridCardSelected]}
              onPress={() => setQty(item.id, qty + 1)}
              activeOpacity={0.8}>
              <View style={styles.iconBox}>
                {item.imagen_uri ? (
                  <Image source={{ uri: item.imagen_uri }} style={styles.iconImage} />
                ) : (
                  <Ionicons name="cube" size={28} color={selected ? '#2547F4' : '#94A3B8'} />
                )}
              </View>
              <Text style={styles.gridName} numberOfLines={2}>
                {item.nombre}
              </Text>
              <Text style={styles.gridPrice}>${item.precio_venta}</Text>
              <Text style={styles.gridStock}>Stock {item.stock}</Text>
              {selected && (
                <View style={styles.qtyBadge}>
                  <TouchableOpacity onPress={() => setQty(item.id, qty - 1)} style={styles.qtyBtn}>
                    <Feather name="minus" size={14} color="#0F172A" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{qty}</Text>
                  <TouchableOpacity onPress={() => setQty(item.id, qty + 1)} style={styles.qtyBtnAdd}>
                    <Feather name="plus" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{lines.length} productos</Text>
          <Text style={styles.totalValue}>${total.toLocaleString('es-AR')}</Text>
        </View>
        <Button
          mode="contained"
          buttonColor="#2547F4"
          textColor="#FFFFFF"
          style={styles.confirmButton}
          contentStyle={styles.confirmContent}
          onPress={irACheckout}>
          Confirmar venta
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  title: { fontFamily: 'Satoshi-Bold', fontSize: 20, color: '#0F172A' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    gap: 10,
  },
  searchInput: { flex: 1, fontFamily: 'Satoshi-Regular', fontSize: 14, color: '#0F172A' },
  listContent: { paddingBottom: 160 },
  columnWrapper: { gap: 12 },
  emptyText: { fontFamily: 'Satoshi-Regular', textAlign: 'center', color: '#94A3B8', marginTop: 40 },
  gridCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
    minHeight: 148,
  },
  gridCardSelected: { borderColor: '#2547F4', backgroundColor: '#EEF2FF' },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  iconImage: { width: '100%', height: '100%' },
  gridName: { fontFamily: 'Satoshi-Bold', fontSize: 12, color: '#0F172A', textAlign: 'center', marginBottom: 4 },
  gridPrice: { fontFamily: 'Satoshi-Bold', fontSize: 14, color: '#2547F4' },
  gridStock: { fontFamily: 'Satoshi-Regular', fontSize: 11, color: '#64748B', marginTop: 2 },
  qtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qtyBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  qtyBtnAdd: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#2547F4', alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontFamily: 'Satoshi-Bold', fontSize: 14, color: '#0F172A', minWidth: 16, textAlign: 'center' },
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
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  totalLabel: { fontFamily: 'Satoshi-Medium', fontSize: 13, color: '#64748B' },
  totalValue: { fontFamily: 'Satoshi-Bold', fontSize: 18, color: '#0F172A' },
  confirmButton: { borderRadius: 12 },
  confirmContent: { paddingVertical: 6 },
});