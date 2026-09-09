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
    categoria: producto.categoria ?? null,
    proveedor_id: producto.proveedor_id ?? null,
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

export async function updateProducto(
  id: number,
  fields: Partial<{ nombre: string; precio_venta: number; stock: number; categoria: string | null; proveedor_id: number | null }>,
): Promise<void> {
  const list = getStorage<Producto[]>('kiosco_productos', []);
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return;
  if (fields.nombre !== undefined) list[idx].nombre = fields.nombre;
  if (fields.precio_venta !== undefined) list[idx].precio_venta = fields.precio_venta;
  if (fields.stock !== undefined) list[idx].stock = fields.stock;
  if (fields.categoria !== undefined) list[idx].categoria = fields.categoria;
  if (fields.proveedor_id !== undefined) list[idx].proveedor_id = fields.proveedor_id;
  setStorage('kiosco_productos', list);
}

export async function getProductosByProveedor(proveedorId: number): Promise<Producto[]> {
  const list = getStorage<Producto[]>('kiosco_productos', []);
  return list.filter((p) => p.proveedor_id === proveedorId).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function asignarProveedorAProducto(productoId: number, proveedorId: number | null): Promise<void> {
  await updateProducto(productoId, { proveedor_id: proveedorId });
}

export async function registrarVenta(total: number, metodo_pago: string | null = null): Promise<number> {
  const list = getStorage<Venta[]>('kiosco_ventas', []);
  const id = list.length > 0 ? Math.max(...list.map((v) => v.id)) + 1 : 1;
  const venta: Venta = { id, total, fecha: new Date().toISOString(), metodo_pago: metodo_pago || 'billete' };
  list.push(venta);
  setStorage('kiosco_ventas', list);
  return id;
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

export async function realizarVenta(items: VentaItem[], metodo_pago: string | null = null): Promise<void> {
  if (items.length === 0) return;
  const total = items.reduce((s, i) => s + i.subtotal, 0);
  const metodoNorm = metodo_pago === 'mp' ? 'mercadopago' : metodo_pago === 'dni' ? 'cuentadni' : metodo_pago || 'billete';
  const fecha = new Date().toISOString();
  const pendientes = getStorage<Venta[]>('kiosco_pendientes', []);
  const id = pendientes.length > 0 ? Math.max(...pendientes.map((v) => v.id)) + 1 : 1;
  pendientes.push({ id, total, fecha, metodo_pago: metodoNorm });
  setStorage('kiosco_pendientes', pendientes);
  const itemsPend = getStorage<any[]>('kiosco_items_pendientes', []);
  for (const item of items) {
    const allProd = getStorage<Producto[]>('kiosco_productos', []);
    const prod = allProd.find((p) => p.id === item.productoId);
    itemsPend.push({
      id: itemsPend.length + 1,
      pendiente_id: id,
      producto_id: item.productoId,
      nombre: prod?.nombre ?? `Producto ${item.productoId}`,
      cantidad: item.cantidad,
      precio_unitario: prod?.precio_venta ?? item.subtotal / item.cantidad,
      subtotal: item.subtotal,
      fecha,
    });
  }
  setStorage('kiosco_items_pendientes', itemsPend);
  for (const item of items) {
    await actualizarStock(item.productoId, item.nuevoStock);
  }
}

export async function getVentasPorMetodo(): Promise<{ metodo: string; total: number; count: number }[]> {
  const ventas = getStorage<Venta[]>('kiosco_ventas', []);
  const map = new Map<string, { total: number; count: number }>();
  for (const v of ventas) {
    const key = v.metodo_pago || 'billete';
    const cur = map.get(key) || { total: 0, count: 0 };
    cur.total += v.total;
    cur.count += 1;
    map.set(key, cur);
  }
  return Array.from(map.entries()).map(([metodo, v]) => ({ metodo, ...v }));
}

export async function getTopProductos(limit = 5): Promise<{ nombre: string; cantidad: number; total: number }[]> {
  const items = getStorage<VentaItemDB[]>('kiosco_items', []);
  const map = new Map<string, { cantidad: number; total: number }>();
  for (const it of items) {
    const cur = map.get(it.nombre) || { cantidad: 0, total: 0 };
    cur.cantidad += it.cantidad;
    cur.total += it.subtotal;
    map.set(it.nombre, cur);
  }
  return Array.from(map.entries())
    .map(([nombre, v]) => ({ nombre, ...v }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, limit);
}

export async function getVentasPendientes(): Promise<Venta[]> {
  const list = getStorage<Venta[]>('kiosco_pendientes', []);
  return [...list].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
}

export async function confirmarCierre(): Promise<{ movidas: number; total: number }> {
  const pendientes = getStorage<Venta[]>('kiosco_pendientes', []);
  if (pendientes.length === 0) return { movidas: 0, total: 0 };
  const total = pendientes.reduce((s, v) => s + v.total, 0);
  const ventas = getStorage<Venta[]>('kiosco_ventas', []);
  const itemsPend = getStorage<VentaItemDB[]>('kiosco_items_pendientes', []);
  const items = getStorage<VentaItemDB[]>('kiosco_items', []);
  let nextId = ventas.length > 0 ? Math.max(...ventas.map((v) => v.id)) + 1 : 1;
  let nextItemId = items.length > 0 ? Math.max(...items.map((i) => i.id)) + 1 : 1;
  const idMap = new Map<number, number>();
  for (const v of pendientes) {
    const newId = nextId++;
    idMap.set(v.id, newId);
    ventas.push({ ...v, id: newId });
  }
  for (const it of itemsPend) {
    const newVentaId = idMap.get((it as any).pendiente_id) ?? (it as any).pendiente_id;
    items.push({ ...(it as any), id: nextItemId++, venta_id: newVentaId } as any);
  }
  setStorage('kiosco_ventas', ventas);
  setStorage('kiosco_items', items);
  setStorage('kiosco_pendientes', []);
  setStorage('kiosco_items_pendientes', []);
  return { movidas: pendientes.length, total };
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