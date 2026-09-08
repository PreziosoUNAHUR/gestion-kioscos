import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FiadoItemCard } from '@/components/FiadoItemCard';

describe('FiadoItemCard', () => {
  const onIncrement = jest.fn();
  const onDecrement = jest.fn();
  const onOptionsPress = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('renderiza nombre y deuda positiva', () => {
    const { getByText } = render(
      <FiadoItemCard id="1" nombre="Juan Pérez" deuda={1500} onIncrement={onIncrement} onDecrement={onDecrement} onOptionsPress={onOptionsPress} />,
    );
    expect(getByText('Juan Pérez')).toBeTruthy();
    expect(getByText('Debe $1.500')).toBeTruthy();
  });

  it('muestra A favor cuando deuda es negativa', () => {
    const { getByText } = render(
      <FiadoItemCard id="2" nombre="Ana" deuda={-800} onIncrement={onIncrement} onDecrement={onDecrement} onOptionsPress={onOptionsPress} />,
    );
    expect(getByText('A favor $800')).toBeTruthy();
  });

  it('muestra Sin deuda cuando es 0', () => {
    const { getByText } = render(
      <FiadoItemCard id="3" nombre="Carlos" deuda={0} onIncrement={onIncrement} onDecrement={onDecrement} onOptionsPress={onOptionsPress} />,
    );
    expect(getByText('Sin deuda')).toBeTruthy();
  });

  it('llama onIncrement con step 500', () => {
    const { UNSAFE_getAllByType } = render(
      <FiadoItemCard id="10" nombre="Test" deuda={0} onIncrement={onIncrement} onDecrement={onDecrement} onOptionsPress={onOptionsPress} />,
    );
    const touchables = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    fireEvent.press(touchables[1]);
    expect(onIncrement).toHaveBeenCalledWith('10', 500);
  });

  it('llama onDecrement con step 500', () => {
    const { UNSAFE_getAllByType } = render(
      <FiadoItemCard id="10" nombre="Test" deuda={0} onIncrement={onIncrement} onDecrement={onDecrement} onOptionsPress={onOptionsPress} />,
    );
    const touchables = UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    fireEvent.press(touchables[0]);
    expect(onDecrement).toHaveBeenCalledWith('10', 500);
  });
});