import { Link } from 'expo-router'
import React, { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Colors, Spacing, Typography } from '@/constants'
import { useAuthStore } from '@/store/auth'

export default function LoginScreen() {
  const { signIn, loading } = useAuthStore()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({})

  function validate(): boolean {
    const next: typeof errors = {}
    if (!email.trim()) next.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Enter a valid email'
    if (!password) next.password = 'Password is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSignIn() {
    if (!validate()) return
    try {
      await signIn(email.trim().toLowerCase(), password)
      // Navigation handled in _layout.tsx via auth state change
    } catch (e: any) {
      Alert.alert('Sign in failed', e.message)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo / wordmark */}
          <View style={styles.header}>
            <View style={styles.logoMark}>
              <Text style={styles.logoGlyph}>⬡</Text>
            </View>
            <Text style={styles.appName}>Trackr</Text>
            <Text style={styles.tagline}>Kenya's vehicle tracking platform</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              placeholder="you@example.com"
              error={errors.email}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password}
            />

            <Button
              title="Sign in"
              onPress={handleSignIn}
              loading={loading}
              size="lg"
              style={styles.cta}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/auth/signup" asChild>
              <Text style={styles.footerLink}>Create one</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  flex:      { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg, gap: Spacing.xl },

  header: { alignItems: 'center', gap: Spacing.sm },
  logoMark: {
    width: 64,
    height: 64,
    backgroundColor: Colors.accentDim,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  logoGlyph: { fontSize: 32, color: Colors.accent },
  appName: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },

  form: { gap: Spacing.md },
  cta:  { marginTop: Spacing.sm },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  footerLink: {
    fontSize: Typography.sizes.sm,
    color: Colors.accent,
    fontWeight: Typography.weights.semibold,
  },
})