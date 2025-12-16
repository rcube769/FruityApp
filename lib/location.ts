/**
 * Location utilities for house detection and verification
 */

export interface Coordinates {
  lat: number
  lng: number
}

/**
 * Get user's current location using browser geolocation
 */
export async function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        let message = 'Unable to get your location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access.'
            break
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.'
            break
          case error.TIMEOUT:
            message = 'Location request timed out.'
            break
        }
        reject(new Error(message))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  })
}

/**
 * Calculate distance between two coordinates in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Check if user is near a specific location (within radius)
 * Default radius: 50 meters (about 164 feet)
 */
export function isNearLocation(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
  radiusMeters: number = 50
): boolean {
  const distance = calculateDistance(userLat, userLng, targetLat, targetLng)
  return distance <= radiusMeters
}

/**
 * Get address from coordinates using Mapbox reverse geocoding
 */
export async function reverseGeocode(lat: number, lng: number): Promise<{
  address: string
  city: string
  state: string
  zip_code: string
}> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=address`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to get address')
  }

  const data = await response.json()

  if (!data.features || data.features.length === 0) {
    throw new Error('No address found for this location')
  }

  const feature = data.features[0]
  const context = feature.context || []

  const place = context.find((c: any) => c.id.startsWith('place'))
  const region = context.find((c: any) => c.id.startsWith('region'))
  const postcode = context.find((c: any) => c.id.startsWith('postcode'))

  return {
    address: feature.place_name,
    city: place?.text || '',
    state: region?.short_code?.replace('US-', '') || '',
    zip_code: postcode?.text || ''
  }
}

/**
 * Watch user's location continuously
 */
export function watchLocation(
  onLocationUpdate: (coords: Coordinates) => void,
  onError: (error: Error) => void
): number {
  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported'))
    return -1
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onLocationUpdate({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      })
    },
    (error) => {
      onError(new Error('Location tracking failed'))
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    }
  )
}

/**
 * Stop watching location
 */
export function clearLocationWatch(watchId: number): void {
  if (navigator.geolocation && watchId !== -1) {
    navigator.geolocation.clearWatch(watchId)
  }
}
