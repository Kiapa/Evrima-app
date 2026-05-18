import { Slot, router } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import React, { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { useAuthStore } from '@/store/auth'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { initialize, initialized, session } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [])

  useEffect(() => {
    if (!initialized) return
    SplashScreen.hideAsync()

    // Route based on auth state
    if (session) {
      router.replace('/tabs')
    } else {
      router.replace('/auth/login')
    }
  }, [initialized, session])

  return (
    <>
      <StatusBar style="light" />
      <Slot />
    </>
  )
}