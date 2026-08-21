import { StyleSheet, Text, View, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button } from 'react-native-paper';

export default function CierreCajaScreen() {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#212529" />
      </TouchableOpacity>

      <Text style={styles.title}>Cierre de Caja</Text>
      <Text style={styles.subtitle}>
        Registrá el efectivo y los medios de pago del turno
      </Text>

      {/* Billete */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: '#00B894' }]}>
            <Ionicons name="cash" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.cardTitle}>Billete</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Monto en billetes ($)"
          placeholderTextColor="#ADB5BD"
          keyboardType="decimal-pad"
        />
      </View>

      {/* Cuenta DNI */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: '#0984E3' }]}>
            <Ionicons name="id-card" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.cardTitle}>Cuenta DNI</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Monto cobrado por Cuenta DNI ($)"
          placeholderTextColor="#ADB5BD"
          keyboardType="decimal-pad"
        />
      </View>

      {/* Mercado Pago */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: '#E17055' }]}>
            <Ionicons name="logo-paypal" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.cardTitle}>Mercado Pago</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Monto cobrado por Mercado Pago ($)"
          placeholderTextColor="#ADB5BD"
          keyboardType="decimal-pad"
        />
      </View>

      <Button
        mode="contained"
        buttonColor="#00B894"
        textColor="#FFFFFF"
        icon="check"
        style={styles.confirmButton}
        contentStyle={styles.confirmContent}>
        Confirmar Cierre
      </Button>

      <View style={styles.bottomSpace} />
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
    marginBottom: 25,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#212529',
  },
  input: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#212529',
  },
  confirmButton: {
    borderRadius: 16,
    marginBottom: 20,
  },
  confirmContent: {
    paddingVertical: 8,
  },
  bottomSpace: {
    height: 40,
  },
});