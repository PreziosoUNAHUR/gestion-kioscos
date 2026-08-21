import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

import { insertProducto } from '@/lib/db';

export default function NuevaCargaScreen() {
  const router = useRouter();
  const [photo, setPhoto] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [precioCosto, setPrecioCosto] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [stock, setStock] = useState('');
  const [saving, setSaving] = useState(false);

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso denegado', 'Necesitamos la cámara para sacar la foto del producto');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const clearForm = () => {
    setPhoto(null);
    setNombre('');
    setPrecioCosto('');
    setPrecioVenta('');
    setStock('');
  };

  const saveProduct = async () => {
    if (!nombre.trim() || !precioVenta.trim() || !stock.trim()) {
      Alert.alert('Faltan datos', 'Completá el nombre, el precio de venta y el stock');
      return;
    }

    const costo = parseFloat(precioCosto.replace(',', '.')) || 0;
    const venta = parseFloat(precioVenta.replace(',', '.'));
    const cantidad = parseInt(stock, 10);

    if (Number.isNaN(venta) || Number.isNaN(cantidad)) {
      Alert.alert('Datos inválidos', 'Revisá los precios y el stock');
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
      });
      clearForm();
      Alert.alert('Producto guardado', 'El producto se cargó al inventario', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />

      {/* Encabezado */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Carga</Text>
      </View>

      {/* Zona de captura */}
      <TouchableOpacity style={styles.captureZone} onPress={takePhoto}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.captureImage} />
        ) : (
          <>
            <View style={styles.cameraIconCircle}>
              <Ionicons name="camera" size={40} color="#6C5CE7" />
            </View>
            <Text style={styles.captureText}>Tocar para sacar foto</Text>
            <Text style={styles.captureSubText}>o agregar desde la galería</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Formulario */}
      <Text style={styles.sectionTitle}>Datos del producto</Text>
      <View style={styles.formCard}>
        <TextInput
          style={styles.input}
          placeholder="Nombre del producto"
          placeholderTextColor="#ADB5BD"
          value={nombre}
          onChangeText={setNombre}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Precio de costo ($)"
            placeholderTextColor="#ADB5BD"
            keyboardType="decimal-pad"
            value={precioCosto}
            onChangeText={setPrecioCosto}
          />
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Precio de venta ($)"
            placeholderTextColor="#ADB5BD"
            keyboardType="decimal-pad"
            value={precioVenta}
            onChangeText={setPrecioVenta}
          />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Stock inicial (cantidad)"
          placeholderTextColor="#ADB5BD"
          keyboardType="numeric"
          value={stock}
          onChangeText={setStock}
        />
      </View>

      {/* Guardar */}
      <Button
        mode="contained"
        buttonColor="#6C5CE7"
        textColor="#FFFFFF"
        icon="checkmark-done"
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
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  content: {
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: -1,
  },
  captureZone: {
    height: 220,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2DCFA',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    overflow: 'hidden',
  },
  captureImage: {
    width: '100%',
    height: '100%',
  },
  cameraIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#EDE9FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  captureText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6C5CE7',
  },
  captureSubText: {
    fontSize: 13,
    color: '#ADB5BD',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6C757D',
    marginBottom: 12,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#212529',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  inputHalf: {
    flex: 1,
  },
  saveButton: {
    borderRadius: 16,
  },
  saveContent: {
    paddingVertical: 10,
  },
});