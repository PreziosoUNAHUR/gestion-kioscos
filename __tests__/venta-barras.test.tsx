import React from 'react';
import { render } from '@testing-library/react-native';
import VentaBarrasScreen from '@/app/venta-barras';

jest.mock('@/lib/db', () => ({
  getProductos: jest.fn().mockResolvedValue([]),
  getProductoByBarcode: jest.fn().mockResolvedValue(null),
}));

describe('VentaBarrasScreen', () => {
  it('renderiza titulo, boton escanear y input manual', async () => {
    const { findByText, getByPlaceholderText, getByText } = render(<VentaBarrasScreen />);
    expect(await findByText('Venta por Código de Barras')).toBeTruthy();
    expect(getByText('Escanear con Cámara')).toBeTruthy();
    expect(getByPlaceholderText('O ingresá el código manualmente')).toBeTruthy();
  });

  it('muestra estado vacio del carrito', async () => {
    const { findByText } = render(<VentaBarrasScreen />);
    expect(await findByText('Escaneá un código para agregar')).toBeTruthy();
  });

  it('muestra footer con Confirmar venta', async () => {
    const { findByText } = render(<VentaBarrasScreen />);
    expect(await findByText('Confirmar venta')).toBeTruthy();
  });
});