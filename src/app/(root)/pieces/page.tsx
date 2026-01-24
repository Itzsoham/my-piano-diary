import { api } from "@/trpc/server";
import { PiecesTable } from "./_components/pieces-table";

export default async function PiecesPage() {
  const pieces = await api.piece.getAll();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Pieces</h1>
        <p className="text-muted-foreground mt-2">
          Manage your music pieces and repertoire
        </p>
      </div>
      <PiecesTable data={pieces} />
    </div>
  );
}
