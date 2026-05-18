import { router } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Colors, Radius, Spacing, Typography } from '@/constants'
import type { VehicleWithPosition } from '@/types'

const VEHICLE_ICONS: Record<string, string> = {
  saloon:     '🚗',
  suv:        '🚙',
  pickup:     '🛻',
  matatu:     '🚐',
  truck:      '🚛',
  motorcycle: '🏍️',
}

interface VehicleCardProps {
  vehicle: VehicleWithPosition
  onPress?: () => void
}

export function VehicleCard({ vehicle, onPress }: VehicleCardProps) {
  const position = vehicle.latest_position
  const hasTracker = !!vehicle.tracker
  const isMoving = position ? position.speed > 2 : false
  const isIgnitionOn = position?.ignition ?? false

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else if (!hasTracker) {
      // No tracker linked yet — go to link tracker screen
      router.push(`/(app)/vehicles/${vehicle.id}/link-tracker`)
    }
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={styles.card}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>{VEHICLE_ICONS[vehicle.vehicle_type] ?? '🚗'}</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name}>
            {vehicle.make} {vehicle.model}
          </Text>
          <Text style={styles.plate}>{vehicle.registration_plate}</Text>
        </View>

        {/* Status pill */}
        {hasTracker ? (
          <View style={[styles.pill, isIgnitionOn ? styles.pillOn : styles.pillOff]}>
            <View style={[styles.dot, isIgnitionOn ? styles.dotOn : styles.dotOff]} />
            <Text style={[styles.pillText, isIgnitionOn ? styles.pillTextOn : styles.pillTextOff]}>
              {isMoving ? 'Moving' : isIgnitionOn ? 'Idling' : 'Parked'}
            </Text>
          </View>
        ) : (
          <View style={[styles.pill, styles.pillSetup]}>
            <Text style={styles.pillTextSetup}>Link tracker →</Text>
          </View>
        )}
      </View>

      {/* Position row — only if we have a location */}
      {position && (
        <View style={styles.positionRow}>
          <Text style={styles.address} numberOfLines={1}>
            📍 {position.address ?? `${position.latitude.toFixed(5)}, ${position.longitude.toFixed(5)}`}
          </Text>
          {isMoving && (
            <Text style={styles.speed}>{Math.round(position.speed)} km/h</Text>
          )}
        </View>
      )}

      {/* No tracker prompt */}
      {!hasTracker && (
        <Text style={styles.noTrackerHint}>
          Tap to link a tracking device to this vehicle
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  info: { flex: 1 },
  name: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  plate: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Pills
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  pillOn:     { backgroundColor: `${Colors.accent}20` },
  pillOff:    { backgroundColor: Colors.bgElevated },
  pillSetup:  { backgroundColor: Colors.bgElevated },

  dot: { width: 6, height: 6, borderRadius: 3 },
  dotOn:  { backgroundColor: Colors.accent },
  dotOff: { backgroundColor: Colors.textMuted },

  pillText:       { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.medium },
  pillTextOn:     { color: Colors.accent },
  pillTextOff:    { color: Colors.textSecondary },
  pillTextSetup:  { color: Colors.textSecondary, fontSize: Typography.sizes.xs },

  // Position
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  address: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  speed: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.warning,
  },
  noTrackerHint: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
})