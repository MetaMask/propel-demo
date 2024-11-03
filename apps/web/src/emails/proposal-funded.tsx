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

interface ProposalFundedEmailProps {
  proposalTitle: string;
  recipientName: string;
  eventId: string;
}

export const ProposalFundedEmail = ({
  proposalTitle = "Community Gardening Workshop",
  recipientName = "Jane",
  eventId = "",
}: ProposalFundedEmailProps) => {
  const baseUrl = getBaseUrl();
  const prodUrl = getProductionUrl();
  const proposalLink = `${baseUrl}/event/${eventId}?source=event-funded-email`;

  return (
    <Html>
      <Head />
      <Preview>Your Propel event has reached its funding goal!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${prodUrl}/logo.jpg`}
            width="150"
            height="150"
            alt="Propel"
            style={{ margin: "0 auto" }}
          />
          <Heading style={h1}>Congratulations, {recipientName}!</Heading>
          <Text style={text}>
            Great news! Your event &quot;{proposalTitle}&quot; has reached its
            funding goal. It&apos;s time to bring your idea to life!
          </Text>
          <Section style={buttonContainer}>
            <Button
              style={{
                ...button,
                padding: "12px 20px",
              }}
              href={proposalLink}
            >
              Conclude Your Event
            </Button>
          </Section>
          <Text style={text}>
            Click the button above to finalize the details and get ready for an
            amazing event.
          </Text>
          <Text style={text}>
            We&apos;re as excited to see your event come to life!
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
