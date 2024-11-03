import { env } from "@/env";

export const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.NODE_ENV === "production") return getProductionUrl();
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

export const getProductionUrl = () => {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "https://propelevents.io";
};

export const isHostedImage = (url: string) => {
  return (
    url.startsWith("https://utfs.io/f/") ||
    url.startsWith(`https://utfs.io/a/${env.UPLOADTHING_APPID}`)
  );
};
