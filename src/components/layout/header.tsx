"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/ui/logo-icon";
import { User, Menu, LogOut, X, Trophy, Settings, Wallet, MessageSquare } from "lucide-react";
import { routes } from "@/app/_utils/routes";
import { useAtomValue, useSetAtom } from "jotai/react";
import { userAtom } from "@/atom/user";
import { useRouter, usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const user = useAtomValue(userAtom);
  const setUser = useSetAtom(userAtom);
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const userType = user?.userType;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Enable real-time notifications via WebSocket
  // NOTE: Disabled until notification system is fully configured
  // useNotificationSocket(user?._id)

  const handleLogout = () => {
    setUser(null);
    router.push(routes.HOME);
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-none">
      <div className="px-[5%]">
        <div className="flex h-24 items-center justify-between">
          <div className="flex items-center">
            <Link
              href={routes.HOME}
              className="flex items-center gap-2 text-2xl font-bold text-white font-fredoka">
              <LogoIcon />
              Pazzell
            </Link>
          </div>

          <nav className="hidden lg:flex items-center space-x-8">
            {isMounted && userType === "gamer" ? (
              <>
                <Link
                  href={routes.USER.DASHBOARD}
                  className="text-white hover:text-secondary font-medium transition-colors">
                  Dashboard
                </Link>
                <Link
                  href={routes.CAMPAIGNS}
                  className="text-white hover:text-secondary font-medium transition-colors">
                  Campaigns
                </Link>
                <Link
                  href={routes.LEADERBOARD}
                  className="text-white hover:text-secondary font-medium transition-colors">
                  Leaderboard
                </Link>
                <Link
                  href={routes.USER.REFERRALS}
                  className="text-white hover:text-secondary font-medium transition-colors">
                  Referrals
                </Link>
                <Link
                  href={routes.USER.WALLET}
                  className="text-white hover:text-secondary font-medium transition-colors">
                  Wallet
                </Link>
                <Link
                  href={routes.USER.FORUM}
                  className="text-white hover:text-secondary font-medium transition-colors">
                  Forum
                </Link>
                {/* <Link href={routes.USER.BADGES} className="text-white hover:text-secondary font-medium transition-colors">
                  Badges
                </Link> */}
              </>
            ) : (
              <>
                <Link
                  href={routes.HOME}
                  className="text-white hover:text-secondary font-medium transition-colors">
                  Home
                </Link>
                <Link
                  href={routes.CAMPAIGNS}
                  className="text-white hover:text-secondary font-medium transition-colors">
                  Campaigns
                </Link>
                <Link
                  href={routes.LEADERBOARD}
                  className="text-white hover:text-secondary font-medium transition-colors">
                  Leaderboard
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {isMounted && userType ? (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative hover:bg-transparent">
                      {user?.avatar ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden">
                          <img
                            src={user.avatar}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {user?.fullName || user?.email || "Account"}
                        </span>
                        {user?.username && (
                          <span className="text-sm text-muted-foreground font-normal">
                            @{user.username}
                          </span>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {userType === "gamer" && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href={routes.USER.PROFILE}>Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={routes.USER.WALLET}>
                            <Wallet className="h-4 w-4 mr-2" />
                            Wallet
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={routes.USER.SETTINGS}>
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="lg:flex items-center space-x-2 hidden ">
                <Link href={routes.LOGIN}>
                  <Button
                    variant="ghost"
                    className="text-white hover:text-secondary hover:bg-transparent font-semibold text-base font-fredoka py-5 px-5">
                    Login
                  </Button>
                </Link>
                <Link href={`${routes.REGISTER}?type=user`}>
                  <Button
                    variant="outline"
                    className="border-2 border-secondary text-white hover:bg-secondary hover:text-secondary-foreground font-semibold rounded-full text-base font-fredoka py-5 px-7">
                    Play Now
                  </Button>
                </Link>
                <Link href={`${routes.REGISTER}?type=brand`}>
                  <Button className="bg-gradient-to-r from-[#6C5CE7] to-[#FF6B9D] text-white font-semibold rounded-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-base font-fredoka py-5 px-7">
                    Create Campaign
                  </Button>
                </Link>
              </div>
            )}

            <div
              // variant="ghost"
              className="lg:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? (
                <X className="h-8 w-8" />
              ) : (
                <Menu className="h-8 w-8" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background/95 backdrop-blur-sm border-b border-white/10">
          <div className="px-[5%] py-4">
            <nav className="space-y-1">
              {isMounted && userType === "gamer" ? (
                <>
                  <Link
                    href={routes.USER.DASHBOARD}
                    className="block text-white hover:text-secondary hover:bg-white/5 py-3 px-2 rounded-md transition-colors"
                    onClick={closeMobileMenu}>
                    Dashboard
                  </Link>
                  <Link
                    href={routes.CAMPAIGNS}
                    className="block text-white hover:text-secondary hover:bg-white/5 py-3 px-2 rounded-md transition-colors"
                    onClick={closeMobileMenu}>
                    Campaigns
                  </Link>
                  <Link
                    href={routes.LEADERBOARD}
                    className="block text-white hover:text-secondary hover:bg-white/5 py-3 px-2 rounded-md transition-colors"
                    onClick={closeMobileMenu}>
                    Leaderboard
                  </Link>
                  <Link
                    href={routes.USER.REFERRALS}
                    className="block text-white hover:text-secondary hover:bg-white/5 py-3 px-2 rounded-md transition-colors"
                    onClick={closeMobileMenu}>
                    Referrals
                  </Link>
                  <Link
                    href={routes.USER.WALLET}
                    className="block text-white hover:text-secondary hover:bg-white/5 py-3 px-2 rounded-md transition-colors"
                    onClick={closeMobileMenu}>
                    Wallet
                  </Link>
                  <Link
                    href={routes.USER.FORUM}
                    className="block text-white hover:text-secondary hover:bg-white/5 py-3 px-2 rounded-md transition-colors"
                    onClick={closeMobileMenu}>
                    Forum
                  </Link>
                  {/* <Link
                    href={routes.USER.BADGES}
                    className="block text-white hover:text-secondary hover:bg-white/5 py-3 px-2 rounded-md transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Badges
                  </Link> */}
                  <Link
                    href={routes.USER.PROFILE}
                    className="block text-white hover:text-secondary hover:bg-white/5 py-3 px-2 rounded-md transition-colors"
                    onClick={closeMobileMenu}>
                    Profile
                  </Link>
                  <Link
                    href={routes.USER.SETTINGS}
                    className="block text-white hover:text-secondary hover:bg-white/5 py-3 px-2 rounded-md transition-colors"
                    onClick={closeMobileMenu}>
                    Settings
                  </Link>
                  {userType && (
                    <div className="border-t border-white/10 pt-4 space-y-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center text-red-400 hover:text-red-300 hover:bg-red-500/10 py-3 px-2 rounded-md transition-colors w-full">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : isMounted && userType === "brand" ? (
                <>
                  <Link
                    href={routes.BRAND.DASHBOARD}
                    className="block text-white hover:text-secondary hover:bg-white/5 py-3 px-2 rounded-md transition-colors"
                    onClick={closeMobileMenu}>
                    Dashboard
                  </Link>
                  <Link
                    href={routes.BRAND.CAMPAIGNS}
                    className="block text-white hover:text-secondary hover:bg-white/5 py-3 px-2 rounded-md transition-colors"
                    onClick={closeMobileMenu}>
                    Campaigns
                  </Link>
                  <Link
                    href={routes.BRAND.ANALYTICS}
                    className="block text-white hover:text-secondary hover:bg-white/5 py-3 px-2 rounded-md transition-colors"
                    onClick={closeMobileMenu}>
                    Analytics
                  </Link>
                  {userType && (
                    <div className="border-t border-white/10 pt-4 space-y-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center text-red-400 hover:text-red-300 hover:bg-red-500/10 py-3 px-2 rounded-md transition-colors w-full">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <a
                    href="#for-brands"
                    className="block py-3 px-2 rounded-md transition-colors text-white hover:text-secondary hover:bg-white/5"
                    onClick={closeMobileMenu}>
                    For Brands
                  </a>
                  <a
                    href="#for-players"
                    className="block py-3 px-2 rounded-md transition-colors text-white hover:text-secondary hover:bg-white/5"
                    onClick={closeMobileMenu}>
                    For Players
                  </a>
                  <Link
                    href={routes.CAMPAIGNS}
                    className="block py-3 px-2 rounded-md transition-colors text-white hover:text-secondary hover:bg-white/5"
                    onClick={closeMobileMenu}>
                    Campaigns
                  </Link>
                  <Link
                    href={routes.LEADERBOARD}
                    className="block py-3 px-2 rounded-md transition-colors text-white hover:text-secondary hover:bg-white/5"
                    onClick={closeMobileMenu}>
                    Leaderboard
                  </Link>
                  <div className="border-t border-white/10 pt-4 flex flex-col space-y-2">
                    <Link href={routes.LOGIN} onClick={closeMobileMenu}>
                      <Button
                        variant="ghost"
                        className="w-full text-white hover:text-secondary hover:bg-white/5 font-fredoka justify-start">
                        Login
                      </Button>
                    </Link>
                    <Link
                      href={`${routes.REGISTER}?type=user`}
                      onClick={closeMobileMenu}>
                      <Button
                        variant="outline"
                        className="w-full border-secondary text-white hover:bg-secondary hover:text-secondary-foreground font-fredoka">
                        Play Now
                      </Button>
                    </Link>
                    <Link
                      href={`${routes.REGISTER}?type=brand`}
                      onClick={closeMobileMenu}>
                      <Button className="w-full bg-gradient-to-r from-[#6C5CE7] to-[#FF6B9D] text-white font-fredoka">
                        Create Campaign
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
