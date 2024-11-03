"use client";

import { DaimoPayProvider } from "@daimo/pay";

export default function DaimoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DaimoPayProvider>{children}</DaimoPayProvider>;
}
