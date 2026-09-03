import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getProductos, type Producto } from '@/lib/db';

const CATEGORIES = ['Todos', 'Golosinas', 'Bebidas', 'Cigarrillos', 'Snacks'];

export default function InventarioScreen() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('Todos');

  useFocusEffect(
    useCallback(() => {
      getProductos()
        .then(setProductos)
        .catch((err) => console.error(err));
    }, []),
  );

  const filtered = productos.filter((p) => p.nombre.toLowerCase().includes(query.trim().toLowerCase()));
  const totalValuation = productos.reduce((s, p) => s + p.precio_venta * p.stock, 0);
  const lowCount = productos.filter((p) => p.stock <= 5).length;

  const renderItem = ({ item }: { item: Producto }) => {
    const margin = item.precio_costo > 0 ? ((item.precio_venta - item.precio_costo) / item.precio_costo) * 100 : 0;
    const status =
      item.stock === 0 ? 'Quiebre inminente' : item.stock <= 3 ? 'Reponer pronto' : item.stock <= 5 ? 'Stock bajo' : 'Stock óptimo';
    const statusColor =
      item.stock === 0 ? '#EF4444' : item.stock <= 3 ? '#F59E0B' : item.stock <= 5 ? '#F59E0B' : '#10B981';
    return (
      <View style={styles.card}>
        <View style={styles.thumbnail}>
          {item.imagen_uri ? (
            <Image source={{ uri: item.imagen_uri }} style={styles.cardImage} />
          ) : (
            <Ionicons name="cube" size={26} color="#94A3B8" />
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.nombre}
          </Text>
          <Text style={styles.cardPrice}>${item.precio_venta.toLocaleString('es-AR')}</Text>
          <Text style={styles.cardMargin}>Margen {margin.toFixed(0)}% · Stock {item.stock}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: statusColor + '18', borderColor: statusColor + '30' }]}>
          <Text style={[styles.chipText, { color: statusColor }]}>{status}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Inventario y Stock</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.analyticRow}>
        <View style={styles.analyticCard}>
          <Text style={styles.analyticValue}>{productos.length}</Text>
          <Text style={styles.analyticLabel}>Ítems activos</Text>
        </View>
        <View style={styles.analyticCard}>
          <Text style={styles.analyticValue}>${totalValuation.toLocaleString('es-AR')}</Text>
          <Text style={styles.analyticLabel}>Valuación total</Text>
        </View>
        <View style={[styles.analyticCard, { backgroundColor: lowCount > 0 ? '#FEF2F2' : '#F0FDF4' }]}>
          <Text style={[styles.analyticValue, { color: lowCount > 0 ? '#EF4444' : '#10B981' }]}>{lowCount}</Text>
          <Text style={styles.analyticLabel}>Alertas críticas</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
        style={styles.pillsScroll}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.pill, cat === c && styles.pillActive]}
            onPress={() => setCat(c)}>
            <Text style={[styles.pillText, cat === c && styles.pillTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.searchContainer}>
        <Feather name="search" size={18} color="#64748B" style={styles.searchIcon} />
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
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {query ? 'No se encontraron productos' : 'Todavía no hay productos cargados'}
          </Text>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/nueva-carga' as never)}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontFamily: 'Satoshi-Bold', fontSize: 20, color: '#0F172A' },
  analyticRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  analyticCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  analyticValue: { fontFamily: 'Satoshi-Bold', fontSize: 18, color: '#0F172A' },
  analyticLabel: { fontFamily: 'Satoshi-Regular', fontSize: 11, color: '#64748B', marginTop: 2 },
  pillsScroll: { flexGrow: 0, marginBottom: 12 },
  pillsRow: { gap: 8, paddingRight: 16 },
  pill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  pillText: { fontFamily: 'Satoshi-Medium', fontSize: 13, color: '#475569' },
  pillTextActive: { color: '#FFFFFF' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontFamily: 'Satoshi-Regular', fontSize: 14, color: '#0F172A' },
  listContent: { paddingBottom: 90 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: '100%' },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: 'Satoshi-Bold', fontSize: 14, color: '#0F172A' },
  cardPrice: { fontFamily: 'Satoshi-Bold', fontSize: 16, color: '#2547F4', marginTop: 2 },
  cardMargin: { fontFamily: 'Satoshi-Regular', fontSize: 11, color: '#64748B', marginTop: 2 },
  chip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
  chipText: { fontFamily: 'Satoshi-Bold', fontSize: 10 },
  emptyText: { fontFamily: 'Satoshi-Regular', textAlign: 'center', color: '#94A3B8', marginTop: 40 },
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