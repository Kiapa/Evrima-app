// API
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1'
export const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'ws://localhost:8000/ws'

// Supabase
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Design tokens — dark-first, minimal
export const Colors = {
  // Backgrounds
  bg: '#0A0A0A',
  bgCard: '#141414',
  bgElevated: '#1C1C1C',
  bgInput: '#1A1A1A',

  // Brand
  accent: '#00E5A0',        // green — live/active state
  accentDim: '#00E5A020',
  warning: '#F5A623',
  danger: '#E5383B',

  // Text
  textPrimary: '#F5F5F5',
  textSecondary: '#888888',
  textMuted: '#444444',

  // Borders
  border: '#222222',
  borderFocus: '#00E5A060',

  // Map overlay
  markerActive: '#00E5A0',
  markerIdle: '#888888',
} as const

export const Typography = {
  // Using system font stack — feels native on both platforms
  fontFamily: undefined,  // system default

  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },

  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const

// Vehicle type display labels
export const VEHICLE_TYPES = [
  { value: 'saloon',     label: 'Saloon / Sedan' },
  { value: 'suv',        label: 'SUV / 4x4' },
  { value: 'pickup',     label: 'Pickup Truck' },
  { value: 'matatu',     label: 'Matatu / Van' },
  { value: 'truck',      label: 'Truck / Lorry' },
  { value: 'motorcycle', label: 'Motorcycle / Boda' },
] as const

export const SIM_PROVIDERS = [
  { value: 'safaricom', label: 'Safaricom' },
  { value: 'airtel',    label: 'Airtel' },
  { value: 'telkom',    label: 'Telkom' },
] as const