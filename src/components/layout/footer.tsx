"use client"

import Link from 'next/link'
import { LogoIcon } from '@/components/ui/logo-icon'
import { routes } from '@/app/_utils/routes'
import { usePathname } from 'next/navigation'

export function Footer() {
  const pathname = usePathname()
  const isHomePage = pathname === routes.HOME

  return (
    <footer className={"bg-background text-white py-16"}>
      <div className={"px-[5%]  mx-auto"}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-2xl font-bold font-fredoka">
              <LogoIcon />
              Pazzell
            </div>
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              <Link href={routes.ABOUT} className="text-white/60 hover:text-secondary transition-colors">About</Link>
              <a href="#" className="text-white/60 hover:text-secondary transition-colors">Blog</a>
              <a href="#" className="text-white/60 hover:text-secondary transition-colors">Help Center</a>
              <a href="#" className="text-white/60 hover:text-secondary transition-colors">Privacy</a>
              <a href="#" className="text-white/60 hover:text-secondary transition-colors">Terms</a>
            </div>
            <p className="text-white/40 text-sm text-center md:text-left">© 2025 Pazzell. All rights reserved.</p>
          </div>
        {/* : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <Link href={routes.HOME} className="text-2xl font-bold text-primary flex items-center gap-2">
                  <LogoIcon />
                  BrandPuzzle
                </Link>
                <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm max-w-md">
                  Gamified marketing platform where brands create engaging puzzle campaigns 
                  and users earn money by playing them. Fun marketing that benefits everyone.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">For Users</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li><Link href={`${routes.REGISTER}?type=user`} className="hover:text-gray-900 dark:hover:text-gray-200">Join as User</Link></li>
                  <li><Link href="/#for-users" className="hover:text-gray-900 dark:hover:text-gray-200">How it Works</Link></li>
                  <li><Link href={routes.USER.PUZZLES} className="hover:text-gray-900 dark:hover:text-gray-200">Play Puzzles</Link></li>
                  <li><Link href={routes.USER.EARNINGS} className="hover:text-gray-900 dark:hover:text-gray-200">Track Earnings</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">For Brands</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li><Link href={`${routes.REGISTER}?type=brand`} className="hover:text-gray-900 dark:hover:text-gray-200">Join as Brand</Link></li>
                  <li><Link href="/#for-brands" className="hover:text-gray-900 dark:hover:text-gray-200">How it Works</Link></li>
                  <li><Link href={routes.BRAND.CAMPAIGNS} className="hover:text-gray-900 dark:hover:text-gray-200">Create Campaigns</Link></li>
                  <li><Link href={routes.BRAND.ANALYTICS} className="hover:text-gray-900 dark:hover:text-gray-200">View Analytics</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t dark:border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                © 2025 BrandPuzzle. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <Link href={routes.ABOUT} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">About</Link>
                <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">Privacy Policy</a>
                <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">Terms of Service</a>
              </div>
            </div>
          </>
        )} */}
      </div>
    </footer>
  )
}