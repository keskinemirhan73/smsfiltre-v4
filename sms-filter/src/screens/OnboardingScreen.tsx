import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Linking } from 'react-native';
import { Settings as SettingsIcon, MessageSquare, Scan, Shield, Bell, CheckCircle2, Phone } from 'lucide-react-native';
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

  const handleOpenSettings = async () => {
    if (Platform.OS === 'ios') {
      try {
        await Linking.openURL('App-Prefs:MESSAGES');
      } catch {
        try {
          await Linking.openURL('app-settings:');
        } catch {
          Linking.openSettings();
        }
      }
    } else {
      Linking.openSettings();
    }
  };

  const handleNext = async () => {
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Screen Header */}
        <Text style={[styles.mainTitle, { color: theme.text }]}>
          {isEn ? 'Enable FiltreAI...' : 'FiltreAI’yi Etkinleştirin...'}
        </Text>

        {/* Step List */}
        <View style={styles.stepList}>
          {/* Step 1 */}
          <View style={styles.stepRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#475569' }]}>
              <SettingsIcon size={22} color="#FFFFFF" />
            </View>
            <Text style={[styles.stepText, { color: theme.text }]}>
              {isEn 
                ? 'Tap the button at the bottom to open your device\'s Settings app.'
                : 'Ekranın altındaki butona dokunarak cihazınızın Ayarlar uygulamasını açın.'}
            </Text>
          </View>

          {/* Step 2 */}
          <View style={styles.stepRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
              <MessageSquare size={22} color="#FFFFFF" />
            </View>
            <Text style={[styles.stepText, { color: theme.text }]}>
              {isEn
                ? 'In Settings, go to Apps -> Messages and scroll to Unknown Senders.'
                : 'Ayarlar içinde Uygulamalar -> Mesajlar’a girin ve Bilinmeyen Gönderenler başlığına inin.'}
            </Text>
          </View>

          {/* Step 3 */}
          <View style={styles.stepRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
              <Scan size={22} color="#FFFFFF" />
            </View>
            <Text style={[styles.stepText, { color: theme.text }]}>
              {isEn
                ? 'Enable "Filter Unknown Senders".'
                : 'Bilinmeyen Gönderenleri Tara’yı etkinleştirin.'}
            </Text>
          </View>

          {/* Step 4 */}
          <View style={styles.stepRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#2563EB' }]}>
              <Shield size={22} color="#FFFFFF" />
            </View>
            <Text style={[styles.stepText, { color: theme.text }]}>
              {isEn
                ? 'Under Message Filtering, enable FiltreAI.'
                : 'Mesaj Filtresi altında FiltreAI’yi etkinleştirin.'}
            </Text>
          </View>

          {/* Step 5 */}
          <View style={styles.stepRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
              <Bell size={22} color="#FFFFFF" />
            </View>
            <Text style={[styles.stepText, { color: theme.text }]}>
              {isEn
                ? 'Under Allow Notifications, turn on all notification categories.'
                : 'Bildirimlere İzin Ver altında tüm bildirim kategorilerini açın.'}
            </Text>
          </View>

          {/* Step 6 Recommendation */}
          <View style={styles.stepRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
              <CheckCircle2 size={22} color="#FFFFFF" />
            </View>
            <Text style={[styles.stepText, { color: theme.text }]}>
              <Text style={{ fontWeight: '700', fontStyle: 'italic' }}>
                {isEn ? 'Recommended: ' : 'Önerilir: '}
              </Text>
              {isEn
                ? 'Disable default "Filter Junk" as it may conflict with FiltreAI.'
                : 'İstenmeyenleri Filtrele’yi devre dışı bırakın çünkü FiltreAI ile çakışabilir.'}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Optional Reporting Section */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {isEn ? 'Optional · Enable Reporting...' : 'Opsiyonel · Raporlamayı Etkinleştirin...'}
        </Text>

        <View style={styles.stepList}>
          {/* Step 7 */}
          <View style={styles.stepRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#10B981' }]}>
              <Phone size={22} color="#FFFFFF" />
            </View>
            <Text style={[styles.stepText, { color: theme.text }]}>
              {isEn
                ? 'In Settings, go to Apps -> Phone.'
                : 'Ayarlar içinde Uygulamalar -> Telefon’a girin.'}
            </Text>
          </View>

          {/* Step 8 */}
          <View style={styles.stepRow}>
            <View style={[styles.iconContainer, { backgroundColor: '#2563EB' }]}>
              <Shield size={22} color="#FFFFFF" />
            </View>
            <Text style={[styles.stepText, { color: theme.text }]}>
              {isEn
                ? 'Scroll down and under SMS/Call Reporting enable FiltreAI.'
                : 'Aşağı inin ve SMS/Arama Raporu altında FiltreAI’yi etkinleştirin.'}
            </Text>
          </View>
        </View>

      </ScrollView>

      {/* Fixed Bottom Action Buttons */}
      <View style={[styles.footer, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: '#1D4ED8' }]}
          onPress={handleOpenSettings}
        >
          <Text style={styles.primaryButtonText}>
            {isEn ? 'Open Settings' : 'Ayarlar\'ı Aç'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { backgroundColor: '#1E3A8A' }]}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>
            {isEn ? 'Continue' : 'Sonraki / Devam Et'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 160,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  stepList: {
    gap: 22,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 28,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.3,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    gap: 12,
    borderTopWidth: 1,
  },
  primaryButton: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
