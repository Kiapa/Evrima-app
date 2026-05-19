import { Tabs } from 'expo-router'
import React, { useEffect } from 'react'
import { Text } from 'react-native'
import { Colors, Typography } from '@/constants'
import {
  handleInitialNotification,
  registerForPushNotifications,
  setupNotificationTapHandler,
} from '@/lib/notifications'
import { useGeofencesStore } from '@/store/geofences'
import { useVehiclesStore } from '@/store/vehicles'

function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{glyph}</Text>
  )
}

export default function AppLayout() {
  const { fetchVehicles, startLiveTracking, stopLiveTracking } = useVehiclesStore()
  const { fetchGeofences } = useGeofencesStore()

  useEffect(() => {
    // Data + WebSocket
    fetchVehicles()
    fetchGeofences()
    startLiveTracking()

    // Push notifications — register token, handle cold-start tap, listen for taps
    registerForPushNotifications()
    handleInitialNotification()
    const cleanupTapHandler = setupNotificationTapHandler()

    return () => {
      stopLiveTracking()
      cleanupTapHandler()
    }
  }, [])

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.weights.medium,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => <TabIcon glyph="🗺️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Vehicles',
          tabBarIcon: ({ focused }) => <TabIcon glyph="🚗" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="geofences"
        options={{
          title: 'Zones',
          tabBarIcon: ({ focused }) => <TabIcon glyph="📍" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon glyph="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  )
}