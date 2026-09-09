import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button, Dialog, Portal } from 'react-native-paper';
import { getProveedores, getProductos, getProductosByProveedor, asignarProveedorAProducto, type Proveedor, type Producto } from '@/lib/db';

export default function ProveedorDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const proveedorId = parseInt(String(id), 10);
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [asignados, setAsignados] = useState<Producto[]>([]);
  const [showAsignar, setShowAsignar] = useState(false);
  const [disponibles, setDisponibles] = useState<Producto[]>([]);

  const load = useCallback(async () => {
    const allProv = await getProveedores();
    const prov = allProv.find((p) => p.id === proveedorId) || null;
    setProveedor(prov);
    if (prov) {
      const list = await getProductosByProveedor(proveedorId);
      setAsignados(list);
    }
  }, [proveedorId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openAsignar = async () => {
    const all = await getProductos();
    const libres = all.filter((p) => !p.proveedor_id || p.proveedor_id !== proveedorId);
    setDisponibles(libres);
    setShowAsignar(true);
  };

  const asignar = async (productoId: number) => {
    await asignarProveedorAProducto(productoId, proveedorId);
    setShowAsignar(false);
    load();
  };

  const desasignar = async (productoId: number) => {
    await asignarProveedorAProducto(productoId, null);
    load();
  };

  if (!proveedor) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Proveedor no encontrado</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <StatusBar style="dark" />
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>{proveedor.nombre}</Text>
        <Text style={styles.subtitle}>WhatsApp: {proveedor.whatsapp || '—'} · {proveedor.productos || 'Sin notas'}</Text>

        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Productos del distribuidor</Text>
          <TouchableOpacity style={styles.asignarBtn} onPress={openAsignar}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.asignarText}>Asignar</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={asignados}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>No hay productos asignados a este proveedor</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.nombre}
                </Text>
                <Text style={styles.cardPrice}>${item.precio_venta} · Stock {item.stock}</Text>
              </View>
              <TouchableOpacity style={styles.removeBtn} onPress={() => desasignar(item.id)}>
                <Feather name="x" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      <Portal>
        <Dialog visible={showAsignar} onDismiss={() => setShowAsignar(false)} style={{ backgroundColor: '#FFFFFF' }}>
          <Dialog.Title style={{ color: '#0F172A', fontFamily: 'Satoshi-Bold' }}>Asignar producto</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={{ maxHeight: 320 }}>
              {disponibles.length === 0 ? (
                <Text style={styles.emptyText}>No hay productos disponibles</Text>
              ) : (
                disponibles.map((p) => (
                  <TouchableOpacity key={p.id} style={styles.assignRow} onPress={() => asignar(p.id)}>
                    <Text style={styles.assignName}>{p.nombre}</Text>
                    <Text style={styles.assignStock}>Stock {p.stock}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAsignar(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingTop: 60 },
  backButton: { marginBottom: 16 },
  title: { fontFamily: 'Satoshi-Bold', fontSize: 22, color: '#0F172A' },
  subtitle: { fontFamily: 'Satoshi-Regular', fontSize: 13, color: '#64748B', marginTop: 4, marginBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: 'Satoshi-Bold', fontSize: 16, color: '#0F172A' },
  asignarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2547F4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  asignarText: { fontFamily: 'Satoshi-Bold', fontSize: 13, color: '#FFFFFF' },
  listContent: { paddingBottom: 40 },
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
  removeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: 'Satoshi-Regular', textAlign: 'center', color: '#94A3B8', marginTop: 24 },
  assignRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  assignName: { fontFamily: 'Satoshi-Medium', fontSize: 14, color: '#0F172A', flex: 1 },
  assignStock: { fontFamily: 'Satoshi-Regular', fontSize: 12, color: '#64748B' },
});