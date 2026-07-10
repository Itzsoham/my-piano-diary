"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { AppLoader } from "@/components/ui/app-loader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, type RouterOutputs } from "@/trpc/react";
import { FamilySheet } from "./family-sheet";

type Family = RouterOutputs["family"]["getAll"][number];
type StudentOption = { id: string; name: string; avatar: string | null };

interface FamiliesManagerProps {
  students: StudentOption[];
}

export function FamiliesManager({ students }: FamiliesManagerProps) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

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

  return (
    <div className="mt-8 rounded-2xl border border-pink-100 bg-white/80 p-4 shadow-sm md:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-pink-900">
            <Users className="size-5" />
            Families
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Group siblings or a parent + child to print one combined monthly
            report for them.
          </p>
        </div>
        <Button
          className="bday-animate-button"
          onClick={() => setSheet({ open: true, family: null })}
        >
          <Plus className="mr-2 size-4" />
          New family
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-24 items-center justify-center">
          <AppLoader size="sm" />
        </div>
      ) : families.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-pink-200 py-10 text-center">
          <div className="mb-2 text-3xl">👪</div>
          <div className="font-medium text-pink-700">No families yet</div>
          <div className="text-muted-foreground mt-1 text-sm">
            Create one to merge a couple of students onto a single report sheet.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {families.map((family) => (
            <div
              key={family.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-pink-100 bg-white p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold text-gray-900">
                    {family.name}
                  </span>
                  <Badge className="rounded-full bg-pink-100 px-2 py-0.5 text-xs text-pink-700 hover:bg-pink-100">
                    {family.members.length}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {family.members.slice(0, 5).map((member) => (
                      <Avatar
                        key={member.id}
                        className="size-6 border border-white"
                      >
                        <AvatarImage src={member.student.avatar ?? ""} />
                        <AvatarFallback className="bg-pink-50 text-[10px] font-bold text-pink-600">
                          {member.student.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-muted-foreground truncate text-xs">
                    {family.members.map((m) => m.student.name).join(", ")}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-pink-200 text-pink-600 hover:bg-pink-50"
                >
                  <Link href={reportLink(family.id)}>
                    <FileText className="mr-1.5 size-4" />
                    Report
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => setSheet({ open: true, family })}
                    >
                      <Pencil className="mr-2 size-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setDeleteTarget(family)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
}
