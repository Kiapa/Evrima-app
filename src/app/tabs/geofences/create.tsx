import { router } from 'expo-router'
import React, { useRef, useState } from 'react'
import {
  Alert, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native'
import MapView, {
  Circle, MapPressEvent, Marker,
  Polygon, PROVIDER_GOOGLE,
} from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Colors, Radius, Spacing, Typography } from '@/constants'
import type { LatLng } from '@/store/geofences'
import { useGeofencesStore } from '@/store/geofences'

type Shape = 'circle' | 'polygon'
type Step  = 'configure' | 'draw'

const PALETTE = ['#00E5A0', '#F5A623', '#E5383B', '#4A90E2', '#B8E986', '#FF6B6B']

const NAIROBI = { latitude: -1.2921, longitude: 36.8219, latitudeDelta: 0.08, longitudeDelta: 0.08 }

const DARK_MAP_STYLE = [
  { elementType: 'geometry',           stylers: [{ color: '#0f0f0f' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#555555' }] },
  { featureType: 'road',               elementType: 'geometry', stylers: [{ color: '#1c1c1c' }] },
  { featureType: 'water',              elementType: 'geometry', stylers: [{ color: '#080808' }] },
  { featureType: 'poi',                elementType: 'labels',   stylers: [{ visibility: 'off' }] },
]

export default function CreateGeofenceScreen() {
  const { createGeofence } = useGeofencesStore()
  const mapRef = useRef<MapView>(null)

  const [step, setStep]         = useState<Step>('configure')
  const [shape, setShape]       = useState<Shape>('circle')
  const [name, setName]         = useState('')
  const [color, setColor]       = useState(PALETTE[0])
  const [loading, setLoading]   = useState(false)

  // Circle state
  const [center, setCenter]     = useState<LatLng | null>(null)
  const [radius, setRadius]     = useState(500)  // metres

  // Polygon state
  const [points, setPoints]     = useState<LatLng[]>([])

  function handleMapPress(e: MapPressEvent) {
    const { latitude, longitude } = e.nativeEvent.coordinate

    if (shape === 'circle') {
      setCenter({ lat: latitude, lng: longitude })
    } else {
      setPoints(prev => [...prev, { lat: latitude, lng: longitude }])
    }
  }

  function undoLastPoint() {
    setPoints(prev => prev.slice(0, -1))
  }

  const canSave = shape === 'circle'
    ? center !== null
    : points.length >= 3

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give this geofence a name before saving.')
      return
    }
    if (!canSave) return

    setLoading(true)
    try {
      if (shape === 'circle') {
        await createGeofence({
          name: name.trim(), shape: 'circle', color,
          center_lat: center!.lat, center_lng: center!.lng,
          radius_meters: radius,
        })
      } else {
        await createGeofence({ name: name.trim(), shape: 'polygon', color, coordinates: points })
      }
      router.back()
    } catch (e: any) {
      Alert.alert('Failed to create geofence', e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 1: Configure ────────────────────────────────────────────────────
  if (step === 'configure') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>New geofence</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Input
            label="Geofence name"
            value={name}
            onChangeText={setName}
            placeholder="Home, Office, School Zone…"
            autoCapitalize="words"
          />

          {/* Shape selector */}
          <View>
            <Text style={styles.fieldLabel}>Shape</Text>
            <View style={styles.shapeRow}>
              {(['circle', 'polygon'] as Shape[]).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.shapeBtn, shape === s && styles.shapeBtnActive]}
                  onPress={() => setShape(s)}
                >
                  <Text style={styles.shapeIcon}>{s === 'circle' ? '⬤' : '⬡'}</Text>
                  <Text style={[styles.shapeLabel, shape === s && styles.shapeLabelActive]}>
                    {s === 'circle' ? 'Circle' : 'Polygon'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.shapeHint}>
              {shape === 'circle'
                ? 'Tap the map to set the centre, then adjust the radius'
                : 'Tap the map to place corner points (min. 3)'}
            </Text>
          </View>

          {/* Radius slider for circles */}
          {shape === 'circle' && (
            <View>
              <Text style={styles.fieldLabel}>
                Radius — {radius >= 1000 ? `${(radius / 1000).toFixed(1)} km` : `${radius} m`}
              </Text>
              <View style={styles.radiusRow}>
                {[100, 250, 500, 1000, 2000, 5000].map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
                    onPress={() => setRadius(r)}
                  >
                    <Text style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>
                      {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Color palette */}
          <View>
            <Text style={styles.fieldLabel}>Color</Text>
            <View style={styles.paletteRow}>
              {PALETTE.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.paletteSwatch, { backgroundColor: c }, color === c && styles.paletteSwatchActive]}
                />
              ))}
            </View>
          </View>

          <Button
            title="Draw on map →"
            onPress={() => setStep('draw')}
            size="lg"
            disabled={!name.trim()}
          />
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ── Step 2: Draw ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStep('configure')} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{name}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Instruction banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          {shape === 'circle'
            ? center ? '✓ Centre set. Save when ready.' : 'Tap the map to set the geofence centre'
            : points.length < 3
              ? `Tap to add points (${points.length}/3 minimum)`
              : `${points.length} points — tap to add more, or save`}
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={NAIROBI}
          customMapStyle={DARK_MAP_STYLE}
          onPress={handleMapPress}
          showsCompass={false}
          toolbarEnabled={false}
        >
          {/* Circle preview */}
          {shape === 'circle' && center && (
            <>
              <Circle
                center={{ latitude: center.lat, longitude: center.lng }}
                radius={radius}
                strokeColor={color}
                strokeWidth={2}
                fillColor={`${color}25`}
              />
              <Marker coordinate={{ latitude: center.lat, longitude: center.lng }}>
                <View style={[styles.centerDot, { backgroundColor: color }]} />
              </Marker>
            </>
          )}

          {/* Polygon preview */}
          {shape === 'polygon' && points.length >= 1 && (
            <>
              {points.length >= 3 && (
                <Polygon
                  coordinates={points.map(p => ({ latitude: p.lat, longitude: p.lng }))}
                  strokeColor={color}
                  strokeWidth={2}
                  fillColor={`${color}25`}
                />
              )}
              {points.map((p, i) => (
                <Marker key={i} coordinate={{ latitude: p.lat, longitude: p.lng }} anchor={{ x: 0.5, y: 0.5 }}>
                  <View style={[styles.pointDot, { backgroundColor: color }]}>
                    <Text style={styles.pointLabel}>{i + 1}</Text>
                  </View>
                </Marker>
              ))}
            </>
          )}
        </MapView>

        {/* Floating controls */}
        <View style={styles.floatingControls}>
          {shape === 'polygon' && points.length > 0 && (
            <TouchableOpacity style={styles.floatingBtn} onPress={undoLastPoint}>
              <Text style={styles.floatingBtnText}>↩ Undo</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.floatingBtn, styles.floatingBtnPrimary, !canSave && styles.floatingBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave || loading}
          >
            <Text style={styles.floatingBtnPrimaryText}>
              {loading ? 'Saving…' : '✓ Save geofence'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:  { width: 36, height: 36, justifyContent: 'center' },
  backIcon: { fontSize: 28, color: Colors.accent, lineHeight: 32 },
  title:    { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold, color: Colors.textPrimary, flex: 1, textAlign: 'center' },

  content: { padding: Spacing.lg, gap: Spacing.lg },

  fieldLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium, color: Colors.textSecondary, marginBottom: Spacing.sm },

  shapeRow: { flexDirection: 'row', gap: Spacing.sm },
  shapeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.xs, padding: Spacing.md,
    backgroundColor: Colors.bgElevated, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  shapeBtnActive:  { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  shapeIcon:       { fontSize: 18, color: Colors.textSecondary },
  shapeLabel:      { fontSize: Typography.sizes.base, color: Colors.textSecondary, fontWeight: Typography.weights.medium },
  shapeLabelActive:{ color: Colors.accent },
  shapeHint:       { fontSize: Typography.sizes.xs, color: Colors.textMuted, marginTop: Spacing.sm },

  radiusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  radiusBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgElevated, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  radiusBtnActive:    { borderColor: Colors.accent, backgroundColor: Colors.accentDim },
  radiusBtnText:      { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  radiusBtnTextActive:{ color: Colors.accent, fontWeight: Typography.weights.semibold },

  paletteRow: { flexDirection: 'row', gap: Spacing.sm },
  paletteSwatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: 'transparent' },
  paletteSwatchActive: { borderColor: '#fff' },

  // Draw step
  banner: { backgroundColor: Colors.bgCard, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  bannerText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, textAlign: 'center' },

  mapContainer: { flex: 1 },
  map:          { flex: 1 },

  centerDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#fff' },
  pointDot: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  pointLabel: { fontSize: 10, color: '#fff', fontWeight: '700' },

  floatingControls: {
    position: 'absolute', bottom: Spacing.xl,
    left: Spacing.lg, right: Spacing.lg,
    gap: Spacing.sm,
  },
  floatingBtn: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingVertical: Spacing.sm + 4, alignItems: 'center',
  },
  floatingBtnPrimary:  { backgroundColor: Colors.accent, borderColor: Colors.accent },
  floatingBtnDisabled: { opacity: 0.4 },
  floatingBtnText:     { color: Colors.textPrimary, fontWeight: Typography.weights.medium },
  floatingBtnPrimaryText: { color: Colors.bg, fontWeight: Typography.weights.semibold, fontSize: Typography.sizes.base },
})