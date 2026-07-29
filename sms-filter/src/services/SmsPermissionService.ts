import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  Linking,
  PermissionsAndroid,
  Platform,
} from 'react-native';

const DISCLOSURE_KEY = '@filtreai_sms_permission_disclosure_v1';
const RECEIVE_SMS_PERMISSION = PermissionsAndroid.PERMISSIONS.RECEIVE_SMS;

function showSmsDisclosure(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'SMS Korumasını Etkinleştir',
      'FiltreAI, yeni gelen SMS’lerin gönderici ve mesaj metnini spam ve dolandırıcılık belirtileri için cihaz üzerinde analiz eder. Gelen SMS’ler otomatik olarak sunucuya gönderilmez. Yalnızca sizin başlattığınız Akıllı Analiz veya spam bildirimi sunucuya iletilir.',
      [
        {
          text: 'Şimdi Değil',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Devam Et',
          onPress: () => resolve(true),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => resolve(false),
      },
    );
  });
}

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

  const consented = await showSmsDisclosure();
  if (!consented) {
    return false;
  }

  const result = await PermissionsAndroid.request(RECEIVE_SMS_PERMISSION);

  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    Alert.alert(
      'SMS İzni Kapalı',
      'SMS korumasını etkinleştirmek için Android ayarlarından FiltreAI uygulamasına SMS izni verin.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Ayarları Aç', onPress: () => Linking.openSettings() },
      ],
    );
  }

  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export async function ensureSmsDetectionPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' || (await hasSmsDetectionPermission())) {
    return true;
  }

  const disclosureShown = await AsyncStorage.getItem(DISCLOSURE_KEY);
  if (disclosureShown) {
    return false;
  }

  await AsyncStorage.setItem(DISCLOSURE_KEY, 'shown');
  return requestSmsDetectionPermission();
}
