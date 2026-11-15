"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Blossom } from "@/components/blossom/blossom";
import { Mochi } from "@/components/blossom/mochi";
import { AppLoader } from "@/components/ui/app-loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api, type RouterOutputs } from "@/trpc/react";
import { ParentsAccountSheet } from "./parents-account-sheet";

type ParentItem = RouterOutputs["parent"]["list"][number];
type StudentOption = { id: string; name: string; avatar: string | null };

interface ParentsManagerProps {
  students: StudentOption[];
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

function maskEmail(email: string | null | undefined): string {
  if (!email) return "—";
  const [local, domain] = email.split("@");
  if (!domain || !local) return email;
  if (local.length <= 2) return `${local[0]}••••@${domain}`;
  return `${local[0]}••••${local.slice(-1)}@${domain}`;
}

export function ParentsManager({ students }: ParentsManagerProps) {
  const utils = api.useUtils();
  const { data: parents = [], isLoading } = api.parent.list.useQuery();

  const [sheet, setSheet] = React.useState<{
    open: boolean;
    parent: ParentItem | null;
  }>({ open: false, parent: null });

  const [deleteTarget, setDeleteTarget] = React.useState<ParentItem | null>(null);

  const deleteParent = api.parent.delete.useMutation({
    onSuccess: () => {
      toast.success("Parent account deleted");
      setDeleteTarget(null);
      void utils.parent.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to delete parent account");
    },
  });

  const openCreate = () => setSheet({ open: true, parent: null });

  return (
    <section className="border-border border-t pt-8 md:pt-10">
      {/* Section Head — Blossom mark + serif title */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-ink flex items-center gap-2 font-serif text-xl leading-tight font-normal sm:text-2xl">
            <Blossom size={18} className="text-bubblegum" />
            Parents &amp; Portals
          </h2>
          <p className="text-ink-soft mt-1.5 max-w-md text-sm">
            Create logins for parents so they can check their children&apos;s
            attendance, practice videos, and scan your payment QR.
          </p>
        </div>
        <Button
          className="bday-animate-button rounded-full"
          onClick={openCreate}
        >
          <Plus className="mr-2 size-4" />
          New parent account
        </Button>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="border-border flex h-32 items-center justify-center rounded-[calc(var(--radius)+8px)] border border-dashed">
            <AppLoader size="sm" text="Gathering parent accounts..." />
          </div>
        ) : parents.length === 0 ? (
          <div className="border-bubblegum/60 bg-card/60 flex flex-col items-center gap-3 rounded-[calc(var(--radius)+8px)] border-2 border-dashed px-6 py-10 text-center">
            <Mochi mood="content" size={116} />
            <div>
              <p className="text-ink font-serif text-lg">No parent accounts yet</p>
              <p className="text-ink-soft mt-1 max-w-sm text-sm">
                Add parent logins to give families their private portal with
                attendance records, practice feedback, and direct payment.
              </p>
            </div>
            <Button className="mt-1 rounded-full" onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              New parent account
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {parents.map((parent, i) => (
              <Card
                key={parent.id}
                style={{ "--i": i } as React.CSSProperties}
                className="rise relative flex flex-col overflow-hidden rounded-[calc(var(--radius)+8px)] border-pink-200/70 p-5 shadow-(--sh) bg-card"
              >
                <Blossom
                  size={54}
                  className="pointer-events-none absolute -top-2.5 -right-2.5 z-0 text-bubblegum opacity-35"
                />

                <div className="relative z-10 flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h3 className="text-ink min-w-0 truncate font-serif text-lg">
                      {parent.name ?? "Parent Account"}
                    </h3>
                    <Badge className="rounded-full border-transparent bg-pink-100 text-[11px] font-bold text-pink-700 tabular-nums hover:bg-pink-100">
                      {parent.students.length} {parent.students.length === 1 ? "child" : "children"}
                    </Badge>

                    <div className="ml-auto flex shrink-0 -space-x-2.5">
                      {parent.students.slice(0, 4).map((student) => (
                        <Avatar
                          key={student.id}
                          className="border-card size-7 border-2"
                        >
                          <AvatarImage src={student.avatar ?? ""} />
                          <AvatarFallback className="bg-pink-100 text-[10px] font-bold text-pink-700">
                            {getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>

                  <p className="text-ink-soft text-xs font-mono">
                    {maskEmail(parent.email)}
                  </p>

                  {/* Linked children list */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
                      Children
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {parent.students.map((student) => (
                        <span
                          key={student.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 border border-pink-100 px-2.5 py-1 text-xs text-ink"
                        >
                          <Avatar className="size-4.5">
                            <AvatarImage src={student.avatar ?? ""} />
                            <AvatarFallback className="bg-pink-100 text-[8px] font-bold text-pink-700">
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          {student.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="border-border flex items-center justify-between border-t pt-3 mt-auto">
                    <span className="text-[11px] text-ink-soft">
                      Created {new Date(parent.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-pink-200 text-pink-700 hover:bg-pink-50 h-8 text-xs"
                        onClick={() => setSheet({ open: true, parent })}
                      >
                        <Pencil className="mr-1.5 size-3.5" />
                        Edit / Reset
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-ink-soft hover:bg-no-bg hover:text-no-fg size-8 shrink-0 rounded-full"
                        aria-label={`Delete ${parent.name}`}
                        onClick={() => setDeleteTarget(parent)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {/* Dashed Add Tile */}
            <button
              type="button"
              onClick={openCreate}
              className="border-bubblegum/60 bg-card/50 flex min-h-48 flex-col items-center justify-center gap-2.5 rounded-[calc(var(--radius)+8px)] border-2 border-dashed p-6 text-center transition hover:-translate-y-0.5 hover:bg-pink-50 cursor-pointer"
            >
              <span className="grid size-12 place-items-center rounded-full bg-pink-100 text-pink-700">
                <Plus className="size-6" />
              </span>
              <span className="text-ink text-sm font-bold">New parent</span>
              <span className="text-ink-soft max-w-[22ch] text-xs">
                Create a login for a family to access the portal.
              </span>
            </button>
          </div>
        )}
      </div>

      <ParentsAccountSheet
        students={students}
        parent={sheet.parent}
        open={sheet.open}
        onOpenChange={(open) =>
          setSheet((prev) => ({ open, parent: open ? prev.parent : null }))
        }
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Parent Account"
        description={`Delete parent account for "${deleteTarget?.name}" (${deleteTarget?.email})? They will no longer be able to log in to the portal. Linked students and lessons are unaffected.`}
        confirmText="Delete Account"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteParent.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteParent.mutate({ parentId: deleteTarget.id });
        }}
      />
    </section>
  );
}
