import '@testing-library/jest-native/extend-expect';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() =>
    Promise.resolve({
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
      getAllAsync: jest.fn().mockResolvedValue([]),
      getFirstAsync: jest.fn().mockResolvedValue(null),
      withExclusiveTransactionAsync: jest.fn(async (cb) => {
        const txn = {
          runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
          execAsync: jest.fn().mockResolvedValue(undefined),
        };
        await cb(txn);
      }),
    }),
  ),
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true],
  loadAsync: jest.fn().mockResolvedValue(undefined),
  isLoaded: jest.fn().mockReturnValue(true),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MockIcon = (props) => React.createElement(Text, props, props.name || 'icon');
  return {
    Ionicons: MockIcon,
    Feather: MockIcon,
    MaterialCommunityIcons: MockIcon,
    FontAwesome5: MockIcon,
    AntDesign: MockIcon,
  };
});

jest.mock('expo-camera', () => ({
  CameraView: () => null,
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
  MediaTypeOptions: {},
}));

jest.mock('@shopify/react-native-skia', () => ({}));
jest.mock('victory-native', () => ({
  CartesianChart: ({ children }) => children({ points: { value: [] }, chartBounds: {} }),
  Bar: () => null,
  PolarChart: ({ children }) => children,
  Pie: { Chart: ({ children }) => children({ slice: {} }), Slice: () => null },
}));
jest.mock('expo-mail-composer', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(false),
  composeAsync: jest.fn(),
}));

global.__reanimatedWorkletInit = jest.fn();