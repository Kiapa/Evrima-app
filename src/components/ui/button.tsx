import React from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native'
import { Colors, Radius, Spacing, Typography } from '@/constants'

interface ButtonProps extends TouchableOpacityProps {
  title: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  title,
  variant = 'primary',
  loading = false,
  size = 'md',
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.bg : Colors.accent}
        />
      ) : (
        <Text style={[styles.label, styles[`label_${variant}`], styles[`labelSize_${size}`]]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },

  // Variants
  primary: {
    backgroundColor: Colors.accent,
  },
  secondary: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: Colors.danger,
  },

  // Sizes
  size_sm: { paddingVertical: Spacing.xs + 2, paddingHorizontal: Spacing.md },
  size_md: { paddingVertical: Spacing.sm + 4, paddingHorizontal: Spacing.lg },
  size_lg: { paddingVertical: Spacing.md,     paddingHorizontal: Spacing.xl },

  disabled: { opacity: 0.45 },

  // Labels
  label: { fontWeight: Typography.weights.semibold, letterSpacing: 0.2 },
  label_primary:   { color: Colors.bg },
  label_secondary: { color: Colors.textPrimary },
  label_ghost:     { color: Colors.accent },
  label_danger:    { color: '#fff' },

  labelSize_sm: { fontSize: Typography.sizes.sm },
  labelSize_md: { fontSize: Typography.sizes.base },
  labelSize_lg: { fontSize: Typography.sizes.lg },
})