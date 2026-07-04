import type { Metadata } from "next";
import { Geist, Geist_Mono, Fragment_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/supabase/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fragmentMono = Fragment_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-fragment",
});

export const metadata: Metadata = {
  title: "Overlapse — timezone mission control",
  description: "Free, personal-scale, cross-platform timezone-coordination and meeting-scheduling tool for distributed groups. Golden Hours, Globe.gl, Supabase Realtime.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fragmentMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-zinc-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
