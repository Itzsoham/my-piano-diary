import { api } from "@/trpc/server";
import { PiecesTable } from "./_components/pieces-table";
import { PiecesHero } from "./_components/pieces-hero";

export default async function PiecesPage() {
  const pieces = await api.piece.getAll();

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-5 pb-6 md:gap-6 md:pb-10">
        <PiecesHero pieceCount={pieces.length} />
        <div className="px-4 lg:px-6">
          <PiecesTable data={pieces} />
        </div>
      </div>
    </div>
  );
}
