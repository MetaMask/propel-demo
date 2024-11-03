import { type Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/toaster";
import { WagmiProvider } from "@/providers/wagmi";
import { TRPCReactProvider } from "@/trpc/react";
import DaimoProvider from "@/providers/daimo";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import "@/styles/globals.css";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Propel",
  description: "Propose, bid on and fund events for your community",
  openGraph: {
    siteName: "Propel",
    title: "Propel",
    description: "Propose, bid on and fund events for your community",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "Propel",
    description: "Propose, bid on and fund events for your community",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <WagmiProvider>
          <TRPCReactProvider>
            <DaimoProvider>
              <body>
                <NextSSRPlugin
                  routerConfig={extractRouterConfig(ourFileRouter)}
                />
                {children}
                <Toaster />
              </body>
            </DaimoProvider>
          </TRPCReactProvider>
        </WagmiProvider>
      </html>
    </ClerkProvider>
  );
}
