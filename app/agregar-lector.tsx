import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from 'react-native-paper';
import { useState } from 'react';

import { getProductos, agregarStock, type Producto } from '@/lib/db';

export default function AgregarLectorScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [producto, setProducto] = useState<Producto | null>(null);
  const [saving, setSaving] = useState(false);

  const buscar = async () => {
    const id = parseInt(code.trim(), 10);
    if (Number.isNaN(id)) return;
    const productos = await getProductos();
    const found = productos.find((p) => p.id === id);
    if (!found) {
      Alert.alert('No encontrado', `No existe el producto con código ${id}`);
      setProducto(null);
    } else {
      setProducto(found);
    }
  };

  const guardar = async () => {
    const qty = parseInt(cantidad, 10);
    if (!producto || Number.isNaN(qty) || qty <= 0) {
      Alert.alert('Datos inválidos', 'Escanéá el producto y cargá una cantidad');
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
      Alert.alert('Error', 'No se pudo actualizar el stock');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#212529" />
      </TouchableOpacity>

      <Text style={styles.title}>Lector de Barras</Text>

      <View style={styles.scanBox}>
        <Ionicons name="barcode-outline" size={26} color="#6C5CE7" />
        <TextInput
          style={styles.scanInput}
          placeholder="Ingresá o escaneá el código"
          placeholderTextColor="#ADB5BD"
          keyboardType="numeric"
          value={code}
          onChangeText={setCode}
          onSubmitEditing={buscar}
          autoFocus
        />
        <TouchableOpacity style={styles.scanBtn} onPress={buscar}>
          <Ionicons name="search" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {producto && (
        <View style={styles.productCard}>
          <Text style={styles.productName}>{producto.nombre}</Text>
          <Text style={styles.productStock}>Stock actual: {producto.stock}</Text>
          <TextInput
            style={styles.input}
            placeholder="Cantidad a sumar"
            placeholderTextColor="#ADB5BD"
            keyboardType="numeric"
            value={cantidad}
            onChangeText={setCantidad}
          />
          <Button
            mode="contained"
            buttonColor="#6C5CE7"
            textColor="#FFFFFF"
            icon="add-circle"
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
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: -1,
    marginBottom: 15,
  },
  scanBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  scanInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginLeft: 12,
  },
  scanBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  productName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#212529',
  },
  productStock: {
    fontSize: 14,
    color: '#6C757D',
    marginVertical: 6,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#212529',
    marginVertical: 10,
  },
  saveButton: {
    borderRadius: 14,
  },
  saveContent: {
    paddingVertical: 6,
  },
});