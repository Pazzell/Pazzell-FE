"use client"

import Link from 'next/link'
import { LogoIcon } from '@/components/ui/logo-icon'
import { routes } from '@/app/_utils/routes'

export function Footer() {
  return (
    <footer className={"bg-background text-white py-16"}>
      <div className={"px-[5%]  mx-auto"}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-2xl font-bold font-fredoka">
              <LogoIcon />
              Pazzell
            </div>
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              <Link href={routes.HOME} className="text-white/60 hover:text-secondary transition-colors">Home</Link>
              <Link href={routes.ABOUT} className="text-white/60 hover:text-secondary transition-colors">About</Link>
              <Link href={`${routes.REGISTER}?type=user`} className="text-white/60 hover:text-secondary transition-colors">Play</Link>
              <Link href={`${routes.REGISTER}?type=brand`} className="text-white/60 hover:text-secondary transition-colors">For Brands</Link>
            </div>
            <p className="text-white/40 text-sm text-center md:text-left">
              © {new Date().getFullYear()} Pazzell. All rights reserved.
            </p>
          </div>
      </div>
    </footer>
  )
}