import { api } from "@/trpc/server";
import { PaymentsHero } from "./_components/payments-hero";
import { PaymentsPageContent } from "./_components/payments-page";

export const metadata = {
  title: "Payments",
  description: "Track student payments and monthly dues",
};

export default async function PaymentsPage() {
  const students = await api.student.getAll();
  const now = new Date();

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-8 pb-6 md:gap-10 md:pb-10">
          <PaymentsHero />

          <div className="px-4 lg:px-6">
            <PaymentsPageContent
              students={students.map((student) => ({
                id: student.id,
                name: student.name,
                avatar: student.avatar,
              }))}
              defaultMonth={now.getMonth() + 1}
              defaultYear={now.getFullYear()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
