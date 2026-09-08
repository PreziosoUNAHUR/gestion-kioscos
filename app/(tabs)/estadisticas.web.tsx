import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert, Share } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as MailComposer from 'expo-mail-composer';
import { Button, Card } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { getVentas, getProductos, type Venta } from '@/lib/db';

const CATEGORIES = [
  { label: 'Bebidas', value: 45, color: '#2547F4' },
  { label: 'Tabaquera', value: 30, color: '#10B981' },
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
      const sum = ventas.filter((v) => v.fecha.slice(0, 10) === key).reduce((s, v) => s + v.total, 0);
      out.push({ label: d.toLocaleDateString('es-AR', { weekday: 'short' }), value: sum });
    }
    return out;
  })();

  const maxWeekly = Math.max(1, ...WEEKLY.map((w) => w.value));

  const KPI = [
    { label: 'Ventas hoy', value: `$${totalHoy}`, color: '#10B981' },
    { label: 'Ticket prom.', value: `$${Math.round(ticketProm)}`, color: '#2547F4' },
    { label: 'Productos', value: `${productosCount}`, color: '#E17055' },
  ];

  const exportCsv = () => {
    const rows = ['id,total,fecha', ...ventas.map((v) => `${v.id},${v.total},${v.fecha}`)].join('\n');
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
      ...ventas.map((v) => `${new Date(v.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} — $${v.total}`),
    ].join('\n');
    await MailComposer.composeAsync({ subject: `Reporte deEstadísticas ${new Date().toLocaleDateString('es-AR')}`, body, isHtml: false });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Estadísticas</Text>
        <Text style={styles.subtitle}>Rendimiento del kiosco</Text>
      </View>

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

      <Card style={styles.chartCard}>
        <Card.Title title="Ventas de los últimos 7 días" titleStyle={styles.chartTitle} />
        <Card.Content>
          <View style={styles.webChartArea}>
            {WEEKLY.map((w) => (
              <View key={w.label} style={styles.webBarColumn}>
                <View style={styles.webBarTrack}>
                  <View style={[styles.webBarFill, { height: `${(w.value / maxWeekly) * 100}%` }]} />
                </View>
                <Text style={styles.chartLabel}>{w.label}</Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.chartCard}>
        <Card.Title title="Ventas por categoría" titleStyle={styles.chartTitle} />
        <Card.Content>
          <View style={styles.webCategoryList}>
            {CATEGORIES.map((cat) => (
              <View key={cat.label} style={styles.webCategoryRow}>
                <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                <Text style={styles.legendText}>{cat.label}</Text>
                <View style={styles.webCategoryTrack}>
                  <View style={[styles.webCategoryFill, { backgroundColor: cat.color, width: `${cat.value}%` }]} />
                </View>
                <Text style={styles.legendPct}>{cat.value}%</Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      <Button mode="contained" buttonColor="#2547F4" textColor="#FFFFFF" icon="download" style={styles.exportButton} contentStyle={styles.exportContent} onPress={exportCsv}>
        Importar a Excel
      </Button>
      <Button mode="contained" buttonColor="#0984E3" textColor="#FFFFFF" icon="email" style={styles.exportButton} contentStyle={styles.exportContent} onPress={exportarEmail}>
        Enviar reporte por email
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingTop: 60 },
  content: { paddingBottom: 140 },
  header: { marginBottom: 25 },
  title: { fontFamily: 'Satoshi-Bold', fontSize: 32, color: '#0F172A', letterSpacing: -1 },
  subtitle: { fontFamily: 'Satoshi-Regular', fontSize: 16, color: '#64748B', marginTop: 4, marginBottom: 5 },
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  kpiCard: { flex: 1, borderRadius: 16, backgroundColor: '#FFFFFF', elevation: 2 },
  kpiContent: { alignItems: 'center', paddingVertical: 14 },
  kpiValue: { fontFamily: 'Satoshi-Bold', fontSize: 15, color: '#0F172A' },
  kpiLabel: { fontFamily: 'Satoshi-Regular', fontSize: 11, color: '#94A3B8', marginVertical: 4, textAlign: 'center' },
  kpiDot: { width: 8, height: 8, borderRadius: 4 },
  chartCard: { backgroundColor: '#FFFFFF', borderRadius: 20, marginBottom: 20, elevation: 2 },
  chartTitle: { fontFamily: 'Satoshi-Bold', fontSize: 16, color: '#0F172A' },
  webChartArea: { flexDirection: 'row', alignItems: 'flex-end', height: 160, gap: 8, justifyContent: 'space-between' },
  webBarColumn: { flex: 1, alignItems: 'center', gap: 6 },
  webBarTrack: { flex: 1, width: 22, backgroundColor: '#F1F5F9', borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' },
  webBarFill: { width: '100%', backgroundColor: '#2547F4', borderRadius: 8 },
  chartLabel: { fontFamily: 'Satoshi-Medium', fontSize: 11, color: '#94A3B8' },
  webCategoryList: { gap: 12 },
  webCategoryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  webCategoryTrack: { flex: 1, height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden' },
  webCategoryFill: { height: '100%', borderRadius: 5 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontFamily: 'Satoshi-Medium', flex: 1, fontSize: 14, color: '#0F172A' },
  legendPct: { fontFamily: 'Satoshi-Bold', fontSize: 13, color: '#64748B' },
  exportButton: { borderRadius: 16, marginBottom: 15 },
  exportContent: { paddingVertical: 8 },
});