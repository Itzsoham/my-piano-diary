"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Blossom } from "@/components/blossom/blossom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { api, type RouterOutputs } from "@/trpc/react";

type Family = RouterOutputs["family"]["getAll"][number];
type StudentOption = { id: string; name: string; avatar: string | null };

interface FamilySheetProps {
  students: StudentOption[];
  /** Existing family to edit, or null/undefined to create a new one. */
  family?: Family | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Vietnamese names carry the family name first, so "Nguyễn Minh Anh" reads as
// "MA" (the given name) rather than "NM". This matters more here than
// anywhere else in the app: a family groups siblings who usually SHARE a
// surname, so leading with the first name keeps them visually distinct
// instead of every avatar in the stack starting with the same letter.
const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

export function FamilySheet({
  students,
  family,
  open,
  onOpenChange,
}: FamilySheetProps) {
  const isEdit = Boolean(family);
  const [name, setName] = React.useState("");
  const [memberIds, setMemberIds] = React.useState<string[]>([]);

  // Hydrate the form at render time (the codebase's "adjust state during render"
  // pattern) rather than in an effect: seed the fields when the sheet opens for
  // a family, and clear the marker on close so reopening starts fresh instead of
  // keeping stale edits.
  const targetKey = family?.id ?? "new";
  const [hydratedKey, setHydratedKey] = React.useState<string | null>(null);

  if (open && hydratedKey !== targetKey) {
    setHydratedKey(targetKey);
    setName(family?.name ?? "");
    setMemberIds(family?.members.map((m) => m.student.id) ?? []);
  } else if (!open && hydratedKey !== null) {
    setHydratedKey(null);
  }

  const utils = api.useUtils();
  const onSuccess = () => {
    void utils.family.getAll.invalidate();
    toast.success(isEdit ? "Family updated" : "Family created");
    onOpenChange(false);
  };
  const onError = (error: { message?: string }) => {
    toast.error(error.message ?? "Something went wrong");
  };

  const createFamily = api.family.create.useMutation({ onSuccess, onError });
  const updateFamily = api.family.update.useMutation({ onSuccess, onError });
  const isPending = createFamily.isPending || updateFamily.isPending;

  const studentMap = React.useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students],
  );
  const availableStudents = students.filter((s) => !memberIds.includes(s.id));

  const addMember = (id: string) =>
    setMemberIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const removeMember = (id: string) =>
    setMemberIds((prev) => prev.filter((m) => m !== id));
  const move = (index: number, direction: -1 | 1) =>
    setMemberIds((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  const canSave = name.trim().length > 0 && memberIds.length >= 2;

  const handleSave = () => {
    if (!canSave) return;
    if (isEdit && family) {
      updateFamily.mutate({ id: family.id, name: name.trim(), memberIds });
    } else {
      createFamily.mutate({ name: name.trim(), memberIds });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col overflow-y-auto sm:max-w-125">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-ink flex items-center gap-2 font-serif text-xl font-semibold">
            <Blossom size={18} className="text-bubblegum" />
            {isEdit ? "Edit family" : "Create a family"}
          </SheetTitle>
          <SheetDescription>
            Bundle siblings or a parent + child so their monthly attendance and
            tuition print on one combined sheet.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="family-name">Family name</Label>
            <Input
              id="family-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nguyen family"
              maxLength={100}
              className="h-11 rounded-2xl focus-visible:ring-pink-400"
            />
          </div>

          <div className="space-y-2">
            <Label>Add students</Label>
            <Select
              value=""
              onValueChange={addMember}
              disabled={availableStudents.length === 0}
            >
              <SelectTrigger className="h-11 w-full rounded-2xl focus-visible:ring-pink-400">
                <SelectValue
                  placeholder={
                    availableStudents.length === 0
                      ? "All students added"
                      : "Pick a student to add…"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableStudents.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>
                Members{" "}
                <span className="text-muted-foreground font-normal">
                  ({memberIds.length})
                </span>
              </Label>
              <span className="text-ink-soft text-xs">
                Order = row order on the sheet
              </span>
            </div>

            {memberIds.length === 0 ? (
              <p className="text-ink-soft rounded-2xl border border-dashed border-pink-200 bg-pink-50/50 p-4 text-center text-sm">
                No students yet. Add at least 2 above.
              </p>
            ) : (
              <ul className="space-y-2">
                {memberIds.map((id, index) => {
                  const student = studentMap.get(id);
                  return (
                    <li
                      key={id}
                      className="bg-card flex items-center gap-2 rounded-2xl border border-pink-100 p-2 shadow-xs"
                    >
                      <span className="text-ink-soft w-5 shrink-0 text-center text-sm font-bold tabular-nums">
                        {index + 1}
                      </span>
                      <Avatar className="size-8 border border-pink-100">
                        <AvatarImage src={student?.avatar ?? ""} />
                        <AvatarFallback className="bg-pink-100 text-xs font-bold text-pink-700">
                          {getInitials(student?.name ?? "?")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-ink flex-1 truncate text-sm font-medium">
                        {student?.name ?? "Unknown student"}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-ink-soft size-8 rounded-full hover:bg-pink-50 hover:text-pink-700"
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        aria-label="Move up"
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-ink-soft size-8 rounded-full hover:bg-pink-50 hover:text-pink-700"
                        onClick={() => move(index, 1)}
                        disabled={index === memberIds.length - 1}
                        aria-label="Move down"
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="hover:bg-no-bg hover:text-no-fg size-8 rounded-full text-pink-700"
                        onClick={() => removeMember(id)}
                        aria-label="Remove"
                      >
                        <X className="size-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t p-4">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="rounded-full"
            onClick={handleSave}
            disabled={!canSave || isPending}
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create family"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
