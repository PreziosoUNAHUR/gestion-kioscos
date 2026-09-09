import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button, Dialog, Portal } from 'react-native-paper';

import { FiadoItemCard } from '@/components/FiadoItemCard';
import { getClientes, insertCliente, actualizarDeuda, type Cliente } from '@/lib/db';

export default function ClientesScreen() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [customTarget, setCustomTarget] = useState<Cliente | null>(null);

  useFocusEffect(
    useCallback(() => {
      getClientes()
        .then(setClientes)
        .catch((err) => console.error(err));
    }, []),
  );

  const reload = async () => setClientes(await getClientes());

  const addCliente = async () => {
    if (!newName.trim()) return;
    await insertCliente(newName.trim());
    setNewName('');
    setShowAdd(false);
    reload();
  };

  const handleIncrement = async (id: string, step: number) => {
    const cliente = clientes.find((c) => String(c.id) === id);
    if (!cliente) return;
    await actualizarDeuda(cliente.id, cliente.deuda + step);
    reload();
  };

  const handleDecrement = async (id: string, step: number) => {
    const cliente = clientes.find((c) => String(c.id) === id);
    if (!cliente) return;
    await actualizarDeuda(cliente.id, cliente.deuda - step);
    reload();
  };

  const handleOptionsPress = (id: string) => {
    const cliente = clientes.find((c) => String(c.id) === id);
    if (!cliente) return;
    setCustomTarget(cliente);
    setCustomAmount('');
  };

  const applyCustomAmount = async () => {
    if (!customTarget) return;
    const value = parseFloat(customAmount.replace(',', '.'));
    if (Number.isNaN(value)) {
      Alert.alert('Monto inválido', 'Ingresá un número válido');
      return;
    }
    await actualizarDeuda(customTarget.id, customTarget.deuda + value);
    setCustomTarget(null);
    setCustomAmount('');
    reload();
  };

  return (
    <>
      <View style={styles.container}>
        <StatusBar style="dark" />
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Fiado</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAdd(true)}>
            <Ionicons name="add" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={clientes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Tocá el + para agregar tu primer cliente</Text>
          }
          renderItem={({ item }) => (
            <FiadoItemCard
              id={String(item.id)}
              nombre={item.nombre}
              deuda={item.deuda}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onOptionsPress={handleOptionsPress}
            />
          )}
        />
      </View>
      <Portal>
        <Dialog style={{ backgroundColor: "#FFFFFF" }}  visible={showAdd} onDismiss={() => setShowAdd(false)}>
          <Dialog.Title style={styles.dialogTitle}>Nuevo cliente</Dialog.Title>
          <Dialog.Content>
            <TextInput
              style={styles.dialogInput}
              placeholder="Nombre de la persona"
              placeholderTextColor="#94A3B8"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAdd(false)}>
              <Text style={styles.dialogBtnText}>Cancelar</Text>
            </Button>
            <Button onPress={addCliente}>
              <Text style={styles.dialogBtnTextBold}>Agregar</Text>
            </Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog style={{ backgroundColor: "#FFFFFF" }}  visible={!!customTarget} onDismiss={() => setCustomTarget(null)}>
          <Dialog.Title style={styles.dialogTitle}>Ajuste personalizado</Dialog.Title>
          <Dialog.Content>
            {customTarget && (
              <Text style={styles.dialogFor}>
                {customTarget.nombre} ·{' '}
                {customTarget.deuda > 0
                  ? `debe $${customTarget.deuda.toLocaleString('es-AR')}`
                  : customTarget.deuda < 0
                    ? `a favor $${Math.abs(customTarget.deuda).toLocaleString('es-AR')}`
                    : 'sin deuda'}
              </Text>
            )}
            <TextInput
              style={styles.dialogInput}
              placeholder="Monto (+ suma, - resta)"
              placeholderTextColor="#94A3B8"
              keyboardType="decimal-pad"
              value={customAmount}
              onChangeText={setCustomAmount}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCustomTarget(null)}>
              <Text style={styles.dialogBtnText}>Cancelar</Text>
            </Button>
            <Button onPress={applyCustomAmount}>
              <Text style={styles.dialogBtnTextBold}>Aplicar</Text>
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingTop: 60 },
  backButton: { marginBottom: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -1,
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2547F4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2547F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  listContent: { paddingBottom: 40 },
  emptyText: {
    fontFamily: 'Satoshi-Regular',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 15,
    marginTop: 40,
  },
  dialogTitle: { fontFamily: 'Satoshi-Bold' },
  dialogInput: {
    fontFamily: 'Satoshi-Regular',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#0F172A',
  },
  dialogFor: { fontFamily: 'Satoshi-Regular', fontSize: 14, color: '#64748B', marginBottom: 12 },
  dialogBtnText: { fontFamily: 'Satoshi-Medium' },
  dialogBtnTextBold: { fontFamily: 'Satoshi-Bold' },
});