"use client";

import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Plan = {
  name: string;
  price: string;
  description: string;
  includes: string[];
  goodFor: string[];
  highlighted?: boolean;
};

const plans: Plan[] = [
  {
    name: "Free Plan",
    price: "0 FCFA",
    description: "Start exploring cybersecurity with essential AI guidance.",
    includes: [
      "5 questions daily",
      "GPT-3.5 Turbo",
      "Basic cybersecurity guidance",
      "Beginner-friendly answers",
    ],
    goodFor: ["Testing the platform", "Casual users"],
  },
  {
    name: "Starter Plan",
    price: "499 FCFA",
    description: "A balanced plan for steady daily learning.",
    includes: [
      "15 questions daily",
      "GPT-4o Mini",
      "Better explanations",
      "Faster responses",
      "Chat history",
    ],
    goodFor: ["Students learning cybersecurity basics"],
  },
  {
    name: "Pro Plan",
    price: "999 FCFA",
    description: "More depth and precision for serious growth.",
    includes: [
      "30 questions daily",
      "GPT-4o",
      "Advanced cybersecurity answers",
      "More accurate explanations",
      "Priority responses",
    ],
    goodFor: ["Serious learners", "University students and professionals"],
    highlighted: true,
  },
  {
    name: "Elite Plan",
    price: "1,499 FCFA",
    description: "Maximum performance and premium AI experience.",
    includes: [
      "50 questions daily",
      "GPT-4 Turbo or latest premium model",
      "Highest quality responses",
      "Fastest speed",
      "Early feature access",
      "Premium AI experience",
    ],
    goodFor: ["Power users", "Advanced cybersecurity students and experts"],
  },
];

export function PricingPlans() {
  return (
    <section className="min-h-dvh bg-background px-6 py-14 text-foreground md:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-10 text-center">
          <p className="mb-3 inline-flex rounded-full border border-border bg-muted/40 px-3 py-1 text-xs tracking-wide text-muted-foreground uppercase">
            Subscription Plans
          </p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Choose your Unisecure plan
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            Simple daily limits with better model quality as you scale.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <article
              className={cn(
                "relative flex h-full flex-col rounded-2xl border border-border bg-gradient-to-b from-card to-background p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]",
                plan.highlighted &&
                  "border-violet-400/50 bg-gradient-to-b from-[#2D2750] to-[#17152D] shadow-[0_0_0_1px_rgba(167,139,250,0.3),0_30px_60px_-40px_rgba(167,139,250,0.9)]"
              )}
              key={plan.name}
            >
              {plan.highlighted ? (
                <span className="absolute top-4 right-4 rounded-full bg-violet-400/20 px-2.5 py-1 text-[10px] font-medium tracking-wide text-violet-200 uppercase">
                  Popular
                </span>
              ) : null}

              <div className="mb-5">
                <h2 className="text-2xl font-semibold">{plan.name}</h2>
                <p className="mt-2 text-3xl font-bold tracking-tight">{plan.price}</p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <Button
                className={cn(
                  "mb-5 h-10 rounded-xl text-sm font-medium",
                  plan.highlighted
                    ? "bg-violet-500 text-white hover:bg-violet-400"
                    : "bg-white text-black hover:bg-white/90"
                )}
                type="button"
              >
                Choose {plan.name.replace(" Plan", "")}
              </Button>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Includes
                  </p>
                  <ul className="space-y-2.5">
                    {plan.includes.map((item) => (
                      <li className="flex items-start gap-2 text-foreground/90" key={item}>
                        <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-300" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-3.5">
                  <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Good For
                  </p>
                  <ul className="space-y-1.5 text-foreground/85">
                    {plan.goodFor.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
