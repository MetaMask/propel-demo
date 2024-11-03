import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User2Icon } from "lucide-react";

export function EventCardSkeleton() {
  return (
    <Card className="mx-auto w-full">
      <CardHeader className="pb-2">
        <CardTitle className="h-7 w-64 animate-pulse rounded-lg bg-gray-400 text-xl font-bold"></CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="flex items-center text-sm text-muted-foreground">
          <Avatar className="mr-1 h-4 w-4">
            <AvatarImage src={undefined} />
            <AvatarFallback>
              <User2Icon />
            </AvatarFallback>
          </Avatar>
          <div className="h-4 w-32 animate-pulse rounded-full bg-gray-400"></div>
        </div>
        <div className="flex gap-4 font-semibold">
          <div className="flex items-center text-sm text-muted-foreground">
            <div className="h-4 w-32 animate-pulse rounded-full bg-gray-400"></div>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <div className="h-4 w-32 animate-pulse rounded-full bg-gray-400"></div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start justify-between">
        <div className="h-10 w-full animate-pulse rounded-md bg-gray-400"></div>
      </CardFooter>
    </Card>
  );
}

export function EventListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:mb-0 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <EventCardSkeleton key={index} />
      ))}
    </div>
  );
}
