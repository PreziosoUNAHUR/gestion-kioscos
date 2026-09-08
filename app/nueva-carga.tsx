import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { insertProducto } from '@/lib/db';

export default function NuevaCargaScreen() {
  const router = useRouter();
  const { barcode: paramBarcode, nombre_sugerido, imagen_url, codigo_barras } = useLocalSearchParams<{
    barcode?: string;
    codigo_barras?: string;
    nombre_sugerido?: string;
    imagen_url?: string;
  }>();
  const [photo, setPhoto] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [precioCosto, setPrecioCosto] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [stock, setStock] = useState('');
  const [barcode, setBarcode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const code = (paramBarcode as string) || (codigo_barras as string) || '';
    if (code) setBarcode(String(code));
    if (nombre_sugerido) setNombre(String(nombre_sugerido));
    if (imagen_url) setPhoto(String(imagen_url));
  }, [paramBarcode, codigo_barras, nombre_sugerido, imagen_url]);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso denegado', 'Necesitamos la cámara');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const clearForm = () => {
    setPhoto(null);
    setNombre('');
    setPrecioCosto('');
    setPrecioVenta('');
    setStock('');
    setBarcode('');
  };

  const saveProduct = async () => {
    if (!nombre.trim() || !precioVenta.trim() || !stock.trim()) {
      Alert.alert('Faltan datos', 'Completá nombre, precio de venta y stock');
      return;
    }
    const costo = parseFloat(precioCosto.replace(',', '.')) || 0;
    const venta = parseFloat(precioVenta.replace(',', '.'));
    const cantidad = parseInt(stock, 10);
    if (Number.isNaN(venta) || Number.isNaN(cantidad)) {
      Alert.alert('Datos inválidos', 'Revisá precios y stock');
      return;
    }
    setSaving(true);
    try {
      await insertProducto({
        nombre: nombre.trim(),
        precioCosto: costo,
        precioVenta: venta,
        stock: cantidad,
        imagenUri: photo,
        barcode: barcode.trim() || null,
      });
      clearForm();
      Alert.alert('Producto guardado', 'Se cargó al inventario', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Carga</Text>
      </View>

      <TouchableOpacity style={styles.captureZone} onPress={takePhoto}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.captureImage} />
        ) : (
          <>
            <View style={styles.cameraIconCircle}>
              <Ionicons name="camera" size={40} color="#2547F4" />
            </View>
            <Text style={styles.captureText}>Tocar para sacar foto</Text>
            <Text style={styles.captureSubText}>o agregar desde galería</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Datos del producto</Text>
      <View style={styles.formCard}>
        <TextInput
          style={styles.input}
          placeholder="Nombre del producto"
          placeholderTextColor="#94A3B8"
          value={nombre}
          onChangeText={setNombre}
        />
        <View style={styles.barcodeRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Código de barras"
            placeholderTextColor="#94A3B8"
            value={barcode}
            onChangeText={setBarcode}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.barcodeBtn}
            onPress={() => router.push('/agregar-lector' as never)}>
            <MaterialCommunityIcons name="barcode-scan" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Costo ($)"
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
            value={precioCosto}
            onChangeText={setPrecioCosto}
          />
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Venta ($)"
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
            value={precioVenta}
            onChangeText={setPrecioVenta}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Stock inicial"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={stock}
          onChangeText={setStock}
        />
      </View>

      <Button
        mode="contained"
        buttonColor="#2547F4"
        textColor="#FFFFFF"
        icon="check"
        style={styles.saveButton}
        contentStyle={styles.saveContent}
        loading={saving}
        disabled={saving}
        onPress={saveProduct}>
        Guardar producto
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingTop: 60 },
  content: { paddingBottom: 100 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { marginRight: 15 },
  headerTitle: { fontFamily: 'Satoshi-Bold', fontSize: 24, color: '#0F172A', letterSpacing: -0.5 },
  captureZone: {
    height: 220,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E7FF',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  captureImage: { width: '100%', height: '100%' },
  cameraIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  captureText: { fontFamily: 'Satoshi-Bold', fontSize: 16, color: '#2547F4' },
  captureSubText: { fontFamily: 'Satoshi-Regular', fontSize: 13, color: '#94A3B8', marginTop: 4 },
  sectionTitle: { fontFamily: 'Satoshi-Bold', fontSize: 16, color: '#475569', marginBottom: 12 },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    fontFamily: 'Satoshi-Regular',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 12,
  },
  barcodeRow: { flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'center' },
  barcodeBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2547F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', gap: 10 },
  inputHalf: { flex: 1 },
  saveButton: { borderRadius: 16 },
  saveContent: { paddingVertical: 10 },
});