import { Wallet } from "@/components/wallet";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { UserMenu } from "@/components/user-menu";
import Logo from "@/components/logo";
import { Button } from "./ui/button";

export async function Navbar() {
  return (
    <>
      <header className="flex h-14 items-center justify-between border-b px-4 lg:px-6">
        <div className="flex items-center">
          <Logo showTour />
        </div>
        <div className="flex items-center gap-4">
          <SignedIn>
            <Wallet enableDaimo />
            <UserMenu />
          </SignedIn>
          <SignedOut>
            <SignInButton>
              <Button variant="outline">Sign in</Button>
            </SignInButton>
          </SignedOut>
        </div>
      </header>
    </>
  );
}
