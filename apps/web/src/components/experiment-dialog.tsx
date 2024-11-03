import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { ExperimentIcon } from "./icons";

export const ExperimentDialog = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const onContinue = () => {
    localStorage.setItem("experiment-accepted", "true");
    setOpen(false);
  };

  const onExit = () => {
    window.location.href = "https://metamask.io/";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-11/12 rounded-md" preventClose>
        <DialogHeader className="flex items-center gap-2">
          <ExperimentIcon />
          <DialogTitle className="leading-6">
            This is a limited-time experience built for Edge City Lanna
            attendees.
          </DialogTitle>
          <DialogDescription className="leading-6">
            Live from October 27 - Nov 7. With all experiments comes risk, such
            as bugs. Do you accept the risk?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2">
          <Button onClick={onContinue}>Yes, continue</Button>
          <Button variant="outline" onClick={onExit}>
            No, exit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
