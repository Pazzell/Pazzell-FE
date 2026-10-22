"use client";

import Link from "next/link";
import {
  BarChart3,
  Brain,
  FileText,
  Image as ImageIcon,
  Link2,
  Megaphone,
  MousePointerClick,
  PencilLine,
  Pointer,
  Search,
  Share2,
  Timer,
  Type,
  Upload,
  Users,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { routes } from "@/app/_utils/routes";
import { useGameSettings } from "@/hooks/use-game-settings";
import { formatPrice } from "@/lib/utils";
import { HeroShowcase } from "@/components/landing/hero-showcase";

const PuzzlePiece = ({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => (
  <svg
    className={className}
    style={style}
    width="100"
    height="100"
    viewBox="0 0 100 100"
    fill="currentColor">
    <path d="M30 10 H70 C75 10 80 15 80 20 V35 C90 35 95 45 95 50 C95 55 90 65 80 65 V80 C80 85 75 90 70 90 H55 C55 80 45 75 40 75 C35 75 25 80 25 90 H30 C25 90 20 85 20 80 V65 C10 65 5 55 5 50 C5 45 10 35 20 35 V20 C20 15 25 10 30 10Z" />
  </svg>
);

function Step({
  num,
  title,
  children,
}: {
  num: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#FF6B9D] text-white font-bold flex items-center justify-center">
        {num}
      </span>
      <div>
        <h4 className="text-white font-semibold font-fredoka text-lg">
          {title}
        </h4>
        <p className="text-white/60 text-sm leading-relaxed">{children}</p>
      </div>
    </li>
  );
}

export default function Home() {
  const { settings } = useGameSettings();
  const { timer, customQuiz, pro, campaign } = settings;
  const proPrice = formatPrice(pro.amount, pro.currency);
  const campaignPrice = formatPrice(campaign.amount, campaign.currency);
  const freeQuizzes = `${customQuiz.freeLimit} ${
    customQuiz.freeLimit === 1 ? "trivia" : "trivias"
  }`;

  return (
    <div className="min-h-screen bg-background text-white overflow-x-hidden">
      <Header />

      <div
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden"
        aria-hidden>
        <PuzzlePiece
          className="absolute text-[#6C5CE7] opacity-[0.08] animate-float"
          style={{ top: "10%", left: "5%", animationDelay: "0s" }}
        />
        <PuzzlePiece
          className="absolute text-secondary opacity-[0.08] animate-float w-20 h-20"
          style={{ top: "60%", left: "15%", animationDelay: "-5s" }}
        />
        <PuzzlePiece
          className="absolute text-[#FF6B9D] opacity-[0.08] animate-float w-[120px] h-[120px]"
          style={{ top: "30%", right: "10%", animationDelay: "-10s" }}
        />
        <PuzzlePiece
          className="absolute text-[#00E676] opacity-[0.08] animate-float w-[90px] h-[90px]"
          style={{ top: "80%", right: "20%", animationDelay: "-15s" }}
        />
      </div>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center px-[5%] pt-32 pb-12 relative z-10">
        <div className="max-w-[75rem] w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <p className="inline-flex items-center gap-2 rounded-full border border-secondary/40 bg-secondary/10 px-4 py-1.5 text-sm text-secondary font-medium mb-6">
              <Brain className="h-4 w-4" />
              Brain training, one card at a time
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight font-fredoka">
              Sharpen your mind with{" "}
              <span className="bg-gradient-to-r from-secondary to-[#00E676] bg-clip-text text-transparent">
                pictures
              </span>{" "}
              and{" "}
              <span className="bg-gradient-to-r from-[#FFEAA7] to-[#FF9F43] bg-clip-text text-transparent">
                short definitions
              </span>
              .
            </h1>
            <p className="text-2xl sm:text-3xl font-fredoka text-secondary mb-4">
              A fun way to learn.
            </p>
            <p className="text-lg sm:text-xl text-white/70 mb-8 leading-relaxed">
              Pazzell is a quick trivia that trains recognition and recall. See
              a picture or a short definition and choose between two options.
              Or make your own trivia, share the link, and see how everyone
              did.
            </p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link href={`${routes.REGISTER}?type=user`}>
                <GradientButton
                  variant="secondary"
                  className="px-7 py-6 text-base hover:-translate-y-1">
                  Start Playing Free
                </GradientButton>
              </Link>
              <Link href={`${routes.REGISTER}?type=brand`}>
                <GradientButton className="px-7 py-6 text-base hover:-translate-y-1">
                  I&apos;m a Brand
                </GradientButton>
              </Link>
            </div>
          </div>
          <HeroShowcase />
        </div>
      </section>

      {/* How a question works */}
      <section className="bg-[#6C5CE7]/10 border-y border-[#6C5CE7]/30 py-12 relative z-10">
        <div className="max-w-6xl mx-auto px-[5%] grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            {
              icon: Search,
              title: "Pick your topic",
              text: "Select or search a topic to learn.",
            },
            {
              icon: MousePointerClick,
              title: "Two options, one tap",
              text: "Every question has two choices. Tap one and you're done.",
            },
            {
              icon: Timer,
              title: `${timer.minSeconds} to ${timer.maxSeconds} seconds`,
              text: "You choose the time per question before you start.",
            },
            {
              icon: Pointer,
              title: "Practice mode",
              text: "Turn it on and the correct option is pointed out as you go.",
            },
          ].map((item) => (
            <div key={item.title}>
              <item.icon className="h-8 w-8 text-secondary mx-auto mb-3" />
              <h3 className="text-lg font-bold font-fredoka mb-1">
                {item.title}
              </h3>
              <p className="text-white/60 text-sm">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you can do */}
      <section className="py-20 px-[5%] relative z-10" id="features">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-[2.5rem] font-bold text-center mb-4 font-fredoka">
            Four ways to use <span className="text-secondary">Pazzell</span>
          </h2>
          <p className="text-white/60 text-center max-w-2xl mx-auto mb-12">
            Train yourself, test your friends, reach an audience, or turn your
            own material into questions.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Brain,
                color: "#00D9FF",
                title: "Train your IQ",
                text: "Play topics like animals, food, footballers and musicians. Picture cards build recognition; short definitions build recall.",
                href: "#play",
                cta: "How playing works",
              },
              {
                icon: Share2,
                color: "#00E676",
                title: "Create and share a trivia",
                text: "Build your own trivia from pictures and definitions, publish it, and send the link to anyone you want to take it.",
                href: "#create",
                cta: "How sharing works",
              },
              {
                icon: Megaphone,
                color: "#FF6B9D",
                title: "Run a campaign trivia",
                text: "For brands: a short trivia about you, shown to players between their games, with your name, logo and a link to your site.",
                href: "#brands",
                cta: "How campaigns work",
              },
              {
                icon: FileText,
                color: "#FFEAA7",
                title: "Upload a document, get a trivia",
                text: "Hand over your notes or a handout and get a ready-made trivia from it.",
                href: "#documents",
                cta: "What's planned",
                soon: true,
              },
            ].map((feature) => (
              <a
                key={feature.title}
                href={feature.href}
                className="group bg-white/5 border border-white/10 rounded-3xl p-7 flex gap-5 items-start transition-all duration-300 hover:-translate-y-1 hover:border-secondary/60">
                <span
                  className="h-12 w-12 shrink-0 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: feature.color }}>
                  <feature.icon className="h-6 w-6 text-[#1A1A2E]" />
                </span>
                <span className="block">
                  <span className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-xl font-bold font-fredoka">
                      {feature.title}
                    </span>
                    {feature.soon && (
                      <span className="rounded-full border border-[#FFEAA7]/60 bg-[#FFEAA7]/10 px-2 py-0.5 text-xs font-semibold text-[#FFEAA7]">
                        Coming soon
                      </span>
                    )}
                  </span>
                  <span className="block text-white/60 text-sm leading-relaxed mb-3">
                    {feature.text}
                  </span>
                  <span className="text-secondary text-sm font-medium group-hover:underline">
                    {feature.cta}
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Play */}
      <section className="py-20 px-[5%] relative z-10 scroll-mt-24" id="play">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-secondary font-semibold mb-2 flex items-center gap-2">
              <Brain className="h-5 w-5" /> For players
            </p>
            <h2 className="text-3xl sm:text-[2.5rem] font-bold mb-4 font-fredoka leading-tight">
              See it. Know it. <span className="text-[#00E676]">Tap it.</span>
            </h2>
            <p className="text-white/70 mb-8 leading-relaxed">
              Recognising a face, an animal or a dish in a second, and matching
              a word to its meaning, are skills you build by repetition. Each
              session mixes picture cards with short definitions from the topic
              you pick.
            </p>
            <ol className="space-y-5">
              <Step num={1} title="Pick a topic">
                Choose what you want to get sharper at.
              </Step>
              <Step num={2} title="Set your pace">
                Choose {timer.minSeconds} to {timer.maxSeconds} seconds per
                question and how many cards. Switch on Practice to have the
                correct option pointed out.
              </Step>
              <Step num={3} title="Answer with one tap">
                Green when you&apos;re right, a red shake when you&apos;re not,
                then straight to the next card. Get them all and the confetti is
                yours.
              </Step>
              <Step num={4} title="See your score, go again">
                Retry for a fresh set of cards, or pick another topic.
              </Step>
            </ol>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <ImageIcon className="h-8 w-8 text-secondary mb-3" />
              <h3 className="text-xl font-bold font-fredoka mb-2">
                Picture cards
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                &ldquo;Who is this footballer?&rdquo; &ldquo;Which animal is
                this?&rdquo; A picture and two names. Trains fast visual
                recognition.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <Type className="h-8 w-8 text-[#FFEAA7] mb-3" />
              <h3 className="text-xl font-bold font-fredoka mb-2">
                Definition cards
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                A one-line definition and two words. Pick the one it describes.
                Trains recall and vocabulary.
              </p>
            </div>
            <div className="rounded-3xl border border-[#00E676]/30 bg-[#00E676]/5 p-6 sm:col-span-2">
              <h3 className="text-xl font-bold font-fredoka mb-2">
                Free to play
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Every topic is free. Pro ({proPrice} for {pro.durationDays}{" "}
                days) removes sponsored trivias between your games and lets you
                create as many trivias as you like.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Create and share */}
      <section
        className="py-20 px-[5%] bg-gradient-to-b from-transparent to-[#6C5CE7]/10 relative z-10 scroll-mt-24"
        id="create">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 grid sm:grid-cols-2 gap-5">
            {[
              {
                icon: PencilLine,
                title: "Build your cards",
                text: "Add a picture or a definition, two options, and mark the right one. Add cards one by one or many at once.",
              },
              {
                icon: Link2,
                title: "Publish and share",
                text: "Publishing gives you a private link. Only people with the link can find your trivia.",
              },
              {
                icon: Users,
                title: "Anyone can take it",
                text: "They open the link, sign in, and play it like any other trivia.",
              },
              {
                icon: BarChart3,
                title: "See how it went",
                text: "Check how many times it was played and the average score.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <item.icon className="h-7 w-7 text-[#00E676] mb-3" />
                <h3 className="text-lg font-bold font-fredoka mb-2">
                  {item.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-[#00E676] font-semibold mb-2 flex items-center gap-2">
              <Share2 className="h-5 w-5" /> For teachers, teams and friends
            </p>
            <h2 className="text-3xl sm:text-[2.5rem] font-bold mb-4 font-fredoka leading-tight">
              Make your own trivia.{" "}
              <span className="text-[#00E676]">Share the link.</span>
            </h2>
            <p className="text-white/70 mb-6 leading-relaxed">
              Quiz a class on this week&apos;s topic, onboard a new teammate, or
              challenge your friends. You write the cards; Pazzell handles the
              timer, the shuffling and the score.
            </p>
            <p className="text-white/60 text-sm mb-8">
              The free plan includes {freeQuizzes}. Pro makes it unlimited.
            </p>
            <Link href={`${routes.REGISTER}?type=user`}>
              <GradientButton
                variant="secondary"
                className="px-7 py-6 text-base hover:-translate-y-1">
                Create a Trivia
              </GradientButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="py-20 px-[5%] relative z-10 scroll-mt-24" id="brands">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-[#FF6B9D] font-semibold mb-2 flex items-center gap-2 justify-center">
              <Megaphone className="h-5 w-5" /> For brands
            </p>
            <h2 className="text-3xl sm:text-[2.5rem] font-bold mb-4 font-fredoka leading-tight">
              Put your brand inside the{" "}
              <span className="text-[#FF6B9D]">game</span>
            </h2>
            <p className="text-white/70 leading-relaxed">
              A campaign trivia is a short trivia about your brand. Players
              answer questions about you, rather than scrolling past an ad.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              {
                num: "1",
                title: "Build your campaign",
                text: "Add your name, logo, website and at least a handful of cards about your products or story.",
              },
              {
                num: "2",
                title: "Pay once and go live",
                text: `One flat price: ${campaignPrice} for ${campaign.durationDays} days. No packages, no bidding. It goes live when your payment is confirmed.`,
              },
              {
                num: "3",
                title: "Players meet your brand",
                text: "Free players are shown a sponsored trivia between their games, with your logo and a button to your site.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-[#6C5CE7] to-[#FF6B9D] rounded-full flex items-center justify-center mx-auto mb-5 font-bold text-lg text-white">
                  {step.num}
                </div>
                <h3 className="text-xl font-bold mb-3 font-fredoka">
                  {step.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {step.text}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-[#FF6B9D]/30 bg-[#FF6B9D]/5 p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
            <div>
              <h3 className="text-xl font-bold font-fredoka mb-2 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#FF6B9D]" />
                See what it did
              </h3>
              <p className="text-white/60 text-sm leading-relaxed max-w-xl">
                Your dashboard shows plays, completions, the average score and
                clicks through to your site. Totals only: individual players are
                never shown.
              </p>
            </div>
            <Link href={`${routes.REGISTER}?type=brand`} className="shrink-0">
              <GradientButton className="px-7 py-6 text-base hover:-translate-y-1">
                Create a Campaign
              </GradientButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Documents (planned) */}
      <section
        className="py-20 px-[5%] relative z-10 scroll-mt-24"
        id="documents">
        <div className="max-w-4xl mx-auto rounded-[30px] border border-[#FFEAA7]/30 bg-gradient-to-r from-[#FFEAA7]/10 to-[#FF9F43]/10 p-8 sm:p-12">
          <span className="inline-block rounded-full border border-[#FFEAA7]/60 bg-[#FFEAA7]/10 px-3 py-1 text-xs font-semibold text-[#FFEAA7] mb-4">
            Coming soon
          </span>
          <h2 className="text-3xl sm:text-[2.5rem] font-bold mb-4 font-fredoka leading-tight">
            Upload a document.{" "}
            <span className="text-[#FFEAA7]">Get a trivia.</span>
          </h2>
          <p className="text-white/70 leading-relaxed mb-8 max-w-2xl">
            Lecture notes, a training handout, a product guide: upload it and
            Pazzell will draft the cards for you to review, edit and share.
          </p>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: Upload,
                title: "Upload",
                text: "Hand over the document you already have.",
              },
              {
                icon: Wand2,
                title: "Generate",
                text: "Get definition cards drafted from its key points.",
              },
              {
                icon: Share2,
                title: "Review and share",
                text: "Fix anything you like, then publish the link.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl bg-white/5 border border-white/10 p-5">
                <item.icon className="h-6 w-6 text-[#FFEAA7] mb-2" />
                <h3 className="font-bold font-fredoka mb-1">{item.title}</h3>
                <p className="text-white/60 text-sm">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="text-white/50 text-sm mt-6">
            Until then, you can build a trivia by hand or paste many cards in at
            once.
          </p>
        </div>
      </section>

      {/* Closing calls to action */}
      <section className="py-20 px-[5%] relative z-10">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-[#00E676] to-secondary rounded-[30px] p-10 sm:p-12 text-center text-secondary-foreground">
            <h2 className="text-3xl font-bold mb-4 font-fredoka">
              Ready to train?
            </h2>
            <p className="text-lg opacity-90 mb-6">
              Pick a topic and play your first cards in under a minute.
            </p>
            <Link href={`${routes.REGISTER}?type=user`}>
              <Button className="bg-[#ffffff] text-secondary-foreground hover:bg-[#ffffff] font-bold py-6 px-10 rounded-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-lg font-fredoka">
                Start Playing Free
              </Button>
            </Link>
          </div>
          <div className="bg-gradient-to-br from-[#6C5CE7] to-[#FF6B9D] rounded-[30px] p-10 sm:p-12 text-center">
            <h2 className="text-3xl font-bold mb-4 font-fredoka">
              Have a brand to share?
            </h2>
            <p className="text-lg opacity-90 mb-6">
              Build a campaign trivia and put it in front of players.
            </p>
            <Link href={`${routes.REGISTER}?type=brand`}>
              <Button className="bg-[#ffffff] text-secondary-foreground hover:bg-[#ffffff] font-bold py-6 px-10 rounded-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-lg font-fredoka">
                Create a Campaign
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
