import React from 'react'
import { Circle, Polygon } from 'react-native-maps'
import type { Geofence } from '@/store/geofences'

interface GeofenceLayerProps {
  geofences: Geofence[]
}

/**
 * Renders all active geofences on the map.
 * Circles use react-native-maps Circle.
 * Polygons use react-native-maps Polygon.
 */
export function GeofenceLayer({ geofences }: GeofenceLayerProps) {
  return (
    <>
      {geofences.filter(g => g.is_active).map(fence => {
        if (fence.shape === 'circle' && fence.center_lat && fence.center_lng && fence.radius_meters) {
          return (
            <Circle
              key={fence.id}
              center={{ latitude: fence.center_lat, longitude: fence.center_lng }}
              radius={fence.radius_meters}
              strokeColor={fence.color}
              strokeWidth={2}
              fillColor={`${fence.color}25`}   // 15% opacity fill
            />
          )
        }

        if (fence.shape === 'polygon' && fence.coordinates?.length) {
          return (
            <Polygon
              key={fence.id}
              coordinates={fence.coordinates.map(c => ({
                latitude: c.lat,
                longitude: c.lng,
              }))}
              strokeColor={fence.color}
              strokeWidth={2}
              fillColor={`${fence.color}25`}
            />
          )
        }

        return null
      })}
    </>
  )
}
