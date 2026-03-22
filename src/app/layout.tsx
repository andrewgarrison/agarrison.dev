import type { Metadata } from "next";
import { Playfair_Display, Libre_Franklin } from "next/font/google";
import "./globals.css";
import { Dock } from "@/components/layout/Dock";
import { WindowFrame } from "@/components/layout/WindowFrame";
import { ThemeProvider } from "@/context/ThemeContext";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const libreFranklin = Libre_Franklin({
  variable: "--font-libre",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Andrew Garrison",
  description: "Portfolio",
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${playfair.variable} ${libreFranklin.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <WindowFrame>
            {children}
          </WindowFrame>
          <ThemeToggle />
          <Dock />
        </ThemeProvider>
      </body>
    </html>
  );
}
