type ActivityStatus = 'blocked' | 'transaction' | 'promotion' | 'allowed';

interface ActivityRecord {
  timestamp: number;
  status: ActivityStatus;
}

interface DashboardStats {
  blockedCount: number;
  analyzedCount: number;
  transactionCount: number;
  promotionCount: number;
}

export interface WeeklyMetric {
  day: string;
  val: number;
}

export interface ThreatDistribution {
  blocked: number;
  transaction: number;
  promotion: number;
  allowed: number;
  total: number;
}

export function buildWeeklySuspiciousSeries(
  history: readonly ActivityRecord[],
  now = new Date(),
): WeeklyMetric[] {
  const dayLabels = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - index));
    const startOfDay = new Date(date).setHours(0, 0, 0, 0);
    const endOfDay = new Date(date).setHours(23, 59, 59, 999);
    const val = history.filter(item =>
      item.status === 'blocked' &&
      item.timestamp >= startOfDay &&
      item.timestamp <= endOfDay
    ).length;

    return { day: dayLabels[date.getDay()], val };
  });
}

export function buildThreatDistribution(
  stats: DashboardStats,
): ThreatDistribution {
  const blocked = Math.max(0, stats.blockedCount);
  const transaction = Math.max(0, stats.transactionCount);
  const promotion = Math.max(0, stats.promotionCount);
  const allowed = Math.max(
    0,
    stats.analyzedCount - blocked - transaction - promotion,
  );

  return {
    blocked,
    transaction,
    promotion,
    allowed,
    total: blocked + transaction + promotion + allowed,
  };
}
