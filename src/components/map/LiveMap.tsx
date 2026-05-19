import React, { useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { Colors } from '@/constants'
import type { VehicleWithPosition } from '@/types'
import type { Geofence } from '@/store/geofences'
import { GeofenceLayer } from './GeofenceLayer'
import { VehicleMarker } from './VehicleMarker'

// Dark map style — matches the app's dark theme
const DARK_MAP_STYLE = [
  { elementType: 'geometry',           stylers: [{ color: '#0f0f0f' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#555555' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f0f0f' }] },
  { featureType: 'road',               elementType: 'geometry',         stylers: [{ color: '#1c1c1c' }] },
  { featureType: 'road',               elementType: 'geometry.stroke',  stylers: [{ color: '#222222' }] },
  { featureType: 'road',               elementType: 'labels.text.fill', stylers: [{ color: '#444444' }] },
  { featureType: 'road.highway',       elementType: 'geometry',         stylers: [{ color: '#2a2a2a' }] },
  { featureType: 'water',              elementType: 'geometry',         stylers: [{ color: '#080808' }] },
  { featureType: 'poi',                elementType: 'labels',           stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',            elementType: 'labels',           stylers: [{ visibility: 'off' }] },
]

// Nairobi city centre — default camera position
const NAIROBI = {
  latitude: -1.2921,
  longitude: 36.8219,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
}

interface LiveMapProps {
  vehicles: VehicleWithPosition[]
  selectedVehicleId: string | null
  onMarkerPress: (vehicleId: string) => void
  geofences?: Geofence[]
  // Trip replay — when set, shows a static marker instead of live vehicles
  replayPosition?: { latitude: number; longitude: number } | null
}

export function LiveMap({ vehicles, selectedVehicleId, onMarkerPress, geofences = [], replayPosition }: LiveMapProps) {
  const mapRef = useRef<MapView>(null)

  // When a vehicle is selected and has a position, animate the camera to it
  useEffect(() => {
    if (!selectedVehicleId) return
    const vehicle = vehicles.find(v => v.id === selectedVehicleId)
    if (!vehicle?.latest_position) return

    mapRef.current?.animateToRegion({
      latitude: vehicle.latest_position.latitude,
      longitude: vehicle.latest_position.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }, 600)
  }, [selectedVehicleId, vehicles])

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={NAIROBI}
        customMapStyle={DARK_MAP_STYLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsTraffic={false}
        toolbarEnabled={false}
      >
        <GeofenceLayer geofences={geofences} />

        {vehicles
          .filter(v => v.latest_position && !replayPosition)
          .map(vehicle => (
            <Marker
              key={vehicle.id}
              coordinate={{
                latitude: vehicle.latest_position!.latitude,
                longitude: vehicle.latest_position!.longitude,
              }}
              onPress={() => onMarkerPress(vehicle.id)}
              tracksViewChanges={false}
            >
              <VehicleMarker
                vehicle={vehicle}
                isSelected={vehicle.id === selectedVehicleId}
              />
            </Marker>
          ))}
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
})