import { BirthdayRewardsPage } from "@/components/birthday/birthday-rewards-page";

export const metadata = {
  title: "Rewards",
  robots: { index: false, follow: false },
};

export default function BirthdayRewardsRoute() {
  return <BirthdayRewardsPage />;
}
