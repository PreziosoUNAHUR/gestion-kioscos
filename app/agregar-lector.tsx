import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from 'react-native-paper';
import { useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getProductos, getProductoByBarcode, agregarStock, type Producto } from '@/lib/db';

export default function AgregarLectorScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [producto, setProducto] = useState<Producto | null>(null);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  const buscar = async (barcode?: string) => {
    const target = barcode ?? code.trim();
    if (!target) return;
    let found = await getProductoByBarcode(target);
    if (!found) {
      const id = parseInt(target, 10);
      if (!Number.isNaN(id)) {
        const all = await getProductos();
        found = all.find((p) => p.id === id) || null;
      }
    }
    if (found) {
      setProducto(found);
      setCode(target);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${target}.json`);
      const data = await res.json();
      if (data.status === 1) {
        const nombreProducto = data.product.product_name || data.product.product_name_es || '';
        const marca = data.product.brands || '';
        const nombreCompleto = marca ? `${marca} ${nombreProducto}`.trim() : nombreProducto;
        Alert.alert(
          'Producto Encontrado',
          `Internet dice que es: ${nombreCompleto}\nVamos a agregarle precio y stock.`,
          [
            {
              text: 'Continuar',
              onPress: () =>
                router.push({
                  pathname: '/nueva-carga',
                  params: { codigo_barras: target, nombre_sugerido: nombreCompleto, imagen_url: data.product.image_url || '' },
                } as never),
            },
          ],
        );
      } else {
        Alert.alert('Producto Desconocido', 'No se encontró en tu kiosco ni en internet. Deberás cargarlo manualmente.', [
          { text: 'Cargar Manual', onPress: () => router.push({ pathname: '/nueva-carga', params: { codigo_barras: target } } as never) },
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
    buscar(data);
    setTimeout(() => setScanned(false), 1500);
  };

  const startScan = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Permiso denegado', 'Necesitamos la cámara');
        return;
      }
    }
    setScanned(false);
    setScanning(true);
  };

  const guardar = async () => {
    const qty = parseInt(cantidad, 10);
    if (!producto || Number.isNaN(qty) || qty <= 0) {
      Alert.alert('Datos inválidos', 'Escaneá el producto y cargá una cantidad');
      return;
    }
    setSaving(true);
    try {
      await agregarStock(producto.id, qty);
      setCantidad('');
      setProducto(null);
      setCode('');
      Alert.alert('Stock actualizado', `Se sumaron ${qty} unidades a ${producto.nombre}`);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo actualizar');
    } finally {
      setSaving(false);
    }
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
      <Text style={styles.title}>Lector de Barras</Text>
      <Text style={styles.subtitle}>Escaneá el código y auto-completá el producto</Text>

      <TouchableOpacity style={styles.scanCard} onPress={startScan}>
        <View style={styles.scanIcon}>
          <MaterialCommunityIcons name="barcode-scan" size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.scanTitle}>Escanear Código</Text>
        <Text style={styles.scanSubtitle}>Detecta y rellena datos automáticamente</Text>
      </TouchableOpacity>

      <View style={styles.manualBox}>
        <Ionicons name="keypad-outline" size={20} color="#64748B" />
        <TextInput
          style={styles.scanInput}
          placeholder="O ingresá el código manualmente"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={code}
          onChangeText={setCode}
          onSubmitEditing={() => buscar()}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => buscar()}>
          <Ionicons name="search" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2547F4" />
          <Text style={styles.loadingText}>Buscando producto...</Text>
        </View>
      )}

      {producto && (
        <View style={styles.productCard}>
          <Text style={styles.productName}>{producto.nombre}</Text>
          <Text style={styles.productDetail}>
            Stock actual: {producto.stock} · ${producto.precio_venta}
            {producto.barcode ? ` · ${producto.barcode}` : ''}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Cantidad a sumar"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            value={cantidad}
            onChangeText={setCantidad}
          />
          <Button
            mode="contained"
            buttonColor="#2547F4"
            textColor="#FFFFFF"
            icon="plus-circle"
            style={styles.saveButton}
            contentStyle={styles.saveContent}
            loading={saving}
            disabled={saving}
            onPress={guardar}>
            Sumar al stock
          </Button>
        </View>
      )}
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
  scanInput: { flex: 1, height: 44, fontFamily: 'Satoshi-Medium', fontSize: 14, color: '#0F172A', marginLeft: 10 },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2547F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  productName: { fontFamily: 'Satoshi-Bold', fontSize: 16, color: '#0F172A' },
  productDetail: { fontFamily: 'Satoshi-Regular', fontSize: 13, color: '#64748B', marginVertical: 6 },
  input: {
    fontFamily: 'Satoshi-Regular',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#0F172A',
    marginVertical: 10,
  },
  saveButton: { borderRadius: 12 },
  saveContent: { paddingVertical: 6 },
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
  scannerText: {
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
    fontSize: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 8,
  },
  scannerClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  loadingText: { fontFamily: 'Satoshi-Medium', color: '#0F172A', marginTop: 8 },
});