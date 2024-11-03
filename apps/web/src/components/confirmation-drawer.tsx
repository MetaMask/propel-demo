"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "./credenza";

interface ConfirmationDrawerProps {
  children: React.ReactNode;
  title: string;
  description: string;
  onConfirm: () => void;
  isLoading: boolean;
  confirmButtonText: string;
  cancelButtonText?: string;
}

export function ConfirmationDrawer({
  children,
  title,
  description,
  onConfirm,
  isLoading,
  confirmButtonText,
  cancelButtonText = "Cancel",
}: ConfirmationDrawerProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  const content = (
    <>
      <p>{description}</p>
      <div className="mt-4 mb-2 flex flex-col space-y-2">
        <Button
            variant="default"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1"
          >
          {isLoading ? "Processing..." : confirmButtonText}
        </Button>
        <Button
          variant="outline"
          onClick={() => setOpen(false)}
          className="flex-1"
        >
          {cancelButtonText}
        </Button>
      </div>
    </>
  );

  return (
    <Credenza open={open} onOpenChange={setOpen}>
      <CredenzaTrigger asChild>{children}</CredenzaTrigger>
      <CredenzaContent className="text-left">
        <CredenzaHeader>
          <CredenzaTitle>{title}</CredenzaTitle>
        </CredenzaHeader>
        <CredenzaBody className="pb-2">{content}</CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}
