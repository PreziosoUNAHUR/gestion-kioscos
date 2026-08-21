import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AgregarStockScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#212529" />
      </TouchableOpacity>

      <Text style={styles.title}>Agregar Stock</Text>
      <Text style={styles.subtitle}>¿Cómo querés cargar los productos?</Text>

      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => router.push('/nueva-carga')}>
        <View style={[styles.optionIcon, { backgroundColor: '#6C5CE7' }]}>
          <Ionicons name="camera" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.optionTitle}>Agregar Manual / Foto</Text>
        <Text style={styles.optionSubtitle}>
          Fotografiá o cargá el producto manualmente
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.optionCard}
        onPress={() => router.push('/agregar-lector' as never)}>
        <View style={[styles.optionIcon, { backgroundColor: '#00B894' }]}>
          <Ionicons name="barcode" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.optionTitle}>Agregar con Lector de Barras</Text>
        <Text style={styles.optionSubtitle}>
          Escaneá el código de barras del producto
        </Text>
      </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 5,
    marginBottom: 30,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionIcon: {
    width: 70,
    height: 70,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 5,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#ADB5BD',
    textAlign: 'center',
  },
});