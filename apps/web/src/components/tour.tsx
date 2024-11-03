"use client";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselDots,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ArrowLeft, ArrowRightIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  EditEventIcon,
  MetaMaskFoxIcon,
  MetaMaskNameIcon,
  PledgeIcon,
  TicketIcon,
} from "./icons";
import { ExperimentDialog } from "./experiment-dialog";

export function TourDrawer({
  showTour,
  initialHide,
  onClose,
}: {
  showTour?: boolean;
  initialHide?: boolean;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [count, setCount] = useState(0);
  const [current, setCurrent] = useState(0);
  const [showExperimentDialog, setShowExperimentDialog] = useState(false);

  const isFirstSlide = current < 2;

  useEffect(() => {
    setOpen(!!showTour);
  }, [showTour]);

  useEffect(() => {
    if (initialHide) return;
    const skipTour = localStorage.getItem("skip-tour") ?? false;
    const experimentIsNotAccepted =
      !!skipTour && !!!localStorage.getItem("experiment-accepted");
    setOpen(!skipTour);
    setShowExperimentDialog(experimentIsNotAccepted);
  }, [initialHide]);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const handleNext = useCallback(() => {
    if (!api) {
      return;
    }
    api?.scrollNext();
  }, [api]);

  const handlePrev = useCallback(() => {
    if (!api) {
      return;
    }
    api?.scrollPrev();
  }, [api]);

  const handleDone = useCallback(() => {
    localStorage.setItem("skip-tour", "true");
    setOpen(false);
    onClose?.();
    if (!!!localStorage.getItem("experiment-accepted")) {
      setShowExperimentDialog(true);
    }
  }, [onClose]);

  return (
    <>
      <Drawer open={open} onClose={onClose}>
        <DrawerContent>
          <DrawerHeader className="flex flex-row items-center justify-between pb-0">
            <Button
              onClick={handlePrev}
              disabled={isFirstSlide}
              variant="link"
              className={`px-0 ${isFirstSlide ? "text-background" : ""}`}
            >
              <ArrowLeft size={22} />
            </Button>
            <DrawerClose className="px-2 text-sm" onClick={handleDone}>
              SKIP
            </DrawerClose>
          </DrawerHeader>
          <DrawerTitle className="hidden">Welcome Tour</DrawerTitle>
          <DrawerDescription className="hidden">
            A tour of the Propel app
          </DrawerDescription>
          <Carousel setApi={setApi}>
            <CarouselContent>
              <CarouselItem>
                <Step1 />
              </CarouselItem>
              <CarouselItem>
                <Step2 />
              </CarouselItem>
              <CarouselItem>
                <Step3 />
              </CarouselItem>
              <CarouselItem>
                <Step4 />
              </CarouselItem>
              <CarouselItem>
                <Step5 />
              </CarouselItem>
            </CarouselContent>
            <CarouselDots />
          </Carousel>
          <DrawerFooter>
            {current === count ? (
              <Button onClick={handleDone}>Get started</Button>
            ) : (
              <Button onClick={handleNext}>
                Next <ArrowRightIcon size={16} />
              </Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      <ExperimentDialog
        open={showExperimentDialog}
        setOpen={setShowExperimentDialog}
      />
    </>
  );
}

const Step1 = () => {
  return (
    <div className="flex flex-col gap-2 p-4 pt-0">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-bold text-muted-foreground">
          An experiment built with
        </span>
        <div className="flex flex-row items-center gap-2">
          <MetaMaskFoxIcon className="h-10 w-10" />
          <MetaMaskNameIcon />
        </div>
        <span className="text-sm font-semibold">DELEGATION TOOLKIT</span>
      </div>

      <h3 className="mt-2 scroll-m-20 text-2xl font-semibold">
        Propel your events
      </h3>
      <p>
        Bring your community together—Propel makes planning and funding events
        simple. Whether you&apos;re hosting or supporting, it&apos;s all about
        collaboration.
      </p>
      <div className="flex flex-row items-center justify-center">{}</div>
    </div>
  );
};

const Step2 = () => {
  return (
    <div className="flex flex-col gap-2 p-4 pt-0">
      <EditEventIcon />
      <h3 className="mb-2 scroll-m-20 text-2xl font-semibold">
        Create your event
      </h3>
      <p>
        Got an idea for an excursion or workshop? Just add the event details,
        capacity, and the funding you need—anything is possible!
      </p>
      <div className="flex flex-row items-center justify-center">{}</div>
    </div>
  );
};

const Step3 = () => {
  return (
    <div className="flex flex-col gap-2 p-4 pt-0">
      <PledgeIcon />
      <h3 className="scroll-m-20 text-2xl font-semibold">Collect pledges</h3>
      <p>
        Get the backing you need. People pledge to join and fund your event,
        ensuring costs are covered.
      </p>
      <div className="flex flex-row items-center justify-center">{}</div>
    </div>
  );
};

const Step4 = () => {
  return (
    <div className="flex flex-col gap-2 p-4 pt-0">
      <PledgeIcon />
      <h3 className="scroll-m-20 text-2xl font-semibold">Make pledges</h3>
      <p>
        Support events by pledging funds. You only pay if the event happens and
        you get a ticket!
      </p>
      <div className="flex flex-row items-center justify-center">{}</div>
    </div>
  );
};

const Step5 = () => {
  return (
    <div className="flex flex-col gap-2 p-4 pt-0">
      <TicketIcon />
      <h3 className="scroll-m-20 text-2xl font-semibold">Make it happen</h3>
      <p>
        We’ll handle payments and ticket distribution, making community events
        effortless. Join this experiment to help shape the future of
        collaboration.
      </p>
      <div className="flex flex-row items-center justify-center">{}</div>
    </div>
  );
};
