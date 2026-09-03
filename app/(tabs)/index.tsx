import { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList, ScrollView } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getProductos, getVentas, type Producto, type Venta } from '@/lib/db';

export default function HomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Producto[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [lowStock, setLowStock] = useState<Producto[]>([]);
  const [ventasHoy, setVentasHoy] = useState<Venta[]>([]);
  const [totalHoy, setTotalHoy] = useState(0);

  const searchProducts = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const all = await getProductos();
    const filtered = all.filter((p) => p.nombre.toLowerCase().includes(text.toLowerCase()));
    setResults(filtered);
    setShowResults(filtered.length > 0);
  }, []);

  useEffect(() => {
    searchProducts(query);
  }, [query, searchProducts]);

  useFocusEffect(
    useCallback(() => {
      getProductos().then((all) => setLowStock(all.filter((p) => p.stock <= 5).slice(0, 3)));
      getVentas().then((all) => {
        const today = new Date().toISOString().slice(0, 10);
        const hoy = all.filter((v) => v.fecha.slice(0, 10) === today);
        setVentasHoy(hoy);
        setTotalHoy(hoy.reduce((s, v) => s + v.total, 0));
      });
    }, []),
  );

  const onProductPress = (p: Producto) => {
    router.push({ pathname: '/venta-manual', params: { preloadId: String(p.id) } } as never);
    setQuery('');
    setShowResults(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola,</Text>
          <Text style={styles.title}>Gestor Kioskos</Text>
        </View>
        <View style={styles.offlineBadge}>
          <View style={styles.offlineDot} />
          <Text style={styles.offlineText}>100% Offline / Local Activo</Text>
        </View>
      </View>

      <View style={styles.searchSticky}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar para vender..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            onFocus={() => query.trim() && setShowResults(true)}
          />
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => router.push('/venta-barras' as never)}>
            <MaterialCommunityIcons name="barcode-scan" size={22} color="#2547F4" />
          </TouchableOpacity>
        </View>
        {showResults && query.trim() && results.length > 0 && (
          <View style={styles.resultsContainer}>
            <FlatList
              data={results}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.resultItem} onPress={() => onProductPress(item)}>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {item.nombre}
                  </Text>
                  <Text style={styles.resultPrice}>${item.precio_venta} · stock {item.stock}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.resultSeparator} />}
            />
          </View>
        )}
      </View>

      <View style={styles.heroRow}>
        <TouchableOpacity
          style={[styles.heroCard, styles.heroVenta]}
          onPress={() => router.push('/venta' as never)}
          activeOpacity={0.85}>
          <View style={styles.heroIcon}>
            <Ionicons name="flash" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>Venta Rápida</Text>
          <Text style={styles.heroSubtitle}>[F1] Cobrar ahora</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.heroCard, styles.heroStock]}
          onPress={() => router.push('/agregar-stock' as never)}
          activeOpacity={0.85}>
          <View style={[styles.heroIcon, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
            <Ionicons name="add-circle" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.heroTitle}>Ingreso Stock</Text>
          <Text style={styles.heroSubtitle}>[+ Rápido]</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cajaCard}>
        <View style={styles.cajaHeader}>
          <Text style={styles.cajaTitle}>Caja en Curso</Text>
          <Text style={styles.cajaTickets}>{ventasHoy.length} tickets hoy</Text>
        </View>
        <Text style={styles.cajaTotal}>${totalHoy.toLocaleString('es-AR')}</Text>
        <View style={styles.cajaBreakdown}>
          <View style={styles.cajaChip}>
            <Text style={styles.cajaChipLabel}>Efectivo</Text>
            <Text style={styles.cajaChipValue}>${totalHoy.toLocaleString('es-AR')}</Text>
          </View>
          <View style={styles.cajaChip}>
            <Text style={styles.cajaChipLabel}>Mercado Pago</Text>
            <Text style={styles.cajaChipValue}>$0</Text>
          </View>
          <View style={styles.cajaChip}>
            <Text style={styles.cajaChipLabel}>Cuenta DNI</Text>
            <Text style={styles.cajaChipValue}>$0</Text>
          </View>
        </View>
      </View>

      {lowStock.length > 0 && (
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Ionicons name="warning" size={18} color="#F59E0B" />
            <Text style={styles.alertTitle}>Reposición inmediata</Text>
          </View>
          {lowStock.map((p) => (
            <View key={p.id} style={styles.alertRow}>
              <Text style={styles.alertName} numberOfLines={1}>
                {p.nombre}
              </Text>
              <Text style={styles.alertStock}>{p.stock} un.</Text>
            </View>
          ))}
          <TouchableOpacity onPress={() => router.push('/inventario' as never)}>
            <Text style={styles.alertLink}>Ver inventario →</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.movimientosCard}>
        <Text style={styles.movimientosTitle}>Últimos movimientos</Text>
        {ventasHoy.slice(0, 3).map((v) => (
          <View key={v.id} style={styles.movRow}>
            <Text style={styles.movTime}>
              {new Date(v.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={styles.movAmount}>${v.total.toLocaleString('es-AR')}</Text>
          </View>
        ))}
        {ventasHoy.length === 0 && <Text style={styles.emptyText}>Sin movimientos hoy</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  greeting: { fontFamily: 'Satoshi-Regular', fontSize: 14, color: '#64748B' },
  title: { fontFamily: 'Satoshi-Bold', fontSize: 26, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  offlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  offlineText: { fontFamily: 'Satoshi-Medium', fontSize: 11, color: '#15803D', fontWeight: '600' },
  searchSticky: { marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontFamily: 'Satoshi-Medium', fontSize: 15, color: '#0F172A' },
  scanBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  resultName: { fontFamily: 'Satoshi-Medium', fontSize: 15, color: '#0F172A', flex: 1, marginRight: 12 },
  resultPrice: { fontFamily: 'Satoshi-Bold', fontSize: 13, color: '#2547F4' },
  resultSeparator: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
  heroRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  heroCard: { flex: 1, borderRadius: 20, padding: 18, minHeight: 128, justifyContent: 'space-between' },
  heroVenta: { backgroundColor: '#2547F4' },
  heroStock: { backgroundColor: '#10B981' },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontFamily: 'Satoshi-Bold', fontSize: 16, color: '#FFFFFF', marginTop: 12 },
  heroSubtitle: { fontFamily: 'Satoshi-Medium', fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  cajaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cajaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cajaTitle: { fontFamily: 'Satoshi-Bold', fontSize: 16, color: '#0F172A' },
  cajaTickets: { fontFamily: 'Satoshi-Medium', fontSize: 12, color: '#64748B' },
  cajaTotal: { fontFamily: 'Satoshi-Bold', fontSize: 32, color: '#10B981', fontWeight: '800' },
  cajaBreakdown: { flexDirection: 'row', gap: 8, marginTop: 12 },
  cajaChip: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 10, alignItems: 'center' },
  cajaChipLabel: { fontFamily: 'Satoshi-Regular', fontSize: 11, color: '#64748B' },
  cajaChipValue: { fontFamily: 'Satoshi-Bold', fontSize: 13, color: '#0F172A', marginTop: 2 },
  alertCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  alertTitle: { fontFamily: 'Satoshi-Bold', fontSize: 14, color: '#92400E' },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  alertName: { fontFamily: 'Satoshi-Medium', fontSize: 13, color: '#78350F', flex: 1 },
  alertStock: { fontFamily: 'Satoshi-Bold', fontSize: 13, color: '#EF4444' },
  alertLink: { fontFamily: 'Satoshi-Medium', fontSize: 13, color: '#2547F4', marginTop: 8 },
  movimientosCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  movimientosTitle: { fontFamily: 'Satoshi-Bold', fontSize: 14, color: '#0F172A', marginBottom: 12 },
  movRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  movTime: { fontFamily: 'Satoshi-Regular', fontSize: 13, color: '#64748B' },
  movAmount: { fontFamily: 'Satoshi-Bold', fontSize: 13, color: '#0F172A' },
  emptyText: { fontFamily: 'Satoshi-Regular', textAlign: 'center', color: '#94A3B8', paddingVertical: 12 },
});