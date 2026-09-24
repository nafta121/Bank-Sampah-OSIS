export interface ClassProfile {
  classId: string;
  name: string;
  points: number;
  balance: number; // in IDR
  totalWeightKg: number;
  pin: string;
  representative: string;
  updatedAt?: string;
}

export type WasteCategory =
  | 'Plastik & Botol'
  | 'Kertas & Karton'
  | 'Logam & Kaleng'
  | 'Minyak Jelantah'
  | 'Elektronik / E-Waste'
  | 'Anorganik Lainnya';

export interface WasteCategoryRate {
  category: WasteCategory;
  pointsPerKg: number;
  pricePerKg: number;
  icon: string;
  color: string;
}

export interface WasteTransaction {
  transactionId: string;
  classId: string;
  className?: string;
  category: WasteCategory;
  weightKg: number;
  pointsEarned: number;
  cashEarned: number;
  recordedBy: string;
  timestamp: string;
  status: 'synced' | 'pending';
  notes?: string;
  isOfflineQueue?: boolean;
}

export interface RewardItem {
  id: string;
  title: string;
  description: string;
  category: 'cleaning' | 'plants' | 'cash' | 'canteen' | 'facility';
  pointsCost: number;
  cashCost: number;
  icon: string;
}

export interface RewardRedemption {
  redemptionId: string;
  classId: string;
  className?: string;
  rewardTitle: string;
  pointsSpent: number;
  cashSpent: number;
  status: 'requested' | 'approved' | 'completed';
  requestedAt: string;
}

export interface NotificationItem {
  notificationId: string;
  classId: string;
  className?: string;
  title: string;
  message: string;
  type: 'reward_ready' | 'milestone' | 'monthly_report' | 'sync';
  isRead: boolean;
  createdAt: string;
}

export interface AiWasteAnalysis {
  categoryRecommended: string;
  pointEstimate: number;
  cashEstimate: number;
  ecoImpact: {
    co2SavedKg: number;
    waterSavedLiter: number;
    treeEquivalent: string;
  };
  segregationTip: string;
  upcycleIdea: string;
}

export interface AiMonthlySummary {
  headline: string;
  executiveSummary: string;
  ecoAchievements: string[];
  classShoutouts: string;
  recommendationsForNextMonth: string[];
}
