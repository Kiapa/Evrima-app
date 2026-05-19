import { router } from 'expo-router'
import React, { useEffect } from 'react'
import {
  Alert, RefreshControl, ScrollView,
  StyleSheet, Switch, Text, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '@/components/ui/Button'
import { Colors, Radius, Spacing, Typography } from '@/constants'
import { useGeofencesStore, type Geofence } from '@/store/geofences'

function GeofenceCard({ fence }: { fence: Geofence }) {
  const { toggleGeofence, deleteGeofence } = useGeofencesStore()

  function handleDelete() {
    Alert.alert('Delete geofence', `Remove "${fence.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteGeofence(fence.id) }
          catch (e: any) { Alert.alert('Error', e.message) }
        },
      },
    ])
  }

  const shapeLabel = fence.shape === 'circle'
    ? `Circle · ${fence.radius_meters ? (fence.radius_meters >= 1000 ? `${(fence.radius_meters / 1000).toFixed(1)} km` : `${fence.radius_meters}m`) : ''} radius`
    : `Polygon · ${fence.coordinates?.length ?? 0} points`

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.colorDot, { backgroundColor: fence.color }]} />
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{fence.name}</Text>
          <Text style={styles.cardShape}>{shapeLabel}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
        <Switch
          value={fence.is_active}
          onValueChange={v => toggleGeofence(fence.id, v)}
          trackColor={{ true: Colors.accent, false: Colors.border }}
          thumbColor="#fff"
        />
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default function GeofencesScreen() {
  const { geofences, loading, fetchGeofences } = useGeofencesStore()

  useEffect(() => { fetchGeofences() }, [])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Geofences</Text>
          <Text style={styles.subtitle}>{geofences.length} zone{geofences.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(app)/geofences/create')}
        >
          <Text style={styles.addIcon}>＋</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchGeofences} tintColor={Colors.accent} />
        }
      >
        {geofences.length === 0 && !loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyTitle}>No geofences yet</Text>
            <Text style={styles.emptySubtitle}>
              Draw a zone on the map. Get notified whenever a vehicle enters or leaves it.
            </Text>
            <Button title="Create geofence" onPress={() => router.push('/(app)/geofences/create')} />
          </View>
        ) : (
          geofences.map(fence => <GeofenceCard key={fence.id} fence={fence} />)
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.bg },
  header:   {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title:    { fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  subtitle: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 2 },
  addBtn:   { width: 36, height: 36, backgroundColor: Colors.accentDim, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  addIcon:  { color: Colors.accent, fontSize: 20, lineHeight: 22 },

  content: { padding: Spacing.lg, gap: Spacing.sm },

  card: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  cardLeft:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  colorDot:  { width: 12, height: 12, borderRadius: 6 },
  cardInfo:  { flex: 1 },
  cardName:  { fontSize: Typography.sizes.base, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  cardShape: { fontSize: Typography.sizes.sm, color: Colors.textSecondary, marginTop: 2 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  deleteBtn: { padding: Spacing.xs },
  deleteIcon:{ fontSize: 16 },

  empty: { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing['2xl'] },
  emptyIcon:     { fontSize: 48 },
  emptyTitle:    { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.semibold, color: Colors.textPrimary },
  emptySubtitle: { fontSize: Typography.sizes.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
})