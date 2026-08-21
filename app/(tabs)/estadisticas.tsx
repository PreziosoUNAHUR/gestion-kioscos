import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, Share } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as MailComposer from 'expo-mail-composer';
import { Bar, CartesianChart, PolarChart, Pie } from 'victory-native';
import { Button, Card } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';

import { getVentas, getProductos, type Venta } from '@/lib/db';

const CATEGORIES = [
  { label: 'Bebidas', value: 45, color: '#6C5CE7' },
  { label: 'Tabaquera', value: 30, color: '#00B894' },
  { label: 'Snacks', value: 15, color: '#E17055' },
  { label: 'Otros', value: 10, color: '#0984E3' },
];

export default function EstadisticasScreen() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [productosCount, setProductosCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getVentas(), getProductos()])
        .then(([v, p]) => {
          setVentas(v);
          setProductosCount(p.length);
        })
        .catch((err) => console.error(err));
    }, []),
  );

  const todayKey = new Date().toISOString().slice(0, 10);
  const ventasHoy = ventas.filter((v) => v.fecha.slice(0, 10) === todayKey);
  const totalHoy = ventasHoy.reduce((s, v) => s + v.total, 0);
  const totalAll = ventas.reduce((s, v) => s + v.total, 0);
  const ticketProm = ventas.length > 0 ? totalAll / ventas.length : 0;

  const WEEKLY = (() => {
    const today = new Date();
    const out: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const sum = ventas
        .filter((v) => v.fecha.slice(0, 10) === key)
        .reduce((s, v) => s + v.total, 0);
      out.push({ label: d.toLocaleDateString('es-AR', { weekday: 'short' }), value: sum });
    }
    return out;
  })();

  const KPI = [
    { label: 'Ventas hoy', value: `$${totalHoy}`, color: '#00B894' },
    { label: 'Ticket prom.', value: `$${Math.round(ticketProm)}`, color: '#6C5CE7' },
    { label: 'Productos', value: `${productosCount}`, color: '#E17055' },
  ];

  const exportCsv = () => {
    const rows = [
      'id,total,fecha',
      ...ventas.map((v) => `${v.id},${v.total},${v.fecha}`),
    ].join('\n');
    Share.share({ message: `Estadísticas del kiosco\n\n${rows}` }).catch(() => {});
  };

  const exportarEmail = async () => {
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('No disponible', 'No hay app de email configurada en el dispositivo');
      return;
    }
    const body = [
      'Reporte de Estadísticas',
      `Fecha: ${new Date().toLocaleDateString('es-AR')}`,
      `Ventas totales: ${ventas.length}`,
      `Total acumulado: $${totalAll}`,
      '',
      'Detalle:',
      ...ventas.map(
        (v) =>
          `${new Date(v.fecha).toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          })} — $${v.total}`,
      ),
    ].join('\n');

    await MailComposer.composeAsync({
      subject: `Reporte deEstadísticas ${new Date().toLocaleDateString('es-AR')}`,
      body,
      isHtml: false,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Estadísticas</Text>
        <Text style={styles.subtitle}>Rendimiento del kiosco</Text>
      </View>

      {/* KPIs */}
      <View style={styles.kpiRow}>
        {KPI.map((kpi) => (
          <Card key={kpi.label} style={styles.kpiCard}>
            <Card.Content style={styles.kpiContent}>
              <Text style={styles.kpiValue}>{kpi.value}</Text>
              <Text style={styles.kpiLabel}>{kpi.label}</Text>
              <View style={[styles.kpiDot, { backgroundColor: kpi.color }]} />
            </Card.Content>
          </Card>
        ))}
      </View>

      {/* Gráfico semanal con Victory */}
      <Card style={styles.chartCard}>
        <Card.Title title="Ventas de los últimos 7 días" titleStyle={styles.chartTitle} />
        <Card.Content>
          <View style={styles.chartArea}>
            <CartesianChart
              data={WEEKLY}
              xKey="label"
              yKeys={['value']}
              domainPadding={{ left: 30, right: 30, top: 20 }}>
              {({ points, chartBounds }) => (
                <Bar
                  points={points.value}
                  chartBounds={chartBounds}
                  color="#6C5CE7"
                  roundedCorners={{ topLeft: 6, topRight: 6 }}
                />
              )}
            </CartesianChart>
          </View>
          <View style={styles.chartLabelsRow}>
            {WEEKLY.map((w) => (
              <Text style={styles.chartLabel} key={w.label}>
                {w.label}
              </Text>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Categorías con Pie */}
      <Card style={styles.chartCard}>
        <Card.Title title="Ventas por categoría" titleStyle={styles.chartTitle} />
        <Card.Content>
          <View style={styles.pieRow}>
            <View style={styles.pieArea}>
              <PolarChart
                data={CATEGORIES}
                labelKey="label"
                valueKey="value"
                colorKey="color">
                <Pie.Chart innerRadius="42%">{() => <Pie.Slice />}</Pie.Chart>
              </PolarChart>
            </View>
            <View style={styles.legend}>
              {CATEGORIES.map((cat) => (
                <View style={styles.legendRow} key={cat.label}>
                  <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.legendText}>{cat.label}</Text>
                  <Text style={styles.legendPct}>{cat.value}%</Text>
                </View>
              ))}
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Exportación */}
      <Button
        mode="contained"
        buttonColor="#6C5CE7"
        textColor="#FFFFFF"
        icon="download"
        style={styles.exportButton}
        contentStyle={styles.exportContent}
        onPress={exportCsv}>
        Importar a Excel
      </Button>
      <Button
        mode="contained"
        buttonColor="#0984E3"
        textColor="#FFFFFF"
        icon="email"
        style={styles.exportButton}
        contentStyle={styles.exportContent}
        onPress={exportarEmail}>
        Enviar reporte por email
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
    paddingBottom: 140,
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
    marginBottom: 5,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiContent: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111111',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#ADB5BD',
    marginVertical: 4,
    textAlign: 'center',
  },
  kpiDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#212529',
  },
  chartArea: {
    height: 200,
  },
  chartLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  chartLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ADB5BD',
  },
  pieRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pieArea: {
    width: 170,
    height: 170,
  },
  legend: {
    flex: 1,
    paddingLeft: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  legendPct: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6C757D',
  },
  exportButton: {
    borderRadius: 16,
    marginBottom: 15,
  },
  exportContent: {
    paddingVertical: 8,
  },
});