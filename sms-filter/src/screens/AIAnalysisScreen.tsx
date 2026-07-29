import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Sparkles, ShieldAlert, ShieldCheck, AlertTriangle, Info } from 'lucide-react-native';
import { useAppTheme, spacing } from '../theme';
import axios from 'axios';
import { ThreatCloudService } from '../services/ThreatCloudService';
const API_URL = 'https://smsfiltre-v4.onrender.com';

export default function AIAnalysisScreen() {
  const theme = useAppTheme();
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (text.trim().length < 5) {
      setError('Lütfen en az 5 karakterlik bir metin girin.');
      return;
    }
    setError('');
    setIsLoading(true);
    setResult(null);

    try {
      const response = await axios.post(`${API_URL}/api/analyze`, { text });
      let finalResult = response.data;

      // Sunucu analizine ek olarak cihazdaki güncel tehdit veritabanını uygula.
      const cloudDb = await ThreatCloudService.getDatabase();
      const lowerText = text.toLowerCase();
      const isThreat = [...cloudDb.spamKeywords, ...cloudDb.scamUrls].some(keyword =>
        lowerText.includes(keyword.toLowerCase())
      );

      if (isThreat && (finalResult.riskLevel === 'Düşük' || finalResult.riskLevel === 'Orta')) {
        finalResult = {
          ...finalResult,
          riskLevel: 'Yüksek',
          threatType: 'Zararlı İçerik (Yerel Veritabanı)',
          recommendation: 'Mesaj, yerel tehdit veritabanındaki bahis, spam veya dolandırıcılık işaretlerinden birini içeriyor. Mesaja itibar etmeyin.',
        };
      }

      setResult(finalResult);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Analiz sırasında sunucuya ulaşılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'Düşük': return theme.secondary;
      case 'Orta': return '#F59E0B'; // warning color
      case 'Yüksek': return theme.danger;
      case 'Çok Yüksek': return '#991b1b'; // Darker red
      default: return theme.textMuted;
    }
  };

  const getRiskIcon = (level: string) => {
    switch(level) {
      case 'Düşük': return <ShieldCheck color={theme.secondary} size={32} />;
      case 'Orta': return <AlertTriangle color="#F59E0B" size={32} />;
      case 'Yüksek':
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
        <Text style={[styles.title, { color: theme.text }]}>Akıllı Mesaj Analizi</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Şüphelendiğin mesajı buraya yapıştır; bağlantı, aciliyet, kimlik avı ve spam işaretleri saniyeler içinde incelensin.
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
          placeholder="Şüpheli mesaj metnini buraya yapıştırın..."
          placeholderTextColor={theme.textMuted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={text}
          onChangeText={setText}
        />

        {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleAnalyze}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Sparkles color="#fff" size={20} />
              <Text style={styles.buttonText}>Mesajı Analiz Et</Text>
            </>
          )}
        </TouchableOpacity>

        {result && (
          <View style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: getRiskColor(result.riskLevel) }]}>
            <View style={styles.resultHeader}>
              {getRiskIcon(result.riskLevel)}
              <View style={styles.riskBadgeContainer}>
                <Text style={[styles.riskLabel, { color: theme.text }]}>Risk Seviyesi</Text>
                <Text style={[styles.riskValue, { color: getRiskColor(result.riskLevel) }]}>
                  {result.riskLevel}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.resultSection}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Tespit Edilen Tehdit</Text>
              <Text style={[styles.sectionContent, { color: theme.text }]}>{result.threatType}</Text>
            </View>

            <View style={styles.resultSection}>
              <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>FiltreAI Tavsiyesi</Text>
              <Text style={[styles.sectionContent, { color: theme.text }]}>{result.recommendation}</Text>
            </View>

            {result.cached && (
              <Text style={[styles.cachedBadge, { color: theme.primary }]}>
                ⚡ Bu mesaj daha önce analiz edildi (Önbellekten hızlı yanıt)
              </Text>
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
  }
});
