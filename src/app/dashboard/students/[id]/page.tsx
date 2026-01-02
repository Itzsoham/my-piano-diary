import { StudentForm } from "../_components/student-form";

interface StudentPageProps {
  params: {
    id: string;
  };
}

export default function StudentPage({ params }: StudentPageProps) {
  return (
    <div className="container mx-auto py-6">
      <StudentForm studentId={params.id} />
    </div>
  );
}
