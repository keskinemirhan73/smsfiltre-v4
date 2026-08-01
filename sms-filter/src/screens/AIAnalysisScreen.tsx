import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Sparkles, ShieldAlert, ShieldCheck, AlertTriangle, Info } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { useAppTheme, spacing } from '../theme';
import { ThreatCloudService } from '../services/ThreatCloudService';
import { useSettings } from '../context/SettingsContext';
import { getT } from '../i18n';
import { SecurityUtils } from '../utils/SecurityUtils';
import { analyzeMessageLocally } from '../services/localMessageAnalysis';
import { createPublicJsonRequest } from '../services/publicApiRequest';

const API_URL = 'https://smsfiltre-v4.onrender.com';

export default function AIAnalysisScreen() {
  const theme = useAppTheme();
  const { settings } = useSettings();
  const t = getT(settings.language);
  const isEn = settings.language === 'en';
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  const handleAnalyze = async () => {
    if (text.trim().length < 5) {
      setError(t.minCharsError);
      return;
    }
    setError('');
    setIsLoading(true);
    setResult(null);
    setReportSuccess(false);

    try {
      const cloudDb = await ThreatCloudService.getDatabase();
      setResult(analyzeMessageLocally(text, cloudDb, settings.language));
    } catch {
      setError(isEn ? 'The message could not be analyzed on this device.' : 'Mesaj bu cihazda analiz edilemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportSpam = async () => {
    setIsReporting(true);
    try {
      const safeText = SecurityUtils.maskPII(text);
      const resp = await fetch(`${API_URL}/api/report`, {
        method: 'POST',
        ...createPublicJsonRequest({
          keyword: safeText,
          type: 'word',
        }),
      });
      if (resp.ok) {
        setReportSuccess(true);
      } else {
        setError(isEn ? 'The report could not be sent.' : 'Rapor gönderilemedi.');
      }
    } catch (e) {
      console.warn("Report failed", e);
      setError(isEn ? 'The report could not be sent.' : 'Rapor gönderilemedi.');
    } finally {
      setIsReporting(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'Düşük': return theme.secondary;
      case 'Low': return theme.secondary;
      case 'Orta': return '#F59E0B'; // warning color
      case 'Medium': return '#F59E0B';
      case 'Yüksek': return theme.danger;
      case 'High': return theme.danger;
      case 'Çok Yüksek': return '#991b1b'; // Darker red
      default: return theme.textMuted;
    }
  };

  const getRiskIcon = (level: string) => {
    switch(level) {
      case 'Düşük': return <ShieldCheck color={theme.secondary} size={32} />;
      case 'Low': return <ShieldCheck color={theme.secondary} size={32} />;
      case 'Orta': return <AlertTriangle color="#F59E0B" size={32} />;
      case 'Medium': return <AlertTriangle color="#F59E0B" size={32} />;
      case 'Yüksek':
      case 'High':
      case 'Çok Yüksek': return <ShieldAlert color={theme.danger} size={32} />;
      default: return <Info color={theme.textMuted} size={32} />;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <View style={[styles.iconWrapper, { backgroundColor: theme.primary + '20' }]}>
          <Sparkles color={theme.primary} size={28} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{t.aiAnalysisTitle}</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          {t.aiAnalysisDesc}
        </Text>
      </View>

      <View style={styles.content}>
        <TextInput
          style={[styles.input, {
            backgroundColor: theme.surface,
            color: theme.text,
            borderColor: theme.border,
            borderWidth: 1
          }]}
          placeholder={t.messageContentPlaceholder}
          placeholderTextColor={theme.textMuted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={text}
          onChangeText={nextText => {
            setText(nextText);
            setResult(null);
            setReportSuccess(false);
            setError('');
          }}
        />

        {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleAnalyze}
          disabled={isLoading}
        >
          {isLoading ? (
            <Text style={styles.buttonText}>Analiz Ediliyor...</Text>
          ) : (
            <>
              <Sparkles color="#fff" size={20} />
              <Text style={styles.buttonText}>{t.analyzeMessageBtn}</Text>
            </>
          )}
        </TouchableOpacity>

        {isLoading && (
          <View style={{ alignItems: 'center', marginTop: spacing.xl }}>
            <LottieView
              source={require('../../assets/scanner.json')}
              autoPlay
              loop
              style={{ width: 150, height: 150 }}
            />
            <Text style={{ color: theme.text, fontWeight: 'bold', marginTop: spacing.sm }}>
              {isEn ? 'Analyzing on this device...' : 'Bu cihazda analiz ediliyor...'}
            </Text>
          </View>
        )}

        {result && (
          <View style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: getRiskColor(result.riskLevel) }]}>
            <View style={styles.resultHeader}>
              {getRiskIcon(result.riskLevel)}
              <View style={styles.riskBadgeContainer}>
                <Text style={[styles.riskLabel, { color: theme.text }]}>{t.riskLevel}</Text>
                <Text style={[styles.riskValue, { color: getRiskColor(result.riskLevel) }]}>
                  {result.riskLevel}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.resultSection}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t.detectedThreat}</Text>
              <Text style={[styles.sectionContent, { color: theme.text }]}>{result.threatType}</Text>
            </View>

            <View style={styles.resultSection}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{t.filtreAiRecommendation}</Text>
              <Text style={[styles.sectionContent, { color: theme.text }]}>{result.recommendation}</Text>
            </View>

            {(['Düşük', 'Orta', 'Low', 'Medium'].includes(result.riskLevel)) && !reportSuccess && (
              <View style={{ marginTop: spacing.xl, alignItems: 'center' }}>
                <Text style={{ color: theme.textMuted, fontSize: 13, marginBottom: spacing.sm, textAlign: 'center' }}>
                  {isEn ? "Think the analysis missed something?" : "Analizin bir şeyi gözden kaçırdığını mı düşünüyorsunuz?"}
                </Text>
                <TouchableOpacity
                  style={[styles.reportBtn, { borderColor: theme.danger }]}
                  onPress={handleReportSpam}
                  disabled={isReporting}
                >
                  {isReporting ? <ActivityIndicator size="small" color={theme.danger} /> : (
                    <>
                      <ShieldAlert color={theme.danger} size={16} />
                      <Text style={[styles.reportBtnText, { color: theme.danger }]}>
                        {isEn ? "Report as Spam to Community" : "Topluluğa Spam Olarak Bildir"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {reportSuccess && (
              <View style={{ marginTop: spacing.xl, alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.1)', padding: spacing.sm, borderRadius: 8 }}>
                <Text style={{ color: theme.secondary, fontWeight: 'bold' }}>
                  {isEn ? "Reported successfully! Thank you." : "Başarıyla bildirildi! Teşekkürler."}
                </Text>
              </View>
            )}

          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  iconWrapper: {
    padding: spacing.md,
    borderRadius: 20,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  content: {
    padding: spacing.lg,
  },
  input: {
    borderRadius: 16,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 150,
    marginBottom: spacing.lg,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    borderRadius: 16,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  error: {
    fontSize: 12,
    marginBottom: spacing.md,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  resultCard: {
    marginTop: spacing.xl,
    borderRadius: 20,
    padding: spacing.lg,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  riskBadgeContainer: {
    flex: 1,
  },
  riskLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  riskValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: spacing.md,
  },
  resultSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionContent: {
    fontSize: 16,
  },
  cachedBadge: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    width: '100%',
  },
  reportBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  }
});
