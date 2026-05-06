import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import TanstackProvider from "@/providers/tanstack-provider";
import { Toaster } from "@/components/ui/sonner";
import { FloatingAnalytics } from "@/components/analytics/floating-analytics";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pazzell - Gamified Marketing Platform",
  description: "Play branded puzzle games and earn real rewards. Where brands create engaging campaigns and users earn money through fun puzzles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={inter.className}>
      <TanstackProvider>
      <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <FloatingAnalytics />
          <Toaster richColors/>
        </ThemeProvider>
      </TanstackProvider>
      </body>
    </html>
  );
}
