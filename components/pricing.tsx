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
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
            <svg className="h-8 w-auto" viewBox="0 0 60 25" fill="none" aria-label="Stripe">
              <path fill="currentColor" fillOpacity="0.8" d="M5 11.2c0-1.1.9-1.6 2.3-1.6 2.1 0 4.7.6 6.8 1.8V5.3c-2.3-.9-4.5-1.3-6.8-1.3C2.9 4 0 6.3 0 10.2c0 6.2 8.5 5.2 8.5 7.9 0 1.3-1.1 1.7-2.7 1.7-2.3 0-5.3-.9-7.6-2.2v6.2a19.4 19.4 0 0 0 7.6 1.6c4.5 0 7.6-2.2 7.6-6.1.1-6.7-8.5-5.5-8.5-8.1zm14.6-3.5L22 6.4h-4.6v17.3h5.2V10.2c1.2-1.6 3.3-1.3 4-.5V4.4c-.7-.4-2.8-.9-3.9 0l-3.1 3.3zm8.1 0L30.1 6l-5.1 1v18.4l5.1-.9V7.7h3.1z" />
              <path fill="currentColor" fillOpacity="0.8" d="M40.1 4c-1.8 0-2.9.8-3.6 1.4l-.2-1.1h-4.7v22l5.2-1.1.1-5.3c.7.5 1.7 1.2 3.3 1.2 3.4 0 6.5-2.7 6.5-8.7 0-5.5-3.2-8.4-6.6-8.4zm-1.2 12.9c-1.1 0-1.7-.4-2.2-.9v-7c.5-.5 1.1-1 2.2-1 1.7 0 2.9 1.9 2.9 4.4 0 2.6-1.2 4.5-2.9 4.5zm16.1-8.8c0-1.7 1.4-2.4 3.7-2.4 3.4 0 7.6 1 11 2.9V2c-3.7-1.5-7.3-2-11-2C51.7 0 47 3.6 47 9.8c0 9.6 13.2 8 13.2 12.1 0 2-1.8 2.7-4.3 2.7-3.7 0-8.5-1.5-12.2-3.6v6.5c4.1 1.8 8.3 2.5 12.2 2.5 7.2 0 12.2-3.6 12.2-9.9 0-10.3-13.1-8.5-13.1-12z" />
            </svg>
          </div>
        </motion.div>
      </div>
    </section >
  );
}
