import { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  user: SupabaseUser | null
  loading: boolean
  initialized: boolean

  // Actions
  initialize: () => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    // Restore session from AsyncStorage on app launch
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null, initialized: true })

    // Listen for auth state changes (token refresh, sign out on another device, etc.)
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null })
    })
  },

  signUp: async (email, password, fullName) => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: 'user' },
        },
      })
      if (error) throw error
    } finally {
      set({ loading: false })
    }
  },

  signIn: async (email, password) => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null })
  },
}))
