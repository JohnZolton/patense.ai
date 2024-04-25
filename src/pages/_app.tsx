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

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

if (typeof window !== "undefined") {
  // checks that we are client-side
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") posthog.debug(); // debug mode in development
    },
  });
}
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <PostHogProvider client={posthog}>
          <Component {...pageProps} />
        </PostHogProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}

export default api.withTRPC(MyApp);
