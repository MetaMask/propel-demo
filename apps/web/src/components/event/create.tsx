"use client";

import {
  Credenza,
  CredenzaBody,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/credenza";
import { DateTimePicker } from "@/components/date-time-picker";
import {
  Button,
  type ButtonProps,
  buttonVariants,
} from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { UploadButton } from "@/components/uploadthing";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import {
  DEFAULT_MAX_TICKETS,
  DEFAULT_MIN_TICKETS,
  DESCRIPTION_MAX_LENGTH,
  LOCATION_MAX_LENGTH,
  PROPOSAL_NAME_MAX_LENGTH,
} from "@/lib/constants";
import { cn, getZonedUTC } from "@/lib/utils";
import { api } from "@/trpc/react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { ToastAction } from "@radix-ui/react-toast";
import { format, startOfDay } from "date-fns";
import { CalendarClockIcon, CalendarIcon, MapPinIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import * as z from "zod";

const formSchema = z
  .object({
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
    minTickets: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .default(DEFAULT_MIN_TICKETS),
    maxTickets: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .default(DEFAULT_MAX_TICKETS),
    happensAt: z.date({
      required_error: "Event date is required.",
    }),
    endsAt: z.date().optional(),
    imageUrl: z.union([z.literal(""), z.string().trim().url()]),
    pledgePrice: z.number().nonnegative({
      message: "Price must be non-negatirve.",
    }),
    location: z.string().max(LOCATION_MAX_LENGTH, {
      message: `Location must be at most ${LOCATION_MAX_LENGTH} characters.`,
    }),
  })
  .refine((data) => data.minTickets <= data.maxTickets, {
    message: "Min. tickets must be less than or equal to max. tickets",
    path: ["minTickets"],
  })
  .refine((data) => !!!data.endsAt || data.endsAt > data.happensAt, {
    message: "End date must be after start date",
    path: ["endsAt"],
  });

const DRAFT_STORAGE_KEY = "event_draft";

function saveDraft(values: Partial<z.infer<typeof formSchema>>) {
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(values));
}

function loadDraft(): Partial<z.infer<typeof formSchema>> | null {
  const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (draft) {
    const parsedDraft = JSON.parse(draft) as Partial<
      z.infer<typeof formSchema>
    >;
    // Convert date strings back to Date objects
    if (parsedDraft.happensAt)
      parsedDraft.happensAt = new Date(parsedDraft.happensAt);
    if (parsedDraft.endsAt) parsedDraft.endsAt = new Date(parsedDraft.endsAt);
    return parsedDraft;
  }
  return null;
}

function clearDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

type NewEventDrawerProps = {
  imageUpload: boolean;
  children?: React.ReactNode;
};

export function NewEventDrawer({ children, imageUpload }: NewEventDrawerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { mutateAsync: createEvent, isPending } =
    api.event.create.useMutation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      minTickets: DEFAULT_MIN_TICKETS,
      imageUrl: "",
      happensAt: undefined,
      pledgePrice: undefined,
    },
  });

  // Load saved data when the component mounts
  useEffect(() => {
    const savedData = loadDraft();
    if (savedData) {
      form.reset(savedData);
    }
  }, [form]);

  // Save data when the drawer/dialog is closed
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      const formData = form.getValues();
      saveDraft(formData);
    }
    setOpen(newOpen);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const event = await createEvent({
        ...values,
        happensAt: getZonedUTC(values.happensAt),
        expiresAt: getZonedUTC(values.happensAt),
      });
      if (!event) {
        throw new Error("Event not found");
      }
      router.refresh();
      setOpen(false);
      clearDraft(); // Clear the saved draft after successful submission
      form.reset({
        title: "",
        pledgePrice: 0,
        minTickets: DEFAULT_MIN_TICKETS,
        maxTickets: DEFAULT_MAX_TICKETS,
        happensAt: undefined,
        description: "",
        imageUrl: "",
        location: "", // Add this line
      });
      toast({
        title: "Event created successfully",
        description:
          "Your event has been created and is now live on the platform.",
        action: (
          <Link href={`/event/${event.id}`}>
            <ToastAction
              altText="Details"
              className={buttonVariants({ variant: "outline" })}
            >
              Details
            </ToastAction>
          </Link>
        ),
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "There was an error creating your event.",
        variant: "destructive",
      });
    }
  };

  return (
    <Credenza open={open} onOpenChange={handleOpenChange}>
      <CredenzaTrigger asChild>{children}</CredenzaTrigger>
      <CredenzaContent>
        <div className="max-h-[95dvh] overflow-y-auto sm:max-h-[80dvh]">
          <CredenzaHeader className="pb-4 text-left">
            <CredenzaTitle>Create an Event</CredenzaTitle>
            <CredenzaDescription>
              Bring your event idea to life with community support.
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
        </div>
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
  const imageUrl = form.watch("imageUrl");
  const happensAt = form.watch("happensAt");

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
                <CalendarIcon className="h-6 w-6" />
                <FormField
                  control={form.control}
                  name="happensAt"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "justify-start pl-3 font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP, HH:mm")
                              ) : (
                                <span>Event date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DateTimePicker
                            value={field.value}
                            onChange={field.onChange}
                            disabled={(date) => date < startOfDay(new Date())}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex items-center gap-2">
                <CalendarClockIcon className="h-6 w-6" />
                <FormField
                  control={form.control}
                  name="endsAt"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "justify-start pl-3 font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP, HH:mm")
                              ) : (
                                <span>Event end date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <DateTimePicker
                            value={field.value}
                            onChange={field.onChange}
                            disabled={(date) => date < startOfDay(happensAt)}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
              render={({ field }) => (
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
                      disabled={imageUrl.length > 0}
                      content={
                        imageUrl.length > 0
                          ? {
                              button() {
                                return "Uploaded";
                              },
                            }
                          : undefined
                      }
                      endpoint="imageUploader"
                      onClientUploadComplete={(res: { appUrl: string }[]) => {
                        form.setValue("imageUrl", res[0]?.appUrl ?? "");
                      }}
                      onUploadError={(error: Error) => {
                        form.setError("imageUrl", { message: error.message });
                        form.setValue("imageUrl", "");
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
              )}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Crowdfunding details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="mb-2 text-sm font-normal text-gray-500">
              Post the event to see how many will commit, helping with
              crowdfunding, coordination, and boosting turnout.
            </p>
            <FormField
              control={form.control}
              name="minTickets"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Minimum attendees needed</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pledgePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost per person (USDC)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="$0"
                      {...field}
                      onChange={(e) => {
                        field.onChange(
                          e.target.value === "" ? "" : Number(e.target.value),
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p className="mt-2 text-sm text-gray-500">
              Tip: Enter the estimated cost per person. Enter 0 for no upfront
              cost but to gauge interest.
            </p>
          </CardContent>
        </Card>
        <div className="mb-4 flex flex-col gap-2">
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? "Posting..." : "Post"}
          </Button>
          <DrawerClose asChild className="flex-1">
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </div>
      </form>
    </Form>
  );
}

interface CreateEventButtonProps extends ButtonProps {
  imageUpload: boolean;
}

export const CreateEventButton = React.forwardRef<
  HTMLButtonElement,
  CreateEventButtonProps
>(({ imageUpload, ...props }, ref) => {
  const clerk = useClerk();
  const { userId } = useAuth();
  const { data: wallet } = useWallet();

  return (
    <NewEventDrawer imageUpload={imageUpload}>
      <Button
        ref={ref}
        disabled={!wallet && !!userId}
        onClick={async (ev) => {
          if (!userId) {
            ev.preventDefault();
            await clerk.redirectToSignIn();
          }
        }}
        {...props}
      >
        {props.children}
      </Button>
    </NewEventDrawer>
  );
});
CreateEventButton.displayName = "CreateEventButton";
