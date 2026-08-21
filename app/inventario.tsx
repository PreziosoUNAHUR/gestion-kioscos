import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { getProductos, type Producto } from '@/lib/db';

export default function InventarioScreen() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      getProductos()
        .then(setProductos)
        .catch((err) => console.error(err));
    }, []),
  );

  const filtered = productos.filter((p) =>
    p.nombre.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const renderItem = ({ item }: { item: Producto }) => {
    const lowStock = item.stock <= 5;
    return (
      <TouchableOpacity style={styles.card}>
        <View style={styles.thumbnail}>
          {item.imagen_uri ? (
            <Image source={{ uri: item.imagen_uri }} style={styles.cardImage} />
          ) : (
            <Ionicons name="cube" size={26} color="#ADB5BD" />
          )}
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.nombre}
          </Text>
          <Text style={styles.cardPrice}>${item.precio_venta}</Text>
        </View>
        <View style={styles.stockContainer}>
          <Text style={[styles.stockQty, lowStock && styles.stockQtyLow]}>{item.stock}</Text>
          <Text style={[styles.stockLabel, lowStock && styles.stockLabelLow]}>
            {lowStock ? 'Poco stock' : 'en stock'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#212529" />
      </TouchableOpacity>

      <View style={styles.headerRow}>
        <Text style={styles.title}>Inventario</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/agregar-stock' as never)}>
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={24} color="#6C757D" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="BUSCAR EN TU INVENTARIO..."
          placeholderTextColor="#ADB5BD"
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: -1,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#D63031',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D63031',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 13,
    marginBottom: 20,
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
  listContent: {
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  thumbnail: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#F0F1F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#6C5CE7',
  },
  stockContainer: {
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  stockQty: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00B894',
  },
  stockQtyLow: {
    color: '#D63031',
  },
  stockLabel: {
    fontSize: 11,
    color: '#ADB5BD',
    marginTop: 2,
  },
  stockLabelLow: {
    color: '#D63031',
  },
  emptyText: {
    textAlign: 'center',
    color: '#ADB5BD',
    fontSize: 15,
    marginTop: 40,
  },
});