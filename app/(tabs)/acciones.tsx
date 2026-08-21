import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

type IconName = ComponentProps<typeof Ionicons>['name'];

const ACTIONS: {
  route: string;
  label: string;
  subtitle: string;
  icon: IconName;
  color: string;
}[] = [
  {
    route: '/inventario',
    label: 'Inventario',
    subtitle: 'Todo lo que tenés en stock',
    icon: 'cube',
    color: '#D63031',
  },
  {
    route: '/caja',
    label: 'Caja',
    subtitle: 'Resumen de ventas del día',
    icon: 'stats-chart',
    color: '#6C5CE7',
  },
  {
    route: '/cierre-caja',
    label: 'Cierre de Caja',
    subtitle: 'Arqueo del turno actual',
    icon: 'cash',
    color: '#00B894',
  },
  {
    route: '/gestor-proveedores',
    label: 'Proveedores',
    subtitle: 'Pedidos y mensajes de WhatsApp',
    icon: 'storefront',
    color: '#E17055',
  },
  {
    route: '/clientes',
    label: 'Fiado',
    subtitle: 'Deudas a favor de los clientes',
    icon: 'people',
    color: '#0984E3',
  },
];

export default function AccionesScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Acciones</Text>
        <Text style={styles.subtitle}>Herramientas del kiosco</Text>
      </View>

      {ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.route}
          style={styles.card}
          onPress={() => router.push(action.route as never)}>
          <View style={[styles.cardIcon, { backgroundColor: action.color }]}>
            <Ionicons name={action.icon} size={24} color="#FFFFFF" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>{action.label}</Text>
            <Text style={styles.cardSubtitle}>{action.subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#DEE2E6" />
        </TouchableOpacity>
      ))}
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
  header: {
    marginBottom: 25,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 4,
    marginBottom: 15,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 3,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#ADB5BD',
  },
});