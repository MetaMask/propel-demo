"use client";

import React, { useEffect, useRef } from "react";
import { type Event } from "@/lib/types";
import { api } from "@/trpc/react";
import { useAuth } from "@clerk/nextjs";
import { Textarea } from "@/components/ui/textarea";
import { debounce } from "lodash";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function EditableDescription({ event }: { event: Event }) {
  const router = useRouter();
  const { userId } = useAuth();
  const { toast } = useToast();
  const [description, setDescription] = React.useState(event.description);
  const { mutate: update } = api.event.update.useMutation({
    onSuccess: async () => {
      toast({
        title: "Description updated",
        description: "The proposal description has been successfully updated.",
      });
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  const isCreator = event.userId === userId;

  const debouncedUpdate = useRef(
    debounce((newDescription: string) => {
      update({ id: event.id, description: newDescription });
    }, 2000),
  ).current;

  useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, [debouncedUpdate]);

  const handleDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    debouncedUpdate(newDescription);
  };

  return (
    <>
      {isCreator ? (
        <Textarea
          value={description}
          onChange={handleDescriptionChange}
          className="min-h-[100px]"
        />
      ) : (
        <p>{description}</p>
      )}
    </>
  );
}
