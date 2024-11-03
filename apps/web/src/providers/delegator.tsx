"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { type DeleGatorClient } from "@codefi/delegator-core-viem";
import { web3auth } from "@/lib/web3auth";
import { getDelegatorClientFromProvider } from "@/lib/delegator";
import { type IProvider } from "@web3auth/base";
import { api } from "@/trpc/react";
import { env } from "@/env";
import { useAuth, useUser } from "@clerk/nextjs";

interface DelegatorCtx {
  delegatorClient: DeleGatorClient | null;
}

const DelegatorContext = createContext<DelegatorCtx | null>(null);

export const DelegatorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <DelegatorProviderInner>{children}</DelegatorProviderInner>;
};

const DelegatorProviderInner: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [initialized, setInitialized] = useState(false);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [gatorClient, setGatorClient] = useState<DeleGatorClient | null>(null);
  const { mutateAsync: setUserWalletAddress } =
    api.clerk.updateWalletAddress.useMutation();

  const userEmail = user?.primaryEmailAddress?.emailAddress;

  // This useEffect initializes Web3Auth once the user is signed in.
  useEffect(() => {
    if (!userEmail) {
      return;
    }
    const initWeb3auth = async () => {
      if (web3auth.status === "not_ready") {
        console.log("Initializing web3auth...");
        await web3auth.init();
        console.log("Web3auth initialized!");
        setInitialized(true);
      }
    };
    initWeb3auth().catch(console.error);
  }, [userEmail]);

  // This useEffect connects Web3Auth after Web3Auth is initialized.
  useEffect(() => {
    if (!userEmail || !initialized) {
      return;
    }
    const connectWeb3auth = async () => {
      console.log("Connecting web3auth...");
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Failed to get auth token");
        }
        let p: IProvider | null = null;
        if (!web3auth.connected) {
          console.log("New web3auth connection...");
          p = await web3auth.connect({
            verifier: env.NEXT_PUBLIC_WEB3AUTH_VERIFIER,
            verifierId: userEmail,
            idToken: token,
          });
        } else {
          console.log("Using existing web3auth provider...");
          p = web3auth.provider;
        }
        console.log("Web3auth connected!");
        setProvider(p);
      } catch (error) {
        console.error("Failed to connect web3auth:", error);
      }
    };
    connectWeb3auth().catch(console.error);
  }, [getToken, initialized, userEmail]);

  // This useEffect initializes the delegator client once Web3Auth is connected
  // and we have a valid provider.
  useEffect(() => {
    if (!provider) {
      setGatorClient(null);
      return;
    }
    const initDelegator = async () => {
      console.log("Initializing delegator client...");
      try {
        const delegatorClient = await getDelegatorClientFromProvider(provider);
        console.log("Delegator client initialized!");
        setGatorClient(delegatorClient);
        await setUserWalletAddress({
          walletAddress: delegatorClient.account.address,
        });
      } catch (error) {
        console.error("Failed to initialize gator:", error);
      }
    };
    initDelegator().catch(console.error);
  }, [provider, setUserWalletAddress]);

  return (
    <DelegatorContext.Provider value={{ delegatorClient: gatorClient }}>
      {children}
    </DelegatorContext.Provider>
  );
};

export const useDelegator = () => {
  const ctx = useContext(DelegatorContext);
  if (!ctx) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return ctx;
};
