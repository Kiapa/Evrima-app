export type VehicleType = 'saloon' | 'suv' | 'pickup' | 'matatu' | 'truck' | 'motorcycle'
export type SimProvider = 'safaricom' | 'airtel' | 'telkom'

export interface User {
  id: string
  email: string
  full_name: string | null
  phone_number: string | null
}

export interface TrackerSummary {
  id: string
  imei: string
  sim_provider: SimProvider
  linked_at: string
}

export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  registration_plate: string
  color: string | null
  vehicle_type: VehicleType
  tracker: TrackerSummary | null
  created_at: string
}

export interface Position {
  id: string
  latitude: number
  longitude: number
  speed: number        // km/h
  course: number       // degrees, 0 = north
  altitude: number | null
  ignition: boolean
  address: string | null
  recorded_at: string
}

// WebSocket message from the backend
export interface PositionUpdateMessage {
  type: 'position_update'
  vehicle_id: string
  latitude: number
  longitude: number
  speed: number
  course: number
  ignition: boolean
  address: string | null
  recorded_at: string
}

export interface VehicleWithPosition extends Vehicle {
  latest_position: Position | null
}