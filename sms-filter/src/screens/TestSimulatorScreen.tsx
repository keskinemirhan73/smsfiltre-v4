import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { ShieldCheck, ShieldAlert, Send, Receipt, Megaphone, BrainCircuit } from 'lucide-react-native';
import { useAppTheme, spacing, radii } from '../theme';
import { FilterManager, NaiveBayesClassifier } from '../modules/FilterManager';

export default function TestSimulatorScreen() {
  const theme = useAppTheme();
  const [sender, setSender] = useState('');
  const [body, setBody] = useState('');
  const [result, setResult] = useState<'none' | 'junk' | 'transaction' | 'promotion' | 'allowed'>('none');

  const handleTest = async () => {
    if (!body.trim()) return;
    const classification = await FilterManager.classifyMessage(sender || 'Bilinmeyen', body);
    setResult(classification);
    
    // Testleri geçmişe ekle ki kullanıcı Ana Ekranda görebilsin
    await FilterManager.addHistory({
      sender: sender || 'Bilinmeyen',
      preview: body,
      status: classification,
      category: classification === 'junk' ? 'Spam' : classification === 'transaction' ? 'İşlem' : classification === 'promotion' ? 'Promosyon' : 'Güvenli'
    });
  };

  const handleTrain = async (isSpam: boolean) => {
    if (!body.trim()) return;
    await NaiveBayesClassifier.train(body, isSpam);
    Alert.alert(
      "Öğrenme Başarılı",
      isSpam ? "Bu mesajın içerdiği kelimeler spam veritabanına eklendi." : "Bu mesajın içerdiği kelimeler güvenli listesine eklendi."
    );
  };

  const getResultConfig = () => {
    switch (result) {
      case 'junk': return {
        icon: ShieldAlert, color: theme.danger, title: 'SMS Engellendi (Spam)',
        desc: 'Bu mesaj FiltreAI kurallarına göre Spam olarak işaretlenirdi. Mesajlar uygulamasında İstenmeyen (Junk) klasörüne gönderilirdi.',
        bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)',
      };
      case 'transaction': return {
        icon: Receipt, color: theme.primary, title: 'İşlem Mesajı',
        desc: 'Bu mesaj bir işlem (OTP, onay kodu, banka bildirimi) olarak tanınırdı. Mesajlar uygulamasında İşlemler klasöründe görünürdü.',
        bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)',
      };
      case 'promotion': return {
        icon: Megaphone, color: '#F59E0B', title: 'Promosyon Mesajı',
        desc: 'Bu mesaj bir reklam/tanıtım olarak sınıflandırılırdı. Mesajlar uygulamasında Tanıtım klasöründe gösterilirdi.',
        bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)',
      };
      case 'allowed': return {
        icon: ShieldCheck, color: theme.secondary, title: 'SMS İzin Verildi',
        desc: 'Bu mesaj güvenli olarak değerlendirildi. Normal mesaj kutunuzda görünürdü.',
        bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)',
      };
      default: return null;
    }
  };

  const resultConfig = getResultConfig();

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Filtre Simülatörü</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Bir SMS geldiğinde filtrenin nasıl davranacağını test edin veya sistemi eğitin.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.textMuted }]}>GÖNDERİCİ</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            placeholder="Örn: B305, +90 555 000 00 00"
            placeholderTextColor={theme.textMuted}
            value={sender}
            onChangeText={setSender}
          />

          <Text style={[styles.label, { color: theme.textMuted }]}>MESAJ İÇERİĞİ</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            placeholder="Test etmek veya öğretmek istediğiniz SMS metnini buraya yapıştırın..."
            placeholderTextColor={theme.textMuted}
            multiline
            numberOfLines={4}
            value={body}
            onChangeText={(text) => { setBody(text); setResult('none'); }}
          />

          <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleTest}>
            <Send color="#fff" size={20} style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Filtre Sonucunu Test Et</Text>
          </TouchableOpacity>
        </View>

        {resultConfig && (
          <View style={[styles.resultCard, { backgroundColor: resultConfig.bg, borderColor: resultConfig.border }]}>
            <View style={styles.resultIcon}>
              <resultConfig.icon color={resultConfig.color} size={32} />
            </View>
            <View style={styles.resultContent}>
              <Text style={[styles.resultTitle, { color: resultConfig.color }]}>{resultConfig.title}</Text>
              <Text style={[styles.resultDesc, { color: theme.textMuted }]}>{resultConfig.desc}</Text>
            </View>
          </View>
        )}

        {/* Learning Section */}
        {body.trim().length > 0 && (
          <View style={[styles.learningSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.learningHeader}>
              <BrainCircuit color={theme.primary} size={20} />
              <Text style={[styles.learningTitle, { color: theme.text }]}>Kişisel Yapay Zeka (Lokal)</Text>
            </View>
            <Text style={[styles.learningDesc, { color: theme.textMuted }]}>
              Bu özellik sadece *sizin cihazınızdaki* algoritmayı eğitir. Diğer kullanıcıları veya genel veritabanını etkilemez. Yanlış filtreleme yaparsa buradan doğruyu öğretebilirsiniz.
            </Text>
            <View style={styles.learningButtons}>
              <TouchableOpacity 
                style={[styles.trainBtn, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: theme.danger }]}
                onPress={() => handleTrain(true)}
              >
                <Text style={[styles.trainBtnText, { color: theme.danger }]}>🛑 Spam Olarak Öğret</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.trainBtn, { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: theme.secondary }]}
                onPress={() => handleTrain(false)}
              >
                <Text style={[styles.trainBtnText, { color: theme.secondary }]}>✅ Güvenli Olarak Öğret</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick test buttons */}
        <Text style={[styles.quickLabel, { color: theme.textMuted }]}>HIZLI TEST</Text>
        <View style={styles.quickRow}>
          {[
            { label: '🎰 Bahis Spam', sender: 'B305', body: 'Tebrikler! 50.000 TL bahis bonusu kazandınız. Hemen tıklayın!' },
            { label: '🏦 Banka OTP', sender: 'Garanti', body: 'Onay kodunuz: 482910. Bu kodu kimseyle paylaşmayın.' },
            { label: '🛍️ Promosyon', sender: 'Mağaza', body: 'Büyük yaz indirimi! %70 kampanya fırsatını kaçırmayın.' },
            { label: '✅ Normal SMS', sender: '+90 532 000 00 00', body: 'Merhaba, yarınki toplantı saat 14:00 da.' },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.quickBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => { setSender(item.sender); setBody(item.body); setResult('none'); }}
            >
              <Text style={[styles.quickBtnText, { color: theme.text }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: 100 },
  header: { marginBottom: spacing.lg },
  title: { fontSize: 28, fontWeight: '800', marginBottom: spacing.xs },
  subtitle: { fontSize: 14 },
  form: { gap: spacing.sm, marginBottom: spacing.lg },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: spacing.sm },
  input: { borderWidth: 1, borderRadius: radii.md, padding: spacing.md, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: spacing.md, borderRadius: radii.md, marginTop: spacing.sm,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resultCard: {
    flexDirection: 'row', padding: spacing.lg, borderRadius: radii.md,
    borderWidth: 1, alignItems: 'center', marginBottom: spacing.lg,
  },
  resultIcon: { marginRight: spacing.md },
  resultContent: { flex: 1 },
  resultTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  resultDesc: { fontSize: 13, lineHeight: 19 },
  
  learningSection: {
    borderRadius: radii.md, borderWidth: 1, padding: spacing.md, marginBottom: spacing.xl,
  },
  learningHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  learningTitle: { fontSize: 16, fontWeight: '700' },
  learningDesc: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  learningButtons: { flexDirection: 'row', gap: spacing.sm },
  trainBtn: { flex: 1, padding: 12, borderRadius: radii.md, borderWidth: 1, alignItems: 'center' },
  trainBtnText: { fontSize: 12, fontWeight: '700' },

  quickLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: spacing.sm },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: radii.md, borderWidth: 1,
  },
  quickBtnText: { fontSize: 13, fontWeight: '600' },
});
