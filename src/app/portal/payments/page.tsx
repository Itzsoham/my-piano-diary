import { PortalPaymentsView } from "./_components/payments-view";

export const metadata = {
  title: "Tuition & Payment QR",
  description: "View tuition breakdown and scan teacher's bank QR code to pay.",
};

export default function PortalPaymentsPage() {
  return <PortalPaymentsView />;
}
