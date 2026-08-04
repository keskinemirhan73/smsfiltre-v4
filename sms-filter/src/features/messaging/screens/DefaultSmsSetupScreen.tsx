import React from 'react';
import { Check, ChevronRight, LockKeyhole, MessageSquareText, ShieldCheck } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { radii, spacing, useAppTheme } from '../../../theme';
import { MessagingScreenShell } from '../components/MessagingScreenShell';
import type { MessagingLocale } from '../components/messagingUi';

interface DefaultSmsSetupScreenProps {
  locale: MessagingLocale;
  isPreview?: boolean;
  onContinue: () => void;
  onNotNow?: () => void;
}

interface BenefitRowProps {
  title: string;
  description: string;
}

function BenefitRow({ title, description }: BenefitRowProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.benefitRow}>
      <View style={[styles.checkBadge, { backgroundColor: `${theme.secondary}20` }]}>
        <Check size={16} color={theme.secondary} strokeWidth={3} />
      </View>
      <View style={styles.benefitBody}>
        <Text style={[styles.benefitTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.benefitDescription, { color: theme.textMuted }]}>{description}</Text>
      </View>
    </View>
  );
}

export function DefaultSmsSetupScreen({
  locale,
  isPreview = false,
  onContinue,
  onNotNow,
}: DefaultSmsSetupScreenProps) {
  const theme = useAppTheme();
  const labels = locale === 'tr'
    ? {
        title: 'FiltreAI Mesajlar',
        subtitle: isPreview ? 'Android deneyimi önizlemesi' : 'Kurulum',
        eyebrow: 'ANDROID’E ÖZEL',
        heroTitle: 'Mesajların, kontrolün altında',
        heroDescription: 'FiltreAI gelen mesajları cihazında ayırır; güvenli mesajlar gelen kutuna, riskliler ayrı alana düşer.',
        benefitOneTitle: 'Gerçek spam ayrımı',
        benefitOneDescription: 'Riskli mesajları normal konuşmalarından ayrı tutar.',
        benefitTwoTitle: 'Özel ve cihaz içinde',
        benefitTwoDescription: 'Sınıflandırma için mesaj içeriğini bir sunucuya yüklemez.',
        benefitThreeTitle: 'Normal mesajlaşma deneyimi',
        benefitThreeDescription: 'Mesajlarını okuyabilir, yanıtlayabilir ve yeni SMS gönderebilirsin.',
        disclosureTitle: 'Seçim her zaman sende',
        disclosureDescription: 'Android aynı anda yalnızca bir varsayılan SMS uygulamasına izin verir. Sistem seçimini daha sonra Ayarlar’dan değiştirebilirsin.',
        continue: isPreview ? 'Kuruluma devam et' : 'Sistem seçimini aç',
        notNow: 'Şimdi değil',
      }
    : {
        title: 'FiltreAI Messages',
        subtitle: isPreview ? 'Android experience preview' : 'Setup',
        eyebrow: 'ANDROID ONLY',
        heroTitle: 'Your messages, under your control',
        heroDescription: 'FiltreAI sorts incoming messages on-device; safe messages stay in your inbox and risky ones go to a separate space.',
        benefitOneTitle: 'Real spam separation',
        benefitOneDescription: 'Keeps risky messages away from your regular conversations.',
        benefitTwoTitle: 'Private and on-device',
        benefitTwoDescription: 'Does not upload message content to a server for classification.',
        benefitThreeTitle: 'A complete messaging experience',
        benefitThreeDescription: 'Read, reply to, and send new SMS messages.',
        disclosureTitle: 'The choice stays with you',
        disclosureDescription: 'Android allows only one default SMS app at a time. You can change your choice later in system settings.',
        continue: isPreview ? 'Continue setup' : 'Open system choice',
        notNow: 'Not now',
      };

  return (
    <MessagingScreenShell title={labels.title} subtitle={labels.subtitle}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={[styles.heroGlow, { backgroundColor: theme.primaryGlow }]}>
            <View style={[styles.heroIcon, { backgroundColor: theme.primary }]}>
              <MessageSquareText size={38} color="#FFFFFF" />
              <View style={[styles.shieldBadge, { backgroundColor: theme.secondary }]}>
                <ShieldCheck size={17} color="#FFFFFF" strokeWidth={2.8} />
              </View>
            </View>
          </View>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>{labels.eyebrow}</Text>
          <Text style={[styles.heroTitle, { color: theme.text }]}>{labels.heroTitle}</Text>
          <Text style={[styles.heroDescription, { color: theme.textMuted }]}>
            {labels.heroDescription}
          </Text>
        </View>

        <View style={[styles.benefitsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <BenefitRow title={labels.benefitOneTitle} description={labels.benefitOneDescription} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <BenefitRow title={labels.benefitTwoTitle} description={labels.benefitTwoDescription} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <BenefitRow title={labels.benefitThreeTitle} description={labels.benefitThreeDescription} />
        </View>

        <View style={[styles.disclosure, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <LockKeyhole size={20} color={theme.textMuted} />
          <View style={styles.disclosureBody}>
            <Text style={[styles.disclosureTitle, { color: theme.text }]}>
              {labels.disclosureTitle}
            </Text>
            <Text style={[styles.disclosureDescription, { color: theme.textMuted }]}>
              {labels.disclosureDescription}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onContinue}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.78 : 1 },
          ]}
        >
          <Text style={styles.primaryButtonText}>{labels.continue}</Text>
          <ChevronRight size={20} color="#FFFFFF" />
        </Pressable>
        {onNotNow ? (
          <Pressable
            accessibilityRole="button"
            onPress={onNotNow}
            style={({ pressed }) => [styles.secondaryButton, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.textMuted }]}>{labels.notNow}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </MessagingScreenShell>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: { alignItems: 'center', paddingVertical: spacing.lg },
  heroGlow: {
    width: 112,
    height: 112,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroIcon: {
    width: 78,
    height: 78,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-3deg' }],
  },
  shieldBadge: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    width: 34,
    height: 34,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.6 },
  heroTitle: {
    maxWidth: 320,
    marginTop: spacing.sm,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  heroDescription: {
    maxWidth: 360,
    marginTop: spacing.sm,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  benefitsCard: { marginTop: spacing.md, padding: spacing.md, borderRadius: radii.xl, borderWidth: 1 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  checkBadge: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  benefitBody: { flex: 1 },
  benefitTitle: { fontSize: 14, fontWeight: '900' },
  benefitDescription: { marginTop: 2, fontSize: 12, lineHeight: 17 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 54 },
  disclosure: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  disclosureBody: { flex: 1, marginLeft: spacing.sm },
  disclosureTitle: { fontSize: 13, fontWeight: '900' },
  disclosureDescription: { marginTop: 3, fontSize: 12, lineHeight: 17 },
  primaryButton: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    borderRadius: radii.lg,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  secondaryButton: { alignItems: 'center', justifyContent: 'center', minHeight: 50 },
  secondaryButtonText: { fontSize: 14, fontWeight: '800' },
});
