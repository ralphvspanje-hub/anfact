export const palette = {
  sage: {
    50: '#e5f5eb',
    100: '#ccebd8',
    200: '#a8ddb8',
    300: '#95dab3',
    400: '#5cc18f',
    500: '#38a375',
    600: '#28825c',
    700: '#22684b',
    800: '#1e523d',
    900: '#194434',
  },
  neutral: {
    white: '#ffffff',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    black: '#000000',
  },
  success: '#5cc18f', // sage.400
  error: '#c4726a',
  warning: '#ad8a47',
  info: '#5a8faa',
};

export const lightTheme = {
  colors: {
    background: palette.neutral.white,
    surface: '#e9edea',
    surfaceHighlight: palette.sage[100],
    text: palette.neutral[900],
    textSecondary: palette.neutral[600],
    textInverse: palette.neutral.white,
    primary: palette.sage[500],
    primaryForeground: palette.neutral.white,
    secondary: palette.sage[200],
    secondaryForeground: palette.sage[800],
    border: palette.sage[200],
    success: palette.success,
    error: palette.error,
    warning: palette.warning,
    info: palette.info,
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: false,
};

export const darkTheme = {
  colors: {
    background: palette.neutral[900],
    surface: palette.neutral[800],
    surfaceHighlight: palette.neutral[700],
    text: palette.neutral[50],
    textSecondary: palette.neutral[400],
    textInverse: palette.neutral[900],
    primary: palette.sage[500],
    primaryForeground: palette.neutral.white,
    secondary: palette.sage[800],
    secondaryForeground: palette.sage[200],
    border: palette.neutral[700],
    success: palette.success,
    error: palette.error,
    warning: palette.warning,
    info: palette.info,
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  dark: true,
};

export type Theme = typeof lightTheme;
export type ThemeColors = Theme['colors'];
