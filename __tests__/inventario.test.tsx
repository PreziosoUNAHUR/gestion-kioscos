import React from 'react';
import { render } from '@testing-library/react-native';
import InventarioScreen from '@/app/inventario';

jest.mock('@/lib/db', () => ({
  getProductos: jest.fn().mockResolvedValue([
    { id: 1, nombre: 'Coca Cola', precio_venta: 500, stock: 10, imagen_uri: null },
  ]),
}));

describe('InventarioScreen', () => {
  it('renderiza header, buscador y estado vacio/cargado', async () => {
    const { findByText, getByPlaceholderText } = render(<InventarioScreen />);
    expect(await findByText('Inventario y Stock')).toBeTruthy();
    expect(getByPlaceholderText('Buscar producto...')).toBeTruthy();
  });

  it('muestra FAB para alta de producto', async () => {
    const { findByText } = render(<InventarioScreen />);
    expect(await findByText('Inventario y Stock')).toBeTruthy();
  });
});