import { Platform } from 'react-native';

export function scaleForWeb(n: number): number {
  return Platform.OS === 'web' ? Math.round(n * 1.2) : n;
}

export const rawSizes = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 22,
  xl: 26,
  xxl: 34,
  xxxl: 42,
} as const;

export const typography = {
  fontFamily: {
    regular: 'Nunito-Regular',
    bold: 'Nunito-Bold',
    extraBold: 'Nunito-ExtraBold',
  },
  sizes: {
    xs: scaleForWeb(12),
    sm: scaleForWeb(14),
    md: scaleForWeb(16),
    lg: scaleForWeb(20),
    xl: scaleForWeb(24),
    xxl: scaleForWeb(32),
    xxxl: scaleForWeb(40),
  },
  weights: {
    regular: '400',
    bold: '700',
    extraBold: '800',
  },
};
