"use client";

import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { type Pledge, Status, type Event } from "@/lib/types";
import { api } from "@/trpc/react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import QRCode from "react-qr-code";
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "../credenza";
import { Button } from "../ui/button";

export const GenerateCoverMeDrawer = ({
  event,
  myPledge,
}: {
  event: Event;
  myPledge?: Pledge | null;
}) => {
  const [link, setLink] = useState<string>("");
  const { userId } = useAuth();
  const { data: wallet } = useWallet();
  const { toast } = useToast();
  const clerk = useClerk();
  const canPledge = event.status === Status.ACTIVE && !!!myPledge;

  const onShareLink = () => {
    void navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    });
  };

  const { mutate: generateLink, isPending } = api.coverMe.create.useMutation({
    onSuccess: (data) => {
      if (!data) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate link",
        });
        return;
      }
      const url = `${window.location.origin}/cover/${data.id}`;
      setLink(url);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  if (event.pledgePrice === 0) {
    return null;
  }

  return (
    <Credenza>
      <CredenzaTrigger asChild>
        <Button
          variant="outline"
          disabled={(!wallet && !!userId) || !canPledge}
          onClick={async (ev) => {
            if (!userId) {
              ev.preventDefault();
              await clerk.redirectToSignIn();
            }
          }}
        >
          Cover my pledge
        </Button>
      </CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader>
          <CredenzaTitle>Cover Me</CredenzaTitle>
          <CredenzaDescription>
            Don&apos;t have funds yet? Request a friend to pledge on your
            behalf.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="flex flex-col gap-4">
          {link ? (
            <div className="flex flex-col items-center gap-4">
              <QRCode value={link} />
              <Button onClick={onShareLink} className="w-full">
                Copy Link
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => generateLink({ eventId: event.id })}
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  Generating
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
              ) : (
                "Generate Link"
              )}
            </Button>
          )}
        </CredenzaBody>
        <CredenzaFooter>
          <CredenzaClose asChild>
            <Button variant="outline">Cancel</Button>
          </CredenzaClose>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
};
