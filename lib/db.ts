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
}

export interface Venta {
  id: number;
  total: number;
  fecha: string;
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
      imagen_uri TEXT
    );

    CREATE TABLE IF NOT EXISTS Ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total REAL NOT NULL,
      fecha TEXT NOT NULL
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
  `);
}

export async function insertProducto(producto: NewProducto): Promise<number> {
  const db = await openDB();
  const result = await db.runAsync(
    'INSERT INTO Productos (nombre, precio_costo, precio_venta, stock, imagen_uri) VALUES (?, ?, ?, ?, ?)',
    producto.nombre,
    producto.precioCosto,
    producto.precioVenta,
    producto.stock,
    producto.imagenUri,
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

export async function registrarVenta(total: number): Promise<number> {
  const db = await openDB();
  const fecha = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO Ventas (total, fecha) VALUES (?, ?)',
    total,
    fecha,
  );
  return result.lastInsertRowId;
}

export interface VentaItem {
  productoId: number;
  cantidad: number;
  subtotal: number;
  nuevoStock: number;
}

export async function realizarVenta(items: VentaItem[]): Promise<void> {
  const db = await openDB();
  if (items.length === 0) return;

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);
  const fecha = new Date().toISOString();

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('INSERT INTO Ventas (total, fecha) VALUES (?, ?)', total, fecha);
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

export async function getVentas(): Promise<Venta[]> {
  const db = await openDB();
  return db.getAllAsync<Venta>(
    'SELECT * FROM Ventas ORDER BY fecha DESC, id DESC',
  );
}