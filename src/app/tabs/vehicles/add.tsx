import { router } from 'expo-router'
import React, { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Colors, Spacing, Typography, VEHICLE_TYPES, type VehicleType } from '@/constants'
import { useVehiclesStore } from '@/store/vehicles'

export default function AddVehicleScreen() {
  const { addVehicle } = useVehiclesStore()
  const [loading, setLoading] = useState(false)

  const [make, setMake]   = useState('')
  const [model, setModel] = useState('')
  const [year, setYear]   = useState('')
  const [plate, setPlate] = useState('')
  const [color, setColor] = useState('')
  const [type, setType]   = useState<VehicleType | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!make.trim())  next.make  = 'Make is required (e.g. Toyota)'
    if (!model.trim()) next.model = 'Model is required (e.g. Fielder)'
    if (!year.trim()) next.year   = 'Year is required'
    else if (isNaN(Number(year)) || Number(year) < 1980 || Number(year) > 2100)
      next.year = 'Enter a valid year'
    if (!plate.trim()) next.plate = 'Registration plate is required'
    if (!type) next.type          = 'Select a vehicle type'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    try {
      const vehicle = await addVehicle({
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        registration_plate: plate.trim().toUpperCase(),
        color: color.trim() || null,
        vehicle_type: type!,
      })
      // Go straight to link tracker — the natural next step
      router.replace(`/(app)/vehicles/${vehicle.id}/link-tracker`)
    } catch (e: any) {
      Alert.alert('Failed to add vehicle', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add vehicle</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.step}>Step 1 of 2 — Vehicle details</Text>

          <View style={styles.form}>
            {/* Make + Model on same row */}
            <View style={styles.row}>
              <View style={styles.rowHalf}>
                <Input
                  label="Make"
                  value={make}
                  onChangeText={setMake}
                  autoCapitalize="words"
                  placeholder="Toyota"
                  error={errors.make}
                />
              </View>
              <View style={styles.rowHalf}>
                <Input
                  label="Model"
                  value={model}
                  onChangeText={setModel}
                  autoCapitalize="words"
                  placeholder="Fielder"
                  error={errors.model}
                />
              </View>
            </View>

            {/* Year + Color */}
            <View style={styles.row}>
              <View style={styles.rowHalf}>
                <Input
                  label="Year"
                  value={year}
                  onChangeText={setYear}
                  keyboardType="numeric"
                  placeholder="2019"
                  maxLength={4}
                  error={errors.year}
                />
              </View>
              <View style={styles.rowHalf}>
                <Input
                  label="Color (optional)"
                  value={color}
                  onChangeText={setColor}
                  autoCapitalize="words"
                  placeholder="White"
                />
              </View>
            </View>

            <Input
              label="Registration plate"
              value={plate}
              onChangeText={t => setPlate(t.toUpperCase())}
              autoCapitalize="characters"
              placeholder="KDD 123A"
              error={errors.plate}
              hint="As it appears on your logbook"
            />

            <Select
              label="Vehicle type"
              options={VEHICLE_TYPES}
              value={type}
              onChange={setType}
              placeholder="Select type…"
              error={errors.type}
            />
          </View>

          <Button
            title="Continue to tracker setup →"
            onPress={handleSubmit}
            loading={loading}
            size="lg"
            style={styles.cta}
          />

          <Text style={styles.disclaimer}>
            Next you'll scan the tracker barcode to link it to this vehicle
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  flex:    { flex: 1 },
  header:  {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn:  { width: 36, height: 36, justifyContent: 'center' },
  backIcon: { fontSize: 28, color: Colors.accent, lineHeight: 32 },
  title:    {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },

  content:     { padding: Spacing.lg, gap: Spacing.lg },
  step:        { fontSize: Typography.sizes.sm, color: Colors.accent, fontWeight: Typography.weights.medium },
  form:        { gap: Spacing.md },
  row:         { flexDirection: 'row', gap: Spacing.sm },
  rowHalf:     { flex: 1 },
  cta:         { marginTop: Spacing.sm },
  disclaimer:  { fontSize: Typography.sizes.xs, color: Colors.textMuted, textAlign: 'center' },
})