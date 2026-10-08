import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

// The whole site is set in one monospace face (terminal look).
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
    <html lang="en" className={geistMono.variable} suppressHydrationWarning>
      <head>
        {/* Runs before first paint:
            1. Re-apply a saved dark choice (light is the default).
            2. Always land on the name: drop any #section left in the URL by the nav, and stop the
               browser restoring the old scroll position on reload. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}if("scrollRestoration"in history)history.scrollRestoration="manual";if(location.hash)history.replaceState(null,"",location.pathname+location.search)})()`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
