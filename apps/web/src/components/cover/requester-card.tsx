import { type PublicUser } from "@/lib/types";
import { MailIcon, User2Icon, UserIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";

export const RequesterCard = ({ requester }: { requester: PublicUser }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Requester</CardTitle>
        <CardDescription>
          The person requesting you to cover their ticket
        </CardDescription>
        <div className="flex gap-2">
          <Avatar className="h-16 w-16">
            <AvatarImage src={requester.imageUrl} />
            <AvatarFallback>
              <User2Icon />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1">
              <UserIcon className="h-4 w-4" />
              {requester.name}
            </div>
            <div className="flex items-center gap-1">
              <MailIcon className="h-4 w-4" />
              {requester.email}
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};
