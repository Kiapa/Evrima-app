import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { Platform } from 'react-native'
import { api } from '@/lib/api'

// ── Global notification behaviour ────────────────────────────────────────────
// Controls how notifications are presented when the app is in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// ── Token registration ────────────────────────────────────────────────────────

/**
 * Request permission and register the device's Expo push token with our backend.
 *
 * Call once after a successful sign-in, from the authenticated layout.
 * Safe to call on every app launch — the backend upserts.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Expo push notifications don't work on the simulator/emulator for iOS
  // Check for a physical device in production if needed
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('[notifications] Permission denied')
    return null
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('trackr-alerts', {
      name: 'Vehicle Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00E5A0',
      sound: 'default',
    })
  }

  const tokenData = await Notifications.getExpoPushTokenAsync()
  const token = tokenData.data

  // Register with our FastAPI backend
  try {
    await api.post('/notifications/tokens', {
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    })
    console.log('[notifications] Token registered:', token)
  } catch (e) {
    console.warn('[notifications] Failed to register token with backend:', e)
  }

  return token
}

/**
 * Deregister the push token on sign-out so the user stops receiving
 * notifications on a device they've logged out of.
 */
export async function deregisterPushToken(): Promise<void> {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync()
    await api.delete(`/notifications/tokens/${encodeURIComponent(tokenData.data)}`)
  } catch {
    // Best effort — don't block sign-out
  }
}

// ── Notification tap handler ──────────────────────────────────────────────────

/**
 * Set up the global listener for when a user taps a notification.
 * Returns a cleanup function — call it in a useEffect cleanup.
 *
 * Notification data shape (set by the backend):
 *   { type: 'ignition_on' | 'ignition_off' | 'overspeeding', vehicle_id: string }
 */
export function setupNotificationTapHandler(): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data as {
        type?: string
        vehicle_id?: string
      }

      if (data?.vehicle_id) {
        // Navigate to the map tab and focus the vehicle
        router.push('/(app)')
        // Small delay to let the tab mount before we set the selected vehicle
        setTimeout(() => {
          // The store is imported lazily to avoid circular deps at module load
          import('@/store/vehicles').then(({ useVehiclesStore }) => {
            useVehiclesStore.getState().selectVehicle(data.vehicle_id!)
          })
        }, 300)
      }
    },
  )

  return () => Notifications.removeNotificationSubscription(subscription)
}

/**
 * Handle a notification that arrived while the app was closed or backgrounded.
 * Call this on app launch to check if the user opened the app via a notification.
 */
export async function handleInitialNotification(): Promise<void> {
  const response = await Notifications.getLastNotificationResponseAsync()
  if (!response) return

  const data = response.notification.request.content.data as {
    type?: string
    vehicle_id?: string
  }

  if (data?.vehicle_id) {
    // Slight delay — let the navigation stack fully mount first
    setTimeout(() => {
      router.push('/(app)')
      setTimeout(() => {
        import('@/store/vehicles').then(({ useVehiclesStore }) => {
          useVehiclesStore.getState().selectVehicle(data.vehicle_id!)
        })
      }, 300)
    }, 500)
  }
}