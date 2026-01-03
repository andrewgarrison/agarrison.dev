import type { Metadata } from "next";
import { Playfair_Display, Libre_Franklin } from "next/font/google";
import "./globals.css";
import { Dock } from "@/components/layout/Dock";
import { WindowFrame } from "@/components/layout/WindowFrame";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${libreFranklin.variable} font-sans antialiased`}
      >
        <WindowFrame>
          {children}
        </WindowFrame>
        <Dock />
      </body>
    </html>
  );
}
