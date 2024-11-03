import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Ticket {
  tokenId: string;
  proposalId: string;
  proposalName: string;
}

interface TicketListProps {
  tickets: Ticket[];
}

export function TicketList({ tickets }: TicketListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tickets.map((ticket) => (
        <Link
          href={`/proposal/${ticket.proposalId}/ticket`}
          key={ticket.tokenId}
          className="transition-transform hover:scale-105"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{ticket.proposalName}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Proposal ID: {ticket.proposalId.slice(0, 6)}...
                {ticket.proposalId.slice(-4)}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
