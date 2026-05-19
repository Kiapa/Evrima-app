import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Colors, Radius, Typography } from '@/constants'
import type { VehicleWithPosition } from '@/types'

const VEHICLE_ICONS: Record<string, string> = {
  saloon:     '🚗',
  suv:        '🚙',
  pickup:     '🛻',
  matatu:     '🚐',
  truck:      '🚛',
  motorcycle: '🏍️',
}

interface VehicleMarkerProps {
  vehicle: VehicleWithPosition
  isSelected: boolean
}

export function VehicleMarker({ vehicle, isSelected }: VehicleMarkerProps) {
  const position = vehicle.latest_position
  const isMoving = position ? position.speed > 2 : false
  const isIgnitionOn = position?.ignition ?? false

  // Rotate the marker chevron based on heading
  const course = position?.course ?? 0

  return (
    <View style={styles.wrapper}>
      {/* Direction indicator — only show when moving */}
      {isMoving && (
        <View
          style={[
            styles.directionArrow,
            { transform: [{ rotate: `${course}deg` }] },
          ]}
        >
          <View style={styles.arrowHead} />
        </View>
      )}

      {/* Main bubble */}
      <View
        style={[
          styles.bubble,
          isSelected && styles.bubbleSelected,
          !isIgnitionOn && styles.bubbleOff,
        ]}
      >
        <Text style={styles.icon}>
          {VEHICLE_ICONS[vehicle.vehicle_type] ?? '🚗'}
        </Text>
      </View>

      {/* Live pulse ring when ignition is on */}
      {isIgnitionOn && <View style={styles.pulse} />}

      {/* Plate label — only when selected */}
      {isSelected && (
        <View style={styles.label}>
          <Text style={styles.labelText}>{vehicle.registration_plate}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 2,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  bubbleSelected: {
    width: 50,
    height: 50,
    borderWidth: 3,
    borderColor: Colors.accent,
  },
  bubbleOff: {
    borderColor: Colors.textMuted,
    opacity: 0.7,
  },
  icon: { fontSize: 20 },

  // Pulsing ring
  pulse: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: `${Colors.accent}60`,
    zIndex: 1,
  },

  // Direction arrow above the bubble
  directionArrow: {
    width: 0,
    height: 0,
    marginBottom: 2,
    zIndex: 3,
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.accent,
  },

  // Plate label
  label: {
    marginTop: 4,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 4,
  },
  labelText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
})