import type { FilterRule, HistoryItem } from '../modules/FilterManager';

export type MessageCategory = FilterRule['category'];

export interface MessageCategoryOption {
  key: MessageCategory;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
}

export const MESSAGE_CATEGORY_OPTIONS: readonly MessageCategoryOption[] = Object.freeze([
  Object.freeze({
    key: 'junk' as const,
    label: 'İstenmeyen / Engelle',
    shortLabel: 'İstenmeyen',
    description: 'Şüpheli, dolandırıcılık veya istenmeyen gönderici',
    color: '#EF4444',
  }),
  Object.freeze({
    key: 'allowed' as const,
    label: 'Güvenli / Gelen Kutusu',
    shortLabel: 'Güvenli',
    description: 'Güvendiğiniz ve filtrelenmemesi gereken gönderici',
    color: '#10B981',
  }),
  Object.freeze({
    key: 'transaction' as const,
    label: 'İşlem ve Bilgilendirme',
    shortLabel: 'İşlem',
    description: 'Banka, doğrulama, kargo ve hesap hareketleri',
    color: '#3B82F6',
  }),
  Object.freeze({
    key: 'promotion' as const,
    label: 'Kampanya ve Tanıtım',
    shortLabel: 'Tanıtım',
    description: 'İndirim, kampanya ve ticari duyurular',
    color: '#F59E0B',
  }),
]);

const OPTION_BY_CATEGORY = new Map(
  MESSAGE_CATEGORY_OPTIONS.map(option => [option.key, option]),
);

export function messageCategoryOption(category: MessageCategory): MessageCategoryOption {
  const option = OPTION_BY_CATEGORY.get(category);
  if (!option) throw new Error('Desteklenmeyen mesaj kategorisi.');
  return option;
}

export function createManualCategoryHistory(
  sender: string,
  category: MessageCategory,
): Omit<HistoryItem, 'id' | 'timestamp'> {
  const option = messageCategoryOption(category);
  return {
    sender,
    preview: `Gönderici manuel olarak ${option.label} kategorisine alındı.`,
    status: category === 'junk' ? 'blocked' : category,
    category,
    source: 'manual',
  };
}

export function resolveUserRuleCategory(
  category: MessageCategory,
  matchTarget: FilterRule['matchTarget'],
  filterTransactions: boolean,
  filterPromotions: boolean,
  matchMode?: FilterRule['matchMode'],
): MessageCategory {
  const isExactSenderOverride = matchTarget === 'sender' && matchMode === 'exact';
  if (category === 'transaction' && !isExactSenderOverride && !filterTransactions) {
    return 'allowed';
  }
  if (category === 'promotion' && !isExactSenderOverride && !filterPromotions) {
    return 'allowed';
  }
  return category;
}
