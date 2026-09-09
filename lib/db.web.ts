export interface Producto {
  id: number;
  nombre: string;
  precio_costo: number;
  precio_venta: number;
  stock: number;
  imagen_uri: string | null;
  barcode?: string | null;
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
}

export interface VentaItem {
  productoId: number;
  cantidad: number;
  subtotal: number;
  nuevoStock: number;
}

export interface NewProveedor {
  nombre: string;
  whatsapp: string;
  productos: string;
}

function getStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, value: T) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {}
}

export async function initDatabase(): Promise<void> {}

export async function insertProducto(producto: NewProducto): Promise<number> {
  const list = getStorage<Producto[]>('kiosco_productos', []);
  const id = list.length > 0 ? Math.max(...list.map((p) => p.id)) + 1 : 1;
  list.push({
    id,
    nombre: producto.nombre,
    precio_costo: producto.precioCosto,
    precio_venta: producto.precioVenta,
    stock: producto.stock,
    imagen_uri: producto.imagenUri,
    barcode: producto.barcode ?? null,
  });
  setStorage('kiosco_productos', list);
  return id;
}

export async function getProductos(): Promise<Producto[]> {
  const list = getStorage<Producto[]>('kiosco_productos', []);
  return [...list].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function actualizarStock(id: number, nuevaCantidad: number): Promise<void> {
  const list = getStorage<Producto[]>('kiosco_productos', []);
  const idx = list.findIndex((p) => p.id === id);
  if (idx !== -1) {
    list[idx].stock = nuevaCantidad;
    setStorage('kiosco_productos', list);
  }
}

export async function registrarVenta(total: number, metodo_pago: string | null = null): Promise<number> {
  const list = getStorage<Venta[]>('kiosco_ventas', []);
  const id = list.length > 0 ? Math.max(...list.map((v) => v.id)) + 1 : 1;
  const venta: Venta = { id, total, fecha: new Date().toISOString(), metodo_pago };
  list.push(venta);
  setStorage('kiosco_ventas', list);
  return id;
}

export async function realizarVenta(items: VentaItem[], metodo_pago: string | null = null): Promise<void> {
  if (items.length === 0) return;
  const total = items.reduce((s, i) => s + i.subtotal, 0);
  await registrarVenta(total, metodo_pago);
  for (const item of items) {
    await actualizarStock(item.productoId, item.nuevoStock);
  }
}

export async function agregarStock(id: number, cantidad: number): Promise<void> {
  const list = getStorage<Producto[]>('kiosco_productos', []);
  const idx = list.findIndex((p) => p.id === id);
  if (idx !== -1) {
    list[idx].stock += cantidad;
    setStorage('kiosco_productos', list);
  }
}

export async function insertCliente(nombre: string): Promise<number> {
  const list = getStorage<Cliente[]>('kiosco_clientes', []);
  const id = list.length > 0 ? Math.max(...list.map((c) => c.id)) + 1 : 1;
  list.push({ id, nombre, deuda: 0 });
  setStorage('kiosco_clientes', list);
  return id;
}

export async function getClientes(): Promise<Cliente[]> {
  const list = getStorage<Cliente[]>('kiosco_clientes', []);
  return [...list].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function actualizarDeuda(id: number, nuevaDeuda: number): Promise<void> {
  const list = getStorage<Cliente[]>('kiosco_clientes', []);
  const idx = list.findIndex((c) => c.id === id);
  if (idx !== -1) {
    list[idx].deuda = nuevaDeuda;
    setStorage('kiosco_clientes', list);
  }
}

export async function insertProveedor(prov: NewProveedor): Promise<number> {
  const list = getStorage<Proveedor[]>('kiosco_proveedores', []);
  const id = list.length > 0 ? Math.max(...list.map((p) => p.id)) + 1 : 1;
  list.push({ id, ...prov });
  setStorage('kiosco_proveedores', list);
  return id;
}

export async function getProveedores(): Promise<Proveedor[]> {
  const list = getStorage<Proveedor[]>('kiosco_proveedores', []);
  return [...list].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function updateProveedor(id: number, prov: NewProveedor): Promise<void> {
  const list = getStorage<Proveedor[]>('kiosco_proveedores', []);
  const idx = list.findIndex((p) => p.id === id);
  if (idx !== -1) {
    list[idx] = { id, ...prov };
    setStorage('kiosco_proveedores', list);
  }
}

export async function getProductoByBarcode(barcode: string): Promise<Producto | null> {
  const list = getStorage<Producto[]>('kiosco_productos', []);
  return list.find((p) => p.barcode === barcode) || null;
}

export async function getProductoById(id: number): Promise<Producto | null> {
  const list = getStorage<Producto[]>('kiosco_productos', []);
  return list.find((p) => p.id === id) || null;
}

export async function getVentas(): Promise<Venta[]> {
  const list = getStorage<Venta[]>('kiosco_ventas', []);
  return [...list].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}