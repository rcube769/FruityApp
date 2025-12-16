/**
 * Mock Supabase client for development without API keys
 * This allows you to test the UI without a real database
 */

interface MockUser {
  id: string
  email: string
}

interface MockListing {
  id: string
  user_id: string
  fruit_type: string
  quantity: string
  description: string | null
  city: string
  state: string
  approximate_lat: number
  approximate_lng: number
  available_start: string
  available_end: string
  status: string
  created_at: string
}

// In-memory storage
const mockStorage = {
  user: null as MockUser | null,
  listings: [] as MockListing[],
  requests: [] as any[],
  properties: [] as any[],
}

// Mock data
const sampleListings: MockListing[] = [
  {
    id: '1',
    user_id: 'mock-user',
    fruit_type: 'Oranges',
    quantity: 'A few bags',
    description: 'Sweet Valencia oranges from our backyard tree',
    city: 'San Francisco',
    state: 'CA',
    approximate_lat: 37.7749,
    approximate_lng: -122.4194,
    available_start: '2025-12-20',
    available_end: '2026-01-05',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: 'mock-user-2',
    fruit_type: 'Lemons',
    quantity: '10-20 pieces',
    description: 'Meyer lemons, great for cooking',
    city: 'Oakland',
    state: 'CA',
    approximate_lat: 37.8044,
    approximate_lng: -122.2712,
    available_start: '2025-12-15',
    available_end: '2025-12-31',
    status: 'active',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    user_id: 'mock-user-3',
    fruit_type: 'Figs',
    quantity: 'Many bags',
    description: 'Fresh figs ready to pick',
    city: 'Berkeley',
    state: 'CA',
    approximate_lat: 37.8715,
    approximate_lng: -122.2730,
    available_start: '2025-12-18',
    available_end: '2026-01-10',
    status: 'active',
    created_at: new Date().toISOString(),
  },
]

export const mockSupabase = {
  auth: {
    getUser: async () => {
      return {
        data: { user: mockStorage.user },
        error: null,
      }
    },
    getSession: async () => {
      return {
        data: { session: mockStorage.user ? { user: mockStorage.user } : null },
        error: null,
      }
    },
    signInWithOtp: async ({ email }: { email: string }) => {
      // Simulate successful OTP send
      console.log(`[MOCK] Magic link sent to: ${email}`)
      console.log(`[MOCK] In real app, check your email. In mock mode, auto-login after 2 seconds...`)

      // Auto-login after 2 seconds in mock mode
      setTimeout(() => {
        mockStorage.user = {
          id: 'mock-user-123',
          email,
        }
      }, 2000)

      return { data: {}, error: null }
    },
    signOut: async () => {
      mockStorage.user = null
      return { error: null }
    },
  },
  from: (table: string) => ({
    select: (columns: string = '*') => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          if (table === 'listings') {
            const listing = [...sampleListings, ...mockStorage.listings].find(
              (l: any) => l[column] === value
            )
            return { data: listing || null, error: null }
          }
          if (table === 'properties') {
            const property = mockStorage.properties.find((p: any) => p[column] === value)
            return { data: property || null, error: null }
          }
          return { data: null, error: null }
        },
        maybeSingle: async () => {
          if (table === 'listings') {
            const listing = [...sampleListings, ...mockStorage.listings].find(
              (l: any) => l[column] === value
            )
            return { data: listing || null, error: null }
          }
          return { data: null, error: null }
        },
      }),
      order: (column: string, options: any) => ({
        then: async (resolve: any) => {
          if (table === 'listings') {
            resolve({ data: [...sampleListings, ...mockStorage.listings], error: null })
          } else {
            resolve({ data: [], error: null })
          }
        },
      }),
      then: async (resolve: any) => {
        if (table === 'listings') {
          resolve({ data: [...sampleListings, ...mockStorage.listings], error: null })
        } else {
          resolve({ data: [], error: null })
        }
      },
    }),
    insert: (data: any) => ({
      select: () => ({
        single: async () => {
          const newItem = {
            ...data,
            id: `mock-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          if (table === 'listings') {
            mockStorage.listings.push(newItem)
          } else if (table === 'properties') {
            mockStorage.properties.push(newItem)
          }

          console.log(`[MOCK] Created ${table}:`, newItem)
          return { data: newItem, error: null }
        },
      }),
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: () => ({
          single: async () => {
            console.log(`[MOCK] Updated ${table} where ${column} = ${value}:`, data)
            return { data: { ...data, id: value }, error: null }
          },
        }),
      }),
    }),
    delete: () => ({
      eq: (column: string, value: any) => async () => {
        console.log(`[MOCK] Deleted from ${table} where ${column} = ${value}`)
        return { error: null }
      },
    }),
  }),
}

export function createMockClient() {
  return mockSupabase
}
