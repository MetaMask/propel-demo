"use client";

import { Scanner, type IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import {
  type Event,
  type QRCodeTicketData,
  type PublicUser,
  Status,
} from "@/lib/types";
import { isQRCodeTicketFormatValid } from "@/lib/utils";
import { api } from "@/trpc/react";
import { getProposalNFTs } from "@/lib/proposalNFT";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/credenza";
import { Loader2Icon, MailIcon, User2Icon, UserIcon } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export function EventTicketScanner({ event }: { event: Event }) {
  const { user } = useUser();
  const isUserCreator = event.userId === user?.id;

  if (!isUserCreator || event.status !== Status.COMPLETED) {
    return null;
  }

  return (
    <Credenza>
      <CredenzaTrigger asChild>
        <Button className="w-full">Scan Ticket</Button>
      </CredenzaTrigger>
      <CredenzaContent className="max-h-[95dvh]">
        <CredenzaHeader className="pb-4 text-left">
          <CredenzaTitle>Scan Ticket</CredenzaTitle>
          <CredenzaDescription className="text-left">
            Scan the QR code of your ticket to verify your attendance.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody className="pb-2">
          <EventQRScanner event={event} />
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}

export const EventQRScanner = ({ event }: { event: Event }) => {
  const [scannedData, setScannedData] = useState<QRCodeTicketData | null>(null);
  const { proposalAddress: eventId } = event;

  const handleScan = (data: IDetectedBarcode[]) => {
    const scannedData = data[0]?.rawValue;
    if (scannedData) {
      try {
        const parsedScannedData = JSON.parse(scannedData) as QRCodeTicketData;
        if (
          isQRCodeTicketFormatValid(scannedData) &&
          parsedScannedData.eventId === eventId
        ) {
          setScannedData(parsedScannedData);
        } else if (parsedScannedData.eventId !== eventId) {
          toast({
            title: "Error",
            description: "The scanned QR code is not for this proposal",
          });
          setScannedData(null);
        } else {
          toast({
            title: "Error",
            description: "The scanned QR code is not in the correct format",
          });
          setScannedData(null);
        }
      } catch {
        toast({
          title: "Error",
          description: "The scanned QR code is not in the correct format",
        });
        setScannedData(null);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Scanner
        onScan={handleScan}
        styles={{
          container: {
            backgroundColor: "black",
            height: "100%",
            aspectRatio: 1,
          },
        }}
      />
      {!!scannedData ? (
        <TicketValidationResult scannedData={scannedData} />
      ) : (
        <WaitingForTicket />
      )}
    </div>
  );
};

interface TicketValidationResultProps {
  scannedData: QRCodeTicketData;
}

export function TicketValidationResult({
  scannedData: { userId, eventId },
}: TicketValidationResultProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    data: user,
    isLoading: isUserLoading,
    error,
  } = api.clerk.byId.useQuery({
    id: userId,
  });

  useEffect(() => {
    const validateTicket = async () => {
      setIsValid(null);
      setIsLoading(true);
      if (isUserLoading || !user || !userId || !user.walletAddress) {
        return;
      }
      if (error) {
        setIsValid(false);
        toast({
          title: "Error",
          description:
            "User information could not be retrieved. Please try again.",
        });
        console.error(error);
        return;
      }

      const nfts = await getProposalNFTs(user.walletAddress);
      const hasTicket = nfts.some((nft) => nft.proposalId === eventId);
      setIsValid(hasTicket);
      setIsLoading(false);
    };

    void validateTicket();
  }, [error, eventId, isUserLoading, user, userId]);

  if (!isLoading && isValid === false) {
    return <NoTicket />;
  }

  if (user && isValid) {
    return <ValidTicket userData={user} />;
  }

  return <ValidatingTicket />;
}

function ValidatingTicket() {
  return (
    <Card className="h-32">
      <CardHeader>
        <CardTitle className="text-gray-500">Validating Ticket...</CardTitle>
      </CardHeader>
      <CardContent>
        <Loader2Icon className="h-16 w-16 animate-spin" />
      </CardContent>
    </Card>
  );
}

function WaitingForTicket() {
  return (
    <Card className="h-32">
      <CardHeader>
        <CardTitle className="text-gray-500">Scan Ticket</CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          Please scan the ticket QR code to verify a person&apos;s attendance.
        </p>
      </CardContent>
    </Card>
  );
}

function NoTicket() {
  return (
    <Card className="h-32">
      <CardHeader>
        <CardTitle className="text-red-500">No Ticket Found</CardTitle>
      </CardHeader>
      <CardContent>
        <p>The user does not have a valid ticket for this proposal.</p>
      </CardContent>
    </Card>
  );
}

function ValidTicket({ userData }: { userData: PublicUser }) {
  return (
    <Card className="h-32">
      <CardHeader>
        <CardTitle className="text-green-500">Valid Ticket</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Avatar className="mr-1 h-16 w-16">
          <AvatarImage src={userData.imageUrl} />
          <AvatarFallback>
            <User2Icon />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1">
            <UserIcon className="h-4 w-4" />
            {userData.name}
          </div>
          <div className="flex items-center gap-1">
            <MailIcon className="h-4 w-4" />
            {userData.email}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
