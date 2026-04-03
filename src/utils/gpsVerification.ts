import { TUITION_LOCATION } from '../config/tuitionLocation';

/** Result returned after GPS verification */
export interface GPSVerificationResult {
  isAtTuition: boolean;
  distanceMeters: number;
  accuracy: number;
  lat: number;
  lng: number;
}

/**
 * Calculates the distance in meters between two GPS coordinates
 * using the Haversine formula.
 */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Requests the user's GPS location from the browser and checks
 * whether they are within the allowed tuition radius.
 *
 * @throws Error if the user denies location permission
 */
export function verifyTuitionLocation(): Promise<GPSVerificationResult> {
  return new Promise((resolve, reject) => {
    const isLocalDev = window.location.hostname === 'localhost' || /^10\.|^192\.168\.|^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(window.location.hostname);
    
    const mockSuccess = () => resolve({
      isAtTuition: true,
      distanceMeters: 0,
      accuracy: 10,
      lat: TUITION_LOCATION.lat,
      lng: TUITION_LOCATION.lng,
    });

    if (!navigator.geolocation) {
      if (isLocalDev) return mockSuccess();
      reject(new Error('GPS_NOT_SUPPORTED'));
      return;
    }

    let isResolved = false;

    // Fallback timeout: getCurrentPosition can sometimes hang indefinitely on mobile browsers
    const fallbackTimeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        reject(new Error('GPS_TIMEOUT'));
      }
    }, 12000); // 12 seconds manual timeout

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(fallbackTimeoutId);

        const { latitude, longitude, accuracy } = position.coords;

        const distance = haversineDistance(
          latitude,
          longitude,
          TUITION_LOCATION.lat,
          TUITION_LOCATION.lng
        );

        resolve({
          isAtTuition: distance <= TUITION_LOCATION.radiusMeters,
          distanceMeters: Math.round(distance),
          accuracy: Math.round(accuracy),
          lat: latitude,
          lng: longitude,
        });
      },
      (error) => {
        if (isResolved) return;
        isResolved = true;
        clearTimeout(fallbackTimeoutId);

        if (isLocalDev) {
          console.log('[Dev Mode] Bypassing GPS error:', error.message);
          return mockSuccess();
        }

        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error('GPS_DENIED'));
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          reject(new Error('GPS_UNAVAILABLE'));
        } else {
          reject(new Error('GPS_TIMEOUT'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}
