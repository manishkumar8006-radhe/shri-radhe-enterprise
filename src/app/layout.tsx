import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import SupabaseProvider from "@/lib/supabase-provider";
import { Toaster } from "sonner"; // ✅ Notification component

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Human Resource Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* ✅ SupabaseProvider SHOULD WRAP children */}
        <SupabaseProvider>
          {children}
          <Toaster />
        </SupabaseProvider>

        {/* ✅ App Portals */}
        <div id="modal-root" />
        <div id="portal-root" />
        <div id="tooltip-root" />
        <div id="popover-root" />
        <div id="dropdown-root" />
        <div id="toast-root" />
        <div id="context-menu-root" />
        <div id="dialog-root" />
        <div id="alert-root" />
        <div id="select-root" />
        <div id="accordion-root" />
        <div id="tabs-root" />
        <div id="carousel-root" />
        <div id="tree-root" />
        <div id="badge-root" />
        <div id="progress-root" />
        <div id="skeleton-root" />
        <div id="slider-root" />
        <div id="switch-root" />
        <div id="spinner-root" />
      </body>
    </html>
  );
}
