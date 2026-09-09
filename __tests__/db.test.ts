import { initDatabase, actualizarStock, realizarVenta, insertProducto, getProductos } from '@/lib/db';

describe('lib/db.ts', () => {
  it('initDatabase crea tablas sin lanzar error', async () => {
    await expect(initDatabase()).resolves.not.toThrow();
  });

  it('actualizarStock no lanza error', async () => {
    await expect(actualizarStock(42, 15)).resolves.toBeUndefined();
  });

  it('realizarVenta con array vacío no hace nada', async () => {
    await expect(realizarVenta([])).resolves.toBeUndefined();
  });

  it('realizarVenta con items no lanza error', async () => {
    const items = [
      { productoId: 1, cantidad: 2, subtotal: 200, nuevoStock: 8 },
      { productoId: 2, cantidad: 1, subtotal: 500, nuevoStock: 4 },
    ];
    await expect(realizarVenta(items, 'billete')).resolves.toBeUndefined();
  });

  it('insertProducto y getProductos funcionan', async () => {
    const id = await insertProducto({ nombre: 'Test', precioCosto: 100, precioVenta: 200, stock: 5, imagenUri: null, barcode: '123' });
    expect(typeof id).toBe('number');
    const list = await getProductos();
    expect(Array.isArray(list)).toBe(true);
  });
});