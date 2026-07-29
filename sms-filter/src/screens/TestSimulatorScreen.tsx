import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Animated } from 'react-native';
import { ShieldCheck, ShieldAlert, Send, Receipt, Megaphone, BrainCircuit, Activity, RefreshCw } from 'lucide-react-native';
import { useAppTheme, spacing, radii } from '../theme';
import { FilterManager, NaiveBayesClassifier } from '../modules/FilterManager';

export default function TestSimulatorScreen() {
  const theme = useAppTheme();
  const [sender, setSender] = useState('');
  const [body, setBody] = useState('');
  const [result, setResult] = useState<'none' | 'junk' | 'transaction' | 'promotion' | 'allowed'>('none');
  const [isTesting, setIsTesting] = useState(false);
  
  // Animation for the result card
  const slideAnim = useRef(new Animated.Value(50)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (result !== 'none') {
      slideAnim.setValue(50);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true })
      ]).start();
    }
  }, [result, slideAnim, fadeAnim]);

  const handleTest = async () => {
    if (!body.trim()) return;
    setIsTesting(true);
    setResult('none');
    
    // Simulate network delay for UX
    setTimeout(async () => {
      const classification = await FilterManager.classifyMessage(sender || 'Bilinmeyen', body);
      setResult(classification);
      setIsTesting(false);
      
      // Testleri geçmişe ekle ki kullanıcı Ana Ekranda görebilsin
      await FilterManager.addHistory({
        sender: sender || 'Bilinmeyen',
        preview: body,
        status: classification === 'junk' ? 'blocked' : classification as any,
        category: classification === 'junk' ? 'Spam' : classification === 'transaction' ? 'İşlem' : classification === 'promotion' ? 'Promosyon' : 'Güvenli'
      });
    }, 600);
  };

  const handleTrain = async (isSpam: boolean) => {
    if (!body.trim()) return;
    await NaiveBayesClassifier.train(body, isSpam);
    Alert.alert(
      "Öğrenme Başarılı",
      isSpam ? "Mesaj içeriği akıllı filtre tarafından 'Tehlikeli' olarak işaretlendi." : "Mesaj içeriği akıllı filtre tarafından 'Güvenli' olarak işaretlendi.",
      [{ text: 'Tamam', onPress: () => { setBody(''); setSender(''); setResult('none'); } }]
    );
  };

  const getResultConfig = () => {
    switch (result) {
      case 'junk': return {
        icon: ShieldAlert, color: theme.danger, title: 'Engellendi (Spam)',
        desc: 'Bu mesaj FiltreAI kurallarına göre İstenmeyen (Junk) klasörüne yönlendirilirdi.',
        bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)',
      };
      case 'transaction': return {
        icon: Receipt, color: theme.primary, title: 'İşlem Mesajı',
        desc: 'Bu mesaj banka/onay kodu olarak tanındı. İşlemler klasöründe görünürdü.',
        bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)',
      };
      case 'promotion': return {
        icon: Megaphone, color: '#F59E0B', title: 'Promosyon Mesajı',
        desc: 'Bu mesaj reklam olarak sınıflandırıldı. Tanıtımlar klasöründe gösterilirdi.',
        bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)',
      };
      case 'allowed': return {
        icon: ShieldCheck, color: theme.secondary, title: 'İzin Verildi (Temiz)',
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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Filtre Simülatörü</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Sistemin mesajları nasıl algıladığını test edin veya yerel filtrenizi geliştirin.
          </Text>
        </View>

        {/* Premium Note-like Input Area */}
        <View style={[styles.formContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.inputRow}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>KİMDEN:</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Örn: B305, +905..."
              placeholderTextColor={theme.textMuted}
              value={sender}
              onChangeText={setSender}
            />
          </View>
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
          <View style={[styles.inputRow, { alignItems: 'flex-start' }]}>
            <Text style={[styles.fieldLabel, { color: theme.textMuted, marginTop: 12 }]}>MESAJ:</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: theme.text }]}
              placeholder="Test etmek istediğiniz içeriği yazın veya yapıştırın..."
              placeholderTextColor={theme.textMuted}
              multiline
              value={body}
              onChangeText={(text) => { setBody(text); if(result !== 'none') setResult('none'); }}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.testBtn, { backgroundColor: theme.primary, opacity: body.trim() ? 1 : 0.5 }]} 
          onPress={handleTest}
          disabled={!body.trim() || isTesting}
          activeOpacity={0.8}
        >
          {isTesting ? (
            <RefreshCw color="#fff" size={24} style={styles.spinIcon} />
          ) : (
            <Activity color="#fff" size={24} />
          )}
          <Text style={styles.testBtnText}>{isTesting ? 'Analiz Ediliyor...' : 'Akıllı Analizi Başlat'}</Text>
        </TouchableOpacity>

        {/* Animated Result Card */}
        {resultConfig && (
          <Animated.View style={[
            styles.resultCard, 
            { backgroundColor: resultConfig.bg, borderColor: resultConfig.border,
              opacity: fadeAnim, transform: [{ translateY: slideAnim }]
            }
          ]}>
            <View style={[styles.resultIconWrapper, { backgroundColor: resultConfig.color }]}>
              <resultConfig.icon color="#fff" size={32} />
            </View>
            <View style={styles.resultContent}>
              <Text style={[styles.resultTitle, { color: resultConfig.color }]}>{resultConfig.title}</Text>
              <Text style={[styles.resultDesc, { color: theme.text }]}>{resultConfig.desc}</Text>
            </View>
          </Animated.View>
        )}

        {/* Learning Section */}
        {body.trim().length > 0 && result !== 'none' && (
          <Animated.View style={[styles.learningSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.learningHeader}>
              <BrainCircuit color={theme.text} size={20} />
              <Text style={[styles.learningTitle, { color: theme.text }]}>Modeli Eğit (Opsiyonel)</Text>
            </View>
            <Text style={[styles.learningDesc, { color: theme.textMuted }]}>
              Filtre yanlış mı sınıflandırdı? Bu mesajın nasıl algılanması gerektiğini cihaza öğreterek kendi kişisel korumanızı güçlendirin.
            </Text>
            
            <View style={styles.learningButtons}>
              <TouchableOpacity 
                style={[styles.trainBtn, { backgroundColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }]}
                onPress={() => handleTrain(false)}
              >
                <ShieldCheck size={20} color={theme.secondary} style={{ marginBottom: 4 }} />
                <Text style={[styles.trainBtnText, { color: theme.secondary }]}>Güvenli Olarak İşaretle</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.trainBtn, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }]}
                onPress={() => handleTrain(true)}
              >
                <ShieldAlert size={20} color={theme.danger} style={{ marginBottom: 4 }} />
                <Text style={[styles.trainBtnText, { color: theme.danger }]}>Tehlikeli Olarak İşaretle</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Quick Tests */}
        <Text style={[styles.quickLabel, { color: theme.textMuted }]}>HIZLI TEST ŞABLONLARI</Text>
        <View style={styles.quickRow}>
          {[
            { label: 'Yasadışı Bahis', sender: 'B305', body: 'Tebrikler! 50.000 TL bahis bonusu kazandınız. Hemen sitemize girip tıklayın ve alın!' },
            { label: 'Banka İşlemi', sender: 'Garanti', body: 'Şifreniz: 482910. Lütfen banka çalışanları dahil kimseyle paylaşmayın.' },
            { label: 'Promosyon', sender: 'Mağaza', body: 'Büyük yaz indirimi başladı! Seçili ürünlerde %70 kampanya fırsatını kaçırmayın. B011' },
            { label: 'Temiz SMS', sender: '+905320000000', body: 'Merhaba Ahmet, yarınki toplantı saat 14:00 da. Geç kalmamaya çalış.' },
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
        <View style={{height: 100}}/>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingBottom: 100 },
  header: { marginBottom: spacing.xl, marginTop: spacing.md },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -1, marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  
  formContainer: {
    borderRadius: radii.xl, borderWidth: 1, overflow: 'hidden',
    marginBottom: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, minHeight: 56 },
  separator: { height: 1, marginLeft: 16 },
  fieldLabel: { width: 70, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  input: { flex: 1, fontSize: 16, paddingVertical: spacing.md },
  textArea: { height: 120, textAlignVertical: 'top' },
  
  testBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 56, borderRadius: radii.xl, marginBottom: spacing.xl,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6
  },
  testBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: 8 },
  spinIcon: { opacity: 0.8 },
  
  resultCard: {
    flexDirection: 'row', padding: spacing.lg, borderRadius: radii.xl,
    borderWidth: 1, alignItems: 'flex-start', marginBottom: spacing.xl,
  },
  resultIconWrapper: {
    width: 48, height: 48, borderRadius: radii.lg,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md
  },
  resultContent: { flex: 1, justifyContent: 'center', minHeight: 48 },
  resultTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  resultDesc: { fontSize: 14, lineHeight: 20 },
  
  learningSection: { marginBottom: spacing.xl },
  learningHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: 8 },
  learningTitle: { fontSize: 16, fontWeight: '800' },
  learningDesc: { fontSize: 13, lineHeight: 18, marginBottom: spacing.md },
  learningButtons: { flexDirection: 'row', gap: spacing.sm },
  trainBtn: { flex: 1, paddingVertical: spacing.lg, paddingHorizontal: spacing.sm, borderRadius: radii.xl, borderWidth: 1, alignItems: 'center' },
  trainBtnText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },

  quickLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.md },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  quickBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: radii.lg, borderWidth: 1 },
  quickBtnText: { fontSize: 14, fontWeight: '600' },
});
