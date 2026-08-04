import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

async function configureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

export async function requestNotificationPermissionAsync(): Promise<boolean> {
  await configureAndroidNotificationChannel();

  if (!Device.isDevice) return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function registerForPushNotificationsAsync() {
  let token;

  if (Device.isDevice) {
    if (!(await requestNotificationPermissionAsync())) {
      return undefined;
    }
    
    // Project ID is required by Expo if using EAS
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
    } catch (e) {
      console.warn('Push token alınamadı.');
    }
  }

  return token;
}

export async function getExistingExpoPushTokenAsync(): Promise<string | undefined> {
  if (!Device.isDevice) return undefined;

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return undefined;

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) return undefined;

  try {
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    return undefined;
  }
}

export async function syncPushTokenWithBackend(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch('https://filtreai.vercel.app/api/push/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
        deviceName: Device.deviceName || Device.modelName || 'Device',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function scheduleWeeklySafetyNotification(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const hasSafetyReminder = scheduled.some(
      n => n.content.data?.type === 'safety_reminder',
    );
    if (!hasSafetyReminder) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'FiltreAI Korumanız Aktif 🛡️',
          body: 'SMS filtre veritabanınız ve cihaz içi kurallarınız güncel. Güvendesiniz!',
          data: { type: 'safety_reminder' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 7 * 24 * 60 * 60,
          repeats: true,
        },
      });
    }
  } catch (err) {
    console.warn('Haftalık bildirim planlanamadı:', err);
  }
}
