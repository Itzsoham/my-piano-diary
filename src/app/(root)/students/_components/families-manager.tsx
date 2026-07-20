"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppLoader } from "@/components/ui/app-loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Blossom } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { useCurrency } from "@/lib/currency";
import { formatCurrency } from "@/lib/format";
import { api, type RouterOutputs } from "@/trpc/react";
import { FamilySheet } from "./family-sheet";

type Family = RouterOutputs["family"]["getAll"][number];
type StudentOption = { id: string; name: string; avatar: string | null };

interface FamiliesManagerProps {
  students: StudentOption[];
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

export function FamiliesManager({ students }: FamiliesManagerProps) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { currency } = useCurrency();
  const utils = api.useUtils();
  const { data: families = [], isLoading } = api.family.getAll.useQuery();

  const [sheet, setSheet] = React.useState<{
    open: boolean;
    family: Family | null;
  }>({ open: false, family: null });
  const [deleteTarget, setDeleteTarget] = React.useState<Family | null>(null);

  const deleteFamily = api.family.delete.useMutation({
    onSuccess: () => {
      toast.success("Family deleted", { id: "family-delete" });
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to delete family", {
        id: "family-delete",
      });
    },
    onSettled: () => {
      void utils.family.getAll.invalidate();
    },
  });

  const reportLink = (familyId: string) =>
    `/reports/family/${familyId}?month=${currentMonth}&year=${currentYear}`;

  const openCreate = () => setSheet({ open: true, family: null });

  return (
    <section className="border-border border-t pt-8 md:pt-10">
      {/* ── Section head — Blossom mark + serif title, mirrors the mockup's
          .sec-head convention (public/design-mockups/students.html). ──── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-ink flex items-center gap-2 font-serif text-xl leading-tight font-normal sm:text-2xl">
            <Blossom size={18} className="text-bubblegum" />
            Families
          </h2>
          <p className="text-ink-soft mt-1.5 max-w-md text-sm">
            Group siblings or a parent + child to print one combined monthly
            report for them.
          </p>
        </div>
        <Button
          className="bday-animate-button rounded-full"
          onClick={openCreate}
        >
          <Plus className="mr-2 size-4" />
          New family
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="border-border flex h-32 items-center justify-center rounded-[calc(var(--radius)+8px)] border border-dashed">
            <AppLoader size="sm" text="Gathering families..." />
          </div>
        ) : families.length === 0 ? (
          <div className="border-bubblegum/60 bg-card/60 flex flex-col items-center gap-3 rounded-[calc(var(--radius)+8px)] border-2 border-dashed px-6 py-10 text-center">
            <Mochi mood="sleepy" size={116} />
            <div>
              <p className="text-ink font-serif text-lg">No families yet</p>
              <p className="text-ink-soft mt-1 max-w-sm text-sm">
                Bundle a couple of siblings — or a parent and child — onto one
                combined tuition sheet.
              </p>
            </div>
            <Button className="mt-1 rounded-full" onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              New family
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {families.map((family, i) => (
              <Card
                key={family.id}
                style={{ "--i": i } as React.CSSProperties}
                className="rise relative flex flex-col overflow-hidden rounded-[calc(var(--radius)+8px)] border-pink-200/70 p-5 shadow-(--sh)"
              >
                {/* Corner blossom — this card's single family ornament. */}
                <Blossom
                  size={54}
                  className="text-bubblegum pointer-events-none absolute -top-2.5 -right-2.5 z-0 opacity-45"
                />

                <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h3 className="text-ink min-w-0 truncate font-serif text-lg">
                      {family.name}
                    </h3>
                    <Badge className="rounded-full border-transparent bg-pink-100 text-[11px] font-bold text-pink-700 tabular-nums hover:bg-pink-100">
                      {family.members.length}
                    </Badge>
                    <div className="ml-auto flex shrink-0 -space-x-2.5">
                      {family.members.slice(0, 5).map((member) => (
                        <Avatar
                          key={member.id}
                          className="border-card size-7 border-2"
                        >
                          <AvatarImage src={member.student.avatar ?? ""} />
                          <AvatarFallback className="bg-pink-100 text-[10px] font-bold text-pink-700">
                            {getInitials(member.student.name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>

                  <p className="text-ink-soft text-xs">
                    Order = row order on the sheet
                  </p>

                  {/* Sober member list — STT, avatar, name, rate. No drag
                      affordance here: live reordering only exists in the edit
                      sheet (arrow buttons), so this list stays read-only. */}
                  <ol className="flex flex-col gap-1.5">
                    {family.members.map((member, index) => (
                      <li
                        key={member.id}
                        className="bg-background flex items-center gap-2.5 rounded-xl px-2.5 py-1.5"
                      >
                        <span className="text-ink-soft w-5 shrink-0 text-center text-[11px] font-bold tabular-nums">
                          {index + 1}
                        </span>
                        <Avatar className="size-7 shrink-0">
                          <AvatarImage src={member.student.avatar ?? ""} />
                          <AvatarFallback className="bg-pink-100 text-[10px] font-bold text-pink-700">
                            {getInitials(member.student.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-ink min-w-0 flex-1 truncate text-sm font-medium">
                          {member.student.name}
                        </span>
                        <div className="flex shrink-0 flex-col items-end leading-tight whitespace-nowrap">
                          <span className="text-ink text-xs font-semibold tabular-nums">
                            {formatCurrency(
                              member.student.lessonRate,
                              currency,
                            )}
                          </span>
                          <span className="text-ink-soft text-[10px] tabular-nums">
                            {formatCurrency(
                              member.student.onlineLessonRate,
                              currency,
                            )}{" "}
                            online
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>

                  <div className="border-border flex items-center gap-2 border-t pt-3">
                    <Button
                      asChild
                      size="sm"
                      className="text-mint-ink flex-1 justify-center rounded-full border-0 font-semibold shadow-(--sh-mint) hover:brightness-105"
                      style={{ background: "var(--grad-mint)" }}
                    >
                      <Link href={reportLink(family.id)}>
                        <FileText className="mr-1.5 size-4" />
                        Open report
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-pink-200 text-pink-700 hover:bg-pink-50"
                      onClick={() => setSheet({ open: true, family })}
                    >
                      <Pencil className="mr-1.5 size-4" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-ink-soft hover:bg-no-bg hover:text-no-fg size-8 shrink-0 rounded-full"
                      aria-label={`Delete ${family.name}`}
                      onClick={() => setDeleteTarget(family)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {/* Dashed "add" tile — the Sugar Bloom affordance for "make
                something new", mirrored from the mockup's .add-tile. */}
            <button
              type="button"
              onClick={openCreate}
              className="border-bubblegum/60 bg-card/50 flex min-h-56 flex-col items-center justify-center gap-2.5 rounded-[calc(var(--radius)+8px)] border-2 border-dashed p-6 text-center transition hover:-translate-y-0.5 hover:bg-pink-50"
            >
              <span className="grid size-12 place-items-center rounded-full bg-pink-100 text-pink-700">
                <Plus className="size-6" />
              </span>
              <span className="text-ink text-sm font-bold">New family</span>
              <span className="text-ink-soft max-w-[22ch] text-xs">
                Bundle 2+ students onto one combined sheet.
              </span>
            </button>
          </div>
        )}
      </div>

      <FamilySheet
        students={students}
        family={sheet.family}
        open={sheet.open}
        onOpenChange={(open) =>
          setSheet((prev) => ({ open, family: open ? prev.family : null }))
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete family"
        description={`Delete "${deleteTarget?.name}"? This only removes the grouping — the students and their individual reports are untouched.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteFamily.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteFamily.mutate({ id: deleteTarget.id });
        }}
      />
    </section>
  );
}
