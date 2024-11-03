import { getBaseUrl, getProductionUrl } from "@/lib/url";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface ProposalCompletedTicketEmailProps {
  proposalTitle: string;
  eventId: string;
  eventDate: string;
}

export const TicketAvailableEmail = ({
  proposalTitle = "",
  eventDate = "",
  eventId = "",
}: ProposalCompletedTicketEmailProps) => {
  const baseUrl = getBaseUrl();
  const prodUrl = getProductionUrl();
  const ticketLink = `${baseUrl}/event/${eventId}?source=ticket-available-email`;

  return (
    <Html>
      <Head />
      <Preview>Your ticket for {proposalTitle} is now available!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${prodUrl}/logo.jpg`}
            width="150"
            height="150"
            alt="Propel"
            style={{ margin: "0 auto" }}
          />
          <Heading style={h1}>Your Ticket Is Ready</Heading>
          <Text style={text}>
            Great news! The Event &quot;{proposalTitle}&quot; that you pledged
            to support has been fully funded and is now complete. Your ticket
            for this exciting event is now available.
          </Text>
          <Section style={eventDetails}>
            <Text style={eventInfo}>
              <strong>Event:</strong> {proposalTitle}
              <br />
              <strong>Date:</strong> {eventDate}
            </Text>
          </Section>
          <Section style={buttonContainer}>
            <Button
              style={{
                ...button,
                paddingLeft: 20,
                paddingRight: 20,
                paddingTop: 12,
                paddingBottom: 12,
              }}
              href={ticketLink}
            >
              View Your Ticket
            </Button>
          </Section>
          <Text style={text}>
            Click the button above to view and download your ticket. Don&apos;t
            forget to save it or print it out for the event!
          </Text>
          <Text style={text}>
            Get ready for an amazing experience! We&apos;re thrilled that
            you&apos;ll be part of this community-driven event.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Propel - Turning Ideas into Memorable Experiences
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default TicketAvailableEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  width: "560px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
  textAlign: "center" as const,
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
};

const eventDetails = {
  margin: "30px 0",
  backgroundColor: "#f7f7f7",
  borderRadius: "5px",
  padding: "20px",
};

const eventInfo = {
  fontSize: "16px",
  lineHeight: "24px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  backgroundColor: "#5F51E8",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
};

const hr = {
  borderColor: "#cccccc",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  marginTop: "20px",
  textAlign: "center" as const,
};
