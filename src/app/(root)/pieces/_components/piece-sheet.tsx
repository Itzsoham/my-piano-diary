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

  const title = mode === "create" ? "Add a new piece 🎶" : "Edit Piece";
  const description =
    mode === "create"
      ? "This will appear in your teaching repertoire"
      : "Update piece details and information.";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {trigger ? (
        <SheetTrigger asChild>{trigger}</SheetTrigger>
      ) : (
        mode === "create" &&
        !isControlled && (
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Add Piece
            </Button>
          </SheetTrigger>
        )
      )}
      <SheetContent className="overflow-y-auto sm:max-w-150">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="m-6">
          <PieceForm
            pieceId={pieceId}
            onSuccess={() => onOpenChange?.(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
