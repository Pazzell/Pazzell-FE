"use client";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { routes } from "@/app/_utils/routes";
import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Gamepad2, Target } from "lucide-react";

const PuzzlePiece = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} width="100" height="100" viewBox="0 0 100 100" fill="currentColor">
    <path d="M30 10 H70 C75 10 80 15 80 20 V35 C90 35 95 45 95 50 C95 55 90 65 80 65 V80 C80 85 75 90 70 90 H55 C55 80 45 75 40 75 C35 75 25 80 25 90 H30 C25 90 20 85 20 80 V65 C10 65 5 55 5 50 C5 45 10 35 20 35 V20 C20 15 25 10 30 10Z"/>
  </svg>
);


export default function Home() {
  const [activeAudience, setActiveAudience] = useState('players');

  return (
    <div className="min-h-screen bg-background text-white overflow-x-hidden">
      <Header />
      {/* Background puzzle pieces */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <PuzzlePiece 
          className="absolute text-[#6C5CE7] opacity-[0.08] animate-float" 
          style={{ top: '10%', left: '5%', animationDelay: '0s' }}
        />
        <PuzzlePiece 
          className="absolute text-secondary opacity-[0.08] animate-float w-20 h-20" 
          style={{ top: '60%', left: '15%', animationDelay: '-5s' }}
        />
        <PuzzlePiece 
          className="absolute text-[#FF6B9D] opacity-[0.08] animate-float w-[120px] h-[120px]" 
          style={{ top: '30%', right: '10%', animationDelay: '-10s' }}
        />
        <PuzzlePiece 
          className="absolute text-[#00E676] opacity-[0.08] animate-float w-[90px] h-[90px]" 
          style={{ top: '80%', right: '20%', animationDelay: '-15s' }}
        />
        <PuzzlePiece 
          className="absolute text-[#FFEAA7] opacity-[0.08] animate-float w-[70px] h-[70px]" 
          style={{ top: '45%', left: '50%', animationDelay: '-7s' }}
        />
      </div>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-[5%] pt-32 pb-12 relative z-10">
        <div className="max-w-[75rem] grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-left">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight font-fredoka">
              Play Puzzles.<br />
              <span className="bg-gradient-to-r from-secondary to-[#00E676] bg-clip-text text-transparent font-fredoka">
                Win Prizes.
              </span><br />
              <span className="bg-gradient-to-r from-[#FFEAA7] to-[#FF9F43] bg-clip-text text-transparent font-fredoka">
                Earn Money.
              </span>
            </h1>
            <p className="text-xl text-white/70 mb-8 leading-relaxed">
              Brands create fun puzzle campaigns. Players solve them and earn real rewards. 
              Everyone wins in the world&apos;s most engaging marketing platform.
            </p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link href={`${routes.REGISTER}?type=user`}>
                <GradientButton variant="secondary" className="px-7 py-6 text-base hover:-translate-y-1">
                  Start Earning
                </GradientButton>
              </Link>
              <Link href={`${routes.REGISTER}?type=brand`}>
                <GradientButton className="px-7 py-6 text-base hover:-translate-y-1">
                  I&apos;m a Brand
                </GradientButton>
              </Link>
              {/* <Link href={routes.PUZZLE_DEMO}>
                <GradientButton variant="outline" className="px-7 py-6 text-base">
                  Play Demo
                </GradientButton>
              </Link> */}
            </div>
          </div>
          <div className="flex justify-center">
            <div className="grid grid-cols-3 gap-2 w-full max-w-[320px] sm:max-w-[360px] md:max-w-[400px] mx-auto">
              {[
                { icon: 'target-icon.png', bg: '#6C5CE7', delay: '0s' },
                { icon: 'money-icon.png', bg: '#00D9FF', delay: '0.1s' },
                { icon: 'flash-icon.png', bg: '#FF6B9D', delay: '0.2s' },
                { icon: 'medal-icon.png', bg: '#FFEAA7', delay: '0.3s' },
                { icon: 'puzzle-icon.png', bg: '#00E676', delay: '0.4s' },
                { icon: 'trophy-icon.png', bg: '#FF9F43', delay: '0.5s' },
                { icon: 'star-icon.png', bg: '#00D9FF', delay: '0.6s' },
                { icon: 'gift-icon.png', bg: '#FF6B9D', delay: '0.7s' },
                { icon: 'rocket-icon.png', bg: '#6C5CE7', delay: '0.8s' },
              ].map((tile, index) => (
                <div
                  key={index}
                  className="aspect-square rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:rotate-2 animate-tileFloat p-4"
                  style={{ 
                    backgroundColor: tile.bg,
                    animationDelay: tile.delay
                  }}
                >
                  <Image
                    src={`/icons/${tile.icon}`}
                    alt=""
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#6C5CE7]/10 border-t border-[#6C5CE7]/30 border-b py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-[5%]">
          <div className="flex justify-around text-center flex-wrap gap-8">
            <div>
              <h3 className="text-5xl font-bold text-secondary mb-2 font-fredoka">500+</h3>
              <p className="text-white/60">Active Brands</p>
            </div>
            <div>
              <h3 className="text-5xl font-bold text-secondary mb-2 font-fredoka">2M+</h3>
              <p className="text-white/60">Puzzles Played</p>
            </div>
            <div>
              <h3 className="text-5xl font-bold text-[#00E676] mb-2 font-fredoka">₦850M+</h3>
              <p className="text-white/60">Paid to Players</p>
            </div>
            <div>
              <h3 className="text-5xl font-bold text-secondary mb-2 font-fredoka">150K+</h3>
              <p className="text-white/60">Active Players</p>
            </div>
          </div>
        </div>
      </section>

      {/* Audience Section with Toggle */}
      <section className="py-20 px-[5%] relative z-10" id="for-players">
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <button
            onClick={() => setActiveAudience('players')}
            className={`px-8 py-4 sm:px-12 sm:py-5 rounded-full text-lg font-semibold transition-all duration-300 font-fredoka ${
              activeAudience === 'players'
                ? 'bg-gradient-to-r from-[#00D9FF] to-[#00E676] text-secondary-foreground hover:shadow-lg'
                : 'border-2 border-white/20 text-white/60 hover:border-secondary hover:text-secondary'
            }`}
          >
            <Gamepad2 className="inline mr-2" size={20} />
            I&apos;m a Player
          </button>
          <button
            onClick={() => setActiveAudience('brands')}
            className={`px-8 py-4 sm:px-12 sm:py-5 rounded-full text-lg font-semibold transition-all duration-300 font-fredoka ${
              activeAudience === 'brands'
                ? 'bg-gradient-to-r from-[#6C5CE7] to-[#FF6B9D] text-white'
                : 'border-2 border-white/20 text-white/60 hover:border-secondary hover:text-secondary'
            }`}
          >
            <Target className="inline mr-2" size={20} />
            I&apos;m a Brand
          </button>
        </div>

        {/* Players Content */}
        {activeAudience === 'players' && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-[2.5rem] font-bold text-center mb-12 font-fredoka">
              Play. Solve. <span className="text-[#00E676]">Get Paid.</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {[
                { num: '1', title: 'Create Account', desc: 'Sign up for free in seconds. No credit card needed.', color: '#6C5CE7' },
                { num: '2', title: 'Browse Puzzles', desc: 'Explore campaigns from top brands — jigsaws, trivia, word games & more.', color: '#6C5CE7' },
                { num: '3', title: 'Solve & Complete', desc: 'Have fun solving puzzles. The faster and better you play, the more you earn.', color: '#6C5CE7' },
                { num: '4', title: 'Cash Out', desc: 'Withdraw your earnings via PayPal, gift cards, or crypto. It&apos;s that simple!', color: '#00E676' },
              ].map((step, index) => (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center transition-all duration-300 hover:-translate-y-3 hover:border-[#6C5CE7] hover:shadow-lg hover:shadow-[#6C5CE7]/20"
                  style={{
                    ...(step.color === '#00E676' && {
                      ':hover': {
                        borderColor: '#00E676',
                        boxShadow: '0 20px 40px rgba(0, 230, 118, 0.2)'
                      }
                    })
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5 font-bold text-lg"
                    style={{
                      background: step.color === '#00E676' 
                        ? 'linear-gradient(135deg, #00E676, #00D9FF)'
                        : 'linear-gradient(135deg, #6C5CE7, #FF6B9D)',
                      color: step.color === '#00E676' ? '#1A1A2E' : 'white'
                    }}
                  >
                    {step.num}
                  </div>
                  <h3 className="text-xl font-bold mb-3 font-fredoka">
                    {step.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-[#00E676]/10 to-secondary/10 rounded-[30px] p-12 border border-[#00E676]/30">
              <h3 className="text-3xl font-bold text-center mb-8 font-fredoka">
                Ways to <span className="text-[#00E676]">Earn</span>
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: 'trophy-flat-icon.png', title: 'Completion Rewards', desc: 'Earn money every time you complete a puzzle campaign' },
                  { icon: 'flash-flat-icon.png', title: 'Speed Bonuses', desc: 'Beat the clock for extra cash and climb the leaderboard' },
                  { icon: 'money-flat-icon.png', title: 'Referral Program', desc: 'Invite friends and earn 10% of their first month&apos;s earnings' },
                ].map((earning, index) => (
                  <div key={index} className="bg-white/5 rounded-2xl p-6 text-center">
                    <div className="mb-4 flex justify-center">
                      <Image src={`/icons/${earning.icon}`} alt="" width={48} height={48} />
                    </div>
                    <h4 className="text-xl font-bold text-[#00E676] mb-2 font-fredoka">
                      {earning.title}
                    </h4>
                    <p className="text-white/60 text-sm">{earning.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Brands Content */}
        {activeAudience === 'brands' && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-[2.5rem] font-bold text-center mb-12 font-fredoka">
              Turn Marketing Into <span className="text-[#FF6B9D]">Play</span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { num: '1', title: 'Design Your Puzzle', desc: 'Upload brand assets and choose from jigsaws, word games, trivia, and more templates.' },
                { num: '2', title: 'Launch Campaign', desc: 'Set your budget, rewards, and targeting. Share across social, email, or embed on your site.' },
                { num: '3', title: 'Watch Engagement Soar', desc: 'Track plays, completions, and conversions in real-time. Turn players into loyal customers.' },
              ].map((step, index) => (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center transition-all duration-300 hover:-translate-y-3 hover:border-[#6C5CE7] hover:shadow-lg hover:shadow-[#6C5CE7]/20"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-[#6C5CE7] to-[#FF6B9D] rounded-full flex items-center justify-center mx-auto mb-5 font-bold text-lg text-white">
                    {step.num}
                  </div>
                  <h3 className="text-xl font-bold mb-3 font-fredoka">
                    {step.title}
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Features */}
      <section className="py-24 bg-gradient-to-b from-transparent to-[#6C5CE7]/10 relative z-10" id="features">
        <h2 className="text-[2.5rem] font-bold text-center mb-16 max-w-4xl mx-auto px-[5%] font-fredoka">
          Why Everyone <span className="text-[#FF6B9D]">Loves</span> Pazzell
        </h2>
        <div className="max-w-7xl mx-auto px-[5%] grid md:grid-cols-2 gap-8">
          {[
            { icon: 'money-flat-icon.png', title: 'Real Money, Real Fast', desc: 'Players withdraw earnings instantly. No minimum thresholds, no waiting periods.', color: '#FF6B9D' },
            { icon: 'palette-flat-icon.png', title: 'Fully Customizable', desc: 'Brands match their colors, logos, and create puzzles that feel authentically theirs.', color: '#00D9FF' },
            { icon: 'chart-flat-icon.png', title: 'Real-Time Analytics', desc: 'See who&apos;s playing, engagement metrics, and which campaigns convert best.', color: '#00E676' },
            { icon: 'mobile-flat-icon.png', title: 'Play Anywhere', desc: 'Mobile-first design means puzzles play beautifully on any device, anytime.', color: '#6C5CE7' },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 flex gap-6 items-start transition-all duration-300 hover:bg-white/8 hover:border-secondary"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 p-2"
                style={{ backgroundColor: feature.color }}
              >
                <Image src={`/icons/${feature.icon}`} alt="" width={32} height={32} className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 font-fredoka">
                  {feature.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dual CTA */}
      <section className="py-24 px-[5%] relative z-10">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-[#6C5CE7] to-[#FF6B9D] rounded-[30px] p-12 text-center relative overflow-hidden">
            <div className="absolute -top-2 -right-2 text-6xl opacity-15">🎯</div>
            <h2 className="text-3xl font-bold mb-4 font-fredoka">
              Ready to Gamify Your Marketing?
            </h2>
            <p className="text-lg opacity-90 mb-6">
              Join 500+ brands turning casual scrollers into engaged customers.
            </p>
            <Link href={`${routes.REGISTER}?type=brand`}>
              <Button className="bg-[#ffffff] text-secondary-foreground hover:bg-[#ffffff] font-bold py-4 px-8 md:py-6 md:px-12 rounded-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-lg font-fredoka">
                Start Free Trial
              </Button>
            </Link>
          </div>
          <div className="bg-gradient-to-br from-[#00E676] to-secondary rounded-[30px] p-12 text-center relative overflow-hidden text-secondary-foreground">
            <div className="absolute -top-2 -right-2 text-6xl opacity-15">💰</div>
            <h2 className="text-3xl font-bold mb-4 font-fredoka">
              Ready to Play & Earn?
            </h2>
            <p className="text-lg opacity-90 mb-6">
              Join 150K+ players making money while having fun.
            </p>
            <Link href={`${routes.REGISTER}?type=user`}>
              <Button className="bg-[#ffffff] text-secondary-foreground hover:bg-[#ffffff] font-bold py-4 px-8 md:py-6 md:px-12 rounded-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-lg font-fredoka">
                Start Earning Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />

    </div>
  );
}