import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import { getVentas, getTopProductos, getVentasPorMetodo, getProductos } from '@/lib/db';

export async function exportarExcelHistorial(): Promise<void> {
  try {
    const [ventas, productos, porMetodo, top] = await Promise.all([
      getVentas(),
      getProductos(),
      getVentasPorMetodo(),
      getTopProductos(10),
    ]);

    const wb = XLSX.utils.book_new();

    const ventasSheet = ventas.map((v) => ({
      ID: v.id,
      Fecha: new Date(v.fecha).toLocaleString('es-AR'),
      Total: v.total,
      Metodo: v.metodo_pago || 'billete',
    }));
    const wsVentas = XLSX.utils.json_to_sheet(ventasSheet);
    XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas');

    const productosSheet = productos.map((p) => ({
      ID: p.id,
      Nombre: p.nombre,
      Costo: p.precio_costo,
      Venta: p.precio_venta,
      Stock: p.stock,
      Categoria: p.categoria || '',
      Barcode: p.barcode || '',
    }));
    const wsProd = XLSX.utils.json_to_sheet(productosSheet);
    XLSX.utils.book_append_sheet(wb, wsProd, 'Productos');

    const metodoSheet = porMetodo.map((m) => ({
      Metodo: m.metodo,
      Total: m.total,
      Tickets: m.count,
    }));
    const wsMetodo = XLSX.utils.json_to_sheet(metodoSheet);
    XLSX.utils.book_append_sheet(wb, wsMetodo, 'Por Metodo');

    const topSheet = top.map((t) => ({ Producto: t.nombre, Cantidad: t.cantidad, Total: t.total }));
    const wsTop = XLSX.utils.json_to_sheet(topSheet);
    XLSX.utils.book_append_sheet(wb, wsTop, 'Top Productos');

    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    if (Platform.OS === 'web') {
      const blob = Buffer.from(base64, 'base64');
      // @ts-ignore
      const url = typeof window !== 'undefined' ? window.URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })) : '';
      if (url && typeof window !== 'undefined') {
        const a = document.createElement('a');
        a.href = url;
        a.download = `kiosco-historial-${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      }
      return;
    }

    const fileName = `kiosco-historial-${Date.now()}.xlsx`;
    const baseDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';
    const fileUri = baseDir + fileName;
    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: (FileSystem as any).EncodingType?.Base64 || 'base64' as any });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Compartir Excel',
        UTI: 'com.microsoft.excel.xlsx',
      });
    } else {
      Alert.alert('Excel generado', `Archivo guardado en: ${fileUri}`);
    }
  } catch (e) {
    console.error(e);
    Alert.alert('Error', 'No se pudo generar el Excel');
  }
}

export async function exportarReporteCaja(
  ventasHoy: { id: number; total: number; fecha: string; metodo_pago?: string | null }[],
  resumen: { total: number; porMetodo: { metodo: string; total: number; count: number }[]; top: { nombre: string; cantidad: number; total: number }[] },
): Promise<void> {
  try {
    const wb = XLSX.utils.book_new();

    const header = [
      { Campo: 'Fecha', Valor: new Date().toLocaleString('es-AR') },
      { Campo: 'Total facturado', Valor: resumen.total },
      { Campo: 'Tickets', Valor: ventasHoy.length },
    ];
    const wsHeader = XLSX.utils.json_to_sheet(header);
    XLSX.utils.book_append_sheet(wb, wsHeader, 'Resumen');

    const porMetodoSheet = resumen.porMetodo.map((m) => ({ Metodo: m.metodo, Total: m.total, Tickets: m.count }));
    const wsMetodo = XLSX.utils.json_to_sheet(porMetodoSheet);
    XLSX.utils.book_append_sheet(wb, wsMetodo, 'Por Metodo');

    const topSheet = resumen.top.map((t) => ({ Producto: t.nombre, Cantidad: t.cantidad, Total: t.total }));
    const wsTop = XLSX.utils.json_to_sheet(topSheet);
    XLSX.utils.book_append_sheet(wb, wsTop, 'Top Productos');

    const ventasSheet = ventasHoy.map((v) => ({
      ID: v.id,
      Hora: new Date(v.fecha).toLocaleTimeString('es-AR'),
      Total: v.total,
      Metodo: v.metodo_pago || 'billete',
    }));
    const wsVentas = XLSX.utils.json_to_sheet(ventasSheet);
    XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas Hoy');

    const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    if (Platform.OS === 'web') {
      const blob = Buffer.from(base64, 'base64');
      const url = typeof window !== 'undefined' ? window.URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })) : '';
      if (url && typeof window !== 'undefined') {
        const a = document.createElement('a');
        a.href = url;
        a.download = `caja-${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      }
      return;
    }

    const fileName = `caja-${Date.now()}.xlsx`;
    const baseDir2 = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';
    const fileUri = baseDir2 + fileName;
    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: (FileSystem as any).EncodingType?.Base64 || 'base64' as any });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Compartir Excel',
        UTI: 'com.microsoft.excel.xlsx',
      });
    } else {
      Alert.alert('Excel generado', `Archivo guardado en: ${fileUri}`);
    }
  } catch (e) {
    console.error(e);
    Alert.alert('Error', 'No se pudo generar el Excel');
  }
}