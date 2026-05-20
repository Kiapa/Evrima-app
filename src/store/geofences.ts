import { create } from 'zustand'
import { api } from '@/lib/api'

export interface LatLng { lat: number; lng: number }

export interface Geofence {
  id: string
  name: string
  shape: 'circle' | 'polygon'
  color: string
  vehicle_id: string | null
  center_lat: number | null
  center_lng: number | null
  radius_meters: number | null
  coordinates: LatLng[] | null
  is_active: boolean
  created_at: string
}

interface GeofencesState {
  geofences: Geofence[]
  loading: boolean
  fetchGeofences: () => Promise<void>
  createGeofence: (data: any) => Promise<Geofence>
  toggleGeofence: (id: string, isActive: boolean) => Promise<void>
  deleteGeofence: (id: string) => Promise<void>
}

export const useGeofencesStore = create<GeofencesState>((set) => ({
  geofences: [],
  loading: false,

  fetchGeofences: async () => {
    set({ loading: true })
    try {
      const geofences = await api.get<Geofence[]>('/geofences')
      set({ geofences })
    } catch (e) {
      // not blocking
    } finally {
      set({ loading: false })
    }
  },

  createGeofence: async (data) => {
    const geofence = await api.post<Geofence>('/geofences', data)
    set(state => ({ geofences: [geofence, ...state.geofences] }))
    return geofence
  },

  toggleGeofence: async (id, isActive) => {
    await api.patch(`/geofences/${id}`, { is_active: isActive })
    set(state => ({
      geofences: state.geofences.map(g =>
        g.id === id ? { ...g, is_active: isActive } : g
      ),
    }))
  },

  deleteGeofence: async (id) => {
    await api.delete(`/geofences/${id}`)
    set(state => ({ geofences: state.geofences.filter(g => g.id !== id) }))
  },
}))