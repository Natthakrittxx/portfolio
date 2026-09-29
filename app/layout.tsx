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
  title: "Natthakrit Benjapatanamongkol · Robotics and AI",
  description:
    "Robotics and AI engineering student at KMITL building LLM tools. Research, projects, and contact links.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* Runs before first paint:
            1. Re-apply a saved dark choice (light is the default).
            2. Always land on the name: drop any #section left in the URL by the nav, and stop the
               browser restoring the old scroll position on reload.
            3. Flag Chromium (userAgentData is Chromium-only), the one engine that runs SVG filters in
               backdrop-filter, so the nav glass can refract. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}if("scrollRestoration"in history)history.scrollRestoration="manual";if(location.hash)history.replaceState(null,"",location.pathname+location.search);if(navigator.userAgentData)document.documentElement.dataset.refract=""})()`,
          }}
        />
        {/* Sentient (body serif) is on Fontshare, not Google Fonts, so next/font/google can't load it. */}
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=sentient@400,500&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
