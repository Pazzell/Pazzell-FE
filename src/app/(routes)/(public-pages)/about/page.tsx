import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import Link from "next/link";
import { routes } from "@/app/_utils/routes";
import {
  Users,
  Target,
  Gamepad2,
  Award,
  Globe,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  Mail,
} from "lucide-react";

export default function AboutPage() {
  const stats = [
    { label: "Active Users", value: "10,000+", icon: Users },
    { label: "Puzzles Created", value: "5,000+", icon: Gamepad2 },
    { label: "Campaigns Launched", value: "1,200+", icon: Target },
    { label: "Countries", value: "15+", icon: Globe },
  ];

  const values = [
    {
      icon: Gamepad2,
      title: "Fun-First",
      description:
        "We believe learning and engagement should be enjoyable. Our puzzles are designed to entertain while delivering brand messages.",
    },
    {
      icon: Shield,
      title: "Fair Rewards",
      description:
        "Every user deserves fair compensation for their time and engagement. We ensure transparent and reliable earning opportunities.",
    },
    {
      icon: TrendingUp,
      title: "Mutual Growth",
      description:
        "We foster growth for both brands seeking engagement and users looking to earn through meaningful interactions.",
    },
    {
      icon: Zap,
      title: "Innovation-Driven",
      description:
        "We&apos;re constantly pushing the boundaries of gamified marketing through creative puzzle design and reward systems.",
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-10">
        {/* Hero Section */}
        <section className="py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 font-fredoka">
              Gamifying Brand Engagement with
              <span className="text-secondary"> Rewarding Puzzles</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/70 mb-8 max-w-3xl mx-auto px-4">
              Founded in 2024, BrandPuzzle revolutionizes how brands connect with their audiences. 
              We create engaging puzzle experiences where users have fun, brands get noticed, 
              and everyone wins through our innovative reward system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Link href={routes.REGISTER}>
                <GradientButton size="lg" className="w-full sm:w-auto">
                  Start Playing <ArrowRight className="ml-2 h-4 w-4" />
                </GradientButton>
              </Link>
              <Link href={routes.HOW_IT_WORKS}>
                <GradientButton variant="outline" size="lg" className="w-full sm:w-auto">
                  How It Works
                </GradientButton>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="bg-card/50 backdrop-blur-sm border-white/10 text-center">
                  <CardContent className="pt-6">
                    <Icon className="h-8 w-8 text-secondary mx-auto mb-4" />
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-2 font-fredoka">
                      {stat.value}
                    </div>
                    <div className="text-white/60 text-sm">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center px-4">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6 font-fredoka">
                Our Mission
              </h2>
              <p className="text-lg text-white/70 mb-6">
                We're on a mission to transform brand marketing through gamification,
                creating meaningful connections between brands and users while providing 
                fair earning opportunities for puzzle enthusiasts.
              </p>
              <p className="text-lg text-white/70 mb-8">
                Traditional advertising interrupts and annoys. We believe marketing should 
                be engaging, rewarding, and fun. Our platform creates win-win scenarios 
                where brands achieve authentic engagement while users enjoy themselves 
                and earn money for their participation.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-secondary rounded-full mt-3 mr-4"></div>
                  <div>
                    <h4 className="font-semibold text-white">
                      Engaging Experiences
                    </h4>
                    <p className="text-white/60">
                      Create memorable brand interactions through fun and challenging puzzles
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-secondary rounded-full mt-3 mr-4"></div>
                  <div>
                    <h4 className="font-semibold text-white">
                      Fair Rewards
                    </h4>
                    <p className="text-white/60">
                      Ensure users are fairly compensated for their time and engagement
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-secondary rounded-full mt-3 mr-4"></div>
                  <div>
                    <h4 className="font-semibold text-white">
                      Authentic Connections
                    </h4>
                    <p className="text-white/60">
                      Help brands build genuine relationships with their target audience
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <Card className="bg-card/50 backdrop-blur-sm border-white/10 p-8 h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Gamepad2 className="h-12 w-12 text-secondary" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 font-fredoka">
                    Puzzle-Powered Marketing
                  </h3>
                  <p className="text-white/60">
                    Our platform turns brand messages into engaging puzzle experiences 
                    that users actually want to participate in.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-10">
          <div className="px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4 font-fredoka">
                Our Values
              </h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                The principles that guide everything we do and every decision we make
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card key={index} className="text-center h-full bg-card/50 backdrop-blur-sm border-white/10">
                    <CardContent className="p-6">
                      <Icon className="h-10 w-10 text-secondary mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-3">
                        {value.title}
                      </h3>
                      <p className="text-white/60 text-sm">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-20">
          <Card className="bg-card/50 backdrop-blur-sm border-white/10 mx-4">
            <CardContent className="p-8 sm:p-12">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-white mb-4 font-fredoka">
                    Our Story
                  </h2>
                  <p className="text-lg text-white/70">
                    How we discovered the power of gamified marketing
                  </p>
                </div>

                <div className="space-y-6 text-white/70">
                  <p className="text-lg">
                    The idea for BrandPuzzle came from a simple observation: people love puzzles, 
                    but hate ads. We wondered - what if we could combine the two in a way that 
                    benefits everyone?
                  </p>
                  <p className="text-lg">
                    Traditional advertising interrupts our daily lives and often feels invasive. 
                    Meanwhile, millions of people spend hours playing mobile games and solving 
                    puzzles for free. We realized there was an opportunity to create something 
                    that users would actually enjoy while helping brands connect with their audience.
                  </p>
                  <p className="text-lg">
                    Our platform transforms brand messages into engaging puzzle experiences. 
                    Users get entertained and earn money, brands get authentic engagement, 
                    and everyone wins. It's marketing that people actually want to participate in.
                  </p>
                  <p className="text-lg">
                    Today, we're proud to host thousands of creative campaigns that bring joy 
                    to users while delivering real results for brands. We're proving that 
                    marketing doesn't have to be annoying - it can be fun, rewarding, and beneficial for all.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <Card className="bg-gradient-to-r from-[#6C5CE7] to-[#FF6B9D] text-white mx-4">
            <CardContent className="p-8 sm:p-12 text-center">
              <h2 className="text-3xl font-bold mb-4 font-fredoka">
                Join the Puzzle Revolution
              </h2>
              <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                Whether you're looking to earn money through fun puzzles or create 
                engaging campaigns for your brand, we'd love to have you join our community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`${routes.REGISTER}?type=user`}>
                  <GradientButton
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto">
                    Start Playing Puzzles
                  </GradientButton>
                </Link>
                <Link href={`${routes.REGISTER}?type=brand`}>
                  <GradientButton
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto">
                    Create Brand Campaigns
                  </GradientButton>
                </Link>
              </div>
              <div className="mt-8 pt-8 border-t border-white/20">
                <p className="text-white/90 mb-4">
                  Have questions? We'd love to hear from you.
                </p>
                <a
                  href="mailto:hello@brandpuzzle.com"
                  className="inline-flex items-center text-white hover:text-white/80 transition-colors">
                  <Mail className="h-4 w-4 mr-2" />
                  hello@brandpuzzle.com
                </a>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
}