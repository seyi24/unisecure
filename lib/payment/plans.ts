import type { UserPlan } from "@/lib/db/schema";

export const PLAN_PRICES_FCFA: Record<UserPlan, number> = {
  free: 0,
  starter: 499,
  pro: 999,
  elite: 1499,
};

export const PLAN_DURATION_DAYS = 30;

export const PAIEMENT_PRO_CURRENCY = "952";

// Codes officiels PaiementPro pour la Côte d'Ivoire.
// Source : espace marchand PaiementPro.
export const PAIEMENT_PRO_CHANNELS = [
  {
    id: "CARD",
    label: "Carte bancaire",
    description: "Visa, Mastercard",
  },
  {
    id: "OMCIV2",
    label: "Orange Money CI",
    description: "Orange Money — Côte d'Ivoire",
  },
  {
    id: "MOMOCI",
    label: "MTN MoMo CI",
    description: "MTN Mobile Money — Côte d'Ivoire",
  },
  {
    id: "FLOOZ",
    label: "Moov Money CI",
    description: "Moov Flooz — Côte d'Ivoire",
  },
  {
    id: "WAVECI",
    label: "Wave CI",
    description: "Wave — Côte d'Ivoire",
  },
  {
    id: "PAYPAL",
    label: "PayPal",
    description: "Paiement international",
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
