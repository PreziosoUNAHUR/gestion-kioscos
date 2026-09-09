import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button, Dialog, Portal } from 'react-native-paper';

import {
  getProveedores,
  insertProveedor,
  updateProveedor,
  type Proveedor,
} from '@/lib/db';

export default function ProveedoresScreen() {
  const router = useRouter();
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [nombre, setNombre] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [productos, setProductos] = useState('');

  useFocusEffect(
    useCallback(() => {
      getProveedores()
        .then(setProveedores)
        .catch((err) => console.error(err));
    }, []),
  );

  const reload = async () => {
    setProveedores(await getProveedores());
  };

  const openNew = () => {
    setEditing(null);
    setNombre('');
    setWhatsapp('');
    setProductos('');
    setShowForm(true);
  };

  const openEdit = (prov: Proveedor) => {
    setEditing(prov);
    setNombre(prov.nombre);
    setWhatsapp(prov.whatsapp);
    setProductos(prov.productos);
    setShowForm(true);
  };

  const save = async () => {
    if (!nombre.trim()) {
      Alert.alert('Falta el nombre', 'Poné el nombre del proveedor');
      return;
    }
    const data = { nombre: nombre.trim(), whatsapp: whatsapp.trim(), productos };
    if (editing) {
      await updateProveedor(editing.id, data);
    } else {
      await insertProveedor(data);
    }
    setShowForm(false);
    reload();
  };

  const sendWhatsapp = (prov: Proveedor) => {
    const digits = prov.whatsapp.replace(/\D/g, '');
    if (prov.whatsapp.trim() === '') {
      Alert.alert('Sin WhatsApp', 'Este proveedor no tiene número cargado');
      return;
    }
    const msg = `Hola buenas me gustaria encargarte:\n${prov.productos}`;
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'No se pudo abrir WhatsApp'),
    );
  };

  return (
    <>
      <View style={styles.container}>
        <StatusBar style="dark" />

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <Text style={styles.title}>Proveedores</Text>
          {proveedores.length > 0 && (
            <TouchableOpacity style={styles.addButton} onPress={openNew}>
              <Ionicons name="add" size={30} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {proveedores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <TouchableOpacity style={styles.emptyButton} onPress={openNew}>
              <Ionicons name="add" size={40} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.emptyText}>Agregá el primer proveedor</Text>
          </View>
        ) : (
          <FlatList
            data={proveedores}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <TouchableOpacity
                  style={styles.cardMain}
                  onPress={() => router.push({ pathname: '/proveedor-detalle', params: { id: String(item.id) } } as never)}
                  activeOpacity={0.7}>
                  <View style={styles.cardIcon}>
                    <Ionicons name="storefront" size={22} color="#E17055" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName} numberOfLines={1}>
                      {item.nombre}
                    </Text>
                    <Text style={styles.cardProducts} numberOfLines={1}>
                      {item.productos ? `${item.productos.split('\n').length} productos` : 'Sin productos'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}>
                  <Ionicons name="construct" size={24} color="#2547F4" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => sendWhatsapp(item)}>
                  <Ionicons name="logo-whatsapp" size={26} color="#25D366" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      {/* Diálogo: nuevo / editar proveedor */}
      <Portal>
        <Dialog style={{ backgroundColor: "#FFFFFF" }}  visible={showForm} onDismiss={() => setShowForm(false)}>
          <Dialog.Title style={{ color: "#0F172A" }}>{editing ? 'Editar proveedor' : 'Nuevo proveedor'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              style={styles.input}
              placeholder="Nombre del proveedor"
              placeholderTextColor="#94A3B8"
              value={nombre}
              onChangeText={setNombre}
            />
            <TextInput
              style={styles.input}
              placeholder="Número de WhatsApp"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={whatsapp}
              onChangeText={setWhatsapp}
            />
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Productos a pedir (uno por línea, ej: 2x leches verdes)"
              placeholderTextColor="#94A3B8"
              multiline
              value={productos}
              onChangeText={setProductos}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowForm(false)}>Cancelar</Button>
            <Button onPress={save}>{editing ? 'Guardar' : 'Agregar'}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  title: { fontFamily: 'Satoshi-Bold',
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E17055',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E17055',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E17055',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E17055',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  emptyText: { fontFamily: 'Satoshi-Bold',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FBF0EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: { fontFamily: 'Satoshi-Bold',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardProducts: { fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  input: { fontFamily: 'Satoshi-Regular',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#0F172A',
    marginBottom: 12,
  },
  multiline: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
});