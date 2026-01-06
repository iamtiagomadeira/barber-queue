'use client';
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { InstagramIcon, MailIcon, MapPinIcon } from 'lucide-react';

interface FooterLink {
	title: string;
	href: string;
	icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
	label: string;
	links: FooterLink[];
}

const footerLinks: FooterSection[] = [
	{
		label: 'Produto',
		links: [
			{ title: 'Funcionalidades', href: '#features' },
			{ title: 'Como Funciona', href: '#how-it-works' },
			{ title: 'Preços', href: '#pricing' },
		],
	},
	{
		label: 'Empresa',
		links: [
			{ title: 'Sobre Nós', href: '/about' },
			{ title: 'Política de Privacidade', href: '/legal/privacy' },
			{ title: 'Termos e Condições', href: '/legal/terms' },
		],
	},
	{
		label: 'Contacto',
		links: [
			{ title: 'Email', href: 'mailto:hello@ventus.app', icon: MailIcon },
			{ title: 'Instagram', href: '#', icon: InstagramIcon },
			{ title: 'Lisboa, Portugal', href: '#', icon: MapPinIcon },
		],
	},
];

export function Footer() {
	return (
		<footer className="relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center rounded-t-3xl border-t border-gold/20 bg-[radial-gradient(35%_128px_at_50%_0%,theme(colors.gold/8%),transparent)] px-6 py-12 lg:py-16">
			<div className="bg-gold/30 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

			<div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
				<AnimatedContainer className="space-y-4">
					<div className="flex items-center gap-2">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							className="h-8 w-8 text-gold"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path d="M12 2L2 7l10 5 10-5-10-5z" />
							<path d="M2 17l10 5 10-5" />
							<path d="M2 12l10 5 10-5" />
						</svg>
						<span className="text-xl font-bold text-gold">Ventus</span>
					</div>
					<p className="text-muted-foreground text-sm max-w-xs">
						Elimine a espera física. Entre na fila virtual e receba notificação quando for a sua vez.
					</p>
					<p className="text-muted-foreground mt-8 text-xs">
						© {new Date().getFullYear()} Ventus. Todos os direitos reservados.
					</p>
				</AnimatedContainer>

				<div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-3 xl:col-span-2 xl:mt-0">
					{footerLinks.map((section, index) => (
						<AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
							<div className="mb-10 md:mb-0">
								<h3 className="text-xs font-semibold text-gold uppercase tracking-wider">{section.label}</h3>
								<ul className="text-muted-foreground mt-4 space-y-3 text-sm">
									{section.links.map((link) => (
										<li key={link.title}>
											<a
												href={link.href}
												className="hover:text-gold inline-flex items-center transition-all duration-300"
											>
												{link.icon && <link.icon className="me-2 size-4 text-gold/60" />}
												{link.title}
											</a>
										</li>
									))}
								</ul>
							</div>
						</AnimatedContainer>
					))}
				</div>
			</div>
		</footer>
	);
}

type ViewAnimationProps = {
	delay?: number;
	className?: ComponentProps<typeof motion.div>['className'];
	children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return <>{children}</>;
	}

	return (
		<motion.div
			initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
			whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
			viewport={{ once: true }}
			transition={{ delay, duration: 0.8 }}
			className={className}
		>
			{children}
		</motion.div>
	);
}