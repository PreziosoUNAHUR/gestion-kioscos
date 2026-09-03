import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AgregarStockScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#0F172A" />
      </TouchableOpacity>
      <Text style={styles.title}>Agregar Stock</Text>
      <Text style={styles.subtitle}>Elegí cómo cargar el producto</Text>

      <TouchableOpacity style={styles.optionCard} onPress={() => router.push('/nueva-carga' as never)}>
        <View style={[styles.optionIcon, { backgroundColor: '#2547F4' }]}>
          <Ionicons name="camera" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.optionTitle}>Agregar Manual / Foto</Text>
        <Text style={styles.optionSubtitle}>Foto + datos completos del producto</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.optionCard} onPress={() => router.push('/agregar-lector' as never)}>
        <View style={[styles.optionIcon, { backgroundColor: '#10B981' }]}>
          <MaterialCommunityIcons name="barcode-scan" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.optionTitle}>Agregar con Lector de Barras</Text>
        <Text style={styles.optionSubtitle}>Escaneá el código y auto-completá datos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingTop: 60 },
  backButton: { marginBottom: 20 },
  title: { fontFamily: 'Satoshi-Bold', fontSize: 28, color: '#0F172A', letterSpacing: -1 },
  subtitle: { fontFamily: 'Satoshi-Regular', fontSize: 14, color: '#64748B', marginTop: 4, marginBottom: 28 },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionIcon: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  optionTitle: { fontFamily: 'Satoshi-Bold', fontSize: 17, color: '#0F172A', marginBottom: 4 },
  optionSubtitle: { fontFamily: 'Satoshi-Regular', fontSize: 13, color: '#64748B', textAlign: 'center' },
});