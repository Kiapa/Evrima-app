import { router } from 'expo-router'
import React from 'react'
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Radius, Spacing, Typography } from '@/constants'
import { deregisterPushToken } from '@/lib/notifications'
import { useAuthStore } from '@/store/auth'
import { useVehiclesStore } from '@/store/vehicles'

function SettingsRow({
  label,
  value,
  onPress,
  destructive = false,
}: {
  label: string
  value?: string
  onPress?: () => void
  destructive?: boolean
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Text style={[styles.rowLabel, destructive && styles.destructiveLabel]}>
        {label}
      </Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {onPress && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore()
  const { vehicles, stopLiveTracking } = useVehiclesStore()

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          stopLiveTracking()
          await deregisterPushToken()
          await signOut()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Account section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <SettingsRow label="Email" value={user?.email} />
          <SettingsRow
            label="Full name"
            value={user?.user_metadata?.full_name ?? '—'}
          />
        </View>
      </View>

      {/* App section */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>APP</Text>
        <View style={styles.card}>
          <SettingsRow
            label="Vehicles"
            value={`${vehicles.length} registered`}
            onPress={() => router.push('/(app)/vehicles')}
          />
          <SettingsRow
            label="Add vehicle"
            onPress={() => router.push('/(app)/vehicles/add')}
          />
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <SettingsRow label="Version" value="1.0.0" />
          <SettingsRow label="Made for Kenya 🇰🇪" />
        </View>
      </View>

      {/* Sign out */}
      <View style={styles.section}>
        <View style={styles.card}>
          <SettingsRow
            label="Sign out"
            onPress={handleSignOut}
            destructive
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  header:  {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title:   { fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary },

  section: { padding: Spacing.lg, paddingBottom: 0, gap: Spacing.sm },
  sectionLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  rowLabel:       { flex: 1, fontSize: Typography.sizes.base, color: Colors.textPrimary },
  destructiveLabel: { color: Colors.danger },
  rowValue:       { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  chevron:        { fontSize: 18, color: Colors.textMuted },
})