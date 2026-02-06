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

  const title = mode === "create" ? "Add a new student 🎹" : "Edit Student";
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
            <Button>
              <Plus className="mr-2 size-4" />
              Add Student
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
          <StudentForm
            studentId={studentId}
            onSuccess={() => onOpenChange?.(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
