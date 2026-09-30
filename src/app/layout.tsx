import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { HpxNavbar } from "@/components/navbar";
import { HpxThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hyperiux Animated",
  description: "Hyperiux components with Motion and GSAP animations",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <HpxThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <HpxNavbar />
          {children}
        </HpxThemeProvider>
      </body>
    </html>
  );
}
