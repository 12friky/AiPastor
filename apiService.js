import { Platform } from 'react-native';

export const API_BASE_URL = Platform.OS === 'android'
  ? 'http://192.168.190.77:3000'
  : 'http://localhost:3000';
