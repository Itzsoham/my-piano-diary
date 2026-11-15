"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Loader2, Users, X } from "lucide-react";
import { toast } from "sonner";

import { Blossom, Squiggle } from "@/components/blossom/blossom";
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

  const title = isEdit ? "Edit Family" : "Add a New Family";
  const description =
    "Bundle siblings or a parent + child so their monthly attendance and tuition print on one combined sheet.";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-x-hidden overflow-y-auto rounded-l-3xl border-(--line-pink) sm:max-w-150">
        {/* Header band matching student-sheet design */}
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

        <div className="space-y-6 px-6 pt-6 pb-8">
          <div className="space-y-2">
            <Label htmlFor="family-name" className="text-sm font-medium text-pink-700">
              Family Name
            </Label>
            <Input
              id="family-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nguyen Family"
              maxLength={100}
              className="h-11 rounded-2xl border-(--line-pink) focus-visible:ring-pink-400"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-pink-700">Add Students</Label>
            <Select
              value=""
              onValueChange={addMember}
              disabled={availableStudents.length === 0}
            >
              <SelectTrigger className="h-11 w-full rounded-2xl border-(--line-pink) focus-visible:ring-pink-400">
                <SelectValue
                  placeholder={
                    availableStudents.length === 0
                      ? "All students added"
                      : "Pick a student to add…"
                  }
                />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-(--line-pink)">
                {availableStudents.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Members list card container */}
          <div className="space-y-4 rounded-2xl border border-(--line-pink) bg-pink-50/40 p-4 shadow-(--sh-sm) sm:space-y-5 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-sm font-medium text-pink-700">
                Family Members{" "}
                <span className="font-normal text-muted-foreground">
                  ({memberIds.length})
                </span>
              </Label>
              <span className="text-xs text-ink-soft">
                Order = row order on report
              </span>
            </div>

            {memberIds.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-(--line-pink) bg-card/60 p-5 text-center text-sm text-ink-soft">
                No students selected yet. Pick at least 2 students above.
              </p>
            ) : (
              <ul className="space-y-2">
                {memberIds.map((id, index) => {
                  const student = studentMap.get(id);
                  return (
                    <li
                      key={id}
                      className="bg-card flex items-center gap-3 rounded-2xl border border-(--line-pink) p-2.5 shadow-xs transition hover:border-pink-300"
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
                        className="text-ink-soft size-8 rounded-full hover:bg-pink-100 hover:text-pink-700"
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
                        className="text-ink-soft size-8 rounded-full hover:bg-pink-100 hover:text-pink-700"
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
                        className="size-8 rounded-full text-pink-600 hover:bg-pink-100 hover:text-pink-800"
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

          <div className="flex flex-col justify-end gap-2 pt-2 sm:flex-row sm:gap-3">
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-full sm:h-auto"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-11 rounded-full [background-image:var(--grad-pink)] px-6 font-semibold text-white shadow-(--sh-pink) transition hover:scale-[1.02] hover:shadow-lg hover:brightness-110 sm:h-auto"
              onClick={handleSave}
              disabled={!canSave || isPending}
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isPending
                ? "Saving..."
                : isEdit
                  ? "Save Changes"
                  : "Create Family"}
            </Button>
          </div>

          {/* Family Information block when editing */}
          {family && (
            <div className="space-y-4 rounded-2xl border border-(--line-strong) p-4 sm:p-5">
              <h4 className="text-ink font-serif text-base font-normal">
                Family Information
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-pink-100 text-pink-700"
                  >
                    <Users className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-ink-soft text-xs font-semibold">
                      Total Sibling Members
                    </div>
                    <div className="text-ink text-sm">
                      {family.members.length} students linked
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
