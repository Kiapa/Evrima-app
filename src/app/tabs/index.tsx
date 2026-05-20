import { router } from 'expo-router'
import React, { useState } from 'react'
import {ActivityIndicator,ScrollView,StyleSheet,Text,TouchableOpacity,View,} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LiveMap } from '@/components/map/live-map'
import { VehicleCard } from '@/components/vehicles/vehicle-card'
import { Button } from '@/components/ui/button'
import { Colors, Radius, Spacing, Typography } from '@/constants'
import { useVehiclesStore } from '@/store/vehicles'

export default function MapScreen() {
  const { vehicles, loading, selectedVehicleId, selectVehicle } = useVehiclesStore()
  const [sheetExpanded, setSheetExpanded] = useState(false)

  const vehiclesWithTrackers    = vehicles.filter(v => v.tracker)
  const vehiclesWithoutTrackers = vehicles.filter(v => !v.tracker)

  function handleMarkerPress(vehicleId: string) {
    selectVehicle(vehicleId)
    setSheetExpanded(true)
  }

  function handleVehicleCardPress(vehicleId: string) {
    selectVehicle(vehicleId)
  }

  if (loading && vehicles.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Loading your vehicles…</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Full-screen map */}
      <LiveMap
        vehicles={vehiclesWithTrackers}
        selectedVehicleId={selectedVehicleId}
        onMarkerPress={handleMarkerPress}
      />

      {/* Top overlay — selected vehicle quick info */}
      {selectedVehicleId && (() => {
        const v = vehicles.find(x => x.id === selectedVehicleId)
        const pos = v?.latest_position
        if (!v || !pos) return null
        return (
          <SafeAreaView edges={['top']} style={styles.topOverlay} pointerEvents="box-none">
            <View style={styles.topCard}>
              <View style={styles.topCardRow}>
                <View style={styles.topCardInfo}>
                  <Text style={styles.topCardTitle}>{v.make} {v.model}</Text>
                  <Text style={styles.topCardPlate}>{v.registration_plate}</Text>
                </View>
                <View style={styles.topCardStats}>
                  <Text style={styles.topCardSpeed}>
                    {Math.round(pos.speed)}<Text style={styles.topCardUnit}> km/h</Text>
                  </Text>
                  <View style={[styles.ignitionDot, pos.ignition ? styles.dotOn : styles.dotOff]} />
                </View>
              </View>
              {pos.address && (
                <Text style={styles.topCardAddress} numberOfLines={1}>
                  📍 {pos.address}
                </Text>
              )}
              <TouchableOpacity
                style={styles.topCardClose}
                onPress={() => selectVehicle(null)}
              >
                <Text style={styles.topCardCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )
      })()}

      {/* Bottom sheet — vehicle list */}
      <View style={[styles.sheet, sheetExpanded && styles.sheetExpanded]}>
        <TouchableOpacity
          style={styles.sheetHandle}
          onPress={() => setSheetExpanded(e => !e)}
          activeOpacity={0.7}
        >
          <View style={styles.handleBar} />
          <Text style={styles.sheetTitle}>
            {vehicles.length === 0
              ? 'No vehicles yet'
              : `${vehiclesWithTrackers.length} of ${vehicles.length} tracked`}
          </Text>
        </TouchableOpacity>

        {sheetExpanded && (
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
          >
            {vehiclesWithTrackers.map(v => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                onPress={() => handleVehicleCardPress(v.id)}
              />
            ))}

            {vehiclesWithoutTrackers.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Awaiting tracker</Text>
                {vehiclesWithoutTrackers.map(v => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </>
            )}

            {vehicles.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🚗</Text>
                <Text style={styles.emptyTitle}>Add your first vehicle</Text>
                <Text style={styles.emptySubtitle}>
                  Register your vehicle and link a tracker to see it live on the map
                </Text>
                <Button
                  title="Add vehicle"
                  onPress={() => router.push('/tabs/vehicles/add')}
                  style={styles.emptyButton}
                />
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: { color: Colors.textSecondary, fontSize: Typography.sizes.base },

  // Top overlay
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
  },
  topCard: {
    backgroundColor: `${Colors.bgCard}F0`,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  topCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topCardInfo:    { gap: 2 },
  topCardTitle:   { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  topCardPlate:   { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  topCardStats:   { alignItems: 'flex-end', gap: 4 },
  topCardSpeed:   { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.accent },
  topCardUnit:    { fontSize: Typography.sizes.sm, color: Colors.textSecondary, fontWeight: Typography.weights.regular },
  ignitionDot:    { width: 8, height: 8, borderRadius: 4 },
  dotOn:          { backgroundColor: Colors.accent },
  dotOff:         { backgroundColor: Colors.textMuted },
  topCardAddress: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  topCardClose: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    padding: 4,
  },
  topCardCloseText: { color: Colors.textMuted, fontSize: 14 },

  // Bottom sheet
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderTopWidth: 1,
    borderColor: Colors.border,
    maxHeight: '60%',
  },
  sheetExpanded: { maxHeight: '65%' },

  sheetHandle: {
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  handleBar: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
  },
  sheetTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
  },

  sheetScroll:   { flex: 1 },
  sheetContent:  { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xl },

  sectionLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: Spacing.sm,
  },

  // Empty state
  emptyState:   { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  emptyIcon:    { fontSize: 48 },
  emptyTitle:   { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  emptySubtitle:{ fontSize: Typography.sizes.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyButton:  { width: '100%' },
})