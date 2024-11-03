"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { DrawerClose } from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  DESCRIPTION_MAX_LENGTH,
  LOCATION_MAX_LENGTH,
  PROPOSAL_NAME_MAX_LENGTH,
} from "@/lib/constants";
import { type Event } from "@/lib/types";
import { api } from "@/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ToastAction } from "@radix-ui/react-toast";
import { MapPinIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import * as z from "zod";
import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/credenza";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadButton } from "@/components/uploadthing";

const formSchema = z.object({
  title: z
    .string()
    .min(10, {
      message: "Title must be at least 10 characters.",
    })
    .max(PROPOSAL_NAME_MAX_LENGTH, {
      message: "Name must be at most 50 characters.",
    }),
  description: z
    .string()
    .min(10, {
      message: "Description must be at least 10 characters.",
    })
    .max(DESCRIPTION_MAX_LENGTH, {
      message: `Description must be at most ${LOCATION_MAX_LENGTH} characters.`,
    }),

  imageUrl: z.union([z.literal(""), z.string().trim().url()]),
  location: z.string().max(LOCATION_MAX_LENGTH, {
    message: `Location must be at most ${LOCATION_MAX_LENGTH} characters.`,
  }),
});

export function EditEventDrawer({
  children,
  event,
  imageUpload,
}: {
  children?: React.ReactNode;
  event: Event;
  imageUpload: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { mutateAsync: updateEvent, isPending } =
    api.event.update.useMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: event.title,
      description: event.description,
      imageUrl: event.imageUrl ?? "",
      location: event.location ?? undefined,
    },
  });

  // Save data when the drawer/dialog is closed
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const updatedEvent = await updateEvent({
        id: event.id,
        ...values,
      });
      if (!updatedEvent) {
        throw new Error("Event not found");
      }
      router.refresh();
      toast({
        title: "Event updated successfully",
        description: "Your event has been updated.",
        action: (
          <Link href={`/event/${updatedEvent.id}`}>
            <ToastAction
              altText="Details"
              className={buttonVariants({ variant: "outline" })}
            >
              Details
            </ToastAction>
          </Link>
        ),
      });
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "There was an error updating your event.",
        variant: "destructive",
      });
    }
  };

  return (
    <Credenza onOpenChange={handleOpenChange} open={open}>
      <CredenzaTrigger asChild>{children}</CredenzaTrigger>
      <CredenzaContent>
        <CredenzaHeader className="text-left">
          <CredenzaTitle>Edit Event</CredenzaTitle>
          <CredenzaDescription>
            Update your event details to ensure it&apos;s accurate and engaging.
          </CredenzaDescription>
        </CredenzaHeader>
        <CredenzaBody>
          <EventFormFields
            form={form}
            onSubmit={onSubmit}
            isPending={isPending}
            imageUpload={imageUpload}
          />
        </CredenzaBody>
      </CredenzaContent>
    </Credenza>
  );
}

export function EventFormFields({
  form,
  onSubmit,
  isPending,
  imageUpload,
}: {
  form: UseFormReturn<z.infer<typeof formSchema>>;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  isPending: boolean;
  imageUpload: boolean;
}) {
  const { toast } = useToast();
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <Card>
          <CardHeader>
            <CardTitle>Name</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="For example, Moonlight Mixer"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-6 w-6" />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormControl>
                        <Input placeholder="Secret headquarters" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a brief event overview, include contact info, fundraising goals, and make it exciting to inspire people to join and crowdfund!"
                      className="h-32 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel className="flex justify-between">
                      <span>{imageUpload ? "Image" : "Image URL"}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        Optional
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        className={imageUpload ? "hidden" : ""}
                        placeholder="https://example.com/image.jpg"
                        {...field}
                      />
                    </FormControl>
                    {imageUpload && (
                      <UploadButton
                        endpoint="imageUploader"
                        onClientUploadComplete={(res) => {
                          form.setValue("imageUrl", res[0]?.appUrl ?? "");
                        }}
                        onUploadError={(error: Error) => {
                          form.setError("imageUrl", { message: error.message });
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description:
                              "There was an error uploading your image.",
                          });
                          console.log("Error uploading image:", error.message);
                        }}
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </CardContent>
        </Card>
        <div className="mb-4 flex flex-col gap-2">
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
          <DrawerClose asChild className="flex-1">
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </div>
      </form>
    </Form>
  );
}

export const EditEventButton = ({
  event,
  imageUpload,
}: {
  event: Event;
  imageUpload: boolean;
}) => {
  return (
    <EditEventDrawer event={event} imageUpload={imageUpload}>
      <Button variant="outline">Edit Event</Button>
    </EditEventDrawer>
  );
};
