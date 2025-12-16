/**
 * FREE Geocoding using Nominatim (OpenStreetMap)
 * No API key required!
 */

interface GeocodeResult {
  lat: number
  lng: number
  city: string
  state: string
  zip_code: string
  formatted_address: string
}

/**
 * Geocode address using Nominatim (OpenStreetMap) - FREE!
 * Rate limit: 1 request per second
 */
export async function geocodeAddressFree(address: string): Promise<GeocodeResult> {
  const encodedAddress = encodeURIComponent(address)
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&addressdetails=1&limit=1`

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'FruityApp/1.0', // Required by Nominatim
    },
  })

  if (!response.ok) {
    throw new Error('Failed to geocode address')
  }

  const data = await response.json()

  if (!data || data.length === 0) {
    throw new Error('Address not found')
  }

  const result = data[0]
  const addressDetails = result.address || {}

  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    city:
      addressDetails.city ||
      addressDetails.town ||
      addressDetails.village ||
      addressDetails.municipality ||
      '',
    state: addressDetails.state || '',
    zip_code: addressDetails.postcode || '',
    formatted_address: result.display_name,
  }
}

/**
 * Reverse geocode (coordinates to address) - FREE!
 */
export async function reverseGeocodeFree(
  lat: number,
  lng: number
): Promise<{
  address: string
  city: string
  state: string
  zip_code: string
}> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'FruityApp/1.0',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to reverse geocode')
  }

  const data = await response.json()
  const addressDetails = data.address || {}

  return {
    address: data.display_name,
    city:
      addressDetails.city ||
      addressDetails.town ||
      addressDetails.village ||
      addressDetails.municipality ||
      '',
    state: addressDetails.state || '',
    zip_code: addressDetails.postcode || '',
  }
}

/**
 * Add random offset for privacy (approximately ±500 meters)
 */
export function fuzzyLocation(lat: number, lng: number): { lat: number; lng: number } {
  const offsetLat = (Math.random() - 0.5) * 0.01
  const offsetLng = (Math.random() - 0.5) * 0.01

  return {
    lat: Number((lat + offsetLat).toFixed(8)),
    lng: Number((lng + offsetLng).toFixed(8)),
  }
}

/**
 * Calculate distance between two coordinates in miles
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}
