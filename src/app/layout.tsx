import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import TanstackProvider from "@/providers/tanstack-provider";
import { Toaster } from "@/components/ui/sonner";
import { FloatingAnalytics } from "@/components/analytics/floating-analytics";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pazzell - Brain-Training Games",
  description: "Brain-training games for sharper thinking: Match for little ones and Trivia for everyone. Study, play and build your own.",
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
