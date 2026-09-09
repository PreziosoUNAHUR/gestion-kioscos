import { useCallback, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as MailComposer from 'expo-mail-composer';
import { Button, Card } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { getVentas, getProductos, getVentasPorMetodo, getTopProductos, type Venta } from '@/lib/db';
import { exportarExcelHistorial } from '@/lib/exportExcel';

const CATEGORIES = [
  { label: 'Bebidas', value: 45, color: '#2547F4' },
  { label: 'Tabaquera', value: 30, color: '#10B981' },
  { label: 'Snacks', value: 15, color: '#E17055' },
  { label: 'Otros', value: 10, color: '#0984E3' },
];

export default function EstadisticasScreen() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [productosCount, setProductosCount] = useState(0);
  const [porMetodo, setPorMetodo] = useState<{ metodo: string; total: number; count: number }[]>([]);
  const [top, setTop] = useState<{ nombre: string; cantidad: number; total: number }[]>([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getVentas(), getProductos(), getVentasPorMetodo(), getTopProductos(5)])
        .then(([v, p, pm, t]) => {
          setVentas(v);
          setProductosCount(p.length);
          setPorMetodo(pm);
          setTop(t);
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

  const exportarEmail = async () => {
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('No disponible', 'No hay app de email configurada en el dispositivo');
      return;
    }
    const porMetodoTxt = porMetodo.map((m) => `${m.metodo}: $${m.total} (${m.count} tickets)`).join('\n');
    const topTxt = top.length > 0 ? top.map((t) => `${t.nombre}: ${t.cantidad} u. ($${t.total})`).join('\n') : 'Sin datos';
    const body = [
      'Reporte de Estadísticas — Gestor Kioskos',
      `Fecha: ${new Date().toLocaleString('es-AR')}`,
      `Ventas totales: ${ventas.length} — Total: $${totalAll}`,
      `Ticket prom: $${Math.round(ticketProm)} — Productos: ${productosCount}`,
      '',
      'Ventas por medio de pago:',
      porMetodoTxt || 'Sin datos',
      '',
      'Top productos:',
      topTxt,
      '',
      'Detalle (últimas 20):',
      ...ventas.slice(0, 20).map((v) => `${new Date(v.fecha).toLocaleString('es-AR')} — $${v.total} [${v.metodo_pago || 'billete'}]`),
    ].join('\n');
    await MailComposer.composeAsync({ subject: `Estadísticas ${new Date().toLocaleDateString('es-AR')} — $${totalAll}`, body, isHtml: false });
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

      <Card style={styles.chartCard}>
        <Card.Title title="Ventas por medio de pago" titleStyle={styles.chartTitle} />
        <Card.Content>
          {porMetodo.length === 0 ? (
            <Text style={styles.emptyText}>Sin ventas registradas</Text>
          ) : (
            porMetodo.map((m) => (
              <View key={m.metodo} style={styles.metodoRow}>
                <Text style={styles.metodoName}>{m.metodo === 'billete' ? 'Efectivo' : m.metodo === 'mercadopago' ? 'Mercado Pago' : m.metodo === 'cuentadni' ? 'Cuenta DNI' : m.metodo}</Text>
                <Text style={styles.metodoValue}>${m.total.toLocaleString('es-AR')} · {m.count} tickets</Text>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      <Card style={styles.chartCard}>
        <Card.Title title="Productos más vendidos" titleStyle={styles.chartTitle} />
        <Card.Content>
          {top.length === 0 ? (
            <Text style={styles.emptyText}>Aún no hay productos vendidos</Text>
          ) : (
            top.map((t, idx) => (
              <View key={t.nombre} style={styles.topRow}>
                <Text style={styles.topRank}>#{idx + 1}</Text>
                <Text style={styles.topName} numberOfLines={1}>
                  {t.nombre}
                </Text>
                <Text style={styles.topQty}>{t.cantidad} u. · ${t.total.toLocaleString('es-AR')}</Text>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      <Button mode="contained" buttonColor="#2547F4" textColor="#FFFFFF" icon="download" style={styles.exportButton} contentStyle={styles.exportContent} onPress={exportarExcelHistorial}>
        Exportar Excel (.xlsx)
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
  metodoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  metodoName: { fontFamily: 'Satoshi-Medium', fontSize: 14, color: '#0F172A' },
  metodoValue: { fontFamily: 'Satoshi-Bold', fontSize: 13, color: '#2547F4' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  topRank: { fontFamily: 'Satoshi-Bold', fontSize: 14, color: '#94A3B8', width: 28 },
  topName: { fontFamily: 'Satoshi-Medium', fontSize: 14, color: '#0F172A', flex: 1 },
  topQty: { fontFamily: 'Satoshi-Bold', fontSize: 13, color: '#64748B' },
  emptyText: { fontFamily: 'Satoshi-Regular', textAlign: 'center', color: '#94A3B8', paddingVertical: 12 },
  exportButton: { borderRadius: 16, marginBottom: 15 },
  exportContent: { paddingVertical: 8 },
});