import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

let dbPromise: Promise<SQLiteDatabase> | null = null;

export interface Producto {
  id: number;
  nombre: string;
  precio_costo: number;
  precio_venta: number;
  stock: number;
  imagen_uri: string | null;
  barcode?: string | null;
  categoria?: string | null;
  proveedor_id?: number | null;
}

export interface Venta {
  id: number;
  total: number;
  fecha: string;
  metodo_pago?: string | null;
}

export interface Cliente {
  id: number;
  nombre: string;
  deuda: number;
}

export interface Proveedor {
  id: number;
  nombre: string;
  whatsapp: string;
  productos: string;
}

export interface NewProducto {
  nombre: string;
  precioCosto: number;
  precioVenta: number;
  stock: number;
  imagenUri: string | null;
  barcode?: string | null;
  categoria?: string | null;
  proveedor_id?: number | null;
}

function openDB(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('kiosco.db');
  }
  return dbPromise;
}

export async function initDatabase(): Promise<void> {
  const db = await openDB();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS Productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio_costo REAL NOT NULL DEFAULT 0,
      precio_venta REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      imagen_uri TEXT,
      barcode TEXT,
      categoria TEXT,
      proveedor_id INTEGER REFERENCES Proveedores(id)
    );

    CREATE TABLE IF NOT EXISTS Ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total REAL NOT NULL,
      fecha TEXT NOT NULL,
      metodo_pago TEXT
    );

    CREATE TABLE IF NOT EXISTS Clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      deuda REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS Proveedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      whatsapp TEXT NOT NULL DEFAULT '',
      productos TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS VentasPendientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total REAL NOT NULL,
      fecha TEXT NOT NULL,
      metodo_pago TEXT
    );

    CREATE TABLE IF NOT EXISTS VentaItems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL REFERENCES Ventas(id) ON DELETE CASCADE,
      producto_id INTEGER REFERENCES Productos(id),
      nombre TEXT NOT NULL,
      cantidad INTEGER NOT NULL,
      precio_unitario REAL NOT NULL,
      subtotal REAL NOT NULL,
      fecha TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS VentaItemsPendientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pendiente_id INTEGER NOT NULL REFERENCES VentasPendientes(id) ON DELETE CASCADE,
      producto_id INTEGER REFERENCES Productos(id),
      nombre TEXT NOT NULL,
      cantidad INTEGER NOT NULL,
      precio_unitario REAL NOT NULL,
      subtotal REAL NOT NULL,
      fecha TEXT NOT NULL
    );
  `);
  try {
    await db.execAsync('ALTER TABLE Productos ADD COLUMN barcode TEXT');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE Ventas ADD COLUMN metodo_pago TEXT');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE Productos ADD COLUMN categoria TEXT');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE Productos ADD COLUMN proveedor_id INTEGER');
  } catch {}
  try {
    await db.execAsync('CREATE TABLE IF NOT EXISTS VentasPendientes (id INTEGER PRIMARY KEY AUTOINCREMENT, total REAL NOT NULL, fecha TEXT NOT NULL, metodo_pago TEXT)');
  } catch {}
  try {
    await db.execAsync('CREATE TABLE IF NOT EXISTS VentaItems (id INTEGER PRIMARY KEY AUTOINCREMENT, venta_id INTEGER NOT NULL, producto_id INTEGER, nombre TEXT NOT NULL, cantidad INTEGER NOT NULL, precio_unitario REAL NOT NULL, subtotal REAL NOT NULL, fecha TEXT NOT NULL)');
  } catch {}
  try {
    await db.execAsync('CREATE TABLE IF NOT EXISTS VentaItemsPendientes (id INTEGER PRIMARY KEY AUTOINCREMENT, pendiente_id INTEGER NOT NULL, producto_id INTEGER, nombre TEXT NOT NULL, cantidad INTEGER NOT NULL, precio_unitario REAL NOT NULL, subtotal REAL NOT NULL, fecha TEXT NOT NULL)');
  } catch {}
}

export async function insertProducto(producto: NewProducto): Promise<number> {
  const db = await openDB();
  const result = await db.runAsync(
    'INSERT INTO Productos (nombre, precio_costo, precio_venta, stock, imagen_uri, barcode, categoria, proveedor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    producto.nombre,
    producto.precioCosto,
    producto.precioVenta,
    producto.stock,
    producto.imagenUri,
    producto.barcode ?? null,
    producto.categoria ?? null,
    producto.proveedor_id ?? null,
  );
  return result.lastInsertRowId;
}

export async function getProductos(): Promise<Producto[]> {
  const db = await openDB();
  return db.getAllAsync<Producto>(
    'SELECT * FROM Productos ORDER BY nombre COLLATE NOCASE ASC',
  );
}

export async function actualizarStock(id: number, nuevaCantidad: number): Promise<void> {
  const db = await openDB();
  await db.runAsync('UPDATE Productos SET stock = ? WHERE id = ?', nuevaCantidad, id);
}

export async function registrarVenta(total: number, metodo_pago: string | null = null): Promise<number> {
  const db = await openDB();
  const fecha = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO Ventas (total, fecha, metodo_pago) VALUES (?, ?, ?)',
    total,
    fecha,
    metodo_pago,
  );
  return result.lastInsertRowId;
}

export interface VentaItem {
  productoId: number;
  cantidad: number;
  subtotal: number;
  nuevoStock: number;
}

export async function realizarVenta(items: VentaItem[], metodo_pago: string | null = null): Promise<void> {
  const db = await openDB();
  if (items.length === 0) return;

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  const fecha = new Date().toISOString();
  const metodoNorm =
    metodo_pago === 'mp' ? 'mercadopago' : metodo_pago === 'dni' ? 'cuentadni' : metodo_pago || 'billete';

  await db.withExclusiveTransactionAsync(async (txn) => {
    const res = await txn.runAsync('INSERT INTO VentasPendientes (total, fecha, metodo_pago) VALUES (?, ?, ?)', total, fecha, metodoNorm);
    const pendienteId = res.lastInsertRowId;
    for (const item of items) {
      const prod = await txn.getFirstAsync<Producto>('SELECT * FROM Productos WHERE id = ?', item.productoId);
      const nombre = prod?.nombre ?? `Producto ${item.productoId}`;
      const precio = prod?.precio_venta ?? item.subtotal / item.cantidad;
      await txn.runAsync(
        'INSERT INTO VentaItemsPendientes (pendiente_id, producto_id, nombre, cantidad, precio_unitario, subtotal, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)',
        pendienteId,
        item.productoId,
        nombre,
        item.cantidad,
        precio,
        item.subtotal,
        fecha,
      );
    }
    for (const item of items) {
      await txn.runAsync(
        'UPDATE Productos SET stock = ? WHERE id = ?',
        item.nuevoStock,
        item.productoId,
      );
    }
  });
}

export async function agregarStock(id: number, cantidad: number): Promise<void> {
  const db = await openDB();
  await db.runAsync('UPDATE Productos SET stock = stock + ? WHERE id = ?', cantidad, id);
}

export async function updateProducto(
  id: number,
  fields: Partial<{ nombre: string; precio_venta: number; stock: number; categoria: string | null; proveedor_id: number | null }>,
): Promise<void> {
  const db = await openDB();
  const sets: string[] = [];
  const vals: any[] = [];
  if (fields.nombre !== undefined) {
    sets.push('nombre = ?');
    vals.push(fields.nombre);
  }
  if (fields.precio_venta !== undefined) {
    sets.push('precio_venta = ?');
    vals.push(fields.precio_venta);
  }
  if (fields.stock !== undefined) {
    sets.push('stock = ?');
    vals.push(fields.stock);
  }
  if (fields.categoria !== undefined) {
    sets.push('categoria = ?');
    vals.push(fields.categoria);
  }
  if (fields.proveedor_id !== undefined) {
    sets.push('proveedor_id = ?');
    vals.push(fields.proveedor_id);
  }
  if (sets.length === 0) return;
  vals.push(id);
  await db.runAsync(`UPDATE Productos SET ${sets.join(', ')} WHERE id = ?`, ...(vals as any));
}

export async function getVentasPendientes(): Promise<Venta[]> {
  const db = await openDB();
  return db.getAllAsync<Venta>('SELECT * FROM VentasPendientes ORDER BY fecha DESC, id DESC');
}

export async function confirmarCierre(): Promise<{ movidas: number; total: number }> {
  const db = await openDB();
  const pendientes = await db.getAllAsync<Venta>('SELECT * FROM VentasPendientes');
  if (pendientes.length === 0) return { movidas: 0, total: 0 };
  const total = pendientes.reduce((s, v) => s + v.total, 0);
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const v of pendientes) {
      const res = await txn.runAsync('INSERT INTO Ventas (total, fecha, metodo_pago) VALUES (?, ?, ?)', v.total, v.fecha, v.metodo_pago ?? null);
      const newVentaId = res.lastInsertRowId;
      const items = await txn.getAllAsync<any>('SELECT * FROM VentaItemsPendientes WHERE pendiente_id = ?', v.id);
      for (const it of items) {
        await txn.runAsync(
          'INSERT INTO VentaItems (venta_id, producto_id, nombre, cantidad, precio_unitario, subtotal, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)',
          newVentaId,
          it.producto_id,
          it.nombre,
          it.cantidad,
          it.precio_unitario,
          it.subtotal,
          it.fecha,
        );
      }
    }
    await txn.runAsync('DELETE FROM VentaItemsPendientes');
    await txn.runAsync('DELETE FROM VentasPendientes');
  });
  return { movidas: pendientes.length, total };
}

export interface VentaItemDB {
  id: number;
  venta_id: number;
  producto_id: number | null;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  fecha: string;
}

export async function getVentasPorMetodo(): Promise<{ metodo: string; total: number; count: number }[]> {
  const db = await openDB();
  const rows = await db.getAllAsync<{ metodo_pago: string | null; total: number }>('SELECT metodo_pago, total FROM Ventas');
  const map = new Map<string, { total: number; count: number }>();
  for (const r of rows) {
    const key = r.metodo_pago || 'billete';
    const cur = map.get(key) || { total: 0, count: 0 };
    cur.total += r.total;
    cur.count += 1;
    map.set(key, cur);
  }
  return Array.from(map.entries()).map(([metodo, v]) => ({ metodo, ...v }));
}

export async function getTopProductos(limit = 5): Promise<{ nombre: string; cantidad: number; total: number }[]> {
  const db = await openDB();
  try {
    const rows = await db.getAllAsync<{ nombre: string; cantidad: number; total: number }>(
      'SELECT nombre, SUM(cantidad) as cantidad, SUM(subtotal) as total FROM VentaItems GROUP BY nombre ORDER BY cantidad DESC LIMIT ?',
      limit,
    );
    return rows;
  } catch {
    return [];
  }
}

export async function getProductosByProveedor(proveedorId: number): Promise<Producto[]> {
  const db = await openDB();
  return db.getAllAsync<Producto>('SELECT * FROM Productos WHERE proveedor_id = ? ORDER BY nombre COLLATE NOCASE ASC', proveedorId);
}

export async function asignarProveedorAProducto(productoId: number, proveedorId: number | null): Promise<void> {
  const db = await openDB();
  await db.runAsync('UPDATE Productos SET proveedor_id = ? WHERE id = ?', proveedorId, productoId);
}

export async function insertCliente(nombre: string): Promise<number> {
  const db = await openDB();
  const result = await db.runAsync(
    'INSERT INTO Clientes (nombre, deuda) VALUES (?, ?)',
    nombre,
    0,
  );
  return result.lastInsertRowId;
}

export async function getClientes(): Promise<Cliente[]> {
  const db = await openDB();
  return db.getAllAsync<Cliente>(
    'SELECT * FROM Clientes ORDER BY nombre COLLATE NOCASE ASC',
  );
}

export async function actualizarDeuda(id: number, nuevaDeuda: number): Promise<void> {
  const db = await openDB();
  await db.runAsync('UPDATE Clientes SET deuda = ? WHERE id = ?', nuevaDeuda, id);
}

export interface NewProveedor {
  nombre: string;
  whatsapp: string;
  productos: string;
}

export async function insertProveedor(prov: NewProveedor): Promise<number> {
  const db = await openDB();
  const result = await db.runAsync(
    'INSERT INTO Proveedores (nombre, whatsapp, productos) VALUES (?, ?, ?)',
    prov.nombre,
    prov.whatsapp,
    prov.productos,
  );
  return result.lastInsertRowId;
}

export async function getProveedores(): Promise<Proveedor[]> {
  const db = await openDB();
  return db.getAllAsync<Proveedor>(
    'SELECT * FROM Proveedores ORDER BY nombre COLLATE NOCASE ASC',
  );
}

export async function updateProveedor(id: number, prov: NewProveedor): Promise<void> {
  const db = await openDB();
  await db.runAsync(
    'UPDATE Proveedores SET nombre = ?, whatsapp = ?, productos = ? WHERE id = ?',
    prov.nombre,
    prov.whatsapp,
    prov.productos,
    id,
  );
}

export async function getProductoByBarcode(barcode: string): Promise<Producto | null> {
  const db = await openDB();
  return db.getFirstAsync<Producto>('SELECT * FROM Productos WHERE barcode = ?', barcode);
}

export async function getProductoById(id: number): Promise<Producto | null> {
  const db = await openDB();
  return db.getFirstAsync<Producto>('SELECT * FROM Productos WHERE id = ?', id);
}

export async function getVentas(): Promise<Venta[]> {
  const db = await openDB();
  return db.getAllAsync<Venta>(
    'SELECT * FROM Ventas ORDER BY fecha DESC, id DESC',
  );
}