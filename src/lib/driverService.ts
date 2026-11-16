
import { supabase } from './supabase'
import type {
  DriverProfile,
  DriverSearchResult,
  VehicleType,
} from '../types/driver'

interface NearbyDriverRow {
  driver_id: string
  full_name: string
  phone: string
  phone_verified?: boolean
  vehicle_type: VehicleType
  vehicle_model: string
  vehicle_number: string
  profile_photo_url: string | null
  distance_meters: number
  last_location_update: string | null
}

export interface DriverProfileUpdate {
  fullName: string
  vehicleType: VehicleType
  vehicleModel: string
  vehicleNumber: string
}

const LOCATION_STALE_AFTER_MS = 2 * 60 * 1000

const getAuthenticatedDriverId = async (): Promise<string> => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error

  if (!user) {
    throw new Error('Driver is not authenticated. Please sign in again.')
  }

  return user.id
}

/*
=========================================
MAP DRIVER PROFILE
=========================================
*/

const mapDriverProfile = (data: any): DriverProfile => ({
  id: data.id,
  fullName: data.full_name,
  phone: data.phone,
  phoneVerified: data.phone_verified,
  vehicleType: data.vehicle_type,
  vehicleModel: data.vehicle_model,
  vehicleNumber: data.vehicle_number,
  profilePhotoUrl: data.profile_photo_url,
  verificationStatus: data.phone_verified
    ? 'phone_verified'
    : 'unverified',
  createdAt: data.created_at,
  updatedAt: data.updated_at,
})

/*
=========================================
GET AUTHENTICATED DRIVER PROFILE
=========================================
*/

export const getDriverProfile = async (): Promise<DriverProfile> => {
  const userId = await getAuthenticatedDriverId()

  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error

  return mapDriverProfile(data)
}

/*
=========================================
UPDATE DRIVER PROFILE
=========================================
Updates only the authenticated driver's
editable personal and vehicle details.
=========================================
*/

export const updateDriverProfile = async (
  profile: DriverProfileUpdate,
): Promise<DriverProfile> => {
  const userId = await getAuthenticatedDriverId()

  const fullName = profile.fullName.trim()
  const vehicleModel = profile.vehicleModel.trim()
  const vehicleNumber = profile.vehicleNumber.trim().toUpperCase()

  if (fullName.length < 2 || fullName.length > 80) {
    throw new Error('Please enter a valid full name.')
  }

  if (vehicleModel.length < 2 || vehicleModel.length > 60) {
    throw new Error('Please enter a valid vehicle model.')
  }

  if (!/^[A-Z0-9 -]{6,15}$/.test(vehicleNumber)) {
    throw new Error('Please enter a valid vehicle registration number.')
  }

  if (!['auto', 'taxi', 'bike'].includes(profile.vehicleType)) {
    throw new Error('Please select a valid vehicle category.')
  }

  const { data, error } = await supabase
    .from('drivers')
    .update({
      full_name: fullName,
      vehicle_type: profile.vehicleType,
      vehicle_model: vehicleModel,
      vehicle_number: vehicleNumber,
    })
    .eq('id', userId)
    .select('*')
    .single()

  if (error) throw error

  return mapDriverProfile(data)
}

/*
=========================================
GET DRIVER AVAILABILITY
=========================================
*/

export const getDriverAvailability = async (): Promise<boolean> => {
  const userId = await getAuthenticatedDriverId()

  const { data, error } = await supabase
    .from('drivers')
    .select('is_available')
    .eq('id', userId)
    .single()

  if (error) throw error

  return Boolean(data.is_available)
}

/*
=========================================
GET LAST LOCATION UPDATE
=========================================
*/

export const getDriverLastLocationUpdate = async (): Promise<string | null> => {
  const userId = await getAuthenticatedDriverId()

  const { data, error } = await supabase
    .from('driver_locations')
    .select('updated_at')
    .eq('driver_id', userId)
    .maybeSingle()

  if (error) throw error

  return data?.updated_at ?? null
}

/*
=========================================
SET DRIVER AVAILABILITY
=========================================
No phone verification requirement.
=========================================
*/

export const setDriverAvailability = async (
  isAvailable: boolean,
): Promise<void> => {
  await getAuthenticatedDriverId()

  const { error } = await supabase.rpc('set_driver_availability', {
    p_is_available: isAvailable,
  })

  if (error) throw error
}

/*
=========================================
UPDATE DRIVER LOCATION
=========================================
*/

export const updateDriverLocation = async (
  latitude: number,
  longitude: number,
  accuracy?: number,
): Promise<string> => {
  await getAuthenticatedDriverId()

  const { data, error } = await supabase.rpc('update_driver_location', {
    p_latitude: latitude,
    p_longitude: longitude,
    p_accuracy_meters: accuracy ?? null,
  })

  if (error) throw error

  return typeof data === 'string' && !Number.isNaN(Date.parse(data))
    ? data
    : new Date().toISOString()
}

/*
=========================================
SEARCH NEARBY DRIVERS
=========================================
*/

export const searchNearbyDrivers = async (
  latitude: number,
  longitude: number,
  vehicleType: VehicleType,
  radiusMeters = 5000,
): Promise<DriverSearchResult[]> => {
  const { data, error } = await supabase.rpc('search_nearby_drivers', {
    p_latitude: latitude,
    p_longitude: longitude,
    p_vehicle_type: vehicleType,
    p_radius_meters: radiusMeters,
  })

  if (error) throw error

  return ((data ?? []) as NearbyDriverRow[])
    .filter(
      (row) =>
        typeof row.driver_id === 'string' &&
        typeof row.full_name === 'string' &&
        typeof row.vehicle_model === 'string' &&
        typeof row.vehicle_number === 'string' &&
        Number.isFinite(Number(row.distance_meters)),
    )
    .map((row) => {
      const lastUpdate = row.last_location_update
      const timestamp = lastUpdate
        ? new Date(lastUpdate).getTime()
        : Number.NaN

      const locationFreshness =
        !Number.isFinite(timestamp)
          ? 'unavailable'
          : Date.now() - timestamp > LOCATION_STALE_AFTER_MS
            ? 'stale'
            : 'fresh'

      return {
        id: row.driver_id,
        fullName: row.full_name,
        vehicleType: row.vehicle_type,
        vehicleModel: row.vehicle_model,
        vehicleNumber: row.vehicle_number,
        profilePhotoUrl: row.profile_photo_url,
        distanceKm: Number(row.distance_meters) / 1000,
        lastLocationUpdate: lastUpdate,
        locationFreshness,
        phoneVerified: row.phone_verified === true,
        isAvailable: true,
      }
    })
}

/*
=========================================
DRIVER LOGOUT
=========================================
*/

export const signOutDriver = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut()

  if (error) throw error
}
