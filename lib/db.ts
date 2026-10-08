import type { SQLiteBindValue, SQLiteDatabase } from 'expo-sqlite';
import * as SQLite from 'expo-sqlite';

/* ════════════════════════════════════════════════════════════════════════
 * Tipos de dominio (compatibles con las pantallas existentes)
 * ════════════════════════════════════════════════════════════════════════ */

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
  /** Parte de la venta que quedó fiada (0 si se cobró completa). */
  fiado?: number;
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

export interface NewProveedor {
  nombre: string;
  whatsapp: string;
  productos: string;
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

/* ════════════════════════════════════════════════════════════════════════
 * Helpers de dinero (se opera en centavos enteros, se persiste en pesos)
 * ════════════════════════════════════════════════════════════════════════ */

/** Pesos → centavos enteros, sin errores de punto flotante (33.7*3 → 10110). */
export function toCents(n: number): number {
  if (!Number.isFinite(n)) throw new RangeError(`Monto inválido: ${n}`);
  const signo = n < 0 ? -1 : 1;
  return signo * Math.round((Math.abs(n) + Number.EPSILON) * 100);
}

/** Centavos enteros → pesos. */
export function fromCents(cents: number): number {
  return cents / 100;
}

/** Redondea a 2 decimales de forma segura. */
export function redondearDinero(n: number): number {
  return fromCents(toCents(n));
}

/** Suma montos en centavos y devuelve pesos exactos. */
export function sumarDinero(...montos: number[]): number {
  return fromCents(montos.reduce((acc, m) => acc + toCents(m), 0));
}

/**
 * Parsea lo que escribe el usuario en un input de monto.
 * - "1500" → 1500 · "1500,50" → 1500.5 · "1.500,50" → 1500.5 · "$ 2.50" → 2.5
 * - "1.500" (punto + exactamente 3 dígitos, sin coma) se interpreta como miles → 1500
 * - Devuelve null si está vacío, no es numérico o es negativo.
 */
export function parseMonto(raw: string): number | null {
  const s = raw.replace(/[$\s]/g, '');
  if (!s) return null;
  let normalizado: string;
  if (s.includes(',')) {
    normalizado = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    normalizado = s.replace(/\./g, '');
  } else {
    normalizado = s;
  }
  if (!/^\d+(\.\d+)?$/.test(normalizado)) return null;
  const n = Number(normalizado);
  return Number.isFinite(n) ? n : null;
}

/* ════════════════════════════════════════════════════════════════════════
 * Helpers de fecha (día LOCAL, no UTC)
 * Las fechas se guardan como ISO UTC; los rangos [desde, hasta) también.
 * ════════════════════════════════════════════════════════════════════════ */

export interface RangoFechas {
  desde: string; // inclusive, ISO
  hasta: string; // exclusive, ISO
}

/** Rango [00:00, 24:00) del día local de `ref`, expresado en ISO UTC. */
export function rangoDia(ref: Date = new Date()): RangoFechas {
  const ini = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const fin = new Date(ini);
  fin.setDate(fin.getDate() + 1);
  return { desde: ini.toISOString(), hasta: fin.toISOString() };
}

/** Rango del día local actual. */
export function rangoHoy(now: Date = new Date()): RangoFechas {
  return rangoDia(now);
}

/** "YYYY-MM-DD" en hora local (para agrupar/comparar días en pantallas). */
export function claveDiaLocal(fecha: string | Date): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/* ════════════════════════════════════════════════════════════════════════
 * Medios de pago
 * Valor persistido para efectivo: 'billete' (es lo que ya usan los datos y
 * las pantallas actuales). Se aceptan alias de entrada: efectivo, mp, dni.
 * ════════════════════════════════════════════════════════════════════════ */

export type MetodoPago = 'billete' | 'mercadopago' | 'cuentadni';

export const METODOS_PAGO: readonly MetodoPago[] = ['billete', 'mercadopago', 'cuentadni'];

const ETIQUETAS_METODO: Record<MetodoPago, string> = {
  billete: 'Efectivo',
  mercadopago: 'Mercado Pago',
  cuentadni: 'Cuenta DNI',
};

/** Normaliza alias a su valor canónico. Vacío/null → 'billete'. Desconocido → lanza. */
export function normalizarMetodoPago(raw?: string | null): MetodoPago {
  const k = (raw ?? '').trim().toLowerCase();
  switch (k) {
    case '':
    case 'billete':
    case 'efectivo':
      return 'billete';
    case 'mp':
    case 'mercadopago':
      return 'mercadopago';
    case 'dni':
    case 'cuentadni':
      return 'cuentadni';
    default:
      throw new VentaInvalidaError(`Medio de pago desconocido: "${raw}"`);
  }
}

/** Igual que normalizarMetodoPago pero nunca lanza (para datos ya persistidos). */
function normalizarSuave(raw?: string | null): string {
  try {
    return normalizarMetodoPago(raw);
  } catch {
    return (raw ?? '').trim() || 'billete';
  }
}

/** Etiqueta para mostrar en UI. Nunca lanza. */
export function etiquetaMetodo(raw?: string | null): string {
  const k = normalizarSuave(raw);
  return (ETIQUETAS_METODO as Record<string, string>)[k] ?? k;
}

/** Expresión SQL equivalente a normalizarMetodoPago (para agrupar datos viejos). */
const SQL_METODO = `CASE
  WHEN metodo_pago IS NULL OR TRIM(metodo_pago) = '' OR LOWER(metodo_pago) IN ('billete','efectivo') THEN 'billete'
  WHEN LOWER(metodo_pago) IN ('mp','mercadopago') THEN 'mercadopago'
  WHEN LOWER(metodo_pago) IN ('dni','cuentadni') THEN 'cuentadni'
  ELSE metodo_pago END`;

/* ════════════════════════════════════════════════════════════════════════
 * Errores de negocio (para que la UI distinga "falta stock" de "falló la DB")
 * ════════════════════════════════════════════════════════════════════════ */

export class VentaInvalidaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VentaInvalidaError';
    Object.setPrototypeOf(this, VentaInvalidaError.prototype);
  }
}

export class StockInsuficienteError extends Error {
  productoId: number;
  nombre: string;
  disponible: number;
  pedido: number;
  constructor(productoId: number, nombre: string, disponible: number, pedido: number) {
    super(`Stock insuficiente de ${nombre}: quedan ${disponible}, se pidieron ${pedido}`);
    this.name = 'StockInsuficienteError';
    this.productoId = productoId;
    this.nombre = nombre;
    this.disponible = disponible;
    this.pedido = pedido;
    Object.setPrototypeOf(this, StockInsuficienteError.prototype);
  }
}

/* ════════════════════════════════════════════════════════════════════════
 * Conexión e inicialización
 * ════════════════════════════════════════════════════════════════════════ */

let dbPromise: Promise<SQLiteDatabase> | null = null;
let initPromise: Promise<void> | null = null;

/** Lo mínimo que comparten la conexión principal y una transacción. */
type Ejecutor = Pick<SQLiteDatabase, 'runAsync' | 'getFirstAsync' | 'getAllAsync'>;

function openDB(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('kiosco.db').catch((err) => {
      dbPromise = null; // permite reintentar si falló la apertura
      throw err;
    });
  }
  return dbPromise;
}

const SCHEMA_VERSION = 2;

async function addColumnIfMissing(db: SQLiteDatabase, table: string, column: string, ddl: string): Promise<void> {
  const cols = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!cols.some((c) => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}

async function ejecutarInit(): Promise<void> {
  const db = await openDB();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS Proveedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      whatsapp TEXT NOT NULL DEFAULT '',
      productos TEXT NOT NULL DEFAULT ''
    );

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
      metodo_pago TEXT,
      fiado REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS Clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      deuda REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS VentasPendientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total REAL NOT NULL,
      fecha TEXT NOT NULL,
      metodo_pago TEXT,
      fiado REAL NOT NULL DEFAULT 0
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

  // Bases creadas con versiones viejas de la app: agregar columnas faltantes (idempotente).
  await addColumnIfMissing(db, 'Productos', 'barcode', 'TEXT');
  await addColumnIfMissing(db, 'Productos', 'categoria', 'TEXT');
  await addColumnIfMissing(db, 'Productos', 'proveedor_id', 'INTEGER');
  await addColumnIfMissing(db, 'Ventas', 'metodo_pago', 'TEXT');
  await addColumnIfMissing(db, 'Ventas', 'fiado', 'REAL NOT NULL DEFAULT 0');
  await addColumnIfMissing(db, 'VentasPendientes', 'metodo_pago', 'TEXT');
  await addColumnIfMissing(db, 'VentasPendientes', 'fiado', 'REAL NOT NULL DEFAULT 0');

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_productos_barcode ON Productos(barcode);
    CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON Productos(proveedor_id);
    CREATE INDEX IF NOT EXISTS idx_productos_stock ON Productos(stock);
    CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON Ventas(fecha);
    CREATE INDEX IF NOT EXISTS idx_ventaitems_venta ON VentaItems(venta_id);
    CREATE INDEX IF NOT EXISTS idx_ventaitems_fecha ON VentaItems(fecha);
    CREATE INDEX IF NOT EXISTS idx_ventaitemspend_pend ON VentaItemsPendientes(pendiente_id);
  `);

  // Migraciones de datos, una sola vez (PRAGMA user_version).
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const versionActual = row?.user_version ?? 0;
  if (versionActual < SCHEMA_VERSION) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const tabla of ['Ventas', 'VentasPendientes']) {
        await txn.execAsync(`
          UPDATE ${tabla} SET metodo_pago = 'billete'
            WHERE metodo_pago IS NULL OR TRIM(metodo_pago) = '' OR LOWER(metodo_pago) = 'efectivo';
          UPDATE ${tabla} SET metodo_pago = 'mercadopago' WHERE LOWER(metodo_pago) = 'mp';
          UPDATE ${tabla} SET metodo_pago = 'cuentadni' WHERE LOWER(metodo_pago) = 'dni';
        `);
      }
      await txn.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    });
  }
}

export function initDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = ejecutarInit().catch((err) => {
      initPromise = null; // permite reintentar
      throw err;
    });
  }
  return initPromise;
}

/* ════════════════════════════════════════════════════════════════════════
 * Productos
 * ════════════════════════════════════════════════════════════════════════ */

export async function insertProducto(producto: NewProducto): Promise<number> {
  const db = await openDB();
  const result = await db.runAsync(
    'INSERT INTO Productos (nombre, precio_costo, precio_venta, stock, imagen_uri, barcode, categoria, proveedor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    producto.nombre,
    redondearDinero(producto.precioCosto),
    redondearDinero(producto.precioVenta),
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
  return db.getAllAsync<Producto>('SELECT * FROM Productos ORDER BY nombre COLLATE NOCASE ASC');
}

/** Búsqueda por nombre resuelta en SQL (para el buscador del home). */
export async function buscarProductos(texto: string, limite = 8): Promise<Producto[]> {
  const q = texto.trim();
  if (!q) return [];
  const patron = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
  const db = await openDB();
  return db.getAllAsync<Producto>(
    "SELECT * FROM Productos WHERE nombre LIKE ? ESCAPE '\\' ORDER BY nombre COLLATE NOCASE ASC LIMIT ?",
    patron,
    limite,
  );
}

/** Productos con stock <= umbral, los más urgentes primero. */
export async function getProductosStockBajo(umbral = 5, limite = 3): Promise<Producto[]> {
  const db = await openDB();
  return db.getAllAsync<Producto>(
    'SELECT * FROM Productos WHERE stock <= ? ORDER BY stock ASC, nombre COLLATE NOCASE ASC LIMIT ?',
    umbral,
    limite,
  );
}

/**
 * @deprecated Pisa el stock con un valor absoluto (condición de carrera).
 * Para ventas usá realizarVenta; para reposiciones, agregarStock.
 */
export async function actualizarStock(id: number, nuevaCantidad: number): Promise<void> {
  const db = await openDB();
  await db.runAsync('UPDATE Productos SET stock = ? WHERE id = ?', nuevaCantidad, id);
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
  const vals: SQLiteBindValue[] = [];
  if (fields.nombre !== undefined) {
    sets.push('nombre = ?');
    vals.push(fields.nombre);
  }
  if (fields.precio_venta !== undefined) {
    sets.push('precio_venta = ?');
    vals.push(redondearDinero(fields.precio_venta));
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
  await db.runAsync(`UPDATE Productos SET ${sets.join(', ')} WHERE id = ?`, vals);
}

export async function getProductosByProveedor(proveedorId: number): Promise<Producto[]> {
  const db = await openDB();
  return db.getAllAsync<Producto>(
    'SELECT * FROM Productos WHERE proveedor_id = ? ORDER BY nombre COLLATE NOCASE ASC',
    proveedorId,
  );
}

export async function asignarProveedorAProducto(productoId: number, proveedorId: number | null): Promise<void> {
  const db = await openDB();
  await db.runAsync('UPDATE Productos SET proveedor_id = ? WHERE id = ?', proveedorId, productoId);
}

export async function getProductoByBarcode(barcode: string): Promise<Producto | null> {
  const db = await openDB();
  return db.getFirstAsync<Producto>('SELECT * FROM Productos WHERE barcode = ?', barcode);
}

export async function getProductoById(id: number): Promise<Producto | null> {
  const db = await openDB();
  return db.getFirstAsync<Producto>('SELECT * FROM Productos WHERE id = ?', id);
}

/* ════════════════════════════════════════════════════════════════════════
 * Clientes / deuda
 * ════════════════════════════════════════════════════════════════════════ */

export async function insertCliente(nombre: string): Promise<number> {
  const db = await openDB();
  const result = await db.runAsync('INSERT INTO Clientes (nombre, deuda) VALUES (?, ?)', nombre, 0);
  return result.lastInsertRowId;
}

export async function getClientes(): Promise<Cliente[]> {
  const db = await openDB();
  return db.getAllAsync<Cliente>('SELECT * FROM Clientes ORDER BY nombre COLLATE NOCASE ASC');
}

/** Suma `delta` a la deuda (puede ser negativo para un pago). La deuda nunca baja de 0. */
async function ajustarDeudaCon(ex: Ejecutor, id: number, delta: number): Promise<void> {
  const res = await ex.runAsync(
    'UPDATE Clientes SET deuda = MAX(0, ROUND(deuda + ?, 2)) WHERE id = ?',
    redondearDinero(delta),
    id,
  );
  if (res.changes === 0) throw new VentaInvalidaError(`Cliente ${id} inexistente`);
}

/**
 * Ajuste RELATIVO de deuda: deuda = deuda + delta (atómico, sin pisar cambios concurrentes).
 * Devuelve la deuda resultante.
 */
export async function ajustarDeuda(id: number, delta: number): Promise<number> {
  const db = await openDB();
  await ajustarDeudaCon(db, id, delta);
  const row = await db.getFirstAsync<{ deuda: number }>('SELECT deuda FROM Clientes WHERE id = ?', id);
  return row?.deuda ?? 0;
}

/**
 * @deprecated Pisa la deuda con un valor absoluto (lost update).
 * Usá ajustarDeuda(id, delta). Se mantiene para no romper imports viejos.
 */
export async function actualizarDeuda(id: number, nuevaDeuda: number): Promise<void> {
  const db = await openDB();
  await db.runAsync('UPDATE Clientes SET deuda = ? WHERE id = ?', redondearDinero(nuevaDeuda), id);
}

/* ════════════════════════════════════════════════════════════════════════
 * Proveedores
 * ════════════════════════════════════════════════════════════════════════ */

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
  return db.getAllAsync<Proveedor>('SELECT * FROM Proveedores ORDER BY nombre COLLATE NOCASE ASC');
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

/* ════════════════════════════════════════════════════════════════════════
 * Ventas (registro atómico)
 * ════════════════════════════════════════════════════════════════════════ */

export interface VentaItem {
  productoId: number;
  cantidad: number;
  /** @deprecated Se ignora: el subtotal se calcula con el precio vigente en la DB. */
  subtotal?: number;
  /** @deprecated Se ignora: el stock se descuenta de forma relativa dentro de la transacción. */
  nuevoStock?: number;
}

export interface FiadoVenta {
  clienteId: number;
  /** Parte de la venta que se carga a la cuenta del cliente (0 < monto <= total). */
  monto: number;
}

export interface ResultadoVenta {
  pendienteId: number;
  /** Total calculado desde la DB (puede diferir del que vio la UI si cambió un precio). */
  total: number;
  fiado: number;
  cobrado: number;
  metodo: MetodoPago;
}

/**
 * Registra una venta de forma ATÓMICA (todo o nada):
 *  1. valida cada producto y descuenta stock de forma relativa (`stock = stock - ? WHERE stock >= ?`)
 *  2. calcula precios y subtotales desde la DB, en centavos
 *  3. inserta la venta pendiente y sus ítems
 *  4. si hay fiado, suma la deuda del cliente en la misma transacción
 * Lanza StockInsuficienteError / VentaInvalidaError; ante cualquier error se hace rollback.
 * Devuelve null si `items` está vacío.
 */
export async function realizarVentaDetallada(
  items: VentaItem[],
  metodo_pago: string | null = null,
  fiado?: FiadoVenta,
): Promise<ResultadoVenta | null> {
  if (items.length === 0) return null;

  const metodo = normalizarMetodoPago(metodo_pago);
  for (const it of items) {
    if (!Number.isInteger(it.productoId)) throw new VentaInvalidaError('Producto inválido');
    if (!Number.isInteger(it.cantidad) || it.cantidad <= 0) {
      throw new VentaInvalidaError(`Cantidad inválida para el producto ${it.productoId}`);
    }
  }

  const db = await openDB();
  const fecha = new Date().toISOString();
  let resultado: ResultadoVenta | null = null;

  await db.withExclusiveTransactionAsync(async (txn) => {
    const lineas: { productoId: number; nombre: string; cantidad: number; precioC: number }[] = [];

    for (const it of items) {
      const prod = await txn.getFirstAsync<{ nombre: string; precio_venta: number }>(
        'SELECT nombre, precio_venta FROM Productos WHERE id = ?',
        it.productoId,
      );
      if (!prod) throw new VentaInvalidaError(`El producto ${it.productoId} ya no existe`);

      const upd = await txn.runAsync(
        'UPDATE Productos SET stock = stock - ? WHERE id = ? AND stock >= ?',
        it.cantidad,
        it.productoId,
        it.cantidad,
      );
      if (upd.changes === 0) {
        const actual = await txn.getFirstAsync<{ stock: number }>('SELECT stock FROM Productos WHERE id = ?', it.productoId);
        throw new StockInsuficienteError(it.productoId, prod.nombre, actual?.stock ?? 0, it.cantidad);
      }
      lineas.push({ productoId: it.productoId, nombre: prod.nombre, cantidad: it.cantidad, precioC: toCents(prod.precio_venta) });
    }

    const totalC = lineas.reduce((s, l) => s + l.precioC * l.cantidad, 0);
    let fiadoC = 0;
    if (fiado) {
      fiadoC = toCents(fiado.monto);
      if (fiadoC <= 0 || fiadoC > totalC) {
        throw new VentaInvalidaError('El monto fiado debe ser mayor a 0 y no superar el total de la venta');
      }
    }

    const venta = await txn.runAsync(
      'INSERT INTO VentasPendientes (total, fecha, metodo_pago, fiado) VALUES (?, ?, ?, ?)',
      fromCents(totalC),
      fecha,
      metodo,
      fromCents(fiadoC),
    );
    const pendienteId = venta.lastInsertRowId;

    for (const l of lineas) {
      await txn.runAsync(
        'INSERT INTO VentaItemsPendientes (pendiente_id, producto_id, nombre, cantidad, precio_unitario, subtotal, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)',
        pendienteId,
        l.productoId,
        l.nombre,
        l.cantidad,
        fromCents(l.precioC),
        fromCents(l.precioC * l.cantidad),
        fecha,
      );
    }

    if (fiado) await ajustarDeudaCon(txn, fiado.clienteId, fromCents(fiadoC));

    resultado = {
      pendienteId,
      total: fromCents(totalC),
      fiado: fromCents(fiadoC),
      cobrado: fromCents(totalC - fiadoC),
      metodo,
    };
  });

  return resultado;
}

/** Misma firma que antes (+ `fiado` opcional). Para el detalle usá realizarVentaDetallada. */
export async function realizarVenta(
  items: VentaItem[],
  metodo_pago: string | null = null,
  fiado?: FiadoVenta,
): Promise<void> {
  await realizarVentaDetallada(items, metodo_pago, fiado);
}

/* ════════════════════════════════════════════════════════════════════════
 * Consultas de ventas (agregadas en SQL, con rango de fechas local)
 * ════════════════════════════════════════════════════════════════════════ */

export interface ResumenMetodo {
  metodo: string;
  /** Facturado (incluye lo fiado). */
  total: number;
  count: number;
  fiado: number;
  /** total - fiado: plata que efectivamente entró por este medio. */
  cobrado: number;
}

export interface ResumenCaja {
  total: number;
  fiado: number;
  cobrado: number;
  count: number;
  ticketPromedio: number;
  porMetodo: ResumenMetodo[];
  /** Plata cobrada por medio (0 si no hubo ventas con ese medio). */
  cobradoPorMetodo: Record<MetodoPago, number>;
}

type TablaVentas = 'Ventas' | 'VentasPendientes';

async function agruparPorMetodo(ex: Ejecutor, tabla: TablaVentas, rango?: RangoFechas): Promise<ResumenMetodo[]> {
  const where = rango ? 'WHERE fecha >= ? AND fecha < ?' : '';
  const params: SQLiteBindValue[] = rango ? [rango.desde, rango.hasta] : [];
  const rows = await ex.getAllAsync<{ metodo: string; total: number | null; fiado: number | null; count: number }>(
    `SELECT ${SQL_METODO} AS metodo, SUM(total) AS total, SUM(fiado) AS fiado, COUNT(*) AS count
       FROM ${tabla} ${where} GROUP BY metodo`,
    params,
  );
  return rows
    .map((r) => {
      const totalC = toCents(r.total ?? 0);
      const fiadoC = toCents(r.fiado ?? 0);
      return {
        metodo: r.metodo,
        total: fromCents(totalC),
        count: r.count,
        fiado: fromCents(fiadoC),
        cobrado: fromCents(totalC - fiadoC),
      };
    })
    .sort((a, b) => b.total - a.total);
}

function construirResumen(porMetodo: ResumenMetodo[]): ResumenCaja {
  let totalC = 0;
  let fiadoC = 0;
  let count = 0;
  const cobradoC: Record<MetodoPago, number> = { billete: 0, mercadopago: 0, cuentadni: 0 };
  for (const m of porMetodo) {
    totalC += toCents(m.total);
    fiadoC += toCents(m.fiado);
    count += m.count;
    if (m.metodo in cobradoC) cobradoC[m.metodo as MetodoPago] += toCents(m.cobrado);
  }
  return {
    total: fromCents(totalC),
    fiado: fromCents(fiadoC),
    cobrado: fromCents(totalC - fiadoC),
    count,
    ticketPromedio: count > 0 ? fromCents(Math.round(totalC / count)) : 0,
    porMetodo,
    cobradoPorMetodo: {
      billete: fromCents(cobradoC.billete),
      mercadopago: fromCents(cobradoC.mercadopago),
      cuentadni: fromCents(cobradoC.cuentadni),
    },
  };
}

/** Ventas cerradas. Sin argumento devuelve todo el historial (como antes). */
export async function getVentas(rango?: RangoFechas): Promise<Venta[]> {
  const db = await openDB();
  if (!rango) return db.getAllAsync<Venta>('SELECT * FROM Ventas ORDER BY fecha DESC, id DESC');
  return db.getAllAsync<Venta>(
    'SELECT * FROM Ventas WHERE fecha >= ? AND fecha < ? ORDER BY fecha DESC, id DESC',
    rango.desde,
    rango.hasta,
  );
}

/** Ventas cerradas del día local de `now`. */
export async function getVentasDelDia(now: Date = new Date()): Promise<Venta[]> {
  return getVentas(rangoDia(now));
}

/** Ventas aún sin cerrar (todas, o las de un rango). */
export async function getVentasPendientes(rango?: RangoFechas): Promise<Venta[]> {
  const db = await openDB();
  if (!rango) return db.getAllAsync<Venta>('SELECT * FROM VentasPendientes ORDER BY fecha DESC, id DESC');
  return db.getAllAsync<Venta>(
    'SELECT * FROM VentasPendientes WHERE fecha >= ? AND fecha < ? ORDER BY fecha DESC, id DESC',
    rango.desde,
    rango.hasta,
  );
}

/** Totales por medio de pago en SQL. Sin argumento: historial completo (como antes). */
export async function getVentasPorMetodo(rango?: RangoFechas): Promise<ResumenMetodo[]> {
  const db = await openDB();
  return agruparPorMetodo(db, 'Ventas', rango);
}

/** Totales por medio de pago del día local. */
export async function getVentasPorMetodoDelDia(now: Date = new Date()): Promise<ResumenMetodo[]> {
  return getVentasPorMetodo(rangoDia(now));
}

/** Resumen de caja de las ventas cerradas del día local (una sola consulta). */
export async function getResumenDelDia(now: Date = new Date()): Promise<ResumenCaja> {
  return construirResumen(await getVentasPorMetodoDelDia(now));
}

/** Resumen de TODO lo pendiente de cierre: es exactamente lo que va a mover confirmarCierre(). */
export async function getResumenPendientes(): Promise<ResumenCaja> {
  const db = await openDB();
  return construirResumen(await agruparPorMetodo(db, 'VentasPendientes'));
}

export async function getTopProductos(
  limit = 5,
  rango?: RangoFechas,
): Promise<{ nombre: string; cantidad: number; total: number }[]> {
  const db = await openDB();
  const where = rango ? 'WHERE fecha >= ? AND fecha < ?' : '';
  const params: SQLiteBindValue[] = rango ? [rango.desde, rango.hasta, limit] : [limit];
  return db.getAllAsync<{ nombre: string; cantidad: number; total: number }>(
    `SELECT nombre, SUM(cantidad) AS cantidad, ROUND(SUM(subtotal), 2) AS total
       FROM VentaItems ${where}
       GROUP BY nombre ORDER BY cantidad DESC LIMIT ?`,
    params,
  );
}

/* ════════════════════════════════════════════════════════════════════════
 * Cierre de caja
 * ════════════════════════════════════════════════════════════════════════ */

export interface ResultadoCierre {
  movidas: number;
  total: number;
  fiado: number;
  cobrado: number;
}

interface VentaPendienteRow {
  id: number;
  total: number;
  fecha: string;
  metodo_pago: string | null;
  fiado: number | null;
}

interface VentaItemPendienteRow {
  id: number;
  pendiente_id: number;
  producto_id: number | null;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  fecha: string;
}

/**
 * Mueve TODAS las ventas pendientes a Ventas/VentaItems.
 * Lectura, copia y borrado ocurren dentro de la misma transacción exclusiva: una venta
 * que entre durante el cierre no puede borrarse sin haberse movido.
 * (Para mostrar de antemano qué se va a cerrar, usá getResumenPendientes().)
 */
export async function confirmarCierre(): Promise<ResultadoCierre> {
  const db = await openDB();
  let resultado: ResultadoCierre = { movidas: 0, total: 0, fiado: 0, cobrado: 0 };

  await db.withExclusiveTransactionAsync(async (txn) => {
    const pendientes = await txn.getAllAsync<VentaPendienteRow>('SELECT * FROM VentasPendientes ORDER BY id ASC');
    if (pendientes.length === 0) return;

    const todosLosItems = await txn.getAllAsync<VentaItemPendienteRow>('SELECT * FROM VentaItemsPendientes');
    const itemsPorPendiente = new Map<number, VentaItemPendienteRow[]>();
    for (const it of todosLosItems) {
      const lista = itemsPorPendiente.get(it.pendiente_id);
      if (lista) lista.push(it);
      else itemsPorPendiente.set(it.pendiente_id, [it]);
    }

    let totalC = 0;
    let fiadoC = 0;
    for (const v of pendientes) {
      const res = await txn.runAsync(
        'INSERT INTO Ventas (total, fecha, metodo_pago, fiado) VALUES (?, ?, ?, ?)',
        v.total,
        v.fecha,
        normalizarSuave(v.metodo_pago),
        v.fiado ?? 0,
      );
      const nuevaVentaId = res.lastInsertRowId;
      for (const it of itemsPorPendiente.get(v.id) ?? []) {
        await txn.runAsync(
          'INSERT INTO VentaItems (venta_id, producto_id, nombre, cantidad, precio_unitario, subtotal, fecha) VALUES (?, ?, ?, ?, ?, ?, ?)',
          nuevaVentaId,
          it.producto_id,
          it.nombre,
          it.cantidad,
          it.precio_unitario,
          it.subtotal,
          it.fecha,
        );
      }
      totalC += toCents(v.total);
      fiadoC += toCents(v.fiado ?? 0);
    }

    // Solo se borra lo que se acaba de mover (los ids AUTOINCREMENT son crecientes).
    const maxId = pendientes[pendientes.length - 1].id;
    await txn.runAsync('DELETE FROM VentaItemsPendientes WHERE pendiente_id <= ?', maxId);
    await txn.runAsync('DELETE FROM VentasPendientes WHERE id <= ?', maxId);

    resultado = {
      movidas: pendientes.length,
      total: fromCents(totalC),
      fiado: fromCents(fiadoC),
      cobrado: fromCents(totalC - fiadoC),
    };
  });

  return resultado;
}