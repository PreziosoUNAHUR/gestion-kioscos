import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface FiadoItemProps {
  id: string;
  nombre: string;
  deuda: number;
  onIncrement: (id: string, step: number) => void;
  onDecrement: (id: string, step: number) => void;
  onOptionsPress: (id: string) => void;
}

export const FiadoItemCard: React.FC<FiadoItemProps> = ({
  id,
  nombre,
  deuda,
  onIncrement,
  onDecrement,
  onOptionsPress,
}) => {
  const isPositive = deuda > 0;
  const isNegative = deuda < 0;
  return (
    <View style={styles.card}>
      <View style={styles.leftContent}>
        <Text style={styles.clientName}>{nombre}</Text>
        <Text
          style={[
            styles.debtText,
            isPositive ? styles.debtPositive : isNegative ? styles.debtNegative : styles.debtZero,
          ]}>
          {isPositive
            ? `Debe $${deuda.toLocaleString('es-AR')}`
            : isNegative
              ? `A favor $${Math.abs(deuda).toLocaleString('es-AR')}`
              : 'Sin deuda'}
        </Text>
      </View>
      <View style={styles.stepperContainer}>
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => onDecrement(id, 500)}
          activeOpacity={0.7}>
          <Feather name="minus" size={16} color="#1E293B" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.stepperButton, styles.incrementButton]}
          onPress={() => onIncrement(id, 500)}
          activeOpacity={0.7}>
          <Feather name="plus" size={16} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionsButton} onPress={() => onOptionsPress(id)}>
          <Feather name="more-vertical" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  leftContent: { flex: 1 },
  clientName: { fontFamily: 'Satoshi-Bold', fontSize: 16, fontWeight: '700', color: '#0F172A' },
  debtText: { fontFamily: 'Satoshi-Bold', fontSize: 18, fontWeight: '800', marginTop: 4 },
  debtPositive: { color: '#EF4444' },
  debtNegative: { color: '#10B981' },
  debtZero: { color: '#64748B' },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  incrementButton: { backgroundColor: '#2547F4' },
  optionsButton: { padding: 4 },
});