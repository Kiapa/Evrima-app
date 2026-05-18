import React, { forwardRef } from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native'
import { Colors, Radius, Spacing, Typography } from '@/constants'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, style, ...props },
  ref,
) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TextInput
        ref={ref}
        placeholderTextColor={Colors.textMuted}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />

      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  error: {
    fontSize: Typography.sizes.xs,
    color: Colors.danger,
  },
  hint: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
})