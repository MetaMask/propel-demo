import { CreateEventButton } from "@/components/event/create";
import { EventList } from "@/components/event/list";
import { EventTabs } from "@/components/event/tabs";
import { EventDirectionToggle } from "@/components/event/sort";
import { searchParamsSchema } from "@/lib/validators";
import { TourDrawer } from "@/components/tour";
import { SignedIn } from "@clerk/nextjs";
import { Plus } from "lucide-react";

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function Page({ searchParams }: PageProps) {
  const sp = searchParamsSchema.parse(searchParams);
  return (
    <div className="flex flex-col gap-4 pb-20">
      <SignedIn>
        <div className="flex items-center justify-between">
          <EventTabs />
          <EventDirectionToggle />
        </div>
      </SignedIn>
      <EventList direction={sp.d} query={sp.q} />
      <CreateEventButton
        imageUpload
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 h-14 w-14 rounded-full bg-black text-white"
      >
        <Plus className="h-6 w-6" />
      </CreateEventButton>
      <TourDrawer />
    </div>
  );
}
