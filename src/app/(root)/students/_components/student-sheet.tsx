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
import { StudentForm } from "./student-form";

interface StudentSheetProps {
  children?: React.ReactNode;
  mode?: "create" | "edit";
  studentId?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function StudentSheet({
  mode = "create",
  studentId,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: StudentSheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const onOpenChange = isControlled
    ? controlledOnOpenChange
    : setUncontrolledOpen;

  const title = mode === "create" ? "Add a new student" : "Edit Student";
  const description =
    mode === "create"
      ? "This will add them to your teaching roster"
      : "Update student details and view their information.";

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
              Add Student
            </Button>
          </SheetTrigger>
        )
      )}
      <SheetContent className="overflow-x-hidden overflow-y-auto rounded-l-3xl border-(--line-pink) sm:max-w-150">
        {/* Header band: the only place on this Sheet that gets to bloom —
            everything below (the Form) stays ornament-free. */}
        <SheetHeader className="border-b border-(--line-pink) bg-[linear-gradient(160deg,var(--pink-50),var(--surface)_78%)] px-6 pt-6 pb-5">
          <div className="inline-block">
            <SheetTitle className="text-ink flex items-center gap-2 font-serif text-xl leading-tight font-normal sm:text-2xl">
              <Blossom className="text-bubblegum" size={19} />
              {title}
            </SheetTitle>
            <Squiggle className="text-bubblegum mt-1 h-2 w-full" />
          </div>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-8">
          <StudentForm
            studentId={studentId}
            onSuccess={() => onOpenChange?.(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
