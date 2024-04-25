import { api } from "~/utils/api";
import Head from "next/head";
import "~/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";
import { ThemeProvider } from "../lib/theme-provider";

export const metadata = {
  title: "Patense.ai",
  description: "AI Patent Assistant",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <Component {...pageProps} />
      </ThemeProvider>
    </ClerkProvider>
  );
}

export default api.withTRPC(MyApp);
