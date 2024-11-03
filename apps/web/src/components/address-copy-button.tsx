"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface AddressCopyButtonProps {
  address: string;
}

export function AddressCopyButton({ address }: AddressCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 7)}...${addr.slice(-5)}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 5000); // Reset after 5 seconds
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full bg-[#E6F1FA]/80 px-4 text-xs font-medium text-[#0476C9] hover:bg-[#D1E9F7] hover:text-[#0476C9]"
      onClick={copyToClipboard}
    >
      {shortenAddress(address)}
      {copied ? (
        <Check className="ml-2 h-4 w-4" />
      ) : (
        <Copy className="ml-2 h-4 w-4" />
      )}
    </Button>
  );
}
