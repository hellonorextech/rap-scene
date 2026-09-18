import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://your-vercel-domain.vercel.app"),

  title: {
    default: "RAP SCENE",
    template: "%s | RAP SCENE",
  },

  description:
    "RAP SCENE is a digital platform for Filipino rap and hip-hop, featuring artists, music, charts, music videos, albums, news, and the latest from the Philippine rap scene.",

  applicationName: "RAP SCENE",

  keywords: [
    "RAP SCENE",
    "Filipino rap",
    "Philippine rap",
    "Filipino hip-hop",
    "OPM rap",
    "Pinoy hip-hop",
    "Filipino artists",
    "Philippine music",
    "rap charts",
    "Billboard Philippines",
  ],

  authors: [
    {
      name: "RAP SCENE",
    },
  ],

  creator: "RAP SCENE",
  publisher: "RAP SCENE",

  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },

  openGraph: {
    title: "RAP SCENE",
    description:
      "Filipino rap, hip-hop, artists, music, charts, music videos, albums, and the latest stories from the scene.",
    siteName: "RAP SCENE",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "RAP SCENE",
    description:
      "Filipino rap, hip-hop, artists, music, charts, music videos, albums, and the latest stories from the scene.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}