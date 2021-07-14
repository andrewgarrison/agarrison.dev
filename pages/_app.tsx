import "tailwindcss/tailwind.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Header } from "../components/Header";
import { ThemeContextProvider } from "../contexts/ThemeContext";

function MyApp({ Component, pageProps }: AppProps) {
  if (typeof window === "undefined") return null;
  return (
    <ThemeContextProvider>
      <Head>
        <link rel="shortcut icon" href="/favicon.png" />
        <title>Andrew Garrison</title>
      </Head>
      <Header />
      <div className="container mx-auto w-800 p-4">
        <Component {...pageProps} />
      </div>
    </ThemeContextProvider>
  );
}

export default MyApp;
