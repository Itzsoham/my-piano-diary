import { api } from "@/trpc/server";
import { PaymentsPageContent } from "./_components/payments-page";

export const metadata = {
  title: "Payments",
  description: "Track student payments and monthly dues",
};

export default async function PaymentsPage() {
  const students = await api.student.getAll();
  const now = new Date();

  return (
    <div className="container mx-auto p-6">
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
  );
}
