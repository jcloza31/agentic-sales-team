export interface NotificationPrefs {
  newBrands: boolean;
  pitchesReady: boolean;
  callsBooked: boolean;
}

export const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  newBrands: true,
  pitchesReady: true,
  callsBooked: true,
};
