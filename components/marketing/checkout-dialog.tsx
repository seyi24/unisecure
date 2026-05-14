"use client";

import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { PaymentInitResponse } from "@/app/(chat)/api/payment/init/route";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserPlan } from "@/lib/db/schema";
import { loadPaiementPro } from "@/lib/payment/paiement-pro-loader";
import {
  PAIEMENT_PRO_CHANNELS,
  type PaiementProChannel,
  PLAN_PRICES_FCFA,
} from "@/lib/payment/plans";
import { cn } from "@/lib/utils";

type CheckoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: UserPlan | null;
  defaultEmail?: string;
};

const formatPlanName = (plan: UserPlan) =>
  plan.charAt(0).toUpperCase() + plan.slice(1);

export function CheckoutDialog({
  open,
  onOpenChange,
  plan,
  defaultEmail,
}: CheckoutDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [channel, setChannel] = useState<PaiementProChannel>(
    PAIEMENT_PRO_CHANNELS[0].id
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsSubmitting(false);
    }
  }, [open]);

  const amount = plan ? PLAN_PRICES_FCFA[plan] : 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!plan) {
      return;
    }

    if (!(firstName.trim() && lastName.trim() && phoneNumber.trim())) {
      toast.error("Please fill in your name and phone number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/payment/init`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            plan,
            channel,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phoneNumber: phoneNumber.trim(),
          }),
        }
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(
          body?.message ?? "We couldn't initialize this payment."
        );
      }

      const init = (await response.json()) as PaymentInitResponse;
      console.log("[checkout] init response", init);

      const PaiementPro = await loadPaiementPro();
      console.log("[checkout] PaiementPro SDK loaded");

      const paiement = new PaiementPro(init.merchantId);
      paiement.amount = init.amount;
      paiement.description = init.description;
      paiement.channel = init.channel;
      paiement.countryCurrencyCode = init.currency;
      paiement.referenceNumber = init.referenceNumber;
      paiement.customerEmail = init.customerEmail;
      paiement.customerFirstName = init.customerFirstName;
      paiement.customerLastname = init.customerLastName;
      paiement.customerPhoneNumber = init.customerPhoneNumber;
      paiement.notificationURL = init.notificationURL;
      paiement.returnURL = init.returnURL;

      console.log("[checkout] calling getUrlPayment", { paiement });
      await paiement.getUrlPayment();
      console.log("[checkout] getUrlPayment result", {
        success: paiement.success,
        url: paiement.url,
        paiement,
      });

      if (paiement.success && paiement.url) {
        window.location.href = paiement.url;
        return;
      }

      throw new Error(
        `PaiementPro did not return a payment URL (success=${paiement.success}). Most likely cause: localhost URLs are not accepted by PaiementPro — use ngrok for testing.`
      );
    } catch (error) {
      console.error("[checkout] payment failed", error);
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while preparing the payment.";
      toast.error(message, { duration: 10_000 });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Subscribe to {plan ? formatPlanName(plan) : ""} plan
          </DialogTitle>
          <DialogDescription>
            {plan ? (
              <>
                You'll be charged{" "}
                <span className="font-medium text-foreground">
                  {amount.toLocaleString()} FCFA / month
                </span>{" "}
                via PaiementPro.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="checkout-firstName">First name</Label>
              <Input
                autoComplete="given-name"
                id="checkout-firstName"
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Tiamiyu"
                required
                value={firstName}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checkout-lastName">Last name</Label>
              <Input
                autoComplete="family-name"
                id="checkout-lastName"
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Rokeebah"
                required
                value={lastName}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="checkout-phone">Phone number</Label>
            <Input
              autoComplete="tel"
              id="checkout-phone"
              inputMode="tel"
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="+225 07 00 00 00 00"
              required
              type="tel"
              value={phoneNumber}
            />
          </div>

          {defaultEmail ? (
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                aria-readonly="true"
                className="cursor-not-allowed bg-muted/40"
                readOnly
                value={defaultEmail}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Payment method</Label>
            <div className="grid grid-cols-2 gap-2">
              {PAIEMENT_PRO_CHANNELS.map((option) => {
                const selected = option.id === channel;
                return (
                  <button
                    aria-pressed={selected}
                    className={cn(
                      "rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-left transition-colors hover:bg-muted/40",
                      selected &&
                        "border-violet-400/60 bg-violet-500/10 ring-1 ring-violet-400/40"
                    )}
                    key={option.id}
                    onClick={() => setChannel(option.id)}
                    type="button"
                  >
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              className="w-full sm:w-auto"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="w-full bg-violet-500 text-white hover:bg-violet-400 sm:w-auto"
              disabled={isSubmitting || !plan}
              type="submit"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2Icon className="size-4 animate-spin" />
                  Redirecting…
                </span>
              ) : (
                <>Pay {amount.toLocaleString()} FCFA</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
