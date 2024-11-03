"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TourDrawer } from "@/components/tour";
import { PropelIcon } from "@/components/icons";

type LogoProps = {
  showTour: boolean;
};

export default function Logo({ showTour }: LogoProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openTour, setOpenTour] = useState(false);

  const handleLogoClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (pathname === "/") {
      if (showTour) {
        e.preventDefault();
        setOpenTour(true);
      } else {
        router.refresh();
      }
    } else {
      router.push("/");
    }
  };

  const onTourClose = () => {
    setOpenTour(false);
  };

  return (
    <div className="flex items-center">
      <div
        className="flex cursor-pointer items-center justify-center"
        onClick={handleLogoClick}
      >
        <PropelIcon className="mr-2 h-6 w-6" />
        <span className="select-none font-bold">Propel</span>
      </div>
      {showTour && (
        <TourDrawer showTour={openTour} initialHide onClose={onTourClose} />
      )}
    </div>
  );
}
