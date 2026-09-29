export interface User { id: number; email: string; name: string; role: "team" | "client"; clientId: number | null }
export interface Me { user: User | null; client?: { id: number; businessName: string; ownerName: string; tier: number; status: string } | null; botEnabled?: boolean }
export interface Lead { id: number; clientId: number; name: string | null; phone: string | null; email: string | null; message: string | null; source: string; status: "new" | "contacted" | "won" | "lost"; createdAt: string }
export interface Revision { id: number; clientId: number; title: string; details: string; page: string | null; status: "open" | "in_progress" | "done"; createdBy: string; dueAt: string; completedAt: string | null; createdAt: string }
export interface ChatMessage { id: number; clientId: number; sender: "client" | "bot" | "team" | "system"; authorName: string | null; body: string; createdAt: string }
export interface Notification { id: number; kind: string; title: string; body: string; url: string; read: boolean; createdAt: string }
export interface PlanSummary { tier: number; name: string; monthly: number; pages?: string; revisionTurnaround: string; features: string[] }
export interface Overview {
  business: string; owner: string; siteUrl: string | null; status: "build" | "phase1" | "live"; goLiveDate: string | null; monthlyStartsOn: string | null;
  plan: PlanSummary; nextPlan: PlanSummary | null;
  leads: { last30: number; newCount: number; total: number };
  openRevisions: { id: number; title: string; status: string; dueAt: string }[];
  pendingUpgrade: { item: string } | null;
  reviewUrl?: string | null;
}
export interface Referral { id: number; clientId?: number; name: string; business: string | null; phone: string | null; email?: string | null; source?: string; status: "new" | "contacted" | "signed" | "lost"; signedAt?: string | null; creditAmount: number; creditStatus: "none" | "pending" | "applied"; createdAt: string }
export interface ReferralSummary {
  code: string; link: string; referrals: Referral[];
  stats: { earned: number; pending: number; applied: number; signedCount: number; inPlay: number; potential: number };
  program: { perSignup: number; cardSlots: number; cardBonus: number; friendOffer: string };
}
export interface WebsiteStats {
  siteUrl: string | null; status: string; tracking: boolean;
  traffic: { views: number; calls: number; texts: number; forms: number; dailyViews: string[]; topPages: { path: string; views: number }[] };
  health: { checkedAt: string | null; up: boolean | null; responseMs: number | null; uptime: number | null; https: boolean | null };
  photos: { id: number; note: string | null; createdAt: string; url?: string }[];
}
export interface Client { id: number; businessName: string; ownerName: string; phone: string | null; email: string | null; tier: number; siteUrl: string | null; status: string; goLiveDate: string | null; niche: string | null; siteKey: string; notes: string | null; googleReviewUrl?: string | null; referralCode?: string | null; openRevisions?: number; openEscalations?: number; leads30?: number }
export interface Escalation { id: number; clientId: number; category: string; urgency: string; summary: string; status: string; createdAt: string; client?: { businessName: string; tier: number } }
export interface Upgrade { id: number; clientId: number; item: string; label: string; note: string | null; source: string; status: string; createdAt: string; client?: { businessName: string; tier: number } }
