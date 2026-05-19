import { create } from 'zustand'
import { api } from '@/lib/api'
import { trackrWS } from '@/lib/websocket'
import type { Position, Vehicle, VehicleWithPosition } from '@/types'

interface VehiclesState {
  vehicles: VehicleWithPosition[]
  loading: boolean
  error: string | null

  // Selected vehicle for detail/focus
  selectedVehicleId: string | null

  // Actions
  fetchVehicles: () => Promise<void>
  fetchLatestPosition: (vehicleId: string) => Promise<void>
  addVehicle: (data: Omit<Vehicle, 'id' | 'created_at' | 'tracker'>) => Promise<Vehicle>
  removeVehicle: (vehicleId: string) => Promise<void>
  selectVehicle: (vehicleId: string | null) => void

  // WebSocket integration
  startLiveTracking: () => void
  stopLiveTracking: () => void
}

export const useVehiclesStore = create<VehiclesState>((set, get) => ({
  vehicles: [],
  loading: false,
  error: null,
  selectedVehicleId: null,

  fetchVehicles: async () => {
    set({ loading: true, error: null })
    try {
      const vehicles = await api.get<Vehicle[]>('/vehicles')
      const withPositions: VehicleWithPosition[] = vehicles.map(v => ({
        ...v,
        latest_position: null,
      }))
      set({ vehicles: withPositions })

      // Fetch latest position for each vehicle that has a tracker
      await Promise.all(
        withPositions
          .filter(v => v.tracker)
          .map(v => get().fetchLatestPosition(v.id))
      )
    } catch (e: any) {
      set({ error: e.message })
    } finally {
      set({ loading: false })
    }
  },

  fetchLatestPosition: async (vehicleId) => {
    try {
      const position = await api.get<Position>(`/locations/${vehicleId}/latest`)
      set(state => ({
        vehicles: state.vehicles.map(v =>
          v.id === vehicleId ? { ...v, latest_position: position } : v
        ),
      }))
    } catch {
      // No position yet — that's fine, vehicle hasn't moved
    }
  },

  addVehicle: async (data) => {
    const vehicle = await api.post<Vehicle>('/vehicles', data)
    const withPosition: VehicleWithPosition = { ...vehicle, latest_position: null }
    set(state => ({ vehicles: [withPosition, ...state.vehicles] }))
    return vehicle
  },

  removeVehicle: async (vehicleId) => {
    await api.delete(`/vehicles/${vehicleId}`)
    set(state => ({
      vehicles: state.vehicles.filter(v => v.id !== vehicleId),
      selectedVehicleId:
        state.selectedVehicleId === vehicleId ? null : state.selectedVehicleId,
    }))
  },

  selectVehicle: (vehicleId) => {
    set({ selectedVehicleId: vehicleId })
  },

  startLiveTracking: () => {
    trackrWS.connect()

    trackrWS.subscribe((msg) => {
      set(state => ({
        vehicles: state.vehicles.map(v =>
          v.id === msg.vehicle_id
            ? {
                ...v,
                latest_position: {
                  id: crypto.randomUUID(),   // transient — not from DB
                  latitude: msg.latitude,
                  longitude: msg.longitude,
                  speed: msg.speed,
                  course: msg.course,
                  altitude: null,
                  ignition: msg.ignition,
                  address: msg.address,
                  recorded_at: msg.recorded_at,
                },
              }
            : v
        ),
      }))
    })
  },

  stopLiveTracking: () => {
    trackrWS.disconnect()
  },
}))
