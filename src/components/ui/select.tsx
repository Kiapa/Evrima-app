import React, { useState } from 'react'
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Colors, Radius, Spacing, Typography } from '@/constants'

interface Option<T extends string> {
  value: T
  label: string
}

interface SelectProps<T extends string> {
  label?: string
  options: readonly Option<T>[]
  value: T | null
  onChange: (value: T) => void
  placeholder?: string
  error?: string
}

export function Select<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select…',
  error,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setOpen(true)}
        style={[styles.trigger, error ? styles.triggerError : null]}
      >
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>
          {selected?.label ?? placeholder}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {error && <Text style={styles.error}>{error}</Text>}

      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>{label ?? 'Select option'}</Text>

          <ScrollView>
            {options.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  option.value === value && styles.optionSelected,
                ]}
                onPress={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    option.value === value && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {option.value === value && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  trigger: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerError: { borderColor: Colors.danger },
  triggerText: { fontSize: Typography.sizes.base, color: Colors.textPrimary },
  placeholder: { color: Colors.textMuted },
  chevron: { fontSize: 20, color: Colors.textMuted, transform: [{ rotate: '90deg' }] },
  error: { fontSize: Typography.sizes.xs, color: Colors.danger, marginTop: Spacing.xs },

  // Sheet
  backdrop: { flex: 1, backgroundColor: '#00000088' },
  sheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: '60%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    alignSelf: 'center',
    marginVertical: Spacing.md,
  },
  sheetTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  option: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionSelected: { /* no extra bg — checkmark is enough */ },
  optionText: { fontSize: Typography.sizes.base, color: Colors.textSecondary },
  optionTextSelected: { color: Colors.accent, fontWeight: Typography.weights.medium },
  checkmark: { color: Colors.accent, fontSize: Typography.sizes.lg },
})