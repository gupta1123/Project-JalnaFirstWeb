import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { AccentInit } from "@/components/AccentInit";
// Accent is initialized globally to persist selections across sessions.

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "my Jalna",
    template: "%s – my Jalna",
  },
  applicationName: "my Jalna",
  description: "my Jalna Admin Panel",
  icons: {
    icon: [
      { url: "/MyJalna.png", type: "image/png" },
    ],
    shortcut: "/MyJalna.png",
    apple: "/MyJalna.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          storageKey="my-jalna-theme"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AccentInit />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
