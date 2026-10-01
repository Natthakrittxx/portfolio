import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Sentient (body serif) is from Fontshare (ITF Free Font License), self-hosted so it ships with the
// page: no third-party stylesheet blocking first paint, and a metric-matched fallback while it loads.
const sentient = localFont({
  src: [
    { path: "./fonts/sentient-400.woff2", weight: "400" },
    { path: "./fonts/sentient-500.woff2", weight: "500" },
  ],
  variable: "--font-sentient",
  adjustFontFallback: "Times New Roman",
});

export const metadata: Metadata = {
  title: "Natthakrit Benjapatanamongkol · Robotics and AI",
  description:
    "Robotics and AI engineering student at KMITL building LLM tools. Research, projects, and contact links.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${sentient.variable}`}
      suppressHydrationWarning
    >
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
      </head>
      <body>{children}</body>
    </html>
  );
}
