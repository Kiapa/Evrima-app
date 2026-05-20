import { CameraView, useCameraPermissions } from 'expo-camera'
import { router, useLocalSearchParams } from 'expo-router'
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
import { Colors, Radius, SIM_PROVIDERS, Spacing, Typography } from '@/constants'
import type { SimProvider } from '@/types'
import { api } from '@/lib/api'
import { useVehiclesStore } from '@/store/vehicles'

type Step = 'scan' | 'details' | 'done'

export default function LinkTrackerScreen() {
  const { id: vehicleId } = useLocalSearchParams<{ id: string }>()
  const { fetchVehicles }  = useVehiclesStore()
  const [permission, requestPermission] = useCameraPermissions()

  const [step, setStep]           = useState<Step>('scan')
  const [scanned, setScanned]     = useState(false)
  const [imei, setImei]           = useState('')
  const [simProvider, setSimProvider] = useState<SimProvider | null>(null)
  const [simNumber, setSimNumber] = useState('')
  const [loading, setLoading]     = useState(false)
  const [errors, setErrors]       = useState<Record<string, string>>({})

  function handleBarcodeScan({ data }: { data: string }) {
    if (scanned) return
    setScanned(true)

    // Barcodes on trackers encode the IMEI (15 digits)
    const cleaned = data.replace(/\D/g, '')
    if (cleaned.length < 15) {
      Alert.alert(
        'Invalid barcode',
        'This doesn\'t look like a tracker barcode. Make sure you\'re scanning the IMEI barcode on the device.',
        [{ text: 'Try again', onPress: () => setScanned(false) }],
      )
      return
    }
    setImei(cleaned)
    setStep('details')
  }

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!imei || imei.length < 15) next.imei = 'IMEI must be at least 15 digits'
    if (!simProvider) next.simProvider = 'Select a SIM provider'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleLink() {
    if (!validate()) return
    setLoading(true)
    try {
      await api.post(`/trackers`, {
        imei,
        vehicle_id: vehicleId,
        sim_provider: simProvider,
        sim_number: simNumber.trim() || null,
      })
      await fetchVehicles()
      setStep('done')
    } catch (e: any) {
      Alert.alert('Failed to link tracker', e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Step: scan ────────────────────────────────────────────────────────────
  if (step === 'scan') {
    if (!permission?.granted) {
      return (
        <SafeAreaView style={styles.safe}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionIcon}>📷</Text>
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionSubtitle}>
              Trackr needs the camera to scan the IMEI barcode on your tracker
            </Text>
            <Button title="Allow camera access" onPress={requestPermission} />
          </View>
        </SafeAreaView>
      )
    }

    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Scan tracker</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarcodeScan}
            barcodeScannerSettings={{ barcodeTypes: ['code128', 'code39', 'ean13', 'qr'] }}
          />

          {/* Viewfinder overlay */}
          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
          </View>
        </View>

        <View style={styles.scanFooter}>
          <Text style={styles.scanInstruction}>
            Point the camera at the IMEI barcode on your tracking device
          </Text>
          <TouchableOpacity
            onPress={() => { setImei(''); setStep('details') }}
            style={styles.manualLink}
          >
            <Text style={styles.manualLinkText}>Enter IMEI manually instead</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ── Step: details ─────────────────────────────────────────────────────────
  if (step === 'details') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => { setStep('scan'); setScanned(false) }} style={styles.backBtn}>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.title}>SIM details</Text>
            <View style={{ width: 36 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.step}>Step 2 of 2 — Tracker details</Text>

            {/* IMEI confirmation */}
            <View style={styles.imeiCard}>
              <Text style={styles.imeiLabel}>Device IMEI</Text>
              <Text style={styles.imeiValue}>{imei || 'Not scanned'}</Text>
              <TouchableOpacity onPress={() => { setScanned(false); setStep('scan') }}>
                <Text style={styles.rescanLink}>Re-scan</Text>
              </TouchableOpacity>
            </View>

            {/* Manual IMEI entry if they skipped scan */}
            {!imei && (
              <Input
                label="Enter IMEI manually"
                value={imei}
                onChangeText={setImei}
                keyboardType="numeric"
                maxLength={17}
                placeholder="15-digit IMEI number"
                hint="Found on the device label or packaging"
                error={errors.imei}
              />
            )}

            <Select
              label="SIM provider"
              options={SIM_PROVIDERS}
              value={simProvider}
              onChange={setSimProvider}
              placeholder="Select network…"
              error={errors.simProvider}
            />

            <Input
              label="SIM phone number (optional)"
              value={simNumber}
              onChangeText={setSimNumber}
              keyboardType="phone-pad"
              placeholder="+254 712 345 678"
              hint="The number on the SIM inserted in the tracker"
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                Make sure the tracker is powered on and the SIM has mobile data activated.
                First location ping may take up to 2 minutes after ignition.
              </Text>
            </View>

            <Button
              title="Link tracker"
              onPress={handleLink}
              loading={loading}
              size="lg"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    )
  }

  // ── Step: done ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Text style={styles.successEmoji}>✅</Text>
        </View>
        <Text style={styles.successTitle}>Tracker linked!</Text>
        <Text style={styles.successSubtitle}>
          Your vehicle will appear on the map as soon as the tracker sends its first location.
          Turn on the ignition to test it.
        </Text>

        <View style={styles.successImei}>
          <Text style={styles.imeiLabel}>IMEI</Text>
          <Text style={styles.imeiValue}>{imei}</Text>
        </View>

        <Button
          title="Go to map"
          onPress={() => router.replace('/(app)')}
          size="lg"
          style={{ width: '100%' }}
        />
      </View>
    </SafeAreaView>
  )
}

const CORNER_SIZE = 24
const CORNER_WIDTH = 3

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },

  header: {
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
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },

  // Camera
  cameraContainer: { flex: 1 },
  camera:          { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00000055',
  },
  scanArea: {
    width: 260,
    height: 160,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: Colors.accent,
  },
  cornerTL: { top: 0,    left: 0,    borderTopWidth: CORNER_WIDTH,    borderLeftWidth: CORNER_WIDTH },
  cornerTR: { top: 0,    right: 0,   borderTopWidth: CORNER_WIDTH,    borderRightWidth: CORNER_WIDTH },
  cornerBL: { bottom: 0, left: 0,    borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH },
  cornerBR: { bottom: 0, right: 0,   borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH },

  scanFooter: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bgCard,
  },
  scanInstruction: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  manualLink:     {},
  manualLinkText: {
    fontSize: Typography.sizes.sm,
    color: Colors.accent,
    fontWeight: Typography.weights.medium,
  },

  // Details step
  content: { padding: Spacing.lg, gap: Spacing.lg },
  step:    { fontSize: Typography.sizes.sm, color: Colors.accent, fontWeight: Typography.weights.medium },

  imeiCard: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imeiLabel: { fontSize: Typography.sizes.xs, color: Colors.textMuted, flex: 0 },
  imeiValue: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  rescanLink: { fontSize: Typography.sizes.sm, color: Colors.accent },

  infoBox: {
    backgroundColor: Colors.accentDim,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: `${Colors.accent}30`,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  infoIcon: { fontSize: 16 },
  infoText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Permission
  permissionContainer: {
    flex: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  permissionIcon:     { fontSize: 64 },
  permissionTitle:    { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  permissionSubtitle: { fontSize: Typography.sizes.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  // Success
  successContainer: {
    flex: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  successIcon:     {
    width: 96,
    height: 96,
    backgroundColor: Colors.accentDim,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successEmoji:    { fontSize: 48 },
  successTitle:    { fontSize: Typography.sizes['2xl'], fontWeight: Typography.weights.bold, color: Colors.textPrimary },
  successSubtitle: { fontSize: Typography.sizes.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  successImei: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    width: '100%',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
})