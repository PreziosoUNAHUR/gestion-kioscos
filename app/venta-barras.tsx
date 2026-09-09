import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getProductos, getProductoByBarcode, type Producto } from '@/lib/db';
import { buscarEnOpenFoodFacts } from '@/lib/openFoodFacts';

type CartLine = { producto: Producto; qty: number };

export default function VentaBarrasScreen() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [code, setCode] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getProductos()
        .then(setProductos)
        .catch((err) => console.error(err));
    }, []),
  );

  const total = cart.reduce((s, l) => s + l.producto.precio_venta * l.qty, 0);

  const addByBarcode = async (barcode: string) => {
    let producto = await getProductoByBarcode(barcode);
    if (!producto) {
      const id = parseInt(barcode, 10);
      if (!Number.isNaN(id)) producto = productos.find((p) => p.id === id) || null;
    }
    if (producto) {
      setCart((prev) => {
        const existing = prev.find((l) => l.producto.id === producto!.id);
        if (existing) return prev.map((l) => (l.producto.id === producto!.id ? { ...l, qty: l.qty + 1 } : l));
        return [...prev, { producto: producto!, qty: 1 }];
      });
      return;
    }
    setLoading(true);
    try {
      const off = await buscarEnOpenFoodFacts(barcode);
      if (off.found) {
        Alert.alert('Producto Encontrado', `Internet dice que es: ${off.nombre}\nVamos a agregarle precio y stock.`, [
          {
            text: 'Continuar',
            onPress: () =>
              router.push({
                pathname: '/nueva-carga',
                params: { codigo_barras: barcode, nombre_sugerido: off.nombre, imagen_url: off.imagen_url || '' },
              } as never),
          },
        ]);
      } else {
        Alert.alert('Producto Desconocido', 'No se encontró en tu kiosco ni en internet. Deberás cargarlo manualmente.', [
          { text: 'Cargar Manual', onPress: () => router.push({ pathname: '/nueva-carga', params: { codigo_barras: barcode } } as never) },
        ]);
      }
    } catch {
      Alert.alert('Error de conexión', 'No se pudo buscar el producto en internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setScanning(false);
    addByBarcode(data);
    setTimeout(() => setScanned(false), 1500);
  };

  const agregar = () => {
    if (!code.trim()) return;
    addByBarcode(code.trim());
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
      Alert.alert('Carrito vacío', 'Escaneá un producto primero');
      return;
    }
    for (const line of cart) {
      if (line.qty > line.producto.stock) {
        Alert.alert('Stock insuficiente', `Solo quedan ${line.producto.stock} de ${line.producto.nombre}`);
        return;
      }
    }
    router.push({
      pathname: '/venta-checkout',
      params: { cart: JSON.stringify(cart.map((l) => ({ producto: l.producto, qty: l.qty }))), total: String(total) },
    } as never);
  };

  const startScan = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Permiso denegado', 'Necesitamos la cámara para leer códigos');
        return;
      }
    }
    setScanned(false);
    setScanning(true);
  };

  if (scanning) {
    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'code128', 'qr', 'upc_a'] }}
        />
        <View style={styles.scannerOverlay}>
          <Text style={styles.scannerText}>Apuntá al código de barras</Text>
          <TouchableOpacity style={styles.scannerClose} onPress={() => setScanning(false)}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#0F172A" />
      </TouchableOpacity>
      <Text style={styles.title}>Venta por Código de Barras</Text>
      <Text style={styles.subtitle}>La cámara detecta el código automáticamente</Text>

      <TouchableOpacity style={styles.scanCard} onPress={startScan}>
        <View style={styles.scanIcon}>
          <MaterialCommunityIcons name="barcode-scan" size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.scanTitle}>Escanear con Cámara</Text>
        <Text style={styles.scanSubtitle}>Detecta EAN-13, QR y Code128 al instante</Text>
      </TouchableOpacity>

      <View style={styles.manualBox}>
        <Ionicons name="keypad-outline" size={20} color="#64748B" />
        <TextInput
          style={styles.manualInput}
          placeholder="O ingresá el código manualmente"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={code}
          onChangeText={setCode}
          onSubmitEditing={agregar}
        />
        <TouchableOpacity style={styles.addBtn} onPress={agregar}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2547F4" />
          <Text style={styles.loadingText}>Buscando producto...</Text>
        </View>
      )}

      <FlatList
        data={cart}
        keyExtractor={(item) => String(item.producto.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="barcode" size={40} color="#E2E8F0" />
            <Text style={styles.emptyText}>Escaneá un código para agregar</Text>
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
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setQty(item.producto.id, item.qty - 1)}>
                <Ionicons name="remove" size={20} color="#2547F4" />
              </TouchableOpacity>
              <Text style={styles.stepperQty}>{item.qty}</Text>
              <TouchableOpacity style={styles.stepperBtn} onPress={() => setQty(item.producto.id, item.qty + 1)}>
                <Ionicons name="add" size={20} color="#2547F4" />
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
          buttonColor="#2547F4"
          textColor="#FFFFFF"
          icon="check"
          style={styles.confirmButton}
          contentStyle={styles.confirmContent}
          onPress={confirmar}>
          Confirmar venta
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingTop: 60 },
  backButton: { marginBottom: 16 },
  title: { fontFamily: 'Satoshi-Bold', fontSize: 24, color: '#0F172A' },
  subtitle: { fontFamily: 'Satoshi-Regular', fontSize: 13, color: '#64748B', marginBottom: 16 },
  scanCard: {
    backgroundColor: '#2547F4',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  scanIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scanTitle: { fontFamily: 'Satoshi-Bold', fontSize: 16, color: '#FFFFFF' },
  scanSubtitle: { fontFamily: 'Satoshi-Regular', fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  manualBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  manualInput: { flex: 1, height: 44, fontFamily: 'Satoshi-Medium', fontSize: 14, color: '#0F172A', marginLeft: 10 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2547F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { paddingBottom: 180 },
  emptyBox: { alignItems: 'center', marginTop: 30 },
  emptyText: { fontFamily: 'Satoshi-Regular', color: '#94A3B8', marginTop: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardInfo: { flex: 1 },
  cardName: { fontFamily: 'Satoshi-Bold', fontSize: 14, color: '#0F172A' },
  cardPrice: { fontFamily: 'Satoshi-Bold', fontSize: 13, color: '#2547F4', marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQty: { fontFamily: 'Satoshi-Bold', fontSize: 16, color: '#0F172A', minWidth: 24, textAlign: 'center' },
  footer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 6,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  totalLabel: { fontFamily: 'Satoshi-Medium', fontSize: 14, color: '#64748B' },
  totalValue: { fontFamily: 'Satoshi-Bold', fontSize: 22, color: '#0F172A' },
  confirmButton: { borderRadius: 12 },
  confirmContent: { paddingVertical: 6 },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  scannerOverlay: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scannerText: { fontFamily: 'Satoshi-Bold', color: '#FFFFFF', fontSize: 14, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8 },
  scannerClose: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  loadingBox: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  loadingText: { fontFamily: 'Satoshi-Medium', color: '#0F172A', marginTop: 8 },
});