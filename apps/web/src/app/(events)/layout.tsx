import { Navbar } from "@/components/navbar";
import { DelegatorProvider } from "@/providers/delegator";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DelegatorProvider>
      <div className="flex flex-col">
        <Navbar />
        <main className="flex-grow p-4">{children}</main>
      </div>
    </DelegatorProvider>
  );
}
