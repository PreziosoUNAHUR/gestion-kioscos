import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { getProductos, type Producto } from '@/lib/db';

export default function HomeScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Producto[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    searchProducts(query);
  }, [query, searchProducts]);

  const searchProducts = useCallback(async (text: string) => {
    if (!text.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const all = await getProductos();
    const filtered = all.filter((p) =>
      p.nombre.toLowerCase().includes(text.toLowerCase()),
    );
    setResults(filtered);
    setShowResults(filtered.length > 0);
  }, []);

  const onProductPress = (p: Producto) => {
    // Navega a venta manual con el producto ya seleccionado
    router.push({
      pathname: '/venta-manual',
      params: { preloadId: String(p.id) },
    } as never);
    setQuery('');
    setShowResults(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola,</Text>
        <Text style={styles.title}>¿Qué vendemos hoy?</Text>
      </View>

      {/* Buscador en vivo */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={24} color="#6C757D" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="BUSCAR PARA VENDER..."
          placeholderTextColor="#ADB5BD"
          value={query}
          onChangeText={setQuery}
          onFocus={() => setShowResults(true)}
          onBlur={() => setShowResults(false)}
        />
      </View>

      {/* Resultados en vivo */}
      {showResults && query.trim() && results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultItem} onPress={() => onProductPress(item)}>
                <Text style={styles.resultName} numberOfLines={1}>{item.nombre}</Text>
                <Text style={styles.resultPrice}>${item.precio_venta} · stock {item.stock}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.resultSeparator} />}
          />
        </View>
      )}

      {showResults && query.trim() && results.length === 0 && (
        <View style={styles.noResults}>
          <Text>No se encontró “{query}”</Text>
        </View>
      )}

      {/* Botones grandes */}
      <TouchableOpacity
        style={[styles.bigButton, styles.saleButton]}
        onPress={() => router.push('/venta' as never)}>
        <View style={styles.bigIcon}>
          <Ionicons name="cart" size={34} color="#FFFFFF" />
        </View>
        <View style={styles.bigTextContainer}>
          <Text style={styles.bigTitle}>Venta</Text>
          <Text style={styles.bigSubtitle}>Cobrar un producto del kiosco</Text>
        </View>
        <Ionicons name="chevron-forward" size={26} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.bigButton, styles.stockButton]}
        onPress={() => router.push('/agregar-stock' as never)}>
        <View style={styles.bigIcon}>
          <Ionicons name="add-circle" size={34} color="#FFFFFF" />
        </View>
        <View style={styles.bigTextContainer}>
          <Text style={styles.bigTitle}>Agregar Stock</Text>
          <Text style={styles.bigSubtitle}>Cargar productos al inventario</Text>
        </View>
        <Ionicons name="chevron-forward" size={26} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>
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
  header: {
    marginBottom: 25,
  },
  greeting: {
    fontSize: 16,
    color: '#6C757D',
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: -1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
  },
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    flex: 1,
    marginRight: 12,
  },
  resultPrice: {
    fontSize: 13,
    color: '#6C757D',
  },
  resultSeparator: {
    height: 1,
    backgroundColor: '#F0F1F4',
    marginHorizontal: 16,
  },
  noResults: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bigButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
  },
  saleButton: {
    backgroundColor: '#6C5CE7',
  },
  stockButton: {
    backgroundColor: '#00B894',
  },
  bigIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  bigTextContainer: {
    flex: 1,
  },
  bigTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  bigSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
});