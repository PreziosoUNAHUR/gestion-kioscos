import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button, Dialog, Portal } from 'react-native-paper';

import {
  getClientes,
  insertCliente,
  actualizarDeuda,
  type Cliente,
} from '@/lib/db';

type AdjustMode = 'add' | 'sub';

export default function ClientesScreen() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [adjustTarget, setAdjustTarget] = useState<Cliente | null>(null);
  const [adjustMode, setAdjustMode] = useState<AdjustMode>('add');
  const [amount, setAmount] = useState('');

  useFocusEffect(
    useCallback(() => {
      getClientes()
        .then(setClientes)
        .catch((err) => console.error(err));
    }, []),
  );

  const reload = async () => {
    setClientes(await getClientes());
  };

  const addCliente = async () => {
    if (!newName.trim()) return;
    await insertCliente(newName.trim());
    setNewName('');
    setShowAdd(false);
    reload();
  };

  const openAdjust = (cliente: Cliente, mode: AdjustMode) => {
    setAdjustTarget(cliente);
    setAdjustMode(mode);
    setAmount('');
  };

  const applyAdjust = async () => {
    if (!adjustTarget) return;
    const value = parseFloat(amount.replace(',', '.'));
    if (Number.isNaN(value)) return;
    const next =
      adjustMode === 'add'
        ? adjustTarget.deuda + value
        : adjustTarget.deuda - value;
    await actualizarDeuda(adjustTarget.id, next);
    setAdjustTarget(null);
    setAmount('');
    reload();
  };

  const fmt = (n: number) => `$${n.toLocaleString('es-AR')}`;

  return (
    <>
      <View style={styles.container}>
        <StatusBar style="dark" />

        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#212529" />
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
            <Text style={styles.emptyText}>
              Tocá el + para agregar tu primer cliente
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.nombre}
                </Text>
                <Text
                  style={[
                    styles.cardDebt,
                    item.deuda > 0 ? styles.cardDebtPos : styles.cardDebtFree,
                  ]}>
                  {item.deuda > 0
                    ? `Debe ${fmt(item.deuda)}`
                    : item.deuda < 0
                      ? `A favor ${fmt(Math.abs(item.deuda))}`
                      : 'Sin deuda'}
                </Text>
              </View>
              <View style={styles.controls}>
                <TouchableOpacity
                  style={styles.controlBtn}
                  onPress={() => openAdjust(item, 'sub')}>
                  <Ionicons name="remove" size={24} color="#D63031" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.controlBtn, styles.controlBtnAdd]}
                  onPress={() => openAdjust(item, 'add')}>
                  <Ionicons name="add" size={24} color="#00B894" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>

      {/* Diálogo: nuevo cliente */}
      <Portal>
        <Dialog visible={showAdd} onDismiss={() => setShowAdd(false)}>
          <Dialog.Title>Nuevo cliente</Dialog.Title>
          <Dialog.Content>
            <TextInput
              style={styles.dialogInput}
              placeholder="Nombre de la persona"
              placeholderTextColor="#ADB5BD"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAdd(false)}>Cancelar</Button>
            <Button onPress={addCliente}>Agregar</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Diálogo: ajustar deuda */}
        <Dialog
          visible={!!adjustTarget}
          onDismiss={() => setAdjustTarget(null)}>
          <Dialog.Title>
            {adjustMode === 'add' ? 'Agregar deuda' : 'Quitar deuda'}
          </Dialog.Title>
          <Dialog.Content>
            {adjustTarget && (
              <Text style={styles.dialogFor}>
                {adjustTarget.nombre} · debe {fmt(adjustTarget.deuda)}
              </Text>
            )}
            <TextInput
              style={styles.dialogInput}
              placeholder="Monto ($)"
              placeholderTextColor="#ADB5BD"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAdjustTarget(null)}>Cancelar</Button>
            <Button onPress={applyAdjust}>
              {adjustMode === 'add' ? 'Sumar' : 'Restar'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
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
    backgroundColor: '#0984E3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0984E3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  listContent: {
    paddingBottom: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#ADB5BD',
    fontSize: 15,
    marginTop: 40,
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
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#212529',
  },
  cardDebt: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
  },
  cardDebtPos: {
    color: '#D63031',
  },
  cardDebtFree: {
    color: '#00B894',
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
  },
  controlBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FDEBEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnAdd: {
    backgroundColor: '#E2F5EF',
  },
  dialogInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#212529',
  },
  dialogFor: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 12,
  },
});