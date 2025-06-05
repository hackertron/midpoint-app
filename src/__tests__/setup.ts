import '@testing-library/react-native/extend-expect';

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock Location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  LocationAccuracy: {
    Balanced: 'balanced',
  },
}));

// Mock Alert
(global as any).Alert = {
  alert: jest.fn(),
};

// Mock Expo Router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  Link: ({ children, ...props }: any) => children,
}));

// Mock React Native Maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native-web');
  
  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => React.createElement(View, props)),
    Marker: React.forwardRef((props: any, ref: any) => React.createElement(View, props)),
    Callout: React.forwardRef((props: any, ref: any) => React.createElement(View, props)),
  };
});

// Mock fetch globally
global.fetch = jest.fn();