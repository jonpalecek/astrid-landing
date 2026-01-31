import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Astrid — Your AI Executive Assistant",
  description: "Astrid means divine strength — and that's exactly what she brings to your day. A tireless AI assistant who captures your ideas, organizes your projects, and keeps you focused on what matters most.",
  keywords: ["AI assistant", "executive assistant", "productivity", "second brain", "personal assistant"],
  openGraph: {
    title: "Astrid — Your AI Executive Assistant",
    description: "Divine strength for busy minds. Capture ideas, organize projects, stay focused.",
    url: "https://getastrid.ai",
    siteName: "Astrid",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Astrid — Your AI Executive Assistant",
    description: "Divine strength for busy minds. Capture ideas, organize projects, stay focused.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
