import Link from "next/link";
import {
  Brain,
  Eye,
  Megaphone,
  Share2,
  ShieldCheck,
  Timer,
  ArrowRight,
} from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { GradientButton } from "@/components/ui/gradient-button";
import { routes } from "@/app/_utils/routes";

const WHAT_WE_DO = [
  {
    icon: Brain,
    title: "Trivia that trains",
    text: "Short sessions of picture cards and one-line definitions. Each question has two options and a few seconds on the clock.",
  },
  {
    icon: Share2,
    title: "Your own trivia, by link",
    text: "Anyone can build a trivia from their own pictures and definitions and share it with a private link.",
  },
  {
    icon: Megaphone,
    title: "Campaign trivia for brands",
    text: "Brands run a short trivia about themselves. Free players are shown one between their games.",
  },
];

const PRINCIPLES = [
  {
    icon: Eye,
    title: "Recognition and recall",
    text: "Naming what you see and matching a word to its meaning are skills that improve with quick, repeated practice. That is what every card is built for.",
  },
  {
    icon: Timer,
    title: "A fair clock",
    text: "The time per question is kept by our servers, not your device, so a refresh or a slow phone never gives anyone extra time or a second try.",
  },
  {
    icon: ShieldCheck,
    title: "Points for what you recall",
    text: "Recall a full session and you earn a point. Your monthly score starts again each month, and your lifetime score keeps them all.",
  },
];

export default function AboutPage() {
  return (
    <MainLayout maxWidth="5xl">
      <div className="space-y-20 py-6">
        <section className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-white font-fredoka leading-tight mb-6">
            Brain training through <span className="text-secondary">pictures</span> and{" "}
            <span className="text-[#FFEAA7]">short definitions</span>
          </h1>
          <p className="text-lg text-white/70 leading-relaxed">
            Pazzell is a trivia app for sharpening your mind a few seconds at a time. You see a
            picture or a short definition, choose between two options, and move on to the next
            card.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-white font-fredoka text-center mb-10">
            What you can do here
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {WHAT_WE_DO.map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-7">
                <item.icon className="h-8 w-8 text-secondary mb-4" />
                <h3 className="text-xl font-bold text-white font-fredoka mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="text-white/50 text-sm text-center mt-6">
            Coming soon: upload a document and get a trivia drafted from it.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-white font-fredoka text-center mb-10">
            How we think about it
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {PRINCIPLES.map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-7">
                <item.icon className="h-8 w-8 text-[#00E676] mb-4" />
                <h3 className="text-xl font-bold text-white font-fredoka mb-2">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[30px] border border-white/10 bg-gradient-to-r from-[#6C5CE7]/20 to-[#FF6B9D]/20 p-10 text-center">
          <h2 className="text-3xl font-bold text-white font-fredoka mb-3">Try it for yourself</h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            Playing is free. Pick a topic and you&apos;ll be on your first card in under a minute.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href={`${routes.REGISTER}?type=user`}>
              <GradientButton variant="secondary" className="px-7 py-6 text-base">
                Start Playing Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </GradientButton>
            </Link>
            <Link href={`${routes.REGISTER}?type=brand`}>
              <GradientButton className="px-7 py-6 text-base">Create a Campaign</GradientButton>
            </Link>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
