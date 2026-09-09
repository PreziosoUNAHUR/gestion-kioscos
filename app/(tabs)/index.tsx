import { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList, ScrollView } from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getProductos, getVentas, type Producto, type Venta } from '@/lib/db';
import { useAppTheme } from '@/context/ThemeContext';

export default function HomeScreen() {
  const router = useRouter();
  const { isDark } = useAppTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Producto[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [lowStock, setLowStock] = useState<Producto[]>([]);
  const [ventasHoy, setVentasHoy] = useState<Venta[]>([]);
  const [totalHoy, setTotalHoy] = useState(0);

  const bg = isDark ? '#0F172A' : '#F8FAFC';
  const cardBg = isDark ? '#1E293B' : '#FFFFFF';
  const cardBorder = isDark ? '#334155' : '#E2E8F0';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const inputBg = isDark ? '#1E293B' : '#FFFFFF';
  const chipBg = isDark ? '#1E293B' : '#F8FAFC';

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
    <ScrollView style={[styles.container, { backgroundColor: bg }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: textSecondary }]}>Hola,</Text>
          <Text style={[styles.title, { color: textPrimary }]}>Gestor Kioskos</Text>
        </View>
      </View>

      <View style={styles.searchSticky}>
        <View style={[styles.searchContainer, { backgroundColor: inputBg, borderColor: cardBorder }]}>
          <Feather name="search" size={20} color={textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: textPrimary }]}
            placeholder="Buscar para vender..."
            placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            value={query}
            onChangeText={setQuery}
            onFocus={() => query.trim() && setShowResults(true)}
          />
          <TouchableOpacity
            style={[styles.scanBtn, { backgroundColor: isDark ? '#1E3A5F' : '#EFF6FF' }]}
            onPress={() => router.push('/venta-barras' as never)}>
            <MaterialCommunityIcons name="barcode-scan" size={22} color="#2547F4" />
          </TouchableOpacity>
        </View>
        {showResults && query.trim() && results.length > 0 && (
          <View style={[styles.resultsContainer, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <FlatList
              data={results}
              keyExtractor={(item) => String(item.id)}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.resultItem} onPress={() => onProductPress(item)}>
                  <Text style={[styles.resultName, { color: textPrimary }]} numberOfLines={1}>
                    {item.nombre}
                  </Text>
                  <Text style={styles.resultPrice}>${item.precio_venta} · stock {item.stock}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={[styles.resultSeparator, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]} />}
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

      <View style={[styles.cajaCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={styles.cajaHeader}>
          <Text style={[styles.cajaTitle, { color: textPrimary }]}>Caja en Curso</Text>
          <Text style={[styles.cajaTickets, { color: textSecondary }]}>{ventasHoy.length} tickets hoy</Text>
        </View>
        <Text style={styles.cajaTotal}>${totalHoy.toLocaleString('es-AR')}</Text>
        <View style={styles.cajaBreakdown}>
          <View style={[styles.cajaChip, { backgroundColor: chipBg }]}>
            <Text style={[styles.cajaChipLabel, { color: textSecondary }]}>Efectivo</Text>
            <Text style={[styles.cajaChipValue, { color: textPrimary }]}>${totalHoy.toLocaleString('es-AR')}</Text>
          </View>
          <View style={[styles.cajaChip, { backgroundColor: chipBg }]}>
            <Text style={[styles.cajaChipLabel, { color: textSecondary }]}>Mercado Pago</Text>
            <Text style={[styles.cajaChipValue, { color: textPrimary }]}>$0</Text>
          </View>
          <View style={[styles.cajaChip, { backgroundColor: chipBg }]}>
            <Text style={[styles.cajaChipLabel, { color: textSecondary }]}>Cuenta DNI</Text>
            <Text style={[styles.cajaChipValue, { color: textPrimary }]}>$0</Text>
          </View>
        </View>
      </View>

      {lowStock.length > 0 && (
        <View style={[styles.alertCard, { backgroundColor: isDark ? '#2D1B0F' : '#FFFBEB', borderColor: isDark ? '#92400E' : '#FDE68A' }]}>
          <View style={styles.alertHeader}>
            <Ionicons name="warning" size={18} color="#F59E0B" />
            <Text style={[styles.alertTitle, { color: isDark ? '#FDE68A' : '#92400E' }]}>Reposición inmediata</Text>
          </View>
          {lowStock.map((p) => (
            <View key={p.id} style={styles.alertRow}>
              <Text style={[styles.alertName, { color: isDark ? '#FDE68A' : '#78350F' }]} numberOfLines={1}>
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

      <View style={[styles.movimientosCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <Text style={[styles.movimientosTitle, { color: textPrimary }]}>Últimos movimientos</Text>
        {ventasHoy.slice(0, 3).map((v) => (
          <View key={v.id} style={styles.movRow}>
            <Text style={[styles.movTime, { color: textSecondary }]}>
              {new Date(v.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={[styles.movAmount, { color: textPrimary }]}>${v.total.toLocaleString('es-AR')}</Text>
          </View>
        ))}
        {ventasHoy.length === 0 && <Text style={[styles.emptyText, { color: textSecondary }]}>Sin movimientos hoy</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 100 },
  header: { marginBottom: 18 },
  greeting: { fontFamily: 'Satoshi-Regular', fontSize: 14 },
  title: { fontFamily: 'Satoshi-Bold', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  searchSticky: { marginBottom: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontFamily: 'Satoshi-Medium', fontSize: 15 },
  scanBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  resultsContainer: {
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  resultName: { fontFamily: 'Satoshi-Medium', fontSize: 15, flex: 1, marginRight: 12 },
  resultPrice: { fontFamily: 'Satoshi-Bold', fontSize: 13, color: '#2547F4' },
  resultSeparator: { height: 1, marginHorizontal: 16 },
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
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  cajaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cajaTitle: { fontFamily: 'Satoshi-Bold', fontSize: 16 },
  cajaTickets: { fontFamily: 'Satoshi-Medium', fontSize: 12 },
  cajaTotal: { fontFamily: 'Satoshi-Bold', fontSize: 32, color: '#10B981', fontWeight: '800' },
  cajaBreakdown: { flexDirection: 'row', gap: 8, marginTop: 12 },
  cajaChip: { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center' },
  cajaChipLabel: { fontFamily: 'Satoshi-Regular', fontSize: 11 },
  cajaChipValue: { fontFamily: 'Satoshi-Bold', fontSize: 13, marginTop: 2 },
  alertCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  alertTitle: { fontFamily: 'Satoshi-Bold', fontSize: 14 },
  alertRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  alertName: { fontFamily: 'Satoshi-Medium', fontSize: 13, flex: 1 },
  alertStock: { fontFamily: 'Satoshi-Bold', fontSize: 13, color: '#EF4444' },
  alertLink: { fontFamily: 'Satoshi-Medium', fontSize: 13, color: '#2547F4', marginTop: 8 },
  movimientosCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  movimientosTitle: { fontFamily: 'Satoshi-Bold', fontSize: 14, marginBottom: 12 },
  movRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  movTime: { fontFamily: 'Satoshi-Regular', fontSize: 13 },
  movAmount: { fontFamily: 'Satoshi-Bold', fontSize: 13 },
  emptyText: { fontFamily: 'Satoshi-Regular', textAlign: 'center', paddingVertical: 12 },
});