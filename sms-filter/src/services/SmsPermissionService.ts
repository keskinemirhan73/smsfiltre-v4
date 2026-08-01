import {
  Alert,
  Linking,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { FilterManager } from '../modules/FilterManager';

const RECEIVE_SMS_PERMISSION = PermissionsAndroid.PERMISSIONS.RECEIVE_SMS;

export async function hasSmsDetectionPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  return PermissionsAndroid.check(RECEIVE_SMS_PERMISSION);
}

export async function requestSmsDetectionPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  if (await hasSmsDetectionPermission()) {
    return true;
  }

  const result = await PermissionsAndroid.request(RECEIVE_SMS_PERMISSION);

  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    const settings = await FilterManager.loadSettings();
    const isEn = settings.language === 'en';
    Alert.alert(
      isEn ? 'SMS Permission Disabled' : 'SMS İzni Kapalı',
      isEn ? 'To enable SMS protection, please allow SMS permissions for FiltreAI in Android Settings. All messages are analyzed on-device. Messages are not automatically sent to the server.' : 'SMS korumasını etkinleştirmek için Android ayarlarından FiltreAI uygulamasına SMS izni verin. Uygulama mesajları cihaz üzerinde analiz eder. Mesaj içerikleri otomatik olarak sunucuya gönderilmez.',
      [
        { text: isEn ? 'Cancel' : 'Vazgeç', style: 'cancel' },
        { text: isEn ? 'Open Settings' : 'Ayarları Aç', onPress: () => Linking.openSettings() },
      ],
    );
  }

  return result === PermissionsAndroid.RESULTS.GRANTED;
}
