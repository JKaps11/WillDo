/**
 * Safe lazy accessor for expo-notifications.
 * In Expo Go (SDK 53+), remote push notification support was removed,
 * causing a fatal error on require(). By deferring the require to first
 * use (inside an async function), we avoid crashing at module load time.
 */
import type * as NotificationsType from 'expo-notifications';

let _cached: typeof NotificationsType | null | undefined;

export function getNotifications(): typeof NotificationsType | null {
  if (_cached !== undefined) return _cached;

  try {
    _cached = require('expo-notifications') as typeof NotificationsType;
  } catch {
    _cached = null;
  }

  return _cached;
}
