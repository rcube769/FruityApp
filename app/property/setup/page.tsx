'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentLocation, reverseGeocode, calculateDistance } from '@/lib/location'
import toast from 'react-hot-toast'

interface DetectedProperty {
  address: string
  city: string
  state: string
  zip_code: string
  lat: number
  lng: number
}

export default function PropertySetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [detectedProperty, setDetectedProperty] = useState<DetectedProperty | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)

  const detectLocation = async () => {
    setDetecting(true)
    try {
      // Get current location
      const location = await getCurrentLocation()
      setUserLocation(location)

      // Get address from coordinates
      const addressData = await reverseGeocode(location.lat, location.lng)

      setDetectedProperty({
        address: addressData.address,
        city: addressData.city,
        state: addressData.state,
        zip_code: addressData.zip_code,
        lat: location.lat,
        lng: location.lng
      })

      setDistance(0) // User is at their current location
      toast.success('Location detected!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to detect location')
      console.error('Location detection error:', error)
    } finally {
      setDetecting(false)
    }
  }

  const saveProperty = async () => {
    if (!detectedProperty) return

    // Check if user is actually near this location (within 50 meters)
    if (distance !== null && distance > 50) {
      toast.error('You must be at your property to set it up. Please go to your home and try again.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: detectedProperty.address,
          lat: detectedProperty.lat,
          lng: detectedProperty.lng
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save property')
      }

      toast.success('Property saved! You can now create listings from this address.')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Continuously update user location to verify they're still near the property
  useEffect(() => {
    if (!detectedProperty || !userLocation) return

    const interval = setInterval(async () => {
      try {
        const currentLocation = await getCurrentLocation()
        const dist = calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          detectedProperty.lat,
          detectedProperty.lng
        )
        setDistance(dist)
      } catch (error) {
        // Silently fail
      }
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [detectedProperty, userLocation])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl">🍊</span>
            <h1 className="text-xl font-bold text-orange-600">Fruity</h1>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Up Your Property</h1>
          <p className="text-gray-600">
            We'll detect your home location automatically. You must be at your property to set this up.
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-3">🏠 How it works:</h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li>1. Go to your home</li>
            <li>2. Click "Detect My Location" below</li>
            <li>3. Grant location permission when prompted</li>
            <li>4. Confirm the detected address is correct</li>
            <li>5. Save your property</li>
          </ol>
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-900 font-semibold">
              🔒 Privacy: Only you can see your property. When you create fruit listings, your address will be protected with approximate location fuzzing.
            </p>
          </div>
        </div>

        {/* Detection Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          {!detectedProperty ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Ready to detect your location
              </h3>
              <p className="text-gray-600 mb-6">
                Make sure you're at your home, then click the button below.
              </p>
              <button
                onClick={detectLocation}
                disabled={detecting}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {detecting ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Detecting...
                  </span>
                ) : (
                  '📍 Detect My Location'
                )}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-start gap-4 mb-6">
                <div className="text-4xl">🏡</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Detected Property
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    <p className="font-semibold">{detectedProperty.address}</p>
                    <p className="text-sm">
                      {detectedProperty.city}, {detectedProperty.state} {detectedProperty.zip_code}
                    </p>
                  </div>
                </div>
              </div>

              {distance !== null && distance > 50 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ You're {Math.round(distance)} meters away from this location.
                    Please go to your property to verify and save it.
                  </p>
                </div>
              )}

              {distance !== null && distance <= 50 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-green-800">
                    ✓ You're at this location! You can save this as your property.
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={saveProperty}
                  disabled={loading || (distance !== null && distance > 50)}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save This Property'}
                </button>
                <button
                  onClick={() => {
                    setDetectedProperty(null)
                    setUserLocation(null)
                    setDistance(null)
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Detect Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-3">🔐 Security & Privacy</h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>✓ Only you can access and manage your property</li>
            <li>✓ Your exact address is never shown publicly on the map</li>
            <li>✓ When creating listings, addresses are fuzzy-located (±500m)</li>
            <li>✓ You can update or delete your property anytime</li>
            <li>✓ Location verification ensures no one else can claim your property</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
