"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Star, Sparkles, Zap, Mail } from "lucide-react";
import Link from "next/link";
import { useState, useRef, ElementRef } from "react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
  isContactSales?: boolean;
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
  onUpgradeClick?: () => void;
}

export function Pricing({
  plans,
  title = "Planos & Preços",
  description = "Escolhe o plano ideal para o crescimento do teu negócio.",
  onUpgradeClick,
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const switchRef = useRef<ElementRef<typeof SwitchPrimitives.Root>>(null);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: ["#F59E0B", "#FBBF24", "#FCD34D", "#FEF3C7"],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  return (
    <section className="relative py-24 overflow-hidden" id="pricing">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold/[0.02] to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative z-10 max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              Sem custos ocultos
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight"
          >
            {title}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            {description}
          </motion.p>
        </div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex justify-center items-center gap-4 mb-12"
        >
          <span className={cn(
            "text-sm font-medium transition-colors",
            isMonthly ? "text-foreground" : "text-muted-foreground"
          )}>
            Mensal
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <Label className="sr-only">Toggle faturação anual</Label>
            <Switch
              ref={switchRef}
              checked={!isMonthly}
              onCheckedChange={handleToggle}
              className="data-[state=checked]:bg-gold"
            />
          </label>
          <span className={cn(
            "text-sm font-medium transition-colors inline-flex items-center gap-2",
            !isMonthly ? "text-foreground" : "text-muted-foreground"
          )}>
            Anual
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold">
              -20%
            </span>
          </span>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-0 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: 0.1 * index,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
              className={cn(
                "relative group",
                plan.isPopular && "lg:z-10"
              )}
            >
              <div
                className={cn(
                  "relative h-full rounded-2xl p-8 transition-all duration-500",
                  "border bg-card/50 backdrop-blur-sm",
                  plan.isPopular
                    ? "border-gold/50 bg-gradient-to-b from-gold/10 via-gold/5 to-transparent lg:scale-105 lg:-mx-2 shadow-2xl shadow-gold/10"
                    : "border-border/50 hover:border-gold/30 hover:bg-card/80",
                  !plan.isPopular && "lg:first:rounded-r-none lg:last:rounded-l-none",
                  plan.isPopular && "lg:rounded-2xl"
                )}
              >
                {/* Popular Badge */}
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-bold shadow-lg shadow-amber-500/25">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      RECOMENDADO
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className={cn(
                    "text-lg font-semibold mb-2",
                    plan.isPopular ? "text-gold" : "text-muted-foreground"
                  )}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <NumberFlow
                      value={isMonthly ? Number(plan.price) : Number(plan.yearlyPrice)}
                      format={{
                        style: "currency",
                        currency: "EUR",
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }}
                      transformTiming={{
                        duration: 500,
                        easing: "ease-out",
                      }}
                      willChange
                      className={cn(
                        "text-5xl font-bold tabular-nums",
                        plan.isPopular ? "text-gold" : "text-foreground"
                      )}
                    />
                    <span className="text-muted-foreground text-sm font-medium">
                      /{plan.period}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className={cn(
                        "flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center mt-0.5",
                        plan.isPopular ? "bg-gold/20" : "bg-gold/10"
                      )}>
                        <Check className={cn(
                          "h-3 w-3",
                          plan.isPopular ? "text-gold" : "text-gold/80"
                        )} />
                      </div>
                      <span className="text-sm text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                {plan.isContactSales ? (
                  <a
                    href={plan.href}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "w-full h-12 text-base font-semibold transition-all duration-300",
                      "transform hover:scale-[1.02] active:scale-[0.98]",
                      "bg-white/5 border-2 border-gold/20 text-gold hover:bg-gold/10 hover:border-gold/40"
                    )}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    {plan.buttonText}
                  </a>
                ) : plan.isPopular && onUpgradeClick ? (
                  <button
                    onClick={onUpgradeClick}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "w-full h-12 text-base font-semibold transition-all duration-300",
                      "transform hover:scale-[1.02] active:scale-[0.98]",
                      "bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30"
                    )}
                  >
                    {plan.buttonText}
                    <Zap className="ml-2 h-4 w-4" />
                  </button>
                ) : (
                  <Link
                    href={plan.href}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "w-full h-12 text-base font-semibold transition-all duration-300",
                      "transform hover:scale-[1.02] active:scale-[0.98]",
                      plan.isPopular
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30"
                        : "bg-white/5 border-2 border-gold/20 text-gold hover:bg-gold/10 hover:border-gold/40"
                    )}
                  >
                    {plan.buttonText}
                    {plan.isPopular && <Zap className="ml-2 h-4 w-4" />}
                  </Link>
                )}

                {/* Billing Info */}
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  {isMonthly ? "Faturado mensalmente" : "Faturado anualmente"}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-muted-foreground mb-4">
            Pagamentos seguros processados por
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
            <svg className="h-6 w-auto" viewBox="0 0 60 25" fill="none">
              <path fill="currentColor" fillOpacity="0.7" d="M9.63 5.97H7.02V18h2.61V5.97zm10.08 0h-2.52v7.95c0 1.65-1.17 2.76-2.67 2.76-1.5 0-2.67-1.11-2.67-2.76V5.97H9.33v8.34c0 2.85 2.13 4.89 5.19 4.89 3.06 0 5.19-2.04 5.19-4.89V5.97zm8.46 0h-2.52v7.95c0 1.65-1.17 2.76-2.67 2.76-1.5 0-2.67-1.11-2.67-2.76V5.97h-2.52v8.34c0 2.85 2.13 4.89 5.19 4.89 3.06 0 5.19-2.04 5.19-4.89V5.97zm11.49 6.51c0-3.93-2.82-6.69-6.51-6.69-3.69 0-6.51 2.76-6.51 6.69s2.82 6.69 6.51 6.69c3.69 0 6.51-2.76 6.51-6.69zm-2.58 0c0 2.52-1.65 4.26-3.93 4.26-2.28 0-3.93-1.74-3.93-4.26 0-2.52 1.65-4.26 3.93-4.26 2.28 0 3.93 1.74 3.93 4.26zm14.79-6.51h-6.75V18h2.61v-4.47h4.14c2.61 0 4.47-1.74 4.47-4.26 0-2.52-1.86-4.26-4.47-4.26zm-.57 6.27h-3.57V8.28h3.57c1.2 0 2.04.72 2.04 1.98 0 1.26-.84 1.98-2.04 1.98zm8.4-6.27h-2.61V18h2.61V5.97zm-1.305-1.5c.91 0 1.5-.59 1.5-1.35 0-.76-.59-1.35-1.5-1.35-.91 0-1.5.59-1.5 1.35 0 .76.59 1.35 1.5 1.35z" />
            </svg>
            <span className="text-xs text-muted-foreground">Stripe</span>
          </div>
        </motion.div>
      </div>
    </section >
  );
}
