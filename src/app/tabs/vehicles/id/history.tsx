import { router, useLocalSearchParams } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Alert, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Radius, Spacing, Typography } from '@/constants'
import { api } from '@/lib/api'
import type { Position } from '@/types'

const SPEEDS = [1, 2, 5, 10] as const
type PlaybackSpeed = (typeof SPEEDS)[number]

const DARK_MAP_STYLE = [
  { elementType: 'geometry',           stylers: [{ color: '#0f0f0f' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#555555' }] },
  { featureType: 'road',               elementType: 'geometry', stylers: [{ color: '#1c1c1c' }] },
  { featureType: 'water',              elementType: 'geometry', stylers: [{ color: '#080808' }] },
  { featureType: 'poi',                elementType: 'labels',   stylers: [{ visibility: 'off' }] },
]

// Preset date ranges
const PRESETS = [
  { label: 'Last hour',   hours: 1 },
  { label: 'Last 6h',    hours: 6 },
  { label: 'Today',      hours: 24 },
  { label: 'Yesterday',  hours: 48, offset: 24 },
]

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function TripHistoryScreen() {
  const { id: vehicleId } = useLocalSearchParams<{ id: string }>()
  const mapRef = useRef<MapView>(null)

  const [positions, setPositions]   = useState<Position[]>([])
  const [loading, setLoading]       = useState(false)
  const [selectedPreset, setPreset] = useState(0)

  // Replay state
  const [isPlaying, setIsPlaying]   = useState(false)
  const [frameIndex, setFrameIndex] = useState(0)
  const [speed, setSpeed]           = useState<PlaybackSpeed>(2)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const current = positions[frameIndex] ?? null

  // ── Fetch history ─────────────────────────────────────────────────────────
  async function fetchHistory(presetIndex: number) {
    setLoading(true)
    setIsPlaying(false)
    setFrameIndex(0)
    clearInterval(intervalRef.current!)

    try {
      const preset = PRESETS[presetIndex]
      const now    = new Date()
      const to     = new Date(now.getTime() - (preset.offset ?? 0) * 3_600_000)
      const from   = new Date(to.getTime() - preset.hours * 3_600_000)

      const data = await api.get<Position[]>(
        `/locations/${vehicleId}/history?from=${from.toISOString()}&to=${to.toISOString()}`
      )
      setPositions(data)

      if (data.length > 0) {
        // Fit map to the trip bounds
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(
            data.map(p => ({ latitude: p.latitude, longitude: p.longitude })),
            { edgePadding: { top: 60, right: 40, bottom: 200, left: 40 }, animated: true }
          )
        }, 300)
      }
    } catch (e: any) {
      Alert.alert('Failed to load history', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory(0)
    return () => clearInterval(intervalRef.current!)
  }, [])

  // ── Playback engine ───────────────────────────────────────────────────────
  const play = useCallback(() => {
    if (positions.length === 0) return
    if (frameIndex >= positions.length - 1) setFrameIndex(0)

    setIsPlaying(true)
    intervalRef.current = setInterval(() => {
      setFrameIndex(prev => {
        if (prev >= positions.length - 1) {
          clearInterval(intervalRef.current!)
          setIsPlaying(false)
          return prev
        }
        const next = prev + 1
        // Pan map to follow the moving marker
        mapRef.current?.animateCamera({
          center: { latitude: positions[next].latitude, longitude: positions[next].longitude },
        }, { duration: 200 })
        return next
      })
    }, 200 / speed)  // 200ms base tick ÷ speed multiplier
  }, [positions, frameIndex, speed])

  const pause = useCallback(() => {
    clearInterval(intervalRef.current!)
    setIsPlaying(false)
  }, [])

  const seek = useCallback((index: number) => {
    pause()
    setFrameIndex(index)
    if (positions[index]) {
      mapRef.current?.animateCamera({
        center: { latitude: positions[index].latitude, longitude: positions[index].longitude },
      }, { duration: 300 })
    }
  }, [positions, pause])

  // Recalculate interval when speed changes mid-playback
  useEffect(() => {
    if (!isPlaying) return
    pause()
    play()
  }, [speed])

  // Stats derived from full trip
  const tripStats = positions.length >= 2 ? (() => {
    const maxSpeed   = Math.max(...positions.map(p => p.speed))
    const totalSecs  = (new Date(positions.at(-1)!.recorded_at).getTime() -
                        new Date(positions[0].recorded_at).getTime()) / 1000
    const ignitionOn = positions.filter(p => p.ignition).length
    return { maxSpeed, totalSecs, ignitionOn }
  })() : null

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Trip replay</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Date range presets */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presets} contentContainerStyle={styles.presetsContent}>
        {PRESETS.map((p, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.presetBtn, selectedPreset === i && styles.presetBtnActive]}
            onPress={() => { setPreset(i); fetchHistory(i) }}
          >
            <Text style={[styles.presetText, selectedPreset === i && styles.presetTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Map */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>Loading trip…</Text>
          </View>
        ) : positions.length === 0 ? (
          <View style={styles.loadingOverlay}>
            <Text style={styles.emptyIcon}>🛣️</Text>
            <Text style={styles.emptyTitle}>No trip data</Text>
            <Text style={styles.emptySubtitle}>No movement recorded in this time window</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            customMapStyle={DARK_MAP_STYLE}
            showsCompass={false}
            toolbarEnabled={false}
          >
            {/* Full route polyline */}
            <Polyline
              coordinates={positions.map(p => ({ latitude: p.latitude, longitude: p.longitude }))}
              strokeColor={`${Colors.accent}60`}
              strokeWidth={3}
            />

            {/* Travelled segment — highlighted */}
            {frameIndex > 0 && (
              <Polyline
                coordinates={positions.slice(0, frameIndex + 1).map(p => ({
                  latitude: p.latitude, longitude: p.longitude,
                }))}
                strokeColor={Colors.accent}
                strokeWidth={4}
              />
            )}

            {/* Start marker */}
            <Marker
              coordinate={{ latitude: positions[0].latitude, longitude: positions[0].longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.startMarker}><Text style={styles.markerText}>S</Text></View>
            </Marker>

            {/* End marker */}
            <Marker
              coordinate={{ latitude: positions.at(-1)!.latitude, longitude: positions.at(-1)!.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.endMarker}><Text style={styles.markerText}>E</Text></View>
            </Marker>

            {/* Current position marker */}
            {current && (
              <Marker
                coordinate={{ latitude: current.latitude, longitude: current.longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={isPlaying}
              >
                <View style={[
                  styles.currentMarker,
                  { transform: [{ rotate: `${current.course}deg` }] },
                ]}>
                  <Text style={styles.currentMarkerIcon}>▲</Text>
                </View>
              </Marker>
            )}
          </MapView>
        )}
      </View>

      {/* Playback controls */}
      {positions.length > 0 && (
        <View style={styles.controls}>
          {/* Current info */}
          {current && (
            <View style={styles.currentInfo}>
              <Text style={styles.currentTime}>{formatTime(current.recorded_at)}</Text>
              <Text style={styles.currentSpeed}>{Math.round(current.speed)} km/h</Text>
              {current.address && (
                <Text style={styles.currentAddress} numberOfLines={1}>{current.address}</Text>
              )}
            </View>
          )}

          {/* Scrubber */}
          <View style={styles.scrubberRow}>
            <Text style={styles.scrubberTime}>{positions[0] ? formatTime(positions[0].recorded_at) : ''}</Text>
            <ScrollView
              horizontal
              style={styles.scrubberTrack}
              showsHorizontalScrollIndicator={false}
              scrollEnabled={false}
            >
              {/* Simple tap-anywhere scrubber */}
              <TouchableOpacity
                style={styles.scrubberTouchable}
                onPress={(e) => {
                  const ratio = e.nativeEvent.locationX / 260
                  seek(Math.round(ratio * (positions.length - 1)))
                }}
              >
                <View style={styles.scrubberBg} />
                <View style={[
                  styles.scrubberFill,
                  { width: `${(frameIndex / Math.max(positions.length - 1, 1)) * 100}%` },
                ]} />
                <View style={[
                  styles.scrubberThumb,
                  { left: `${(frameIndex / Math.max(positions.length - 1, 1)) * 100}%` },
                ]} />
              </TouchableOpacity>
            </ScrollView>
            <Text style={styles.scrubberTime}>
              {positions.at(-1) ? formatTime(positions.at(-1)!.recorded_at) : ''}
            </Text>
          </View>

          {/* Transport controls row */}
          <View style={styles.transportRow}>
            {/* Go to start */}
            <TouchableOpacity style={styles.transportBtn} onPress={() => seek(0)}>
              <Text style={styles.transportIcon}>⏮</Text>
            </TouchableOpacity>

            {/* Play / Pause */}
            <TouchableOpacity
              style={styles.playBtn}
              onPress={isPlaying ? pause : play}
            >
              <Text style={styles.playBtnIcon}>{isPlaying ? '⏸' : '▶'}</Text>
            </TouchableOpacity>

            {/* Go to end */}
            <TouchableOpacity style={styles.transportBtn} onPress={() => seek(positions.length - 1)}>
              <Text style={styles.transportIcon}>⏭</Text>
            </TouchableOpacity>

            {/* Speed selector */}
            <View style={styles.speedRow}>
              {SPEEDS.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.speedBtn, speed === s && styles.speedBtnActive]}
                  onPress={() => setSpeed(s)}
                >
                  <Text style={[styles.speedBtnText, speed === s && styles.speedBtnTextActive]}>
                    {s}×
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Trip stats */}
          {tripStats && (
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{positions.length}</Text>
                <Text style={styles.statLabel}>pings</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{Math.round(tripStats.maxSpeed)}</Text>
                <Text style={styles.statLabel}>max km/h</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{formatDuration(tripStats.totalSecs)}</Text>
                <Text style={styles.statLabel}>duration</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{Math.round((frameIndex / Math.max(positions.length - 1, 1)) * 100)}%</Text>
                <Text style={styles.statLabel}>replayed</Text>
              </View>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  header:       {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:      { width: 36, height: 36, justifyContent: 'center' },
  backIcon:     { fontSize: 28, color: Colors.accent, lineHeight: 32 },
  title:        { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },

  presets:        { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: Colors.border },
  presetsContent: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm, flexDirection: 'row' },
  presetBtn:      {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full, backgroundColor: Colors.bgElevated,
    borderWidth: 1, borderColor: Colors.border,
  },
  presetBtnActive:  { backgroundColor: Colors.accentDim, borderColor: Colors.accent },
  presetText:       { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  presetTextActive: { color: Colors.accent, fontWeight: Typography.weights.semibold },

  mapContainer:  { flex: 1 },
  map:           { flex: 1 },

  loadingOverlay: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bg, gap: Spacing.md,
  },
  loadingText:    { color: Colors.textSecondary, fontSize: Typography.sizes.base },
  emptyIcon:      { fontSize: 48 },
  emptyTitle:     { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  emptySubtitle:  { fontSize: Typography.sizes.base, color: Colors.textSecondary, textAlign: 'center' },

  // Markers
  startMarker: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  endMarker: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.danger, alignItems: 'center', justifyContent: 'center',
  },
  markerText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  currentMarker: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bg,
    borderWidth: 2, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  currentMarkerIcon: { color: Colors.accent, fontSize: 14 },

  // Controls panel
  controls: {
    backgroundColor: Colors.bgCard, borderTopWidth: 1, borderTopColor: Colors.border,
    padding: Spacing.md, gap: Spacing.sm,
  },

  currentInfo: { gap: 2 },
  currentTime: { fontSize: Typography.sizes.sm, color: Colors.textMuted },
  currentSpeed:{ fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, color: Colors.accent },
  currentAddress: { fontSize: Typography.sizes.xs, color: Colors.textSecondary },

  // Scrubber
  scrubberRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  scrubberTime:     { fontSize: Typography.sizes.xs, color: Colors.textMuted, width: 40, textAlign: 'center' },
  scrubberTrack:    { flex: 1 },
  scrubberTouchable:{ height: 24, justifyContent: 'center', width: 260 },
  scrubberBg:       { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.bgElevated, borderRadius: 2, top: 10, bottom: 10 },
  scrubberFill:     { position: 'absolute', left: 0, top: 10, bottom: 10, backgroundColor: Colors.accent, borderRadius: 2 },
  scrubberThumb:    {
    position: 'absolute', width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.accent, top: 4, marginLeft: -8,
    borderWidth: 2, borderColor: '#fff',
  },

  // Transport
  transportRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  transportBtn:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  transportIcon: { fontSize: 22, color: Colors.textSecondary },
  playBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  playBtnIcon: { fontSize: 22, color: Colors.bg },

  speedRow:         { flexDirection: 'row', gap: 4, marginLeft: Spacing.sm },
  speedBtn:         { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm, backgroundColor: Colors.bgElevated },
  speedBtnActive:   { backgroundColor: Colors.accentDim },
  speedBtnText:     { fontSize: Typography.sizes.xs, color: Colors.textSecondary },
  speedBtnTextActive: { color: Colors.accent, fontWeight: Typography.weights.semibold },

  // Stats
  statsRow:     {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: Colors.bgElevated, borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  stat:         { flex: 1, alignItems: 'center', gap: 2 },
  statValue:    { fontSize: Typography.sizes.base, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  statLabel:    { fontSize: Typography.sizes.xs, color: Colors.textMuted },
  statDivider:  { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
})