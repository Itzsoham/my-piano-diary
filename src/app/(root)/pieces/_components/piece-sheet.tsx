"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Blossom, Squiggle } from "@/components/blossom/blossom";
import { PieceForm } from "./piece-form";

interface PieceSheetProps {
  children?: React.ReactNode;
  mode?: "create" | "edit";
  pieceId?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PieceSheet({
  mode = "create",
  pieceId,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: PieceSheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const onOpenChange = isControlled
    ? controlledOnOpenChange
    : setUncontrolledOpen;

  const title = mode === "create" ? "Add a new piece" : "Edit Piece";
  const description =
    mode === "create"
      ? "This will appear in your teaching repertoire and student assignments."
      : "Update piece details and difficulty level.";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <SheetTrigger asChild>{trigger}</SheetTrigger>
      ) : (
        mode === "create" &&
        !isControlled && (
          <SheetTrigger asChild>
            <Button className="bday-animate-button">
              <Plus className="mr-2 size-4" />
              Add Piece
            </Button>
          </SheetTrigger>
        )
      )}
      <SheetContent className="overflow-x-hidden overflow-y-auto rounded-l-3xl border-(--line-pink) sm:max-w-150">
        <SheetHeader className="border-b border-(--line-pink) bg-[linear-gradient(160deg,var(--pink-50),var(--surface)_78%)] px-6 pt-6 pb-5">
          <div className="inline-block">
            <SheetTitle className="text-ink flex items-center gap-2 font-serif text-xl leading-tight font-normal sm:text-2xl">
              <Blossom className="text-bubblegum" size={19} />
              {title}
            </SheetTitle>
            <Squiggle className="text-bubblegum mt-1 h-2 w-full" />
          </div>
          <SheetDescription className="text-ink-soft text-sm">{description}</SheetDescription>
        </SheetHeader>
        <div className="px-6 pt-6 pb-8">
          <PieceForm
            pieceId={pieceId}
            onSuccess={() => onOpenChange?.(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
