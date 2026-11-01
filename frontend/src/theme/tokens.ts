export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  accentBg: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
  surfaceElevated: string;
}

export const lightTokens: ThemeColors = {
  background: '#FFFFFF',
  foreground: '#111111',
  card: '#FFFFFF',
  cardForeground: '#111111',
  popover: '#FFFFFF',
  popoverForeground: '#111111',
  primary: '#111111',
  primaryForeground: '#FFFFFF',
  secondary: '#F5F5F5',
  secondaryForeground: '#111111',
  muted: '#F5F5F5',
  mutedForeground: '#646464',
  accent: '#111111',
  accentForeground: '#FFFFFF',
  accentBg: '#F5F5F5',
  destructive: '#111111',
  destructiveForeground: '#FFFFFF',
  border: '#E8E8E8',
  input: '#E8E8E8',
  ring: '#111111',
  surfaceElevated: '#F5F5F5'
};

export const darkTokens: ThemeColors = {
  background: '#090909',
  foreground: '#FFFFFF',
  card: '#181818',
  cardForeground: '#FFFFFF',
  popover: '#181818',
  popoverForeground: '#FFFFFF',
  primary: '#FFFFFF',
  primaryForeground: '#090909',
  secondary: '#181818',
  secondaryForeground: '#FFFFFF',
  muted: '#181818',
  mutedForeground: '#AAAAAA',
  accent: '#FFFFFF',
  accentForeground: '#090909',
  accentBg: '#222222',
  destructive: '#FFFFFF',
  destructiveForeground: '#090909',
  border: '#292929',
  input: '#292929',
  ring: '#FFFFFF',
  surfaceElevated: '#222222'
};

export const spacingScale = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px'
} as const;
