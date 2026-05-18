import { Link, router } from 'expo-router'
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
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Colors, Spacing, Typography } from '@/constants'
import { useAuthStore } from '@/store/auth'

export default function SignupScreen() {
  const { signUp, loading } = useAuthStore()

  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [errors, setErrors]     = useState<Record<string, string>>({})

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!fullName.trim()) next.fullName = 'Full name is required'
    if (!email.trim()) next.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = 'Enter a valid email'
    if (!password) next.password = 'Password is required'
    else if (password.length < 8) next.password = 'Password must be at least 8 characters'
    if (password !== confirm) next.confirm = 'Passwords do not match'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSignUp() {
    if (!validate()) return
    try {
      await signUp(email.trim().toLowerCase(), password, fullName.trim())
      Alert.alert(
        'Check your email',
        'We sent a confirmation link to your email. Please verify your account before signing in.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
      )
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message)
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
          <View style={styles.header}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Start tracking your vehicle in minutes
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoComplete="name"
              placeholder="Jane Mwangi"
              error={errors.fullName}
            />

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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              error={errors.password}
            />

            <Input
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoComplete="new-password"
              placeholder="Repeat your password"
              error={errors.confirm}
            />

            <Button
              title="Create account"
              onPress={handleSignUp}
              loading={loading}
              size="lg"
              style={styles.cta}
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <Text style={styles.footerLink}>Sign in</Text>
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

  header: { gap: Spacing.xs },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
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