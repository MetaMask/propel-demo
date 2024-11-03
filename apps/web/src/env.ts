import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { chainIdSchema } from "./lib/validators";
import { type WEB3AUTH_NETWORK_TYPE } from "@web3auth/base";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    CLERK_SECRET_KEY: z.string(),
    DATABASE_URL: z.string().url(),
    DEPLOYER_PRIVATE_KEY: z.custom<`0x${string}`>(),
    DAIMO_API_KEY: z.string(),
    UPLOADTHING_APPID: z.string(),
    UPLOADTHING_TOKEN: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_BUNDLER_URL: z.string().url(),
    NEXT_PUBLIC_CHAIN_ID: chainIdSchema,
    NEXT_PUBLIC_CHAIN_URL: z.string().url().default("http://127.0.0.1:8545"),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string(),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string(),
    NEXT_PUBLIC_PAYMASTER_URL: z.string().url(),
    NEXT_PUBLIC_WEB3AUTH_CLIENT_ID: z.string(),
    NEXT_PUBLIC_WEB3AUTH_NETWORK: z.custom<WEB3AUTH_NETWORK_TYPE>(),
    NEXT_PUBLIC_WEB3AUTH_VERIFIER: z.string(),
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    DEPLOYER_PRIVATE_KEY: process.env.DEPLOYER_PRIVATE_KEY,
    DAIMO_API_KEY: process.env.DAIMO_API_KEY,
    UPLOADTHING_APPID: process.env.UPLOADTHING_APPID,
    UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
    NEXT_PUBLIC_BUNDLER_URL: process.env.NEXT_PUBLIC_BUNDLER_URL,
    NEXT_PUBLIC_CHAIN_ID: Number(process.env.NEXT_PUBLIC_CHAIN_ID),
    NEXT_PUBLIC_CHAIN_URL: process.env.NEXT_PUBLIC_CHAIN_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_PAYMASTER_URL: process.env.NEXT_PUBLIC_PAYMASTER_URL,
    NEXT_PUBLIC_WEB3AUTH_CLIENT_ID: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID,
    NEXT_PUBLIC_WEB3AUTH_NETWORK: process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK,
    NEXT_PUBLIC_WEB3AUTH_VERIFIER: process.env.NEXT_PUBLIC_WEB3AUTH_VERIFIER,
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
