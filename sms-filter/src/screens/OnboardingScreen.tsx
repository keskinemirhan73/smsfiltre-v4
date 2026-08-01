import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { ShieldCheck, MessageSquareWarning, Shield } from 'lucide-react-native';
import { ThemeContext } from '../theme';
import { getT } from '../i18n';
import SettingsContext from '../context/SettingsContext';
import { requestSmsDetectionPermission } from '../services/SmsPermissionService';
import { markOnboardingComplete } from '../app/onboardingStorage';

export default function OnboardingScreen({ navigation }: any) {
  const theme = useContext(ThemeContext);
  const { settings } = useContext(SettingsContext);
  const t = getT(settings.language || 'tr');
  const isEn = settings.language === 'en';
  const isAndroid = Platform.OS === 'android';

  const [loading, setLoading] = useState(false);

  const handleGrantPermission = async () => {
    setLoading(true);
    try {
      if (isAndroid) {
        await requestSmsDetectionPermission();
      }
      await markOnboardingComplete();
      navigation.replace('MainTabs');
    } catch (error) {
      console.warn(error);
      navigation.replace('MainTabs');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await markOnboardingComplete();
    } catch (error) {
      console.warn('Onboarding durumu kaydedilemedi:', error);
    }
    navigation.replace('MainTabs');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
            <ShieldCheck size={80} color={theme.primary} />
          </View>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          {isEn
            ? (isAndroid ? 'Enable SMS Protection' : 'Set Up Message Filtering')
            : (isAndroid ? 'SMS Korumasını Etkinleştir' : 'Mesaj Filtrelemeyi Ayarla')}
        </Text>

        <Text style={[styles.description, { color: theme.textMuted }]}>
          {isEn
            ? 'FiltreAI analyzes incoming SMS messages on-device to detect spam and fraud. Protect your inbox from unwanted messages.'
            : 'FiltreAI, gelen SMS’leri cihaz üzerinde analiz ederek spam ve dolandırıcılıkları yakalar. Gelen kutunuzu istenmeyen mesajlardan koruyun.'}
        </Text>

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: theme.surface }]}>
               <Shield size={24} color={theme.primary} />
            </View>
            <Text style={[styles.featureText, { color: theme.text }]}>
              {isEn ? 'Private by Default (No Automatic Upload)' : 'Varsayılan Olarak Gizli (Otomatik Yükleme Yok)'}
            </Text>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: theme.surface }]}>
               <MessageSquareWarning size={24} color="#F59E0B" />
            </View>
            <Text style={[styles.featureText, { color: theme.text }]}>
              {isEn ? 'Real-time Spam Detection' : 'Gerçek Zamanlı Spam Tespiti'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleGrantPermission}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {isEn
              ? (isAndroid ? 'Allow SMS Permission' : 'Continue')
              : (isAndroid ? 'İzin Ver ve Devam Et' : 'Devam Et')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.border }]}
          onPress={handleSkip}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.textMuted }]}>
            {isEn ? 'Not Now (Limited Features)' : 'Şimdi Değil (Sınırlı Özellikler)'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  featuresContainer: {
    width: '100%',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    padding: 30,
    gap: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  button: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  }
});
