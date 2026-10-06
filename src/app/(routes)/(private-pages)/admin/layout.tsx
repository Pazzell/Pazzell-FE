'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAtomValue, useSetAtom } from 'jotai'
import { userAtom } from '@/atom/user'
import { LogoIcon } from '@/components/ui/logo-icon'
import {
  LayoutDashboard,
  BookOpen,
  Puzzle,
  Megaphone,
  Settings,
  Menu,
  X,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { routes } from '@/app/_utils/routes'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const sidebarNavItems = [
  { title: 'Dashboard', href: routes.ADMIN.DASHBOARD, icon: LayoutDashboard },
  { title: 'Trivia Topics', href: routes.ADMIN.TOPICS, icon: BookOpen },
  { title: 'Match Levels', href: routes.ADMIN.MATCH_LEVELS, icon: Puzzle },
  { title: 'Campaigns', href: routes.ADMIN.CAMPAIGNS, icon: Megaphone },
  { title: 'Settings', href: routes.ADMIN.SETTINGS, icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const user = useAtomValue(userAtom)
  const setUser = useSetAtom(userAtom)
  const router = useRouter()

  useEffect(() => {
    if (user && user.userType !== 'admin') {
      if (user.userType === 'brand') {
        router.push(routes.BRAND.DASHBOARD)
      } else {
        router.push(routes.USER.HOME)
      }
    }
  }, [user, router])

  const handleLogout = () => {
    setUser(null)
    router.push(routes.HOME)
  }

  if (user && user.userType !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-white/10">
          <div className="flex flex-col h-full px-6 py-8">
            <div className="flex items-center gap-2 text-2xl font-bold text-white font-fredoka mb-8">
              <LogoIcon />
              Pazzell
            </div>

            <nav className="flex-1 space-y-2">
              {sidebarNavItems.map((item, index) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={`desktop-${item.href}-${index}`}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-secondary/20 text-secondary border border-secondary/30'
                        : 'text-white/70 hover:text-secondary hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                )
              })}
            </nav>

            <div className="pt-6 border-t border-white/10">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-white/10 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform lg:hidden`}>
          <div className="flex flex-col h-full px-6 py-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2 text-xl font-bold text-white font-fredoka">
                <LogoIcon />
                Pazzell
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-2">
              {sidebarNavItems.map((item, index) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={`mobile-${item.href}-${index}`}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-secondary/20 text-secondary border border-secondary/30'
                        : 'text-white/70 hover:text-secondary hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                )
              })}
            </nav>

            <div className="pt-6 border-t border-white/10">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:pl-64">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="text-white/70 hover:text-white"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 flex justify-end">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 px-2 hover:bg-white/5"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-secondary/20 flex items-center justify-center shrink-0">
                        <ShieldCheck className="h-4 w-4 text-secondary" />
                      </div>
                      <span className="hidden sm:inline text-white text-sm font-medium">
                        {user?.fullName || 'Admin'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-medium">{user?.fullName || 'Admin'}</span>
                        {user?.email && (
                          <span className="text-sm text-muted-foreground font-normal">
                            {user.email}
                          </span>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
