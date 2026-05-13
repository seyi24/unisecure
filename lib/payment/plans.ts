import type { UserPlan } from "@/lib/db/schema";

export const PLAN_PRICES_FCFA: Record<UserPlan, number> = {
  free: 0,
  starter: 499,
  pro: 999,
  elite: 1499,
};

export const PLAN_DURATION_DAYS = 30;

export const PAIEMENT_PRO_CURRENCY = "952";

export const PAIEMENT_PRO_CHANNELS = [
  {
    id: "CARD",
    label: "Carte bancaire",
    description: "Visa, Mastercard",
  },
  {
    id: "OM",
    label: "Orange Money",
    description: "Côte d'Ivoire, Sénégal, Cameroun…",
  },
  {
    id: "MOMO",
    label: "MTN Mobile Money",
    description: "MTN MoMo",
  },
  {
    id: "MOOV",
    label: "Moov Money",
    description: "Moov Africa",
  },
  {
    id: "WAVE",
    label: "Wave",
    description: "Wave",
  },
] as const;

export type PaiementProChannel = (typeof PAIEMENT_PRO_CHANNELS)[number]["id"];

export const ALLOWED_CHANNELS = new Set<string>(
  PAIEMENT_PRO_CHANNELS.map((c) => c.id)
);

export function getPlanPrice(plan: UserPlan): number {
  return PLAN_PRICES_FCFA[plan];
}

export function computePlanExpiry(from: Date = new Date()): Date {
  const next = new Date(from);
  next.setDate(next.getDate() + PLAN_DURATION_DAYS);
  return next;
}
