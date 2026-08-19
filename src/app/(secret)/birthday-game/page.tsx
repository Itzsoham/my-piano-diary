import { BirthdayGamePage } from "@/components/birthday/birthday-game-page";

export const metadata = {
  title: "A hidden door",
  robots: { index: false, follow: false },
};

export default function BirthdayGameRoute() {
  return <BirthdayGamePage />;
}
