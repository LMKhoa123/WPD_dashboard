import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster as SonnerToaster } from "sonner"
import { QueryProvider } from "@/components/query-provider"

export const metadata: Metadata = {
  title: "EV Service Center Management",
  description: "Professional EV Service Center Management Dashboard",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} p-8  ${GeistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
                <QueryProvider>
                  <Suspense fallback={null}>{children}</Suspense>
                </QueryProvider>
              </AuthProvider>
            </ThemeProvider>
            <SonnerToaster position="top-right" richColors />
        <Analytics />
      </body>
    </html>
  )
}
