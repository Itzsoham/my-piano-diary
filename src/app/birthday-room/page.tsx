import { BirthdayRoomPage } from "@/components/birthday/birthday-room-page";

export const metadata = {
  title: "A hidden room",
  robots: { index: false, follow: false },
};

export default function BirthdayRoomRoute() {
  return <BirthdayRoomPage />;
}
