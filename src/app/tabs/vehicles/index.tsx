import { router } from 'expo-router'
import React from 'react'
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { VehicleCard } from '@/components/vehicles/vehicle-card'
import { Button } from '@/components/ui/button'
import { Colors, Spacing, Typography } from '@/constants'
import { useVehiclesStore } from '@/store/vehicles'

export default function VehiclesScreen() {
  const { vehicles, loading, fetchVehicles, removeVehicle } = useVehiclesStore()

  function handleLongPress(vehicleId: string, plate: string) {
    Alert.alert(
      'Remove vehicle',
      `Remove ${plate} from your account? This will also unlink the tracker.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeVehicle(vehicleId)
            } catch (e: any) {
              Alert.alert('Error', e.message)
            }
          },
        },
      ],
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Vehicles</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(app)/vehicles/add')}
          activeOpacity={0.7}
        >
          <Text style={styles.addIcon}>＋</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchVehicles}
            tintColor={Colors.accent}
          />
        }
      >
        {vehicles.length === 0 && !loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚗</Text>
            <Text style={styles.emptyTitle}>No vehicles yet</Text>
            <Text style={styles.emptySubtitle}>
              Add a vehicle to start tracking it
            </Text>
            <Button
              title="Add vehicle"
              onPress={() => router.push('/(app)/vehicles/add')}
            />
          </View>
        ) : (
          <>
            <Text style={styles.count}>
              {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
            </Text>
            {vehicles.map(vehicle => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onPress={() => {
                  if (!vehicle.tracker) {
                    router.push(`/(app)/vehicles/${vehicle.id}/link-tracker`)
                  }
                }}
              />
            ))}
            <Text style={styles.hint}>Long press a vehicle to remove it</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.bg },
  header:   {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  addButton: {
    width: 36,
    height: 36,
    backgroundColor: Colors.accentDim,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: { color: Colors.accent, fontSize: 20, lineHeight: 22 },

  content: { padding: Spacing.lg, gap: Spacing.sm },
  count:   { fontSize: Typography.sizes.sm, color: Colors.textMuted, marginBottom: Spacing.xs },
  hint:    { fontSize: Typography.sizes.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },

  empty: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing['2xl'],
  },
  emptyIcon:     { fontSize: 48 },
  emptyTitle:    { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  emptySubtitle: { fontSize: Typography.sizes.base, color: Colors.textSecondary, textAlign: 'center' },
})